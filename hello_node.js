let http = require('http');
const port = process.env.PORT || 5000;
http.createServer(function(request, response){
  response.write('Hello from NodeJS!');
  response.end();
}).listen(port);
console.log("Listening on port " + port);
