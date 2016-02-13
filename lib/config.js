var defaultFilters = false;

exports.useDefaultFilters = function(value) {
  defaultFilters = value;
};
exports.usingDefaultFilters = function() {
  return defaultFilters;
};