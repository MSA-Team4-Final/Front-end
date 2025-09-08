<template>
  <a-layout class="mypage-layout">
    <!-- 사이드바 -->
    <a-layout-sider width="200" class="sidebar" breakpoint="lg" collapsed-width="0">
      <div class="sidebar-title">마이페이지</div>
      <a-menu
        mode="inline"
        :selected-keys="[activeSection]"
        @click="({ key }) => setSection(key)"
        style="height: 100%; border-right: 0"
      >
        <a-menu-item key="info">개인정보</a-menu-item>
        <a-menu-item key="accountDetail">계좌조회</a-menu-item>
        <!-- <a-menu-item key="exchange">환전내역</a-menu-item> -->
        <!-- <a-menu-item key="remittance">송금내역</a-menu-item> -->
        <a-menu-item key="depositWithdraw">입금/출금</a-menu-item>
        <a-menu-item key="depositWithdrawHistory">입금/출금내역</a-menu-item>
        <a-menu-item key="calendar">캘린더</a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- 메인 콘텐츠 -->
    <a-layout-content class="main-content">
      <component :is="activeComponent" />
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { ref, computed, markRaw, onMounted  } from 'vue'
import { useRoute } from 'vue-router'

import MyInfo from './mypage/MyInfo.vue'
import CalendarView from './mypage/CalendarView.vue'
import AccountDetail from './Account/AccountView.vue'
import DepositWithdraw from './Account/DepositWithdraw.vue'
import DepositWithdrawHistory from './Account/DepositWithdrawHistory.vue'

const route = useRoute()
const activeSection = ref('info')

const componentsMap = {
  info: markRaw(MyInfo),
  accountDetail: markRaw(AccountDetail),
  depositWithdraw: markRaw(DepositWithdraw),
  depositWithdrawHistory: markRaw(DepositWithdrawHistory),
  exchange: markRaw(ExchangeHistory),
  remittance: markRaw(RemittanceHistory),
  calendar: markRaw(CalendarView),
}

const activeComponent = computed(() => componentsMap[activeSection.value])

function setSection(section) {
  activeSection.value = section
}

onMounted(() => {
  const sectionParam = route.query.section
  if (sectionParam && componentsMap[sectionParam]) {
    activeSection.value = sectionParam
  }
})
</script>

<style scoped>
.mypage-layout {
  min-height: 85vh;
  background: #fff;
}

.sidebar {
  background: #f0f2f5;
  
}

.sidebar-title {
  padding: 16px;
  font-size: 18px;
  font-weight: bold;
  color: #137c7c;
  text-align: center;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
}

.main-content {
  padding: 24px;
  background: #fff;
  min-height: 100%;
}
</style>
