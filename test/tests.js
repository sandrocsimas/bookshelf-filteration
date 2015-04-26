var ValidationError = require('../').ValidationError,
    Bookshelf       = require('./setup'),
    models          = require('./models'),
    expect          = require('chai').expect;


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

  it('should filter attributes on save', function() {
    return models.User.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com', password: '123456', phone: '3333-3333'}).save().then(function(user) {
      expect(user.get('first_name')).to.equal('Sandro');
      expect(user.get('email')).to.equal('sandro.csimas@gmail.com');
      expect(user.get('password')).to.equal('123456');
      expect(user.get('phone')).to.be.undefined;
    });
  });

  it('should filter attributes on update', function() {
    return models.User.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com', password: '123456'}).save().then(function(user) {
      // Attribute registration_date cannot be updated
      return models.User.forge({id: user.id, last_name: 'Simas', registration_date: new Date(2010, 4, 4)}).save();
    }).then(function(user) {
      expect(user.get('last_name')).to.equal('Simas');
      expect(user.get('registration_date')).to.be.undefined;
    });
  });

  it('should filter attributes on update with patch option', function() {
    return models.User.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com', password: '123456'}).save().then(function(user) {
      // Attribute registration_date cannot be updated
      return models.User.forge({id: user.id}).save({last_name: 'Simas', registration_date: new Date(2010, 4, 4)}, {patch: true});
    }).then(function(user) {
      expect(user.get('last_name')).to.equal('Simas');
      expect(user.get('registration_date')).to.be.undefined;
    });
  });

  it('should filter attributes using a custom scenario on update', function() {
    return models.User.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com', password: '123456'}).save().then(function(user) {
      // Attribute registration_date cannot be updated
      return models.User.forge({id: user.id, last_name: 'Simas', verified: 1, avatar: 'sandro.jpg'}).save(null, {scenario: 'changeAvatar'});
    }).then(function(user) {
      expect(user.get('last_name')).to.be.undefined;
      expect(user.get('verified')).to.be.undefined;
      expect(user.get('avatar')).to.equal('sandro.jpg');
    });
  });

  it('should validate model without filtering attributes because model has no filters', function() {
    return models.UserWithNoFilters.forge({first_name: 'Sandro', last_name: 'Simas', email: 'sandro.csimas@gmail.com', password: '123456', phone: '+55 71 3333-3333'}).save().then(function(user) {
      expect(user.get('first_name')).to.equal('Sandro');
      expect(user.get('last_name')).to.equal('Simas');
      expect(user.get('email')).to.equal('sandro.csimas@gmail.com');
      expect(user.get('password')).to.equal('123456');
      expect(user.get('phone')).to.equal('+55 71 3333-3333');
    });
  });

  it('should fail with required fields errors when passes an empty object', function() {
    return models.User.forge({}).save().then(function() {
      throw new Error('User should not be saved');
    }).catch(ValidationError, function(err) {
      expect(err.errors).to.have.length(3);
      expect(err.errors[0]).to.deep.equal({type: 'required', attribute: 'first_name', messages: ['Attribute first_name is required']});
      expect(err.errors[1]).to.deep.equal({type: 'required', attribute: 'email', messages: ['Attribute email is required']});
      expect(err.errors[2]).to.deep.equal({type: 'required', attribute: 'password', messages: ['Attribute password is required']});
    });
  });

  it('should fail with required field error when attribute is not present', function() {
    return models.User.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com'}).save().then(function() {
      throw new Error('User should not be saved');
    }).catch(ValidationError, function(err) {
      expect(err.errors).to.have.length(1);
      expect(err.errors[0]).to.deep.equal({type: 'required', attribute: 'password', messages: ['Attribute password is required']});
    });
  });

  it('should fail when attribute is invalid', function() {
    return models.User.forge({first_name: 'Sandro', last_name: 'DJ', email: 'sandro.csimas@gmail.com', password: '12'}).save().then(function() {
      throw new Error('User should not be saved');
    }).catch(ValidationError, function(err) {
      expect(err.errors).to.have.length(2);
      expect(err.errors[0]).to.deep.equal({type: 'invalid', attribute: 'password', messages: ['Password is too short (minimum is 3 characters)']});
      expect(err.errors[1]).to.deep.equal({type: 'invalid', attribute: 'last_name', messages: ['Last name is too short (minimum is 3 characters)']});
    });
  });

  it('should fail when attributes is empty after filtering attributes on update', function() {
    return models.User.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com', password: '123456'}).save().then(function(user) {
      return models.User.forge({id: user.id, registration_date: new Date(2010, 4, 4)}).save();
    }).catch(ValidationError, function(err) {
      expect(err.errors).to.have.length(1);
      expect(err.errors[0]).to.deep.equal({type: 'noRemainingAttributes', messages: ['No attributes remaining after filtering']});
    });
  });

  it('should fail when passes an invalid filter scenario', function() {
    return models.User.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com', password: '123456'}).save().then(function(user) {
      return models.User.forge({id: user.id, registration_date: new Date(2010, 4, 4)}).save(null, {scenario: 'custom'});
    }).catch(ValidationError, function(err) {
      expect(err.errors).to.have.length(1);
      expect(err.errors[0]).to.deep.equal({type: 'scenario.notfound', messages: ['Scenario with name custom does not exist']});
    });
  });

  it('should fail when model has no filters and fields are not valid', function() {
    return models.UserWithNoFilters.forge({first_name: 'Sandro', email: 'sandro.csimas@gmail.com', password: '123456', phone: '+55 71 3333-3333'}).save().then(function(user) {
      throw new Error('User should not be saved');
    }).catch(ValidationError, function(err) {
      expect(err.errors).to.have.length(1);
      expect(err.errors[0]).to.deep.equal({type: 'invalid', attribute: 'last_name', messages: ['Last name can\'t be blank']});
    });
  });

});