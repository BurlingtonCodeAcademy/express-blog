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

  console.log('Finding ' + path);

  function extractPathParameters(path) {
    let pathParts = path.slice(1).split('/');
    let action = pathParts.shift();
    let id = pathParts.shift();
    let pathParams = { action: action, id: id };
    return pathParams;
  }
  
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
  }

  function sendDirectoryList(dir) {
    let files = fs.readdirSync(dir);
    let html = files.map((f) => `<li><a href="${path}/${f}">${f}</a></li>`)
      .join('\n');
    data = `<h1>${path.slice(1)}</h1> <ul> ` + html + ` </ul>`;
    contentType = 'text/html';
  }

  function handleFileRequest() {
    try {
      file = $path.resolve($path.join(publicDir, path));
      // verify that the requested file is in this directory, 
      // not elsewhere on the server's filesystem
      if (!file.startsWith(publicDir)) {
        console.log("User requested file '" + request.url + "' (not permitted)");
        sendError(403, "Error: you are not permitted to access that file."); // 403 Forbidden
      }
      else if (fs.statSync(file).isDirectory()) {
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
    catch (error) {
      console.log(error);
      sendError(404, `File ${path} not found`); // 404 Not Found
    }
  }  

  function handleArticleRequest(pathParams) {
    let articleId = pathParams.id;
    if (articleId.endsWith('.json')) {
      // if it's asking for json, send it the raw file
      file = $path.join(publicDir, "articles", articleId);
      sendFile(file);
    } else {
      // if it's asking for HTML, send it the article.html file
      articleFile = $path.join(publicDir, "articles", articleId + '.json');
      if (fs.existsSync(articleFile)) {
        file = $path.join(publicDir, "article.html");
        sendFile(file);
      } else {
        sendError(404, `Article ${articleId} not found`);
      }
    }
  }

  // extract path parameters from path
  let pathParams = extractPathParameters(path);

  if (pathParams.action === 'articles') {
    if (pathParams.id) {
      handleArticleRequest(pathParams);
    } else {
      data = "sorry, can't list articles yet"
    }
  }
  else {
    handleFileRequest();
  }

  response.setHeader('Content-Type', contentType + '; charset=utf-8');
  response.write(data);
  response.end();
}).listen(port);

console.log("Listening on port " + port);

