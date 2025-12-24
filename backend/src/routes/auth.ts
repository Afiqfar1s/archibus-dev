import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { loginSchema, ApiResponse } from '../schemas';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/auth/login
  fastify.post<{
    Body: { email: string; password: string };
  }>('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await fastify.prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user || !user.passwordHash) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        } as ApiResponse);
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        } as ApiResponse);
      }

      if (!user.isActive) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'User account is inactive',
          },
        } as ApiResponse);
      }

      // Store user info in session
      request.session.userId = user.id;
      request.session.email = user.email;
      request.session.roles = user.roles.map((ur) => ur.role.name);

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles.map((ur) => ur.role.name),
          },
        },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Invalid request',
        },
      } as ApiResponse);
    }
  });

  // POST /api/auth/logout
  fastify.post('/logout', async (request, reply) => {
    request.session.destroy();
    return reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
    } as ApiResponse);
  });

  // GET /api/auth/me
  fastify.get('/me', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user!.id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      } as ApiResponse);
    }

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles.map((ur) => ur.role.name),
        },
      },
    } as ApiResponse);
  });
};

export default authRoutes;
