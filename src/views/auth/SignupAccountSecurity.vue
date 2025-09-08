<template>
  <div class="signup-wrapper">
    <main class="signup-section">
      <div class="password-card">
        <h2 class="step-title">계좌 비밀번호 설정</h2>
        <p class="step-description">
          계좌 비밀번호는 숫자 4자리로 설정해주세요.
        </p>

        <a-form
          layout="vertical"
          :model="form"
          :rules="rules"
          ref="formRef"
          @finish="handleFinalSignup"
          class="password-form"
        >
          <!-- 계좌 비밀번호 -->
          <a-form-item label="계좌 비밀번호" name="transactionPassword">
            <a-input-password
              v-model:value="form.transactionPassword"
              placeholder="숫자 4자리 입력"
              :maxlength="4"
              @input="allowOnlyNumbers"
            />
          </a-form-item>

          <!-- 비밀번호 확인 -->
          <a-form-item label="비밀번호 확인" name="transactionPasswordCheck">
            <a-input-password
              v-model:value="form.transactionPasswordCheck"
              placeholder="숫자 4자리 다시 입력"
              :maxlength="4"
              @input="allowOnlyNumbers"
            />
          </a-form-item>

          <a-form-item>
            <a-button type="primary" html-type="submit" block>회원가입</a-button>
          </a-form-item>
        </a-form>
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

const transactionPassword = ref('')
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

const handleFinalSignup = async () => {
  if (!form.transactionPassword) return message.warning('계좌 비밀번호를 입력해주세요.')

  // 스토어에 계좌 비밀번호 저장
  signupStore.setSignupData({ 
    transactionPassword: form.transactionPassword,
    transactionPasswordCheck: form.transactionPasswordCheck
 })

  const payload = {
    ...signupStore.signupData
  }

  console.log('final signup payload:', payload)
  try {
    const success = await authStore.join(payload)
    if (success) {
      message.success('회원가입이 완료되었습니다. 로그인해주세요.')
      signupStore.clearSignupData()
      router.push('/login')
    }
  } catch (err) {
    const msg = err?.response?.data?.message || '회원가입 중 오류가 발생했습니다.'
    message.error(msg)
  }
}

</script>

<style scoped>
.signup-wrapper {
  min-height: calc(100% + 40px);
  display: flex;
  flex-direction: column;
  background: #f5f7fb;
  box-sizing: border-box;
  border-radius: 16px;
}

.signup-section {
  flex: 1;
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 16px 32px;
  display: flex;
  justify-content: center;
}

.password-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(20, 20, 20, 0.06);
  padding: 32px;
  margin-top: 20px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.step-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.password-form a-form-item {
  margin-bottom: 16px;
}

.password-form a-button {
  border-radius: 10px;
  padding: 12px 0;
  font-weight: 600;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
