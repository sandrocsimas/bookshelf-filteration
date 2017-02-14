var ValidationError = require('../').ValidationError,
    setup           = require('./setup'),
    models          = require('./models'),
    assert          = require('chai').assert;

describe('validations', function() {

  beforeEach(function() {
    return setup.createSchema();
  });

  it('should save user wihout filter and validations', function() {
    return models.User.forge({first_name: 'Sandro', last_name: 'Simas', email: 'sandro@email.com', password: '123456', phone: '+557133333333', avatar: 'avatar.jpg'}).save().then(function() {
      return models.User.forge({id: 1}).fetch();
    }).then(function(user) {
      assert.strictEqual(user.get('first_name'), 'Sandro');
      assert.strictEqual(user.get('last_name'), 'Simas');
      assert.strictEqual(user.get('email'), 'sandro@email.com');
      assert.strictEqual(user.get('password'), '123456');
      assert.strictEqual(user.get('phone'), '+557133333333');
      assert.strictEqual(user.get('avatar'), 'avatar.jpg');
    });
  });

  it('should filter attributes when saving user', function() {
    // Attribute avatar should be removed
    return models.UserWithFilters.forge({first_name: 'Sandro', last_name: 'Simas', email: 'sandro@email.com', phone: '+557133333333', password: '123456', avatar: 'avatar.jpg'}).save().then(function() {
      return models.UserWithFilters.forge({id: 1}).fetch();
    }).then(function(user) {
      assert.strictEqual(user.get('first_name'), 'Sandro');
      assert.strictEqual(user.get('last_name'), 'Simas');
      assert.strictEqual(user.get('email'), 'sandro@email.com');
      assert.strictEqual(user.get('password'), '123456');
      assert.strictEqual(user.get('phone'), '+557133333333');
      assert.isNull(user.get('avatar'));
    });
  });

  it('should filter attributes when updating user', function() {
    // Attribute password cannot be updated
    return models.UserWithFilters.forge({first_name: 'Sandro', last_name: 'Simas', email: 'sandro@email.com', phone: '+557133333333', password: '123456'}).save().then(function(user) {
      return models.UserWithFilters.forge({id: user.id, first_name: 'vesGuIM', password: '1234567'}).save();
    }).then(function() {
      return models.UserWithFilters.forge({id: 1}).fetch();
    }).then(function(user) {
      assert.strictEqual(user.get('first_name'), 'vesGuIM');
      assert.strictEqual(user.get('password'), '123456');
    });
  });

  it('should filter attributes when updating user with patch option', function() {
    // Attribute password cannot be updated
    return models.UserWithFilters.forge({first_name: 'Sandro', last_name: 'Simas', email: 'sandro@email.com', phone: '+557133333333', password: '123456'}).save().then(function(user) {
      return models.UserWithFilters.forge({id: user.id}).save({first_name: 'vesGuIM', password: '1234567'}, {patch: true});
    }).then(function() {
      return models.UserWithFilters.forge({id: 1}).fetch();
    }).then(function(user) {
      assert.strictEqual(user.get('first_name'), 'vesGuIM');
      assert.strictEqual(user.get('password'), '123456');
    });
  });

  it('should update attribute to null because email validation accepts null', function() {
    // Attribute email can updated to null because email validation only checks defined values
    return models.UserWithFiltersAndValidations.forge({first_name: 'Sandro', last_name: 'Simas', email: 'sandro@email.com', phone: '+557133333333', password: '123456'}).save().then(function(user) {
      return models.UserWithFiltersAndValidations.forge({id: user.id}).save({email: null}, {patch: true});
    }).then(function() {
      return models.UserWithFilters.forge({id: 1}).fetch();
    }).then(function(user) {
      assert.isNull(user.get('email'));
    });
  });

  it('should not update attribute to empty because of email validation', function() {
    // Attribute email can not be updated to empty string because of email validation
    return models.UserWithFiltersAndValidations.forge({first_name: 'Sandro', last_name: 'Simas', email: 'sandro@email.com', phone: '+557133333333', password: '123456'}).save().then(function(user) {
      return models.UserWithFiltersAndValidations.forge({id: user.id}).save({email: ''}, {patch: true});
    }).catch(ValidationError, function(err) {
      assert.lengthOf(err.errors, 1);
      assert.deepEqual(err.errors[0], {type: 'invalid', attribute: 'email', messages: ['Email is not a valid email']});
      return models.UserWithFilters.forge({id: 1}).fetch();
    }).then(function(user) {
      assert.strictEqual(user.get('email'), 'sandro@email.com');
    });
  });

  it('should not update attribute to blank because of email validation', function() {
    return models.UserWithFiltersAndValidations.forge({first_name: 'Sandro', last_name: 'Simas', email: 'sandro@email.com', phone: '+557133333333', password: '123456'}).save().then(function(user) {
      // Attribute email can not be updated to blank string because of email validation
      return models.UserWithFiltersAndValidations.forge({id: user.id}).save({email: '       '}, {patch: true});
    }).catch(ValidationError, function(err) {
      assert.lengthOf(err.errors, 1);
      assert.deepEqual(err.errors[0], {type: 'invalid', attribute: 'email', messages: ['Email is not a valid email']});
      return models.UserWithFilters.forge({id: 1}).fetch();
    }).then(function(user) {
      assert.strictEqual(user.get('email'), 'sandro@email.com');
    });
  });

  it('should filter attributes using a custom scenario when updating', function() {
    return models.UserWithFiltersAndValidations.forge({first_name: 'Sandro', last_name: 'Simas', email: 'sandro@email.com', phone: '+557133333333', password: '123456'}).save().then(function(user) {
      return models.UserWithFiltersAndValidations.forge({id: user.id, first_name: 'vesGuIM', avatar: 'avatar.jpg'}).save(null, {scenario: 'changeAvatar'});
    }).then(function(user) {
      return models.UserWithFilters.forge({id: 1}).fetch();
    }).then(function(user) {
      assert.strictEqual(user.get('first_name'), 'Sandro');
      assert.strictEqual(user.get('avatar'), 'avatar.jpg');
    });
  });

  it('should fail with required fields errors when passes an empty object', function() {
    return models.UserWithFiltersAndValidations.forge({}).save().then(function() {
      throw new Error('User should not be saved');
    }).catch(ValidationError, function(err) {
      assert.lengthOf(err.errors, 2);
      assert.deepEqual(err.errors[0], {type: 'invalid', attribute: 'first_name', messages: ['Attribute first_name is required']});
      assert.deepEqual(err.errors[1], {type: 'invalid', attribute: 'password', messages: ['Attribute password is required']});
    })
  });

  it('should fail with required field error when attribute is not present', function() {
    return models.UserWithFiltersAndValidations.forge({first_name: 'Sandro', email: 'sandro@email.com'}).save().then(function() {
      throw new Error('User should not be saved');
    }).catch(ValidationError, function(err) {
      assert.lengthOf(err.errors, 1);
      assert.deepEqual(err.errors[0], {type: 'invalid', attribute: 'password', messages: ['Attribute password is required']});
    });
  });

  it('should fail when attribute is invalid', function() {
    return models.UserWithFiltersAndValidations.forge({first_name: 'Sandro', last_name: 'DJ', email: 'sandro@email.com', password: '12'}).save().then(function() {
      throw new Error('User should not be saved');
    }).catch(ValidationError, function(err) {
      assert.lengthOf(err.errors, 2);
      assert.deepEqual(err.errors[0], {type: 'invalid', attribute: 'password', messages: ['Password is too short (minimum is 3 characters)']});
      assert.deepEqual(err.errors[1], {type: 'invalid', attribute: 'last_name', messages: ['Last name is too short (minimum is 3 characters)']});
    });
  });

  it('should fail when attributes is empty after filtering attributes on update', function() {
    return models.UserWithFiltersAndValidations.forge({first_name: 'Sandro', email: 'sandro@email.com', password: '123456'}).save().then(function(user) {
      return models.UserWithFiltersAndValidations.forge({id: user.id, registration_date: new Date(2010, 4, 4)}).save();
    }).catch(ValidationError, function(err) {
      assert.lengthOf(err.errors, 1);
      assert.deepEqual(err.errors[0], {type: 'nothingToSave', messages: ['No attributes remaining after filtering']});
    });
  });

  it('should fail when passes an invalid filter scenario', function() {
    return models.UserWithFiltersAndValidations.forge({first_name: 'Sandro', email: 'sandro@email.com', password: '123456'}).save().then(function(user) {
      return models.UserWithFiltersAndValidations.forge({id: user.id, registration_date: new Date(2010, 4, 4)}).save(null, {scenario: 'custom'});
    }).catch(ValidationError, function(err) {
      assert.lengthOf(err.errors, 1);
      assert.deepEqual(err.errors[0], {type: 'scenario.notfound', messages: ['Scenario with name custom does not exist']});
    });
  });

  it('should validate only instance attributes when model has no filters', function() {
    return models.UserWithValidations.forge({first_name: 'Sandro', email: 'sandro@email.com', password: '123456', phone: '3333-3333'}).save().then(function(user) {
      throw new Error('User should not be saved');
    }).catch(ValidationError, function(err) {
      assert.lengthOf(err.errors, 1);
      assert.deepEqual(err.errors[0], {attribute: 'phone', type: 'invalid', messages: ['Phone is invalid']});
    });
  });
});