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
  console.log(process.env.apikey);
  var $apiKey = process.env.apikey || '20e316816c6e9457ee2c67ba59684e78';
  var $apiUrl = 'https://api2.getresponse.com';
  var $api = new getResponse($apiKey,$apiUrl);
  console.log('instance started')

  res.send('ok');
  if(req.query.name && req.query.email){
      console.log(req.query);
  $api.addContact('4h3tr', req.query.name,req.query.email, null, 1, {phone:req.query.phone},function(r){console.log(r);});
}



});



app.get('/sendtogetresponseinstall',(req,res)=>{
  console.log(process.env.apikey);
  var $apiKey = process.env.apikey || '20e316816c6e9457ee2c67ba59684e78';
  var $apiUrl = 'https://api2.getresponse.com';
  var $api = new getResponse($apiKey,$apiUrl);
  console.log('insatelled hook instance started')

  res.send('ok');
  if(req.query.name && req.query.email){
      console.log(req.query);
  $api.addContact('407er', req.query.name,req.query.email, null, 1, {phone:req.query.phone},function(r){console.log(r);});
}



});







//Set Port
const port = process.env.PORT || '3100';
app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => console.log(`Running on localhost:${port}`));
