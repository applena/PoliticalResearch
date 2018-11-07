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


app.get('/loadrep/:id', (request, response) => {
  let {id} = request.params; //params is an object in the request object that stores anything in the url that is followed by a : as a key (in this case, let {id} = request.params is the same as just using request.params.id)
  let SQL = `SELECT * FROM reps WHERE id=${id}`; // need to verify the correct table
  client.query(SQL, (error, result) =>{
    if(!error){
      let representative = result.rows[0];
      response.render('/pages/individualrep.ejs', {value: representative});
    } else{
      response.redirect('./pages/error.ejs');
    }
  })
})

app.get('/about', (request, response) =>{
  response.render('./pages/about.ejs');
})


app.listen(PORT, () => {
  console.log('listening on port ' + PORT);
});

app.post('/representatives', (request, response) =>{
  let userAddress = '';
  if(request.body.address){
    userAddress = request.body.address.join('%20').split(' ').join('%20');
  }
  else{
    userAddress = request.body.zip.split(' ').join('%20');
  }
  getRepresentatives(userAddress)
    .then (results =>{
      let getResults = `SELECT * FROM politicianinfo WHERE voting_district=$1`;
      let resultValues = [results.districtPair.stateDistrict];
      client.query(getResults, resultValues, (error, result)=> {
        response.render('./pages/representatives.ejs', {value: result.rows});
      })
    })
});

