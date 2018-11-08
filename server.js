'use strict';

const express = require('express');
const cors = require('cors');
// const googleapis = require('googleapis');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();
const client = new pg.Client(process.env.DATABASE_URL);
let chosenID;
client.connect();

const app = express();

app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));

const PORT = process.env.PORT || 3001;

function errorHandler (error, response) {
  response.render('/pages/error.ejs');
}

app.set('view engine', 'ejs');

app.get('/', (request, response) => {
  response.render('../views/index.ejs');
});

app.get('/checkvoter', (request, response)=> {
  response.render('./pages/checkvoter.ejs');
});

app.get('/loadrep/:id', (request,response) => {
  console.log('hitting loadrep');
  chosenID = request.params.id;
  doSomething(chosenID)
    .then( stuff => {
      console.log('stuff from doSomething on /loadrep/: ', stuff);
      response.render('pages/individualrep.ejs', {value:stuff});
    })
});

app.get('/data/:id', (request, response) => {
  console.log('hitting data')
  doSomething(chosenID)
    .then( stuff => {
      console.log('stuff from doSomething on /data/: ', stuff);
      response.json(stuff);
    });
})

let doSomething = (id) => {

  chosenID = id;

  let SQL = 'SELECT state FROM politicianinfo WHERE id=$1';
  let values = [chosenID];
  let contributorArray=[]; //this array holds the doners and the totals
  console.log('chosenID: ', chosenID);
  return client.query(SQL, values)

    .then( result => {

      let state = result.rows[0].state;

      //gets the funding info
      return getAllRepsByState(state)
        .then (reps => {
          console.log('reps:',reps);
          return chosenRepresentative(reps)
            .then(starRep => {
              console.log('starRep: ',starRep)
              let repCid = starRep['@attributes'].cid;
              let URL = `https://www.opensecrets.org/api/?method=candContrib&cid=${repCid}&cycle=2018&apikey=${process.env.OPEN_SECRETS_API_KEY}&output=json`;
              return superagent.get(URL)
                .then(result => {
                  let contributors = JSON.parse(result.text);
                  let contributorObjectArray = contributors.response.contributors.contributor;
                  for(let i=0; i<contributorObjectArray.length; i++){
                    let contributor = new Contributor(contributorObjectArray[i]);
                    contributorArray.push(contributor);
                  }
                  return retrieveLatestVotePositions(chosenID)
                    .then( (voteResult) =>{
                      let repNameRoleQuery = 'SELECT politician, role, affiliation, image_url FROM politicianinfo WHERE id=$1';
                      let repValues = [chosenID];
                      let repNameRoleAfflicaitonArray = [];

                      return client.query(repNameRoleQuery, repValues)
                        .then (results => {
                          repNameRoleAfflicaitonArray.push(results.rows[0].politician);
                          repNameRoleAfflicaitonArray.push(results.rows[0].role);
                          repNameRoleAfflicaitonArray.push(results.rows[0].affiliation);
                          repNameRoleAfflicaitonArray.push(results.rows[0].image_url);

                          return {name: repNameRoleAfflicaitonArray[0],
                            political_affiliation: repNameRoleAfflicaitonArray[2],
                            role: repNameRoleAfflicaitonArray[1],
                            image_url: repNameRoleAfflicaitonArray[3],
                            vote: contributorArray,
                            id: chosenID,
                            voteHistory: voteResult
                          }
                        });//this is what I need to feed into my ejs page
                    })
                });
            })
        })
        .catch( err => console.log(err))
    });

};

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

function Contributor(data) {
  this.name = data['@attributes'].org_name;
  this.total = data['@attributes'].total;
}

function getAllRepsByState(state) {
  let URL = `http://www.opensecrets.org/api/?method=getLegislators&id=${state}&apikey=${process.env.OPEN_SECRETS_API_KEY}&output=json`;
  return superagent.get(URL)
    .then(results =>{
      const reps = JSON.parse(results.text);
      return reps;
    })
    .catch(error => errorHandler(error));
}

function chosenRepresentative(obj) {
  let SQL = 'SELECT politician FROM politicianinfo WHERE id=$1';
  let values = [chosenID];
  return client.query(SQL, values)
    .then (results => {
      const starRep = obj.response.legislator.find(rep => {
        return rep['@attributes'].firstlast===results.rows[0].politician;
      })
      console.log('chosenRepresentative returning: ', starRep);
      return starRep;
    })
}

function retrieveLatestVotePositions(id){
  console.log('In retrieveLatestVotePositions with id: ', id);
  let SQL = 'SELECT propublica_id FROM politicianinfo WHERE id =$1';
  let values = [id];
  console.log('using SQL query: ',SQL);
  return client.query(SQL, values)
    .then( results=>{
      console.log('this should be the propublica_id: ',results.rows[0].propublica_id);
      let URL = `https://api.propublica.org/congress/v1/members/${results.rows[0].propublica_id}/votes.json`;
      return superagent.get(URL)
        .set('X-API-Key', `${process.env.PROPUBLICA_API_KEY}`)
        .then(result =>{
          let rawVoteResults = result.body.results[0].votes;
          // console.log('results of propublica API: ',result.body.results[0].votes);
          let voteHistoryArray = [];
          rawVoteResults.forEach( vote =>{
            voteHistoryArray.push({'description':vote.description, 'position':vote.position});
          })
          // console.log('array to be returned: ',voteHistoryArray)
          return voteHistoryArray;
        })
    })
}

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
    console.log(userAddress);
  }
  else{
    userAddress = request.body.zip.split(' ').join('%20');
  }
  getRepresentatives(userAddress)
    .then (results =>{
      pauseHack(500)
        .then( () =>{
          let getResults = `SELECT * FROM politicianinfo WHERE voting_district=$1`;
          let resultValues = [results.districtPair.stateDistrict];
          client.query(getResults, resultValues, (error, result)=> {
            response.render('./pages/representatives.ejs', {value: result.rows});
          })
        })
    })
});

function pauseHack (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

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
  }
  else{
    values.push('No ProPublica ID')
    client.query(SQL, values);
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

function filterRelevantOffices(officeArray){
  return officeArray.filter( office =>{
    return (/country/.test(office.levels) || /administrativeArea1/.test(office.levels)) && (/legislatorUpperBody/.test(office.roles) || /legislatorLowerBody/.test(office.roles));
  });
}
