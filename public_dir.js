let fs = require('fs');
let http = require('http');
var mime = require('mime-types'); // https://github.com/jshttp/mime-types
const $path = require('path');
const port = process.env.PORT || 5000;

http.createServer(function (request, response) {
  let contentType;
  let file;
  let data;

  let url = require('url').parse(request.url, true);
  let path = url.pathname;
  // remove trailing slash
  path = path.replace(/\/*$/, '');

  console.log(url);

  function sendFile(file) {
    try {
      console.log('Sending ' + file);
      data = fs.readFileSync(file);
      contentType = mime.lookup(file);
    }
    catch (error) {
      console.log(error);
      sendError(404, `Error: File ${path} not found`); // 404 Not Found
    }
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

  // verify that the requested file is in the public directory,
  // not elsewhere on the server's filesystem
  let publicDir = $path.resolve('./public');
  file = $path.resolve(publicDir + path);
  if (!file.startsWith(publicDir)) {
    console.log("User requested file '" + request.url + "' (not permitted)");
    sendError(403, "Error: you are not permitted to access that file."); // 403 Forbidden
  } 

  // serve directory index (static or dynamic)
  else if (fs.statSync(file).isDirectory()) {
    let indexFile = file + "/index.html"
    if (fs.existsSync(indexFile)) {
      sendFile(indexFile);
    } else {
      sendDirectoryList(file); 
    }
  }

  // it's a file, so send it
  else {
    sendFile(file);
  }
  
  

  response.setHeader('Content-Type', contentType + '; charset=utf-8');
  response.write(data);
  response.end();
}).listen(port);

console.log("Listening on port " + port);
