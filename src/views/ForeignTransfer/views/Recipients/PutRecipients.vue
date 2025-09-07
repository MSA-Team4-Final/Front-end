<template>
  <section class="recipient-form">
    <h1>수정</h1>

    <form @submit.prevent="onSubmit">
      <!-- 이름 -->
      <div class="form-group">
        <label for="name">받는 분 이름</label>
        <input id="name" v-model.trim="form.name" type="text" placeholder="예: 홍길동" required />
      </div>

      <!-- 통화 -->
      <div class="form-group">
        <label for="selectedCurrency">송금할 통화</label>
        <select id="selectedCurrency" v-model="form.selectedCurrency" required>
          <option value="" disabled>통화를 선택하세요</option>
          <option v-for="c in currencyOptions" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <!-- 은행명 -->
      <div class="form-group">
        <label for="bankName">받는 분 은행명</label>
        <select id="bankName" v-model="form.bankName" required>
          <option value="" disabled>은행을 선택하세요</option>
          <option v-for="b in bankOptions" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>

      <!-- 계좌번호 -->
      <div class="form-group">
        <label for="accountNumber">받는 분 계좌번호</label>
        <input
            id="accountNumber"
            v-model.trim="form.accountNumber"
            type="text"
            placeholder="예: 123-123456-12"
            required
            @input="formatAccountNumber"
        />
      </div>


      <!-- 연락처 -->
      <div class="form-group">
        <label for="phoneNumber">받는 분 연락처</label>
        <div style="display: flex; gap: 0.5rem;">
          <select v-model="form.countryCode" required>
            <option value="" disabled>국가 선택</option>
            <option v-for="c in countryOptions" :key="c.code" :value="c.code">
              {{ c.flag }} {{ c.name }} ({{ c.phonePrefix }})
            </option>
          </select>
          <input
              id="phoneNumber"
              v-model.trim="form.localPhoneNumber"
              type="tel"
              placeholder="예: 123456789"
              required
              style="flex: 1"
          />
        </div>
      </div>

      <!-- 이메일 -->
      <div class="form-group">
        <label for="email">받는 분 이메일 주소</label>
        <input id="email" v-model.trim="form.email" type="email" placeholder="example@domain.com" />
      </div>

      <!-- 거주지 -->
      <div class="form-group">
        <label for="country">받는 분 거주지</label>
        <select id="country" v-model="form.country" required>
          <option value="" disabled>국가를 선택하세요</option>
          <option v-for="c in countryOptions" :key="c.code" :value="c.name">
            {{ c.flag }} {{ c.name }}
          </option>
        </select>
      </div>

      <!-- 영문 주소 -->
      <div class="form-group">
        <label for="engAddress">받는 분 영문 주소</label>
        <textarea
            id="engAddress"
            v-model.trim="form.engAddress"
            rows="3"
            placeholder="예: 221B Baker Street, Marylebone, London NW1 6XE"
            required
        ></textarea>
      </div>

      <!-- 버튼 -->
      <div class="form-actions">
        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '수정 중...' : '수정' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const recipientId = route.params.id
const token = localStorage.getItem('accessToken')

const form = reactive({
  name: '',
  selectedCurrency: '',
  bankName: '',
  accountNumber: '',
  countryCode: '',
  localPhoneNumber: '',
  email: '',
  country: '',
  engAddress: '',
  relationRecipient: ''
})

const currencyOptions = ['USD', 'EUR', 'JPY', 'KRW']
const bankOptions = ['KOREX BANK','BANK OF AMERICA', 'CITIBANK']
const countryOptions = [
  { code: 'US', name: 'USA', flag: '🇺🇸', phonePrefix: '+1' },
  { code: 'JP', name: 'JAPAN', flag: '🇯🇵', phonePrefix: '+81' },
  { code: 'KR', name: 'KOREA', flag: '🇰🇷', phonePrefix: '+82' }
]

const isSubmitting = ref(false)

// --------------------
// 기존 값 불러오기
// --------------------
onMounted(async () => {
  try {
    const res = await fetch(`/api/foreign-transfer/recipients/${recipientId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!res.ok) throw new Error('수취인 조회 실패')
    const data = await res.json()

    form.name = data.name || ''
    // currencyCode로 불러오기
    form.selectedCurrency = currencyOptions.includes(data.currencyCode) ? data.currencyCode : ''
    form.bankName = bankOptions.includes(data.bankName) ? data.bankName : ''
    form.accountNumber = data.accountNumber || ''
    form.email = data.email || ''
    form.country = data.country || ''
    form.engAddress = data.engAddress || ''
    form.relationRecipient = data.relationRecipient || ''

    // 전화번호 및 국가코드 처리
    if (data.phoneNumber) {
      const matchedCountry = countryOptions.find(c => data.phoneNumber.startsWith(c.phonePrefix))
      if (matchedCountry) {
        form.countryCode = matchedCountry.code
        form.localPhoneNumber = data.phoneNumber.replace(matchedCountry.phonePrefix, '').replace(/\D/g, '')
      } else {
        form.localPhoneNumber = data.phoneNumber.replace(/\D/g, '')
      }
    }

    if (!form.countryCode && data.country) {
      const matchedCountry = countryOptions.find(c => c.name === data.country)
      if (matchedCountry) form.countryCode = matchedCountry.code
    }

  } catch (e) {
    alert(e?.message || '데이터를 불러오는 중 오류가 발생했습니다.')
    console.error('Error fetching recipient:', e)
  }
})

// --------------------
// 계좌번호 자동 하이픈
// --------------------
function formatAccountNumber() {
  let numbers = form.accountNumber.replace(/\D/g, '')
  if (numbers.length > 3 && numbers.length <= 9) {
    numbers = numbers.replace(/^(\d{3})(\d+)/, '$1-$2')
  } else if (numbers.length > 9) {
    numbers = numbers.replace(/^(\d{3})(\d{6})(\d+)/, '$1-$2-$3')
  }
  form.accountNumber = numbers
}

// --------------------
// 수정 전송
// --------------------
async function onSubmit() {
  isSubmitting.value = true

  const country = countryOptions.find(c => c.code === form.countryCode)
  const countryNumber = country ? country.phonePrefix.replace('+', '') : ''
  const phoneNumber = form.localPhoneNumber.replace(/\D/g, '')

  const payload = {
    name: form.name,
    bankName: form.bankName,
    accountNumber: form.accountNumber,
    countryNumber: countryNumber,
    phoneNumber: phoneNumber,
    country: form.country,
    email: form.email,
    relationRecipient: form.relationRecipient || '기타',
    currencyCode: form.selectedCurrency, // ★ currencyCode로 전송
    engAddress: form.engAddress
  }

  try {
    const res = await fetch(`/api/foreign-transfer/recipients/${recipientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) throw new Error('수정 실패')

    alert('수취인이 수정되었습니다.')
    router.push('/recipients')
  } catch (e) {
    alert('오류가 발생했습니다: ' + e.message)
    console.error('Error updating recipient:', e)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.recipient-form {
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}
.recipient-form h1 {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #008681;
  text-align: center;
}
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}
label {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #333;
}
input, select, textarea {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
  font-size: 0.95rem;
  background-color: #ffffff;
  transition: all 0.2s ease;
}
input:focus, select:focus, textarea:focus {
  border-color: #00908C;
  outline: none;
}
textarea {
  resize: none;
}
.form-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
button {
  background: #009b99;
  color: white;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s ease;
}
button:hover {
  background: #008681;
}
</style>
