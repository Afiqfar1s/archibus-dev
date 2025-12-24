import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

export type RoleName = 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN' | 'REQUESTOR';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRoles: (roles: RoleName[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: {
      id: number;
      email: string;
      name: string;
      roles: string[];
    };
  }
}

const rbacPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('requireRoles', (allowedRoles: RoleName[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const hasRole = allowedRoles.some((role) => request.user!.roles.includes(role));

      if (!hasRole) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            details: {
              required: allowedRoles,
              actual: request.user.roles,
            },
          },
        });
      }
    };
  });
};

export default fp(rbacPlugin);

export function hasRole(user: { roles: string[] }, role: RoleName): boolean {
  return user.roles.includes(role);
}

export function hasAnyRole(user: { roles: string[] }, roles: RoleName[]): boolean {
  return roles.some((role) => user.roles.includes(role));
}
