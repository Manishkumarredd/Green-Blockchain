const http = require('http');

const pages = [
  '/',
  '/marketplace',
  '/login',
  '/register',
  '/producer/dashboard',
  '/consumer/dashboard',
  '/admin/dashboard',
  '/verify-certificate/1',
  '/admin/users',
  '/admin/algorithms',
  '/producer/listings'
];

async function checkRoute(path) {
  return new Promise((resolve) => {
    http.get({ host: 'localhost', port: 3000, path }, (res) => {
      resolve({ path, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ path, status: 0, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing frontend routes...');
  for (const p of pages) {
    const r = await checkRoute(p);
    console.log(`Route ${r.path} -> Status ${r.status}`);
  }
}

run();
