module.exports = function errorHandler (error, response) {
  response.render('/pages/error.ejs');
}
