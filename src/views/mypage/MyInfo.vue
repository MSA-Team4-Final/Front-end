<template>
  <div class="home-system">
    <div class="mainpage-wrap">
      <a-card class="myinfo-card">
        <template #title>개인정보</template>

        <a-descriptions bordered :column="1" size="middle" class="info-descriptions">
          <a-descriptions-item label="이름">{{ profile.name || '-' }}</a-descriptions-item>
          <a-descriptions-item label="아이디">{{ profile.loginId || '-' }}</a-descriptions-item>

          <!-- 비밀번호 -->
          <a-descriptions-item label="비밀번호">
            <div class="item-flex">
              <span>••••••••</span>
              <a-button type="primary" size="small" @click="openPasswordChange">변경</a-button>
            </div>
          </a-descriptions-item>

          <!-- 이메일 -->
          <a-descriptions-item label="이메일">
            <div class="item-flex">
              <template v-if="!editMode">
                <span>{{ profile.email || '-' }}</span>
                <template v-if="profile.emailVerified">
                  <span class="verified-badge">인증 완료</span>
                </template>
                <template v-else>
                  <a-button type="primary" size="small" @click="openEmailVerify">인증</a-button>
                </template>
              </template>
              <template v-else>
                <a-input v-model:value="form.email" placeholder="user@example.com" />
              </template>
            </div>
            <div v-if="errors.email" class="error-text">{{ errors.email }}</div>
          </a-descriptions-item>

          <!-- 휴대폰 -->
          <a-descriptions-item label="휴대폰번호">
            <template v-if="!editMode">
              {{ formatPhone(profile.phone) || '-' }}
            </template>
            <template v-else>
              <a-input v-model:value="form.phone" placeholder="010-0000-0000" />
            </template>
            <div v-if="errors.phone" class="error-text">{{ errors.phone }}</div>
          </a-descriptions-item>

          <!-- 생년월일 -->
          <a-descriptions-item label="생년월일">
            <template v-if="!editMode">
              {{ formatDate(profile.birth || profile.birthdate) }}
            </template>
            <template v-else>
              <a-date-picker
                v-model:value="form.birth"
                value-format="YYYY-MM-DD"
                placeholder="YYYY-MM-DD"
                class="birth-picker"
              />
            </template>
            <div v-if="errors.birth" class="error-text">{{ errors.birth }}</div>
          </a-descriptions-item>
        </a-descriptions>

        <div class="edit-btn-wrap">
          <a-button class="service-btn" :loading="saving" @click="onMainButtonClick">
            {{ editMode ? '저장' : '변경' }}
          </a-button>
          <a-button v-if="editMode" class="cancel-btn" @click="cancelEdit">취소</a-button>
        </div>
      </a-card>

      <!-- 비밀번호 변경 모달 -->
        <a-modal
          v-model:open="passwordOpen"
          title="비밀번호 변경"
          :confirm-loading="passwordLoading"
            @ok="handlePasswordOk"
            :ok-text="'변경'"
            :cancel-text="'취소'"
          >
            <a-form ref="passwordFormRef" layout="vertical" :model="pwdForm">
              <a-form-item
                label="현재 비밀번호"
                name="currentPassword"
                :rules="[{ required: true, message: '현재 비밀번호를 입력하세요' }]"
              >
                <a-input-password v-model:value="pwdForm.currentPassword" autocomplete="current-password" />
              </a-form-item>

              <a-form-item
                label="새 비밀번호"
                name="newPassword"
                :rules="[{ required: true, message: '새 비밀번호를 입력하세요' },
                  { min: 6, max: 20, message: '비밀번호는 6~20자여야 합니다' },
                  { pattern: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/, 
                    message: '비밀번호는 영문, 숫자, 특수문자를 포함하여 8~16자 이내로 입력해주세요.' }
                ]"
              >
                <a-input-password v-model:value="pwdForm.newPassword" autocomplete="new-password" />
              </a-form-item>

              <a-form-item
                label="새 비밀번호 확인"
                name="newPasswordCheck"
                :rules="[
                  { required: true, message: '새 비밀번호 확인을 입력하세요' },
                  { validator: validateConfirm, trigger: 'change' }
                ]"
              >
                <a-input-password v-model:value="pwdForm.newPasswordCheck" autocomplete="new-password" />
              </a-form-item>
            </a-form>
          </a-modal>

      <!-- 이메일 인증 모달 -->
      <a-modal
        v-model:open="emailVerifyOpen"
        title="이메일 인증"
        :confirm-loading="emailVerifying"
        @ok="handleVerifySubmit"
        :ok-text="'확인'"
        :cancel-text="'취소'"
      >
        <p class="verify-desc">현재 이메일로 인증코드를 전송합니다.</p>
        <div class="verify-input-wrap">
          <a-input :value="profile.email" disabled />
          <a-button :loading="emailSending" :disabled="countdown>0" @click="sendVerifyCode">
            {{ countdown>0 ? countdown + '초' : '코드 전송' }}
          </a-button>
        </div>
        <a-input v-model:value="verifyCode" :maxlength="6" placeholder="인증코드 6자리" />
      </a-modal>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

