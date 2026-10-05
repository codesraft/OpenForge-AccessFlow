import { createApp } from './app.js';
import { env } from './utils/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`AuthAccKit server running on port ${env.port}`);
});