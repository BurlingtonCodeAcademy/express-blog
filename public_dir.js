let fs = require('fs');
let http = require('http');
var mime = require('mime-types'); // https://github.com/jshttp/mime-types
const $path = require('path');
const port = process.env.PORT || 5000;

http.createServer(function (request, response) {
  let file;
  let url = require('url').parse(request.url, true);
  let path = url.pathname;

  // remove trailing slash
  path = path.replace(/\/*$/, '');

  function sendFile(file) {
    try {
      console.log('Sending ' + file);
      data = fs.readFileSync(file);
      contentType = mime.lookup(file);
      finishResponse(contentType, data);
    }
    catch (error) {
      console.log(error);
      sendError(404, `Error: File ${path} not found`); // 404 Not Found
    }
  }

  function sendError(statusCode, message) {
    console.log(`Error ${statusCode}: ${message}`);
    response.statusCode = statusCode;
    finishResponse('text/plain', message);
  }

  function finishResponse(contentType, data) {
    response.setHeader('Content-Type', contentType + '; charset=utf-8');
    response.write(data);
    response.end();
  }

  function sendDirectory(file) {
    let indexFile = file + "/index.html";
    if (fs.existsSync(indexFile)) {
      sendFile(indexFile);
    }
    else {
      sendDirectoryList(file);
    }
  }

  function sendDirectoryList(dir) {
    let files = fs.readdirSync(dir);
    let html = files.map((f) => `<li><a href="${path}/${f}">${f}</a></li>`)
      .join('\n');
      finishResponse('text/html', 
      `<h1>${path.slice(1)}</h1> <ul> ` + html + ` </ul>`
    );
  }

  // verify that the requested file is in the public directory,
  // not elsewhere on the server's filesystem
  let publicDir = $path.resolve('./public');
  file = $path.resolve(publicDir + path);
  if (!file.startsWith(publicDir)) {
    console.log("User requested file '" + request.url + "' (not permitted)");
    sendError(403, "Error: you are not permitted to access that file."); // 403 Forbidden
  }
  else if (fs.statSync(file).isDirectory()) {
    // serve directory index (static or dynamic)
    sendDirectory(file);
  }
  else {
    // it's a file, so send it
    sendFile(file);
  }
  //todo: cach ENOENT :-(
  
}).listen(port);

console.log("Listening on port " + port);
