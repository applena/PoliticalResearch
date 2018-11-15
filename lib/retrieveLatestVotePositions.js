const superagent = require('superagent');

module.exports = function retrieveLatestVotePositions(propublica_id){
  let voteHistoryArray = [{'description':'No voting history', 'position':''}];
  let URL = `https://api.propublica.org/congress/v1/members/${propublica_id}/votes.json`;
  return superagent.get(URL)
    .set('X-API-Key', `${process.env.PROPUBLICA_API_KEY}`)
    .then(response =>{
      voteHistoryArray = [];
      if(response.body && response.body.results){
        let rawVoteResults = response.body.results[0].votes;
        rawVoteResults.forEach( vote =>{
          voteHistoryArray.push({'description':vote.description, 'position':vote.position});
        })
      }
      return voteHistoryArray;
    })
}
