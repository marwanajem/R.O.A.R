import fs from 'fs';

// Catch any fatal database or code crashes
process.on('uncaughtException', (err) => {
    fs.writeFileSync('plesk-crash.log', 'CRASH: ' + (err.stack || err));
});
process.on('unhandledRejection', (err) => {
    fs.writeFileSync('plesk-crash.log', 'PROMISE CRASH: ' + (err.stack || err));
});

// Try to start the server
import('./server.js').catch(err => {
    fs.writeFileSync('plesk-crash.log', 'IMPORT CRASH: ' + (err.stack || err));
});