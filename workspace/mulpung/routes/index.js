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
  const list = await model.couponList();
  res.render('today', {list : list});
});

// 쿠폰 상세조회
router.get('/coupons/:_id', async function(req, res, next) {
  const coupon = await model.couponDetail(req.params._id);
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

// get방식으로 main 페이지를 요청하면 해당페이지로 렌더링해라.
router.get('/:page.html', function(req, res, next) {
  // today.html -> today.ejs
  res.render(req.params.page, { title: 'mulpang' });
}); 

module.exports = router;
