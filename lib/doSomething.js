const cache = require('../cache/index');
const getAllRepsByState = require('./getAllRepsByState');
const superagent = require('superagent');
const Contributor = require('./Contributor');
const retrieveLatestVotePositions = require('./retrieveLatestVotePositions');


module.exports = function doSomething(chosenID) {
  let contributorArray = [];
  if(!cache.reps[chosenID]){
    console.error('no rep found with id ', chosenID, Object.keys(cache.reps));
    throw('no rep found with id ', chosenID);
  }
  let chosenRep = cache.reps[chosenID];

  //gets the funding info
  return getAllRepsByState(chosenRep.state)
    .then (reps => {
      //console.log(reps);
      const starRep = reps.response.legislator.find(rep => {
        return rep['@attributes'].firstlast===chosenRep.name;
      })
      //console.log('reps:',reps);
      if(starRep){
        //console.log('starRep: ',starRep)
        let repCid = starRep['@attributes'].cid;
        let URL = `https://www.opensecrets.org/api/?method=candContrib&cid=${repCid}&cycle=2018&apikey=${process.env.OPEN_SECRETS_API_KEY}&output=json`;
        //console.log('this is the starRep id ', repCid);
        return superagent.get(URL)
          .then(result => {
            let contributors = JSON.parse(result.text);
            let contributorObjectArray = contributors.response.contributors.contributor;
            for(let i=0; i<contributorObjectArray.length; i++){
              let contributor = new Contributor(contributorObjectArray[i]);
              contributorArray.push(contributor);
            }
            return retrieveLatestVotePositions(chosenRep.propublica_id)
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
      }
      else{
        return retrieveLatestVotePositions(chosenID)
          .then( (voteResult) =>{
            //console.log('voteResult of less known politician: ',voteResult)
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
                  voteHistory: [{'description':'No voting history', 'position':''}]
                }
              });//this is what I need to feed into my ejs page
          })
      }
    })
};
