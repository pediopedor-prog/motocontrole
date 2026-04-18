/**
 * Server environment variables stub.
 * Only used for server-side code, not included in mobile builds.
 */
export const ENV = {
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  nodeEnv: process.env.NODE_ENV ?? "development",
};
