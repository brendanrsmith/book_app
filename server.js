'use strict';

// ==== Packages ====
const express = require('express');
const superagent = require('superagent');

// ==== Setup ====
const app = express();

app.use(express.urlencoded({extended: true})); // decodes http, used for POST method
app.use(express.static('./public')); // load the public/styles folder to access css;
app.set('view engine', 'ejs'); // express handles ejs for us


// ==== Other global variables ====
const PORT = process.env.PORT || 3111;

// ==== Routes ==== 
app.get('/', getHome);
app.get('/searches/new', getSearchPage);
app.post('/searches/new', searchBooks);

// ==== Route Callbacks ====
function getHome(req, res) {
    res.render('pages/index.ejs');
}

function getSearchPage(req, res) {
    res.render('pages/searches/new.ejs');
}

function searchBooks(req, res) {
    res.render('pages/searches/show.ejs');
}

// === Helper functions ====

// ==== Start up the server ====
app.listen(PORT, () => console.log(`Server up on ${PORT}`));