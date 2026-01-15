const express = require("express");
const {
  handleLogin,
  handleRefreshToken,
} = require("../controllers/authController");
const router = express.Router();


router.post("/login", handleLogin);
router.get("/refresh-token", handleRefreshToken);

module.exports = router;
