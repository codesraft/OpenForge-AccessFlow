import 'dotenv/config';

// Every setting the server reads from the environment lives here,so the rest of the code never touches process.env directly.


const DEFAULT_PORT = 5000;
const DEFAULT_CLIENT_URL = 'http://localhost:3000';

export const env = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  
  clientUrl: process.env.CLIENT_URL || DEFAULT_CLIENT_URL,
};