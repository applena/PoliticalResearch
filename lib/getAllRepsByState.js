const superagent = require('superagent');

module.exports = function getAllRepsByState(state) {
  let URL = `http://www.opensecrets.org/api/?method=getLegislators&id=${state}&apikey=${process.env.OPEN_SECRETS_API_KEY}&output=json`;
  return superagent.get(URL)
    .then(results => {
      //console.log(results.text);
      const reps = JSON.parse(results.text);
      //console.log('opensecrets',reps.response.legislator);
      return reps.response.legislator;
    })
}
