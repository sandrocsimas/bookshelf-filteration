var filteration = require('../');
var knex = require('knex')({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'test',
    password: 'test',
    database: 'bookshelf_filteration'
  }
});

var Bookshelf = require('bookshelf')(knex);

filteration.useMethodFilter(true);
Bookshelf.plugin(filteration.plugin);

module.exports = Bookshelf;