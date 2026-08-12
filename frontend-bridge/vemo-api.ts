const rawBase =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_VEMO_API_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  '';

export const VEMO_API_BASE = String(rawBase).replace(/\/$/, '');

export type VemoJobStatus = 'pending' | 'queued' | 'running' | 'succeeded' | 'failed';

export interface VemoGenerationRequest {
  customMode?: boolean;
  songDescription?: string;
  prompt?: string;
  lyrics?: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  vocalLanguage?: string;
  duration?: number;
  bpm?: number;
  keyScale?: string;
  timeSignature?: string;
  batchSize?: number;
  seed?: number;
  randomSeed?: boolean;
  thinking?: boolean;
  referenceAudioUrl?: string;
  sourceAudioUrl?: string;
}

export interface VemoGenerationJob {
  jobId: string;
  status: VemoJobStatus;
  queuePosition?: number;
  etaSeconds?: number;
  progress?: number;
  stage?: string;
  result?: {
    audioUrls: string[];
    bpm?: number;
    duration?: number;
    keyScale?: string;
    timeSignature?: string;
  };
  error?: string;
}

export interface VemoSong {
  id: string;
  title: string;
  lyrics?: string;
  style?: string;
  caption?: string;
  cover_url?: string;
  audio_url?: string;
  duration?: number;
  bpm?: number;
  key_scale?: string;
  time_signature?: string;
  is_public?: boolean;
  like_count?: number;
  view_count?: number;
  creator?: string;
  created_at?: string;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(`${VEMO_API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || `VEMO API request failed (${response.status})`);
  }

  return response.json();
}

export const vemoApi = {
  health: () => request<{ status: string; service: string }>('/health'),

  auth: {
    auto: () => request<any>('/api/auth/auto'),
    setup: (username: string) => request<any>('/api/auth/setup', { method: 'POST', body: { username } }),
    me: (token: string) => request<any>('/api/auth/me', { token }),
    logout: () => request<any>('/api/auth/logout', { method: 'POST' }),
  },

  generation: {
    create: (payload: VemoGenerationRequest, token: string) =>
      request<VemoGenerationJob>('/api/generate', { method: 'POST', body: payload, token }),
    status: (jobId: string, token: string) =>
      request<VemoGenerationJob>(`/api/generate/status/${jobId}`, { token }),
    history: (token: string) => request<{ jobs: VemoGenerationJob[] }>('/api/generate/history', { token }),
  },

  songs: {
    mine: (token: string) => request<{ songs: VemoSong[] }>('/api/songs', { token }),
    public: (limit = 20, offset = 0) =>
      request<{ songs: VemoSong[] }>(`/api/songs/public?limit=${limit}&offset=${offset}`),
    featured: () => request<{ songs: VemoSong[] }>('/api/songs/public/featured'),
    get: (id: string, token?: string | null) => request<{ song: VemoSong }>(`/api/songs/${id}`, { token }),
    like: (id: string, token: string) => request<{ liked: boolean }>(`/api/songs/${id}/like`, { method: 'POST', token }),
    remove: (id: string, token: string) => request<{ success: boolean }>(`/api/songs/${id}`, { method: 'DELETE', token }),
  },

  playlists: {
    mine: (token: string) => request<any>('/api/playlists', { token }),
    featured: () => request<any>('/api/playlists/public/featured'),
    get: (id: string, token?: string | null) => request<any>(`/api/playlists/${id}`, { token }),
    create: (name: string, description: string, isPublic: boolean, token: string) =>
      request<any>('/api/playlists', { method: 'POST', body: { name, description, isPublic }, token }),
  },

  users: {
    profile: (username: string, token?: string | null) => request<any>(`/api/users/${username}`, { token }),
    featured: () => request<any>('/api/users/public/featured'),
  },
};

export async function waitForVemoGeneration(
  jobId: string,
  token: string,
  onProgress?: (job: VemoGenerationJob) => void,
  pollMs = 2000,
): Promise<VemoGenerationJob> {
  for (;;) {
    const job = await vemoApi.generation.status(jobId, token);
    onProgress?.(job);

    if (job.status === 'succeeded') return job;
    if (job.status === 'failed') throw new Error(job.error || 'VEMO generation failed');

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}
