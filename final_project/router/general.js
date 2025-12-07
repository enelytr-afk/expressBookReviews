const express = require('express');
const axios = require('axios');
const books = require('./booksdb');
let { isValid, users } = require("./auth_users.js");
const public_users = express.Router();

// Register
public_users.post("/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  const usernameIsAvailable = typeof isValid === "function"
    ? isValid(username)
    : !users.find(u => u.username === username);

  if (!usernameIsAvailable) {
    return res.status(409).json({ error: "Username already exists" });
  }
  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});

// 1) List of available books
// Route to get the list of available books using Promise callbacks
function getBooks() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (books) {
          resolve(books);
        } else {
          reject("No books found");
        }
      }, 100); // Simulate a slight delay
    });
}

public_users.get('/', (req, res) => {
  getBooks()
    .then(bookList => {
      res.status(200).json(bookList);
    })
    .catch(error => {
      res.status(500).json({ message: error });
    });
});

// Promise function for getting book details by ISBN
function getBookByISBN(isbn) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const book = books[isbn];
        if (book) resolve(book);
        else reject("Book not found for ISBN: " + isbn);
      }, 100);
    });
}
  
// Route for book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
const isbn = req.params.isbn;
getBookByISBN(isbn)
    .then(bookDetails => res.status(200).json(bookDetails))
    .catch(error => res.status(404).json({ message: error }));
});

// Function to get books by author using Promise
function getBooksByAuthor(author) {
    return new Promise((resolve, reject) => {
      const bookKeys = Object.keys(books);
      const filteredBooks = [];
  
      bookKeys.forEach((key) => {
        if (books[key].author.toLowerCase() === author.toLowerCase()) {
          filteredBooks.push(books[key]);
        }
      });
  
      if (filteredBooks.length > 0) {
        resolve(filteredBooks);
      } else {
        reject(`No books found by author: ${author}`);
      }
    });
}
  
// Route to get books by author using Promise callbacks
public_users.get('/author/:author', function (req, res) {
    const author = req.params.author;
  
    getBooksByAuthor(author)
      .then((books) => res.json(books))
      .catch((error) => res.status(404).json({ message: error }));
});

// Function to get books by Title using Promise
function getBooksByTitle(title) {
    return new Promise((resolve, reject) => {
      const bookKeys = Object.keys(books);
      const filteredBooks = [];
  
      bookKeys.forEach((key) => {
        if (books[key].title.toLowerCase() === title.toLowerCase()) {
          filteredBooks.push(books[key]);
        }
      });
  
      if (filteredBooks.length > 0) {
        resolve(filteredBooks);
      } else {
        reject(`No books found with title: ${title}`);
      }
    });
}
  
// Route to get books by Title using Promise callbacks
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title;
  
    getBooksByTitle(title)
      .then((books) => res.json(books))
      .catch((error) => res.status(404).json({ message: error }));
});

// Reviews
public_users.get('/review/:isbn', async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const book = books[isbn]; // await db.getByIsbn(isbn)
    if (!book) {
      return res.status(404).json({ error: `Book with ISBN ${isbn} not found` });
    }
    const reviews = book.reviews || {};
    const hasReviews = Object.keys(reviews).length > 0;
    if (!hasReviews) {
      return res.json({ isbn, message: "No reviews yet", reviews: {} });
    }
    return res.json({ isbn, reviews });
  } catch (err) {
    next(err);
  }
});

module.exports.general = public_users;
``
