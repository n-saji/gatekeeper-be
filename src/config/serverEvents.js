const { getRedisClient } = require("./redis");

let publisher;
let subscriber;

const connectPublisherSubscriber = async () => {
  const redisClient = getRedisClient();
  if (!redisClient || !redisClient.isOpen) {
    await connectRedis();
  }
  publisher = redisClient.duplicate();
  publisher.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
  await publisher.connect();

  subscriber = redisClient.duplicate();
  subscriber.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
  await subscriber.connect();

  await subscriber.subscribe("force-logout", async (message) => {
    const { userId } = JSON.parse(message);
    const sessions = await redisClient.sMembers(`session:${userId}:all`);
    for (let jti of sessions) {
      await redisClient.del(`session:${userId}:${jti}`);
    }
  });
};

const getPublisher = () => publisher;
const getSubscriber = () => subscriber;

module.exports = { connectPublisherSubscriber, getPublisher, getSubscriber };
