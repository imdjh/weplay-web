
var browserify = require('browserify-middleware');
var express = require('express');
var redis = require('./redis')();

process.title = 'weplay-web';
var app = express();
var port = process.env.WEPLAY_WEB_PORT || 3000;
var iourl = process.env.WEPLAY_IO_URL || 'http://localhost:3001';
var siteurl = process.env.THIS_URL_PORT || 'http://localhost:3000';

// Trim double quotes
var iourl = iourl.replace(/['"]+/g, '')
var siteurl = siteurl.replace(/['"]+/g, '')


app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use('/main.js', browserify(__dirname + '/client/app.js'));

if ('development' == process.env.NODE_ENV) {
    app.use(function(req, res, next){
        req.socket.on('error', function(err){
            console.error(err.stack);
        });
    next();
    });
}

app.get('/', function(req, res, next){
  redis.get('weplay:frame', function(err, image){
    if (err) return next(err);
    redis.get('weplay:connections-total', function(err, count){
      if (err) return next(err);
      res.render('index.hbs', {
        img: image.toString('base64'),
        iourl: iourl,
        connections: count,
        siteurl: siteurl,
        siteshot: siteurl + '/screenshot.png'
      });
    });
  });
});

app.get('/screenshot.png', function(req, res, next) {
  redis.get('weplay:frame', function(err, image){
    if (err) return next(err);
    res.writeHead(200, {
      'Content-Type':'image/png',
      'Content-Length': image.length});
    res.end(image);
  });
});

app.listen(port);
console.log('Server listening on *:' + port);
