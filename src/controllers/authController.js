const bcrypt = require("bcrypt");
const User = require("../models/User");
const {
  createJWTToken,
  refreshJWTToken,
  verifyJWTTokenAndExtractUserId,
} = require("../utils/token");
const { setSession, deleteSession } = require("../config/redis");

const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const systemUser = await User.findOne({
      email: String(email),
      isActive: true,
    }).select("+password");
    if (!systemUser) {
      return res.status(401).json({ message: "Account not found" });
    }
    if (!bcrypt.compareSync(password, systemUser.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // return token in cookies
    const { accessToken, refreshToken, jti } = await createJWTToken(
      systemUser._id,
      req.body.rememberMe || false
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: req.body.rememberMe
        ? 7 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000,
    });

    // storing session in redis
    setSession(
      systemUser._id,
      jti,
      req.ip,
      req.get("User-Agent") || "unknown"
    ).catch((err) => {
      console.error("Error setting session in Redis:", err);
    });

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handleRefreshToken = async (req, res) => {
  await verifyJWTTokenAndExtractUserId(req.cookies.refreshToken)
    .catch((err) => {
      return res
        .status(401)
        .json({ message: "Invalid refresh token", error: err });
    })
    .then(
      refreshJWTToken(req.cookies.refreshToken)
        .catch((err) => {
          return res
            .status(401)
            .json({ message: "Invalid refresh token", error: err });
        })
        .then(({ accessToken, jti, userId }) => {
          res.cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000,
          });

          setSession(
            userId,
            jti,
            req.ip,
            req.get("User-Agent") || "unknown"
          ).catch((err) => {
            console.error("Error updating session in Redis:", err);
          });

          return res
            .status(200)
            .json({ message: "Token refreshed successfully" });
        })
    );
};

const handleLogOut = async (req, res) => {
  try {
    await verifyJWTTokenAndExtractUserId(req.cookies.accessToken)
      .catch((err) => {
        return res
          .status(401)
          .json({ message: "Invalid access token", error: err });
      })
      .then(async (response) => {
        await deleteSession(response.userId).then((done) => {
          if (!done) {
            return res
              .status(400)
              .json({ message: "No active sessions found for user" });
          }

          res.cookie("accessToken", "", {
            httpOnly: true,
            maxAge: 0,
          }),
            res.cookie("refreshToken", "", {
              httpOnly: true,
              maxAge: 0,
            });
        });
      });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  handleLogin,
  handleRefreshToken,
  handleLogOut,
};
