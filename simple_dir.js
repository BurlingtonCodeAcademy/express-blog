let fs = require('fs');
let http = require('http');
var mime = require('mime-types'); // https://github.com/jshttp/mime-types
const $path = require('path');
const port = process.env.PORT || 5000;

http.createServer(function (request, response) {
  let contentType;
  let file;
  let data;
  let path = decodeURIComponent(request.url);

  function sendFile(file) {
    console.log('Sending ' + file);
    data = fs.readFileSync(file);
    contentType = mime.lookup(file);
  }

  function sendError(statusCode, message) {
    console.log(`Error ${statusCode}: ${message}`);
    data = message;
    response.statusCode = statusCode;
    contentType = 'text/plain';
    file = null;
  }

  function sendDirectoryList(dir) {
    let files = fs.readdirSync(dir);
    let html = files.map((f) => `<li><a href="${path}/${f}">${f}</a></li>`)
      .join('\n');
    data = `<h1>${path.slice(1)}</h1> <ul> ` + html + ` </ul>`;
    contentType = 'text/html';
  }


  try {
      // verify that the requested file is in this directory, 
    // not elsewhere on the server's filesystem
    file = $path.resolve('.' + path);
    let publicDir = $path.resolve('.');
    if (!file.startsWith(publicDir)) {
      console.log("User requested file '" + request.url + "' (not permitted)");
      sendError(403, "Error: you are not permitted to access that file."); // 403 Forbidden
    } else if (fs.statSync(file).isDirectory()) {
      let indexFile = file + "/index.html"
      if (fs.existsSync(indexFile)) {
        sendFile(indexFile);
      } else {
        sendDirectoryList(file); 
      }
    } else {
      sendFile(file);
    }
  } catch (error) {
    console.log(error);
    sendError(404, `Error: File ${path} not found`); // 404 Not Found
  }
  

  response.setHeader('Content-Type', contentType + '; charset=utf-8');
  response.write(data);
  response.end();
}).listen(port);

console.log("Listening on port " + port);
