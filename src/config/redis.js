const redis = require("redis");

let redisClient;

const connectRedis = async () => {
  if (redisClient?.isOpen) return;
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

  await redisClient.connect().then(() => {
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

  await connectRedis();

  try {
    await redisClient.set(sessionKey, sessionData, {
      EX: 60 * 15,
    });
    await redisClient.sAdd(`user:${userId}:sessions`, jti);

    return true;
  } catch (error) {
    console.error("Error setting session in Redis:", error);
    throw error;
  }
};

const getSession = async (userId, jti) => {
  const sessionKey = `session:${userId}:${jti}`;
  await connectRedis();

  try {
    const data = await redisClient.get(sessionKey);
    if (!data) {
      await redisClient.sRem(`user:${userId}:sessions`, jti);
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Error getting session from Redis:", error);
    throw error;
  }
};

const deleteSession = async (userId) => {
  if (!userId) return false;
  await connectRedis();
  const sessionSetKey = `user:${userId}:sessions`;

  try {
    const jtis = await redisClient.sMembers(sessionSetKey);
    if (jtis.length === 0) return false;
    const keys = jtis.map((jti) => `session:${userId}:${jti}`);

    await redisClient.del(...keys);
    await redisClient.del(sessionSetKey);

    return true;
  } catch (error) {
    console.error("Error deleting session from Redis:", error);
    throw error;
  }
};
const getAllActiveSessions = async () => {
  await connectRedis();

  try {
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
