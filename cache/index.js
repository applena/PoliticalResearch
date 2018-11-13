// export a JavaScript Object that will act as 
// a cache for data across multiple users as long as the app runs
// when the app restarts, this will reset to an empty cache object
// because Objects are by reference, we can import (require) this file
// inside any js file on the server and they will share this object like a shared database
module.exports = {
  reps: {} // uuid keyed rep instance
};
