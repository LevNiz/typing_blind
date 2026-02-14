import apiClient from './client'

export type LeaderboardPeriod = 'day' | 'week' | 'month' | 'all'
export type TrainingMode = 'text' | 'code'

export interface LeaderboardEntry {
  user_id: string
  username: string
  wpm: number
  cpm: number
  accuracy: number
  errors: number
  correct_chars: number
  duration_sec: number
  created_at: string
}

export interface LeaderboardResponse {
  items: LeaderboardEntry[]
  total: number
  mode: TrainingMode
  period: string
}

export const leaderboardApi = {
  get: async (params: {
    mode: TrainingMode
    period?: LeaderboardPeriod
    sort_by?: 'wpm' | 'accuracy'
    limit?: number
    offset?: number
  }): Promise<LeaderboardResponse> => {
    const response = await apiClient.get<LeaderboardResponse>('/api/leaderboard', {
      params,
    })
    return response.data
  },
}

