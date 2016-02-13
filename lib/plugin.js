module.exports = function(Bookshelf) {
  'use strict';

  var proto             = Bookshelf.Model.prototype;
  var validate          = require('validate.js');
  var Promise           = require('bluebird');
  var _                 = require('lodash');
  var config            = require('./config');
  var ValidationError   = require('./validationError');

  var EMPTY_STRING_REGEXP = /^\s*$/;

  validate.validators.notBlank = function(value, options) {
    if(options === true || options) {
      if (_.isString(value) && EMPTY_STRING_REGEXP.test(value)) {
        return options.message || 'can\'t be blank';
      }
    }
  };

  var getFilter = function(model, options) {
    var scenario = null;
    if(model.filters) {
      if(options.scenario) {
        scenario = model.filters[options.scenario];
        if(!scenario) {
          throw new ValidationError([{type: 'scenario.notfound', messages: ['Scenario with name ' + options.scenario + ' does not exist']}]);
        }
      } else if(config.usingDefaultFilters() === true) {
        scenario = model.filters[options.method];
      }
    }
    return scenario;
  };
  var addRequiredError = function(attribute, errors) {
    errors.push({type: 'required', attribute: attribute, messages: ['Attribute ' + attribute + ' is required']});
  };
  var validateAddingErrors = function(attributes, validations, errors) {
    var attributesWithError = validate(attributes, validations);
    _.each(attributesWithError, function(attributeErrors, attributeName) {
      errors.push({type: 'invalid', attribute: attributeName, messages: attributeErrors});
    });
  };
  var assertNoErrors = function(errors) {
    if(!_.isEmpty(errors)) {
      throw new ValidationError(errors);
    }
  };
  var assertNotEmpty = function(attributes) {
    if(_.isEmpty(attributes)) {
      throw new ValidationError([{type: 'nothingToSave', messages: ['No attributes remaining after filtering']}]);
    }
  };
  var deleteUnfiltered = function(model, attributes, filtered, patchAttributes) {
    _.each(attributes, function(value, key) {
      if(!_.has(filtered, key)) {
        delete attributes[key];
        if(patchAttributes === true) {
          delete model.attributes[key];
        }
      }
    });
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
      var validations = model.validations;
      var filter = getFilter(model, options) || _.keys(attributes);
      var filtered = {};
      var errors = [];
      filter.forEach(function(attribute) {
        if(_.isObject(attribute)) {
          var attributeValue = attributes[attribute.name];
          if(_.isUndefined(attributeValue)) {
            if(attribute.required === true) {
              addRequiredError(attribute.name, errors);
            }
          } else {
            filtered[attribute.name] = attributeValue;
          }
        } else {
          var attributeValue = attributes[attribute];
          if(!_.isUndefined(attributeValue)) {
            filtered[attribute] = attributeValue;
          }
        }
      });
      if(validations) {
        var filteredValidations = _.pick(validations, _.keys(filtered));
        validateAddingErrors(filtered, filteredValidations, errors);
      }
      assertNoErrors(errors);
      deleteUnfiltered(model, attributes, filtered, patchAttributes);
      assertNotEmpty(attributes);
    })
  });

  Bookshelf.Model = Model;
};