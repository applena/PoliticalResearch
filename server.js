'use strict';

const async = require('async');
const getRepresentatives = require('./lib/getRepresentatives');
const express = require('express');
const cors = require('cors');
//const doSomething = require('./lib/doSomething');
const getPropublicaIds = require('./lib/getPropublicaIds');
const getAllRepsByState = require('./lib/getAllRepsByState');
const getFundingInformation = require('./lib/getFundingInformation');
const getVotingRecord = require('./lib/getVotingRecord');
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
      //returns formatted rep objects
      getRepresentatives(userAddress, userState)
        .then (results => {
          callback(null, results); // results[0] in parallel complete handler
        })
        .catch (error => {
          callback(error);
        })
    },

    function(callback) {
      //propublia senate api call
      //reutrns the data from propublica api - not formatted
      getPropublicaIds('senate', userState)
        .then (results => {
          callback(null, results); // results [1] in parallel complete handler
        })
        .catch (error => {
          callback(error);
        })
    },

    function(callback) {
      //open secrets state api call
      // returns all reps from userState - not formatted
      getAllRepsByState(userState)
        .then (results => {
          callback(null, results); // results [2] in parallel complete handler
        })
        .catch (error => {
          console.log(error);
          callback(error);
        })
    }
  ],

  //assemble all the data from the three apis
  function(error, results) { // parallel complete handler
    if(error){
      console.error(error);
      return response.render('./pages/error.ejs');
    }
    let repsList = results[0].reps;
    let federalNumber = results[0].districtPair.federalNumber;//federal house
    let propublicaList = results[1];
    let opensecretsList = results[2];

    repsList.forEach(rep => {
      if((/federal/i).test(rep.role)){
        console.log('🏳‍🌈 GETTING INTO THE PROPUBLIA LOGIC');

        //call propublica api to get federal house reps
        getPropublicaIds('house', userState, federalNumber)
          .then (results => {
            propublicaList = propublicaList.concat(results[0]);
            //console.log('PROPUBLICA LIST BEFORE GOING THROUGH MAP ', propublicaList);

            //puts the propublica national rep id into the rep data object
            repsList.map(rep => {
              let propublicaRep = propublicaList.find(value => {
                return value.name === rep.name
              })
              if(!propublicaRep){
                console.error(rep.name, 'no propublica record');
              }
              rep.propublica_id = propublicaRep.id;
            //console.log('this is the rep propublica id ', rep.propublica_id);
            })
          })
          .catch (console.log(error));
      }
    })

    console.log('LOOKING FOR PROPUBLIA ID ON THIS LIST ', repsList);
    //combine all opensecrets data
    //puts the open secrets rep id into the rep data object
    repsList.map(rep => {
      let opensecretRep = opensecretsList.find(value => {
        return value['@attributes'].firstlast === rep.name;
      })
      if(!opensecretRep){console.error('rep not found in opensecrets', rep.name)} else {
        rep.opensecrets_id = opensecretRep['@attributes'].cid;
        console.log('this is the open secrets id ', rep.opensecrets_id);
      }
    })
    console.log('LOOKING FOR OPEN SECRETES ID ON THIS LIST ', repsList);
  
    //renders the representatives page
    response.render('./pages/representatives.ejs', {
      value: {
        reps: repsList,
        district: results[0].districtPair
      }
    })
  })
});

app.get('/loadrep/:id', (request,response) => {
  console.log('hitting loadrep');
  chosenID = request.params.id;

  async.parallel([
    function(callback) {
      console.log('hitting get Funding Info');
      getFundingInformation(chosenID)
        .then (results => {
          callback(null, results); // results[0] in parallel complete handler
        })
        .catch (error => {
          callback(error);
        })
    },

    function(callback) {
      console.log('hitting get voting Info');
      getVotingRecord(chosenID)
        .then (results => {
          callback(null, results); // results[0] in parallel complete handler
        })
        .catch (error => {
          callback(error);
        })
    },

    function(error, results) { // parallel complete handler
      console.log('the results from the parallel function ', results);
      response.render('pages/individualrep.ejs', {value:results});
    }
  ]);

})


// app.get('/data/:id', (request, response) => {
//   //console.log('hitting data')
//   doSomething(chosenID)
//     .then( stuff => {
//       //console.log('stuff from doSomething on /data/: ', stuff);
//       response.json(stuff);
//     });
// })

app.get('/about', (request, response) =>{
  response.render('./pages/about.ejs');
})

app.listen(PORT, () => {
  console.log('listening on port ' + PORT);
});
