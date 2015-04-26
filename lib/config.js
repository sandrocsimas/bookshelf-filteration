var methodFilter = false;

exports.useMethodFilter = function(value) {
  methodFilter = value;
};
exports.usingMethodFilter = function() {
  return methodFilter;
};