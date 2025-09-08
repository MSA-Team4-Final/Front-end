<template>
  <div class="signup-layout">
    <!-- 헤더 -->
    <SignupHeader :currentStep="currentStep" />

    <!-- 단계별 컨텐츠 -->
    <div class="step-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import SignupHeader from '@/components/auth/SignupHeader.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

// 1: 약관, 2: 신분증, 3: 개인정보, 4: 계좌 비밀번호
const currentStep = computed(() => {
  switch (route.name) {
    case 'SignupAgreement':
      return 1
    case 'SignupIdentity':
      return 2
    case 'SignUpForm':
      return 3
    case 'SignupAccountSecurity':
      return 4
    default:
      return 1
  }
})

</script>

<style scoped>
.signup-layout {
  max-width: 1040px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  min-height: 100vh;
  box-sizing: border-box;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.step-content {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>
