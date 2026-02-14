import apiClient from './client'

export interface TrainingStartRequest {
  mode: 'text' | 'code'
  text_id?: string
}

export interface TrainingStartResponse {
  session_id: string
}

export interface TrainingFinishRequest {
  session_id: string
  wpm: number
  cpm: number
  accuracy: number
  errors: number
  correct_chars: number
  duration_sec: number
}

export interface TrainingSessionResponse {
  id: string
  user_id: string
  text_id: string | null
  mode: 'text' | 'code'
  wpm: number
  cpm: number
  accuracy: number
  errors: number
  correct_chars: number
  duration_sec: number
  created_at: string
}

export interface TrainingHistoryResponse {
  items: TrainingSessionResponse[]
  total: number
}

export const trainingsApi = {
  start: async (data: TrainingStartRequest): Promise<TrainingStartResponse> => {
    const response = await apiClient.post<TrainingStartResponse>(
      '/api/trainings/start',
      data
    )
    return response.data
  },

  finish: async (data: TrainingFinishRequest): Promise<TrainingSessionResponse> => {
    const response = await apiClient.post<TrainingSessionResponse>(
      '/api/trainings/finish',
      data
    )
    return response.data
  },

  getHistory: async (mode?: 'text' | 'code'): Promise<TrainingHistoryResponse> => {
    const params = mode ? { mode } : {}
    const response = await apiClient.get<TrainingHistoryResponse>(
      '/api/trainings/history',
      { params }
    )
    return response.data
  },
}

