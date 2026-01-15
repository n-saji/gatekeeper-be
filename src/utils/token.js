const jsonwebtoken = require("jsonwebtoken");
const uuid = require("uuid");

const createJWTToken = async (userId, rememberMe = false) => {
  const jti = uuid.v4();
  const accessToken = jsonwebtoken.sign(
    {
      userId: userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 15,
      jti: jti,
    },
    process.env.JWT_SECRET
  );
  const refreshToken = jsonwebtoken.sign(
    {
      userId: userId,
      exp: rememberMe
        ? Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
        : Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      jti: jti,
    },
    process.env.JWT_SECRET
  );

  return { accessToken, refreshToken, jti };
};

const refreshJWTToken = async (refreshToken) => {
  try {
    const payload = jsonwebtoken.verify(refreshToken, process.env.JWT_SECRET);
    if (!payload || !payload.userId || !payload.exp || !payload.jti) {
      throw new Error("payload missing required fields");
    }
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > payload.exp) {
      throw new Error("refresh token has expired");
    }
    const newAccessToken = jsonwebtoken.sign(
      {
        userId: payload.userId,
        exp: Math.floor(Date.now() / 1000) + 60 * 15,
        jti: payload.jti,
      },
      process.env.JWT_SECRET
    );
    return {
      accessToken: newAccessToken,
      jti: payload.jti,
      userId: payload.userId,
    };
  } catch (error) {
    throw new Error("Error verifying refresh token: " + error.message);
  }
};

const verifyJWTTokenAndExtractUserId = async (token) => {
  try {
    const payload = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    if (!payload || !payload.userId || !payload.exp || !payload.jti) {
      throw new Error("payload missing required fields");
    }
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > payload.exp) {
      throw new Error("token has expired");
    }
    return { userId: payload.userId, jti: payload.jti };
  } catch (error) {
    throw new Error("Error verifying token: " + error.message);
  }
};

module.exports = {
  createJWTToken,
  refreshJWTToken,
  verifyJWTTokenAndExtractUserId,
};
