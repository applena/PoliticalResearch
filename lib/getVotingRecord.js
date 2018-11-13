const cache = require('../cache/index');
const retrieveLatestVotePositions = require('./retrieveLatestVotePositions');

module.exports = function getVotingRecord(id) {
  let chosenRep = cache.reps[id];

  if(!chosenRep){
    console.error('no rep found with id ', id, Object.keys(cache.reps));
    throw('no rep found with id ', id);
  }

  return retrieveLatestVotePositions(chosenRep.propublica_id)
}
