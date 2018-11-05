'use strict';

const express = require('express');
const cors = require('cors');
// const googleapis = require('googleapis');
const superagent = require('superagent');
// const pg = require('pg');

require('dotenv').config();
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

app.listen(PORT, () => {
  console.log('listening on port ' + PORT);
});

app.post('/representatives', (request, response) =>{
  console.log(request.body);
  let userAddress = '';
  if(request.body.address){
    userAddress = request.body.address.join('%20').split(' ').join('%20');
  }
  else{
    userAddress = request.body.zip.split(' ').join('%20');
  }
  console.log(userAddress);
  getRepresentatives(userAddress)
    .then (results => {
      //results.render('./representatives');
      response.render('./pages/representatives.ejs', {value: results});
      console.log(results);
    })

});

function getRepresentatives(address) {
  console.log('in loadClient');
  let URL = `https://www.googleapis.com/civicinfo/v2/representatives?key=${process.env.GOOGLE_CIVIC_API_KEY}&address=${address}`
  console.log(URL);

  return superagent.get(URL)
    .then(results =>{
      //console.log(results);
      let relevantOffices = filterRelevantOffices(results.body.offices);
      let relevantIndices = relevantOffices.reduce( (acc, nextOffice) =>{
        return acc.concat(nextOffice.officialIndices);
      }, [])
      let relevantPoliticians = [];
      relevantIndices.forEach( index =>{
        relevantPoliticians.push(results.body.officials[index]);
      });
      // console.log(relevantPoliticians);
      const reps = relevantPoliticians.map( person =>{
        const rep = new Representative(person);
        return rep;
      });
      return reps;
      //console.log(reps);
    })
}

function Representative(data){
  console.log('Creating new Representative');
  this.name = data.name;
  if(data.photoUrl){
    this.img_url = data.photoUrl;
  }
  else{
    this.img_url = './img/placeholder.png'
  }
  this.political_affiliation = data.party;
  this.phone = data.phones[0];
  if(data.phones && data.phones[0]){
    this.phone = data.phones[0];
  }
  else{
    this.phone = 'No available phone number';
  }
  if(data.emails && data.emails[0]){
    this.email = data.emails[0];
  }
  else{
    this.email = 'No email found.';
  }
  if(data.urls && data.urls[0]){
    this.website_url = data.urls[0];
  }
  else{
    this.website_url = 'No website URL found.';
  }
  console.log('Done creating new Representative');
}

function filterRelevantOffices(officeArray){
  return officeArray.filter( office =>{
    return (/country/.test(office.levels) || /administrativeArea1/.test(office.levels)) && (/legislatorUpperBody/.test(office.roles) || /legislatorLowerBody/.test(office.roles));
  });
}

/*------SAMPLE CODE SNIPPET FROM GOOGLE CIVIC API----------*/
/**
   * Sample JavaScript code for civicinfo.representatives.representativeInfoByAddress
   * See instructions for running APIs Explorer code samples locally:
   * https://developers.google.com/explorer-help/guides/code_samples#javascript
**/

//   function loadClient() {
//     gapi.client.setApiKey(YOUR_API_KEY);
//     return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/civicinfo/v2/rest")
//         .then(function() { console.log("GAPI client loaded for API"); },
//               function(err) { console.error("Error loading GAPI client for API", err); });
//   }
//   // Make sure the client is loaded before calling this method.
//   function execute() {
//     return gapi.client.civicinfo.representatives.representativeInfoByAddress({
//       "address": "98109",
//       "includeOffices": true,
//       "levels": [
//         "country",
//         "administrativeArea1"
//       ],
//       "roles": [
//         "legislatorUpperBody",
//         "legislatorLowerBody"
//       ],
//       "prettyPrint": true
//     })
//         .then(function(response) {
//                 // Handle the results here (response.result has the parsed body).
//                 console.log("Response", response);
//               },
//               function(err) { console.error("Execute error", err); });
//   }
//   gapi.load("client");
// <button onclick="loadClient()">load</button>
// <button onclick="execute()">execute</button>
/*------------END SNIPPET----------------*/
