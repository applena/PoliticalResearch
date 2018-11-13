const cache = require('../cache/index');
const superagent = require('superagent');
const Contributor = require('./Contributor');

module.exports = function getFundingInformation(id) {
  let contributorArray = [];
  let chosenRep = cache.reps[id];
  console.log(chosenRep);

  if(!chosenRep){
    console.error('no rep found with id ', id, Object.keys(cache.reps));
    throw('no rep found with id ', id);
  }

  if(chosenRep){
    let repCid = cache.reps.opensecrets_id;
    let URL = `https://www.opensecrets.org/api/?method=candContrib&cid=${repCid}&cycle=2018&apikey=${process.env.OPEN_SECRETS_API_KEY}&output=json`;
    return superagent.get(URL)
      .then(result => {
        let contributors = JSON.parse(result.text);
        let contributorObjectArray = contributors.response.contributors.contributor;
        for(let i=0; i<contributorObjectArray.length; i++){
          let contributor = new Contributor(contributorObjectArray[i]);
          contributorArray.push(contributor);
        }
        return contributorArray;
      })
  }
}
