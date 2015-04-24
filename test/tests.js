var ValidationError = require('../').ValidationError,
    Bookshelf       = require('./setup'),
    expect          = require('chai').expect;

var User = Bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'user',
  validations: {
    fields: {
      first_name: {presence: true, length: {minimum: 3}},
      last_name: {presence: true, length: {minimum: 3}},
      email: {presence: true, email: true},
      password: {presence: true, length: {minimum: 3}},
      phone: {presence: true, format: /\+\d{2} \d{2} \d{4,5}\-\d{4}/}
    },
    filters: {
      insert: [{name: 'first_name', required: true}, {name: 'email', required: true}, {name: 'password', required: true}, 'last_name'],
      update: ['first_name', 'last_name', 'email', 'password', 'phone']
    }
  }
});

describe('validations', function() {
  before(function() {
    return Bookshelf.knex.schema.dropTableIfExists('user').then(function() {
      return Bookshelf.knex.schema.createTable('user', function(table) {
        table.increments('id').primary();
        table.string('first_name').notNullable();
        table.string('last_name');
        table.string('phone');
        table.string('email').notNullable();
        table.string('password').notNullable();
        table.string('avatar');
        table.boolean('verified').defaultTo(0);
        table.timestamp('registration_date').defaultTo(Bookshelf.knex.raw('now()'));
      });
    });
  });

  it('should fail when passes an empty object', function() {
    return User.forge({}).save().then(function() {
      throw new Error('User should not be saved');
    }).catch(ValidationError, function(err) {
      expect(err.errors).to.have.length(3);
      expect(err.errors[0]).to.deep.equal({type: 'required', attribute: 'first_name', errors: ['Attribute first_name is required']});
      expect(err.errors[1]).to.deep.equal({type: 'required', attribute: 'email', errors: ['Attribute email is required']});
      expect(err.errors[2]).to.deep.equal({type: 'required', attribute: 'password', errors: ['Attribute password is required']});
    });
  });

  it('should fail when required attributes is not present', function() {
    return User.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com'}).save().then(function() {
      throw new Error('User should not be saved');
    }).catch(ValidationError, function(err) {
      expect(err.errors).to.have.length(1);
      expect(err.errors[0]).to.deep.equal({type: 'required', attribute: 'password', errors: ['Attribute password is required']});
    });
  });

  it('should filters attributes on save', function() {
    return User.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com', password: '123456', phone: '3333-3333'}).save().then(function(user) {
      expect(user.get('first_name')).to.equal('Sandro');
      expect(user.get('email')).to.equal('sandro.csimas@gmail.com');
      expect(user.get('password')).to.equal('123456');
      expect(user.get('phone')).to.be.undefined;
    });
  });

  it('should fail when attributes is empty after filtering attributes on update', function() {
    return User.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com', password: '123456'}).save().then(function(user) {
      return User.forge({id: user.id, registration_date: new Date(2010, 4, 4)}).save();
    }).catch(ValidationError, function(err) {
      expect(err.errors).to.have.length(1);
      expect(err.errors[0]).to.deep.equal({type: 'update.filter.empty', errors: ['No attributes to update after filtering']});
    });
  });

  it('should filters attributes on update', function() {
    return User.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com', password: '123456'}).save().then(function(user) {
      return User.forge({id: user.id, last_name: 'Simas', registration_date: new Date(2010, 4, 4)}).save();
    }).then(function(user) {
      expect(user.get('last_name')).to.equal('Simas');
      expect(user.get('registration_date')).to.be.undefined;
    });
  });
});