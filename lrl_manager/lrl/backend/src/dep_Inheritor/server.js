const express = require('express')
const app = express();
const port = 80;

app.post('/asset/piece', (req, res) => {

});

app.post('/asset/state', (req, res) => {

});

app.post('/shamir', (req, res) => {

});

app.post('/testament', (req, res) => {

});

app.listen(port, () => {
  console.log(`Inheritor listening on port ${port}`);
})