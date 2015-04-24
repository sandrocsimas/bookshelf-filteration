module.exports = function(Bookshelf) {
  "use strict";

  var proto           = Bookshelf.Model.prototype;
  var validate        = require('validate.js');
  var Promise         = require('bluebird');
  var _               = require('underscore');
  var ValidationError = require('./validationError');

  var getValidations = function(instance) {
    return instance.validations;
  };
  var getFilter = function(instance, options) {
    var scenario = null;
    if(instance.filters) {
      if(options.scenario && !instance.filters[options.scenario]) {
        throw new ValidationError({type: 'scenario.notfound', errors: ['Scenario with name ' + options.scenario + ' does not exist']});
      }
      scenario = instance.filters[options.scenario || options.method];
    }
    return scenario;
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
  var requiredError = function(errors, attribute) {
    addError(errors, {type: 'required', attribute: attribute, errors: ['Attribute ' + attribute + ' is required']});
  };

  var Model = Bookshelf.Model.extend({
    constructor: function(attributes, options) {
      proto.constructor.apply(this, arguments);
      this.on('saving', function(model, attrs, options) {
        return this.validate(model, attrs, options);
      });
    },
    validate: Promise.method(function(model, attrs, options) {
      var patchAttributes = options.method === 'update' && options.patch;
      var attributes = patchAttributes === true ? attrs : model.attributes;
      var validations = getValidations(this);
      var filter = getFilter(this, options);
      var errors = [];
      console.log(filter)
      if(!filter) {
        if(validations) {
          var errors = validate(attributes, validations);
          if(errors.length > 0) {
            throw new ValidationError(errors);
          }
        }
      } else {
        var filtered = {};
        filter.forEach(function(attribute) {
          if(_.isObject(attribute)) {
            var attributeValue = attributes[attribute.name];
            if(_.isUndefined(attributeValue)) {
              if(attribute.required === true) {
                addError(errors, requiredError(errors, attribute.name));
              }
            } else {
              addError(errors, validateSingle(attribute.name, attributeValue, validations));
              filtered[attribute.name] = attributeValue;
            }
          } else {
            var attributeValue = attributes[attribute];
            if(!_.isUndefined(attributeValue)) {
              addError(errors, validateSingle(attribute, attributeValue, validations));
              filtered[attribute] = attributeValue;
            }
          }
        });
        if(errors.length > 0) {
          throw new ValidationError(errors);
        } 
        _.each(_.keys(attributes), function(attr) {
          if(!filtered[attr]) {
            delete attributes[attr];
            if(patchAttributes === true) {
              delete model.attributes[attr];
            }
          }
        });
        if(_.size(attributes) === 0) {
          throw new ValidationError([{type: options.method + '.filter.empty', errors: ['No attributes to ' + options.method + ' after filtering']}]);
        } 
      }
    })
  });

  Bookshelf.Model = Model;
};