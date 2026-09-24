import { Poll, User, CreatorStats } from '../types';

const TOKEN_KEY = 'pulsevote_auth_token';
const VOTER_TOKEN_KEY = 'pulsevote_voter_fingerprint';

// Ensure consistent anonymous voter fingerprint for device
export function getOrCreateVoterToken(): string {
  let token = localStorage.getItem(VOTER_TOKEN_KEY);
  if (!token) {
    token = 'vtr_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(VOTER_TOKEN_KEY, token);
  }
  return token;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-voter-token': getOrCreateVoterToken(),
    ...(options.headers as Record<string, string> || {})
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Network request failed');
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  // Creator
  getCreatorPolls: () => request<{ polls: Poll[] }>('/api/creator/polls'),

  getCreatorStats: () => request<CreatorStats>('/api/creator/stats'),

  createPoll: (payload: {
    question: string;
    description?: string;
    category?: string;
    options: { text: string; color: string }[];
    allowMultiple: boolean;
    expiresAt?: string | null;
  }) =>
    request<{ poll: Poll }>('/api/polls', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  togglePollStatus: (pollId: string, isClosed: boolean) =>
    request<{ poll: Poll }>(`/api/polls/${pollId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isClosed })
    }),

  deletePoll: (pollId: string) =>
    request<{ success: boolean; message: string }>(`/api/polls/${pollId}`, {
      method: 'DELETE'
    }),

  // Public Poll & Voting
  getPollDetails: (pollId: string) =>
    request<{ poll: Poll; hasVoted: boolean; userVote: string[] | null }>(`/api/polls/${pollId}`),

  castVote: (pollId: string, optionIds: string[]) =>
    request<{
      success: boolean;
      message: string;
      poll: Poll;
      userVote: string[];
    }>(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({
        optionIds,
        voterToken: getOrCreateVoterToken()
      })
    }),

  getPublicTrendingPolls: () => request<{ polls: Poll[] }>('/api/polls')
};
