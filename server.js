'use strict';

// ====== Packages ======
const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
const pg = require('pg'); // postgres
const methodOverride = require('method-override'); // Method override for using DELTE or PUT methods

// ====== Setup ======
const app = express();
app.use(express.urlencoded({extended: true})); // decodes http, used for POST method
app.use(express.static('./public')); // load the public/styles folder to access css;
app.use(methodOverride('_method')); // looks in our requests for query string of '_method'. It will change the HTTP method's type to whatever is stored as that query string _method
// ?_method=delete :: makes method path into delete request
// ?_method=put :: makes method path into put request 
app.set('view engine', 'ejs'); // express handles ejs for us


// ====== Other global variables ======
const PORT = process.env.PORT || 3111;
const DATABASE_URL = process.env.DATABASE_URL; // postgres url
const client = new pg.Client(DATABASE_URL); // postgres client
client.on('error', (error) => console.log(error)); // postgres error logging


// ====== Routes ====== 
app.get('/', getHome);
app.get('/searches/new', renderSearchPage);
app.post('/searches', searchBooks);
app.get('/books/:id', getDetails);
app.post('/books', saveBook);
app.put('/books/:id', editBook);


// ====== Route Callbacks ======
function getHome(req, res) {
    queryUserLibrary().then(result => {
        res.render('pages/index.ejs', {results : result.rows});
    })
}

function renderSearchPage(req, res) {
    res.render('pages/searches/new.ejs');
}

function searchBooks(req, res) {
    const query = req.body.userInput;
    const searchType = req.body.authorOrTitle
    console.log(query);
    let url = `https://www.googleapis.com/books/v1/volumes?q=in${searchType}:${query}`;
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
    detailsQuery(id).then(result => {
        res.render('pages/books/detail.ejs', {results : result.rows});
    });
}

function saveBook(req, res) {
    // get book info from search results (form)
    const book = req.body;
    insertNewBook(book).then( (result) => {
        console.log(`added ${book.title} to database`);
        // set id as new book's sql id 
        const id = result.rows[0].id;
        // send client back to new book details page
        res.redirect(`/books/${id}`);
    });
}

function editBook(req, res) {
    //this will render book editing page
    const id = req.params.id;
    console.log(req.body.userInput);
         
}

// ====== Helper functions ======
function Book(bookObj) {
    this.img_url = bookObj.volumeInfo.imageLinks? bookObj.volumeInfo.imageLinks.thumbnail : 'https://www.freeiconspng.com/uploads/book-icon--icon-search-engine-6.png',
    this.title = bookObj.volumeInfo.title? bookObj.volumeInfo.title : 'Title not found',
    this.author = bookObj.volumeInfo.authors? bookObj.volumeInfo.authors.join(', ') : 'Author not found', // takes first if multiple authors
    this.description = bookObj.volumeInfo.description? bookObj.volumeInfo.description : 'no description'
    this.isbn = bookObj.volumeInfo.industryIdentifiers? bookObj.volumeInfo.industryIdentifiers[0].identifier : 'no ISBN'
}

function queryUserLibrary(){
    // Query SQL db for all saved books
    const sqlQuery = `SELECT * FROM books`;
    return client.query(sqlQuery)
}

function insertNewBook(book) {
    // sql insert query, return new book entry id
    const bookQuery = `INSERT INTO books (author, title, isbn, img_url, description) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
    const bookArray = [book.author, book.title, book.isbn, book.img_url, book.description];
    return client.query(bookQuery, bookArray);
}

function detailsQuery(id) {
    const sqlQuery = `SELECT * FROM books WHERE id = ${id}`; // make id dynamic
    return client.query(sqlQuery);
}
// ====== Start up the server ======
client.connect() // Starts connection to postgres 
.then ( () => {
    app.listen(PORT, () => console.log(`we are up on PORT ${PORT}`)); // Starts up server
});