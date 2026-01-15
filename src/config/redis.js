const redis = require("redis");

let redisClient;

const connectRedis = async () => {
  if (redisClient) return;
  redisClient = redis.createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
    },
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
  });

  redisClient.connect().then(() => {
    console.log("Connected to Redis");
  });

  return redisClient;
};

const setSession = async (userId, jti, ip, userAgent) => {
  const sessionKey = `session:${userId}:${jti}`;
  const sessionData = JSON.stringify({
    ip: ip,
    userAgent: userAgent,
    lastSeen: new Date().toISOString(),
  });
  try {
    if (!redisClient || !redisClient.isOpen) {
      await connectRedis();
    }
    await redisClient.set(sessionKey, sessionData, {
      EX: 60 * 15,
    });

    return true;
  } catch (error) {
    console.error("Error setting session in Redis:", error);
    throw error;
  }
};

const getSession = async (userId, jti) => {
  const sessionKey = `session:${userId}:${jti}`;
  try {
    if (!redisClient || !redisClient.isOpen) {
      await connectRedis();
    }
    const sessionData = await redisClient.get(sessionKey);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error("Error getting session from Redis:", error);
    throw error;
  }
};

const deleteSession = async (userId) => {
  const sessionKey = `session:${userId}:*`;
  try {
    if (!redisClient || !redisClient.isOpen) {
      await connectRedis();
    }
    const keys = await redisClient.keys(sessionKey);
    for (let key of keys) {
      await redisClient.del(key);
    }
    return true;
  } catch (error) {
    console.error("Error deleting session from Redis:", error);
    throw error;
  }
};

const getAllActiveSessions = async () => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      await connectRedis();
    }
    const keys = await redisClient.keys("session:*");
    const sessions = [];
    for (let key of keys) {
      const sessionData = await redisClient.get(key);
      sessions.push({ key, data: JSON.parse(sessionData) });
    }
    return sessions;
  } catch (error) {
    console.error("Error getting all active sessions from Redis:", error);
    throw error;
  }
};

const getRedisClient = () => redisClient;

module.exports = {
  connectRedis,
  setSession,
  getSession,
  deleteSession,
  getAllActiveSessions,
  getRedisClient,
};
