'use strict';

// ==== Packages ====
const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
const pg = require('pg'); // postgres

// ==== Setup ====
const app = express();

app.use(express.urlencoded({extended: true})); // decodes http, used for POST method
app.use(express.static('./public')); // load the public/styles folder to access css;
app.set('view engine', 'ejs'); // express handles ejs for us


// ==== Other global variables ====
const PORT = process.env.PORT || 3111;
const DATABASE_URL = process.env.DATABASE_URL; // postgres url
const client = new pg.Client(DATABASE_URL); // postgres client
client.on('error', (error) => console.log(error));


// ==== Routes ==== 
app.get('/', getHome);
app.get('/searches/new', getSearchPage);
app.post('/searches', searchBooks);
app.get('/books/:id', getDetails);

// ==== Route Callbacks ====
function getHome(req, res) {
    // Query SQL db for saved books
    const sqlQuery = `SELECT * FROM books`;
    return client.query(sqlQuery).then(result => {
        console.log(result);
        res.render('pages/index.ejs', {results : result.rows});
    })
}

function getSearchPage(req, res) {
    res.render('pages/searches/new.ejs');
}

function searchBooks(req, res) {
    const query = req.body.userInput;
    console.log(query);
    let url;
    url = `https://www.googleapis.com/books/v1/volumes?q=in${req.body.authorOrTitle}:${query}`;
    superagent.get(url).then(result => {
        // create new Book object
        const results = result.body.items.map(bookObj => {
            return new Book(bookObj);
        })
        // render results page
        res.render('pages/searches/show.ejs', {results: results} );
    })
    // error handling
    .catch(error => {
        res.status(500).render('pages/error.ejs');
        console.log(error.message);
    }); 
}

function getDetails(req, res) {
    // query db for book:id
    const id = req.params.id;
    const sqlQuery = `SELECT * FROM books WHERE id = ${id}`; // make id dynamic
    return client.query(sqlQuery).then(result => {
        res.render('pages/books/detail.ejs', {results : result.rows});
    })
}

// === Helper functions ====
function Book(bookObj) {
    this.img_url = bookObj.volumeInfo.imageLinks? bookObj.volumeInfo.imageLinks.thumbnail : 'https://www.freeiconspng.com/uploads/book-icon--icon-search-engine-6.png',
    this.title = bookObj.volumeInfo.title? bookObj.volumeInfo.title : 'Title not found',
    this.author = bookObj.volumeInfo.authors? bookObj.volumeInfo.authors[0] : 'Author not found', // takes first if multiple authors
    this.description = bookObj.volumeInfo.description? bookObj.volumeInfo.description : 'no description'
}

// ==== Start up the server ====
client.connect() // Starts connection to postgres 
.then ( () => {
    app.listen(PORT, () => console.log(`we are up on PORT ${PORT}`)); // Starts up server
});