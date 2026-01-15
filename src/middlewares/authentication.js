const { verifyJWTTokenAndExtractUserId } = require("../utils/token");
const { getSession } = require("../config/redis");
const User = require("../models/User");

async function authenticationMiddleware(req, res, next) {
  try {
    const accessToken = req.cookies.accessToken;

    if (
      req.path.startsWith("/api/auth") ||
      (req.path === "/api/users" && req.method === "POST")
    ) {
      return next();
    }

    if (!accessToken) {
      return res.status(401).json({ message: "Access token missing" });
    }

    try {
      const { userId, jti } = await verifyJWTTokenAndExtractUserId(accessToken);
      req.userId = userId;

      const session = await getSession(userId, jti);
      if (!session) {
        return res
          .status(401)
          .json({ message: "Session not found or expired" });
      }
      return next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Invalid or expired access token" });
    }
  } catch (error) {
    console.error("Error in authentication middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function adminAuthorizationMiddleware(req, res, next) {
  try {
    User.findById(req.userId).then((user) => {
      if (!user || !user.role || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    });
  } catch (error) {
    console.error("Error in admin authorization middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  authenticationMiddleware,
  adminAuthorizationMiddleware,
};
