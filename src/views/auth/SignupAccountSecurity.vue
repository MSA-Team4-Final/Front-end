<template>
  <div class="signup-wrapper">
    <main class="signup-section">
      <div class="form-card with-divider">
        <!-- Left: 안내 -->
        <aside class="left-section">
          <h2 class="left-title">계좌 비밀번호 설정</h2>
          <p class="left-desc">
            계좌 비밀번호는 숫자 4자리로 설정해주세요.<br />
            금융 거래 시 필요한 중요한 정보이니<br />
            타인과 공유하지 마세요.
          </p>
          <ul class="bullets">
            <li>4자리 숫자만 입력할 수 있습니다.</li>
            <li>반복/연속된 숫자, 생년월일, 휴대폰 번호는 입력할 수 없습니다.</li>
            <li>비밀번호 확인 입력 시 일치해야 합니다.</li>
          </ul>
        </aside>

        <div class="divider" aria-hidden="true"></div>

        <!-- Right: 입력 폼 -->
        <section class="right-section">
          <a-form
            layout="vertical"
            :model="form"
            :rules="rules"
            ref="formRef"
            @finish="handleFinalSignup"
            class="password-form"
          >
            <div class="grid">
              <a-form-item
                label="계좌 비밀번호"
                name="transactionPassword"
                :rules="rules.transactionPassword"
              >
                <a-input-password
                  v-model:value="form.transactionPassword"
                  placeholder="숫자 4자리 입력"
                  :maxlength="4"
                  @input="allowOnlyNumbers"
                />
              </a-form-item>

              <a-form-item
                label="비밀번호 확인"
                name="transactionPasswordCheck"
                :rules="rules.transactionPasswordCheck"
              >
                <a-input-password
                  v-model:value="form.transactionPasswordCheck"
                  placeholder="숫자 4자리 다시 입력"
                  :maxlength="4"
                  @input="allowOnlyNumbers"
                />
              </a-form-item>
            </div>

            <div class="actions">
              <button type="button" class="btn-prev" @click="goPrev">이전</button>
              <a-button type="primary" html-type="submit" class="btn-next">
                회원가입
              </a-button>
            </div>
          </a-form>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSignupStore } from '@/stores/signup'

const signupStore = useSignupStore()
const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const form = reactive({
  transactionPassword: '',
  transactionPasswordCheck: '',
})

const rules = {
  transactionPassword: [
    { required: true, message: '계좌 비밀번호를 입력해주세요.' },
    { pattern: /^\d{4}$/, message: '숫자 4자리로 입력해주세요.' },
  ],
  transactionPasswordCheck: [
    { required: true, message: '비밀번호 확인을 입력해주세요.' },
    {
      validator: (_, value) => {
        if (value !== form.transactionPassword) {
          return Promise.reject('비밀번호가 일치하지 않습니다.')
        }
        return Promise.resolve()
      },
    },
  ],
}

const allowOnlyNumbers = (e) => {
  e.target.value = e.target.value.replace(/\D/g, '')
  if (e.target.value.length > 4) e.target.value = e.target.value.slice(0, 4)
}

const goPrev = () => {
  router.push('/signup/info')
}

const handleFinalSignup = async () => {
  if (!form.transactionPassword)
    return message.warning('계좌 비밀번호를 입력해주세요.')

  signupStore.setSignupData({
    transactionPassword: form.transactionPassword,
    transactionPasswordCheck: form.transactionPasswordCheck,
  })

  const payload = { ...signupStore.signupData }

  try {
    const success = await authStore.join(payload)
    if (success) {
      message.success('회원가입이 완료되었습니다. 로그인해주세요.')
      signupStore.clearSignupData()
      router.push('/login')
    }
  } catch (err) {
    const msg =
      err?.response?.data?.message || '회원가입 중 오류가 발생했습니다.'
    message.error(msg)
  }
}
</script>

<style scoped>
.signup-wrapper {
  border-radius: 16px;
  min-height: calc(100% + 40px);
  background: #f5f7fb;
}

.signup-section {
  max-width: 1040px;
  margin: 12px auto 32px;
  padding: 0 16px;
}

.form-card {
  display: grid;
  grid-template-columns: 360px 1px 1fr;
  margin-top: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(20, 20, 20, 0.06);
  overflow: hidden;
}

.with-divider .divider {
  background: #f0f0f0;
}

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
  margin: 0 0 16px;
  line-height: 1.5;
}

.bullets {
  margin: 0;
  padding-left: 18px;
  color: #667085;
}

.bullets li {
  margin: 6px 0;
}

.right-section {
  padding: 24px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.btn-prev,
.btn-next {
  min-width: 140px;
  height: 44px; 
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-weight: 600;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  border: none;
  transition: transform 0.02s ease;
}

.btn-prev {
  background: #f0f0f0;
  color: #333;
}

.btn-next {
  background: #1677ff;
  color: #fff;
}

.btn-next:disabled {
  background: #bfbfbf;
  cursor: not-allowed;
}

.btn-prev:active,
.btn-next:active {
  transform: translateY(1px);
}

/* 반응형 */
@media (max-width: 960px) {
  .form-card {
    grid-template-columns: 1fr;
  }
  .with-divider .divider {
    display: none;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
