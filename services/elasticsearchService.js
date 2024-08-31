// services/elasticsearchService.js
const { Client } = require('@elastic/elasticsearch');

class ElasticsearchService {
  constructor() {
    this.client = new Client({
      node: 'http://localhost:9200', // Use HTTP
      auth: {
        username: 'elastic',
        password: 'CGXvZBZkojvrb4dOqjbv',
      },
    });
  }

  getClient() {
    return this.client;
  }
}

module.exports = new ElasticsearchService();
