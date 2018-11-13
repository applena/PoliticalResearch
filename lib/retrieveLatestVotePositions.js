const superagent = require('superagent');

module.exports = function retrieveLatestVotePositions(propublica_id){
  //console.log('In retrieveLatestVotePositions with id: ', propublica_id);
  let voteHistoryArray = [{'description':'No voting history', 'position':''}];
  let URL = `https://api.propublica.org/congress/v1/members/${propublica_id}/votes.json`;
  return superagent.get(URL)
    .set('X-API-Key', `${process.env.PROPUBLICA_API_KEY}`)
    .then(response =>{
      //console.log('🦄 results from api call to voting history', response.body);
      voteHistoryArray = [];
      if(response.body && response.body.results){
        let rawVoteResults = response.body.results[0].votes;
        rawVoteResults.forEach( vote =>{
          voteHistoryArray.push({'description':vote.description, 'position':vote.position});
        })
        //console.log('array to be returned: ',voteHistoryArray)
      }
      //console.log('😸 results of votesHistoryArray: ',voteHistoryArray);
      return voteHistoryArray;
    })
}
