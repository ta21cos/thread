// import app from './api/app';
import { appConfig } from './api/config';
import { initBunDatabase } from './api/db/bun';
import { setDb, type Database } from './api/db';

const port = appConfig.port;

console.log(`Server starting on port ${port}...`);

// NOTE: Initialize Bun SQLite database for local development
const bunDb = initBunDatabase(appConfig.databaseUrl);
setDb(bunDb as Database);

// export default {
//   port,
//   fetch: app.fetch,
// };
