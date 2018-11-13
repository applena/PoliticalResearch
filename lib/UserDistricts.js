module.exports = function UserDistricts(districts){
  this.federalDistrict = districts[0];
  this.stateDistrict = districts[1];
  this.federalNumber = districts[0].substring(districts[0].length-2, districts[0].length)
  this.stateNumber = districts[1].substring(districts[1].length-2, districts[1].length);
}
