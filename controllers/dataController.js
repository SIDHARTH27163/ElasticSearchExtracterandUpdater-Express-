// controllers/dataController.js
const DataDao = require('../dao/dataDao');

class DataController {
  async getClusterInfo(req, res) {
    try {
      const clusterInfo = await DataDao.getClusterInfo();
      res.json({ clusterInfo });
    } catch (error) {
      console.error('Error fetching cluster information:', error.message);
      res.status(500).json({ error: 'Failed to fetch cluster information', details: error.message });
    }
  }

  async getAllData(req, res) {
    try {
      const userAgents = await DataDao.getAllData();
      // res.json(userAgents);
    } catch (error) {
      console.error('Error fetching data from Elasticsearch:', error.message);
      // res.status(500).json({ error: 'Failed to fetch data from Elasticsearch', details: error.message });
    }
  }

  
}

module.exports = new DataController();
