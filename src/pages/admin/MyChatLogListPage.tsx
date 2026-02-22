import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../api/api'
import type {
  IntimacyLevelOption,
  ChatLogListResponse,
  PageInfo,
} from '../../types/chatLog'

export default function MyChatLogListPage() {
  const navigate = useNavigate()

  // 날짜 필터
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 선택 필터
  const [selectedConcept, setSelectedConcept] = useState('')
  const [selectedIntimacyLevel, setSelectedIntimacyLevel] = useState('')

  // 옵션 데이터
  const [intimacyOptions, setIntimacyOptions] = useState<IntimacyLevelOption[]>([])

  // 검색 결과
  const [chatLogs, setChatLogs] = useState<ChatLogListResponse[]>([])
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 초기 로드: 옵션 조회 + 최근 7일 기본 검색
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // 1. 친밀도 옵션 조회
        const intimacyRes = await api.get<IntimacyLevelOption[]>('/api/admin/chat-logs/intimacy-levels')
        setIntimacyOptions(intimacyRes.data)
        console.log('✅ 친밀도 옵션:', intimacyRes.data)

        // 3. 최근 7일 기본 검색
        const defaultEnd = new Date().toISOString().split('T')[0]
        const defaultStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]

        setStartDate(defaultStart)
        setEndDate(defaultEnd)

        // 4. 검색 실행
        await runSearch({ startDate: defaultStart, endDate: defaultEnd, page: 0 })
      } catch (err) {
        console.error('❌ 옵션 로딩 실패:', err)
      }
    }

    loadOptions()
  }, [])

  // 실제 검색 실행 (파라미터 직접 전달)
  const runSearch = async (params: {
    startDate: string
    endDate?: string
    concept?: string
    intimacyLevel?: number
    page?: number
    size?: number
  }) => {
    if (!params.startDate) {
      setError('시작일을 입력해주세요')
      return
    }

    const searchParams: Record<string, string | number> = {
      startDate: params.startDate,
      page: params.page ?? 0,
      size: params.size ?? 20,
    }
    if (params.endDate) searchParams.endDate = params.endDate
    if (params.concept) searchParams.concept = params.concept
    if (params.intimacyLevel !== undefined) searchParams.intimacyLevel = params.intimacyLevel

    console.log('🔍 검색 파라미터:', searchParams)

    try {
      setIsLoading(true)
      setError(null)

      const response = await api.get<{
        content: ChatLogListResponse[]
        totalPages: number
        totalElements: number
        numberOfElements: number
      }>(
        '/api/admin/chat-logs/search',
        { params: searchParams }
      )

      console.log('✅ 검색 결과:', response.data)
      setChatLogs(response.data.content || [])
      setPageInfo({
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements,
        numberOfElements: response.data.numberOfElements,
      })
      setCurrentPage(params.page ?? 0)
    } catch (err) {
      console.error('❌ 검색 실패:', err)
      setError('검색에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 조회하기 버튼: 현재 상태 값으로 검색
  const handleSearchClick = () => {
    runSearch({
      startDate,
      endDate: endDate || undefined,
      concept: selectedConcept || undefined,
      intimacyLevel: selectedIntimacyLevel ? Number(selectedIntimacyLevel) : undefined,
      page: 0,
    })
  }

  // 페이지 이동
  const goToPage = (page: number) => {
    runSearch({
      startDate,
      endDate: endDate || undefined,
      concept: selectedConcept || undefined,
      intimacyLevel: selectedIntimacyLevel ? Number(selectedIntimacyLevel) : undefined,
      page,
    })
  }

  // 행 클릭 (상세 페이지로 이동)
  const handleRowClick = (id: string) => {
    navigate(`/admin/chat-management/chat-logs/${id}`)
  }

  // concept 문자열을 보기 좋게 변환 ("HONEY" → "Honey")
  const formatConcept = (concept: string) =>
    concept.charAt(0).toUpperCase() + concept.slice(1).toLowerCase()

  return (
    <AdminLayout>
      <div className="w-full p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">채팅 로그 조회</h1>
          <p className="text-lg text-gray-600">사용자의 채팅 내역을 조회할 수 있습니다.</p>
        </div>

        {/* 검색 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
          <div className="grid grid-cols-4 gap-4">
            {/* 시작일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            {/* 종료일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            {/* 채팅룸 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">채팅룸</label>
              <select
                value={selectedConcept}
                onChange={(e) => setSelectedConcept(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="">채팅룸을 선택해주세요</option>
                <option value="HONEY">Honey</option>
                <option value="FRIEND">Friend</option>
                <option value="COWORKER">Coworker</option>
                <option value="SENIOR">Senior</option>
              </select>
            </div>

            {/* 친밀도 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">친밀도</label>
              <select
                value={selectedIntimacyLevel}
                onChange={(e) => setSelectedIntimacyLevel(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="">친밀도를 선택해주세요</option>
                {intimacyOptions
                  .filter((opt) => opt.level !== 2)
                  .map((option) => (
                    <option key={option.level} value={option.level}>
                      {option.description}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 text-red-600 text-sm">{error}</div>
          )}

          {/* 조회하기 버튼 */}
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSearchClick} variant="confirm" size="md">
              조회하기
            </Button>
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">검색 결과</h2>

          {isLoading ? (
            <LoadingSpinner message="검색 중..." />
          ) : chatLogs.length > 0 ? (
            <>
              {/* 결과 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        사용자 ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        날짜
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        채팅룸
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        친밀도
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        메시지 수
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                        상세
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chatLogs.map((log) => (
                      <tr
                        key={log.chatroomId}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(log.chatroomId)}
                      >
                        <td className="py-3 px-4 text-sm">{log.userEmail}</td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(log.lastMessageAt).toLocaleString('ko-KR')}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {log.concept ? formatConcept(log.concept) : log.chatroomName}
                        </td>
                        <td className="py-3 px-4 text-sm">Level {log.intimacyLevel}</td>
                        <td className="py-3 px-4 text-sm">{log.messageCount}</td>
                        <td className="py-3 px-4 text-center text-sm">
                          <span className="text-blue-600">→</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {pageInfo && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {currentPage + 1} / {pageInfo.totalPages} 페이지 (총 {pageInfo.totalElements}건)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 0}
                      variant="cancel"
                    >
                      이전
                    </Button>
                    <Button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= pageInfo.totalPages - 1}
                      variant="cancel"
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {error ? '' : '검색 결과가 없습니다.'}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
