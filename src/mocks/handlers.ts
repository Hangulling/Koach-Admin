import { http, HttpResponse } from 'msw'

const API_BASE = '*'

// ============================================================
// Mock JWT Helper
// ============================================================

function createMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }))
  const signature = 'mock-signature'
  return `${header}.${body}.${signature}`
}

// ============================================================
// Mock Data
// ============================================================

const mockAdminUser = {
  id: 'admin-001',
  email: 'admin@dorandoran.com',
  firstName: 'Admin',
  lastName: 'User',
  name: 'Admin User',
  status: 'ACTIVE',
  role: 'ROLE_ADMIN',
  createdAt: '2025-01-01T00:00:00',
  updatedAt: '2025-01-01T00:00:00',
}

const mockChatrooms = [
  { id: 'room-001', name: '대화', concept: 'HONEY', userEmail: 'user1@test.com' },
  { id: 'room-002', name: '대화', concept: 'FRIEND', userEmail: 'user2@test.com' },
  { id: 'room-003', name: '대화', concept: 'COWORKER', userEmail: 'user3@test.com' },
  { id: 'room-004', name: '대화', concept: 'SENIOR', userEmail: 'user4@test.com' },
]

const mockIntimacyLevels = [
  { level: 1, description: 'Level 1' },
  { level: 2, description: 'Level 2' },
  { level: 3, description: 'Level 3' },
]

const mockChatLogs = [
  {
    chatroomId: 'room-001',
    chatroomName: '대화',
    concept: 'HONEY',
    intimacyLevel: 3,
    lastMessageAt: '2026-02-21T12:30:00',
    messageCount: 42,
    userId: 'user-001',
    userEmail: 'user1@test.com',
  },
  {
    chatroomId: 'room-002',
    chatroomName: '대화',
    concept: 'FRIEND',
    intimacyLevel: 1,
    lastMessageAt: '2026-02-21T11:00:00',
    messageCount: 15,
    userId: 'user-002',
    userEmail: 'user2@test.com',
  },
  {
    chatroomId: 'room-003',
    chatroomName: '대화',
    concept: 'COWORKER',
    intimacyLevel: 3,
    lastMessageAt: '2026-02-20T09:15:00',
    messageCount: 28,
    userId: 'user-003',
    userEmail: 'user3@test.com',
  },
]

const mockTimeline = [
  {
    messageId: 'msg-001',
    content: '안녕하세요! 오늘 날씨 어때요?',
    senderType: 'USER',
    sequenceNumber: 1,
    turnNumber: 1,
    sourceCreatedAt: '2026-02-21T10:00:00',
    tokenCount: 12,
    processingTimeMs: 150,
    agentResults: {
      intimacy: {
        detectedLevel: 3,
        correctedSentence: '안녕하세요! 오늘 날씨가 어떤가요?',
        corrections: '조사 추가',
        feedback: { ko: '좋아요!', en: 'Good!' },
      },
      conversation: { content: '오늘 서울은 맑아요~ 산책하기 좋은 날이에요!' },
      vocabulary: {
        words: [
          { word: '날씨', difficulty: 1, context: '오늘 날씨 어때요?' },
        ],
      },
    },
  },
  {
    messageId: 'msg-002',
    content: '오늘 서울은 맑아요~ 산책하기 좋은 날이에요!',
    senderType: 'CHATBOT',
    sequenceNumber: 2,
    turnNumber: 1,
    sourceCreatedAt: '2026-02-21T10:00:02',
  },
  {
    messageId: 'msg-003',
    content: '좋다! 공원에 가고 싶어.',
    senderType: 'USER',
    sequenceNumber: 3,
    turnNumber: 2,
    sourceCreatedAt: '2026-02-21T10:01:00',
    tokenCount: 8,
    processingTimeMs: 120,
    agentResults: {
      intimacy: {
        detectedLevel: 1,
        correctedSentence: '좋아요! 공원에 가고 싶어요.',
        corrections: '반말 → 존댓말 교정',
        feedback: { ko: '격식체를 사용해보세요', en: 'Try formal speech' },
      },
      conversation: { content: '네, 공원 산책은 정말 기분 좋은 활동이죠!' },
      vocabulary: {
        words: [
          { word: '공원', difficulty: 1, context: '공원에 가고 싶어' },
        ],
      },
    },
  },
  {
    messageId: 'msg-004',
    content: '네, 공원 산책은 정말 기분 좋은 활동이죠!',
    senderType: 'CHATBOT',
    sequenceNumber: 4,
    turnNumber: 2,
    sourceCreatedAt: '2026-02-21T10:01:05',
  },
]

