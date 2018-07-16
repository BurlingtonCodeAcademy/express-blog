const http = require('http');
const Assistant = require('./lib/assistant');
const port = process.env.PORT || 5000;

http.createServer(function (request, response) {
  console.log('Finding ' + request.url);
  let assistant = new Assistant(request, response);

  // increment "hit count" cookie
  let count = getHitCount();
  console.log("hit count: " + count);
  sendHitCount(count + 1);

  assistant.handleFileRequest();

  function parseCookies(cookie) {
    if (!cookie) {
      return {};
    }
    return cookie.split(';').reduce(
      function (cookies, currentCookie) {
        let parts = currentCookie.trim().split('=');
        let name = parts.shift();
        let value = decodeURIComponent(parts.shift());
        cookies[name] = value;
        return cookies;
      },
      {}
    );
  }

  function getHitCount() {
    console.log(request.headers.cookie)
    let cookies = parseCookies(request.headers.cookie);
    if (cookies.hitCount) {
      return +(cookies.hitCount);
    } else {
      return 0;
    }
  }

  function sendHitCount(hitCount) {
    console.log('sending ' + hitCount)
    response.setHeader('Set-Cookie', 'hitCount=' + hitCount);
  }



}).listen(port);
console.log("Listening on port " + port);

