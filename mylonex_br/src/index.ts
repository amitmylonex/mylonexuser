import { buildApp } from './app.js';
import { config } from './config.js';

async function start() {
  try {
    const app = await buildApp(config);

    await app.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`Server listening on http://localhost:${config.port}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
