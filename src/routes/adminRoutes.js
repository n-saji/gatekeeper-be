const express = require("express");
const {
  handleGetActiveSessions,
  handleForceLogout,
} = require("../controllers/adminController");
const router = express.Router();

router.get("/active-sessions", handleGetActiveSessions);
router.post("/force-logout", handleForceLogout);
module.exports = router;
