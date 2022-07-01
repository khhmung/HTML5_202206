const http = require('http');
const fs = require('fs');
const path = require('path');
// const myMime = require('./mimetypes'); // 확장 모듈 (커스텀 확장 모듈)
const mime = require('mime'); // 외부 라이브러리 npm 설치

// npx 는 일회성으로 사용하는 것 express가 그러하다.

const home = path.join(__dirname, 'design');

var server = http.createServer(function(req, res){
  
  console.log(req.method, req.url, req.httpVersion);
  console.log(req.headers);
  console.log('server> req.body=>' , req.body);
  console.log('server> req.query=>' , req.query);
  console.log('server> req.cookies=>', req.cookies);
  console.log('server> req.session=>', req.session);

  var fileName = req.url;
  // var mimeType = myMime.getMime(fileName);s
  var mimeType = mime.getType(fileName);       // ⇨ 'text/plain'

  // 비동기방식
  // 비동기방식은 return 변수(함수)를 등록하면 undefined 날 수 있다.
  // why? 호출 후 바로 return을 해주기 때문 -> 즉 현재 진행중이여도 return 해줌.
  // 요청에 대한 응답(진행이 끝나는걸) 기다리지 않는다.
  // 그래서 콜백함수를 지정해줘야한다.
  // var data =  fs.readFile(path.join(home, fileName));
  fs.readFile(path.join(home, fileName), function(err, data){
    console.log('2. readFile() 콜백함수.2222');
    if(err){
      console.error(err);
      res.writeHead(404, {'content-Type': mimeType + ';charset=utf-8'}); // 응답코드(정상) , 인코딩 타입 지정(vsc 기본값인 utf-8)
      res.end('<h1>' + fileName + ' 파일을 찾을 수 없습니다. </h1>');
    } else {
      res.writeHead(200, {'content-Type': mimeType + ';charset=utf-8'}); // 응답코드(정상) , 인코딩 타입 지정(vsc 기본값인 utf-8)
      res.end(data);
    }
  });

  console.log('1. readFile() 호출 후...');


  // 동기 방식
  // 비효율적인 방식 (싱글스레드방식) -> 파일의 용량이 클수록 뒤에 요청에서 지연 및 병목현상이 나타날 수 있다.
  // try{
  //   var data = fs.readFileSync(path.join(home, fileName));
  //   res.writeHead(200, {'content-Type': 'text/html;charset=utf-8'}); // 응답코드(정상) , 인코딩 타입 지정(vsc 기본값인 utf-8)
  //   res.end(data);
  // } catch(err){
  //   console.error(err);
  //   res.writeHead(404, {'content-Type': 'text/html;charset=utf-8'}); // 응답코드(정상) , 인코딩 타입 지정(vsc 기본값인 utf-8)
  //   res.end('<h1>' + fileName + ' 파일을 찾을 수 없습니다. </h1>');
  // }

});

server.listen(1234, function(){ // 1234 라는 포트를 호출하고 정상이면 콜백함수
  console.log('HTTP 서버 구동 완료');
}); 