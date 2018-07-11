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

  function sendArticle(pathParams) {
    let articlesDir = $path.join(publicDir, "articles");
    let articleDataFile = $path.join(articlesDir, pathParams.id + ".json");
    if (pathParams.format === 'json') {
      // if it's asking for json, send it the json file
      sendFile(articleDataFile);
      contentType = 'text/json';
    } else {
      // if it's asking for HTML, send it the article.html file
      if (fs.existsSync(articleDataFile)) {
        let htmlFile = $path.join(publicDir, "article.html");
        sendFile(htmlFile);
      } else {
        sendError(404, `Article ${articleId} not found`);
      }
    }
  }

  function allArticles() {
    let articlesDir = $path.join(publicDir, "articles");
    return fs.readdirSync(articlesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => JSON.parse(fs.readFileSync($path.join(articlesDir, file))));
  }

  function sendArticleList() {
    data = JSON.stringify(allArticles());
    contentType = 'text/json';
  }

  function sendSearchResults() {
    let results = allArticles().filter((article) => {
      if (queryParams.get('author')) {
        return article.author.toLowerCase() === queryParams.get('author').toLowerCase();
      }
    });
    data = JSON.stringify(results);
    contentType = 'text/json';
  }

  let pathParams = parsePath(path);
  console.log(pathParams)
  if (pathParams.action === 'articles') {
    if (pathParams.id) {
      sendArticle(pathParams);
    } else if (pathParams.format === 'json') {
      sendArticleList(data);
    } else {
      sendFile($path.join(publicDir, 'articles.html'));
    }
  }
  else if (pathParams.action === 'search') {
    if (pathParams.format === 'json') {
      sendSearchResults()
    } else {
      sendFile($path.join(publicDir, 'search.html'));
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
