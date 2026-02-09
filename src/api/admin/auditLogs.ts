import api from '../api';

export interface AdminAuditLogResponse {
  id: number;
  adminUserId: string;
  actionType: string;
  targetType?: string | null;
  targetId?: number | null;
  summary?: string | null;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AdminAuditLogListResponse {
  content: AdminAuditLogResponse[];
  page: {
    number: number;
    size: number;
    totalPages: number;
    totalElements: number;
  };
}

export interface AuditLogQueryParams {
  adminUserId?: string;
  actionType?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

/**
 * 감사 로그 조회. axios api 사용 → 401 시 리프레시·재시도 후 실패 시 로그인 리다이렉트.
 */
export const getAuditLogs = async (params: AuditLogQueryParams): Promise<AdminAuditLogListResponse> => {
  const searchParams = new URLSearchParams();
  if (params.adminUserId) searchParams.set('adminUserId', params.adminUserId);
  if (params.actionType) searchParams.set('actionType', params.actionType);
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  searchParams.set('page', String(params.page ?? 0));
  searchParams.set('size', String(params.size ?? 20));

  const { data } = await api.get<AdminAuditLogListResponse>(`/api/admin/audit-logs?${searchParams}`);
  return data;
};
