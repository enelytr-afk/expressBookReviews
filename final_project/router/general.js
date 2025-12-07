const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
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
public_users.get('/', (req, res) => {
    axios.get('https://enelytr-5000.theianext-0-labs-prod-misc-tools-us-east-0.proxy.cognitiveclass.ai/')  // Replace with actual API endpoint if applicable
      .then(response => {
        res.status(200).json(response.data);
      })
      .catch(error => {
        res.status(500).json({ message: "Error fetching book list" });
      });
});

// 2) Book details based on ISBN
public_users.get('/isbn/:isbn', async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const book = books[isbn]; // await db.getByIsbn(isbn)
    if (!book) {
      return res.status(404).json({ error: `Book with ISBN ${isbn} not found` });
    }
    return res.json({ isbn, ...book });
  } catch (err) {
    next(err);
  }
});

// 3) Book details based on Author
public_users.get('/author/:author', async (req, res, next) => {
  try {
    const query = (req.params.author || "").toLowerCase();
    const results = Object.entries(books)
      .filter(([_, book]) => (book.author || "").toLowerCase().includes(query))
      .map(([isbn, book]) => ({ isbn, ...book }));
    // If async: const results = await db.getByAuthor(query);

    if (results.length === 0) {
      return res.status(404).json({ error: `No books found by author: ${req.params.author}` });
    }
    return res.json(results);
  } catch (err) {
    next(err);
  }
});

// 4) Book details based on Title
public_users.get('/title/:title', async (req, res, next) => {
  try {
    const query = (req.params.title || "").toLowerCase();
    const results = Object.entries(books)
      .filter(([_, book]) => (book.title || "").toLowerCase().includes(query))
      .map(([isbn, book]) => ({ isbn, ...book }));
    // If async: const results = await db.getByTitle(query);

    if (results.length === 0) {
      return res.status(404).json({ error: `No books found with title containing: ${req.params.title}` });
    }
    return res.json(results);
  } catch (err) {
    next(err);
  }
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
