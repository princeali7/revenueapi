const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');

var getResponse = require('getresponse-nodejs-api');

const app = express();
var querystring= require('querystring');
var config ={};
var cookieParser = require('cookie-parser');

// var crypto = require('crypto');

var knex = {};

 


// Parsers
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());

// API location
//app.use('/api', api);

app.get('/sendtogetresponse',(req,res)=>{

  var $apiKey = '20e316816c6e9457ee2c67ba59684e78';
  var $apiUrl = 'https://api2.getresponse.com';
  var $api = new getResponse($apiKey,$apiUrl);
  console.log('instance started')

  res.send('ok');
  if(req.query.name && req.query.email){
  $api.addContact('4h3tr', req.query.name,req.query.email, null, 1, {},function(r){console.log(r);});
}



});







//Set Port
const port = process.env.PORT || '3100';
app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => console.log(`Running on localhost:${port}`));