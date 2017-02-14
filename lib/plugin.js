module.exports = function(Bookshelf) {
  'use strict';

  var proto             = Bookshelf.Model.prototype;
  var validate          = require('validate.js');
  var Promise           = require('bluebird');
  var _                 = require('lodash');
  var config            = require('./config');
  var ValidationError   = require('./validationError');

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

  var addInvalidAttributeError = function(attribute, errors) {
    errors.push({type: 'invalid', attribute: attribute, messages: ['Attribute ' + attribute + ' is required']});
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
          if(_.isUndefined(attributeValue) || _.isNull(attributeValue)) {
            if(attribute.required === true) {
              addInvalidAttributeError(attribute.name, errors);
            } else {
              filtered[attribute.name] = attributeValue;
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