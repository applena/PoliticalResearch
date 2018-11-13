
module.exports = function constructTheDetailPageObject(array, rep) {
  array.push({name:rep.name}, {role:rep.role}, {political_affiliation:rep.political_affiliation}, {id:rep.id}, {image_url:rep.img_url});
  return array;
}
