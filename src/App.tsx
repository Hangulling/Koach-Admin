import { Suspense, useEffect } from 'react'
import { Routes } from './router/routes'
import LoadingSpinner from './components/common/LoadingSpinner'
import { Toaster } from 'react-hot-toast'

function App() {
  // 401 후 토큰 갱신 실패 시 로그인 페이지로 이동
  useEffect(() => {
    const onAuthExpired = () => {
      sessionStorage.removeItem('adminUser')
      sessionStorage.removeItem('accessToken')
      sessionStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    window.addEventListener('auth:expired', onAuthExpired)
    window.addEventListener('auth:inactive', onAuthExpired)
    return () => {
      window.removeEventListener('auth:expired', onAuthExpired)
      window.removeEventListener('auth:inactive', onAuthExpired)
    }
  }, [])

  return (
    <div className="relative flex flex-col h-screen w-full bg-white">
      <Toaster position="top-right" />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes />
      </Suspense>
    </div>
  )
}

export default App
