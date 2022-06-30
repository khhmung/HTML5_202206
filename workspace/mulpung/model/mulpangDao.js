// Dao - Data Access Object 

var util = require('util');
var path = require('path');
var fs = require('fs');
var moment = require('moment');
var MyUtil = require('../utils/myutil');

// DB 접속
var db;
const { MongoClient, ObjectId, ObjectID } = require('mongodb');
const { now } = require('moment');
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

async function main() {
  await client.connect();
  db = client.db('mulpang');
  db.member = db.collection('member');
  db.shop = db.collection('shop');
  db.coupon = db.collection('coupon');
  db.purchase = db.collection('purchase');
  db.epilogue = db.collection('epilogue');
  return 'DB 접속 완료.';
}

main()
  .then(console.info)
  .catch(console.error);

// 쿠폰 목록조회
module.exports.couponList = async function(qs){
  // 넘어오는 값 예시
  // http://localhost/all?date=buyable&location=%EA%B0%95%EB%82%A8&keyword=&order=saleDate.start#
  qs = qs || {};
	// 검색 조건
	var query = {};
	// 1. 판매 시작일이 지난 쿠폰, 구매 가능 쿠폰(기본 검색조건)	
  var now = moment().format('YYYY-MM-DD');
  query['saleDate.start'] = {$lte : now};   // less than equal
  query['saleDate.finish'] = {$gte : now};  // great than equal
	// 2. 전체/구매가능/지난쿠폰
  switch(qs.date){
    case 'all':
      delete query['saleDate.finish'];
      break;
    case 'past': 
      query['saleDate.finish'] = {$lt : now}; // less than (미만)
      break;
  }
	// 3. 지역명
  if(qs.location){
    query['region'] = qs.location;
  }
	// 4. 검색어	
  var keyword = qs.keyword;
  if(keyword && keyword.trim() != ''){
    var regExp = new RegExp(keyword , 'i'); // 정규식 i 의 역할 : 대소문자 구분 X
    query['$or'] = [{couponName : regExp}, {desc : regExp}];  // 쿠폰명과 설명만 OR 조건으로 검색
  }
	// 정렬 옵션
	var orderBy = {};
	// 1. 사용자 지정 정렬 옵션	
  var orderCondtion = qs.order;
  if(orderCondtion){
    orderBy[orderCondtion] = -1; // 내림차순
  }
	// 2. 판매 시작일 내림차순(최근 쿠폰)	
  orderBy['saleDate.start'] = -1;
	// 3. 판매 종료일 오름차순(종료 임박 쿠폰)
  orderBy['saleDate.finish'] = 1;

	// 출력할 속성 목록
	var fields = {
		couponName: 1,
		image: 1,
		desc: 1,
		primeCost: 1,
		price: 1,
		useDate: 1,
		quantity: 1,
		buyQuantity: 1,
		saleDate: 1,
		position: 1
	};
	
	// TODO 쿠폰 목록을 조회한다.
  const count = 0;
  const result = await db.coupon.find(query).project(fields).limit(count).sort(orderBy).toArray();
  console.log(result.length + '건 조회');
	
  return result;
};

// 쿠폰 상세 조회
module.exports.couponDetail = async function(_id, io){
	// coupon, shop, epilogue 조인
	var coupon = await db.coupon.aggregate([{
    $match : {
      _id : ObjectId(_id)
    }
  }, {
    // shop 조인
    $lookup : {
      from : 'shop',        // 조인 할 컬렉션 
      localField: 'shopId', // coupon.shopId
      foreignField: '_id',  // shop._id
      as: 'shop'            // coupon에 shop이라는 속성으로 추가
    }
  }, {
    // shop 조인 결과를 (배열) 개별 속성으로 변환
    $unwind: '$shop'

  }, {
    // epilogue 조인
    $lookup : {
      from : 'epilogue',          // 조인 할 컬렉션 
      localField: '_id',          // coupon._Id
      foreignField: 'couponId',   // epilogue.couponId
      as: 'epilogueList'          // coupon에 epilogueList 라는 속성으로 추가
    }

  }]).next();
  // console.log(coupon);
	// 뷰 카운트를 하나 증가시킨다.
	await db.coupon.updateOne({_id: coupon._id}, {$inc: {viewCount: 1}});
	// 웹소켓으로 수정된 조회수 top5를 전송한다.
  io.emit('top5', await topCoupon('viewCount'));
	
  return coupon;
};

