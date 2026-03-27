import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminUser } from '../../hooks/useAdminUser'
import { adminLogout } from '../../api/admin/auth'
import Button from '../common/Button'

type AdminSidebarProps = {
  onClose?: () => void
}

type MenuItem = {
  label: string
  path: string
  children?: MenuItem[]
}

type MenuSection = {
  title: string
  items: MenuItem[]
}

const menuSections: MenuSection[] = [
  {
    title: '채팅 내역 관리',
    items: [
      { label: '채팅 로그 조회', path: '/admin/chat-management/chat-logs' },
      { label: '관리 필요 내역', path: '/admin/chat-management/management-queue' },
    ],
  },
  {
    title: '프롬프트 관리',
    items: [
      { label: '프롬프트 테스트 및 적용', path: '/prompts/test-and-apply' },
      { label: '프롬프트 버전 관리', path: '/prompts/versions' },
    ],
  },
  {
    title: '아카이브 관리',
    items: [
      { label: '사용자 채팅 내역', path: '/chat-logs/user-history' },
      { label: '관리 필요 내역', path: '/chat-logs/management-needed' },
      { label: '감사 로그', path: '/admin/archive/audit-logs' },
    ],
  },
]

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAdminUser()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['채팅 내역 관리']) // 기본으로 첫 번째 섹션 펼침
  )

const handleMenuClick = (path: string) => {
    navigate(path)
    if (onClose) onClose()
  }

  // 사용자 정보 (인증된 사용자 또는 로딩 중)
  const userName = user?.name || '로딩 중...'
  const adminId = user?.id || '로딩 중...'

  // 현재 경로에 해당하는 메뉴가 속한 섹션은 펼쳐 두기 (해당 메뉴 하이라이트가 보이도록)
  useEffect(() => {
    const pathname = location.pathname
    for (const section of menuSections) {
      const hasActive = section.items.some(
        item => pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path + '/'))
      )
      if (hasActive) {
        setExpandedSections(prev => (prev.has(section.title) ? prev : new Set(prev).add(section.title)))
        break
      }
    }
  }, [location.pathname])

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  // 현재 경로와 일치하거나 그 하위 경로(예: /my/chat-logs/123)일 때 활성
  const isActive = (path: string) => {
    const pathname = location.pathname
    if (pathname === path) return true
    if (path !== '/' && pathname.startsWith(path + '/')) return true
    return false
  }

  const handleLogout = async () => {
    try {
      await adminLogout()
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error)
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="w-72 h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
        <h1 className="text-2xl text-title">Koach Admin</h1>
				<button onClick={onClose} className="lg:hidden text-gray-400">✕</button>
      </div>

      {/* 사용자 정보 */}
      <div className="p-6 border-b border-gray-200">
        <div className="mb-4">
          <p className="font-semibold mb-1">{userName}님</p>
          <p className="text-sm text-gray-500">관리자 ID: {adminId}</p>
        </div>
        <Button
          onClick={handleLogout}
					variant='confirm'
					size='confirm'
        >
          로그아웃
        </Button>
      </div>

      {/* 메뉴 */}
      <div className="flex-1 overflow-y-auto">
        {menuSections.map(section => {
          const isExpanded = expandedSections.has(section.title)
          return (
            <div key={section.title} className="border-b border-gray-100">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-base font-semibold text-gray-700">{section.title}</span>
                <span className={`text-gray-400 transition-transform text-sm ${isExpanded ? 'rotate-90' : ''}`}>
                  ▼
                </span>
              </button>
              {isExpanded && (
                <div className="bg-gray-50">
                  {section.items.map(item => {
                    const active = isActive(item.path)
                    return (
                      <button
                        key={item.path}
                        // navigate(item.path) 대신 handleMenuClick 호출
                        onClick={() => handleMenuClick(item.path)}
                        className={`w-full px-8 py-3 text-left text-base transition-colors ${
                          active
                            ? 'bg-primary-300 text-white font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}