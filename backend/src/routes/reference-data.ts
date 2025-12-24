import { FastifyPluginAsync } from 'fastify';
import { ApiResponse } from '../schemas';

const referenceDataRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/reference/sites
  fastify.get('/sites', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const sites = await fastify.prisma.site.findMany({
        orderBy: { name: 'asc' },
      });

      return reply.send({
        success: true,
        data: { sites },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch sites',
        },
      } as ApiResponse);
    }
  });

  // GET /api/reference/buildings?siteId=X
  fastify.get('/buildings', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { siteId } = request.query as { siteId?: string };
      
      const where = siteId ? { siteId: parseInt(siteId, 10) } : {};
      
      const buildings = await fastify.prisma.building.findMany({
        where,
        include: { site: true },
        orderBy: { name: 'asc' },
      });

      return reply.send({
        success: true,
        data: { buildings },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch buildings',
        },
      } as ApiResponse);
    }
  });

  // GET /api/reference/floors?buildingId=X
  fastify.get('/floors', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { buildingId } = request.query as { buildingId?: string };
      
      const where = buildingId ? { buildingId: parseInt(buildingId, 10) } : {};
      
      const floors = await fastify.prisma.floor.findMany({
        where,
        include: { building: true },
        orderBy: { name: 'asc' },
      });

      return reply.send({
        success: true,
        data: { floors },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch floors',
        },
      } as ApiResponse);
    }
  });

  // GET /api/reference/rooms?floorId=X
  fastify.get('/rooms', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { floorId } = request.query as { floorId?: string };
      
      const where = floorId ? { floorId: parseInt(floorId, 10) } : {};
      
      const rooms = await fastify.prisma.room.findMany({
        where,
        include: { floor: true },
        orderBy: { name: 'asc' },
      });

      return reply.send({
        success: true,
        data: { rooms },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch rooms',
        },
      } as ApiResponse);
    }
  });

  // GET /api/reference/problem-types
  fastify.get('/problem-types', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const problemTypes = await fastify.prisma.problemType.findMany({
        orderBy: { name: 'asc' },
      });

      return reply.send({
        success: true,
        data: { problemTypes },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch problem types',
        },
      } as ApiResponse);
    }
  });

  // GET /api/reference/trades
  fastify.get('/trades', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const trades = await fastify.prisma.trade.findMany({
        orderBy: { name: 'asc' },
      });

      return reply.send({
        success: true,
        data: { trades },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch trades',
        },
      } as ApiResponse);
    }
  });

  // GET /api/reference/technicians?tradeId=X
  fastify.get('/technicians', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { tradeId } = request.query as { tradeId?: string };
      
      const where = tradeId ? { tradeId: parseInt(tradeId, 10) } : {};
      
      const technicians = await fastify.prisma.technician.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          trade: true,
        },
        orderBy: { user: { name: 'asc' } },
      });

      return reply.send({
        success: true,
        data: { technicians },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch technicians',
        },
      } as ApiResponse);
    }
  });

  // GET /api/reference/users (for requestedFor dropdown)
  fastify.get('/users', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const users = await fastify.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      });

      return reply.send({
        success: true,
        data: { users },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch users',
        },
      } as ApiResponse);
    }
  });
};

export default referenceDataRoutes;
