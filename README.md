# Bookshelf Filteration (Filter + Validation)
Sometime you don't want to save all attributes of a model. There are cases that you want to save specific attributes according to scenario, for example an user update, an user creation, or when you want to force a avatar only edition.

Bookshelf-filteration also uses validate.js to validate your model attributes with the difference that only filtered attributes will be validated in the case of filter presence.

# Filtering attributes example:
````
var User = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  filters: {
    // Insert scenario (used when a model will be inserted)
    insert: [{name: 'first_name', required: true}, {name: 'email', required: true}, {name: 'password', required: true}, 'last_name'],
    // Update scenario (used when a model will be updated)
    update: ['first_name', 'last_name', 'email', 'password', 'phone'],
    // Custom scenario (used when passes the option scenario)
    changeAvatar: ['avatar']
  }
});
````

# Validating attributes example:
````
var User = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  // With no filters all attributes will be validated, independent of scenatio.
  validations: {
    first_name: {presence: true, length: {minimum: 3}},
    last_name: {length: {minimum: 3}},
    email: {presence: true, email: true},
    password: {presence: true, length: {minimum: 3}},
    phone: {format: /\+\d{2} \d{2} \d{4,5}\-\d{4}/}
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
    phone: {format: /\+\d{2} \d{2} \d{4,5}\-\d{4}/}
  },
  filters: {
    insert: [{name: 'first_name', required: true}, {name: 'email', required: true}, {name: 'password', required: true}, 'last_name'],
    update: ['first_name', 'last_name', 'email', 'password', 'phone'],
    changeAvatar: ['avatar']
  }
});
````

# Why the required feature if validate.js has the presence validation?

The presence validation considers that null, blank are valid, regardless of others attribute validations. The problem is that sometimes you want to accept null values but not blanks.
Example using validate.js:
````
validate({first_name: 'Sandro', last_name: 'Simas'}, {length: {minimum: 3}});
// [] OK, last_name in user table will be updated to 'Simas'
````
````
validate({first_name: 'Sandro', last_name: null}, {length: {minimum: 3}});
// [] OK, last_name in user table will be updated to null
````
validate({first_name: 'Sandro', last_name: ''}, {length: {minimum: 3}});
// [] Not OK because we expect a validation error since 0 length is less than 3
````

