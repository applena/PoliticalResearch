'use strict';

const express = require('express');
const cors = require('cors');
// const googleapis = require('googleapis');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();

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


// app.get('/loadrep/:id', (request, response) => {
//   let {id} = request.params; //params is an object in the request object that stores anything in the url that is followed by a : as a key (in this case, let {id} = request.params is the same as just using request.params.id)
//   let SQL = `SELECT * FROM reps WHERE id=${id}`; // need to verify the correct table
//   client.query(SQL, (error, result) =>{
//     if(!error){
//       let representative = result.rows[0];
//       response.render('/pages/individualrep.ejs', {value: representative});
//     } else{
//       response.redirect('./pages/error.ejs');
//     }
//   })
// })

app.get('/about', (request, response) =>{
  response.render('./pages/about.ejs');
})


app.listen(PORT, () => {
  console.log('listening on port ' + PORT);
});

app.post('/representatives', (request, response) =>{
  // console.log(request.body);
  let userAddress = '';
  if(request.body.address){
    userAddress = request.body.address.join('%20').split(' ').join('%20');
  }
  else{
    userAddress = request.body.zip.split(' ').join('%20');
  }
  // console.log(userAddress);
  getRepresentatives(userAddress)
    .then (results => {
      response.render('./pages/representatives.ejs', {value: results});
      // console.log(results);
    })

});

function getRepresentatives(address) {
  // console.log('in loadClient');
  let URL = `https://www.googleapis.com/civicinfo/v2/representatives?key=${process.env.GOOGLE_CIVIC_API_KEY}&address=${address}`
  // console.log(URL);
  return superagent.get(URL)
    .then(results =>{
      //console.log(results);
      let relevantOffices = filterRelevantOffices(results.body.offices);
      let districtArray = ['',''];
      relevantOffices.forEach(office =>{
        if(/United States House/.test(office.name)){
          districtArray[0] = office.name.substring(office.name.length-5);
        }
        if(/State /.test(office.name)){
          let stateDistrictArray = office.name.split(' ');
          let concatArray = [];
          concatArray.push(stateDistrictArray[0]); //state name
          concatArray.push(stateDistrictArray[stateDistrictArray.length-2]);//'District'
          concatArray.push(stateDistrictArray[stateDistrictArray.length-1]);//district #
          districtArray[1] = concatArray.join(' ');
        }
      })
      let districtPair = new UserDistricts(districtArray);
      let districtIndex = districtPair.save(address);
      let relevantIndicesAndRoles = [];
      for(let index = 0; index < relevantOffices.length; index++){
        let roleName = '';
        if(/country/.test(relevantOffices[index].levels[0])){
          roleName += 'Federal ';
        }
        else{
          roleName += 'State ';
        }
        if(/legislatorUpperBody/.test(relevantOffices[index].roles[0])){
          roleName += 'Senator';
        }
        else{
          roleName += 'Representative';
        }
        relevantOffices[index].officialIndices.forEach(index =>{
          relevantIndicesAndRoles.push({'role': roleName, 'index': index})
        })
      }
      let relevantPoliticians = [];
      relevantIndicesAndRoles.forEach( indexPair =>{
        relevantPoliticians.push(results.body.officials[indexPair.index]);
        relevantPoliticians[relevantPoliticians.length-1].role = indexPair.role;
      });
      const reps = relevantPoliticians.map( person =>{
        const rep = new Representative(person);
        // rep.save(districtIndex);
        return rep;
      });
      // console.log({'reps': reps, 'districtPair': districtPair})
      return {'reps': reps, 'districtPair': districtPair};
    })
}

function UserDistricts(districts){
  this.federalDistrict = districts[0];
  this.stateDistrict = districts[1];
}

UserDistricts.prototype.save = function(address){
  let votingDistrict = Object.entries(this)[1][1];
  let SQL = `SELECT * FROM votingdistricts WHERE voting_district = '${votingDistrict}';`;
  client.query(SQL, (error, result) =>{
    if(error){
      console.log(error);
    }
    else if(!result.rowCount){
      SQL = `INSERT INTO votingdistricts
            (address,voting_district)
            VALUES($1,$2) RETURNING id AS id;`;
      let values = [address];
      values.push(Object.entries(this)[1][1]);
      client.query(SQL,values, (error,result) =>{
        return result.rows[0].id;
      })
    }
    else{
      console.log('voting district found, ID:');
      console.log(result.rows[0].id);
      return result.rows[0].id;
    }
  });
}

function Representative(data){
  // console.log('New representative from:');
  // console.log(data);
  this.name = data.name;
  this.role = data.role;
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
}

// Representative.prototype.save = function(){
//   let SQL = `INSERT INTO locations
//     (search_query,formatted_query,latitude,longitude)
//     VALUES($1,$2,$3,$4)`;
//   let values = Object.values(this);
//   client.query(SQL,values);
// }

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