const mockManagementQueues = [
  {
    id: 'queue-001',
    queueType: 'CORRECTION' as const,
    status: 'PENDING' as const,
    requestData: {
      items: [
        {
          type: 'intimacy' as const,
          messageId: 'msg-001',
          detectedLevel: 3,
          correctedSentence: '안녕하세요! 오늘 날씨가 어떤가요?',
          corrections: '조사 누락 수정',
          feedback: { ko: '좋아요!', en: 'Good!' },
        },
      ],
      memo: '친밀도 판별 오류',
      conversationId: 'conv-001',
    },
    adminName: 'Admin User',
    adminIp: '127.0.0.1',
    createdAt: '2025-06-01T10:00:00',
  },
  {
    id: 'queue-002',
    queueType: 'DELETION' as const,
    status: 'PENDING' as const,
    requestData: {
      items: [
        {
          type: 'conversation' as const,
          messageId: 'msg-002',
          content: '부적절한 응답 내용',
        },
      ],
      memo: '부적절한 응답 삭제 요청',
    },
    adminName: 'Admin User',
    adminIp: '127.0.0.1',
    createdAt: '2025-06-01T11:00:00',
  },
  {
    id: 'queue-003',
    queueType: 'CORRECTION' as const,
    status: 'COMPLETED' as const,
    requestData: {
      items: [
        {
          type: 'voca' as const,
          messageId: 'msg-003',
          word: '산책',
          difficulty: 2,
          context: '산책하기 좋은 날이에요',
        },
      ],
      memo: '난이도 수정',
    },
    resultData: {
      processedBy: 'admin-001',
      processedAt: '2025-06-01T12:00:00',
      action: 'CORRECTED',
      note: '처리 완료',
    },
    adminName: 'Admin User',
    adminIp: '127.0.0.1',
    createdAt: '2025-06-01T09:00:00',
    completedAt: '2025-06-01T12:00:00',
  },
]

const mockAuditLogs = [
  {
    id: 1,
    adminUserId: 'admin-001',
    actionType: 'QUEUE_COMPLETE',
    targetType: 'MANAGEMENT_QUEUE',
    targetId: 1,
    summary: '관리 큐 처리 완료',
    createdAt: '2025-06-01T12:00:00',
  },
]

const mockConversations = [
  {
    conversationId: 'conv-001',
    userId: 'user-001',
    roomKey: 'room-001',
    intimacyLevel: 3,
    lastMessageAt: '2025-06-01T12:30:00',
    lastSequenceNumber: 10,
  },
  {
    conversationId: 'conv-002',
    userId: 'user-002',
    roomKey: 'room-002',
    intimacyLevel: 1,
    lastMessageAt: '2025-06-01T11:00:00',
    lastSequenceNumber: 5,
  },
]

const mockReviewTickets = [
  {
    id: 1,
    conversationId: 'conv-001',
    status: 'OPEN',
    agentType: 'intimacy',
    note: '친밀도 판별 검토 필요',
    createdBy: 'admin-001',
    createdByName: 'Admin User',
    createdAt: '2025-06-01T10:00:00',
    updatedAt: '2025-06-01T10:00:00',
  },
  {
    id: 2,
    conversationId: 'conv-002',
    status: 'OPEN',
    agentType: 'conversation',
    note: '대화 응답 검토',
    createdBy: 'admin-001',
    createdByName: 'Admin User',
    createdAt: '2025-06-01T11:00:00',
    updatedAt: '2025-06-01T11:00:00',
  },
]

const mockPromptVersions = [
  {
    id: 1,
    agentType: 'intimacy',
    concept: 'daily',
    intimacyLevel: 3,
    version: 'v1.0.0',
    content: '당신은 한국어 친밀도 분석 에이전트입니다...',
    filePath: '/prompts/intimacy/daily/3.txt',
    memo: '초기 버전',
    createdBy: 'admin-001',
    createdByName: 'Admin User',
    createdAt: '2025-01-01T00:00:00',
    isActive: true,
  },
  {
    id: 2,
    agentType: 'intimacy',
    concept: 'daily',
    intimacyLevel: 3,
    version: 'v1.1.0',
    content: '당신은 한국어 친밀도 분석 에이전트입니다. (개선 버전)...',
    filePath: '/prompts/intimacy/daily/3.txt',
    memo: '프롬프트 개선',
    createdBy: 'admin-001',
    createdByName: 'Admin User',
    createdAt: '2025-02-01T00:00:00',
    isActive: false,
  },
]

