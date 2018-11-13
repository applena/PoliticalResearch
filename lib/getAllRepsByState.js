const superagent = require('superagent');

module.exports = function getAllRepsByState(state) {
  let URL = `http://www.opensecrets.org/api/?method=getLegislators&id=${state}&apikey=${process.env.OPEN_SECRETS_API_KEY}&output=json`;
  return superagent.get(URL)
    .then(results => {
      const reps = JSON.parse(results.text);
      return reps.response.legislator;
    })
}
