<template>
  <div class="signup-wrapper">
    <main class="signup-section">
      <div class="form-card with-divider">
        <!-- Left: 안내 -->
        <aside class="left-section">
          <h2 class="left-title">기본정보 입력</h2>
          <p class="left-desc">
            계정 생성을 위해 필수 정보를 입력하세요.<br />
            비밀번호는 8~16자, 영문/숫자/특수문자(@$!%*?&) 조합으로 입력해주세요.
          </p>
          <ul class="bullets">
            <li>이메일은 인증 완료 후 가입이 가능합니다.</li>
            <li>휴대폰은 숫자만 입력해주세요.</li>
          </ul>
        </aside>

        <div class="divider" aria-hidden="true"></div>

        <!-- Right: 입력 폼 -->
        <section class="right-section">
          <a-form
            ref="formRef"
            :model="signupForm"
            layout="vertical"
            :validate-trigger="['blur','submit']"
            @finish="handleSignup"
            autocomplete="off"
          >
            <div class="grid">
              <a-form-item
                label="아이디"
                name="id"
                :rules="[
                  { required: true, message: '아이디를 입력해주세요' },
                  { min: 4, max: 20, message: '아이디는 4~20자여야 합니다' },
                  { pattern: /^[a-zA-Z0-9]+$/, message: '영문과 숫자만 사용가능합니다' }
                ]"
              >
                <a-input v-model:value="signupForm.id" placeholder="예: korex_user01" allow-clear />
              </a-form-item>

              <a-form-item
                label="이름"
                name="name"
                :rules="[
                  { required: true, message: '이름을 입력해주세요' },
                  { min: 2, max: 10, message: '이름은 2~10자여야 합니다' }
                ]"
              >
                <a-input v-model:value="signupForm.name" placeholder="이름 입력" allow-clear />
              </a-form-item>

              <a-form-item
                label="비밀번호"
                name="password"
                :rules="[
                  { required: true, message: '비밀번호를 입력해주세요' },
                  { min: 6, max: 20, message: '비밀번호는 6~20자여야 합니다' },
                  { pattern: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/, 
                    message: '비밀번호는 영문, 숫자, 특수문자를 포함하여 8~16자 이내로 입력해주세요.' }
                ]"
              >
                <a-input-password
                  v-model:value="signupForm.password"
                  placeholder="비밀번호"
                  :maxlength="20"
                  autocomplete="new-password"
                >
                  <template #iconRender="{ visible }">
                    <EyeTwoTone v-if="visible" />
                    <EyeInvisibleOutlined v-else />
                  </template>
                </a-input-password>
              </a-form-item>

              <a-form-item
                label="비밀번호 확인"
                name="confirmPassword"
                :rules="[
                  { required: true, message: '비밀번호 확인을 입력해주세요' },
                  { validator: validatePasswordMatch }
                ]"
              >
                <a-input-password
                  v-model:value="signupForm.confirmPassword"
                  placeholder="비밀번호 확인"
                  :maxlength="20"
                  autocomplete="new-password"
                >
                  <template #iconRender="{ visible }">
                    <EyeTwoTone v-if="visible" />
                    <EyeInvisibleOutlined v-else />
                  </template>
                </a-input-password>
              </a-form-item>

              <a-form-item
                class="col-span-2"
                label="이메일"
                name="email"
                :rules="[
                  { required: true, message: '이메일을 입력해주세요' },
                  { type: 'email', message: '올바른 이메일 형식이 아닙니다' }
                ]"
              >
                <div class="input-with-button">
                  <input
                    v-model="signupForm.email"
                    :disabled="emailVerified"
                    type="email"
                    class="input-field"
                    placeholder="user@example.com"
                  />
                  <button
                    type="button"
                    class="input-btn"
                    :disabled="sending || resendCooldown > 0 || emailVerified"
                    @click="sendEmailVerification"
                  >
                    {{ resendCooldown > 0 ? `재전송(${resendCooldown}s)` : (emailVerified ? '인증완료' : '인증요청') }}
                  </button>
                </div>
              </a-form-item>

              <a-form-item
                class="col-span-2"
                label="이메일 인증 코드"
                name="emailCode"
                :rules="[{ required: true, message: '이메일 인증코드를 입력해주세요' }]"
              >
                <div class="input-with-button">
                  <input
                    v-model="signupForm.emailCode"
                    :disabled="emailVerified"
                    class="input-field"
                    placeholder="6자리 인증 코드"
                    maxlength="6"
                    inputmode="numeric"
                  />
                  <button
                    type="button"
                    class="input-btn"
                    :disabled="verifying || !signupForm.emailCode || emailVerified"
                    @click="verifyEmailCodeHandler"
                  >
                    {{ emailVerified ? '인증완료' : (verifying ? '확인중...' : '인증 확인') }}
                  </button>
                </div>
              </a-form-item>

              <a-form-item
                label="휴대폰 번호"
                name="phone"
                :rules="[
                  { required: true, message: '휴대폰 번호를 입력해주세요' },
                  { pattern: /^01[0-9]-\d{3,4}-\d{4}$/, message: '휴대폰 번호 형식이 올바르지 않습니다' }
                ]"
              >
                <a-input
                  v-model:value="signupForm.phone"
                  placeholder="010-0000-0000"
                  :maxlength="13"
                  @input="formatPhone"
                />
              </a-form-item>

              <a-form-item
                label="생년월일"
                name="birthdate"
                :rules="[
                  { required: true, message: '생년월일을 입력해주세요' },
                  { pattern: /^\d{4}-\d{2}-\d{2}$/, message: '생년월일은 YYYY-MM-DD 형식이어야 합니다' }
                ]"
              >
                <a-date-picker
                  v-model:value="signupForm.birthdate"
                  value-format="YYYY-MM-DD"
                  placeholder="YYYY-MM-DD"
                  class="birth-picker"
                  style="width: 100%;"
                  :disabled-date="disableFutureBirthdates"
                />
              </a-form-item>
            </div>

            <div class="actions">
              <button type="button" class="btn-prev" @click="goPrev">이전</button>
              <button type="button" class="btn-next" @click="handleNext">다음</button>
            </div>
          </a-form>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useSignupStore } from '@/stores/signup'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()
