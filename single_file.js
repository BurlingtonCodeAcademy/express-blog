let fs = require('fs');
let http = require('http');
const port = process.env.PORT || 5000;

http.createServer(function (request, response) {
  let contentType;
  let file;
  let data;

  console.log("''URL'' is " +)

  file = 'index.html';
  try {
    console.log('Serving ' + file);
    data = fs.readFileSync(file);
    contentType = 'text/html'
  } catch (error) {
    console.log(error);
    data = "Error: " + error.toString();
    contentType = 'text/plain';
    response.statusCode = 404;
  }

  response.setHeader('Content-Type', 
    contentType + '; charset=utf-8');
  response.write(data);
  response.end();
}).listen(port);
console.log("Listening on port " + port);
