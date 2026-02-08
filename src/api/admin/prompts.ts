import api from '../api'

export interface PromptTestRequest {
  agentType: string;
  concept: string;
  intimacyLevel: number;
  inputText: string;
  promptVersionId?: number;
}

export interface PromptTestResponse {
  outputText: string;
  latencyMs: number;
  tokens?: number;
}

export interface PromptActiveResponse {
  env: string;
  agentType: string;
  concept: string;
  intimacyLevel: number;
  versionId: number;
  version: string;
  content: string;
  activatedAt: string;
}

export interface PromptVersionCreateRequest {
  agentType: string;
  concept: string;
  intimacyLevel: number;
  content: string;
  memo?: string;
}

export interface PromptVersionResponse {
  id: number;
  agentType: string;
  concept: string;
  intimacyLevel: number;
  version: string;
  content: string;
  filePath: string;
  memo?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  isActive?: boolean;
}

export interface AgentTypeOption {
  value: string;
  label: string;
}

export interface ConceptOption {
  value: string;
  label: string;
}

export interface IntimacyLevelOption {
  value: number;
  label: string;
}

export interface PromptSaveAndActivateRequest {
  env: string;
  agentType: string;
  concept: string;
  intimacyLevel: number;
  content: string;
  memo?: string;
}

export interface VersionActiveStatusResponse {
  versionId: number;
  isActive: boolean;
  env: string;
  activatedAt?: string;
  activatedBy?: string;
}

export interface PromptVersionListResponse {
  content: PromptVersionResponse[];
  page: {
    number: number;
    size: number;
    totalPages: number;
    totalElements: number;
  };
}

export interface PromptActivateRequest {
  env: string;
  agentType: string;
  concept: string;
  intimacyLevel: number;
  versionId: number;
}

export interface PromptRollbackRequest {
  env: string;
  agentType: string;
  concept: string;
  intimacyLevel: number;
  previousVersionId: number;
}

const BASE = '/api/admin/prompts'

/**
 * Active 프롬프트 조회
 */
export const getActivePrompt = async (
  agentType: string,
  concept: string,
  intimacyLevel: number,
  env?: string
): Promise<PromptActiveResponse> => {
  const params = new URLSearchParams({
    agentType,
    concept,
    intimacyLevel: intimacyLevel.toString(),
    ...(env && { env }),
  });
  const { data } = await api.get<PromptActiveResponse>(`${BASE}/active?${params}`);
  return data;
};

/**
 * 프롬프트 테스트 실행
 */
export const testPrompt = async (
  agentType: string,
  concept: string,
  intimacyLevel: number,
  inputText: string,
  promptVersionId?: number
): Promise<PromptTestResponse> => {
  const { data } = await api.post<PromptTestResponse>(`${BASE}/test`, {
    agentType,
    concept,
    intimacyLevel,
    inputText,
    ...(promptVersionId != null && { promptVersionId }),
  });
  return data;
};

/**
 * 새 버전 생성
 */
export const createPromptVersion = async (
  agentType: string,
  concept: string,
  intimacyLevel: number,
  content: string,
  memo?: string
): Promise<PromptVersionResponse> => {
  const { data } = await api.post<PromptVersionResponse>(`${BASE}/versions`, {
    agentType,
    concept,
    intimacyLevel,
    content,
    memo,
  });
  return data;
};

/**
 * Active 전환
 */
export const activatePrompt = async (
  env: string,
  agentType: string,
  concept: string,
  intimacyLevel: number,
  versionId: number
): Promise<void> => {
  await api.post(`${BASE}/activate`, {
    env,
    agentType,
    concept,
    intimacyLevel,
    versionId,
  });
};

/**
 * 롤백
 */
export const rollbackPrompt = async (
  env: string,
  agentType: string,
  concept: string,
  intimacyLevel: number,
  previousVersionId: number
): Promise<void> => {
  await api.post(`${BASE}/rollback`, {
    env,
    agentType,
    concept,
    intimacyLevel,
    previousVersionId,
  });
};

/**
 * 버전 목록 조회
 */
export const getPromptVersions = async (
  agentType: string,
  concept: string,
  intimacyLevel: number,
  page: number = 0,
  size: number = 10,
  env: string = 'prod'
): Promise<PromptVersionListResponse> => {
  const params = new URLSearchParams({
    agentType,
    concept,
    intimacyLevel: intimacyLevel.toString(),
    page: page.toString(),
    size: size.toString(),
    env,
  });
  const { data } = await api.get<PromptVersionListResponse>(`${BASE}/versions?${params}`);
  return data;
};

/**
 * 버전 상세 조회
 */
export const getPromptVersion = async (versionId: number, env: string = 'prod'): Promise<PromptVersionResponse> => {
  const params = new URLSearchParams({ env });
  const { data } = await api.get<PromptVersionResponse>(`${BASE}/versions/${versionId}?${params}`);
  return data;
};

/**
 * 현재 파일 내용 조회 (파일 없으면 404 → 빈 문자열 반환)
 */
export const getPromptFileContent = async (
  agentType: string,
  concept: string,
  intimacyLevel: number
): Promise<string> => {
  const params = new URLSearchParams({
    agentType,
    concept,
    intimacyLevel: intimacyLevel.toString(),
  });
  try {
    const { data } = await api.get<{ content?: string }>(`${BASE}/file-content?${params}`);
    return data?.content ?? '';
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return '';
    throw err;
  }
};

/**
 * AgentType 옵션 조회
 */
export const getAgentTypeOptions = async (): Promise<AgentTypeOption[]> => {
  const { data } = await api.get<AgentTypeOption[]>(`${BASE}/options/agent-types`);
  return data;
};

/**
 * Concept 옵션 조회
 */
export const getConceptOptions = async (): Promise<ConceptOption[]> => {
  const { data } = await api.get<ConceptOption[]>(`${BASE}/options/concepts`);
  return data;
};

/**
 * IntimacyLevel 옵션 조회
 */
export const getIntimacyLevelOptions = async (): Promise<IntimacyLevelOption[]> => {
  const { data } = await api.get<IntimacyLevelOption[]>(`${BASE}/options/intimacy-levels`);
  return data;
};

/**
 * 저장 및 적용 (통합)
 */
export const saveAndActivatePrompt = async (
  request: PromptSaveAndActivateRequest
): Promise<PromptVersionResponse> => {
  const { data } = await api.post<PromptVersionResponse>(`${BASE}/save-and-activate`, request);
  return data;
};

/**
 * 버전 활성화 상태 조회
 */
export const getVersionActiveStatus = async (
  versionId: number,
  env: string = 'prod'
): Promise<VersionActiveStatusResponse> => {
  const params = new URLSearchParams({ env });
  const { data } = await api.get<VersionActiveStatusResponse>(
    `${BASE}/versions/${versionId}/active-status?${params}`
  );
  return data;
};
