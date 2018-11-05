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


app.listen(PORT, () => {
  console.log('listening on port ' + PORT);
});

app.post('/representatives', (request, response) =>{
  console.log(request.body);
  let userAddress = '';
  if(request.body.address){
    userAddress = request.body.address.split(' ').join('%20');
  }
  else{
    userAddress = request.body.zip.split(' ').join('%20');
  }
  getRepresentatives(userAddress);
});

function getRepresentatives(address) {
  console.log('in loadClient');
  let URL = `https://www.googleapis.com/civicinfo/v2/representatives?key=${process.env.GOOGLE_CIVIC_API_KEY}&address=${address}`
  console.log(URL);

  return superagent.get(URL)
    .then(results =>{
      let relevantOffices = filterRelevantOffices(results.body.offices);
      let relevantIndices = relevantOffices.reduce( (acc, nextOffice) =>{
        return acc.concat(nextOffice.officialIndices);
      }, [])
      let relevantPoliticians = [];
      relevantIndices.forEach( index =>{
        relevantPoliticians.push(results.body.officials[index]);
      });
      relevantPoliticians.forEach( person =>{
        console.log(person.channels);
      })
    })
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
