const superagent = require('superagent');

module.exports = function getAllRepsByState(state) {
  console.log('in get all reps by state', state)
  let URL = `http://www.opensecrets.org/api/?method=getLegislators&id=${state}&apikey=${process.env.OPEN_SECRETS_API_KEY}&output=json`;
  return superagent.get(URL)
    .then(results => {
      console.log('results from gets all reps by state', results.body);
      const reps = JSON.parse(results.text);
      return reps.response.legislator;
    })
}
