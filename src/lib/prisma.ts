

//adapter to connect prisma to postgresql
//this adapter keeps 10 connections by default(pool).
import { PrismaPg } from "@prisma/adapter-pg";

//validated DATABASEURL
import { env } from "@/config/env";

//class generated from the prisma schema it has CRUD methods.
import { PrismaClient } from "@/generated/prisma/client";

//build one client with one pool( pool=10 connections )
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

  //create prismaclient using the adapter.
  return new PrismaClient({ adapter });
}

// Dev hot reload re-runs this module. Without the cache, each reload would open a new
// connection pool until PostgreSQL runs out of connections.
//All users' requests can share the same PrismaClient instance within the same running Node.js process.

//globalThis is javascript object can be accessed globally  we are promising its type prismaclient is optional
//globalThis can hold additional properties such as prismaClient
//javascript let us add keys to object so we add prisma to it.
//globalForPrisma is now refernece for globalThis and any changes. 
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

//if globalForPrisma.prisma has prismaclient then save it else call function.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

//in production other way their is cahing and 1 client it will be runned one time.
//in the development each time a client  and a pool where connections not closed and railway will crash(get out of pools).
if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
