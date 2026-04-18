/**
 * tRPC server setup stub.
 * Only used for server-side code, not included in mobile builds.
 */
import { initTRPC } from "@trpc/server";

interface Context {
  req: any;
  res: any;
  user: unknown;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure;
