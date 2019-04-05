const superagent = require('superagent');
const filterRelevantOffices = require('./filterRelevantOffices');
const Representative = require('./Representative');
const UserDistricts = require('./UserDistricts');

module.exports = function getRepresentatives(address, state) {
  let newAddress = encodeURI(address);
  let URL = `https://www.googleapis.com/civicinfo/v2/representatives?key=${process.env.GOOGLE_CIVIC_API_KEY}&address=${newAddress}%20${state}`
  console.log('!!!!!!!!!ADDRESS', URL);

  //https://www.googleapis.com/civicinfo/v2/representatives?key=<YOUR_API_KEY>&address=1263%20Pacific%20Ave.%20Kansas%20City%20KS"

  //https://www.googleapis.com/civicinfo/v2/representatives?key=AIzaSyAjDjWqqdN6GMSY1KBiwHthIT_KPpPX7SM&address=4503%2048th%20Ave%20SW%20Seattle+WA

  return superagent.get(URL)
    .then(results =>{
      console.log('in getReps with ', results.body.offices);
      let relevantOffices = filterRelevantOffices(results.body.offices);
      let districtArray = ['',''];
      relevantOffices.forEach(office =>{
        //sets the [0] term in districtArray to US House 
        if(/United States House/.test(office.name)){
          districtArray[0] = office.name.substring(office.name.length-5);
        }
        //if this is a state reps - house and senate - put in district Array as the second term
        if(/State /.test(office.name)){
          let stateDistrictArray = office.name.split(' ');
          let concatArray = [];
          concatArray.push(stateDistrictArray[0]); //state name
          concatArray.push(stateDistrictArray[stateDistrictArray.length-2]);//'District'
          concatArray.push(stateDistrictArray[stateDistrictArray.length-1]);//district #
          districtArray[1] = concatArray.join(' ');
        }
      })
      let districtPair = new UserDistricts(districtArray);
      let relevantIndicesAndRoles = [];
      for(let index = 0; index < relevantOffices.length; index++){
        let roleName = '';
        if(/country/.test(relevantOffices[index].levels[0])){
          roleName += 'Federal ';
        }
        else{
          roleName += 'State ';
        }
        if(/legislatorUpperBody/.test(relevantOffices[index].roles[0])){
          roleName += 'Senator';
        }
        else{
          roleName += 'Representative';
        }
        let office = relevantOffices[index].name;
        relevantOffices[index].officialIndices.forEach(index =>{
          relevantIndicesAndRoles.push({'role': roleName, 'office': office, 'index': index})
        })
      }
      let relevantPoliticians = [];
      relevantIndicesAndRoles.forEach( indexPair =>{
        relevantPoliticians.push(results.body.officials[indexPair.index]);
        relevantPoliticians[relevantPoliticians.length-1].role = indexPair.role;
        relevantPoliticians[relevantPoliticians.length-1].office = indexPair.office;
      });
      
      //creates the arrary of representatives objects
      const reps = relevantPoliticians.map( person => {
        const rep = new Representative(person, state);
        return rep;
      });
      return {'reps': reps, 'districtPair': districtPair};
    })
    .catch(error => {console.error(error)});
}
