var util = require('util');

function ValidationError(errors) {
  ValidationError.super_.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.errors = errors;
};
util.inherits(ValidationError, Error);

module.exports = ValidationError;