<template>
  <div id="app" class="app-container">
    <div class="top-logo-wrapper"> 
      <router-link to="/">
        <img src="@/assets/korex1.png" alt="로고" class="top-app-logo" />
      </router-link>
    </div>

    <main class="login-only-section">
      <div class="login-box with-divider">
        <div class="left-section">
          <h2 class="login-text">LOGIN</h2>
          <p class="left-desc">
            아이디/비밀번호를 통해<br />인터넷뱅킹에 로그인합니다.
          </p>
        </div>
        <div class="divider"></div>
        <div class="right-section">
          <a-form
            :model="loginForm"
            @finish="handleLogin"
            layout="vertical"
            class="login-form"
          >
            <a-form-item
              name="username"
              :rules="[{ required: true, message: '아이디를 입력해주세요!' }]"
            >
              <a-input
                v-model:value="loginForm.username"
                placeholder="아이디 입력"
                size="large"
              />
            </a-form-item>

            <a-form-item
              name="password"
              :rules="[{ required: true, message: '비밀번호를 입력해주세요!' }]"
            >
              <a-input-password
                v-model:value="loginForm.password"
                placeholder="비밀번호 입력"
                size="large"
              />
            </a-form-item>

            <a-form-item>
              <a-button
                type="default"
                html-type="submit"
                class="btn-login"
                :loading="loading"
                size="large"
                block
              >
                로그인
              </a-button>
            </a-form-item>
          </a-form>

          <p class="login-warning">이용자 비밀번호 5회 연속 오류 시</p>
          <p class="login-info">해당 서비스의 이용이 제한됩니다.</p>

          <div class="login-links">
            <router-link to="/find-id" class="login-link">아이디 찾기</router-link>
            <span>|</span>
            <router-link to="/reset-password" class="login-link">비밀번호 변경</router-link>
            <span>|</span>
            <router-link to="/signup" class="login-link">회원가입</router-link>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const loginForm = ref({
  username: '',
  password: ''
})

const handleLogin = async (values) => {
  loading.value = true
  try {
    const success = await authStore.login({
      loginId: values.username,
      password: values.password,
    })

    if (success) {
      message.success('로그인 성공!')

      const userRole = authStore.userInfo?.role

      if (userRole === 'ROLE_ADMIN') {
        router.push('/admin/dashboard');
      } else if (userRole === 'ROLE_USER') {
        router.push('/');
      } else {
        console.warn('알 수 없는 사용자 역할:', userRole);
        router.push('/');
      }
    }
  } catch (err) {
    message.error('로그인에 실패했습니다. 아이디와 비밀번호를 다시 확인해주세요.')
    console.error('로그인 처리 중 예외:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f9fafb;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Noto Sans KR', sans-serif;
}

.top-logo-wrapper {
  margin-top: 3rem;
  margin-bottom: 6rem;
  display: flex;
  justify-content: center;
}

.top-app-logo {
  width: 200px;
  height: auto;
  max-width: 100%;
  object-fit: contain;
  transform: translateY(10px);
}

.login-only-section {
  display: flex;
  justify-content: center;
  align-items: start;
  flex: 1;
  width: 100%;
}

.login-box.with-divider {
  display: flex;
  flex-direction: row;
  background-color: white;
  padding: 2rem 2.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  max-width: 880px;
  width: 100%;
  gap: 2rem;
  align-items: center;
}

.left-section,
.right-section {
  flex: 1;
  max-width: 100%;
}

.left-section {
  text-align: center;
}

.login-text {
  font-size: 2.2rem;
  font-weight: 800;
   color: #137c7c;
  margin-bottom: 1.25rem;
}

.left-desc {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
}

.divider {
  width: 1px;
  height: 220px;
  background-color: #e5e7eb;
}

.right-section {
  flex: 1;
}

.input-wrapper {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
}

.combined-input {
  padding: 1.05rem;
  border: none;
  outline: none;
  font-size: 1rem;
}

.combined-input + .combined-input {
  border-top: 1px solid #d1d5db;
}

btn-login {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  border-radius: 0.5rem;
  background-color: #137c7c !important;
  color: white !important;
  border: none !important; 
  margin-top: 0.75rem;
  margin-bottom: 1.25rem;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.btn-login:hover {
  background-color: #0f5e5e !important;
  color: white !important;
  transform: translateY(-1px);
}

.login-warning {
  color: #d97706;
  font-weight: bold;
  font-size: 0.85rem;
  text-align: center;
  margin-bottom: 0.25rem;
}

.login-info {
  text-align: center;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.login-links {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.login-link {
  text-decoration: none;
  color: #137c7c;
}
</style>