const { getAllActiveSessions, deleteSession } = require("../config/redis");
const { getPublisher } = require("../config/serverEvents");

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
module.exports = {
  handleGetActiveSessions,
  handleForceLogout,
};
