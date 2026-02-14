import apiClient from './client'

export interface TextCreate {
  title: string
  content: string
  type: 'text' | 'code'
  language?: string
  is_public: boolean
}

export interface TextResponse {
  id: string
  title: string
  content: string
  type: 'text' | 'code'
  language: string | null
  is_public: boolean
  owner_id: string
  created_at: string
}

export interface TextListResponse {
  items: TextResponse[]
  total: number
}

export interface WikipediaTextResponse {
  title: string
  content: string
  url: string
  language: string
}

export const textsApi = {
  create: async (data: TextCreate): Promise<TextResponse> => {
    const response = await apiClient.post<TextResponse>('/api/texts', data)
    return response.data
  },

  getPublic: async (params?: {
    type?: 'text' | 'code'
    language?: string
    limit?: number
    offset?: number
  }): Promise<TextListResponse> => {
    const response = await apiClient.get<TextListResponse>('/api/texts', {
      params: { public: true, ...params },
    })
    return response.data
  },

  getMy: async (params?: {
    type?: 'text' | 'code'
    limit?: number
    offset?: number
  }): Promise<TextListResponse> => {
    const response = await apiClient.get<TextListResponse>('/api/texts/my', {
      params,
    })
    return response.data
  },

  getById: async (id: string): Promise<TextResponse> => {
    const response = await apiClient.get<TextResponse>(`/api/texts/${id}`)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/texts/${id}`)
  },

  getWikipediaRandom: async (params?: {
    language?: string
    length?: number
  }): Promise<WikipediaTextResponse> => {
    const response = await apiClient.get<WikipediaTextResponse>(
      '/api/texts/wikipedia/random',
      {
        params,
      }
    )
    return response.data
  },
}

