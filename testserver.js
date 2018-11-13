'use strict';

const async = require('async');
const getRepresentatives = require('./lib/getRepresentatives');
const express = require('express');
const cors = require('cors');
const doSomething = require('./lib/doSomething');
require('dotenv').config();
let chosenID;

const app = express();

app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));

const PORT = process.env.PORT || 3001;

app.set('view engine', 'ejs');

app.get('/', (request, response) => {
  response.render('../views/index.ejs');
});

app.get('/checkvoter', (request, response)=> {
  response.render('./pages/checkvoter.ejs');
});

app.post('/representatives', (request, response) =>{

  let userAddress = request.body.street +' '+ request.body.city;
  let userState = request.body.state;

  async.parallel([
    function(callback) {
      //google civic api call
    },

    function(callback) {
      //propublia senate api call
    },

    function(callback) {
      //open secrets state api call
    }
  ],

  //assemble all the data from the three apis
  function(error, results) {
    if(error){
      console.error(error);
      return response.render('./pages/error.ejs');
    }

    //combine all google civic data
    //combine all propublia data
    //combine all opensecrets data

    response.render('./pages/representatives.ejs', {
      value: {
        reps: results.reps,
        district: results.districtPair
      }
    });

  });

  return getRepresentatives(userAddress, userState)
    .then (results => {
      //console.log('this is the repsults.reps from google civic ', results.reps);
      //results is the array of rep objects and the district
      response.render('./pages/representatives.ejs', {
        value: {
          reps: results.reps,
          district: results.districtPair
        }
      });
    })
    .catch (error => {console.error(error)});
});

app.get('/loadrep/:id', (request,response) => {
  console.log('hitting loadrep');
  chosenID = request.params.id;
  doSomething(chosenID)
    .then( stuff => {
      //console.log('stuff from doSomething on /loadrep/: ', stuff);
      response.render('pages/individualrep.ejs', {value:stuff});
    })
});

app.get('/data/:id', (request, response) => {
  //console.log('hitting data')
  doSomething(chosenID)
    .then( stuff => {
      //console.log('stuff from doSomething on /data/: ', stuff);
      response.json(stuff);
    });
})

app.get('/about', (request, response) =>{
  response.render('./pages/about.ejs');
})

app.listen(PORT, () => {
  console.log('listening on port ' + PORT);
});
