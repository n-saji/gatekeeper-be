const express = require("express");
const {
  handleLogin,
  handleRefreshToken,
  handleLogOut,
} = require("../controllers/authController");
const router = express.Router();

router.post("/login", handleLogin);
router.get("/refresh-token", handleRefreshToken);
router.post("/logout", handleLogOut);

module.exports = router;
