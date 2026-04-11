import api from '../api'

export interface AdminHomePost {
  id: number
  sourceDomain: 'INSTAGRAM' | 'FACEBOOK'
  externalId: string | null
  title: string | null
  description: string | null
  permalink: string | null
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | null
  coverImageUrl: string | null
  assets: string | null
  isMainHome: boolean
  displayOrder: number | null
  isActive: boolean
  publishedAt: string | null
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface SocialPostBackup {
  id: number
  sourceDomain: 'INSTAGRAM' | 'FACEBOOK'
  externalId: string
  title: string | null
  coverImageUrl: string | null
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | null
  permalink: string | null
  fetchedAt: string
}

export interface PageResponse<T> {
  content: T[]
  pageable: unknown
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface SyncResult {
  syncedCount: number
  source: string
  latestFetchedAt: string
}

export const getAdminPosts = async (params?: {
  scope?: 'main' | 'all'
  keyword?: string
  page?: number
  size?: number
}): Promise<PageResponse<AdminHomePost>> => {
  const res = await api.get('/api/admin/posts', { params })
  return res.data.data
}

export const getAdminPost = async (id: number): Promise<AdminHomePost> => {
  const res = await api.get(`/api/admin/posts/${id}`)
  return res.data.data
}

export const importPost = async (params: {
  backupId: number
  isMainHome: boolean
  displayOrder?: number
}): Promise<AdminHomePost> => {
  const res = await api.post('/api/admin/posts/import', params)
  return res.data.data
}

export const updatePost = async (
  id: number,
  params: { isMainHome?: boolean; displayOrder?: number; isActive?: boolean }
): Promise<AdminHomePost> => {
  const res = await api.patch(`/api/admin/posts/${id}`, params)
  return res.data.data
}

export const deletePost = async (id: number): Promise<void> => {
  await api.delete(`/api/admin/posts/${id}`)
}

export const reorderPosts = async (items: { id: number; displayOrder: number }[]): Promise<void> => {
  await api.patch('/api/admin/posts/reorder', { items })
}

export const getBackupPosts = async (params?: {
  source?: 'INSTAGRAM' | 'FACEBOOK'
  page?: number
  size?: number
}): Promise<PageResponse<SocialPostBackup>> => {
  const res = await api.get('/api/admin/posts/backup', { params })
  return res.data.data
}

export const syncBackup = async (source: 'INSTAGRAM' | 'FACEBOOK' | 'ALL' = 'ALL'): Promise<SyncResult> => {
  const res = await api.post('/api/admin/posts/sync', { source })
  return res.data.data
}
