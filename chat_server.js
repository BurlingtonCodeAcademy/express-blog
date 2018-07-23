const http = require('http');
const Assistant = require('./lib/assistant');
const port = process.env.PORT || 5000;

let messages = [];

http.createServer(handleRequest).listen(port);
console.log("Listening on port " + port);

function handleRequest(request, response) {
  // let url = new URL(request.url, 'http://localhost:5000/')
  let url = require('url').parse(request.url);
  let path = url.pathname;

  console.log('Finding ' + path);
  let assistant = new Assistant(request, response);

  // "routing" happens here (not very complicated)
  let pathParams = parsePath(path);
  if (isChatAction(pathParams)) {
    handleChatAction(request, assistant);
  } 
  else if (assistant.isRootPathRequested()) {
    assistant.sendFile('./public/chat.html');
  } 
  else {
    assistant.handleFileRequest();
  }
}

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

function isChatAction(pathParams) {
  return (pathParams.action === 'chat');
}

function handleChatAction(request, handler) {
  if (request.method === 'GET') {
    sendChatMessages(handler);
  } else if (request.method === 'POST') {
    handler.parsePostParams((params) => {
      let message = {
        username: "Anonymous",
        content: params.content,
        when: new Date(Date.now()).toISOString()
      }
      messages.push(message);

      sendChatMessages(handler);
    });
  } else {
    handler.sendError(405, "Method '" + request.method + "' Not Allowed");
  }
}

function sendChatMessages(handler) {
  let data = JSON.stringify(messages);
  let contentType = 'text/json';
  handler.finishResponse(contentType, data);
}
