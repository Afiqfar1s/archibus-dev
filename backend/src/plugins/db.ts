import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
};

export default fp(dbPlugin);
