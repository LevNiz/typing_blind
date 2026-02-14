import apiClient from './client'

// User management
export interface AdminUserResponse {
  id: string
  email: string
  username: string
  is_active: boolean
  is_admin: boolean
  created_at: string
}

export interface AdminUserListResponse {
  items: AdminUserResponse[]
  total: number
}

export interface AdminUserUpdate {
  email?: string
  username?: string
  is_active?: boolean
  is_admin?: boolean
}

export interface AdminUserStats {
  total_trainings: number
  avg_wpm: number
  avg_cpm: number
  avg_accuracy: number
  total_errors: number
  total_texts: number
}

// Text management
export interface AdminTextResponse {
  id: string
  title: string
  content: string
  type: 'text' | 'code'
  language: string | null
  is_public: boolean
  owner_id: string
  created_at: string
}

export interface AdminTextListResponse {
  items: AdminTextResponse[]
  total: number
}

export interface AdminTextCreate {
  title: string
  content: string
  type: 'text' | 'code'
  language?: string
  is_public: boolean
}

// Stats
export interface AdminGeneralStats {
  total_users: number
  active_users_30d: number
  total_texts: number
  total_trainings: number
  avg_wpm: number
  avg_accuracy: number
}

export interface AdminTrainingStats {
  period: string
  total: number
  avg_wpm: number
  avg_cpm: number
  avg_accuracy: number
  total_errors: number
}

export interface AdminUserActivityStats {
  recent_users_30d: number
  active_users_30d: number
}

export const adminApi = {
  // Users
  getAllUsers: async (params?: {
    limit?: number
    offset?: number
    search?: string
  }): Promise<AdminUserListResponse> => {
    const response = await apiClient.get<AdminUserListResponse>(
      '/api/admin/users',
      { params }
    )
    return response.data
  },

  getUserById: async (userId: string): Promise<AdminUserResponse> => {
    const response = await apiClient.get<AdminUserResponse>(
      `/api/admin/users/${userId}`
    )
    return response.data
  },

  updateUser: async (
    userId: string,
    data: AdminUserUpdate
  ): Promise<AdminUserResponse> => {
    const response = await apiClient.put<AdminUserResponse>(
      `/api/admin/users/${userId}`,
      data
    )
    return response.data
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/api/admin/users/${userId}`)
  },

  getUserStats: async (userId: string): Promise<AdminUserStats> => {
    const response = await apiClient.get<AdminUserStats>(
      `/api/admin/users/${userId}/stats`
    )
    return response.data
  },

  // Texts
  getAllTexts: async (params?: {
    limit?: number
    offset?: number
    type?: 'text' | 'code'
    search?: string
  }): Promise<AdminTextListResponse> => {
    const response = await apiClient.get<AdminTextListResponse>(
      '/api/admin/texts',
      { params }
    )
    return response.data
  },

  getTextById: async (textId: string): Promise<AdminTextResponse> => {
    const response = await apiClient.get<AdminTextResponse>(
      `/api/admin/texts/${textId}`
    )
    return response.data
  },

  createText: async (
    data: AdminTextCreate,
    ownerId?: string
  ): Promise<AdminTextResponse> => {
    const params = ownerId ? { owner_id: ownerId } : {}
    const response = await apiClient.post<AdminTextResponse>(
      '/api/admin/texts',
      data,
      { params }
    )
    return response.data
  },

  updateText: async (
    textId: string,
    data: AdminTextCreate
  ): Promise<AdminTextResponse> => {
    const response = await apiClient.put<AdminTextResponse>(
      `/api/admin/texts/${textId}`,
      data
    )
    return response.data
  },

  deleteText: async (textId: string): Promise<void> => {
    await apiClient.delete(`/api/admin/texts/${textId}`)
  },

  // Stats
  getGeneralStats: async (): Promise<AdminGeneralStats> => {
    const response = await apiClient.get<AdminGeneralStats>(
      '/api/admin/stats'
    )
    return response.data
  },

  getTrainingStats: async (
    period: 'day' | 'week' | 'month' | 'all' = 'all'
  ): Promise<AdminTrainingStats> => {
    const response = await apiClient.get<AdminTrainingStats>(
      '/api/admin/stats/trainings',
      { params: { period } }
    )
    return response.data
  },

  getUserActivityStats: async (): Promise<AdminUserActivityStats> => {
    const response = await apiClient.get<AdminUserActivityStats>(
      '/api/admin/stats/users'
    )
    return response.data
  },
}

