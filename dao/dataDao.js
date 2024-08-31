const elasticsearchService = require('../services/elasticsearchService');

class DataDao {
  async getClusterInfo() {
    try {
      const client = elasticsearchService.getClient();
      const response = await client.info();
      return response.body;
    } catch (error) {
      throw new Error(`Failed to fetch cluster information: ${error.message}`);
    }
  }

  async getAllData() {
    try {
      const client = elasticsearchService.getClient();
      const scrollTimeout = '1m'; // Define scroll timeout
      const batchSize = 200; // Size of each batch
      let scrollId;
      let hasMoreData = true;
      const bulkSize = 200; // Number of documents in each bulk update
      let bulkUpdateBody = [];
      let updateResults = [];
      let documentCount = 0;
      let allUpdateResults = []; // Aggregate all update results
      let batchNumber = 0; // Counter for batches

      // Initialize the scroll search
      const initialSearchResponse = await client.search({
        index: 'data1', // Replace with your index name
        scroll: scrollTimeout,
        size: batchSize, // Define size of each scroll batch
        body: {
          query: {
            match_all: {},
          },
          _source: ['user-agent'],
        },
      });

      scrollId = initialSearchResponse._scroll_id;
      let hits = initialSearchResponse.hits.hits;

      while (hasMoreData) {
        batchNumber++; // Increment the batch number
        console.log(`Processing batch number: ${batchNumber}`);

        if (hits.length === 0) {
          hasMoreData = false;
          break;
        }

        // Process the current batch of documents
        hits.forEach(async hit => {
          const ipAddress = this.extractIpAddress(hit._source['user-agent']);
          bulkUpdateBody.push({
            update: {
              _index: 'data1',
              _id: hit._id,
            },
          });
          bulkUpdateBody.push({
            doc: {
              ip: ipAddress,
            },
          });

          // Collect update results for logging
          updateResults.push({
            _id: hit._id,
            ip: ipAddress,
          });
                 
          documentCount++;
          if (bulkUpdateBody.length >= bulkSize * 2) { // Each bulk request has two parts per document
            // Perform bulk update
            const bulkResponse = await client.bulk({ body: bulkUpdateBody });

            // Handle bulk response errors
            // const errors = bulkResponse.errors;
            // if (errors) {
            //   console.log('Bulk update errors occurred.');
            // }
   /*Since each document update in the bulk request requires two entries (one for the metadata and one for the data), the bulkUpdateBody array needs to hold twice 
   as many elements as the number of documents you want to update.
bulkSize * 2 ensures that when the array reaches this length, you have enough entries to update bulkSize documents.
For example:

If bulkSize is 500, then bulkUpdateBody.length >= bulkSize * 2 checks if there are 1000 entries in the array (which corresponds to 500 documents).
At this point, it's time to send the bulk request to Elasticsearch to update these 500 documents in one operation. */
            // Clear the bulk update body and update results for the next batch
            bulkUpdateBody = [];
            updateResults = [];
          }
        });

        // Retrieve the next batch of documents
        const scrollResponse = await client.scroll({
          scroll: scrollTimeout,
          scroll_id: scrollId,
        });

        scrollId = scrollResponse._scroll_id;
        hits = scrollResponse.hits.hits;
      }

      // Perform final bulk update if there are remaining documents
      if (bulkUpdateBody.length > 0) {
        const bulkResponse = await client.bulk({ body: bulkUpdateBody });
        const errors = bulkResponse.errors;
        if (errors) {
          throw new Error('Final bulk update errors occurred.');
        }
      }

      // Clear the scroll context
      await client.clearScroll({ scroll_id: scrollId });

      console.log(`Total documents processed: ${documentCount}`);
      
      return {
        message: 'Update completed successfully',
        totalDocumentsProcessed: documentCount,
        updateResults: allUpdateResults,
      };
    } catch (error) {
      throw new Error(`Failed to fetch and update data in Elasticsearch: ${error.message}`);
    }
  }

  extractIpAddress(userAgent) {
    if (userAgent) {
      const segments = userAgent.split(',');
      const ipSegment = segments.find(segment => segment.trim().startsWith('ipaddress:'));
      if (ipSegment) {
        return ipSegment.split('ipaddress:')[1].trim();
      }
    }
    return null;
  }
}

module.exports = new DataDao();
