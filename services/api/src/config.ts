const DEFAULT_PORT = 3000;

export interface ApiConfig {
  readonly port: number;
  readonly nodeEnv: string;
  readonly databaseUrl: string;
}

const parsePort = (value: string | undefined): number => {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value "${value}"`);
  }

  return parsed;
};

export const getApiConfig = (): ApiConfig => {
  const databaseUrl =
    process.env.DATABASE_URL ?? "postgres://medlink:medlink@localhost:5432/medlink";

  return {
    port: parsePort(process.env.PORT),
    nodeEnv: process.env.NODE_ENV ?? "development",
    databaseUrl,
  };
};
