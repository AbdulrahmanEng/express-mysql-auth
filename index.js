var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');

var db = require('./db/pool');

var app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static('public'));
app.use(session({
  secret: 'emerald',
  resave: false,
  saveUninitialized: true
}));

// Authentication middleware for protected routes.
function authenticateRoute(req, res, next) {
  if (req.session.user) {
    next();
  }
  else {
    res.redirect('/login');
  }
}

app.get('/', (req, res) => {
  res.render('home', {user: req.session.user});
});

// Sign In Routes.
app.get('/login', (req, res) => {
  res.render('login', {
    flash: null
  });
});
app.post('/login', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  var loginPromise = new Promise((resolve, reject) => {

    db.query('SELECT * FROM Users WHERE username = ?', [username], function(error, results, fields) {
      if (error) {
        throw error;
      }
      else {
        var row = results[0];
        resolve(row);
      }
    });
  });
  loginPromise.then((data) => {
    if (data === undefined) {
      res.render('login', {
        flash: {
          message: 'User not found'
        }
      });
    }
    else {
      bcrypt.compare(password, data.password, function(err, result) {
        if (err) throw err;
        if (result === true) {
          req.session.user = {
            username: data.username,
            join_date: data.join_date
          };
          res.redirect('/');
        }
        else {
          res.redirect('/login');
        }
      });
    }
  });

});

// Sign Out Route.
app.get('/signout', (req, res) => {
  req.session.destroy;
  res.redirect('/login');
});

// Registration Routes.
app.get('/signup', (req, res) => {
  res.render('signup', {
    flash: null
  });
});
app.post('/signup', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  bcrypt.genSalt(10, function(err, salt) {
    if (err) {
      throw err;
    }
    bcrypt.hash(password, salt, function(err, hash) {
      if (err) {
        throw err;
      }
      // Stores username and password in MySQL database.
      const registrationPromise = new Promise((resolve, reject) => {
        // If user exists render signup page with flash message.
        db.query('SELECT * FROM Users WHERE username = ?', [username], function(error, results, fields) {
          if (error) {
            throw error;
          }
          if (results.length > 0) {
            res.render('signup', {
              flash: {
                message: 'Username is taken'
              }
            });
          }
          else {
            db.query('INSERT INTO Users(username, password, join_date) VALUES (?, ?, ?)', [username, hash, new Date()], function(error, results, fields) {
              if (error) {
                throw error;
              }
              resolve(results);
            });
          }
        });
      });
      registrationPromise.then((data) => {
        res.redirect('/login');
      });
    });
  });

});

// Restricted Route.
app.get('/restricted', authenticateRoute, (req, res) => {
  res.render('restricted', {
    user: req.session.user
  });
});

app.listen(8080, () => console.log('Listening on port 8080'));