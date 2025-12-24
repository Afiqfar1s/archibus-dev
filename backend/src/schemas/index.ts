import { z } from 'zod';

// ========== AUTH SCHEMAS ==========
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ========== SERVICE REQUEST SCHEMAS ==========
export const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const statusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'TRIAGED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED',
  'CANCELLED',
]);

export const createServiceRequestSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  siteId: z.number().int().positive(),
  buildingId: z.number().int().positive(),
  floorId: z.number().int().positive(),
  roomId: z.number().int().positive(),
  problemTypeId: z.number().int().positive(),
  priority: priorityEnum.default('MEDIUM'),
  requestedForUserId: z.number().int().positive().optional(),
});

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;

export const updateServiceRequestSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  siteId: z.number().int().positive().optional(),
  buildingId: z.number().int().positive().optional(),
  floorId: z.number().int().positive().optional(),
  roomId: z.number().int().positive().optional(),
  problemTypeId: z.number().int().positive().optional(),
  priority: priorityEnum.optional(),
  requestedForUserId: z.number().int().positive().nullable().optional(),
});

export type UpdateServiceRequestInput = z.infer<typeof updateServiceRequestSchema>;

export const assignServiceRequestSchema = z.object({
  assignedTradeId: z.number().int().positive().optional(),
  assignedTechnicianId: z.number().int().positive().optional(),
}).refine(data => data.assignedTradeId || data.assignedTechnicianId, {
  message: 'Either assignedTradeId or assignedTechnicianId must be provided',
});

export type AssignServiceRequestInput = z.infer<typeof assignServiceRequestSchema>;

export const listServiceRequestsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  siteId: z.coerce.number().int().positive().optional(),
  buildingId: z.coerce.number().int().positive().optional(),
  srNumber: z.string().optional(),
  keyword: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type ListServiceRequestsInput = z.infer<typeof listServiceRequestsSchema>;

// ========== COMMENT SCHEMAS ==========
export const createCommentSchema = z.object({
  body: z.string().min(1),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// ========== ATTACHMENT SCHEMAS ==========
export const createAttachmentSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
});

export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;

// ========== RESPONSE SCHEMAS ==========
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
};
