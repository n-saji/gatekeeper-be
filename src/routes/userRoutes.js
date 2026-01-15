const express = require("express");
const {
  handleGetUsers,
  handleCreateUser,
  handleMe,
  handleUserDeletion,
  handleUserUpdation,
} = require("../controllers/userController");

const router = express.Router();

router
  .route("/")
  .get(handleMe)
  .post(handleCreateUser)
  .delete(handleUserDeletion)
  .patch(handleUserUpdation);

router.route("/all").get(handleGetUsers);

module.exports = router;
