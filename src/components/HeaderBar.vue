<template>
  <header class="header-bar">
    <div class="header-top">
      <div class="header-actions">
        <template v-if="isAuthenticated">
          <a @click="goToMyPage()" style="cursor: pointer">마이페이지</a>
          <a v-if="isAdmin" @click="goToAdmin()" style="cursor: pointer">관리자</a>
          <a @click="handleLogout" style="cursor: pointer">로그아웃</a>
        </template>
        <template v-else>
          <a @click="goToLogin()" style="cursor: pointer">로그인</a>
        </template>
        <a href="#">인증센터</a>
        <span class="lang">Language ▼</span>
      </div>
    </div>
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
            <li class="section-title" @click="goToReservationExchange()">예약환전</li>
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
            <li class="section-title" @click="goToRecipients()">수취인조회</li>
          </ul>
        </div>

        <div class="dropdown" @mouseenter="supportMenu=true" @mouseleave="supportMenu=false">
          <a @click="goToSupport()" class="dropdown-toggle" style="cursor: pointer">고객센터</a>
          <ul class="dropdown-menu" v-show="supportMenu">
            <li class="section-title" @click="goToSupport()">1:1문의</li>
          </ul>
        </div>
      </nav>

      <div class="header-icons">
        <span class="icon chat" title="챗봇" @click="toggleChatbot">💬</span>
        <span class="icon search" title="검색">🔍</span>
        <span class="icon menu" title="메뉴">☰</span>
      </div>
      <div v-if="showChatbotBubble" class="chatbot-bubble">
        KOSA 챗봇에게 물어보세요~
        <button class="close-btn" @click="showChatbotBubble = false" aria-label="닫기">×</button>
      </div>
    </div>
  </header>
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
const goToReservationExchange = () => router.push('/exchange/reservation')
const goToLogin = () => router.push('/login')
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
.header-top {
  display: flex;
  justify-content: flex-end;  /* 오른쪽 정렬 */
  align-items: center;
  padding: 8px 48px 0 48px;
  font-size: 0.9rem;
  color: #444;
  gap: 18px; /* 항목들 사이 간격 필요 시 추가 */
}
.header-links a {
  margin-right: 18px;
  color: #444;
  text-decoration: none;
}
.header-links a:last-child {
  margin-right: 0;
}
.header-actions a {
  margin-left: 18px;
  color: #444;
  text-decoration: none;
}
.header-actions .lang {
  margin-left: 18px;
  color: #444;
  cursor: pointer;
}
/* 메인메뉴를 중앙에 넓게 펼치기 */
.header-main {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 48px 8px 48px;
  position: relative;
}
.logo {
  height: 60px;
  margin-right: 100px;
}
.main-menu {
  display: flex;
  gap: 48px;
  flex: 1;
  height: 100%;        /* ← 추가! */
  align-items: stretch; /* ← 아이템들(드롭다운 버튼)도 세로로 채움 */
}
.main-menu a {
  color: #444;
  font-size: 1.3rem;
  text-decoration: none;
  font-weight: 700; /* 400 → 700 으로 변경 */
  letter-spacing: 0.01em;
}
.main-menu a:hover {
  color: #009490;
}
/* 드롭다운 스타일 */

.dropdown {
  position: relative;
  /* display: inline-block; */
  /* padding-top: 20px; */
  /* padding-bottom: 20px; */
  display: flex;
  align-items: center;
  height: 100%; /* 추가: 메뉴 높이 채우기 */
  cursor: pointer;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  height: 100%; /* 추가: 내부 <a> 높이 채우기 */
  padding: 20px 0; /* 필요 시 제거 가능 */
}


.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  /* min-width 조정 및 부모에 딱 붙도록 */
  margin: 0;
  padding: 6px 0;
  background: #fff;
  border: 1px solid #009490;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 50;
}

.section-title {
  font-weight: 500;
  color: #000000;
  padding: 8px 14px;
}
.dropdown-menu { list-style: none; }
.dropdown-menu li { padding: 8px 12px; font-size: 0.95rem; cursor: pointer; white-space: nowrap; list-style: none; }
.dropdown-menu li:hover { background: #f8f8f8; }

.header-icons {
  display: flex;
  gap: 18px;
  font-size: 1.2rem;
  margin-left: 24px;
  justify-content: flex-end;    /* 컨테이너 하단으로 전체 아이콘 정렬 */
  height: 100%;                 /* 컨테이너가 부모 기준 세로로 늘어나야 함 */
}
.header-icons .icon {
  cursor: pointer;
}
.chatbot-bubble {
  position: absolute;
  right: 0;
  top: 60px;
  background: #fff;
  border: 1.5px solid #009490;
  border-radius: 24px;
  padding: 6px 18px;
  color: #009490;
  font-size: 1.05rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
}
.close-btn {
  background: none;
  border: none;
  color: #009490;
  font-size: 1.2rem;
  margin-left: 8px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
</style> 