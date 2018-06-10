  var envConfig = require('./config.json')[process.env.NODE_ENV || 'development'];
  Object.keys(envConfig).forEach((key) => {
    process.env[key] = envConfig[key];
  });

