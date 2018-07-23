let http = require('http');
const port = process.env.PORT || 5000;
http.createServer(function(request, response){
  response.write('<h1>Hello from NodeJS!</h1>\n\n');
  response.end();
}).listen(port);
console.log("Listening on port " + port);