const signupStore = useSignupStore()

const signupForm = ref({
  id: '',
  password: '',
  confirmPassword: '',
  email: '',
  emailCode: '',
  name: '',
  phone: '',
  birthdate: ''
})

const formRef = ref()
const emailVerified = ref(false)

const sending = ref(false)
const verifying = ref(false)
const resendCooldown = ref(0)
let cooldownTimer = null
const lastRequestedEmail = ref(null)

const startCooldown = (sec = 60) => {
  clearInterval(cooldownTimer)
  resendCooldown.value = sec
  cooldownTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

function goPrev() {
  router.push('/signup/identity')
}

onMounted(() => {
  if (signupStore.signupData?.name) {
    signupForm.value.name = signupStore.signupData.name
  }

  const birth = signupStore.signupData.birth
  if (birth && /^\d{6}$/.test(birth)) {
    const yearPrefix = Number(birth.slice(0,2)) <= 25 ? '20' : '19'
    const fullBirth = yearPrefix + birth // YYYYMMDD 형태
    const dayjsBirth = dayjs(fullBirth, 'YYYYMMDD')
    if (dayjsBirth.isValid()) {
      signupForm.value.birthdate = dayjsBirth.format('YYYY-MM-DD')
    }
  }
})

// 이메일 인증 코드 발송
async function sendEmailVerification() {
  const email = (signupForm.value.email || '').trim()
  if (!email) return message.warning('이메일을 먼저 입력해주세요.')
  if (emailVerified.value) return message.info('이미 이메일 인증이 완료되었습니다.')
  if (sending.value || resendCooldown.value > 0) return

  try {
    sending.value = true
    const ok = await authStore.sendVerificationCode(email, 'SIGN_UP')
    if (ok) {
      lastRequestedEmail.value = email
      startCooldown(60)
    }
  } catch (err) {
    const msg = err?.response?.data?.message || '인증 메일 전송 중 오류가 발생했습니다.'
    message.error(msg)
  } finally {
    sending.value = false
  }
}

// 이메일 인증 코드 확인
async function verifyEmailCodeHandler() {
  const email = (signupForm.value.email || '').trim()
  const code  = (signupForm.value.emailCode || '').trim()

  if (!email) return message.warning('이메일을 먼저 입력해주세요.')
  if (!code) return message.warning('인증 코드를 입력해주세요.')
  if (emailVerified.value) return message.info('이미 이메일 인증이 완료되었습니다.')
  if (verifying.value) return

  if (lastRequestedEmail.value && lastRequestedEmail.value !== email) {
    return message.warning('코드를 요청한 이메일과 현재 이메일이 다릅니다. 다시 전송해주세요.')
  }

  try {
    verifying.value = true
    const ok = await authStore.verifyEmailCode({ email, code, purpose: 'SIGN_UP' })
    if (ok) emailVerified.value = true
  } catch (err) {
    const msg = err?.response?.data?.message || '인증 코드 확인에 실패했습니다.'
    message.error(msg)
    emailVerified.value = false
  } finally {
    verifying.value = false
  }
}

// 비밀번호 확인 유효성
const validatePasswordMatch = async (_rule, value) => {
  if (value !== signupForm.value.password) return Promise.reject('비밀번호가 일치하지 않습니다.')
  return Promise.resolve()
}

function formatPhone(e) {
  const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 11)
  let out = digits
  if (digits.length >= 3 && digits.length <= 7) {
    out = digits.slice(0, 3) + '-' + digits.slice(3)
  } else if (digits.length > 7) {
    out = digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7)
  }
  signupForm.value.phone = out
}

