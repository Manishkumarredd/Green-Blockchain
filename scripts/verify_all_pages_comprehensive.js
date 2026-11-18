const http = require('http');

const allPages = [
  // Public & Auth
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/marketplace',
  '/marketplace/1',
  '/marketplace/2',
  '/verify-certificate/1',
  '/verify/1',
  
  // Producer Portal
  '/producer/dashboard',
  '/producer/listings',
  '/producer/listings/new',
  '/producer/listings/1',
  
  // Consumer Portal
  '/consumer/dashboard',
  '/consumer/requests',
  '/consumer/requests/1',
  '/consumer/requests/2',
  '/consumer/purchases',
  
  // Admin Portal
  '/admin/dashboard',
  '/admin/users',
  '/admin/listings',
  '/admin/requests',
  '/admin/transactions',
  '/admin/algorithms',
  '/admin/research-analytics',
  '/admin/settings',
  '/admin/activity-logs'
];

async function checkUrl(path) {
  return new Promise((resolve) => {
    const req = http.get({
      host: 'localhost',
      port: 3000,
      path: path,
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          ok: res.statusCode === 200,
          bytes: data.length
        });
      });
    });

    req.on('error', (err) => {
      resolve({ path, status: 0, ok: false, error: err.message });
    });
  });
}

async function run() {
  console.log('===========================================================');
  console.log('   GREENLEDGER 100% EXHAUSTIVE PAGE & ROUTE AUDIT (27 URLs)');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  for (const page of allPages) {
    const result = await checkUrl(page);
    if (result.ok) {
      console.log(`[PASS 200 OK]  ${page.padEnd(35)} (${(result.bytes / 1024).toFixed(1)} KB)`);
      passed++;
    } else {
      console.error(`[FAIL ${result.status}] ${page.padEnd(35)} -> ${result.error || 'Non-200 Status'}`);
      failed++;
    }
  }

  console.log('\n-----------------------------------------------------------');
  console.log(`Total Pages Tested: ${allPages.length}`);
  console.log(`Passed:             ${passed}`);
  console.log(`Failed:             ${failed}`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run();
