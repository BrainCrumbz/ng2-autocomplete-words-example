var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var errorhandler = require('errorhandler');
var morgan = require('morgan');

var webpackCommon = require(path.resolve('./webpack.common.js'));
var packageDef = require(path.resolve('./package.json'));

var router = require('./router');

// Env
var userEnv = process.env;
var nodeEnv = userEnv.NODE_ENV || 'development';

var isDevelopment = nodeEnv === 'development';
var isTest = nodeEnv === 'test';
var isProduction = nodeEnv === 'production';

var serverPort = userEnv.PORT || webpackCommon.ports.default;

var clientOutputPath = webpackCommon.paths.buildOutput;

var staticFilesPath = path.resolve(__dirname, 'public');
var viewRoot = path.resolve(__dirname, 'areas');

// Express App
var app = express();

// Serve web static files
app.use(express.static(staticFilesPath));

// Serve client compiled files
app.use(express.static(clientOutputPath));

// Set handlebars view engine
var hsbExt = '.hbs';
app.engine(hsbExt, exphbs({ 
  extname: hsbExt, 
  partialsDir: viewRoot,
  layoutsDir: path.resolve(viewRoot, 'layouts'),
  defaultLayout: 'main',
}));
app.set('views', viewRoot);
app.set('view engine', hsbExt);

// Log HTTP requests
app.use(morgan('dev'));

// Process contents in request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Process cookies
app.use(cookieParser());

// Set available routes
app.use('/', router);

if (isDevelopment) {
  // only use in development 
  app.use(errorhandler());
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
    });
});

var server = app.listen(serverPort, function onStart(err) {
  if (err) {
    console.log(err);
  }
  
  var port = server.address().port;
  var version = packageDef.version;
  
  console.log('Server listening on port: %s, version \'%s\', environment: \'%s\'. Open up http://localhost:%s/ in your browser.\n', 
    port, version, nodeEnv, port);
});
