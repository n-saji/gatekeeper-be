const { getAllActiveSessions, deleteSession } = require("../config/redis");
const { getPublisher } = require("../config/serverEvents");
const User = require("../models/User");

const handleGetActiveSessions = async (req, res) => {
  try {
    const sessions = await getAllActiveSessions();
    return res.status(200).json({ sessions });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handleForceLogout = async (req, res) => {
  const { userId } = req.body;
  try {
    await deleteSession(userId);

    const publisher = getPublisher();
    if (!publisher.isOpen) await publisher.connect();
    await publisher.publish("force-logout", JSON.stringify({ userId }));

    return res.status(200).json({ message: "User forcefully logged out" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handleUserPromotion = async (req, res) => {
  // req.user is authenticated and is admin
  const { userId } = req.body;
  const User = require("../models/User");
  try {
    await User.findByIdAndUpdate(userId, { role: "admin" }).then(async () => {
      await deleteSession(userId);
      const publisher = getPublisher();
      if (!publisher.isOpen) await publisher.connect();
      await publisher.publish("force-logout", JSON.stringify({ userId }));
    });
    return res.status(200).json({ message: "User promoted to admin" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handleUserDemotion = async (req, res) => {
  // req.user is authenticated and is admin but must be super admin
  const { userId } = req.body;
  await User.findById(req.userId).then(async (user) => {
    if (!user || !user.isSuperAdmin) {
      return res.status(403).json({ message: "Super admin access required" });
    }
  });
  try {
    await User.findByIdAndUpdate(userId, { role: "user" }).then(async () => {
      await deleteSession(userId);

      const publisher = getPublisher();
      if (!publisher.isOpen) await publisher.connect();
      await publisher.publish("force-logout", JSON.stringify({ userId }));
      return res.status(200).json({ message: "User demoted to user" });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  handleGetActiveSessions,
  handleForceLogout,
  handleUserPromotion,
  handleUserDemotion,
};
