var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(미들웨어);
// 순서대로 처리한다.
// app.use(logger('dev'));  // 로그를 제일 먼저 놓게 되면 정적인 파일 가져오는 것도 찍히기 때문에 불필요한 내용도 찍힌다.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));  // 파일 형식으로 저장되어있는 정적인 파일을 찾아라!

app.use(logger('dev')); // 동적인 파일만 로그에 찍히도록 한다.

app.use('/', indexRouter); // public 에서 못찾았으면 / 에서 찾아라!
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404, req.url + ' Not Found!'));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  console.error(err.stack);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
