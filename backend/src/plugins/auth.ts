import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

declare module 'fastify' {
  interface Session {
    userId?: number;
    email?: string;
    roles?: string[];
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Register cookie plugin
  await fastify.register(fastifyCookie);

  // Register session plugin
  await fastify.register(fastifySession, {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
    saveUninitialized: false,
    rolling: true,
  });

  // Decorate fastify instance with authentication check
  fastify.decorate('authenticate', async function (request: any, reply: any) {
    if (!request.session.userId) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Load user and roles
    const user = await prisma.user.findUnique({
      where: { id: request.session.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      request.session.destroy();
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found or inactive',
        },
      });
    }

    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((ur) => ur.role.name),
    };
  });
};

export default fp(authPlugin);
