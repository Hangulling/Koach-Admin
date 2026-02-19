import api from './api'
import { decodeJwt } from '../utils/authToken'

export interface AdminUser {
  id: string
  name: string
  email: string
  role?: string
}

export interface ChatroomOption {
  id: string
  name: string
  concept: string
  userEmail: string
}

/**
 * Admin 사용자 정보 조회
 * 토큰에서 사용자 ID를 추출하여 사용자 정보를 가져옵니다.
 * axios api 사용 → 401 시 리프레시·재시도 후 실패 시 로그인 리다이렉트.
 */
export async function getAdminUser(): Promise<AdminUser> {
  const token = sessionStorage.getItem('accessToken')
  if (!token) {
    throw new Error('No access token found')
  }

  const decoded = decodeJwt(token)
  const userId = (decoded?.sub as string) || (decoded?.userId as string) || (decoded?.id as string)
  if (!userId) {
    throw new Error('User ID not found in token')
  }

  const { data } = await api.get<{ id: string; name: string; email: string; role?: string }>(
    `/api/users/${userId}`
  )
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
  }
}

/**
 * 채팅룸 옵션 조회
 * axios api 사용 → 401 시 리프레시·재시도 후 실패 시 로그인 리다이렉트.
 */
export async function getChatroomOptions(): Promise<ChatroomOption[]> {
  const { data } = await api.get<ChatroomOption[]>('/api/admin/chat-logs/chatrooms')
  return data
}
