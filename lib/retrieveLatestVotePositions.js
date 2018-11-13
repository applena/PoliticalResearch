const superagent = require('superagent');

module.exports = function retrieveLatestVotePositions(propublica_id){
  //console.log('In retrieveLatestVotePositions with id: ', id);
  let voteHistoryArray = [{'description':'No voting history', 'position':''}];
  let URL = `https://api.propublica.org/congress/v1/members/${propublica_id}/votes.json`;
  return superagent.get(URL)
    .set('X-API-Key', `${process.env.PROPUBLICA_API_KEY}`)
    .then(result =>{
      if(result.body && result.body.results){
        voteHistoryArray = [];
        let rawVoteResults = result.body.results[0].votes;
        // console.log('results of propublica API: ',result.body.results[0].votes);
        rawVoteResults.forEach( vote =>{
          voteHistoryArray.push({'description':vote.description, 'position':vote.position});
        })
        // console.log('array to be returned: ',voteHistoryArray)
      }
      return voteHistoryArray;
    })
}
