const User = require("../models/User");

const handleGetUsers = async (_, res) => {
  const users = await User.find();
  if (!users || users.length === 0)
    return res.status(404).json({ message: "No users found" });
  res.json(users);
};

const handleCreateUser = async (req, res) => {
  const { first_name, last_name, email, password, role } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({
      message: "First name, last name, email and password are required",
    });
  }
  try {
    console.log("Checking for existing user with email:", email);
    User.exists({ email: String(email) }).then((existingUser) => {
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }
    });
    const newUser = new User({
      first_name,
      last_name,
      email,
      password,
      role,
    });
    await newUser.save();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
  res.json({ message: "User created successfully" });
};

const handleMe = async (req, res) => {
  const userModel = await User.findById(req.userId);
  if (!userModel) return res.status(404).json({ message: "User not found" });
  res.status(200).json(userModel);
};

const handleUserDeletion = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { isActive: false }).then(
      res.cookie("accessToken", "", {
        httpOnly: true,
        maxAge: 0,
      }),
      res.cookie("refreshToken", "", {
        httpOnly: true,
        maxAge: 0,
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
  res.status(204).json({ message: "User deleted successfully" });
};

module.exports = {
  handleGetUsers,
  handleCreateUser,
  handleMe,
  handleUserDeletion,
};
