
module.exports = function constructTheDetailPageObject(array, rep) {
  array.push({name:rep.name}, {role:rep.role}, {political_affiliation:rep.political_affiliation}, {id:rep.id}, {image_url:rep.img_url}, {phone:rep.phone}, {reelction:rep.reelction}, {twitter:rep.twitter}, {facebook:rep.facebook}, {youtube:rep.youtube});
  return array;
}
