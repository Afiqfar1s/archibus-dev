import { FastifyPluginAsync } from 'fastify';
import {
  createServiceRequestSchema,
  updateServiceRequestSchema,
  assignServiceRequestSchema,
  listServiceRequestsSchema,
  createCommentSchema,
  createAttachmentSchema,
  ApiResponse,
} from '../schemas';
import { generateSRNumber } from '../utils/sr-number';
import { hasAnyRole, hasRole } from '../plugins/rbac';
import { ServiceRequestStatus, Prisma } from '@prisma/client';

const serviceRequestRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/service-requests - Create a new service request (REQUESTOR+)
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const data = createServiceRequestSchema.parse(request.body);
      const user = request.user!;

      // Generate SR number
      const srNumber = await generateSRNumber();

      // Create service request
      const serviceRequest = await fastify.prisma.serviceRequest.create({
        data: {
          srNumber,
          title: data.title,
          description: data.description,
          siteId: data.siteId,
          buildingId: data.buildingId,
          floorId: data.floorId,
          roomId: data.roomId,
          problemTypeId: data.problemTypeId,
          priority: data.priority,
          requestedByUserId: user.id,
          requestedForUserId: data.requestedForUserId,
          status: 'DRAFT',
        },
        include: {
          site: true,
          building: true,
          floor: true,
          room: true,
          problemType: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
          requestedFor: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create audit log
      await fastify.prisma.serviceRequestAudit.create({
        data: {
          serviceRequestId: serviceRequest.id,
          userId: user.id,
          action: 'CREATED',
          toStatus: 'DRAFT',
        },
      });

      return reply.code(201).send({
        success: true,
        data: { serviceRequest },
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

  // GET /api/service-requests - List service requests with filters
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const filters = listServiceRequestsSchema.parse(request.query);

      const where: Prisma.ServiceRequestWhereInput = {};

      if (filters.status) {
        where.status = filters.status as ServiceRequestStatus;
      }
      if (filters.priority) {
        where.priority = filters.priority;
      }
      if (filters.siteId) {
        where.siteId = filters.siteId;
      }
      if (filters.buildingId) {
        where.buildingId = filters.buildingId;
      }
      if (filters.srNumber) {
        where.srNumber = { contains: filters.srNumber, mode: 'insensitive' };
      }
      if (filters.keyword) {
        where.OR = [
          { title: { contains: filters.keyword, mode: 'insensitive' } },
          { description: { contains: filters.keyword, mode: 'insensitive' } },
        ];
      }
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.createdAt.lte = new Date(filters.dateTo);
        }
      }

      const [total, serviceRequests] = await Promise.all([
        fastify.prisma.serviceRequest.count({ where }),
        fastify.prisma.serviceRequest.findMany({
          where,
          include: {
            site: true,
            building: true,
            floor: true,
            room: true,
            problemType: true,
            requestedBy: {
              select: { id: true, name: true, email: true },
            },
            assignedTechnician: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
      ]);

      // Calculate overdue flags
      const now = new Date();
      const serviceRequestsWithFlags = serviceRequests.map((sr) => ({
        ...sr,
        isResponseOverdue: sr.responseDueAt && sr.responseDueAt < now && sr.status !== 'CLOSED' && sr.status !== 'CANCELLED',
        isResolveOverdue: sr.resolveDueAt && sr.resolveDueAt < now && sr.status !== 'CLOSED' && sr.status !== 'CANCELLED',
      }));

      return reply.send({
        success: true,
        data: {
          serviceRequests: serviceRequestsWithFlags,
          pagination: {
            page: filters.page,
            pageSize: filters.pageSize,
            total,
            totalPages: Math.ceil(total / filters.pageSize),
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

  // GET /api/service-requests/:id - Get service request details
  fastify.get('/:id', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const serviceRequest = await fastify.prisma.serviceRequest.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
          site: true,
          building: true,
          floor: true,
          room: true,
          problemType: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
          requestedFor: {
            select: { id: true, name: true, email: true },
          },
          assignedTrade: true,
          assignedTechnician: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              trade: true,
            },
          },
        },
      });

      if (!serviceRequest) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found',
          },
        } as ApiResponse);
      }

      // Calculate overdue flags
      const now = new Date();
      const serviceRequestWithFlags = {
        ...serviceRequest,
        isResponseOverdue: serviceRequest.responseDueAt && serviceRequest.responseDueAt < now && serviceRequest.status !== 'CLOSED' && serviceRequest.status !== 'CANCELLED',
        isResolveOverdue: serviceRequest.resolveDueAt && serviceRequest.resolveDueAt < now && serviceRequest.status !== 'CLOSED' && serviceRequest.status !== 'CANCELLED',
      };

      return reply.send({
        success: true,
        data: { serviceRequest: serviceRequestWithFlags },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch service request',
        },
      } as ApiResponse);
    }
  });

  // PATCH /api/service-requests/:id - Update service request (DRAFT only, by creator or ADMIN)
  fastify.patch('/:id', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateServiceRequestSchema.parse(request.body);
      const user = request.user!;

      const serviceRequest = await fastify.prisma.serviceRequest.findUnique({
        where: { id: parseInt(id, 10) },
      });

      if (!serviceRequest) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found',
          },
        } as ApiResponse);
      }

      // Check permissions: DRAFT only, by creator or ADMIN
      if (serviceRequest.status !== 'DRAFT') {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Can only edit service requests in DRAFT status',
          },
        } as ApiResponse);
      }

      if (serviceRequest.requestedByUserId !== user.id && !hasRole(user, 'ADMIN')) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Can only edit your own service requests',
          },
        } as ApiResponse);
      }

      const updated = await fastify.prisma.serviceRequest.update({
        where: { id: parseInt(id, 10) },
        data,
        include: {
          site: true,
          building: true,
          floor: true,
          room: true,
          problemType: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
          requestedFor: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create audit log
      await fastify.prisma.serviceRequestAudit.create({
        data: {
          serviceRequestId: updated.id,
          userId: user.id,
          action: 'UPDATED',
          metaJson: JSON.stringify(data),
        },
      });

      return reply.send({
        success: true,
        data: { serviceRequest: updated },
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

  // POST /api/service-requests/:id/submit - Submit request (DRAFT -> SUBMITTED)
  fastify.post('/:id/submit', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user!;

      const serviceRequest = await fastify.prisma.serviceRequest.findUnique({
        where: { id: parseInt(id, 10) },
      });

      if (!serviceRequest) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found',
          },
        } as ApiResponse);
      }

      if (serviceRequest.status !== 'DRAFT') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot submit service request with status ${serviceRequest.status}`,
          },
        } as ApiResponse);
      }

      // Calculate SLA due dates based on priority
      const now = new Date();
      let responseDueAt: Date;
      let resolveDueAt: Date;

      switch (serviceRequest.priority) {
        case 'URGENT':
          responseDueAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
          resolveDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
          break;
        case 'HIGH':
          responseDueAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
          resolveDueAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
          break;
        case 'MEDIUM':
          responseDueAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours
          resolveDueAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
          break;
        case 'LOW':
        default:
          responseDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
          resolveDueAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
          break;
      }

      const updated = await fastify.prisma.serviceRequest.update({
        where: { id: parseInt(id, 10) },
        data: {
          status: 'SUBMITTED',
          responseDueAt,
          resolveDueAt,
        },
        include: {
          site: true,
          building: true,
          floor: true,
          room: true,
          problemType: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create audit log
      await fastify.prisma.serviceRequestAudit.create({
        data: {
          serviceRequestId: updated.id,
          userId: user.id,
          action: 'STATUS_CHANGED',
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
        },
      });

      return reply.send({
        success: true,
        data: { serviceRequest: updated },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit service request',
        },
      } as ApiResponse);
    }
  });

  // POST /api/service-requests/:id/triage - Triage request (SUBMITTED -> TRIAGED) (SUPERVISOR/ADMIN)
  fastify.post('/:id/triage', {
    preHandler: [fastify.authenticate, fastify.requireRoles(['SUPERVISOR', 'ADMIN'])],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user!;

      const serviceRequest = await fastify.prisma.serviceRequest.findUnique({
        where: { id: parseInt(id, 10) },
      });

      if (!serviceRequest) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found',
          },
        } as ApiResponse);
      }

      if (serviceRequest.status !== 'SUBMITTED') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot triage service request with status ${serviceRequest.status}`,
          },
        } as ApiResponse);
      }

      const updated = await fastify.prisma.serviceRequest.update({
        where: { id: parseInt(id, 10) },
        data: { status: 'TRIAGED' },
        include: {
          site: true,
          building: true,
          floor: true,
          room: true,
          problemType: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      await fastify.prisma.serviceRequestAudit.create({
        data: {
          serviceRequestId: updated.id,
          userId: user.id,
          action: 'STATUS_CHANGED',
          fromStatus: 'SUBMITTED',
          toStatus: 'TRIAGED',
        },
      });

      return reply.send({
        success: true,
        data: { serviceRequest: updated },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to triage service request',
        },
      } as ApiResponse);
    }
  });

  // POST /api/service-requests/:id/assign - Assign request (TRIAGED -> ASSIGNED) (SUPERVISOR/ADMIN)
  fastify.post('/:id/assign', {
    preHandler: [fastify.authenticate, fastify.requireRoles(['SUPERVISOR', 'ADMIN'])],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = assignServiceRequestSchema.parse(request.body);
      const user = request.user!;

      const serviceRequest = await fastify.prisma.serviceRequest.findUnique({
        where: { id: parseInt(id, 10) },
      });

      if (!serviceRequest) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found',
          },
        } as ApiResponse);
      }

      if (serviceRequest.status !== 'TRIAGED') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot assign service request with status ${serviceRequest.status}`,
          },
        } as ApiResponse);
      }

      const updated = await fastify.prisma.serviceRequest.update({
        where: { id: parseInt(id, 10) },
        data: {
          status: 'ASSIGNED',
          assignedTradeId: data.assignedTradeId,
          assignedTechnicianId: data.assignedTechnicianId,
        },
        include: {
          site: true,
          building: true,
          floor: true,
          room: true,
          problemType: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
          assignedTrade: true,
          assignedTechnician: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      await fastify.prisma.serviceRequestAudit.create({
        data: {
          serviceRequestId: updated.id,
          userId: user.id,
          action: 'ASSIGNED',
          fromStatus: 'TRIAGED',
          toStatus: 'ASSIGNED',
          metaJson: JSON.stringify(data),
        },
      });

      return reply.send({
        success: true,
        data: { serviceRequest: updated },
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

  // POST /api/service-requests/:id/start - Start work (ASSIGNED -> IN_PROGRESS) (TECHNICIAN/ADMIN)
  fastify.post('/:id/start', {
    preHandler: [fastify.authenticate, fastify.requireRoles(['TECHNICIAN', 'ADMIN'])],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user!;

      const serviceRequest = await fastify.prisma.serviceRequest.findUnique({
        where: { id: parseInt(id, 10) },
      });

      if (!serviceRequest) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found',
          },
        } as ApiResponse);
      }

      if (serviceRequest.status !== 'ASSIGNED') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot start service request with status ${serviceRequest.status}`,
          },
        } as ApiResponse);
      }

      const updated = await fastify.prisma.serviceRequest.update({
        where: { id: parseInt(id, 10) },
        data: { status: 'IN_PROGRESS' },
        include: {
          site: true,
          building: true,
          floor: true,
          room: true,
          problemType: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
          assignedTechnician: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      await fastify.prisma.serviceRequestAudit.create({
        data: {
          serviceRequestId: updated.id,
          userId: user.id,
          action: 'STATUS_CHANGED',
          fromStatus: 'ASSIGNED',
          toStatus: 'IN_PROGRESS',
        },
      });

      return reply.send({
        success: true,
        data: { serviceRequest: updated },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to start service request',
        },
      } as ApiResponse);
    }
  });

  // POST /api/service-requests/:id/complete - Complete work (IN_PROGRESS -> COMPLETED) (TECHNICIAN/ADMIN)
  fastify.post('/:id/complete', {
    preHandler: [fastify.authenticate, fastify.requireRoles(['TECHNICIAN', 'ADMIN'])],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user!;

      const serviceRequest = await fastify.prisma.serviceRequest.findUnique({
        where: { id: parseInt(id, 10) },
      });

      if (!serviceRequest) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found',
          },
        } as ApiResponse);
      }

      if (serviceRequest.status !== 'IN_PROGRESS') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot complete service request with status ${serviceRequest.status}`,
          },
        } as ApiResponse);
      }

      const updated = await fastify.prisma.serviceRequest.update({
        where: { id: parseInt(id, 10) },
        data: { status: 'COMPLETED' },
        include: {
          site: true,
          building: true,
          floor: true,
          room: true,
          problemType: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
          assignedTechnician: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      await fastify.prisma.serviceRequestAudit.create({
        data: {
          serviceRequestId: updated.id,
          userId: user.id,
          action: 'STATUS_CHANGED',
          fromStatus: 'IN_PROGRESS',
          toStatus: 'COMPLETED',
        },
      });

      return reply.send({
        success: true,
        data: { serviceRequest: updated },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to complete service request',
        },
      } as ApiResponse);
    }
  });

  // POST /api/service-requests/:id/close - Close request (COMPLETED -> CLOSED) (SUPERVISOR/ADMIN)
  fastify.post('/:id/close', {
    preHandler: [fastify.authenticate, fastify.requireRoles(['SUPERVISOR', 'ADMIN'])],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user!;

      const serviceRequest = await fastify.prisma.serviceRequest.findUnique({
        where: { id: parseInt(id, 10) },
      });

      if (!serviceRequest) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found',
          },
        } as ApiResponse);
      }

      if (serviceRequest.status !== 'COMPLETED') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot close service request with status ${serviceRequest.status}`,
          },
        } as ApiResponse);
      }

      const updated = await fastify.prisma.serviceRequest.update({
        where: { id: parseInt(id, 10) },
        data: { status: 'CLOSED' },
        include: {
          site: true,
          building: true,
          floor: true,
          room: true,
          problemType: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      await fastify.prisma.serviceRequestAudit.create({
        data: {
          serviceRequestId: updated.id,
          userId: user.id,
          action: 'STATUS_CHANGED',
          fromStatus: 'COMPLETED',
          toStatus: 'CLOSED',
        },
      });

      return reply.send({
        success: true,
        data: { serviceRequest: updated },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to close service request',
        },
      } as ApiResponse);
    }
  });

  // POST /api/service-requests/:id/cancel - Cancel request (REQUESTOR/SUPERVISOR/ADMIN)
  fastify.post('/:id/cancel', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user!;

      const serviceRequest = await fastify.prisma.serviceRequest.findUnique({
        where: { id: parseInt(id, 10) },
      });

      if (!serviceRequest) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found',
          },
        } as ApiResponse);
      }

      // Check status - can only cancel SUBMITTED, TRIAGED, or ASSIGNED
      const allowedStatuses: ServiceRequestStatus[] = ['SUBMITTED', 'TRIAGED', 'ASSIGNED'];
      if (!allowedStatuses.includes(serviceRequest.status)) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot cancel service request with status ${serviceRequest.status}`,
          },
        } as ApiResponse);
      }

      // Check permissions: creator, SUPERVISOR, or ADMIN
      const canCancel =
        serviceRequest.requestedByUserId === user.id ||
        hasAnyRole(user, ['SUPERVISOR', 'ADMIN']);

      if (!canCancel) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to cancel this request',
          },
        } as ApiResponse);
      }

      const updated = await fastify.prisma.serviceRequest.update({
        where: { id: parseInt(id, 10) },
        data: { status: 'CANCELLED' },
        include: {
          site: true,
          building: true,
          floor: true,
          room: true,
          problemType: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      await fastify.prisma.serviceRequestAudit.create({
        data: {
          serviceRequestId: updated.id,
          userId: user.id,
          action: 'CANCELLED',
          fromStatus: serviceRequest.status,
          toStatus: 'CANCELLED',
        },
      });

      return reply.send({
        success: true,
        data: { serviceRequest: updated },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to cancel service request',
        },
      } as ApiResponse);
    }
  });

  // GET /api/service-requests/:id/comments - Get comments
  fastify.get('/:id/comments', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const comments = await fastify.prisma.serviceRequestComment.findMany({
        where: { serviceRequestId: parseInt(id, 10) },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return reply.send({
        success: true,
        data: { comments },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch comments',
        },
      } as ApiResponse);
    }
  });

  // POST /api/service-requests/:id/comments - Add comment
  fastify.post('/:id/comments', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = createCommentSchema.parse(request.body);
      const user = request.user!;

      const comment = await fastify.prisma.serviceRequestComment.create({
        data: {
          serviceRequestId: parseInt(id, 10),
          userId: user.id,
          body: data.body,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return reply.code(201).send({
        success: true,
        data: { comment },
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

  // GET /api/service-requests/:id/attachments - Get attachments
  fastify.get('/:id/attachments', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const attachments = await fastify.prisma.serviceRequestAttachment.findMany({
        where: { serviceRequestId: parseInt(id, 10) },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({
        success: true,
        data: { attachments },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch attachments',
        },
      } as ApiResponse);
    }
  });

  // POST /api/service-requests/:id/attachments - Add attachment metadata
  fastify.post('/:id/attachments', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = createAttachmentSchema.parse(request.body);
      const user = request.user!;

      const attachment = await fastify.prisma.serviceRequestAttachment.create({
        data: {
          serviceRequestId: parseInt(id, 10),
          userId: user.id,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return reply.code(201).send({
        success: true,
        data: { attachment },
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

  // GET /api/service-requests/:id/audit - Get audit trail
  fastify.get('/:id/audit', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const auditLogs = await fastify.prisma.serviceRequestAudit.findMany({
        where: { serviceRequestId: parseInt(id, 10) },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({
        success: true,
        data: { auditLogs },
      } as ApiResponse);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch audit logs',
        },
      } as ApiResponse);
    }
  });
};

export default serviceRequestRoutes;
