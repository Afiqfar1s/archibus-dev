// ========== API TYPES ==========
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ServiceRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export interface User {
  id: number;
  name: string;
  email: string;
  roles?: string[];
}

export interface Site {
  id: number;
  code: string;
  name: string;
}

export interface Building {
  id: number;
  siteId: number;
  code: string;
  name: string;
  site?: Site;
}

export interface Floor {
  id: number;
  buildingId: number;
  code: string;
  name: string;
  building?: Building;
}

export interface Room {
  id: number;
  floorId: number;
  code: string;
  name: string;
  floor?: Floor;
}

export interface ProblemType {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface Trade {
  id: number;
  code: string;
  name: string;
}

export interface Technician {
  id: number;
  userId: number;
  tradeId?: number;
  phone?: string;
  user: User;
  trade?: Trade;
}

export interface ServiceRequest {
  id: number;
  srNumber: string;
  title: string;
  description: string;
  siteId: number;
  buildingId: number;
  floorId: number;
  roomId: number;
  problemTypeId: number;
  priority: Priority;
  requestedByUserId: number;
  requestedForUserId?: number;
  assignedTradeId?: number;
  assignedTechnicianId?: number;
  status: ServiceRequestStatus;
  responseDueAt?: string;
  resolveDueAt?: string;
  createdAt: string;
  updatedAt: string;
  site?: Site;
  building?: Building;
  floor?: Floor;
  room?: Room;
  problemType?: ProblemType;
  requestedBy?: User;
  requestedFor?: User;
  assignedTrade?: Trade;
  assignedTechnician?: Technician;
  isResponseOverdue?: boolean;
  isResolveOverdue?: boolean;
}

export interface ServiceRequestComment {
  id: number;
  serviceRequestId: number;
  userId: number;
  body: string;
  createdAt: string;
  user: User;
}

export interface ServiceRequestAttachment {
  id: number;
  serviceRequestId: number;
  userId: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
  user: User;
}

export interface ServiceRequestAudit {
  id: number;
  serviceRequestId: number;
  userId: number;
  action: string;
  fromStatus?: ServiceRequestStatus;
  toStatus?: ServiceRequestStatus;
  metaJson?: string;
  createdAt: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ========== REQUEST TYPES ==========
export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateServiceRequestRequest {
  title: string;
  description: string;
  siteId: number;
  buildingId: number;
  floorId: number;
  roomId: number;
  problemTypeId: number;
  priority: Priority;
  requestedForUserId?: number;
}

export interface UpdateServiceRequestRequest {
  title?: string;
  description?: string;
  siteId?: number;
  buildingId?: number;
  floorId?: number;
  roomId?: number;
  problemTypeId?: number;
  priority?: Priority;
  requestedForUserId?: number | null;
}

export interface AssignServiceRequestRequest {
  assignedTradeId?: number;
  assignedTechnicianId?: number;
}

export interface ListServiceRequestsParams {
  page?: number;
  pageSize?: number;
  status?: ServiceRequestStatus;
  priority?: Priority;
  siteId?: number;
  buildingId?: number;
  srNumber?: string;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateCommentRequest {
  body: string;
}

export interface CreateAttachmentRequest {
  fileName: string;
  fileUrl: string;
}
