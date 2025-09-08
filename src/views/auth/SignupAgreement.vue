<template>
  <div class="signup-wrapper">
    <main class="signup-section">
      <div class="terms-card with-divider">
        <!-- Left: 안내/요약 -->
        <aside class="left-section">
          <h2 class="left-title">이용약관 동의</h2>
          <p class="left-desc">
            서비스 이용 전 필수 약관에 동의해 주세요.<br />
            선택 항목은 동의하지 않아도 회원가입이 가능합니다.
          </p>

          <div class="select-all">
            <label class="checkbox-row">
              <input type="checkbox" v-model="allChecked" @change="toggleAll" />
              <span class="label"><strong>전체 동의</strong></span>
            </label>
            <p class="hint">
              전체 동의는 필수/선택 항목을 포함하며, 개별적으로도 선택할 수 있습니다.
            </p>
          </div>
        </aside>

        <div class="divider" aria-hidden="true"></div>

        <!-- Right: 약관 본문 -->
        <section class="right-section">
          <!-- 서비스 이용약관 -->
          <div class="terms-box">
            <div class="terms-header">
              <h3>서비스 이용약관 <span class="req">필수</span></h3>
              <label class="checkbox-row">
                <input type="checkbox" v-model="agreements.required" />
                <span>(필수) 이용약관에 동의합니다.</span>
              </label>
            </div>

            <div class="terms-content" tabindex="0" aria-label="서비스 이용약관 내용">
              <p>
                본 약관은 [서비스명]이 제공하는 환전·송금 서비스 이용과 관련하여
                회사와 이용자의 권리·의무 및 책임사항을 규정합니다.
              </p>
              <p>1. 서비스 목적: 이용자가 해외 송금, 외화 환전 등의 서비스를 안전하고
                편리하게 이용할 수 있도록 함을 목적으로 합니다.</p>
              <p>2. 가입 조건: 만 19세 이상의 실명 확인이 가능한 개인 및 사업자.</p>
              <p>3. 금지 행위: 불법 자금 세탁, 사기, 범죄 목적의 이용 등.</p>
              <p>4. 회사 책임: 안정적인 서비스 제공 및 이용자 정보 보호.</p>
              <p>5. 이용자 책임: 정확한 정보 제공, 법령 준수.</p>
            </div>
          </div>

          <!-- 개인정보 처리방침 -->
          <div class="terms-box">
            <div class="terms-header">
              <h3>개인정보 처리방침 <span class="req">필수</span></h3>
              <label class="checkbox-row">
                <input type="checkbox" v-model="agreements.privacy" />
                <span>(필수) 개인정보 처리방침에 동의합니다.</span>
              </label>
            </div>

            <div class="terms-content" tabindex="0" aria-label="개인정보 처리방침 내용">
              <p>회사는 서비스 제공을 위해 필요한 최소한의 개인정보를 수집하며,
                관련 법령에 따라 안전하게 관리합니다.</p>
              <p>- 수집 항목: 이름, 연락처, 계좌정보, 환전/송금 내역 등</p>
              <p>- 보유 기간: 서비스 해지 후 5년 또는 관련 법령에 따른 기간</p>
              <p>- 제3자 제공: 법령이 허용하는 범위 내에서만 제공</p>
            </div>
          </div>

          <!-- 마케팅 정보 수신 (선택) -->
          <div class="terms-box">
            <div class="terms-header">
              <h3>마케팅 정보 수신 <span class="opt">선택</span></h3>
              <label class="checkbox-row">
                <input type="checkbox" v-model="agreements.marketing" />
                <span>(선택) 마케팅 정보 수신에 동의합니다.</span>
              </label>
            </div>

            <div class="terms-content" tabindex="0" aria-label="마케팅 정보 수신 내용">
              <p>회사는 할인 혜택, 환율 알림 등의 마케팅 정보를 이메일 또는 문자메시지로 발송할 수 있습니다.</p>
            </div>
          </div>

          <!-- actions -->
          <div class="actions">
            <button
              class="btn-next"
              :disabled="!isAllRequiredChecked"
              @click="goNext"
            >
              다음 단계
            </button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const agreements = ref({ required: false, privacy: false, marketing: false })
const allChecked = ref(false)

// 컴포넌트 마운트 시 세션값 적용
onMounted(() => {
  const saved = sessionStorage.getItem('signup-agreements')
  if (saved) {
    agreements.value = JSON.parse(saved)
    allChecked.value = agreements.value.required && agreements.value.privacy && agreements.value.marketing
  }
})

// 전체 필수 체크 여부
const isAllRequiredChecked = computed(() => agreements.value.required && agreements.value.privacy)

// agreements 변경 시 세션 저장
watch(
  agreements,
  (v) => {
    allChecked.value = v.required && v.privacy && v.marketing
    sessionStorage.setItem('signup-agreements', JSON.stringify(v))
  },
  { deep: true }
)

// 전체 동의 토글
function toggleAll() {
  const v = allChecked.value
  agreements.value.required = v
  agreements.value.privacy = v
  agreements.value.marketing = v
}

// 다음 단계 이동
function goNext() {
  if (isAllRequiredChecked.value) {
    router.push({ name: 'SignupIdentity' })
  }
}
</script>

<style scoped>
.signup-wrapper {
  display: flex;
  flex-direction: column;
  min-height: calc(100% + 40px);
  background: #f5f7fb;
  padding-top: 15px; 
  box-sizing: border-box;
  border-radius: 16px;
}
.signup-section {
  flex: 1;
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 16px 32px;
  overflow: auto;
}
.terms-card {
  display: grid;
  grid-template-columns: 360px 1px 1fr;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(20,20,20,.06);
  margin-top: 15px;
  overflow: hidden;
  align-items: stretch;
}

.with-divider .divider {
  background: #f0f0f0;
  align-self: stretch;
}

/* Left */
.left-section {
  padding: 28px 24px;
  background: linear-gradient(180deg, #f7fbff, #ffffff);
}
.left-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 8px;
}
.left-desc {
  color: #667085;
  margin: 0 0 24px;
  line-height: 1.5;
}
.select-all {
  padding: 14px;
  border: 1px solid #e6f1ff;
  background: #f5faff;
  border-radius: 12px;
}
.select-all .hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #667085;
}

/* Right */
.right-section {
  padding: 24px;
}
.terms-box + .terms-box {
  margin-top: 16px;
}
.terms-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.terms-header h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.req {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 999px;
  color: #0958d9;
  background: #e6f4ff;
  border: 1px solid #bae0ff;
}
.opt {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 999px;
  color: #4e5969;
  background: #f5f7fb;
  border: 1px solid #e5e7eb;
}

.terms-content {
  max-height: 220px;
  overflow: auto;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  color: #444;
}
.terms-content p { margin: 0 0 10px; }

.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.checkbox-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #1677ff;
}

.actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.btn-next {
  min-width: 160px;
  padding: 12px 18px;
  border: none;
  border-radius: 10px;
  background: #1677ff;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform .02s ease;
}
.btn-next:disabled {
  background: #bfbfbf;
  cursor: not-allowed;
}
.btn-next:active { transform: translateY(1px); }

@media (max-width: 960px) {
  .terms-card { grid-template-columns: 1fr; }
  .with-divider .divider { display: none; }
  .right-section { border-left: 0; }
}
</style>
