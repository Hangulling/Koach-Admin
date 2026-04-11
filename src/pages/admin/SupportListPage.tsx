import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  getSupportList,
  getSupportDetail,
  replySupport,
  updateSupportStatus,
  deleteSupport,
  type SupportSummary,
  type SupportDetail,
  type SupportPageResponse,
} from '../../api/admin/support'

type Tab = 'ALL' | 'PENDING' | 'COMPLETED'

const formatDate = (s: string | null | undefined) => {
  if (!s) return '-'
  return new Date(s).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
    {status === 'COMPLETED' ? '답변완료' : '미답변'}
  </span>
)

export default function SupportListPage() {
  const [tab, setTab] = useState<Tab>('ALL')
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<SupportPageResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const [detail, setDetail] = useState<SupportDetail | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const [answerContent, setAnswerContent] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyResult, setReplyResult] = useState<{ emailSent: boolean } | null>(null)

  const fetchList = useCallback(async (targetPage = 0) => {
    setIsLoading(true)
    setError(null)
    setSelectedIds(new Set())
    try {
      const statusParam = tab === 'ALL' ? undefined : tab
      const result = await getSupportList({
        type: type || undefined,
        status: statusParam,
        from: from ? from + ':00' : undefined,
        to: to ? to + ':59' : undefined,
        page: targetPage,
        size: 20,
      })
      setData(result)
      setPage(targetPage)
    } catch {
      setError('문의 내역 조회에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [tab, type, from, to])

  useEffect(() => {
    fetchList(0)
  }, [fetchList])

  const openDetail = async (id: number) => {
    setDetailLoading(true)
    setIsDetailOpen(true)
    setDetail(null)
    setAnswerContent('')
    setReplyResult(null)
    try {
      const d = await getSupportDetail(id)
      setDetail(d)
      setAnswerContent(d.answerContent || '')
    } catch {
      setError('상세 조회에 실패했습니다.')
      setIsDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleReply = async () => {
    if (!detail) return
    if (!answerContent.trim()) {
      alert('답변 내용을 입력해주세요.')
      return
    }
    setReplyLoading(true)
    try {
      const result = await replySupport(detail.id, answerContent)
      setDetail(result.detail)
      setReplyResult({ emailSent: result.emailSent })
      fetchList(page)
    } catch {
      alert('답변 저장에 실패했습니다.')
    } finally {
      setReplyLoading(false)
    }
  }

  const handleStatusChange = async (id: number, status: 'PENDING' | 'COMPLETED') => {
    try {
      await updateSupportStatus(id, status)
      fetchList(page)
      if (detail?.id === id) {
        const updated = await getSupportDetail(id)
        setDetail(updated)
      }
    } catch {
      alert('상태 변경에 실패했습니다.')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`)) return
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteSupport(id)))
      fetchList(page)
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const ids = data?.content.map(r => r.id) ?? []
    if (selectedIds.size === ids.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(ids))
  }

  const totalPages = data?.page.totalPages ?? 0

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">문의 내역</h1>

        {/* 필터 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">문의 유형</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">전체</option>
              <option value="INQUIRY">문의</option>
              <option value="REPORT">신고</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">시작일</label>
            <input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">종료일</label>
            <input type="datetime-local" value={to} onChange={e => setTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <Button onClick={() => fetchList(0)} variant="confirm" size="confirm">검색</Button>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          {(['ALL', 'PENDING', 'COMPLETED'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-primary-300 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t === 'ALL' ? '전체' : t === 'PENDING' ? '미답변' : '답변완료'}
            </button>
          ))}
        </div>

        {/* 에러 */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input type="checkbox" checked={selectedIds.size === (data?.content.length ?? 0) && (data?.content.length ?? 0) > 0}
                        onChange={toggleAll} className="rounded" />
                    </th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">번호</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">분류</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">문의자</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">내용 미리보기</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">등록일시</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">처리상태</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">답변자</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">답변일시</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data?.content ?? []).map((row: SupportSummary, idx) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} className="rounded" />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{(page * 20) + idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{row.category || row.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{row.requesterName || '-'}</div>
                        <div className="text-xs text-gray-500">{row.requesterEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{row.contentPreview}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3 text-gray-500">{row.answeredBy || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(row.answeredAt)}</td>
                      <td className="px-4 py-3">
                        <Button onClick={() => openDetail(row.id)} variant="confirm" size="confirm">
                          답변하기
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(data?.content.length === 0) && (
                    <tr><td colSpan={10} className="text-center py-8 text-gray-400">문의 내역이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 하단: 일괄 삭제 + 페이지네이션 */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <Button
              onClick={handleBulkDelete}
              variant="confirm"
              size="confirm"
              disabled={selectedIds.size === 0}
              className="disabled:opacity-40"
            >
              선택 삭제 ({selectedIds.size})
            </Button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchList(page - 1)}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
              >이전</button>
              <span className="text-sm text-gray-600">{page + 1} / {totalPages || 1}</span>
              <button
                onClick={() => fetchList(page + 1)}
                disabled={page + 1 >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
              >다음</button>
            </div>
          </div>
        </div>
      </div>

      {/* 상세/답변 모달 */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setIsDetailOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">문의 상세 / 답변</h2>
              <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : detail ? (
              <div className="p-6 space-y-5">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">문의자명</span><p className="font-medium mt-1">{detail.requesterName || '-'}</p></div>
                  <div><span className="text-gray-500">문의 유형</span><p className="font-medium mt-1">{detail.category || detail.type}</p></div>
                  <div><span className="text-gray-500">이메일</span><p className="font-medium mt-1">{detail.replyEmail || detail.requesterEmail}</p></div>
                  <div><span className="text-gray-500">처리 상태</span>
                    <div className="mt-1 flex gap-3">
                      {(['PENDING', 'COMPLETED'] as const).map(s => (
                        <label key={s} className="flex items-center gap-1.5 cursor-pointer text-sm">
                          <input type="radio" name="status" value={s}
                            checked={detail.status === s}
                            onChange={() => handleStatusChange(detail.id, s)}
                            className="accent-primary-300"
                          />
                          {s === 'PENDING' ? '미답변' : '답변완료'}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div><span className="text-gray-500">등록일시</span><p className="font-medium mt-1">{formatDate(detail.createdAt)}</p></div>
                  <div><span className="text-gray-500">답변일시</span><p className="font-medium mt-1">{formatDate(detail.answeredAt)}</p></div>
                </div>

                {/* 문의 내용 */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">문의 내용</p>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {detail.content}
                  </div>
                </div>

                {/* 답변 입력 */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">답변 내용</p>
                  <textarea
                    value={answerContent}
                    onChange={e => setAnswerContent(e.target.value)}
                    rows={5}
                    placeholder="답변 내용을 입력하세요..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                  />
                </div>

                {/* 이메일 발송 결과 */}
                {replyResult && (
                  <div className={`text-sm rounded-lg px-4 py-3 ${replyResult.emailSent ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {replyResult.emailSent ? '✓ 답변이 저장되고 이메일이 발송되었습니다.' : '⚠ 답변은 저장되었으나 이메일 발송에 실패했습니다.'}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button onClick={() => setIsDetailOpen(false)} variant="confirm" size="confirm">닫기</Button>
                  <Button onClick={handleReply} variant="confirm" size="confirm" disabled={replyLoading}>
                    {replyLoading ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
