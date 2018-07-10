let fs = require('fs');
let http = require('http');
var mime = require('mime-types'); // https://github.com/jshttp/mime-types
const $path = require('path');
const port = process.env.PORT || 5000;

http.createServer(function (request, response) {
  let contentType;
  let file;
  let data;
  let path = request.url;

  if (path === '/') {
    file = 'index.html';
  }
  else {
    path = decodeURIComponent(path);

    // verify that the requested file is in this directory, 
    // not elsewhere on the server's filesystem
    file = $path.resolve('.' + path);
    let publicDir = $path.resolve('.');
    if (!file.startsWith(publicDir)) {
      data = "Error: you are not permitted to access that file.";
      response.statusCode = 403; // Forbidden
      console.log("User requested file '" + request.url + "' (not permitted)");
      file = null;
    }
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
