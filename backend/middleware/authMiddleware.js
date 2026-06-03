const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Get token from the request header
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify the token using your JWT secret from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // Attach the user id to the request object
    next(); // Move on to the route logic
  } catch (err) {
    res.status(401).json({ message: "Token session is invalid or expired" });
  }
};