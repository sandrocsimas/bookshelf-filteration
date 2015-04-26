module.exports = {
  plugin: require('./lib/plugin'),
  useMethodFilter: require('./lib/config').useMethodFilter,
  ValidationError: require('./lib/validationError')
};