const superagent = require('superagent');

module.exports = function getPropublicaIds(type, state, district){
  state = state.toLowerCase();
  let URL = `https://api.propublica.org/congress/v1/members/`;
  console.log('this is the type ', type, 'this is the state ', state, 'this is the district ', district);
  //searching all the reps from a state on propublica api
  if(!district){
    //will return all the senators from the state the rep is in
    URL += `${type}/${state}/current.json`;
  }else{
    //will return all the house reps from the state and district where the rep is
    URL += `${type}/${state}/${district}/current.json`;
  }
  //console.log('propublia URL', URL);
  return superagent.get(URL)
    .set('X-API-Key', `${process.env.PROPUBLICA_API_KEY}`)
    .then(result =>{
      //console.log('this is the result body for propublia ', result.body);
      //this is an array of either all the house or senate members from the state of the chosen rep
      if(result.body.error){
        console.error('propublica error',result.body.error)
        return result.body.error;
      }
      //this is going to find the one rep data object that we wanted and fed into the function based on matching the names
      console.log('propublica',result.body.results )
      return result.body.results;
    })
}
