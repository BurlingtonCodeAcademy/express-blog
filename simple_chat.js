let fs = require('fs');
let http = require('http');
var mime = require('mime-types'); // https://github.com/jshttp/mime-types
const $path = require('path');
const publicDir = $path.resolve('./public');
const port = process.env.PORT || 5000;

let messages = [];

http.createServer(function (request, response) {
  let contentType;
  let file;
  let data;

  let url = new URL(request.url, 'http://localhost:5000/') // require('url').parse(request.url);
  let path = url.pathname;
  let queryParams = url.searchParams;


  console.log('Finding ' + path);

  function parsePath(path) {
    let format;
    if (path.endsWith('.json')) {
      path = path.substring(0, path.length - 5);
      format = 'json';
    }
    let pathParts = path.slice(1).split('/');
    let action = pathParts.shift();
    let id = pathParts.shift();
    let pathParams = { action: action, id: id, format: format };
    return pathParams;
  }

  function parsePostParams(request, callback) {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      // at this point, `body` has the entire request body stored in it as a string
      console.log("received post body: " + body)
      let fields = body.split('&');
      let bodyParams = {};
      for (let field of fields) {
        let [ name, value ] = field.split('=');
        bodyParams[name] = decodeURIComponent(value);
      }
      console.log(bodyParams)
      callback(bodyParams);
    });
  }

  function sendFile(file) {
    try {
      console.log('Sending ' + file);
      data = fs.readFileSync(file);
      contentType = mime.lookup(file);
    }
    catch (error) {
      console.log(error);
      if (error.code === 'ENOENT') {
        let safeFileName = file.substring(publicDir.length);
        sendError(404, `File ${safeFileName} not found`); // 404 Not Found
      } else {
        sendError(500, 'Unknown error'); // 404 Not Found
      }
    }
  }

  function sendError(statusCode, message) {
    console.log(`Error ${statusCode}: ${message}`);
    data = message;
    response.statusCode = statusCode;
    contentType = 'text/plain';
  }

  function sendDirectoryList(dir) {
    let files = fs.readdirSync(dir);
    let html = files.map((f) => `<li><a href="${path}/${f}">${f}</a></li>`)
      .join('\n');
    data = `<h1>${path.slice(1)}</h1> <ul> ` + html + ` </ul>`;
    contentType = 'text/html';
  }

  function handleFileRequest() {
    file = $path.resolve($path.join(publicDir, path));
    if (!file.startsWith(publicDir)) {
      console.log("User requested file '" + request.url + "' (not permitted)");
      sendError(403, "Error: you are not permitted to access that file."); // 403 Forbidden
    }
    else if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      let indexFile = $path.join(file, "index.html");
      if (fs.existsSync(indexFile)) {
        sendFile(indexFile);
      }
      else {
        sendDirectoryList(file);
      }
    }
    else {
      sendFile(file);
    }
  }

  function sendChatMessages() {
    data = JSON.stringify(messages);
    contentType = 'text/json';
    sendResponse(contentType, data);
  }

  function sendResponse(contentType, data) {
    response.setHeader('Content-Type', contentType + '; charset=utf-8');
    response.write(data);
    response.end();
  }

  let pathParams = parsePath(path);
  console.log(pathParams)

  if (pathParams.action === 'chat') {
    if (request.method === 'GET') {
      sendChatMessages();
    } else {
      parsePostParams(request, function (params) {

        let message = {
          username: "Anonymous",
          content: params.content,
          when: new Date(Date.now()).toISOString()
        }
        messages.push(message);

        sendChatMessages();
      });
    }
  } else {
    handleFileRequest();
  }
  if (data) {
    sendResponse(contentType, data);
  } 
}).listen(port);

console.log("Listening on port " + port);
