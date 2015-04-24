var Filteration = require('../');
var knex = require('knex')({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'test',
    password: 'test',
    database: 'bookshelf_validation'
  }
});
var Bookshelf = require('bookshelf')(knex);
Bookshelf.plugin(Filteration.plugin);
module.exports = Bookshelf;