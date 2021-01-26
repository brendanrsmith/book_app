'use strict';

// ==== Packages ====
const express = require('express');
const superagent = require('superagent');
require('dotenv').config();

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
// app.post('/searches/new', );
app.post('/searches', searchBooks);

// ==== Route Callbacks ====
function getHome(req, res) {
    res.render('pages/index.ejs');
}

function getSearchPage(req, res) {
    res.render('pages/searches/new.ejs');
}

function searchBooks(req, res) {
    const query = req.body.userInput;
    console.log(query);
    let url;
    if(req.body.authorOrTitle === 'title'){
        url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}`;
    } else {
        url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${query}`;
    }
    // const url = `https://www.googleapis.com/books/v1/volumes?q=${query}`;
    superagent.get(url).then(result => {
        // create new Book object
        const results = result.body.items.map(bookObj => {
            // console.log(bookObj);
            return new Book(bookObj);
        })
        // console.log(results);
        // render results page
        res.render('pages/searches/show.ejs', {results: results} );
    })
    // error handling
    .catch(error => {
        res.status(500).render('pages/error.ejs');
        console.log(error.message);
    }); 
}

// === Helper functions ====
function Book(bookObj) {
    this.img_url = bookObj.volumeInfo.imageLinks? bookObj.volumeInfo.imageLinks.thumbnail : 'https://www.freeiconspng.com/uploads/book-icon--icon-search-engine-6.png',
    this.title = bookObj.volumeInfo.title? bookObj.volumeInfo.title : 'Title not found',
    this.author = bookObj.volumeInfo.authors? bookObj.volumeInfo.authors[0] : 'Author not found', // takes first if multiple authors
    this.description = bookObj.volumeInfo.description? bookObj.volumeInfo.description : 'no description'
}

// ==== Start up the server ====
app.listen(PORT, () => console.log(`Server up on ${PORT}`));