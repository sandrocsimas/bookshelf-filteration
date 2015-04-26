module.exports = function(Bookshelf) {
  "use strict";

  var proto             = Bookshelf.Model.prototype;
  var validate          = require('validate.js');
  var Promise           = require('bluebird');
  var _                 = require('underscore');
  var config            = require('./config');
  var ValidationError   = require('./validationError');

  var getFilter = function(model, options) {
    var scenario = null;
    if(model.filters) {
      if(options.scenario) {
        scenario = model.filters[options.scenario];
        if(!scenario) {
          throw new ValidationError([{type: 'scenario.notfound', errors: ['Scenario with name ' + options.scenario + ' does not exist']}]);
        }
      } else if(config.usingMethodFilter() === true) {
        scenario = model.filters[options.method];
      }
    }
    return scenario;
  };
  var addRequiredError = function(attribute, errors) {
    errors.push({type: 'required', attribute: attribute, errors: ['Attribute ' + attribute + ' is required']});
  };
  var validateAddingErrors = function(attributes, validations, errors) {
    var attributesWithError = validate(attributes, validations);
    _.each(attributesWithError, function(attributeErrors, attributeName) {
      errors.push({type: 'invalid', attribute: attributeName, errors: attributeErrors});
    });
  };
  var assertNoErrors = function(errors) {
    if(errors.length > 0) {
      throw new ValidationError(errors);
    }
  };
  var assertNotEmpty = function(attributes) {
    if(_.size(attributes) === 0) {
      throw new ValidationError([{type: 'filter.empty', errors: ['No attributes remaining after filtering']}]);
    }
  };
  var deleteUnfiltered = function(model, attributes, filtered, patchAttributes) {
    _.each(attributes, function(value, key) {
      if(!filtered[key]) {
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
      var filter = getFilter(model, options);
      if(!filter && validations) {
        var errors = [];
        validateAddingErrors(attributes, validations, errors);
        assertNoErrors(errors);
      } else if(validations) {
        var errors = [];
        var filtered = {};
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
        var filteredValidations = _.pick(validations, _.keys(filtered));
        validateAddingErrors(filtered, filteredValidations, errors);
        assertNoErrors(errors);
        deleteUnfiltered(model, attributes, filtered, patchAttributes);
        assertNotEmpty(attributes);
      }
    })
  });

  Bookshelf.Model = Model;
};