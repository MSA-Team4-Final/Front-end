<template>
  <div id="app">
    <template v-if="shouldHideLayout">
      <router-view />
    </template>

    <template v-else-if="isAdminRoute">
      <router-view />
    </template>

    <template v-else>
      <div class="default-layout">
        <HeaderBar />
        <a-layout-content class="main-content">
          <router-view />
        </a-layout-content>
        <FooterBar />
      </div>
    </template>

    <Chatbot/>

    <div v-if="globalLoading" class="global-loading">
      <a-spin size="large" tip="로딩 중...">
        <div style="width: 100px; height: 100px;"></div>
      </a-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderBar from '@/components/HeaderBar.vue'
import FooterBar from '@/components/FooterBar.vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import Chatbot from '@/components/chatbot/ChatBot.vue'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const globalLoading = ref(false)

// 헤더/푸터 제외할 라우트
const hideLayoutRoutes = ['/login', '/signup', '/find-id', '/reset-password']
const shouldHideLayout = computed(() =>
  hideLayoutRoutes.some(path => route.path.startsWith(path))
)

const isAdminRoute = computed(() => route.path.startsWith('/admin'))

// 앱 시작 시 토큰 로드
onMounted(() => {
  globalLoading.value = true
  try {
    authStore.loadToken()
    console.log('✅ 앱 시작 시 토큰 로드 완료')
  } catch (e) {
    console.error('❌ 토큰 로드 실패', e)
  } finally {
    globalLoading.value = false
  }
})

// Axios 인터셉터
axios.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config
    if (originalRequest.headers?.['X-Skip-Auth-Refresh']) return Promise.reject(error)

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await authStore.refreshToken()
        return axios(originalRequest)
      } catch (refreshError) {
        authStore.clearToken()
        authStore.isAuthenticated = false
        authStore.userInfo = null
        if (!hideLayoutRoutes.includes(route.path)) {
          message.warning('로그인이 만료되었습니다.')
          router.push('/login')
        }
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)
</script>

<style scoped>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  width: 100%;
  overflow-x: hidden;
}

.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 24px;
  background: #f5f5f5;
}

.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}
</style>
