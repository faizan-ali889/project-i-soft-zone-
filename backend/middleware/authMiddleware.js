const jwt = require("jsonwebtoken");
const db = require("../config/db");

module.exports = async function (req, res, next) {
  // Get token from the request header
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify the token using your JWT secret from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch the user information from the database
    const userQuery = await db.query(
      "SELECT id, name, email, role, reporting_manager_id FROM users WHERE id = $1",
      [decoded.id]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ message: "User session is invalid" });
    }

    req.user = userQuery.rows[0]; // Attach the user details (id, name, email, role, reporting_manager_id) to the request object
    next(); // Move on to the route logic
  } catch (err) {
    res.status(401).json({ message: "Token session is invalid or expired" });
  }
};