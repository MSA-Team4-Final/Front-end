<template>
  <header class="signup-header">
    <h1 class="title">
      <router-link to="/" class="logo-link" aria-label="홈으로 이동">
        <img src="@/assets/korex1.png" alt="Korex 로고" class="app-logo" />
      </router-link>
    </h1>

    <nav class="steps" aria-label="회원가입 단계">
      <ol class="step-list">
        <li :class="{ active: currentStep === 1 }" class="step-item">
          <span class="num">1</span>
          <span class="label">약관 동의</span>
        </li>
        <span class="arrow" aria-hidden="true">→</span>

        <li :class="{ active: currentStep === 2 }" class="step-item">
          <span class="num">2</span>
          <span class="label">신분증 인증</span>
        </li>
        <span class="arrow" aria-hidden="true">→</span>

        <li :class="{ active: currentStep === 3 }" class="step-item">
          <span class="num">3</span>
          <span class="label">개인정보 입력</span>
        </li>

        <li :class="{ active: currentStep === 4 }" class="step-item">
          <span class="num">4</span>
          <span class="label">계좌 비밀번호 설정</span>
        </li>
      </ol>
    </nav>
  </header>
</template>

<script setup>
const props = defineProps({
  /** 1: 약관 동의, 2: 신분증 인증, 3: 개인정보 입력, 4: 계좌 비밀번호 설정 */
  currentStep: { type: Number, default: 1 },
});
</script>

<style scoped>
.signup-header {
  padding: 24px 16px 12px;
  text-align: center;
}

.title {
  margin: 0 0 12px;
  line-height: 0;
}

.logo-link {
  display: inline-block;
}
.app-logo {
  height: 48px;
  width: auto;
  vertical-align: middle;
}

.steps {
  display: flex;
  justify-content: center;
}

.step-list {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
}

.step-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #666;
}

.step-item .num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid #d9d9d9;
  font-size: 14px;
  line-height: 1;
  background: #fff;
}

.step-item.active {
  font-weight: 800;
  color: #141414;
}

.step-item.active .num {
  border-color: #1677ff;
  background: #e6f4ff;
}

.arrow {
  opacity: 0.5;
}

@media (max-width: 480px) {
  .app-logo { height: 26px; }
  .step-item .label { font-size: 14px; }
  .step-item .num { width: 22px; height: 22px; font-size: 12px; }
}

</style>
