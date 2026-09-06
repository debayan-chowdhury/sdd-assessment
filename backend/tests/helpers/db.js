const mongoose = require('mongoose');

const TEST_MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27018/sdd_assessment_test';

async function connect() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }
}

async function clearDatabase() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}

async function disconnect() {
  await mongoose.connection.close();
}

module.exports = { connect, clearDatabase, disconnect };