// 구매 화면에 보여줄 쿠폰 정보 조회
module.exports.buyCouponForm = async function(_id){
	var fields = {
		couponName: 1,
    price: 1,
    quantity: 1,
    buyQuantity: 1,
    'image.detail': 1
	};
	// TODO 쿠폰 정보를 조회한다.
	return await db.coupon.findOne({_id: ObjectId(_id)}, {projection: fields});
};

// 쿠폰 구매
module.exports.buyCoupon = async function(params){
	// 구매 컬렉션에 저장할 형태의 데이터를 만든다.
	var document = {
		couponId: ObjectId(params.couponId),
		email: 'uzoolove@gmail.com',	// 나중에 로그인한 id로 대체
		quantity: parseInt(params.quantity),
		paymentInfo: {
			cardType: params.cardType,
			cardNumber: params.cardNumber,
			cardExpireDate: params.cardExpireYear + params.cardExpireMonth,
			csv: params.csv,
			price: parseInt(params.unitPrice) * parseInt(params.quantity)
		},
		regDate: moment().format('YYYY-MM-DD hh:mm:ss')
	};

  try{
    // TODO 구매 정보를 등록한다.
    const result = await db.purchase.insertOne(document);
    // TODO 쿠폰 구매 건수를 하나 증가시킨다.
    await db.coupon.update({_id : document.couponId},{$inc : {buyQuantity: document.quantity}});
  
    return result.insertedId;
  
  }catch(err){
    console.error(err);
    throw new Error('쿠폰 구매에 실패했습니다. 잠시후 다시 시도하시기 바랍니다.');
  }
  
};	
	
// 추천 쿠폰 조회
var topCoupon = module.exports.topCoupon = async function(condition){
  var order = {};
  var query = {}; // 검색 조건
	// 1. 판매 시작일이 지난 쿠폰, 구매 가능 쿠폰(기본 검색조건)	
  var now = moment().format('YYYY-MM-DD');
  query['saleDate.start'] = {$lte : now};   // less than equal
  query['saleDate.finish'] = {$gte : now};  // great than equal

  order[condition] = -1;
  var list = await db.coupon.aggregate([
    { $match: query }, 
    { $sort : order }, 
    { $limit : 5},
    { $project : {
        couponName: 1, 
        value: '$'+condition
      } 
    }
  ]).toArray();
  return list;
};

// 지정한 쿠폰 아이디 목록을 받아서 남은 수량을 넘겨준다.
module.exports.couponQuantity = async function(coupons){

};

// 임시로 저장한 프로필 이미지를 회원 이미지로 변경한다.
function saveImage(tmpFileName, profileImage){
	var tmpDir = path.join(__dirname, '..', 'public', 'tmp');
  var profileDir = path.join(__dirname, '..', 'public', 'image', 'member');
  var org = path.join(tmpDir, tmpFileName);
  var dest = path.join(profileDir, profileImage);
	// TODO 임시 이미지를 member 폴더로 이동시킨다.
	
}

// 회원 가입
module.exports.registMember = async function(params){
	
};

// 로그인 처리
module.exports.login = async function(params){
	// TODO 지정한 아이디와 비밀번호로 회원 정보를 조회한다.
	
};

// 회원 정보 조회
module.exports.getMember = async function(userid){
	
};

// 회원 정보 수정
module.exports.updateMember = async function(userid, params){
	
};

// 쿠폰 후기 등록
module.exports.insertEpilogue = async function(userid, params){
	
};