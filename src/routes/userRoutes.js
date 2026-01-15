const express = require("express");
const {
  handleGetUsers,
  handleCreateUser,
  handleGetMe,
  handleUserDeletion,
  handleUserUpdation,
} = require("../controllers/userController");

const router = express.Router();

router
  .route("/")
  .get(handleGetMe)
  .post(handleCreateUser)
  .delete(handleUserDeletion)
  .patch(handleUserUpdation);

router.route("/all").get(handleGetUsers);

module.exports = router;
