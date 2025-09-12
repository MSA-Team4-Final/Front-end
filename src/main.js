import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { message } from 'ant-design-vue'
import Antd from 'ant-design-vue'
import "ant-design-vue/dist/reset.css";

import './style.css'
import App from './App.vue'
import router from './router'

import axios from 'axios'

// ===== Axios 기본 설정 =====
axios.defaults.baseURL = 'http://192.168.230.13:8080'
axios.defaults.timeout = 10000
axios.defaults.headers.post['Content-Type'] = 'application/json'
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.withCredentials = true 

message.config({ top: '80px' })

let authStore = null

// ===== 요청 인터셉터 =====
axios.interceptors.request.use(
  (config) => {
     if (config.headers?.['X-Skip-Auth'] === 'true') return config

    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers = config.headers || {}
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // (디버그) 요청 로그
    console.log('📤 Axios 요청:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL ? config.baseURL + (config.url || '') : config.url,
      headers: config.headers,
      data: config.data,
    })
    return config
  },
  (error) => {
    console.error('📤 Axios 요청 오류:', error)
    return Promise.reject(error)
  }
)

// ===== 응답 인터셉터 =====
axios.interceptors.response.use(
  (response) => {
    console.log('📥 Axios 응답 성공:', {
      status: response.status,
      url: response.config?.url,
      data: response.data,
    })
    return response
  },
  async (error) => {
    const status = error?.response?.status
    const original = error.config || {}
    const skipRefresh = original?.headers?.['X-Skip-Auth-Refresh'] === 'true'

    console.error('📥 Axios 응답 오류:', {
      status,
      url: original?.url,
      data: error?.response?.data,
    })

    if (status === 401 && !original._retry && !skipRefresh) {
      original._retry = true
      try {
        if (!authStore) {
          const { useAuthStore } = await import('@/stores/auth')
          authStore = useAuthStore()
        }
        const newToken = await authStore.refreshToken({ quiet: true })
        if (newToken) {
          original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` }
          return axios(original)
        }
      } catch (e) {
        console.warn('⚠️ 자동 재발급 실패:', e)
      }
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)
const pinia = createPinia()

app.use(Antd)
app.use(pinia)
app.use(router)

import { useAuthStore } from '@/stores/auth'
authStore = useAuthStore()
authStore.loadToken()

app.mount('#app')