// ============================================================
// Helper
// ============================================================

function logUserId(request: Request, label: string) {
  const userId = request.headers.get('X-User-Id')
  console.log(`[MSW] ${label} — X-User-Id: ${userId ?? '(없음)'}`)
}

function paginate<T>(items: T[], page: number, size: number) {
  const start = page * size
  const content = items.slice(start, start + size)
  return {
    content,
    page: {
      number: page,
      size,
      totalPages: Math.ceil(items.length / size),
      totalElements: items.length,
    },
  }
}

// ============================================================
// Handlers
// ============================================================

export const handlers = [
  // ─── Auth ───────────────────────────────────────────────
  http.post(`${API_BASE}/api/auth/login`, async ({ request }) => {
    logUserId(request, 'POST /api/auth/login')
    const body = (await request.json()) as { email: string; password: string }

    if (body.email === 'admin@dorandoran.com' && body.password === 'admin1234') {
      return HttpResponse.json({
        success: true,
        message: '로그인 성공',
        data: {
          accessToken: createMockJwt({ sub: mockAdminUser.id, email: mockAdminUser.email, name: mockAdminUser.name, role: mockAdminUser.role }),
          refreshToken: createMockJwt({ sub: mockAdminUser.id, type: 'refresh' }),
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: mockAdminUser,
        },
      })
    }

    return HttpResponse.json(
      { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    )
  }),

  http.post(`${API_BASE}/api/auth/oauth/login`, () => {
    return HttpResponse.json({
      success: true,
      message: 'OAuth 로그인 성공',
      data: {
        accessToken: createMockJwt({ sub: mockAdminUser.id, email: mockAdminUser.email, name: mockAdminUser.name, role: mockAdminUser.role }),
        refreshToken: createMockJwt({ sub: mockAdminUser.id, type: 'refresh' }),
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: mockAdminUser,
      },
    })
  }),

  http.post(`${API_BASE}/api/auth/refresh`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: createMockJwt({ sub: mockAdminUser.id, email: mockAdminUser.email, name: mockAdminUser.name, role: mockAdminUser.role }),
        refreshToken: createMockJwt({ sub: mockAdminUser.id, type: 'refresh' }),
      },
    })
  }),

  http.post(`${API_BASE}/api/auth/validate`, () => {
    return HttpResponse.json({ valid: true })
  }),

  http.get(`${API_BASE}/api/auth/me`, () => {
    return HttpResponse.json(mockAdminUser)
  }),

  http.get(`${API_BASE}/api/auth/health`, () => {
    return HttpResponse.json({ status: 'UP' })
  }),

  // ─── Users ──────────────────────────────────────────────
  http.get(`${API_BASE}/api/users/:userId`, () => {
    return HttpResponse.json(mockAdminUser)
  }),

  // ─── Chat Logs ──────────────────────────────────────────
  http.get(`${API_BASE}/api/admin/chat-logs/chatrooms`, ({ request }) => {
    logUserId(request, 'GET /api/admin/chat-logs/chatrooms')
    return HttpResponse.json(mockChatrooms)
  }),

  http.get(`${API_BASE}/api/admin/chat-logs/intimacy-levels`, ({ request }) => {
    logUserId(request, 'GET /api/admin/chat-logs/intimacy-levels')
    return HttpResponse.json(mockIntimacyLevels)
  }),

  http.get(`${API_BASE}/api/admin/chat-logs/search`, ({ request }) => {
    logUserId(request, 'GET /api/admin/chat-logs/search')
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    const start = page * size
    const sliced = mockChatLogs.slice(start, start + size)
    // 실제 Spring Page 응답 구조 (flat - page 중첩 객체 없음)
    return HttpResponse.json({
      content: sliced,
      totalElements: mockChatLogs.length,
      totalPages: Math.ceil(mockChatLogs.length / size),
      numberOfElements: sliced.length,
    })
  }),

  http.get(`${API_BASE}/api/admin/chat-logs/:chatroomId/timeline`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 50)
    return HttpResponse.json(paginate(mockTimeline, page, size))
  }),

  // ─── Management Queue ──────────────────────────────────
  http.get(`${API_BASE}/api/admin/management-queue`, ({ request }) => {
    logUserId(request, 'GET /api/admin/management-queue')
    const url = new URL(request.url)
    const queueType = url.searchParams.get('queueType')
    const status = url.searchParams.get('status')
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)

    let filtered = [...mockManagementQueues]
    if (queueType) filtered = filtered.filter(q => q.queueType === queueType)
    if (status) filtered = filtered.filter(q => q.status === status)

    return HttpResponse.json(paginate(filtered, page, size))
  }),

  http.get(`${API_BASE}/api/admin/management-queue/count`, ({ request }) => {
    logUserId(request, 'GET /api/admin/management-queue/count')
    return HttpResponse.json({
      intimacyCount: 1,
      conversationCount: 1,
      vocaCount: 1,
    })
  }),

  http.get(`${API_BASE}/api/admin/management-queue/:id`, ({ params }) => {
    const queue = mockManagementQueues.find(q => q.id === params.id)
    if (!queue) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(queue)
  }),

  http.post(`${API_BASE}/api/admin/management-queue`, async ({ request }) => {
    logUserId(request, 'POST /api/admin/management-queue')
    const body = await request.json()
    return HttpResponse.json({
      id: `queue-${Date.now()}`,
      ...(body as object),
      status: 'PENDING',
      adminName: 'Admin User',
      adminIp: '127.0.0.1',
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.put(`${API_BASE}/api/admin/management-queue/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { memo: string }
    const queue = mockManagementQueues.find(q => q.id === params.id)
    if (!queue) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ ...queue, requestData: { ...queue.requestData, memo: body.memo } })
  }),

  http.delete(`${API_BASE}/api/admin/management-queue/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch(`${API_BASE}/api/admin/management-queue/:id/complete`, async ({ params, request }) => {
    const body = (await request.json()) as { note: string }
    const queue = mockManagementQueues.find(q => q.id === params.id)
    if (!queue) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({
      ...queue,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      resultData: {
        processedBy: 'admin-001',
        processedAt: new Date().toISOString(),
        action: 'COMPLETED',
        note: body.note,
      },
    })
  }),

  http.patch(`${API_BASE}/api/admin/management-queue/complete-batch`, async ({ request }) => {
    logUserId(request, 'PATCH /api/admin/management-queue/complete-batch')
    const body = (await request.json()) as { ids: string[]; note: string }
    return HttpResponse.json({
      completedCount: body.ids.length,
      totalRequested: body.ids.length,
      message: `${body.ids.length}건 처리 완료`,
    })
  }),

  http.delete(`${API_BASE}/api/admin/management-queue/batch`, async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }
    return HttpResponse.json({
      completedCount: body.ids.length,
      totalRequested: body.ids.length,
      message: `${body.ids.length}건 삭제 완료`,
    })
  }),

  http.get(`${API_BASE}/api/admin/management-queue/audit-logs`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)

    const auditAsQueue = mockManagementQueues
      .filter(q => q.status === 'COMPLETED')
      .map(q => ({ ...q }))

    return HttpResponse.json(paginate(auditAsQueue, page, size))
  }),

  // ─── Audit Logs ─────────────────────────────────────────
  http.get(`${API_BASE}/api/admin/audit-logs`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    return HttpResponse.json(paginate(mockAuditLogs, page, size))
  }),

  // ─── Conversations ─────────────────────────────────────
  http.get(`${API_BASE}/api/admin/conversations`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    return HttpResponse.json(paginate(mockConversations, page, size))
  }),

  http.get(`${API_BASE}/api/admin/conversations/:conversationId`, ({ params }) => {
    return HttpResponse.json({
      conversationId: params.conversationId,
      timeline: mockTimeline,
    })
  }),

  // ─── Review Tickets ─────────────────────────────────────
  http.get(`${API_BASE}/api/admin/review-tickets`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') ?? 'OPEN'
    const agentType = url.searchParams.get('agentType')
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)

    let filtered = mockReviewTickets.filter(t => t.status === status)
    if (agentType) filtered = filtered.filter(t => t.agentType === agentType)

    return HttpResponse.json(paginate(filtered, page, size))
  }),

  http.get(`${API_BASE}/api/admin/review-tickets/counts`, () => {
    return HttpResponse.json({
      total: mockReviewTickets.length,
      byAgentType: { intimacy: 1, conversation: 1 },
    })
  }),

  http.get(`${API_BASE}/api/admin/review-tickets/:ticketId`, ({ params }) => {
    const ticket = mockReviewTickets.find(t => t.id === Number(params.ticketId))
    if (!ticket) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ ...ticket, items: [] })
  }),

  http.post(`${API_BASE}/api/admin/review-tickets`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      {
        id: Date.now(),
        ...(body as object),
        status: 'OPEN',
        createdBy: 'admin-001',
        createdByName: 'Admin User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      },
      { status: 201 }
    )
  }),

  http.patch(`${API_BASE}/api/admin/review-tickets/:ticketId`, async ({ params, request }) => {
    const body = (await request.json()) as { note: string }
    const ticket = mockReviewTickets.find(t => t.id === Number(params.ticketId))
    if (!ticket) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ ...ticket, note: body.note, updatedAt: new Date().toISOString() })
  }),

  http.delete(`${API_BASE}/api/admin/review-tickets/:ticketId`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${API_BASE}/api/admin/review-tickets/complete`, () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // ─── Prompts ────────────────────────────────────────────
  http.get(`${API_BASE}/api/admin/prompts/active`, () => {
    const active = mockPromptVersions.find(p => p.isActive)
    if (!active) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({
      env: 'prod',
      agentType: active.agentType,
      concept: active.concept,
      intimacyLevel: active.intimacyLevel,
      versionId: active.id,
      version: active.version,
      content: active.content,
      activatedAt: active.createdAt,
    })
  }),

  http.get(`${API_BASE}/api/admin/prompts/versions`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    return HttpResponse.json(paginate(mockPromptVersions, page, size))
  }),

  http.get(`${API_BASE}/api/admin/prompts/versions/:versionId`, ({ params }) => {
    const version = mockPromptVersions.find(p => p.id === Number(params.versionId))
    if (!version) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(version)
  }),

  http.get(`${API_BASE}/api/admin/prompts/versions/:versionId/active-status`, ({ params }) => {
    const version = mockPromptVersions.find(p => p.id === Number(params.versionId))
    return HttpResponse.json({
      versionId: Number(params.versionId),
      isActive: version?.isActive ?? false,
      env: 'prod',
      activatedAt: version?.isActive ? version.createdAt : undefined,
    })
  }),

  http.post(`${API_BASE}/api/admin/prompts/versions`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      {
        id: Date.now(),
        ...(body as object),
        version: `v${Date.now()}`,
        filePath: '/prompts/new.txt',
        createdBy: 'admin-001',
        createdByName: 'Admin User',
        createdAt: new Date().toISOString(),
        isActive: false,
      },
      { status: 201 }
    )
  }),

  http.post(`${API_BASE}/api/admin/prompts/test`, async ({ request }) => {
    const body = (await request.json()) as { inputText: string }
    return HttpResponse.json({
      outputText: `[Mock 응답] "${body.inputText}"에 대한 테스트 결과입니다.`,
      latencyMs: 250,
      tokens: 45,
    })
  }),

  http.post(`${API_BASE}/api/admin/prompts/activate`, () => {
    return new HttpResponse(null, { status: 200 })
  }),

  http.post(`${API_BASE}/api/admin/prompts/rollback`, () => {
    return new HttpResponse(null, { status: 200 })
  }),

  http.post(`${API_BASE}/api/admin/prompts/save-and-activate`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: Date.now(),
      ...(body as object),
      version: `v${Date.now()}`,
      filePath: '/prompts/new.txt',
      createdBy: 'admin-001',
      createdByName: 'Admin User',
      createdAt: new Date().toISOString(),
      isActive: true,
    })
  }),

  http.get(`${API_BASE}/api/admin/prompts/file-content`, () => {
    return HttpResponse.json({
      content: '당신은 한국어 학습을 돕는 AI 에이전트입니다...',
    })
  }),

  http.get(`${API_BASE}/api/admin/prompts/options/agent-types`, () => {
    return HttpResponse.json([
      { value: 'intimacy', label: '친밀도 분석' },
      { value: 'conversation', label: '대화 생성' },
      { value: 'vocabulary', label: '어휘 분석' },
    ])
  }),

  http.get(`${API_BASE}/api/admin/prompts/options/concepts`, () => {
    return HttpResponse.json([
      { value: 'daily', label: '일상' },
      { value: 'travel', label: '여행' },
      { value: 'food', label: '음식' },
    ])
  }),

  http.get(`${API_BASE}/api/admin/prompts/options/intimacy-levels`, () => {
    return HttpResponse.json(mockIntimacyLevels)
  }),
]
