import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  getChatroomOptions,
  getIntimacyLevelOptions,
  searchChatLogs,
} from '../../api/admin/myChatLogs'
import type {
  ChatroomOption,
  IntimacyLevelOption,
  ChatLogListPageResponse,
} from '../../types/chatLog'

export default function MyChatLogListPage() {
  const navigate = useNavigate()

  // 필터 상태 (날짜: yyyy-MM-dd 문자열)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [chatroomId, setChatroomId] = useState('')
  const [intimacyLevel, setIntimacyLevel] = useState<number | ''>('')

  // 옵션 데이터
  const [chatroomOptions, setChatroomOptions] = useState<ChatroomOption[]>([])
  const [intimacyOptions, setIntimacyOptions] = useState<IntimacyLevelOption[]>([])

  // 검색 결과
  const [searchResult, setSearchResult] = useState<ChatLogListPageResponse | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 초기 로드: 옵션 조회 + 최근 7일 기본 검색
  useEffect(() => {
    const init = async () => {
      // 옵션 로드
      try {
        const [chatrooms, intimacyLevels] = await Promise.all([
          getChatroomOptions(),
          getIntimacyLevelOptions(),
        ])
        setChatroomOptions(chatrooms)
        setIntimacyOptions(intimacyLevels)
      } catch (err) {
        console.error('옵션 로드 실패:', err)
      }

      // 기본 검색: 오늘 기준 최근 7일
      const defaultEnd = new Date().toISOString().split('T')[0]
      const defaultStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      setStartDate(defaultStart)
      setEndDate(defaultEnd)

      try {
        setIsLoading(true)
        setError(null)
        const result = await searchChatLogs({
          startDate: defaultStart,
          endDate: defaultEnd,
          page: 0,
          size: 20,
        })
        setSearchResult(result)
        setCurrentPage(0)
      } catch (err) {
        console.error('초기 검색 실패:', err)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  // 검색 실행 (버튼 클릭 / 페이지 이동)
  const handleSearch = async (page: number = 0) => {
    if (!startDate) {
      setError('시작일을 입력해주세요')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await searchChatLogs({
        startDate,
        endDate: endDate || undefined,
        chatroomId: chatroomId || undefined,
        intimacyLevel: intimacyLevel === '' ? undefined : intimacyLevel,
        page,
        size: 20,
      })

      setSearchResult(result)
      setCurrentPage(page)
    } catch (err) {
      console.error('검색 실패:', err)
      setError('검색에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 조회하기 버튼
  const handleSearchClick = () => {
    handleSearch(0)
  }

  // 행 클릭 (상세 페이지로 이동)
  const handleRowClick = (id: string) => {
    navigate(`/admin/chat-management/chat-logs/${id}`)
  }

  // 페이지 이동
  const goToPage = (page: number) => {
    handleSearch(page)
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
                value={chatroomId}
                onChange={(e) => setChatroomId(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="">채팅룸을 선택해주세요</option>
                {chatroomOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {formatConcept(option.concept)}
                  </option>
                ))}
              </select>
            </div>

            {/* 친밀도 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">친밀도</label>
              <select
                value={intimacyLevel}
                onChange={(e) => {
                  const value = e.target.value
                  setIntimacyLevel(value === '' ? '' : Number(value))
                }}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="">친밀도를 선택해주세요</option>
                {intimacyOptions
                  .filter((opt) => opt.value !== 2)
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 text-red-600 text-sm">
              {error}
            </div>
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
          ) : searchResult && searchResult.content.length > 0 ? (
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
                    {searchResult.content.map((log) => (
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
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {currentPage + 1} / {searchResult.page.totalPages} 페이지 (총{' '}
                  {searchResult.page.totalElements}건)
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
                    disabled={currentPage >= searchResult.page.totalPages - 1}
                    variant="cancel"
                  >
                    다음
                  </Button>
                </div>
              </div>
            </>
          ) : searchResult ? (
            <div className="text-center py-8 text-gray-500">검색 결과가 없습니다.</div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              검색 조건을 입력하고 조회하기 버튼을 클릭하세요.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
