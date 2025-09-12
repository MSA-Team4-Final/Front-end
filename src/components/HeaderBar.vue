<template>
  <header class="header-bar">
    <div class="header-main">
      <router-link to="/">
        <img src="@/assets/korex1.png" alt="KOSA FOREX" class="logo" />
      </router-link>
      
      <nav class="main-menu">
        <div class="dropdown" @mouseenter="rateMenu=true" @mouseleave="rateMenu=false">
          <a @click="goToRateLookup()" class="dropdown-toggle" style="cursor: pointer">환율</a>
          <ul class="dropdown-menu" v-show="rateMenu">
            <li class="section-title" @click="goToRateLookup()">환율조회</li>
            <li class="section-title" @click="goToRateCalculator()">환율계산기</li>
            <li class="section-title" @click="goToRateAlert()">환율알림</li>
          </ul>
        </div>

        <div class="dropdown" @mouseenter="exchangeMenu=true" @mouseleave="exchangeMenu=false">
          <a @click="goToExchange()" class="dropdown-toggle" style="cursor: pointer">환전</a>
          <ul class="dropdown-menu" v-show="exchangeMenu">
            <li class="section-title" @click="goToExchange()">환전</li>
            <li class="section-title" @click="goToExchangeDetail()">환전내역조회</li>
          </ul>
        </div>
   
        <div class="dropdown" @mouseenter="friendMenu=true" @mouseleave="friendMenu=false">
          <a @click="goToRemittance()" class="dropdown-toggle" style="cursor: pointer">친구송금</a>
          <ul class="dropdown-menu" v-show="friendMenu">
            <li class="section-title" @click="goToRemittance()">친구송금</li>
            <li class="section-title" @click="goToRemittanceDetail()">송금내역조회</li>
            <li class="section-title" @click="goToFavoriteFriends()">친구즐겨찾기</li>
          </ul>
        </div>

        <div class="dropdown" @mouseenter="foreignMenu=true" @mouseleave="foreignMenu=false">
          <a @click="goToTransferInfo()" class="dropdown-toggle" style="cursor: pointer">해외송금</a>
          <ul class="dropdown-menu" v-show="foreignMenu">
            <li class="section-title" @click="goToTransferInfo()">해외송금안내</li>
            <li class="section-title" @click="goToTransferRequest()">해외송금신청</li>
            <li class="section-title" @click="goToForeignTransferList()">거래내역조회</li>
            <li class="section-title" @click="goToRecipients()">수취인목록</li>
          </ul>
        </div>

        <div class="dropdown" @mouseenter="supportMenu=true" @mouseleave="supportMenu=false">
          <a @click="goToSupport()" class="dropdown-toggle" style="cursor: pointer">고객센터</a>
          <ul class="dropdown-menu" v-show="supportMenu">
            <li class="section-title" @click="goToSupport()">1:1문의</li>
          </ul>
        </div>
      </nav>

      <!-- 사용자 메뉴를 오른쪽으로 이동 -->
      <div class="user-menu">
        <template v-if="isAuthenticated">
          <a @click="goToMyPage()" class="user-link">마이페이지</a>
          <a v-if="isAdmin" @click="goToAdmin()" class="user-link admin-link">관리자</a>
          <a @click="handleLogout" class="user-link logout-link">로그아웃</a>
        </template>
        <template v-else>
          <a @click="goToLogin()" class="user-link login-link">로그인</a>
          <a @click="goToRegister()" class="user-link register-link">회원가입</a>
        </template>
      </div>
    </div>
  </header>

  <!-- 챗봇을 우하단 고정으로 이동 -->
  <div class="chatbot-container">
    <!-- 말풍선 스타일 개선 -->
    <div v-if="showChatbotBubble" class="chatbot-speech-bubble">
      <div class="bubble-content">
        Korex 챗봇에게 물어보세요! 
        <button class="bubble-close-btn" @click="showChatbotBubble = false" aria-label="닫기">×</button>
      </div>
      <!-- 말풍선 꼬리 -->
      <div class="bubble-tail"></div>
    </div>
    
    <div class="chatbot-button" @click="toggleChatbot" title="챗봇">
      🤖
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'

const router = useRouter()
const authStore = useAuthStore()
const showChatbotBubble = ref(true)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// 메뉴 상태
const rateMenu = ref(false)
const exchangeMenu = ref(false)
const friendMenu = ref(false)
const foreignMenu = ref(false)
const supportMenu = ref(false)

