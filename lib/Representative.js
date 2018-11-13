const cache = require('../cache/index');
const uuid = require('uuid/v4');

module.exports = function Representative(data, state){
  this.id = uuid();
  this.state = state;
  this.name = data.name;
  this.role = data.role;
  if(data.photoUrl){
    this.img_url = data.photoUrl;
  }
  else{
    this.img_url = './img/placeholder.png'
  }``
  this.political_affiliation = data.party;
  this.phone = data.phones[0];
  if(data.phones && data.phones[0]){
    this.phone = data.phones[0];
  }
  else{
    this.phone = 'No available phone number';
  }
  if(data.emails && data.emails[0]){
    this.email = data.emails[0];
  }
  else{
    this.email = 'No email found.';
  }
  if(data.urls && data.urls[0]){
    this.website_url = data.urls[0];
  }
  else{
    this.website_url = 'No website URL found.';
  }
  if(data.office){
    this.officialOffice = data.office;
  }
  else{
    this.officialOffice = 'No official office';
  }
  cache.reps[this.id] = this;
}
