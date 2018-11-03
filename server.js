'use strict';

const express = require('express');
const cors = require('cors');
// const superagent = require('superagent');
// const pg = require('pg');

require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));

const PORT = process.env.PORT || 3001;

app.set('view engine', 'ejs');


app.get('/', (request, response) => {
  response.render('../views/index.ejs');
});


app.listen(PORT, () => {
  console.log('listening on port ' + PORT);
});
