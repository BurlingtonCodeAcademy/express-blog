// libraries
const fs = require('fs');
const $path = require('path');
const express = require('express')

// constants
const app = express()
const port = process.env.PORT || 5000
const publicDir = $path.resolve('./public')
const articlesDir = $path.join(publicDir, "articles")

// routes

app.all('*', function (request, response, next) {
  console.log('New Request: ' + request.url)
  next()
})

app.get('/articles/:articleId.json', (request, response) => {
  console.log(request.params)
  // if it's asking for json, send it the json file
  sendArticleJson(request.params.articleId, response);
})

app.get('/articles/:articleId.html', (request, response) => {
  console.log(request.params)
  // if it's asking for HTML, send it the article.html file
  // and let it make a new API request for the JSON data
  sendArticleHtml(request.params.articleId, response)
})

app.get('/articles/:articleId', (request, response) => {
  // Without a format in the path, check the *Accept* header
  // to determine which format the client wants.
  console.log(request.headers)
  let accepts = request.headers.accept.split(',')
  for (let mimeType of accepts) {
    console.log('Accepts: ' + mimeType)
    if (mimeType === 'text/html') {
      sendArticleHtml(request.params.articleId, response)
      return; // abort the for loop
    } else if (mimeType === 'application/json') {
      sendArticleJson(request.params.articleId, response)
      return; // abort the for loop
    }
  }
  response.send('Unable to send article ' + request.params +
    ' in any of the acceptable formats ' + accepts)
  response.status(400)
});

app.get('/articles', (request, response) => {
  response.sendFile($path.join(publicDir, 'articles.html'))
})

app.get('/articles.json', (request, response) => {
  sendArticleList(response);
})

app.post('/articles', express.urlencoded(), (request, response) => {
  createArticle(request.body, response)
})

app.get('/publish', (request, response) => {
  let htmlFile = $path.join(publicDir, "publish.html");
  response.sendFile(htmlFile);
})

app.get('/search', (request, response) => {
  response.sendFile($path.join(publicDir, 'search.html'))
})

app.get('/search.json', (request, response) => {
    let results = searchArticles(request.query)
    response.type('text/json');
    response.send(JSON.stringify(results));
});

app.use(express.static('public'))
app.listen(port, () => console.log(`Blog app listening on port ${port}!`))

// functions

function articleFilePath(articleId) {
  return $path.join(articlesDir, articleId + ".json");
}

function sendArticleJson(articleId, response) {
  let filePath = articleFilePath(articleId);
  response.sendFile(filePath);
}

function sendArticleHtml(articleId, response) {
  let filePath = articleFilePath(articleId)
  if (fs.existsSync(filePath)) {
    let htmlFile = $path.join(publicDir, "article.html");
    response.sendFile(htmlFile);
  }
  else {
    response.sendError(404, `Article ${params.id} not found`);
  }
}

function allArticles() {
  return fs.readdirSync(articlesDir)
    .filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(fs.readFileSync($path.join(articlesDir, file))))
    .sort((a,b)=> (a.id - b.id)); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
}

function sendArticleList(response) {
  let articles = allArticles();
  console.log(articles)
  let data = JSON.stringify(articles);
  response.type('text/json');
  response.send(data);
}

function searchArticles(params) {
  console.log("Searching for " + JSON.stringify(params))
  let results = allArticles().filter((article) => {
    if (params.author) {
      let articleAuthor = article.author || '';
      let targetAuthor = params.author || '';
      return articleAuthor.toLowerCase().includes(targetAuthor.toLowerCase());
    }
  });
  return results;
}

function createArticle(params, response) {
  let articles = allArticles();
  let articleId = nextArticleId(articles);

  console.log(params);
  let article = {
    id: articleId,
    author: params.author.trim(),
    title: params.title.trim(),
    body: params.body.trim()
  }

  let articleDataFile = $path.join(articlesDir, articleId + ".json");
  console.log('Writing article: ' + JSON.stringify(article))
  fs.writeFile(articleDataFile, JSON.stringify(article), (err) => {
    if (err) {
      response.status(500).send(err);
    } else {
      response.redirect('/articles');
    }
  })
}

// Pick an unused article id.
function nextArticleId(articles) {
  // find the highest id...
  let id = articles.reduce((topId, article) => {
    return Math.max(topId, article.id);
  }, 1);
  // ...and pick a higher one
  let articleId = id + 1;
  return articleId;

  // Warning: this algorithm has a race condition 
  // and will sometimes fail when several clients
  // attempt to create new articles simultaneously!
}
