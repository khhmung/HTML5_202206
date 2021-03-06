var express = require('express');
var router = express.Router();
var model = require('../model/mulpangDao');
const MyUtil = require('../utils/myutil');
const checkLogin = require('../middleware/checklogin');

// 회원 가입 화면
router.get('/new', function(req, res, next) {
  res.render('join');
}); 

// 프로필 이미지 업로드
var path = require('path');
var tmp = path.join(__dirname, '..', 'public', 'tmp');
var multer = require('multer');
router.post('/profileUpload', multer({dest : tmp}).single('profile'), function(req, res, next) {
  res.end(req.file.filename);   // 임시 파일명 응답
});

// 회원 가입 요청
router.post('/new', async function(req, res, next) {
  try{
    const email = await model.registMember(req.body);
    res.end(String(email));
  }catch{
     next(err);
  }
});

// 간편 로그인
router.post('/simpleLogin', async function(req, res, next) {
  try{
    const user = await model.login(req.body);
    req.session.user = user;
    res.json(user);
  }catch{
     next(err);
  }
});

// 로그아웃
router.get('/logout', function(req, res, next) {
  req.session.destroy(); // 세션 객체 제거
  res.redirect('/');
});

// 로그인 화면
router.get('/login', function(req, res, next) {
  res.render('login');
});

// 로그인
router.post('/login', async function(req, res, next) {
  try{
    const user = await model.login(req.body);
    req.session.user = user;
    res.redirect(req.session.backurl || '/');   // 이전 유효성 체크했던 페이지(구매하기/상품)로 이동
  }catch(err){
    res.render('login', {errors: {message: err.message}});
  }
});

// 마이 페이지
router.get('/', checkLogin, async function(req, res, next) {
  var userId = req.session.user._id;
  var list  = await model.getMember(userId);
  res.render('mypage', {purchases: list, toStar: MyUtil.toStar});
});

// 회원 정보 수정
router.put('/', checkLogin, async function(req, res, next) {
  var userId = req.session.user._id;
  try{
    await model.updateMember(userId, req.body);
    res.end('success');
  }catch{
     next(err);
  }
});

// 구매 후기 등록
router.post('/epilogue', checkLogin, async function(req, res, next) {
  var userId = req.session.user._id;
  try{
    var epilogueId = await model.insertEpilogue(userId, req.body);
    res.end(String(epilogueId));
  }catch{
     next(err);
  }
});

module.exports = router;