const disableFutureBirthdates = (current) => {
  const maxDate = dayjs('2006-12-31')
  return current && current.isAfter(maxDate, 'day')
}

// 회원가입 처리
const handleSignup = async () => {
  if (!emailVerified.value) return message.warning('이메일 인증을 완료해주세요.')

  const payload = {
    loginId: signupForm.value.id,
    password: signupForm.value.password,
    passwordCheck: signupForm.value.confirmPassword,
    name: signupForm.value.name,
    email: signupForm.value.email,
    emailCode: signupForm.value.emailCode,
    phone: (signupForm.value.phone || '').replace(/\D/g, ''),
    birth: (signupForm.value.birthdate || '').replace(/\D/g, '')
  }

  try {
    const success = await authStore.join(payload)
    if (success) {
      message.success('가입이 완료되었습니다. 로그인해주세요.')
      router.push('/login')
    }
  } catch (err) {
    const msg = err?.response?.data?.message || '회원가입 중 오류가 발생했습니다.'
    message.error(msg)
  }
}

const handleNext = () => {
  if (!emailVerified.value) return message.warning('이메일 인증을 완료해주세요.')

  signupStore.setSignupData({
    loginId: signupForm.value.id,
    password: signupForm.value.password,
    passwordCheck: signupForm.value.confirmPassword,
    name: signupForm.value.name,
    email: signupForm.value.email,
    emailCode: signupForm.value.emailCode,
    phone: signupForm.value.phone.replace(/\D/g, ''),
    birth: signupForm.value.birthdate.replace(/\D/g, '')
  })

  router.push('/signup/account')
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
  box-shadow: 0 8px 30px rgba(20,20,20,.06);
  overflow: hidden;
}

.with-divider .divider { background: #f0f0f0; }

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
.col-span-2 { 
  grid-column: span 2; 
}

.input-with-button { 
  display: flex; 
  gap: 8px; 
}

.input-field {
  flex: 1; 
  padding: 10px 12px; 
  border: 1px solid #ddd; 
  border-radius: 10px; 
  font-size: 14px;
}

.input-btn {
  padding: 10px 14px; 
  border-radius: 10px; 
  border: none; 
  background: #1677ff; 
  color: #fff; 
  font-weight: 600; 
  cursor: pointer;
}

.input-btn:disabled { 
  background: #bfbfbf; 
  cursor: not-allowed; 
}

.actions { 
  margin-top: 4px; 
  display: flex; 
  justify-content: flex-end; 
  gap: 8px; 
}

.btn-prev {
  min-width: 120px; 
  padding: 12px 16px; 
  border-radius: 10px; 
  border: 1px solid #e5e7eb; 
  background: #fff; 
  color: #344054; 
  cursor: pointer;
}

.btn-next {
  min-width: 160px; 
  padding: 12px 18px; 
  border-radius: 10px; 
  border: none; 
  background: #1677ff; 
  color: #fff; 
  font-weight: 600; 
  cursor: pointer;
}

.btn-next:disabled { 
  background: #bfbfbf; 
  cursor: not-allowed; 
}

/* 반응형 */
@media (max-width: 960px) {
  .form-card { grid-template-columns: 1fr; }
  .with-divider .divider { display: none; }
  .grid { grid-template-columns: 1fr; }
}
</style>
