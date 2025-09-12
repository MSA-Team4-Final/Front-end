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
            component: () => import('@/views/ExchangeInfo/RateLookup.vue')
        },
        {
            path: '/rate-calculator',
            name: 'RateCalculator',
            component: () => import('@/views/ExchangeInfo/Calculator.vue')
        },
        {
            path: '/rate-alert',
            name: 'RateAlert', 
            component: () => import('@/views/ExchangeInfo/RateAlert.vue'),
            meta: { requires: 'VERIFIED' },
        },
        {
            path: '/rate-chart',
            name: 'RateChart',
            component: () => import('@/views/ExchangeInfo/RateChart.vue')
        },
        {
            path: '/rate-news',
            name: 'News',
            component: () => import('@/views/News.vue')
        },
        {
            path: '/exchange',
            name: 'Exchange',
            component: () => import('@/views/CurrentExchange/CurrentExchange.vue'),
            meta: { requires: 'VERIFIED' },
        },
        {
            path: '/remittance',
            name: 'Remittance',
            component: () => import('@/views/Remittance/Remittance.vue'),
        },
        {
            path: '/favorites',
            name: 'Favorites',
            component: () => import('@/views/Remittance/FavoriteFriend.vue'),
        },
        {
            path: '/account',
            name: 'Account',
            component: () => import('@/views/Account/AccountView.vue'),
            meta: { requires: 'VERIFIED' },
        },
        {
            path: '/ForeignTransfer',
            name: 'ForeignTransfer',
            component: () => import('@/views/ForeignTransfer/views/TransferRequest/TransferRequest.vue'),
            
        },
        {
            path: '/account/detail', // 나중에 통화별 id 나 코드 받아서 넘겨야함 ex) /account/:currency
            name: 'AccountDetail',
            component: () => import('@/views/Account/AccountDetail.vue'),
            props: true,
            
        },
        {
            path: '/remittance/list', 
            name: 'RemittanceDetail',
            component: () => import('@/views/Remittance/RemittanceDetail.vue'),
            props: true,
            
        },
        {
            path: '/exchange/list', 
            name: 'currentExchangeDetail',
            component: () => import('@/views/CurrentExchange/CurrentExchangeDetail.vue'),
            props: true,
           
        },
        {
            path: '/exchange/reservation',
            name: 'ReservationExchange',
            component: () => import('@/views/CurrentExchange/ReservationExchange.vue'),
            
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
            meta: { requires: 'UNLOCKED' }
        },
        {
            path: '/recipients/post',
            name: 'RecipientsPost',
            component: () => import('@/views/ForeignTransfer/views/Recipients/PostRecipients.vue'),
            meta: { requires: 'authenticated' }
        },
        {
            path: '/recipients/edit/:id',
            name: 'RecipientsPut',
            component: () => import('@/views/ForeignTransfer/views/Recipients/PutRecipients.vue'),
            meta: { requires: 'authenticated' }
        },
        {
            path: '/recipients',
            name: 'recipients',
            component: () => import('@/views/ForeignTransfer/views/Recipients/GetRecipients.vue'),
            meta: { requires: 'authenticated' }
        },
        {
            path: '/ForeignTransfer/list',
            name: 'ForeignTransferList',
            component: () => import('@/views/ForeignTransfer/views/TransferList/TransferList.vue'),
            meta: { requires: 'authenticated' }

        },
        {
            path: '/ForeignTransfer/info',
            name: 'ForeignTransferInfo',
            component: () => import('@/views/ForeignTransfer/views/TransferRequest/information.vue'),
        },
        {
            path: '/inquiry/list',
            name: 'InquiryList',
            component: () => import('@/views/support/InquiryList.vue'),
            meta: { requires: 'authenticated' }
        },
        {
            path: '/inquiry/write',
            name: 'InquiryWrite',
            component: () => import('@/views/support/InquiryWrite.vue'),
            meta: { requires: 'authenticated' }
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

// 🔒 인증 가드 설정
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 인증 상태 확인 (액세스 토큰이 없어도 리프레시 토큰으로 복구 시도)
  const token = authStore.getToken?.() || localStorage.getItem('accessToken')
  if (!authStore.isAuthenticated) {
    await authStore.checkAuthStatus?.()
  }

  const isAuthenticated = authStore.isAuthenticated
  const status = authStore.userInfo?.status
  const isAdmin = authStore.userInfo?.role === 'ROLE_ADMIN'

  const requiredAuth = to.meta.requires
  switch (requiredAuth) {
    case 'authenticated':
      if (!isAuthenticated) {
        alert('로그인이 필요합니다.')
        return next({ path: '/login', query: { redirect: to.fullPath } })
      }
      return next()

    case 'UNLOCKED':
      if (!isAuthenticated) {
        alert('로그인이 필요합니다.')
        return next({ path: '/login', query: { redirect: to.fullPath } })
      }
      if (status === 'RESTRICTED') {
        alert('계정 잠금 상태를 확인하세요.')
        return next('/')
      }
      return next()

    case 'VERIFIED':
      if (!isAuthenticated) {
        alert('로그인 후 이용할 수 있습니다.')
        return next('/login')
      }
      if (status !== 'VERIFIED') {
        alert('이메일 인증 후 이용할 수 있습니다.')
        return next('/')
      }
      return next()

    case 'ROLE_ADMIN':
      if (!isAuthenticated) {
        alert('관리자 로그인이 필요합니다.')
        return next('/login')
      }
      if (!isAdmin) {
        alert('관리자 권한이 없습니다.')
        return next('/')
      }
      return next()

    default:
      return next()
  }
})

export default router