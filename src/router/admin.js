// 관리자 전용 라우트
export default {
  path: '/admin',
  name: 'AdminPage',
  component: () => import('@/components/admin/AdminLayout.vue'),
  meta: { requires: 'ROLE_ADMIN' },
  children: [
    { 
        path: '', 
        name: 'AdminHome',
        redirect: '/admin/dashboard'
     },
    { 
        path: 'dashboard', 
        name: 'AdminDashboard',
        component: () => import('@/views/admin/AdminDashboard.vue') 
    },
    { 
        path: 'users', 
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue') 
    },
    { 
        path: 'inquiries',
        name: 'AdminInquiries', 
        component: () => import('@/views/admin/Inquiries.vue') 
    },
    { 
        path: 'remittances', 
        name: 'AdminRemittances', 
        component: () => import('@/views/admin/Remittances.vue') 
    },
    { 
        path: 'settings', 
        name: 'AdminSettings', 
        component: () => import('@/views/admin/Settings.vue') 
    },
  ]
}
