import { useState, type ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'
import HamburgerIcon from '../icon/HamburgerIcon'

type AdminLayoutProps = {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	
  return (
    <div className="flex h-screen bg-gray-50 w-full overflow-hidden">
			{/* 모바일용 배경 오버레이 */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/70 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 좌측 사이드바 */}
      <div className={`
        fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* 모바일 전용 상단 헤더 */}
        <header className="flex items-center px-4 py-3 bg-white border-b border-gray-600 lg:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <HamburgerIcon size={24} className="text-gray-600" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
