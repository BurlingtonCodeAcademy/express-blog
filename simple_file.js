const fs = require('fs');
const http = require('http');
const mime = require('mime-types'); // https://github.com/jshttp/mime-types
const $path = require('path');
const port = process.env.PORT || 5000;

http.createServer(function (request, response) {
  let contentType;
  let file;
  let data;
  let path = decodeURIComponent(request.url);

  if (path === '/') {
    file = 'index.html';
  }
  else {
    file = '.' + path;
  }

  try {
    if (file) {
      console.log('Serving ' + file);
      data = fs.readFileSync(file);
      contentType = mime.lookup(file);
    }
  } catch (error) {
    console.log(error);
    data = "Error: " + error.toString();
    response.statusCode = 404; // Not Found
  }

  response.setHeader('Content-Type', contentType + '; charset=utf-8');
  response.write(data);
  response.end();
}).listen(port);

console.log("Listening on port " + port);
