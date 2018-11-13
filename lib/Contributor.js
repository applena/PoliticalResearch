module.exports = function Contributor(data) {
  this.name = data['@attributes'].org_name;
  this.total = data['@attributes'].total;
}
