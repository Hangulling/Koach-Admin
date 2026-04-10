import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  getAdminPosts,
  getBackupPosts,
  importPost,
  updatePost,
  deletePost,
  reorderPosts,
  syncBackup,
  type AdminHomePost,
  type SocialPostBackup,
  type PageResponse,
} from '../../api/admin/posts'

const MAX_MAIN_HOME = 6

const formatDate = (s: string | null | undefined) => {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const DomainBadge = ({ domain }: { domain: string }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${domain === 'INSTAGRAM' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
    {domain}
  </span>
)

export default function PostsManagementPage() {
  const [allPosts, setAllPosts] = useState<PageResponse<AdminHomePost> | null>(null)
  const [mainHomePosts, setMainHomePosts] = useState<AdminHomePost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedMainIds, setSelectedMainIds] = useState<Set<number>>(new Set())
  const [selectedManageIds, setSelectedManageIds] = useState<Set<number>>(new Set())

  const [page, setPage] = useState(0)

  // 순서 편집 모드
  const [isReordering, setIsReordering] = useState(false)
  const [reorderMap, setReorderMap] = useState<Map<number, number>>(new Map())

  // 백업 모달
  const [isBackupOpen, setIsBackupOpen] = useState(false)
  const [backupTab, setBackupTab] = useState<'INSTAGRAM' | 'FACEBOOK'>('INSTAGRAM')
  const [backupPosts, setBackupPosts] = useState<PageResponse<SocialPostBackup> | null>(null)
  const [backupPage, setBackupPage] = useState(0)
  const [backupLoading, setBackupLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  // 게시글 조회 모달
  const [viewPost, setViewPost] = useState<AdminHomePost | null>(null)

  // 최대 6개 알림 모달
  const [isMaxAlert, setIsMaxAlert] = useState(false)

  const fetchPosts = useCallback(async (targetPage = 0) => {
    setIsLoading(true)
    setError(null)
    try {
      const [allResult, mainResult] = await Promise.all([
        getAdminPosts({ scope: 'all', page: targetPage, size: 20 }),
        getAdminPosts({ scope: 'main', page: 0, size: MAX_MAIN_HOME }),
      ])
      setAllPosts(allResult)
      setMainHomePosts(mainResult.content.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)))
      setPage(targetPage)
    } catch {
      setError('게시글 목록 조회에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchPosts(0) }, [fetchPosts])

  const fetchBackup = useCallback(async (src: 'INSTAGRAM' | 'FACEBOOK', targetPage = 0) => {
    setBackupLoading(true)
    try {
      const result = await getBackupPosts({ source: src, page: targetPage, size: 20 })
      setBackupPosts(result)
      setBackupPage(targetPage)
    } catch {
      setError('백업 목록 조회에 실패했습니다.')
    } finally {
      setBackupLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isBackupOpen) fetchBackup(backupTab, 0)
  }, [isBackupOpen, backupTab, fetchBackup])

  const handleImport = async (backup: SocialPostBackup) => {
    const currentMain = mainHomePosts.length
    if (currentMain >= MAX_MAIN_HOME) {
      setIsMaxAlert(true)
      return
    }
    try {
      await importPost({ backupId: backup.id, isMainHome: false })
      setIsBackupOpen(false)
      fetchPosts(page)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      if (msg?.includes('최대')) {
        setIsMaxAlert(true)
      } else {
        alert('가져오기에 실패했습니다.')
      }
    }
  }

  const handleMoveToMain = async () => {
    if (selectedManageIds.size === 0) return
    const currentMain = mainHomePosts.length
    const toAdd = Array.from(selectedManageIds).filter(id => !mainHomePosts.find(p => p.id === id))
    if (currentMain + toAdd.length > MAX_MAIN_HOME) {
      setIsMaxAlert(true)
      return
    }
    try {
      await Promise.all(toAdd.map(id => updatePost(id, { isMainHome: true })))
      setSelectedManageIds(new Set())
      fetchPosts(page)
    } catch {
      alert('메인홈 이동에 실패했습니다.')
    }
  }

  const handleMoveFromMain = async () => {
    if (selectedMainIds.size === 0) return
    try {
      await Promise.all(Array.from(selectedMainIds).map(id => updatePost(id, { isMainHome: false })))
      setSelectedMainIds(new Set())
      fetchPosts(page)
    } catch {
      alert('내리기에 실패했습니다.')
    }
  }

  const handleDeleteMain = async () => {
    if (selectedMainIds.size === 0) return
    if (!confirm(`선택한 ${selectedMainIds.size}건을 삭제하시겠습니까?`)) return
    try {
      await Promise.all(Array.from(selectedMainIds).map(id => deletePost(id)))
      setSelectedMainIds(new Set())
      fetchPosts(page)
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  const handleDeleteManage = async () => {
    if (selectedManageIds.size === 0) return
    if (!confirm(`선택한 ${selectedManageIds.size}건을 삭제하시겠습니까?`)) return
    try {
      await Promise.all(Array.from(selectedManageIds).map(id => deletePost(id)))
      setSelectedManageIds(new Set())
      fetchPosts(page)
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  const startReorder = () => {
    const map = new Map<number, number>()
    mainHomePosts.forEach(p => map.set(p.id, p.displayOrder ?? 0))
    setReorderMap(map)
    setIsReordering(true)
  }

  const applyReorder = async () => {
    try {
      const items = Array.from(reorderMap.entries()).map(([id, displayOrder]) => ({ id, displayOrder }))
      await reorderPosts(items)
      setIsReordering(false)
      fetchPosts(page)
    } catch {
      alert('순서 저장에 실패했습니다.')
    }
  }

  const handleSync = async () => {
    setSyncLoading(true)
    setSyncMsg(null)
    try {
      const result = await syncBackup(backupTab)
      setSyncMsg(`동기화 완료: ${result.syncedCount}건`)
      fetchBackup(backupTab, backupPage)
    } catch {
      setSyncMsg('동기화에 실패했습니다.')
    } finally {
      setSyncLoading(false)
    }
  }

  const manageOnlyPosts = (allPosts?.content ?? []).filter(p => !p.isMainHome)

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-800">게시글 관리</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* ===== 메인홈 섹션 ===== */}
        <section className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-bold text-gray-800">메인홈 게시글</h2>
              <p className="text-xs text-gray-500 mt-0.5">현재 노출 중인 게시글 (최대 {MAX_MAIN_HOME}개)</p>
            </div>
            {!isReordering ? (
              <Button onClick={startReorder} variant="confirm" size="confirm">순서 편집</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setIsReordering(false)} variant="confirm" size="confirm">취소</Button>
                <Button onClick={applyReorder} variant="confirm" size="confirm">적용하기</Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left w-10"><input type="checkbox"
                      checked={selectedMainIds.size === mainHomePosts.length && mainHomePosts.length > 0}
                      onChange={() => {
                        if (selectedMainIds.size === mainHomePosts.length) setSelectedMainIds(new Set())
                        else setSelectedMainIds(new Set(mainHomePosts.map(p => p.id)))
                      }} className="rounded" /></th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">게시 순서</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">게시글 제목</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">소셜 도메인</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">게시일자</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">등록자</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mainHomePosts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><input type="checkbox"
                        checked={selectedMainIds.has(post.id)}
                        onChange={() => {
                          const next = new Set(selectedMainIds)
                          next.has(post.id) ? next.delete(post.id) : next.add(post.id)
                          setSelectedMainIds(next)
                        }} className="rounded" /></td>
                      <td className="px-4 py-3 text-gray-500">
                        {isReordering ? (
                          <input
                            type="number"
                            min={1}
                            value={reorderMap.get(post.id) ?? post.displayOrder ?? 0}
                            onChange={e => setReorderMap(prev => new Map(prev).set(post.id, Number(e.target.value)))}
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        ) : (post.displayOrder ?? '-')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{post.title || '(제목 없음)'}</td>
                      <td className="px-4 py-3"><DomainBadge domain={post.sourceDomain} /></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(post.publishedAt)}</td>
                      <td className="px-4 py-3 text-gray-500">{post.createdBy || '-'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewPost(post)}
                          className="text-xs text-primary-300 hover:underline">조회</button>
                      </td>
                    </tr>
                  ))}
                  {mainHomePosts.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">메인홈 게시글이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2 px-4 py-3 border-t border-gray-200">
            <Button onClick={handleMoveFromMain} variant="confirm" size="confirm" disabled={selectedMainIds.size === 0} className="disabled:opacity-40">
              게시글 관리로 내리기
            </Button>
            <Button onClick={handleDeleteMain} variant="confirm" size="confirm" disabled={selectedMainIds.size === 0} className="disabled:opacity-40">
              삭제
            </Button>
          </div>
        </section>

        {/* ===== 게시글 관리 섹션 ===== */}
        <section className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-bold text-gray-800">게시글 관리</h2>
              <p className="text-xs text-gray-500 mt-0.5">전체 운영 원본 목록 (메인홈 제외)</p>
            </div>
            <Button onClick={() => setIsBackupOpen(true)} variant="confirm" size="confirm">+ 게시글 추가</Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left w-10"><input type="checkbox"
                      checked={selectedManageIds.size === manageOnlyPosts.length && manageOnlyPosts.length > 0}
                      onChange={() => {
                        if (selectedManageIds.size === manageOnlyPosts.length) setSelectedManageIds(new Set())
                        else setSelectedManageIds(new Set(manageOnlyPosts.map(p => p.id)))
                      }} className="rounded" /></th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">번호</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">게시글 제목</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">소셜 도메인</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">게시일자</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">등록자</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {manageOnlyPosts.map((post, idx) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><input type="checkbox"
                        checked={selectedManageIds.has(post.id)}
                        onChange={() => {
                          const next = new Set(selectedManageIds)
                          next.has(post.id) ? next.delete(post.id) : next.add(post.id)
                          setSelectedManageIds(next)
                        }} className="rounded" /></td>
                      <td className="px-4 py-3 text-gray-500">{(page * 20) + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{post.title || '(제목 없음)'}</td>
                      <td className="px-4 py-3"><DomainBadge domain={post.sourceDomain} /></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(post.publishedAt)}</td>
                      <td className="px-4 py-3 text-gray-500">{post.createdBy || '-'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewPost(post)} className="text-xs text-primary-300 hover:underline">조회</button>
                      </td>
                    </tr>
                  ))}
                  {manageOnlyPosts.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">게시글이 없습니다. 소셜 미디어에서 가져오세요.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="flex gap-2">
              <Button onClick={handleMoveToMain} variant="confirm" size="confirm" disabled={selectedManageIds.size === 0} className="disabled:opacity-40">
                메인홈으로 올리기
              </Button>
              <Button onClick={handleDeleteManage} variant="confirm" size="confirm" disabled={selectedManageIds.size === 0} className="disabled:opacity-40">
                삭제
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchPosts(page - 1)} disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">이전</button>
              <span className="text-sm text-gray-600">{page + 1} / {allPosts?.totalPages || 1}</span>
              <button onClick={() => fetchPosts(page + 1)} disabled={page + 1 >= (allPosts?.totalPages ?? 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">다음</button>
            </div>
          </div>
        </section>
      </div>

      {/* ===== 소셜 백업 목록 모달 ===== */}
      {isBackupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setIsBackupOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">소셜 미디어에서 가져오기</h2>
              <button onClick={() => setIsBackupOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* 탭 + 동기화 버튼 */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex gap-2">
                {(['INSTAGRAM', 'FACEBOOK'] as const).map(t => (
                  <button key={t} onClick={() => setBackupTab(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium ${backupTab === t ? 'bg-primary-300 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {syncMsg && <span className="text-xs text-gray-500">{syncMsg}</span>}
                <Button onClick={handleSync} variant="confirm" size="confirm" disabled={syncLoading}>
                  {syncLoading ? '동기화 중...' : '동기화'}
                </Button>
              </div>
            </div>

            <div className="p-5">
              {backupLoading ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(backupPosts?.content ?? []).map(backup => (
                      <div key={backup.id}
                        onClick={() => handleImport(backup)}
                        className="rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group">
                        <div className="aspect-square bg-gray-100 overflow-hidden">
                          {backup.coverImageUrl ? (
                            <img src={backup.coverImageUrl} alt={backup.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">이미지 없음</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-medium text-gray-800 truncate">{backup.title || '(제목 없음)'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(backup.fetchedAt)}</p>
                          <DomainBadge domain={backup.sourceDomain} />
                        </div>
                      </div>
                    ))}
                    {(backupPosts?.content.length === 0) && (
                      <div className="col-span-3 text-center py-10 text-gray-400">
                        백업 데이터가 없습니다. 동기화 버튼을 눌러 가져오세요.
                      </div>
                    )}
                  </div>

                  {/* 페이지네이션 */}
                  {(backupPosts?.totalPages ?? 0) > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button onClick={() => fetchBackup(backupTab, backupPage - 1)} disabled={backupPage === 0}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40">이전</button>
                      <span className="text-sm text-gray-600 flex items-center">{backupPage + 1} / {backupPosts?.totalPages}</span>
                      <button onClick={() => fetchBackup(backupTab, backupPage + 1)} disabled={backupPage + 1 >= (backupPosts?.totalPages ?? 1)}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40">다음</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== 게시글 조회 모달 ===== */}
      {viewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewPost(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">게시글 상세</h2>
              <button onClick={() => setViewPost(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {viewPost.coverImageUrl && (
                <img src={viewPost.coverImageUrl} alt={viewPost.title || ''} className="w-full rounded-lg object-cover max-h-64" />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">소셜 도메인</span><div className="mt-1"><DomainBadge domain={viewPost.sourceDomain} /></div></div>
                <div><span className="text-gray-500">미디어 유형</span><p className="font-medium mt-1">{viewPost.mediaType || '-'}</p></div>
                <div className="col-span-2"><span className="text-gray-500">제목</span><p className="font-medium mt-1">{viewPost.title || '(제목 없음)'}</p></div>
                <div className="col-span-2"><span className="text-gray-500">설명</span>
                  <p className="text-gray-700 mt-1 whitespace-pre-line text-sm leading-relaxed">{viewPost.description || '-'}</p>
                </div>
                <div className="col-span-2"><span className="text-gray-500">URL</span>
                  {viewPost.permalink ? (
                    <a href={viewPost.permalink} target="_blank" rel="noopener noreferrer"
                      className="block mt-1 text-primary-300 hover:underline text-sm truncate">{viewPost.permalink}</a>
                  ) : <p className="mt-1">-</p>}
                </div>
                <div><span className="text-gray-500">게시일자</span><p className="font-medium mt-1">{formatDate(viewPost.publishedAt)}</p></div>
                <div><span className="text-gray-500">등록자</span><p className="font-medium mt-1">{viewPost.createdBy || '-'}</p></div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setViewPost(null)} variant="confirm" size="confirm">닫기</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 최대 6개 초과 알림 모달 ===== */}
      {isMaxAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setIsMaxAlert(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-base font-bold text-gray-800 mb-2">메인홈 게시글 초과</h3>
            <p className="text-sm text-gray-600 mb-2">메인홈은 최대 {MAX_MAIN_HOME}개의 게시글만 가능합니다.</p>
            <p className="text-sm text-gray-500 mb-5">특정 메인홈 게시글을 게시글 관리로 내려 공간을 확보해주세요.</p>
            <Button onClick={() => setIsMaxAlert(false)} variant="confirm" size="confirm">확인</Button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
