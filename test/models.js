var Bookshelf = require('./setup').Bookshelf;

var User = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user'
});

var UserWithValidations = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  validations: {
    first_name: {presence: true, length: {minimum: 3}},
    last_name: {length: {minimum: 3}},
    email: {email: true},
    phone: {format: /\+\d{8,16}/},
    password: {presence: true, length: {minimum: 3}}
  }
});

var UserWithFilters = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  filters: {
    insert: [{name: 'first_name', required: true}, {name: 'password', required: true}, 'last_name', 'email', 'phone'],
    update: ['first_name', 'last_name', 'email', 'phone'],
    changeAvatar: ['avatar']
  }
});

var UserWithFiltersAndValidations = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  validations: {
    first_name: {presence: true, length: {minimum: 3}},
    last_name: {length: {minimum: 3}},
    email: {email: true},
    phone: {format: /\+\d{8,16}/},
    password: {presence: true, length: {minimum: 3}}
  },
  filters: {
    insert: [{name: 'first_name', required: true}, {name: 'password', required: true}, 'last_name', 'email', 'phone'],
    update: ['first_name', 'last_name', 'email', 'phone'],
    changeAvatar: ['avatar']
  }
});

module.exports = {
  User: User,
  UserWithFilters: UserWithFilters,
  UserWithValidations: UserWithValidations,
  UserWithFiltersAndValidations: UserWithFiltersAndValidations
};