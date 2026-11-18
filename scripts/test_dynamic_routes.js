const http = require('http');

const testRoutes = [
  '/consumer/requests/1',
  '/consumer/requests/2',
  '/consumer/requests/15',
  '/marketplace/1',
  '/marketplace/2',
  '/producer/listings/1',
  '/verify-certificate/1',
  '/verify-certificate/5'
];

async function check(path) {
  return new Promise((resolve) => {
    http.get({ host: 'localhost', port: 3000, path }, (res) => {
      resolve({ path, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ path, status: 0, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing dynamic ID routes...');
  for (const r of testRoutes) {
    const res = await check(r);
    console.log(`Route ${res.path} -> Status ${res.status}`);
  }
}

run();
