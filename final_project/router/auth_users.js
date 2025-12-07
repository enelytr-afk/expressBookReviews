const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => { 
    if (!username || typeof username !== 'string' || username.trim() === '') return false;
    const exists = users.some(u => u.username === username);
    return !exists;
};

const authenticatedUser = (username,password) => {  
    if (!username || !password) return false;
    return users.some(u => u.username === username && u.password === password);
};

//only registered users can login
regd_users.post("/login", (req,res) => {
  
    const { username, password } = req.body || {};

    if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
    }

    // User must exist already (you likely register via /register in general.js)
    if (!authenticatedUser(username, password)) {
        return res.status(401).json({ error: "Invalid username or password" });
    }

    // Issue access token
    const { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } = process.env;
    if (!JWT_SECRET) {
    // Fail fast if misconfigured
        return res.status(500).json({ error: "Server misconfigured: JWT_SECRET missing" });
    }

    // Minimal payload; add more claims as needed
    const payload = {
        sub: username,
        // Example custom claims (roles/scopes can be added if you have them)
        roles: ["user"],
        // iat/exp will be added via sign options below
    };

    // Token options
    const signOpts = {
        algorithm: "HS256",
        expiresIn: "1h", // adjust to your needs
    };
    if (JWT_ISSUER) signOpts.issuer = JWT_ISSUER;
    if (JWT_AUDIENCE) signOpts.audience = JWT_AUDIENCE;

    try {
    const token = jwt.sign(payload, JWT_SECRET, signOpts);
    return res.status(200).json({
        message: "Login successful",
        token, // client should send this in Authorization: Bearer <token>
     });
    } catch (err) {
        return res.status(500).json({ error: "Failed to generate token", detail: err.message });
    }
});


// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params;
    const { review } = req.body || {};
    const username = req.user?.sub; // set by your auth middleware
  
    if (!username) {
      return res.status(401).json({ error: "Unauthorized: missing user context" });
    }
  
    if (!isbn || !books[isbn]) {
      return res.status(404).json({ error: `Book with ISBN ${isbn} not found` });
    }
  
    if (!review || typeof review !== "string" || review.trim() === "") {
      return res.status(400).json({ error: "Review text is required" });
    }
  
    // Initialize reviews container if absent
    if (!books[isbn].reviews || typeof books[isbn].reviews !== "object") {
      books[isbn].reviews = {};
    }
  
    // Add/update the review keyed by username
    books[isbn].reviews[username] = review.trim();
  
    return res.status(200).json({
      message: "Review saved",
      isbn,
      reviewer: username,
      reviews: books[isbn].reviews,
    });
});


// DELETE /customer/auth/review/:isbn
// Removes the current user's review for the given ISBN
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params;
  
    // Identify the username from token/session – same approach you used in PUT route
    const username =
      (req.user && (req.user.username || req.user.sub)) ||
      (req.session && req.session.user && (req.session.user.username || req.session.user.sub)) ||
      (req.session && req.session.authorization && req.session.authorization.username);
  
    if (!username) {
      return res.status(401).json({ message: "Unauthorized: username not found in session/token." });
    }
  
    const book = books[isbn];
    if (!book) {
      return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
    }
  
    if (!book.reviews || !book.reviews[username]) {
      return res.status(404).json({ message: `No review by '${username}' for ISBN ${isbn}.` });
    }
  
    // Delete the user's review for this book
    delete book.reviews[username];
  
    return res.status(200).json({
         message: "Review deleted successfully.",
      isbn,
      reviewer: username,
      reviews: book.reviews
    });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
