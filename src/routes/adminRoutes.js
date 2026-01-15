const express = require("express");
const {
  handleGetActiveSessions,
  handleForceLogout,
  handleUserDemotion,
  handleUserPromotion,
} = require("../controllers/adminController");
const router = express.Router();

router.get("/active-sessions", handleGetActiveSessions);
router.post("/force-logout", handleForceLogout);
router.post("/promote-user", handleUserPromotion);
router.post("/demote-user", handleUserDemotion);

module.exports = router;