// 네비게이션 메서드
const goToRateLookup = () => router.push('/rate-lookup')
const goToRateCalculator = () => router.push('/rate-calculator')
const goToRateAlert = () => router.push('/rate-alert')
const goToExchange = () => router.push('/exchange')
const goToExchangeDetail = () => router.push('/exchange/list')
const goToRemittance = () => router.push('/remittance')
const goToRemittanceDetail = () => router.push('/remittance/list')
const goToFavoriteFriends = () => router.push('/favorites')
const goToLogin = () => router.push('/login')
const goToRegister = () => router.push('/signup')
const goToMyPage = () => router.push('/mypage')
const goToTransferInfo = () => router.push('/ForeignTransfer/info')
const goToTransferRequest = () => router.push('/ForeignTransfer')
const goToRecipients = () => router.push('/recipients')
const goToForeignTransferList = () => router.push('/ForeignTransfer/list')
const goToSupport = () => router.push('/inquiry/list')
const goToAdmin = () => router.push('/admin')

const isAdmin = computed(() => {
  const u = authStore.userInfo || {}
  return (
    u.role === 2 ||
    u.role === 'ADMIN' ||
    u.role?.roleName === 'ROLE_ADMIN' ||
    (Array.isArray(u.roles) && u.roles.includes('ROLE_ADMIN'))
  )
})

const handleLogout = async () => {
  await authStore.logout()
  message.success('로그아웃되었습니다.')
  router.push('/')
}

// 챗봇 토글 이벤트 디스패치
const toggleChatbot = () => {
  window.dispatchEvent(new CustomEvent('toggle-chatbot'))
}
</script>

<style scoped>
.header-bar {
  background: #fff;
  border-bottom: 2px solid #009490;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 48px 8px 48px;
  position: relative;
}

.logo {
  height: 60px;
  margin-right: 60px;
}

.main-menu {
  display: flex;
  gap: 48px;
  flex: 1;
  height: 100%;
  align-items: stretch;
  justify-content: center;
}

.main-menu a {
  color: #444;
  font-size: 1.3rem;
  text-decoration: none;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.main-menu a:hover {
  color: #009490;
}

.dropdown {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  cursor: pointer;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 20px 0;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin: 0;
  padding: 6px 0;
  background: #fff;
  border: 1px solid #009490;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 50;
  list-style: none;
}

.dropdown-menu li {
  padding: 8px 12px;
  font-size: 0.95rem;
  cursor: pointer;
  white-space: nowrap;
  list-style: none;
}

.dropdown-menu li:hover {
  background: #f8f8f8;
}

.section-title {
  font-weight: 500;
  color: #000000;
  padding: 8px 14px;
}

/* 사용자 메뉴 스타일 */
.user-menu {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-left: 60px;
}

.user-link {
  color: #444;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: pointer;
}

.user-link:hover {
  color: #009490;
  background: #f8f9fa;
}

/* 특별한 버튼 스타일 */
.login-link {
  background: #009490;
  color: #fff !important;
}

.login-link:hover {
  background: #007b78;
  color: #fff !important;
}

.register-link {
  border: 1px solid #009490;
  color: #009490 !important;
}

.register-link:hover {
  background: #009490;
  color: #fff !important;
}

.logout-link:hover {
  color: #dc3545;
  background: #f8d7da;
}

.admin-link {
  color: #6f42c1 !important;
}

.admin-link:hover {
  color: #5a2d91 !important;
  background: #e2d9f3;
}

/* 챗봇 스타일 */
.chatbot-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.chatbot-button {
  width: 56px;
  height: 56px;
  background: #009490;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 148, 144, 0.3);
  transition: all 0.2s ease;
}

.chatbot-button:hover {
  background: #007b78;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 148, 144, 0.4);
}

/* 말풍선 스타일 */
.chatbot-speech-bubble {
  position: relative;
  margin-bottom: 8px;
  animation: bounceIn 0.5s ease-out;
}

.bubble-content {
  background: #009490;
  color: white;
  padding: 12px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 148, 144, 0.3);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  max-width: 280px;
}

.bubble-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.1rem;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bubble-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 말풍선 꼬리 */
.bubble-tail {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #009490;
}

/* 말풍선 애니메이션 */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(10px);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 챗봇 창을 위한 글로벌 스타일 가이드라인 */
:global(.chatbot-modal) {
  position: fixed !important;
  bottom: 90px !important;
  right: 24px !important;
  left: auto !important;
  top: auto !important;
  transform: none !important;
  max-width: 400px !important;
  width: 350px !important;
  max-height: 500px !important;
  z-index: 1001 !important;
}

:global(.chatbot-modal .ant-modal-content) {
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(0, 148, 144, 0.2) !important;
}

:global(.chatbot-modal .ant-modal-header) {
  background: #009490 !important;
  color: white !important;
  border-radius: 16px 16px 0 0 !important;
}

:global(.chatbot-modal .ant-modal-title) {
  color: white !important;
}

:global(.chatbot-modal .ant-modal-close-x) {
  color: white !important;
}
</style>
