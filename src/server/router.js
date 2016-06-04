var express = require('express');

var router = express.Router();

// This responds a GET request on the homepage
router.get('/', function(req, res) {
  console.log('Cookies: ', req.cookies);
  res.render('home/index');
});

router.get('/home', function(req, res) {
  res.render('home/index');
});

router.get('/users', function(req, res) {
  res.render('users/index');
});

// Proxy unmatched GET html requests (assuming they can be client-side HTML5 routes) to client homepage
router.get('/*', function (req, res) {
  if (req.accepts('html')) {
    console.log('Redirecting unmatched HTML GET request to home');
    res.render('home/index');
  }
});

module.exports = router;    
