import https from 'https';

const options = {
  hostname: 'findingmena.com',
  path: '/wp-json/wp/v2/posts?per_page=1',
  headers: {
    'Origin': 'http://localhost:5173',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

https.get(options, (res) => {
  console.log("Status Code:", res.statusCode);
  console.log("CORS header (access-control-allow-origin):", res.headers['access-control-allow-origin']);
}).on('error', (e) => {
  console.error("Error:", e);
});