/* 편집 상태 */
const editMode = ref(false)
const saving = ref(false)

/* 프로필/폼 상태 */
const profile = reactive({
  name: '', loginId: '', email: '', phone: '', birth: '', birthdate: '', emailVerified: false
})
const form = reactive({ email: '', phone: '', birth: '' })
const original = reactive({ email: '', phone: '', birth: '' })
const errors = reactive({ email: '', phone: '', birth: '' })

/* 이메일 인증 모달 상태 */
const emailVerifyOpen = ref(false)
const emailSending = ref(false)
const emailVerifying = ref(false)
const verifyCode = ref('')
const countdown = ref(0)
let timer = null

/* 비밀번호 변경 모달 상태 */
const passwordOpen = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref()
const pwdForm = reactive({
  currentPassword: '',
  newPassword: '',
  newPasswordCheck: ''
})

/* 새 비밀번호 확인 일치 */
const validateConfirm = async (_rule, value) => {
  if (!value || value !== pwdForm.newPassword) {
    return Promise.reject('새 비밀번호가 일치하지 않습니다.')
  }
  return Promise.resolve()
}

/* 휴대폰 번호 포맷 */
const formatPhone = (phone) => {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  return phone
}

/* 날짜 포맷 */
const formatDate = (v) => {
  if (!v) return '-'
  if (v instanceof Date && !isNaN(v)) return v.toISOString().split('T')[0]
  if (typeof v === 'number') {
    const d = new Date(v); return isNaN(d) ? '-' : d.toISOString().split('T')[0]
  }
  if (typeof v === 'string') {
    const s = v.trim()
    const mDash = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (mDash) return `${mDash[1]}-${mDash[2]}-${mDash[3]}`
    const mCompact = s.match(/^(\d{4})(\d{2})(\d{2})$/); if (mCompact) return `${mCompact[1]}-${mCompact[2]}-${mCompact[3]}`
    const t = Date.parse(s); if (!isNaN(t)) return new Date(t).toISOString().split('T')[0]
  }
  return '-'
}

/* 내 정보 조회 */
const fetchMyInfo = async () => {
  try {
    const { data } = await axios.get('/api/user/myinfo')
    Object.assign(profile, data)
    if (!profile.birth && data.birthdate) profile.birth = data.birthdate
  } catch (e) {
    console.error(e)
    message.error('내 정보를 불러오지 못했습니다')
  }
}
onMounted(fetchMyInfo)
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

/* 메인 버튼 */
const onMainButtonClick = async () => {
  if (!editMode.value) {
    errors.email = errors.phone = errors.birth = ''
    form.email = profile.email || ''
    form.phone = profile.phone || ''
    const birthStr = formatDate(profile.birth || profile.birthdate)
    form.birth = birthStr !== '-' ? birthStr : ''
    Object.assign(original, { email: form.email, phone: form.phone, birth: form.birth })
    editMode.value = true
    return
  }
  await saveChanges()
}

const validateForm = () => {
  let valid = true
  errors.email = errors.phone = errors.birth = ''

  // 이메일
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email || !emailPattern.test(form.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다'
    valid = false
  }

  // 휴대폰번호
  const phonePattern = /^01\d{8,9}$/
  const phoneDigits = form.phone?.replace(/\D/g, '') || ''
  if (!phonePattern.test(phoneDigits)) {
    errors.phone = '휴대폰 번호 형식이 올바르지 않습니다 (예: 01012345678)'
    valid = false
  }

  // 생년월일
  const birthDigits = form.birth?.replace(/\D/g, '') || ''
  if (!/^\d{8}$/.test(birthDigits)) {
    errors.birth = '생년월일 형식이 올바르지 않습니다 (예: 20000101)'
    valid = false
  } else {
    const year = Number(birthDigits.substr(0, 4))
    const month = Number(birthDigits.substr(4, 2))
    const day = Number(birthDigits.substr(6, 2))
    if (year > 2006 || year < 1900) {
      errors.birth = '출생년도는 1900년~2006년까지만 가능합니다'
      valid = false
    }
  }
  return valid
}

