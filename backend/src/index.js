require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { startDueOrgUpdatesJob } = require('./jobs/dueOrgUpdates.job');

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27018/sdd_assessment';

connectDB(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
    startDueOrgUpdatesJob();
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
