# Bookshelf Filteration (Bookshelf + Filter + Validation)
Sometimes you don't want to save all attributes of a model. There are cases that you want to save specific attributes according to some scenario, for example an user update, an user creation, or when you want to force to update only the user avatar. Bookshelf Filteration make it easy!

Bookshelf-filteration also uses validate.js to validate your model attributes with the difference that only filtered attributes will be validated.

# Installation
````
npm install bookshelf-filteration
````

# Configuration
You can set Bookshelf Filteration to use insert and update methods as filter scenarios when no scenario is provided.
````
var filteration = require('bookshelf-filteration');
filteration.useDefaultFilters(true);
Bookshelf.plugin(filteration);
````

# Filtering attributes
You can provide lists of attributes that will be used to do inserts or updates according to scenario provided in save options. Attributes that are not present in list are excluded from model and will not be inserted or updated. This list can contain Strings or Objects with name and required attributes.
The required attribute defines if the attribute is mandatory for that scenario and will throw ValidationError when an attribute is required, but is not present on model attributes.

````
var User = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  filters: {
    // Insert scenario (used when a model will be inserted and you configured to use method filter)
    insert: [{name: 'first_name', required: true}, {name: 'email', required: true}, {name: 'password', required: true}, 'last_name'],
    // Update scenario (used when a model will be updated and you configured to use method filter)
    update: ['first_name', 'last_name', 'email', 'password', 'phone'],
    // Custom scenario (used when passes the option scenario)
    changeAvatar: ['avatar']
  }
});
````

# Validating attributes example:
The validation will be applied only to remaining attributes after filtering. If filters are not provided, only model attributes will be considered, in other words, not all validations declared will be used.

````
var User = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  validations: {
    first_name: {presence: true, length: {minimum: 3}},
    last_name: {length: {minimum: 3}},
    email: {presence: true, email: true},
    password: {presence: true, length: {minimum: 3}},
    phone: {format: /\+\d{8,16}/}
  }
});
````

# Combining filters and validations example:
````
var User = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  validations: {
    first_name: {presence: true, length: {minimum: 3}},
    last_name: {length: {minimum: 3}},
    email: {presence: true, email: true},
    password: {presence: true, length: {minimum: 3}},
    phone: {format: /\+\d{8,16}/}
  },
  filters: {
    insert: [{name: 'first_name', required: true}, {name: 'email', required: true}, {name: 'password', required: true}, 'last_name'],
    update: ['first_name', 'last_name', 'email', 'password', 'phone'],
    changeAvatar: ['avatar']
  }
});
````