/* 저장 */
const saveChanges = async () => {
  if (!validateForm()) return

  const payload = {}
  const email = form.email?.trim?.() ?? form.email
  const phone = form.phone?.trim?.() ?? form.phone
  const birth = typeof form.birth === 'string' ? form.birth.trim() : form.birth

  if (email !== original.email) payload.email = email
  if (phone !== original.phone) payload.phone = phone
  if (birth !== original.birth) payload.birth = birth

  if (Object.keys(payload).length === 0) {
    message.info('변경 사항이 없습니다')
    editMode.value = false
    return
  }

  try {
    saving.value = true
    const { data } = await axios.post('/api/user/myinfo', payload)
    message.success('저장되었습니다')
    editMode.value = false
    if (data) Object.assign(profile, data)
    else await fetchMyInfo()
  } catch (e) {
    console.error(e)
    message.error(e?.response?.data?.message || '변경 중 오류가 발생했습니다')
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => {
  editMode.value = false
  errors.email = errors.phone = errors.birth = ''
}

/* 이메일 인증 모달 */
const openEmailVerify = () => {
  if (!profile.email) return message.warning('이메일이 없습니다')
  verifyCode.value = ''
  emailVerifyOpen.value = true
}
const startCountdown = (sec = 60) => {
  countdown.value = sec
  clearInterval(timer)
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) { clearInterval(timer); timer = null }
  }, 1000)
}
const sendVerifyCode = async () => {
  const email = (profile.email || '').trim()
  if (!email) return message.warning('이메일이 없습니다')
  if (emailSending.value || countdown.value > 0) return
  try {
    emailSending.value = true
    const ok = await authStore.sendVerificationCode(email, 'MY_INFO')
    if (ok) startCountdown(180)
  } catch (err) {
    const msg = err?.response?.data?.message || '인증 메일 전송 중 오류가 발생했습니다.'
    message.error(msg)
  } finally {
    emailSending.value = false
  }
}
const handleVerifySubmit = async () => {
  const email = (profile.email || '').trim()
  const code  = (verifyCode.value || '').trim()
  if (!email) return message.warning('이메일이 없습니다')
  if (!code)  return message.warning('인증코드를 입력하세요')
  if (emailVerifying.value) return
  try {
    emailVerifying.value = true
    const ok = await authStore.verifyEmailCode({ email, code, purpose: 'MY_INFO' })
    if (ok) {
      await authStore.refreshToken({ quiet: true })
      profile.emailVerified = true
      emailVerifyOpen.value = false
    }
  } catch (err) {
    const msg = err?.response?.data?.message || '인증 코드 확인에 실패했습니다.'
    message.error(msg)
    profile.emailVerified = false
  } finally {
    emailVerifying.value = false
  }
}

/* 비밀번호 변경: 모달 열기 */
const openPasswordChange = () => {
  pwdForm.currentPassword = ''
  pwdForm.newPassword = ''
  pwdForm.newPasswordCheck = ''
  passwordOpen.value = true
}
/* 비밀번호 변경: OK 핸들러 */
const handlePasswordOk = () => {
  passwordFormRef.value?.validate().then(changePassword).catch(() => {})
}
/* 비밀번호 변경 요청 */
const changePassword = async () => {
  try {
    passwordLoading.value = true
    await axios.post('/api/user/pw-change', {
      currentPassword: pwdForm.currentPassword,
      newPassword: pwdForm.newPassword,
      newPasswordCheck: pwdForm.newPasswordCheck
    })
    message.success('비밀번호가 변경되었습니다.')
    passwordOpen.value = false
  } catch (e) {
    const msg = e?.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.'
    message.error(msg)
  } finally {
    passwordLoading.value = false
  }
}
</script>

<style scoped>
.home-system {
  font-family: 'Noto Sans KR', Arial, sans-serif;
  background: #f4f8fb;
  min-height: 80vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mainpage-wrap {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.myinfo-card {
  border-radius: 28px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  max-width: 1000px;
  width: 100%;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.info-descriptions {
  width: 100%;
}
.item-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}
.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 20px;
  background: #e6ffed;
  color: #027a48;
  border: 1px solid #abefc6;
}
.error-text {
  color: #d9363e;
  margin-top: 4px;
  font-size: 12px;
}
.edit-btn-wrap {
  text-align: center;
  margin-top: 20px;
}
.service-btn {
  height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  background: #e0f7f4;
  color: #009490;
  box-shadow: 0 2px 6px rgba(0,148,144,0.08);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.06s;
}
.service-btn:hover { background: #009490; color: #fff; }
.service-btn:active { transform: translateY(1px); }
.cancel-btn { margin-left: 8px; }
.verify-desc { margin-bottom: 8px; color: #667085; }
.verify-input-wrap { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.birth-picker { width: 100%; }
</style>
