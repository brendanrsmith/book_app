'use strict';

// ==== Packages ====
const express = require('express');
const superagent = require('superagent');

// ==== Setup ====
const app = express();
app.set('view engine', 'ejs'); // express handles ejs for us
app.use(express.urlencoded({extended: true})); // decodes http, used for POST method
app.use(express.static('./public/styles')); // load the public folder to access css;

// ==== Other global variables ====
const PORT = process.env.PORT || 3111;

// ==== Routes ==== 
app.get('/', getHome);


// ==== Route Callbacks ====
function getHome(req, res) {
    res.render('pages/index.ejs');
}





//  Start up the server 
app.listen(PORT, () => console.log(`Server up on ${PORT}`));