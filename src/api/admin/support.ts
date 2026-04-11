import api from '../api'

export interface SupportSummary {
  id: number
  userId: string
  requesterName: string
  requesterEmail: string
  type: string
  category: string
  contentPreview: string
  createdAt: string
  replyRequested: boolean
  chatroomId: string | null
  messageId: string | null
  status: 'PENDING' | 'COMPLETED'
  answeredBy: string | null
  answeredAt: string | null
}

export interface SupportDetail extends SupportSummary {
  content: string
  replyEmail: string | null
  messageContent: string | null
  aiResponseSnapshot: unknown
  answerContent: string | null
}

export interface SupportPageResponse {
  content: SupportSummary[]
  page: {
    number: number
    size: number
    totalPages: number
    totalElements: number
  }
}

export interface SupportReplyResult {
  detail: SupportDetail
  emailSent: boolean
}

export interface SupportListParams {
  type?: string
  userId?: string
  category?: string
  replyRequested?: boolean
  status?: string
  from?: string
  to?: string
  page?: number
  size?: number
}

export const getSupportList = async (params: SupportListParams = {}): Promise<SupportPageResponse> => {
  const res = await api.get('/api/admin/support', { params })
  return res.data.data
}

export const getSupportDetail = async (id: number): Promise<SupportDetail> => {
  const res = await api.get(`/api/admin/support/${id}`)
  return res.data.data
}

export const replySupport = async (id: number, answerContent: string): Promise<SupportReplyResult> => {
  const res = await api.patch(`/api/admin/support/${id}/reply`, { answerContent })
  return res.data.data
}

export const updateSupportStatus = async (id: number, status: 'PENDING' | 'COMPLETED'): Promise<SupportDetail> => {
  const res = await api.patch(`/api/admin/support/${id}/status`, { status })
  return res.data.data
}

export const deleteSupport = async (id: number): Promise<void> => {
  await api.delete(`/api/admin/support/${id}`)
}
