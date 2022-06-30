var express = require('express');
var router = express.Router();
const model = require('../model/mulpangDao');
const MyUtil = require('../utils/myutil');

/* GET home page. */
// /today.html 에서 확장자를 뗀 이유는 
// 도메인에 파일의 확장자가 보이기 때문에 보안상의 문제가 될 수 있어 생략
// 만약 public 정적파일에 같은 이름이 있다면 public의 파일 확장자(.html) 를 가져온다.
router.get('/', function(req, res, next) {
  res.redirect('/today');
});

// 오늘 메뉴
router.get('/today', async function(req, res, next) {
  const list = await model.couponList(req.query);
  res.render('today', {list: list});
});

// 쿠폰 상세조회
router.get('/coupons/:_id', async function(req, res, next) {
  var io = req.app.get('io');
  const coupon = await model.couponDetail(req.params._id, io);
  res.render('detail', {coupon : coupon, toStar : MyUtil.toStar});
});

// 구매 화면
router.get('/purchases/:_id', async function(req, res, next) {
  const coupon = await model.buyCouponForm(req.params._id);
  res.render('buy', {coupon : coupon});
});

// 구매하기
router.post('/purchase', async function(req, res, next) {
  try{
    const purchaseId = await model.buyCoupon(req.body);
    res.end(String(purchaseId));
  }catch{
    res.json({errors : {message: err.message}});
  }
});

// 근처 메뉴
router.get('/location', async function(req, res, next){
  var list = await model.couponList();
  res.render('location', {list});
});

// 추천 메뉴
router.get('/best', function(req, res, next){
  res.render('best');
});

// top5 쿠폰 조회
router.get('/topCoupon', async function(req, res, next){
  var list = await model.topCoupon(req.query.condition);
  res.json(list);
});

// 모두 메뉴
router.get('/all', async function(req, res, next){
  var list = await model.couponList(req.query);
  res.render('all', {list});
});

// 쿠폰 남은 수량 조회
router.get('/couponQuantity', async function(req, res, next){
  res.end('success');
});

// get방식으로 main 페이지를 요청하면 해당페이지로 렌더링해라.
router.get('/:page.html', function(req, res, next) {
  // today.html -> today.ejs
  res.render(req.params.page, { title: 'mulpang' });
}); 

module.exports = router;
