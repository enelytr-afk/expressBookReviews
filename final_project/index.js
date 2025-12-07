const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req,res,next){

// Accept "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization || "";
  const isBearer = authHeader.startsWith("Bearer ");
  const token = isBearer ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({
      error: "Missing Authorization header",
      expected: "Authorization: Bearer <token>",
    });
  }

  try {
    // Build verification options only if configured
    const { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } = process.env;
    const verifyOpts = {
      algorithms: ["HS256"],
      clockTolerance: 5, // seconds to allow small clock skew
    };
    if (JWT_ISSUER) verifyOpts.issuer = JWT_ISSUER;
    if (JWT_AUDIENCE) verifyOpts.audience = JWT_AUDIENCE;

    // Verify signature & claims
    const payload = jwt.verify(token, JWT_SECRET, verifyOpts);

    // Attach decoded payload for downstream route handlers
    req.user = payload;

    // (Optional) If you really want session + token together:
    // req.session.user = {
    //   sub: payload.sub,
    //   roles: payload.roles,
    //   scope: payload.scope || payload.scp,
    // };

    return next();
  } catch (err) {
    // Distinguish common JWT errors
    const isExpired = err.name === "TokenExpiredError";
    const isInvalid = err.name === "JsonWebTokenError";
    const isNotBefore = err.name === "NotBeforeError";

    return res.status(401).json({
      error: isExpired
        ? "Token expired"
        : isInvalid
        ? "Invalid token"
        : isNotBefore
        ? "Token not active yet"
        : "Token verification failed",
      detail: err.message,
        });
    }
});
 
const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
