<template>
  <a-layout class="admin-layout">
    <a-layout-sider breakpoint="lg" collapsed-width="0" width="220">
      <div class="logo" @click="go('/admin/dashboard')">
        <img src="@/assets/korex1.png" alt="korex" class="logo-img" />
        <div class="logo-text-wrap">
          |<span class="admin-label"> 관리자 사이트</span>
        </div>
      </div>

      <a-menu
        mode="inline"
        :selectedKeys="[activeKey]"
        :items="menuItems"
        @click="onMenuClick"
      />
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="topbar">
        <div class="left">
          <a-breadcrumb :items="breadcrumb" />
        </div>
        <div class="right">
          <a-divider type="vertical" />
          <a-dropdown>
            <a-avatar style="cursor:pointer">A</a-avatar>
            <template #overlay>
              <a-menu @click="onUserMenu">
                <a-menu-item  @click="handleLogout">로그아웃</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { computed, ref, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import {
  PieChartOutlined,
  UserOutlined,
  MessageOutlined,
  DollarCircleOutlined,
  SettingOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const q = ref('')
const authStore = useAuthStore()

/** 사이드바 메뉴 */
const menuItems = [
  { key: '/admin/dashboard', label: '대시보드', icon: () => h(PieChartOutlined) },
  { key: '/admin/users', label: '회원 관리', icon: () => h(UserOutlined) },
  { key: '/admin/inquiries', label: '문의 관리', icon: () => h(MessageOutlined) },
  { key: '/admin/remittances', label: '송금 관리', icon: () => h(DollarCircleOutlined) },
  { key: '/admin/settings', label: '설정', icon: () => h(SettingOutlined) },
]

/** 현재 활성 메뉴 키 */
const activeKey = computed(() => {
  const path = route.path
  const keys = menuItems.filter(i => i.key).map(i => i.key)
  const found = keys
    .filter(k => path.startsWith(k))
    .sort((a,b) => b.length - a.length)[0]
  return found || '/admin/dashboard'
})

const breadcrumb = computed(() => {
  const segs = route.path.replace(/^\/+/, '').split('/')
  const acc = []
  const items = []
  segs.forEach(s => {
    acc.push(s)
    items.push({ title: s })
  })
  return items.length ? items : [{ title: 'admin' }, { title: 'dashboard' }]
})

function onMenuClick({ key }) {
  if (key) router.push(key)
}
function go(path) { router.push(path) }

function onSearch(val) {
  if (!val) return
  message.info(`"${val}" 검색 (추후 전역 검색 연동)`)
}
const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.admin-layout { 
  min-height: 100vh; 
  background: #f4f8fb;
}
.logo { 
  height: 64px; 
  display:flex; 
  align-items:center; 
  justify-content:center; 
  cursor: pointer; 
  background: #fff;
}
.logo-img {
  height: 32px;
  width: auto;
  margin-right: 8px;
}
/* 사이드바 */
:deep(.ant-layout-sider) {
  background: #fff; 
  border-right: 1px solid #e8e8e8;
  box-shadow: 2px 0 6px rgba(0,0,0,0.04);
}
:deep(.ant-menu) {
  background: transparent; 
  color: #444;
  font-weight: 500;
}
:deep(.ant-menu-item) {
  color: #444 !important;
  border-radius: 10px;
  margin: 6px 10px;
  transition: all .2s;
}
:deep(.ant-menu-item:hover) {
  background: #e0f7f4 !important;
  color: #009490 !important;
}
:deep(.ant-menu-item-selected) {
  background: #009490 !important; 
  color: #fff !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,148,144,0.15);
}
.topbar {
  height: 64px; 
  display:flex; 
  align-items:center; 
  justify-content:space-between;
  padding: 0 20px; 
  background: #fff; 
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.topbar .left { 
  display:flex; 
  align-items:center; 
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
}
.topbar .right { 
  display:flex; 
  align-items:center; 
  gap: 12px; 
}
.content { 
  padding: 24px; 
  background: #f4f8fb; 
  min-height: calc(100vh - 64px); 
}
</style>

