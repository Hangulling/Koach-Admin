import api from '../api';

export interface AdminConversationListItem {
  conversationId: string;
  userId?: string | null;
  roomKey?: string | null;
  intimacyLevel?: number | null;
  lastMessageAt?: string | null;
  lastSequenceNumber?: number | null;
}

export interface AdminConversationListResponse {
  content: AdminConversationListItem[];
  page: {
    number: number;
    size: number;
    totalPages: number;
    totalElements: number;
  };
}

export interface AdminConversationMessageResponse {
  messageId?: string | null;
  senderType: string;
  content: string;
  contentType?: string | null;
  metadata?: string | null;
  sequenceNumber: number;
  turnNumber: number;
  createdAt?: string | null;
}

export interface AdminConversationDetailResponse {
  conversationId: string;
  timeline: AdminConversationMessageResponse[];
}

export interface ConversationQueryParams {
  userEmail?: string;
  from?: string;
  to?: string;
  roomKey?: string;
  intimacyLevel?: number;
  dataSource?: 'chat' | 'archive';
  page?: number;
  size?: number;
}

/**
 * 대화 목록 조회. axios api 사용 → 401 시 리프레시·재시도 후 실패 시 로그인 리다이렉트.
 */
export const getAdminConversations = async (
  params: ConversationQueryParams
): Promise<AdminConversationListResponse> => {
  const searchParams = new URLSearchParams();
  if (params.userEmail) searchParams.set('userEmail', params.userEmail);
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.roomKey) searchParams.set('roomKey', params.roomKey);
  if (params.intimacyLevel !== undefined) searchParams.set('intimacyLevel', String(params.intimacyLevel));
  if (params.dataSource) searchParams.set('dataSource', params.dataSource);
  searchParams.set('page', String(params.page ?? 0));
  searchParams.set('size', String(params.size ?? 20));

  const { data } = await api.get<AdminConversationListResponse>(
    `/api/admin/conversations?${searchParams}`
  );
  return data;
};

/**
 * 대화 상세 조회. axios api 사용 → 401 시 리프레시·재시도 후 실패 시 로그인 리다이렉트.
 */
export const getAdminConversationDetail = async (
  conversationId: string,
  dataSource: 'chat' | 'archive' = 'chat'
): Promise<AdminConversationDetailResponse> => {
  const params = new URLSearchParams({ dataSource });
  const { data } = await api.get<AdminConversationDetailResponse>(
    `/api/admin/conversations/${conversationId}?${params}`
  );
  return data;
};
