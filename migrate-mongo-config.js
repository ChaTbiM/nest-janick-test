const path = require('path');

const MONGO_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/netflix';

module.exports = {
  mongodb: {
    url: MONGO_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  migrationsDir: path.join(__dirname, 'migrations'),
  changelogCollectionName: 'changelog',
};