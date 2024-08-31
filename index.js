// index.js
const express = require('express');
const DataController = require('./controllers/dataController');

const app = express();
const port = 3001;

// Define routes
app.get('/cluster-info', (req, res) => DataController.getClusterInfo(req, res));

DataController.getAllData()

// Start server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
