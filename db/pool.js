var mysql = require('mysql');

// MySQL Configuration.
var pool = mysql.createPool({
  connectionLimit: 100,
  host: process.env.C9_IP,
  user: process.env.C9_USER,
  password: '',
  database: 'c9'
});

module.exports = pool;