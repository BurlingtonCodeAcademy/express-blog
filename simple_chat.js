const fs = require('fs');
const http = require('http');
const mime = require('mime-types'); // https://github.com/jshttp/mime-types
const $path = require('path');
const FileServer = require('./lib/file-server');
const publicDir = $path.resolve('./public');
const port = process.env.PORT || 5000;

let messages = [];

http.createServer(function (request, response) {
  let contentType;
  let data;

  let url = new URL(request.url, 'http://localhost:5000/') // require('url').parse(request.url);
  let path = url.pathname;

  console.log('Finding ' + path);
  let fileServer = new FileServer(request, response);

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

  function parsePostParams(callback) {
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
        // see http://unixpapa.com/js/querystring.html section 3.1
        bodyParams[name] = decodeURIComponent(value.replace(/\+/g,' '));
      }
      callback(bodyParams);
    });
  }

  function sendChatMessages() {
    data = JSON.stringify(messages);
    contentType = 'text/json';
    fileServer.finishResponse(contentType, data);
  }

  // routing here
  let pathParams = parsePath(path);
  console.log(pathParams)

  if (pathParams.action === 'chat') {
    if (request.method === 'GET') {
      sendChatMessages();
    } else if (request.method === 'POST') {
      parsePostParams((params) => {
        let message = {
          username: "Anonymous",
          content: params.content,
          when: new Date(Date.now()).toISOString()
        }
        messages.push(message);

        sendChatMessages();
      });
    } else {
      fileServer.sendError(405, "Method '" + request.method + "' Not Allowed");
    }
  } else {
    fileServer.handleFileRequest();
  }
}).listen(port);

console.log("Listening on port " + port);