function getRepresentatives(address) {
  let URL = `https://www.googleapis.com/civicinfo/v2/representatives?key=${process.env.GOOGLE_CIVIC_API_KEY}&address=${address}`
  return superagent.get(URL)
    .then(results =>{
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
        let office = relevantOffices[index].name;
        relevantOffices[index].officialIndices.forEach(index =>{
          relevantIndicesAndRoles.push({'role': roleName, 'office': office, 'index': index})
        })
      }
      let relevantPoliticians = [];
      relevantIndicesAndRoles.forEach( indexPair =>{
        relevantPoliticians.push(results.body.officials[indexPair.index]);
        relevantPoliticians[relevantPoliticians.length-1].role = indexPair.role;
        relevantPoliticians[relevantPoliticians.length-1].office = indexPair.office;
      });
      const reps = relevantPoliticians.map( person =>{
        const rep = new Representative(person);
        return rep;
      });
      saveDistrictandReps(address,districtPair.stateDistrict,reps)
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
            (address,state,voting_district)
            VALUES($1,$2,$3);`;
      let values = [address, address.substring(address.length-2)];
      values.push(Object.entries(this)[1][1]);
      client.query(SQL,values, (error,result) =>{
        return result.rows[0].id;
      })
    }
    else{
      return result.rows[0].id;
    }
  });
}

function Representative(data){
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
  if(data.office){
    this.officialOffice = data.office;
  }
  else{
    this.officialOffice = 'No official office';
  }
}

Representative.prototype.save = function(id, stateAbbreviation, votingDistrict){
  let SQL = `INSERT INTO politicianinfo
    (politician,role,image_url,affiliation,contact_phone,contact_address,website,official_office,voting_district_id,state,voting_district,propublica_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12);`;
  let values = Object.values(this);
  values.push(id);
  values.push(stateAbbreviation);
  values.push(votingDistrict);
  if(/Federal/.test(values[1])){
    //Grab propublica ID
    findProPublicaID(values[1],values[9],values[7])
      .then( (result) =>{
        values.push(result);
        client.query(SQL, values);
      })
      .catch( () =>{
        values.push('No ProPublica ID');
        client.query(SQL, values);
      })
    // values.push(findProPublicaID(values[1],values[9],values[7]));
  }
  else{
    values.push('No ProPublica ID')
    client.query(SQL, values);
  }
  for(let i = 0; i < values.length; i++){
    console.log(i, values[i]);
  }
}

function findProPublicaID(role,state,official_office){
  let URL = `https://api.propublica.org/congress/v1/members/`;
  if(role.split(' ')[1] === 'Senator'){
    URL += `senate/${state}/current.json`;
  }
  else{
    URL += `house/${state}/`
    URL += `${official_office.substring(official_office.length-2)}`
    URL += `/current.json`;
  }
  console.log('Attempting to use the API req URL:', URL);
  return superagent.get(URL)
    .set('X-API-Key', `${process.env.PROPUBLICA_API_KEY}`)
    .then(result =>{
      console.log('results of propublica API: ',result.body.results[0].id);
      return result.body.results[0].id;
    })
}

function saveDistrictandReps(address, district, representatives){
  let votingDistrict = district;
  let SQL = `SELECT * FROM votingdistricts WHERE voting_district = '${votingDistrict}';`;
  client.query(SQL, (error, result) =>{
    if(error){
      console.log(error);
    }
    else if(!result.rowCount){
      SQL = `INSERT INTO votingdistricts
            (address,state,voting_district)
            VALUES($1,$2,$3) RETURNING id;`;
      let values = [address, address.substring(address.length-2)];
      values.push(votingDistrict);
      client.query(SQL,values, (error,result) =>{
        console.log('error', error);
        representatives.forEach(rep =>{
          rep.save(result.rows[0].id, values[1], values[2])
        })
      })
    }
    else{
      return result.rows[0].id;
    }
  });
}

function filterRelevantOffices(officeArray){
  return officeArray.filter( office =>{
    return (/country/.test(office.levels) || /administrativeArea1/.test(office.levels)) && (/legislatorUpperBody/.test(office.roles) || /legislatorLowerBody/.test(office.roles));
  });
}


//////////////my test code - get the funding info for the selected rep//////////////
let chosenID;

app.get('/loadrep/:id', (request, response) => {
  chosenID = request.params.id;
  console.log(chosenID);
  let SQL = `SELECT state FROM politicianinfo WHERE id=$1`;
  let values = [chosenID];

  client.query(SQL, values, (error, result) => {
    let state = result;//this is the state where the selected politician is

    getAllRepsByState(state)
      .then (starRep => {
        let repCid = starRep['@attributes'].cid;
        let URL = `https://www.opensecrets.org/api/?method=candContrib&cid=${repCid}&cycle=2018&apikey=${process.env.OPEN_SECRETS_API_KEY}&output=json`;
        console.log(URL);
        return superagent.get(URL)
          .then(result => {
            let contributors = JSON.parse(result.text);
            let contributorObjectArray = contributors.response.contributors.contributor;
            let contributorArray=[]; //this array holds the doners and the totals
            //console.log(contributorObjectArray);
            for(let i=0; i<contributorObjectArray.length; i++){
              let contributor = new Contributor(contributorObjectArray[i]);
              contributorArray.push(contributor);
            }
            //console.log(contributorArray);
          })
      })
  })
  // let repNameRoleQuery = 'SELECT politician role FROM politicianinfo WHERE id=$1';
  // let repValues = [chosenID];
  // client.query(repNameRoleQuery, repValues, (error, results) => {
  //   let repNameRole = results;
  //   return repNameRole;
  // })
  response.render('.pages/individualrep.ejs')
  //{value: {name: name, political_affiliation: political_affiliation, role: role}, vote: contributorArray})//this is what I need to feed into my ejs page

})

function Contributor(data) {
  this.name = data['@attributes'].org_name;
  this.total = data['@attributes'].total;
}

function getAllRepsByState(state) {
  let URL = `http://www.opensecrets.org/api/?method=getLegislators&id=${state}&apikey=${process.env.OPEN_SECRETS_API_KEY}&output=json`;
  return superagent.get(URL)
    .then(results =>{
      const reps = JSON.parse(results.text);
      return chosenRepresentative(reps);
    })
}

function chosenRepresentative(obj) {
  let SQL = 'SELECT politician FROM politicianinfo WHERE id=$1';
  let values = [chosenID];
  client.query(SQL, values, (error, results) => {
    const starRep = obj.response.legislator.find(rep => {
      return rep['@attributes'].firstlast===results;
    })
    return starRep;
  })
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
