import {createRouter, createWebHistory} from 'vue-router'
import LoginPages from '@/views/auth/LoginPages.vue'
import { useAuthStore } from '@/stores/auth'
import adminRoutes from './admin'
import axios from 'axios'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'MainPage',
            component: () => import('@/components/MainPage.vue')
        },
        {
            path: '/rate-lookup',
            name: 'RateLookup',
            component: () => import('@/views/ExchangeInfo/RateLookup.vue'),
            meta: {requiresAuth: true}
        },
        {
            path: '/rate-calculator',
            name: 'RateCalculator',
            component: () => import('@/views/ExchangeInfo/Calculator.vue'),
            meta: {requiresAuth: true}
        },
        {
            path: '/rate-alert',
            name: 'RateAlert', 
            component: () => import('@/views/ExchangeInfo/RateAlert.vue'),
            meta: {requiresAuth: true}
        },
        {
            path: '/rate-chart',
            name: 'RateChart',
            component: () => import('@/views/ExchangeInfo/RateChart.vue'),
            meta: {requiresAuth: true, requiresVerified: true }
        },
        {
            path: '/rate-news',
            name: 'News',
            component: () => import('@/views/News.vue'),
            meta: {requiresAuth: true}
        },
        {
            path: '/exchange',
            name: 'Exchange',
            component: () => import('@/views/CurrentExchange/CurrentExchange.vue'),
            meta: {requiresAuth: true}
        },
        {
            path: '/remittance',
            name: 'Remittance',
            component: () => import('@/views/Remittance/Remittance.vue'),
            meta: {requiresAuth: true}
        },
        {
            path: '/favorites',
            name: 'Favorites',
            component: () => import('@/views/Remittance/FavoriteFriend.vue'),
            meta: {requiresAuth: true}
        },
        {
            path: '/account',
            name: 'Account',
            component: () => import('@/views/Account/AccountView.vue'),
            meta: {requiresAuth: true}
        },
        {
            path: '/ForeignTransfer',
            name: 'ForeignTransfer',
            component: () => import('@/views/ForeignTransfer/views/TransferRepuest/TransferRequest.vue'),
            // meta: {requiresAuth: true}
        },
        {
            path: '/account/detail', // 나중에 통화별 id 나 코드 받아서 넘겨야함 ex) /account/:currency
            name: 'AccountDetail',
            component: () => import('@/views/Account/AccountDetail.vue'),
            props: true,
            meta: {requiresAuth: true}
        },
        {
            path: '/remittance/list', 
            name: 'RemittanceDetail',
            component: () => import('@/views/Remittance/RemittanceDetail.vue'),
            props: true,
            meta: {requiresAuth: true}
        },
        {
            path: '/exchange/list', 
            name: 'currentExchangeDetail',
            component: () => import('@/views/CurrentExchange/CurrentExchangeDetail.vue'),
            props: true,
            meta: {requiresAuth: true}
        },
        {
            path: '/exchange/reservation',
            name: 'ReservationExchange',
            component: () => import('@/views/CurrentExchange/ReservationExchange.vue'),
            //meta: {requiresAuth: true}
        },
        {
            path: '/login',
            name: 'LoginPages',
            component: LoginPages
        },
        {
          path: '/signup',
          component: () => import('@/components/auth/SignupLayout.vue'),
          children: [
            { path: '', name: 'SignupAgreement', component: () => import('@/views/auth/SignupAgreement.vue') },
            { path: 'identity', name: 'SignupIdentity', component: () => import('@/views/auth/SignupIdentity.vue') },
            { path: 'info', name: 'SignUpForm', component: () => import('@/views/auth/SignupForm.vue') },
            { path: 'account', name: 'SignupAccountSecurity', component: () => import('@/views/auth/SignupAccountSecurity.vue') },
          ]
        },
        {
            path: '/find-id',
            name: 'FindId',
            component: () => import('@/views/auth/FindId.vue')
        },
        {
            path: '/reset-password',
            name: 'ResetPassword',
            component: () => import('@/views/auth/ResetPassword.vue')
        },
        {
            path: '/mypage',
            name: 'MyPage',
            component: () => import('@/views/MyPage.vue'),
            meta: {requiresAuth: true}
        },
        {
            path: '/recipients/post',
            name: 'RecipientsPost',
            component: () => import('@/views/ForeignTransfer/views/Recipients/PostRecipients.vue'),
        },
        {
            path: '/recipients/edit/:id',
            name: 'RecipientsPut',
            component: () => import('@/views/ForeignTransfer/views/Recipients/PutRecipients.vue'),
        },
        {
            path: '/recipients',
            name: 'recipients',
            component: () => import('@/views/ForeignTransfer/views/Recipients/GetRecipients.vue'),
        },
        {
            path: '/ForeignTransfer/list',
            name: 'ForeignTransferList',
            component: () => import('@/views/ForeignTransfer/views/TransferList/TransferList.vue'),
        },
        {
            path: '/ForeignTransfer/info',
            name: 'ForeignTransferInfo',
            component: () => import('@/views/ForeignTransfer/views/TransferRepuest/information.vue'),
        },
        {
            path: '/inquiry/list',
            name: 'InquiryList',
            component: () => import('@/views/support/InquiryList.vue')
        },
        {
            path: '/inquiry/write',
            name: 'InquiryWrite',
            component: () => import('@/views/support/InquiryWrite.vue')
        },
        adminRoutes,

    ],
})

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return null }
}

function hasVerifiedFromToken(token) {
  if (!token) return false
  const payload = parseJwt(token)
  if (!payload) return false
  if (payload.verified === true) return true
  const auths = payload.authorities || payload.auth || payload.roles || payload.scope
  if (Array.isArray(auths)) return auths.includes('VERIFIED') || auths.includes('ROLE_VERIFIED')
  if (typeof auths === 'string') {
    return auths.split(/[,\s]/).includes('VERIFIED') || auths.includes('ROLE_VERIFIED')
  }
  return false
}

async function ensureVerifiedViaAPI() {
  try {
    const res = await axios.get('/api/user/myinfo') // 또는 /api/user/me
    const d = res.data || {}
    if (d.verified === true) return true
    if (d.status === 'VERIFIED') return true
    if (typeof d.authority === 'string' && d.authority.includes('VERIFIED')) return true
    if (Array.isArray(d.authorities) && d.authorities.includes('VERIFIED')) return true
  } catch {}
  try {
    await axios.head('/api/exchange/rates')
    return true
  } catch { return false }
}

// 🔒 인증 가드 설정
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 인증 상태 확인 (액세스 토큰이 없어도 리프레시 토큰으로 복구 시도)
  const token = authStore.getToken?.() || localStorage.getItem('accessToken')
  if (!authStore.isAuthenticated) {
    await authStore.checkAuthStatus?.()
  }
  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    alert('로그인이 필요합니다.')
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresAdmin) {
    const isAdmin = authStore.userInfo.role === 'ROLE_ADMIN'
    if (!isAdmin) {
      alert('접근 권한이 없습니다. 관리자만 이용할 수 있어요.')
      return next('/')
    } 
  }

  // VERIFIED 필요
  if (to.meta.requiresVerified) {
    let ok = authStore.userInfo?.verified === true || hasVerifiedFromToken(token)
    if (!ok) ok = await ensureVerifiedViaAPI()
    if (!ok) {
      alert('인증 완료 사용자만 접근할 수 있습니다.')
      return next(from.name ? false : '/403')
    }
  }

  if (to.path === '/login' && isAuthenticated) {
    return next('/')
  }

  next()
})

export default router