const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const OUT_DIR = path.join(__dirname, 'out');

// Route mappings for Next.js static export
const routeMap = {
  '/': '/index.html',
  '/story': '/story.html',
  '/zero': '/zero.html',
  '/mage': '/mage.html',
  '/proverbs': '/proverbs.html',
  '/the-first': '/the-first.html',
  '/story/stats': '/story/stats.html',
};

const server = http.createServer((req, res) => {
  let filePath = req.url.split('?')[0]; // Remove query string
  
  // Handle route mappings
  if (routeMap[filePath]) {
    filePath = routeMap[filePath];
  }
  
  // If no extension, try adding .html
  if (!path.extname(filePath) && filePath !== '/') {
    const htmlPath = filePath + '.html';
    const fullPath = path.join(OUT_DIR, htmlPath);
    if (fs.existsSync(fullPath)) {
      filePath = htmlPath;
    }
  }
  
  // Default to index.html for root
  if (filePath === '/') {
    filePath = '/index.html';
  }
  
  const fullPath = path.join(OUT_DIR, filePath);
  
  // Check if file exists
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      // Try 404.html
      const notFoundPath = path.join(OUT_DIR, '404.html');
      fs.readFile(notFoundPath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
      return;
    }
    
    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.mp4': 'video/mp4',
      '.md': 'text/markdown',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Read and serve file
    fs.readFile(fullPath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${OUT_DIR}`);
});




