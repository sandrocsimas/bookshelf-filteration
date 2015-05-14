var Bookshelf = require('./setup').Bookshelf;

var User = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  validations: {
    first_name: {presence: true, length: {minimum: 3}},
    last_name: {notBlank: true, length: {minimum: 3}},
    email: {presence: true, email: true},
    password: {presence: true, length: {minimum: 3}},
    phone: {format: /\+\d{2} \d{2} \d{4,5}\-\d{4}/}
  },
  filters: {
    insert: [{name: 'first_name', required: true}, {name: 'email', required: true}, {name: 'password', required: true}, 'last_name', 'verified'],
    update: ['first_name', 'last_name', 'email', 'password', 'phone'],
    changeAvatar: ['avatar']
  }
});

var UserWithNoFilters = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  validations: {
    first_name: {presence: true, length: {minimum: 3}},
    last_name: {notBlank: true, length: {minimum: 3}},
    email: {presence: true, email: true},
    password: {presence: true, length: {minimum: 3}},
    phone: {format: /\+\d{2} \d{2} \d{4,5}\-\d{4}/}
  }
});

var UserWithNoValidations = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  filters: {
    insert: [{name: 'first_name', required: true}, {name: 'email', required: true}, {name: 'password', required: true}, 'last_name', 'verified'],
    update: ['first_name', 'last_name', 'email', 'password', 'phone'],
    changeAvatar: ['avatar']
  }
});

var UserWithNoFiltersAndValidations = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user'
});

module.exports = {
  User: User,
  UserWithNoFilters: UserWithNoFilters,
  UserWithNoValidations: UserWithNoValidations,
  UserWithNoFiltersAndValidations: UserWithNoFiltersAndValidations
};