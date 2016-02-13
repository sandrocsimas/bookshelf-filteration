module.exports = {
  plugin: require('./lib/plugin'),
  useDefaultFilters: require('./lib/config').useDefaultFilters,
  ValidationError: require('./lib/validationError')
};