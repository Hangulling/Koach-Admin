import { lazy } from 'react'
import { Navigate, Route, Routes as RouterRoutes } from 'react-router-dom'
import AdminPrivateRoute from './AdminPrivateRoute'

const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage'))
const AdminPage = lazy(() => import('../pages/admin/AdminPage'))
const ChatLogsUserHistoryPage = lazy(() => import('../pages/admin/ChatLogsUserHistoryPage'))
const ChatLogsManagementNeededPage = lazy(() => import('../pages/admin/ChatLogsManagementNeededPage'))
const PromptsTestAndApplyPage = lazy(() => import('../pages/admin/PromptsTestAndApplyPage'))
const PromptVersionsPage = lazy(() => import('../pages/admin/PromptVersionsPage'))
// HistoryPage는 라우터에서 제거 (파일 삭제 보류)

const MyChatLogListPage = lazy(() => import('../pages/admin/MyChatLogListPage'))
const MyChatLogDetailPage = lazy(() => import('../pages/admin/MyChatLogDetailPage'))
const MyManagementQueuePage = lazy(() => import('../pages/admin/MyManagementQueuePage'))
const MyAuditLogPage = lazy(() => import('../pages/admin/MyAuditLogPage'))
const SupportListPage = lazy(() => import('../pages/admin/SupportListPage'))
const PostsManagementPage = lazy(() => import('../pages/admin/PostsManagementPage'))

export function Routes() {
  return (
    <RouterRoutes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route
        path="/"
        element={
          <AdminPrivateRoute>
            <AdminPage />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="/chat-logs/user-history"
        element={
          <AdminPrivateRoute>
            <ChatLogsUserHistoryPage />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="/chat-logs/management-needed"
        element={
          <AdminPrivateRoute>
            <ChatLogsManagementNeededPage />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="/prompts/test-and-apply"
        element={
          <AdminPrivateRoute>
            <PromptsTestAndApplyPage />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="/prompts/versions"
        element={
          <AdminPrivateRoute>
            <PromptVersionsPage />
          </AdminPrivateRoute>
        }
      />
      {/* 채팅 내역 관리 */}
      <Route
        path="/admin/chat-management/chat-logs"
        element={
          <AdminPrivateRoute>
            <MyChatLogListPage />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="/admin/chat-management/chat-logs/:chatroomId"
        element={
          <AdminPrivateRoute>
            <MyChatLogDetailPage />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="/admin/chat-management/management-queue"
        element={
          <AdminPrivateRoute>
            <MyManagementQueuePage />
          </AdminPrivateRoute>
        }
      />

      {/* 아카이브 관리 */}
      <Route
        path="/admin/archive/audit-logs"
        element={
          <AdminPrivateRoute>
            <MyAuditLogPage />
          </AdminPrivateRoute>
        }
      />

      {/* 문의 내역 */}
      <Route
        path="/admin/support"
        element={
          <AdminPrivateRoute>
            <SupportListPage />
          </AdminPrivateRoute>
        }
      />

      {/* 게시글 관리 */}
      <Route
        path="/admin/posts"
        element={
          <AdminPrivateRoute>
            <PostsManagementPage />
          </AdminPrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </RouterRoutes>
  )
}
