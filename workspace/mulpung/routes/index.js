var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/today.html');
});

// get방식으로 main 페이지를 요청하면 해당페이지로 렌더링해라.
router.get('/:page.html', function(req, res, next) {
  // today.html -> today.ejs
  res.render(req.params.page, { title: 'mulpang' });
}); 

module.exports = router;
