const fs = require('fs');
const http = require('http');
const $path = require('path');

const FileServer = require('./lib/file-server');
const publicDir = $path.resolve('./public');
const port = process.env.PORT || 5000;

http.createServer(function (request, response) {
  let contentType;
  let data;

  let url = new URL(request.url, 'http://localhost:5000/') // require('url').parse(request.url);
  let path = url.pathname;
  let queryParams = url.searchParams;

  console.log('Finding ' + path);

  // we have moved some functions into this new object
  let fileServer = new FileServer(request, response);

  function sendArticle(pathParams) {
    let articlesDir = $path.join(publicDir, "articles");
    let articleDataFile = $path.join(articlesDir, pathParams.id + ".json");
    if (pathParams.format === 'json') {
      // if it's asking for json, send it the json file
      fileServer.sendFile(articleDataFile);
    } else {
      // if it's asking for HTML, send it the article.html file
      if (fs.existsSync(articleDataFile)) {
        let htmlFile = $path.join(publicDir, "article.html");
        fileServer.sendFile(htmlFile);
      } else {
        fileServer.sendError(404, `Article ${pathParams.id} not found`);
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
    finishResponse(contentType, data);
  }

  function sendSearchResults() {
    let results = allArticles().filter((article) => {
      if (queryParams.get('author')) {
        let articleAuthor = article.author.toLowerCase();
        let queryValue = queryParams.get('author').toLowerCase();
        return articleAuthor.includes(queryValue);
      }
    });
    data = JSON.stringify(results);
    contentType = 'text/json';
    finishResponse(contentType, data);
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

  let pathParams = parsePath(path);
  console.log(pathParams)
  if (pathParams.action === 'articles') {
    if (pathParams.id) {
      sendArticle(pathParams);
    } else if (pathParams.format === 'json') {
      sendArticleList(data);
    } else {
      fileServer.sendFile($path.join(publicDir, 'articles.html'));
    }
  }
  else if (pathParams.action === 'search') {
    if (pathParams.format === 'json') {
      sendSearchResults()
    } else {
      fileServer.sendFile($path.join(publicDir, 'search.html'));
    }
  }
  else {
    fileServer.handleFileRequest();
  }

  function finishResponse(contentType, data) {
    fileServer.finishResponse(contentType, data);
  }

}).listen(port);

console.log("Listening on port " + port);
