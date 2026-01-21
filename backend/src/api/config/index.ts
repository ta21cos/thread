// TODO: Not needed anymore...?

const nodeEnv = process.env.NODE_ENV || 'development';

export interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
}

if (!process.env.DATABASE_URL || !process.env.PORT) {
  throw new Error('DATABASE_URL or PORT is not set in the environment variables');
}

export const appConfig: Config = {
  nodeEnv,
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
};
