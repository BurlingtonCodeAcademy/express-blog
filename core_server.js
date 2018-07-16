const http = require('http');
const Assistant = require('./lib/assistant');
const port = process.env.PORT || 5000;

http.createServer(function (request, response) {
  console.log('Finding ' + request.url);
  let assistant = new Assistant(request, response);
  assistant.handleFileRequest();
}).listen(port);
console.log("Listening on port " + port);
