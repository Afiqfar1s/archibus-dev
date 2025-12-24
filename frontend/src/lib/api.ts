import {
  ApiResponse,
  User,
  LoginRequest,
  ServiceRequest,
  CreateServiceRequestRequest,
  UpdateServiceRequestRequest,
  AssignServiceRequestRequest,
  ListServiceRequestsParams,
  ServiceRequestComment,
  CreateCommentRequest,
  ServiceRequestAttachment,
  CreateAttachmentRequest,
  ServiceRequestAudit,
  Site,
  Building,
  Floor,
  Room,
  ProblemType,
  Trade,
  Technician,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Important for session cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw data;
  }

  return data;
}

// ========== AUTH API ==========
export const authAPI = {
  login: async (credentials: LoginRequest) => {
    return fetchAPI<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async () => {
    return fetchAPI('/auth/logout', {
      method: 'POST',
    });
  },

  me: async () => {
    return fetchAPI<{ user: User }>('/auth/me');
  },
};

// ========== SERVICE REQUESTS API ==========
export const serviceRequestsAPI = {
  list: async (params?: ListServiceRequestsParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return fetchAPI<{ serviceRequests: ServiceRequest[]; pagination: any }>(
      `/service-requests${query ? `?${query}` : ''}`
    );
  },

  get: async (id: number) => {
    return fetchAPI<{ serviceRequest: ServiceRequest }>(`/service-requests/${id}`);
  },

  create: async (data: CreateServiceRequestRequest) => {
    return fetchAPI<{ serviceRequest: ServiceRequest }>('/service-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: UpdateServiceRequestRequest) => {
    return fetchAPI<{ serviceRequest: ServiceRequest }>(`/service-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  submit: async (id: number) => {
    return fetchAPI<{ serviceRequest: ServiceRequest }>(`/service-requests/${id}/submit`, {
      method: 'POST',
    });
  },

  triage: async (id: number) => {
    return fetchAPI<{ serviceRequest: ServiceRequest }>(`/service-requests/${id}/triage`, {
      method: 'POST',
    });
  },

  assign: async (id: number, data: AssignServiceRequestRequest) => {
    return fetchAPI<{ serviceRequest: ServiceRequest }>(`/service-requests/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  start: async (id: number) => {
    return fetchAPI<{ serviceRequest: ServiceRequest }>(`/service-requests/${id}/start`, {
      method: 'POST',
    });
  },

  complete: async (id: number) => {
    return fetchAPI<{ serviceRequest: ServiceRequest }>(`/service-requests/${id}/complete`, {
      method: 'POST',
    });
  },

  close: async (id: number) => {
    return fetchAPI<{ serviceRequest: ServiceRequest }>(`/service-requests/${id}/close`, {
      method: 'POST',
    });
  },

  cancel: async (id: number) => {
    return fetchAPI<{ serviceRequest: ServiceRequest }>(`/service-requests/${id}/cancel`, {
      method: 'POST',
    });
  },

  // Comments
  getComments: async (id: number) => {
    return fetchAPI<{ comments: ServiceRequestComment[] }>(`/service-requests/${id}/comments`);
  },

  addComment: async (id: number, data: CreateCommentRequest) => {
    return fetchAPI<{ comment: ServiceRequestComment }>(`/service-requests/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Attachments
  getAttachments: async (id: number) => {
    return fetchAPI<{ attachments: ServiceRequestAttachment[] }>(
      `/service-requests/${id}/attachments`
    );
  },

  addAttachment: async (id: number, data: CreateAttachmentRequest) => {
    return fetchAPI<{ attachment: ServiceRequestAttachment }>(
      `/service-requests/${id}/attachments`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  // Audit trail
  getAudit: async (id: number) => {
    return fetchAPI<{ auditLogs: ServiceRequestAudit[] }>(`/service-requests/${id}/audit`);
  },
};

// ========== REFERENCE DATA API ==========
export const referenceAPI = {
  getSites: async () => {
    return fetchAPI<{ sites: Site[] }>('/reference/sites');
  },

  getBuildings: async (siteId?: number) => {
    const query = siteId ? `?siteId=${siteId}` : '';
    return fetchAPI<{ buildings: Building[] }>(`/reference/buildings${query}`);
  },

  getFloors: async (buildingId?: number) => {
    const query = buildingId ? `?buildingId=${buildingId}` : '';
    return fetchAPI<{ floors: Floor[] }>(`/reference/floors${query}`);
  },

  getRooms: async (floorId?: number) => {
    const query = floorId ? `?floorId=${floorId}` : '';
    return fetchAPI<{ rooms: Room[] }>(`/reference/rooms${query}`);
  },

  getProblemTypes: async () => {
    return fetchAPI<{ problemTypes: ProblemType[] }>('/reference/problem-types');
  },

  getTrades: async () => {
    return fetchAPI<{ trades: Trade[] }>('/reference/trades');
  },

  getTechnicians: async (tradeId?: number) => {
    const query = tradeId ? `?tradeId=${tradeId}` : '';
    return fetchAPI<{ technicians: Technician[] }>(`/reference/technicians${query}`);
  },

  getUsers: async () => {
    return fetchAPI<{ users: User[] }>('/reference/users');
  },
};
