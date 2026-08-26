const { PrismaClient } = require("@prisma/client");

// const globalForPrisma = globalThis as unknown as {
//     prisma: PrismaClient | undefined
// }
const prisma = new PrismaClient();

module.exports = prisma;
