let fs = require('fs');
let http = require('http');
var mime = require('mime-types'); // https://github.com/jshttp/mime-types
const $path = require('path');
const publicDir = $path.resolve('./public');
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

    // TODO: CLEAN UP CODE

    // route "/articles/X" to article.html...
    let pathParts = path.split('/')
    console.log(pathParts);
    pathParts.shift(); // get rid of ''
    let action = pathParts.shift()
    console.log(action)
    if (action === 'articles') {
      let articleFile;
      let articleId = pathParts.shift();
      if (articleId.endsWith('.json')) {
        file = $path.join(publicDir, "articles", articleId);
      } else {
        articleFile = $path.join(publicDir, "articles", articleId + '.json');
        console.log(articleFile)
        if (fs.existsSync(articleFile)) {
          file = $path.join(publicDir, "article.html");
        } else {
          sendError(404, `Article ${articleId} not found`);
        }
      }
    }
    else {
      file = $path.resolve($path.join(publicDir, path));
    }

    if (!file) {
      return;
    }
    // verify that the requested file is in this directory, 
    // not elsewhere on the server's filesystem
    if (!file.startsWith(publicDir)) {
      console.log("User requested file '" + request.url + "' (not permitted)");
      sendError(403, "Error: you are not permitted to access that file."); // 403 Forbidden
    } else if (fs.statSync(file).isDirectory()) {
      let indexFile = $path.join(file, "index.html");
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
