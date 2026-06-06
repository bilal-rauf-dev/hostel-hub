import axios, { AxiosInstance } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach access token
// lib/api.ts

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest.url?.includes('/auth/login') && !originalRequest._retry) {

      try {
      } catch (err) {
        localStorage.removeItem('hh_access_token');
        localStorage.removeItem('hh_refresh_token');
        processQueue(err, null);
        
        if (typeof window !== 'undefined') {
           window.location.href = '/';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Response interceptor: handle 401 and refresh token
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(apiClient(originalRequest)),
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('hh_refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const newAccessToken = response.data.data.access_token
        localStorage.setItem('hh_access_token', newAccessToken)

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
        processQueue(null, newAccessToken)

        return apiClient(originalRequest)
      } catch (err) {
        localStorage.removeItem('hh_access_token')
        localStorage.removeItem('hh_refresh_token')
        processQueue(err, null)
        
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ============================================
// AUTH API
// ============================================
export const authApi = {
  register: async (payload: { display_name: string; email: string; password: string; student_id: string; room_number?: string; contact_number?: string }) => {
    return apiClient.post('/api/v1/auth/register/', payload)
  },

  verifyOtp: async (email: string, otp_code: string) => {
    return apiClient.post('/api/v1/auth/verify-otp/', {
      email,
      otp_code,
    })
  },

  login: async (email: string, password: string) => {
    return apiClient.post('/api/v1/auth/login/', {
      email,
      password,
    })
  },

  refresh: async (refreshToken: string) => {
    return apiClient.post('/api/v1/auth/refresh/', {
      refresh_token: refreshToken,
    })
  },

  logout: async () => {
    return apiClient.post('/api/v1/auth/logout/')
  },
}

// ============================================
// USERS API
// ============================================
export const usersApi = {
  getMe: async () => {
    return apiClient.get('/api/v1/users/me')
  },

  getSummary: async () => {
    return apiClient.get('/api/v1/users/me/summary')
  },

  updateMe: async (display_name?: string, contact_number?: string, profile_picture?: string, room_number?: string) => {
    return apiClient.patch('/api/v1/users/me', {
      display_name,
      contact_number,
      profile_picture,
      room_number,
    })
  },

  getAllUsers: async () => {
    return apiClient.get('/api/v1/users/')
  },
  verifyUser: async (id: number) => {
    return apiClient.patch(`/api/v1/users/${id}/verify`)
  },

  suspendUser: async (id: number) => {
    return apiClient.patch(`/api/v1/users/${id}/suspend`)
  },

  getPendingVerifications: async () => {
    return apiClient.get('/api/v1/users/pending-verifications')
  },

  resendOtp: async (id: number) => {
    return apiClient.post(`/api/v1/users/${id}/resend-otp`)
  },
}

// ============================================
// MARKETPLACE API
// ============================================
export const marketplaceApi = {
  getListings: async (search?: string, category?: string, min_price?: number, max_price?: number) => {
    return apiClient.get('/api/v1/marketplace/listings', {
      params: { search, category, min_price, max_price },
    })
  },

  createListing: async (title: string, description: string, category: string, price: number, quantity: number) => {
    return apiClient.post('/api/v1/marketplace/listings', {
      title,
      description,
      category,
      price,
      quantity,
    })
  },

  updateListing: async (listing_id: number, title?: string, description?: string, category?: string, price?: number, image_url?: string) => {
    return apiClient.patch(`/api/v1/marketplace/listings/${listing_id}`, {
      title,
      description,
      category,
      price,
      image_url,
    })
  },

  deleteListing: async (listing_id: number) => {
    return apiClient.delete(`/api/v1/marketplace/listings/${listing_id}`)
  },

  placeOrder: async (listing_id: number, quantity: number = 1) => {
    return apiClient.post(`/api/v1/marketplace/listings/${listing_id}/order`, {
      quantity,
    })
  },

  updateOrderStatus: async (order_id: number, status: string) => {
    return apiClient.patch(`/api/v1/marketplace/orders/${order_id}/status`, {
      status,
    })
  },

  getMyOrders: async () => {
    return apiClient.get('/api/v1/marketplace/orders/mine')
  },

  getReceivedOrders: async () => {
  return apiClient.get('/api/v1/marketplace/orders/received')
  },
}

// ============================================
// MAINTENANCE API
// ============================================
export const maintenanceApi = {
  createTicket: async (description: string, category: string, room_number: string) => {
    return apiClient.post('/api/v1/maintenance/tickets', {
      description,
      category,
      room_number,
    })
  },

  getTickets: async () => {
    return apiClient.get('/api/v1/maintenance/tickets')
  },

  getAllTickets: async () => {
  return apiClient.get('/api/v1/maintenance/tickets')
},

  updateTicketStatus: async (ticket_id: number, status: string) => {
    return apiClient.patch(`/api/v1/maintenance/tickets/${ticket_id}/status`, {
      status,
    })
  },

  assignTicket: async (ticket_id: number, assigned_to: number) => {
    return apiClient.patch(`/api/v1/maintenance/tickets/${ticket_id}/assign`, {
      assigned_to,
    })
  },

  deleteTicket: async (ticket_id: number) => {
    return apiClient.delete(`/api/v1/maintenance/tickets/${ticket_id}`)
  },
}

// ============================================
// POLLS API
// ============================================
export const pollsApi = {
  getPolls: async () => {
    return apiClient.get('/api/v1/polls/')
  },

  createPoll: async (question: string, options: string[], deadline: string) => {
    return apiClient.post('/api/v1/polls/', {
      question,
      options,
      deadline,
    })
  },

  castVote: async (poll_id: number, option_id: number) => {
    return apiClient.post(`/api/v1/polls/${poll_id}/vote`, {
      option_id,
    })
  },

  getPollResults: async (poll_id: number) => {
    return apiClient.get(`/api/v1/polls/${poll_id}/results`)
  },

  deletePoll: async (poll_id: number) => {
  return apiClient.delete(`/api/v1/polls/${poll_id}`)
  },
}

// ============================================
// EVENTS API
// ============================================
export const eventsApi = {
  getEvents: async () => {
    return apiClient.get('/api/v1/events/')
  },

  createEvent: async (title: string, description: string, location: string, event_date: string, image_url?: string) => {
    return apiClient.post('/api/v1/events/', {
      title,
      description,
      location,
      event_date,
      image_url,
    })
  },

  rsvpEvent: async (event_id: number, status: string) => {
    return apiClient.post(`/api/v1/events/${event_id}/rsvp`, {
      status,
    })
  },

  getEventRsvps: async (event_id: number) => {
    return apiClient.get(`/api/v1/events/${event_id}/rsvps`)
  },

  deleteEvent: async (event_id: number) => {
  return apiClient.delete(`/api/v1/events/${event_id}`)
  },
}

// ============================================
// LOST & FOUND API
// ============================================
export const lostFoundApi = {

  getItems: async () => {
    return apiClient.get('/api/v1/lost-found/')
  },

  // Accept a payload object to support required backend fields
  postItem: async (payload: { item_type: string, description: string, location_tag: string, item_date: string, is_anonymous: boolean, title?: string, image_url?: string }) => {
    return apiClient.post('/api/v1/lost-found/', payload)
  },

  archiveItem: async (item_id: number) => {
    return apiClient.patch(`/api/v1/lost-found/${item_id}/archive`)
  },

  resolveItem: async (item_id: number) => {
    return apiClient.patch(`/api/v1/lost-found/${item_id}/resolve`)
  },
}

// ============================================
// GUIDEBOOK API
// ============================================
export const guidebookApi = {
  getEntries: async () => {
    return apiClient.get('/api/v1/guidebook/')
  },

  createEntry: async (title: string, content: string, category: string, icon_url?: string) => {
    return apiClient.post('/api/v1/guidebook/', {
      title,
      content,
      category,
      icon_url,
    })
  },

  updateEntry: async (entry_id: number, title?: string, content?: string, category?: string, icon_url?: string) => {
    return apiClient.patch(`/api/v1/guidebook/${entry_id}`, {
      title,
      content,
      category,
      icon_url,
    })
  },

  deleteEntry: async (entry_id: number) => {
    return apiClient.delete(`/api/v1/guidebook/${entry_id}`)
  },
}

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsApi = {
  getNotifications: async () => {
    return apiClient.get('/api/v1/notifications/')
  },

  markAsRead: async (notification_id: number) => {
    return apiClient.patch(`/api/v1/notifications/${notification_id}/read`)
  },

  markAllAsRead: async () => {
    return apiClient.post('/api/v1/notifications/mark-all-read')
  },
}

// ============================================
// SAFETY ALERTS API
// ============================================
export const safetyAlertsApi = {
  getAlerts: async () => {
    return apiClient.get('/api/v1/safety-alerts/')
  },

  createAlert: async (payload: { title: string, body: string, severity?: string }) => {
    return apiClient.post('/api/v1/safety-alerts/', payload)
  },
  toggleAlert: async (id: number) => {
    return apiClient.patch(`/api/v1/safety-alerts/${id}`)
  },
  deleteAlert: async (id: number) => {
    return apiClient.delete(`/api/v1/safety-alerts/${id}`)
  },
}

// ============================================
// COMMUNITY API
// ============================================
export const communityApi = {
  getPosts: async () => {
    return apiClient.get('/api/v1/community/posts')
  },
  createPost: async (content: string) => {
    return apiClient.post('/api/v1/community/posts', { content })
  },
  deletePost: async (post_id: number) => {
    return apiClient.delete(`/api/v1/community/posts/${post_id}`)
  },
  toggleLike: async (post_id: number) => {
    return apiClient.post(`/api/v1/community/posts/${post_id}/like`)
  },
}

// ============================================
// SETTINGS API
// ============================================
export const settingsApi = {
  getSettings: async () => {
    return apiClient.get('/api/v1/settings/')
  },
  updateSettings: async (settings: Record<string, string>) => {
    return apiClient.patch('/api/v1/settings/', { settings })
  },
  getMaintenance: async () => {
    return apiClient.get('/api/v1/settings/maintenance')
  },
  toggleMaintenance: async (enabled: boolean) => {
    return apiClient.post('/api/v1/settings/maintenance', { enabled })
  },
}
