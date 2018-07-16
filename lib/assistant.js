const fs = require('fs');
const mime = require('mime-types'); // https://github.com/jshttp/mime-types
const $path = require('path');

module.exports = class Assistant {
  constructor(request, response) {
    this.request = request;
    this.response = response;

    this.url = new URL(request.url, 'http://localhost:5000/') // require('url').parse(request.url);
    this.path = this.url.pathname;
    this.queryParams = this.url.searchParams;
    this.path = this.url.pathname;
    this.publicDir = $path.resolve('./public');
  }

  sendFile(file) {
    console.log('Sending ' + file);
    fs.readFile(file, (error, data)=> {
      if (error) {
        console.log(error);
        if (error.code === 'ENOENT') {
          let safeFileName = file.substring(this.publicDir.length);
          this.sendError(404, `File ${safeFileName} not found`); // 404 Not Found
        } else {
          this.sendError(500, 'Unknown error'); // 404 Not Found
        }
      } else {
        let contentType = mime.lookup(file);
        this.finishResponse(contentType, data);
      }
    });
  }

  sendError(statusCode, message) {
    console.log(`Error ${statusCode}: ${message}`);
    this.response.statusCode = statusCode;
    this.finishResponse('text/plain', message);
  }

  sendRedirect(path) {
    let message = `Redirecting to ${path}`;
    console.log(message);
    this.response.statusCode = 302;
    this.response.setHeader('Location', path);
    this.finishResponse('text/plain', message);
  }

  sendDirectoryList(dir) {
    let files = fs.readdirSync(dir);
    let html = files.map((f) => `<li><a href="${this.path}/${f}">${f}</a></li>`)
      .join('\n');
    let data = `<h1>${this.path.slice(1)}</h1> <ul> ` + html + ` </ul>`;
    let contentType = 'text/html';
    this.finishResponse(contentType, data);
  }

  handleFileRequest() {
    let file = $path.resolve($path.join(this.publicDir, this.path));
    if (!file.startsWith(this.publicDir)) {
      console.log("User requested file '" + this.request.url + "' (not permitted)");
      this.sendError(403, "Error: you are not permitted to access that file."); // 403 Forbidden
    }
    else if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      let indexFile = $path.join(file, "index.html");
      if (fs.existsSync(indexFile)) {
        this.sendFile(indexFile);
      }
      else {
        this.sendDirectoryList(file);
      }
    }
    else {
      this.sendFile(file);
    }
  }

  finishResponse(contentType, data) {
    this.response.setHeader('Content-Type', contentType + '; charset=utf-8');
    this.response.write(data);
    this.response.end();
  }

  decodeParams(query) {
    let fields = query.split('&');
    let params = {};
    for (let field of fields) {
      // see http://unixpapa.com/js/querystring.html section 3.1
      let [ name, value ] = field.split('=');
      value = value.replace(/\+/g,' ');
      params[name] = decodeURIComponent(value);
    }
    return params;
  }

  parsePostParams(callback) {
    let body = [];
    this.request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      // at this point, `body` has the entire request body stored in it as a string
      console.log("received post body: " + body)
      let params = this.decodeParams(body);
      callback(params);
    });
  }

}
