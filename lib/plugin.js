module.exports = function(Bookshelf) {
  "use strict";

  var proto           = Bookshelf.Model.prototype;
  var validate        = require('validate.js');
  var Promise         = require('bluebird');
  var _               = require('underscore');
  var ValidationError = require('./validationError');

  var getFieldsValidations = function(instance) {
    return instance.validations ? instance.validations.fields : null;
  };
  var getFilter = function(instance, method) {
    return instance.validations && instance.validations.filters ? instance.validations.filters[method] : null;
  };
  var validateSingle = function(attribute, value, validations) {
    var result = null;
    if(validations && validations[attribute]) {
      var errors = validate.single(value, validations[attribute]);
      if(errors && errors.length > 0) {
        result = {type: 'invalid', attribute: attribute, errors: errors};
      }
    }
    return result;
  };
  var addError = function(errors, error) {
    if(error) {
      errors.push(error);
    }
  };
  var addRequiredError = function(errors, attribute) {
    errors.push({type: 'required', attribute: attribute, errors: ['Attribute ' + attribute + ' is required']});
  };

  var Model = Bookshelf.Model.extend({
    constructor: function(attributes, options) {
      proto.constructor.apply(this, arguments);
      this.on('saving', function(model, attrs, options) {
        return this.validate(options.method);
      });
    },
    validate: function(method) {
      var that = this;
      return new Promise(function(resolve, reject) {
        var validations = getFieldsValidations(that);
        var filter = getFilter(that, method);
        var errors = [];
        if(filter) {
          var filtered = {};
          filter.forEach(function(attribute) {
            if(_.isObject(attribute)) {
              var attributeValue = that.attributes[attribute.name];
              if(_.isUndefined(attributeValue)) {
                if(attribute.required === true) {
                  addError(errors, addRequiredError(errors, attribute.name));
                }
              } else {
                addError(errors, validateSingle(attribute.name, attributeValue, validations));
                filtered[attribute.name] = attributeValue;
              }
            } else {
              var attributeValue = that.attributes[attribute];
              if(!_.isUndefined(attributeValue)) {
                addError(errors, validateSingle(attribute, attributeValue, validations));
                filtered[attribute] = attributeValue;
              }
            }
          });
          if(errors.length > 0) {
            reject(new ValidationError(errors));
          } else {
            _.each(_.keys(that.attributes), function(attr) {
              if(!filtered[attr]) {
                delete that.attributes[attr];
              }
            });
            if(_.size(that.attributes) === 0) {
              reject(new ValidationError([{type: method + '.filter.empty', errors: ['No attributes to ' + method + ' after filtering']}]));
            } else {
              resolve();

            }
          }
        } else {
          var errors = validate(that.attributes, validations);
          if(errors.length > 0) {
            reject(new ValidationError(errors));
          } else {
            resolve();
          }
        }
      });
    }
  });

  Bookshelf.Model = Model;
};