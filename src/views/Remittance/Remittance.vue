<template>
  <div class="main-content">
    <!-- 1단계: 초기 화면 -->
    <div v-if="currentStep === 1" class="step-container step-1">
      <div class="step-content">
        <h2 class="page-title">친구 송금</h2>
        <div class="welcome-card">
          <h3>간편하고 빠른 친구 송금</h3>
          <p>원하는 통화로 직접 송금하세요</p>
          <button class="send-button" @click="nextStep">
            보내기
          </button>
        </div>
      </div>
    </div>

    <!-- 2단계: 통화 선택 (단일 선택) -->
    <div v-if="currentStep === 2" class="step-container">
      <div class="step-content">
        <div class="step-header">
          <button class="back-btn" @click="prevStep">←</button>
          <h2 class="page-title">송금할 통화 선택</h2>
        </div>

        <!-- 내 잔액 표시 -->
        <div class="balance-section">
          <h3>내 잔액</h3>
          <!-- 로딩 상태 -->
          <div v-if="isLoadingBalances" class="loading-message">
            잔액 조회 중...
          </div>

          <!-- 에러 상태 -->
          <div v-else-if="balanceError" class="error-message">
            {{ balanceError }}
            <button @click="fetchUserBalances" class="retry-btn">다시 시도</button>
          </div>

          <!-- 잔액이 없을 때 -->
          <div v-else-if="availableBalances.length === 0" class="no-balance-message">
            <p>송금 가능한 잔액이 없습니다.</p>
            <p>먼저 입금을 진행해주세요.</p>
          </div>

          <!-- 잔액 표시 (0보다 큰 잔액만) -->
          <div v-else class="balance-grid">
            <div v-for="balance in availableBalances" :key="balance.code" class="balance-item">
              <span class="balance-currency">{{ balance.code }}</span>
              <span class="balance-amount">{{ balance.amount }}</span>
            </div>
          </div>
        </div>

        <!-- 통화 선택 -->
        <div class="currency-section">
          <h3>어떤 통화로 송금하시겠어요?</h3>
          <p class="section-description">선택한 통화로 바로 송금됩니다.</p>

          <!-- 통화 로딩 상태 -->
          <div v-if="isLoadingCurrencies" class="loading-message">
            지원 통화 조회 중...
          </div>

          <!-- 통화 에러 상태 -->
          <div v-else-if="currencyError" class="error-message">
            {{ currencyError }}
            <button @click="fetchSupportedCurrencies" class="retry-btn">다시 시도</button>
          </div>

          <!-- 송금 가능한 통화가 없을 때 -->
          <div v-else-if="availableFromCurrencies.length === 0" class="no-currencies-message">
            <p>송금 가능한 통화가 없습니다.</p>
            <p>먼저 입금하여 잔액을 확보해주세요.</p>
          </div>

          <!-- 통화 선택 그리드 (잔액이 있는 통화만) -->
          <div v-else class="currency-grid">
            <div v-for="currency in availableFromCurrencies" :key="currency.code" class="currency-card"
              :class="{ active: selectedCurrency === currency.code }" @click="selectCurrency(currency.code)">
              <div class="currency-info">
                <div class="currency-code">{{ currency.code }}</div>
                <div class="currency-name">{{ currency.name }}</div>
                <div v-if="currency.countryName" class="currency-country">{{ currency.countryName }}</div>
                <div class="currency-balance">잔액: {{ getMyBalance(currency.code) }}</div>
              </div>
              <div class="direct-transfer-badge">
                직접 송금 (수수료 무료)
              </div>
            </div>
          </div>
        </div>

        <!-- 선택된 통화 요약 -->
        <div v-if="selectedCurrency" class="selection-summary">
          <div class="summary-row">
            <span>{{ selectedCurrency }}</span>
            <div class="arrow">→</div>
            <span>{{ selectedCurrency }}</span>
          </div>
          <div class="summary-info">
            <span class="direct-transfer">
              {{ selectedCurrency }} 직접 송금 (환전 수수료 없음)
            </span>
          </div>
        </div>
      </div>

      <div class="step-actions">
        <button class="continue-btn" :disabled="!selectedCurrency || availableFromCurrencies.length === 0" @click="nextStep">
          계속
        </button>
      </div>
    </div>

    <!-- 3단계: 수취인 정보 입력 -->
    <div v-if="currentStep === 3" class="step-container">
      <div class="step-content">
        <div class="step-header">
          <button class="back-btn" @click="prevStep">←</button>
          <h2 class="page-title">수취인 정보</h2>
        </div>

        <div class="form-container">
          <!-- 1단계: 이름 입력 -->
          <div class="form-group">
            <label class="form-label">누구에게 보낼까요?</label>
            <div class="input-with-confirm">
              <input v-model="recipientName" 
              type="text" 
              class="form-input" 
              placeholder="받는 분 이름을 입력하세요"
              @input="filterNameInput" 
              @keyup.enter="verifyRecipientName" 
              :disabled="nameConfirmed">
              <button v-if="recipientName.trim() && !nameConfirmed" class="confirm-btn" @click="verifyRecipientName">
                확인
              </button>
              <div v-if="nameConfirmed" class="confirmed-mark">✓</div>
            </div>
          </div>

          <!-- 2단계: 전화번호 입력 -->
          <transition name="slide-down">
            <div v-if="nameConfirmed" class="form-group">
              <label class="form-label">휴대폰 번호</label>
              <div class="input-with-confirm">
                <input v-model="recipientPhone" 
                type="tel" class="form-input" 
                placeholder="010-0000-0000"
                @input="filterPhoneInput" 
                @keydown.space.prevent="" 
                @keyup.enter="verifyRecipientPhone"
                :disabled="phoneConfirmed" 
                ref="phoneInput">
                <button v-if="recipientPhone.trim() && !phoneConfirmed" class="confirm-btn"
                  @click="verifyRecipientPhone">
                  확인
                </button>
                <div v-if="phoneConfirmed" class="confirmed-mark">✓</div>
              </div>
            </div>
          </transition>

          <!-- 통화 선택 요약 -->
          <transition name="slide-down">
            <div v-if="nameConfirmed && phoneConfirmed" class="selected-currency-info">
              <div class="currency-flow">
                <div class="currency-badge">{{ selectedCurrency }}</div>
                <span class="arrow">→</span>
                <div class="currency-badge">{{ selectedCurrency }}</div>
              </div>
              <span>{{ selectedCurrency }} 직접 송금</span>
            </div>
          </transition>
        </div>
      </div>

      <div class="step-actions">
        <button class="continue-btn" :disabled="!nameConfirmed || !phoneConfirmed" @click="nextStep">
          계속
        </button>
      </div>
    </div>

    <!-- 4단계: 송금 금액 입력 -->
    <div v-if="currentStep === 4" class="step-container">
      <div class="step-content">
        <div class="step-header">
          <button class="back-btn" @click="prevStep">←</button>
          <h2 class="page-title">송금 금액</h2>
        </div>

        <div class="amount-container">
          <div class="recipient-summary">
            <div class="recipient-info">
              <span class="recipient-name">수취인 : {{ recipientName }}</span>
              <span class="recipient-phone">휴대폰 번호 : {{ recipientPhone }}</span>
            </div>
            <div class="currency-flow">
              <div class="currency-badge">{{ selectedCurrency }}</div>
              <span class="arrow">→</span>
              <div class="currency-badge">{{ selectedCurrency }}</div>
            </div>
          </div>

          <div class="amount-input-section">
            <label class="form-label">보낼 금액 ({{ selectedCurrency }})</label>
            <div class="amount-input-container">
              <input v-model="formattedSendAmount" 
                     type="text" 
                     class="amount-input" 
                     placeholder="0"
                     @input="handleAmountInput"
                     @focus="handleAmountFocus"
                     @blur="handleAmountBlur">
              <span class="currency-symbol">{{ selectedCurrency }}</span>
            </div>
            <div class="balance-info">
              사용 가능: {{ getMyBalance(selectedCurrency) }} {{ selectedCurrency }}
            </div>
          </div>

          <div class="conversion-info" v-if="sendAmount && sendAmount > 0">
            <div class="conversion-row">
              <span>받을 금액</span>
              <span>{{ calculateReceiveAmount() }} {{ selectedCurrency }}</span>
            </div>

            <div class="conversion-row">
              <span>수수료 (무료)</span>
              <span>{{ calculateFee() }} {{ selectedCurrency }}</span>
            </div>

            <div class="conversion-row total">
              <span>차감될 금액</span>
              <span>{{ calculateTotal() }} {{ selectedCurrency }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="step-actions">
        <button class="continue-btn"
          :disabled="!sendAmount || sendAmount <= 0 || sendAmount > getMyBalanceNumber(selectedCurrency)"
          @click="showTransferModal">
          계속
        </button>
      </div>
    </div>

    <!-- 5단계: 송금 완료 -->
    <div v-if="currentStep === 5" class="step-container step-complete">
      <div class="step-content">
        <div class="completion-container">
          <div class="success-icon">✓</div>
          <h2 class="completion-title">송금이 완료되었습니다!</h2>

          <div class="completion-details">
            <div class="detail-item">
              <span class="label">거래번호</span>
              <span class="value">{{ transferResult?.transactionId }}</span>
            </div>
            <div class="detail-item">
              <span class="label">수취인</span>
              <span class="value">{{ recipientName }}</span>
            </div>
            <div class="detail-item">
              <span class="label">송금 방식</span>
              <span class="value">{{ getTransferTypeDescription() }}</span>
            </div>
            <div class="detail-item">
              <span class="label">송금 금액</span>
              <span class="value">{{ calculateReceiveAmount() }} {{ selectedCurrency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">처리 시간</span>
              <span class="value">{{ new Date().toLocaleString() }}</span>
            </div>
          </div>

          <div class="completion-message">
            <p>{{ recipientName }}님에게 송금이 성공적으로 완료되었습니다.</p>
            <p>거래 내역은 거래 내역 페이지에서 확인하실 수 있습니다.</p>
          </div>
        </div>
      </div>

      <div class="step-actions">
        <div class="completion-buttons">
          <button class="secondary-btn" @click="$router.push('/remittance/list')">
            거래 내역 보기
          </button>
          <button class="primary-btn" @click="startNewTransfer">
            새 송금하기
          </button>
        </div>
      </div>
    </div>

    <!-- 송금 확인 모달 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>송금 정보 확인</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <!-- 송금 요약 정보 -->
          <div class="transfer-summary">
            <div class="summary-details">
              <div class="summary-item">
                <span class="label">수취인</span>
                <span class="value">{{ recipientName }} ({{ recipientPhone }})</span>
              </div>
              <div class="summary-item">
                <span class="label">송금 통화</span>
                <span class="value">{{ selectedCurrency }} → {{ selectedCurrency }}</span>
              </div>
              <div class="summary-item">
                <span class="label">거래 방식</span>
                <span class="value">{{ selectedCurrency }} 직접 송금</span>
              </div>
              <div class="summary-item">
                <span class="label">보낼 금액</span>
                <span class="value">{{ formatNumber(sendAmount) }} {{ selectedCurrency }}</span>
              </div>
              <div class="summary-item">
                <span class="label">받을 금액</span>
                <span class="value">{{ calculateReceiveAmount() }} {{ selectedCurrency }}</span>
              </div>
              <div class="summary-item total">
                <span class="label">총 차감 금액</span>
                <span class="value">{{ calculateTotal() }} {{ selectedCurrency }}</span>
              </div>
            </div>
          </div>

          <!-- 계좌 비밀번호 입력 -->
          <div class="password-section">
            <label for="transactionPassword" class="password-label">계좌 비밀번호 (4자리)</label>
            <input 
              type="password" 
              id="transactionPassword"
              v-model="transactionPassword" 
              class="password-input" 
              placeholder="••••"
              maxlength="4"
              @keyup.enter="executeTransfer"
              @input="onPasswordInput"
              :disabled="isProcessing"
            />
            <p class="password-hint">안전한 거래를 위해 4자리 숫자 비밀번호를 입력해주세요.</p>
          </div>

          <div v-if="passwordError" class="password-error">
            {{ passwordError }}
          </div>

          <div v-if="isProcessing" class="password-loading">
            <div class="loading-spinner"></div>
            <span>송금 처리 중...</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal" :disabled="isProcessing">취소</button>
          <button 
            class="confirm-btn" 
            @click="executeTransfer" 
            :disabled="!transactionPassword || transactionPassword.length !== 4 || isProcessing"
          >
            {{ isProcessing ? '처리 중...' : calculateReceiveAmount() + ' ' + selectedCurrency + ' 송금하기' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

// 반응형 상태 정의
const currentStep = ref(1)
const selectedCurrency = ref('')
const fromCurrency = ref('')
const toCurrency = ref('')
const recipientName = ref('')
const recipientPhone = ref('')
const sendAmount = ref('')
const formattedSendAmount = ref('')
const transactionPassword = ref('')
const phoneInput = ref(null)

// 상태 관리
const nameConfirmed = ref(false)
const phoneConfirmed = ref(false)
const isProcessing = ref(false)
const transferResult = ref(null)

// 모달 관련 상태
const showModal = ref(false)
const passwordError = ref('')

// 사용자 보유 잔액 데이터
const myBalances = ref([])
const isLoadingBalances = ref(false)
const balanceError = ref('')
const userId = localStorage.getItem('userId')

// 지원 통화 목록
const currencies = ref([])
const isLoadingCurrencies = ref(false)
const currencyError = ref('')

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  fetchSupportedCurrencies()
  fetchUserBalances()
})

// ==================== 모달 관련 함수 ====================

// 송금 확인 모달 열기
const showTransferModal = () => {
  if (!sendAmount.value || sendAmount.value <= 0 || sendAmount.value > getMyBalanceNumber(selectedCurrency.value)) {
    return
  }
  
  showModal.value = true
  transactionPassword.value = ''
  passwordError.value = ''
  isProcessing.value = false
}

// 모달 닫기
const closeModal = () => {
  showModal.value = false
  transactionPassword.value = ''
  passwordError.value = ''
  isProcessing.value = false
}

// 비밀번호 입력 처리 (숫자만 허용)
const onPasswordInput = (event) => {
  const value = event.target.value.replace(/[^0-9]/g, '')
  if (value.length <= 4) {
    transactionPassword.value = value
    passwordError.value = ''
  }
}

// ✅ 숫자 포맷팅 함수
const formatNumber = (number) => {
  if (!number || isNaN(number)) return '0'
  return new Intl.NumberFormat('ko-KR').format(number)
}

// ✅ 포맷팅된 문자열을 숫자로 변환
const parseFormattedNumber = (formattedString) => {
  if (!formattedString) return 0
  return parseFloat(formattedString.replace(/,/g, '')) || 0
}

// ✅ 금액 입력 처리
const handleAmountInput = (event) => {
  let value = event.target.value.replace(/[^0-9.]/g, '')
  
  // 소수점 처리
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }
  
  // 숫자로 변환
  const numValue = parseFloat(value) || 0
  const maxAmount = getMyBalanceNumber(selectedCurrency.value)
  
  // 최대 금액 제한
  if (numValue > maxAmount) {
    sendAmount.value = maxAmount
    formattedSendAmount.value = formatNumber(maxAmount)
  } else {
    sendAmount.value = numValue
    formattedSendAmount.value = numValue ? formatNumber(numValue) : ''
  }
}

// ✅ 포커스 시 포맷팅 해제
const handleAmountFocus = () => {
  if (sendAmount.value) {
    formattedSendAmount.value = sendAmount.value.toString()
  }
}

// ✅ 포커스 아웃 시 포맷팅 적용
const handleAmountBlur = () => {
  if (sendAmount.value) {
    formattedSendAmount.value = formatNumber(sendAmount.value)
  }
}

// 지원 통화 목록 가져오기
const fetchSupportedCurrencies = async () => {
  isLoadingCurrencies.value = true
  currencyError.value = ''

  try {
    const response = await fetch('http://192.168.230.13:8080/api/currency/currencies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error('지원 통화 조회에 실패했습니다')
    }

    const currencyData = await response.json()

    // 백엔드 데이터를 프론트엔드 형식으로 변환
    currencies.value = currencyData.map(currency => ({
      code: currency.currencyCode || currency.code,
      name: currency.currencyName || currency.name,
      displayColor: currency.displayColor,
      decimalPlaces: currency.decimalPlaces,
      countryName: currency.countryName
    }))

    console.log('지원 통화 목록:', currencies.value)

  } catch (error) {
    console.error('지원 통화 조회 오류:', error)
    currencyError.value = error.message || '지원 통화 조회 중 오류가 발생했습니다'

    // 에러 시 기본 통화 목록 사용
    currencies.value = [
      { code: 'KRW', name: '한국 원', countryName: '대한민국' },
      { code: 'USD', name: '미국 달러', countryName: '미국' }
    ]
  } finally {
    isLoadingCurrencies.value = false
  }
}

// 사용자 잔액 조회
const fetchUserBalances = async () => {
  isLoadingBalances.value = true
  balanceError.value = ''

  try {
    const response = await fetch(`http://192.168.230.13:8080/api/balance/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error('잔액 조회에 실패했습니다')
    }

    const balances = await response.json()
    myBalances.value = balances

  } catch (error) {
    console.error('잔액 조회 오류:', error)
    balanceError.value = error.message || '잔액 조회 중 오류가 발생했습니다'
  } finally {
    isLoadingBalances.value = false
  }
}

// 계산된 속성: 잔액이 0보다 큰 통화만 표시
const availableBalances = computed(() => {
  return myBalances.value.filter(balance => {
    const balanceAmount = parseFloat(balance.amount.replace(/,/g, ''))
    return balanceAmount > 0
  })
})

// 계산된 속성: 보낼 수 있는 통화 (잔액이 0보다 큰 통화만)
const availableFromCurrencies = computed(() => {
  return currencies.value.filter(currency => {
    const balance = myBalances.value.find(b => b.code === currency.code)
    if (!balance) return false
    
    const balanceAmount = parseFloat(balance.amount.replace(/,/g, ''))
    return balanceAmount > 0
  })
})

// 통화 선택 함수 (단일)
const selectCurrency = (code) => {
  selectedCurrency.value = code
  fromCurrency.value = code
  toCurrency.value = code
}

// 이름 입력 확인
const confirmNameInput = async () => {
  if (recipientName.value.trim()) {
    nameConfirmed.value = true
    await nextTick()
    if (phoneInput.value) {
      phoneInput.value.focus()
    }
  }
}

// 전화번호 입력 확인
const confirmPhoneInput = () => {
  if (recipientPhone.value.trim()) {
    phoneConfirmed.value = true
  }
}

// 단계 이동 함수
const nextStep = () => {
  if (currentStep.value < 5) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    if (currentStep.value === 3) {
      nameConfirmed.value = false
      phoneConfirmed.value = false
    }
  }
}

// 잔액 조회 함수 (문자열 형태)
const getMyBalance = (currencyCode) => {
  const balance = myBalances.value.find(b => b.code === currencyCode)
  return balance ? balance.amount : '0'
}

// 잔액 조회 함수 (숫자 형태)
const getMyBalanceNumber = (currencyCode) => {
  const balance = myBalances.value.find(b => b.code === currencyCode)
  return balance ? parseFloat(balance.amount.replace(/,/g, '')) : 0
}

// ✅ 받을 금액 계산 (포맷팅 적용)
const calculateReceiveAmount = () => {
  if (!sendAmount.value) return '0'
  return formatNumber(parseFloat(sendAmount.value).toFixed(2))
}

// ✅ 수수료 계산 (포맷팅 적용)
const calculateFee = () => {
  return formatNumber(0)
}

// ✅ 총 차감 금액 계산 (포맷팅 적용)
const calculateTotal = () => {
  if (!sendAmount.value) return '0'
  return formatNumber(parseFloat(sendAmount.value).toFixed(2))
}

// 한글, 영어만 허용하고 띄어쓰기 제거
const filterNameInput = (event) => {
  // recipientName.value = event.target.value.replace(/[^가-힣a-zA-Z]/g, '');
}

// 숫자만 허용
const filterPhoneInput = (event) => {
  // 숫자만 남기기
  let value = event.target.value.replace(/[^0-9]/g, '');
  
  // 비어있지 않고 010으로 시작하지 않으면 010으로 시작하도록 설정
  if (value.length > 0 && !value.startsWith('010')) {
    value = '010';
  }
  
  // 최대 11자리까지만 허용 (010 + 8자리)
  if (value.length > 11) {
    value = value.substring(0, 11);
  }
  
  // 하이픈 자동 추가
  if (value.length > 3) {
    if (value.length <= 7) {
      // 010-1234 형태
      value = value.substring(0, 3) + '-' + value.substring(3);
    } else {
      // 010-1234-5678 형태
      value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
    }
  }
  
  recipientPhone.value = value;
}

// 수취인 이름 검증 (서버에 존재하는지)
const verifyRecipientName = async () => {
  if (!recipientName.value.trim()) return
  
  try {
    const response = await fetch("http://192.168.230.13:8080/api/user/exists?name=" + encodeURIComponent(recipientName.value), {
      method: "GET"
    })
    const exists = await response.json()
    if (exists) {
      nameConfirmed.value = true
      alert("사용자가 확인되었습니다 ✅ 이름 입력 완료")
      await nextTick()
      if (phoneInput.value) {
        phoneInput.value.focus()
      }
    } else {
      alert("해당 이름의 사용자가 존재하지 않습니다 ❌")
    }
  } catch (error) {
    alert("이름 확인 중 오류 발생")
    console.error(error)
  }
}

// 수취인 전화번호 검증 (이름 + 번호 매칭 확인)
const verifyRecipientPhone = async () => {
  if (!recipientPhone.value.trim()) return

  try {
    const phoneForServer = recipientPhone.value.replace(/[^0-9]/g, '');
    const response = await fetch("http://192.168.230.13:8080/api/user/verify-recipient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: recipientName.value,
        phone: phoneForServer
      })
    })
    const isValid = await response.json()
    if (isValid === true) {
      phoneConfirmed.value = true
      alert("수취인 확인 완료 ✅ 전화번호가 일치합니다")
    } else {
      alert("이름과 전화번호가 일치하지 않습니다 ❌")
    }
  } catch (error) {
    alert("전화번호 확인 중 오류 발생")
    console.error(error)
  }
}

const getTransferTypeDescription = () => {
  return `${selectedCurrency.value} 직접 송금`
}

// 비밀번호 확인 및 송금 실행
const executeTransfer = async () => {
  if (!transactionPassword.value || transactionPassword.value.length !== 4) {
    passwordError.value = '4자리 거래 비밀번호를 입력해주세요.'
    return
  }

  isProcessing.value = true
  passwordError.value = ''

  try {
    const transferData = {
      recipientPhone: recipientPhone.value.replace(/[^0-9]/g, ''),
      recipientName: recipientName.value,
      fromCurrencyCode: selectedCurrency.value,
      toCurrencyCode: selectedCurrency.value,
      sendAmount: parseFloat(sendAmount.value),
      transactionPassword: transactionPassword.value,
    }

    const response = await fetch('http://192.168.230.13:8080/api/transfer/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString(),
      },
      body: JSON.stringify(transferData)
    })

    const result = await response.json()

    if (result.success) {
      transferResult.value = result.data
      
      // 모달 닫기
      closeModal()
      
      // 송금 성공 후 잔액 다시 조회
      await fetchUserBalances()
      
      // 완료 페이지로 이동
      nextStep()
    } else {
      passwordError.value = result.message || '송금에 실패했습니다.'
    }
  } catch (error) {
    console.error('송금 실행 오류:', error)
    passwordError.value = '서버 연결에 실패했습니다.'
  } finally {
    isProcessing.value = false
  }
}

// 새로 시작하기
const startNewTransfer = () => {
  currentStep.value = 1
  selectedCurrency.value = ''
  fromCurrency.value = ''
  toCurrency.value = ''
  recipientName.value = ''
  recipientPhone.value = ''
  sendAmount.value = ''
  formattedSendAmount.value = ''
  transactionPassword.value = ''
  nameConfirmed.value = false
  phoneConfirmed.value = false
  transferResult.value = null
  showModal.value = false
  passwordError.value = ''
}
</script>

<style scoped>
html,
body {
  background-color: #f8f9fa !important;
  margin: 0;
  padding: 0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.main-content {
  width: 100%;
  max-width: none;
  background: #f8f9fa !important;
  padding: 3rem 4rem;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 160px);
}

.step-container {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100%;
}

.step-container.step-1,
.step-container.step-complete {
  justify-content: center;
  max-width: 1000px;
}

.step-content {
  flex: 1;
}

.step-actions {
  margin-top: auto;
  padding-top: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
}

.back-btn {
  background: white;
  border: 1px solid #e9ecef;
  font-size: 1.8rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.8rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #e9ecef;
}

.page-title {
  font-size: 2.2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 잔액 섹션 */
.balance-section {
  margin-bottom: 3rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  border: 1px solid #e9ecef;
}

.balance-section h3 {
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.4rem;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.balance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.balance-currency {
  font-weight: 600;
  color: #20c997;
  font-size: 1.1rem;
}

.balance-amount {
  font-size: 1rem;
  color: #6c757d;
  margin-top: 0.5rem;
}

/* 로딩 및 에러 메시지 스타일 */
.loading-message {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-size: 1.1rem;
}

.error-message {
  text-align: center;
  padding: 2rem;
  color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #c82333;
}

/* 잔액/통화 없음 메시지 */
.no-balance-message,
.no-currencies-message {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
  background: rgba(248, 249, 250, 0.9);
  border-radius: 16px;
  border: 1px solid #e9ecef;
  margin-bottom: 2rem;
}

.no-balance-message p,
.no-currencies-message p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.no-balance-message p:first-child,
.no-currencies-message p:first-child {
  font-weight: 600;
  color: #495057;
}

/* 통화 섹션 */
.currency-section {
  margin-bottom: 3rem;
}

.currency-section h3 {
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.4rem;
}

/* 섹션 설명 추가 */
.section-description {
  color: #6c757d;
  font-size: 1rem;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.currency-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.currency-card {
  border: 2px solid #e9ecef;
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: white;
  position: relative;
  overflow: hidden;
}

.currency-card:hover {
  border-color: #20c997;
  transform: translateY(-2px);
}

.currency-card.active {
  border-color: #20c997;
  background-color: #f0fdfa;
}

.currency-info {
  flex: 1;
}

.currency-code {
  font-weight: 600;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.currency-name {
  color: #6c757d;
  font-size: 1rem;
  margin-bottom: 0.3rem;
}

.currency-country {
  color: #6c757d;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.currency-balance {
  color: #20c997;
  font-size: 0.9rem;
  font-weight: 600;
}

/* 직접 송금 배지 */
.direct-transfer-badge {
  background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(32, 201, 151, 0.2);
}

.selection-summary {
  background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(32, 201, 151, 0.15);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.arrow {
  font-size: 2rem;
}

.summary-info {
  opacity: 0.95;
  font-size: 1.1rem;
}

/* 직접 송금 스타일 */
.direct-transfer {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
}

.currency-flow {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.currency-badge {
  background: #20c997;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
}

/* 시작 화면 */
.welcome-card {
  text-align: center;
  padding: 4rem 3rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
  color: white;
  margin-top: 3rem;
  box-shadow: 0 8px 32px rgba(32, 201, 151, 0.2);
}

.welcome-card h3 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.welcome-card p {
  opacity: 0.9;
  margin-bottom: 3rem;
  font-size: 1.1rem;
}

.send-button {
  background: white;
  color: #20c997;
  border: none;
  padding: 1.5rem 4rem;
  border-radius: 60px;
  font-size: 1.3rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.send-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 폼 스타일 */
.form-container {
  margin-bottom: 3rem;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}

.form-group {
  margin-bottom: 2rem;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: #333;
  font-size: 1.1rem;
}

.input-with-confirm {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.form-input {
  flex: 1;
  padding: 1.5rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #20c997;
  box-shadow: 0 0 0 3px rgba(32, 201, 151, 0.1);
}

.form-input:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  border-color: #e9ecef;
}

.confirm-btn {
  padding: 1.5rem 2rem;
  background: #20c997;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.confirm-btn:hover {
  background: #17a085;
  transform: translateY(-1px);
}

.confirmed-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: #20c997;
  color: white;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: bold;
}

.selected-currency-info {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem;
  background-color: rgba(240, 253, 250, 0.8);
  border-radius: 12px;
  margin-top: 1.5rem;
  border: 1px solid #e9ecef;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 500;
}

/* 애니메이션 */
.slide-down-enter-active {
  transition: all 0.4s ease-out;
}

.slide-down-leave-active {
  transition: all 0.3s ease-in;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* 금액 입력 */
.amount-container {
  margin-bottom: 3rem;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}

.recipient-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  margin-bottom: 3rem;
  border: 1px solid #e9ecef;
}

.recipient-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recipient-name {
  font-weight: 600;
  font-size: 1.2rem;
}

.recipient-phone {
  color: #6c757d;
  font-size: 1rem;
}

.amount-input-section {
  margin-bottom: 3rem;
}

.amount-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.amount-input {
  width: 100%;
  padding: 2rem;
  border: 2px solid #e9ecef;
  border-radius: 16px;
  font-size: 2.5rem;
  font-weight: 600;
  text-align: center;
  transition: border-color 0.2s;
  background: white;
}

.amount-input:focus {
  outline: none;
  border-color: #20c997;
}

.currency-symbol {
  position: absolute;
  right: 2rem;
  font-size: 1.8rem;
  font-weight: 600;
  color: #6c757d;
}

.balance-info {
  text-align: center;
  color: #6c757d;
  font-size: 1rem;
  margin-top: 1rem;
}

.conversion-info {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e9ecef;
}

.conversion-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.conversion-row.total {
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
  font-weight: 600;
  font-size: 1.3rem;
}

/* 완료 페이지 스타일 */
.completion-container {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.success-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  margin: 0 auto 2rem;
  box-shadow: 0 8px 32px rgba(32, 201, 151, 0.2);
}

.completion-title {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 3rem;
}

.completion-details {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid #e9ecef;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #f1f3f4;
}

.detail-item:last-child {
  border-bottom: none;
}

.completion-message {
  margin: 2rem 0;
  color: #6c757d;
  line-height: 1.6;
}

.completion-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 버튼 스타일 */
.continue-btn {
  width: 100%;
  padding: 1.5rem 2rem;
  background: #20c997;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.3rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(32, 201, 151, 0.2);
}

.continue-btn:hover {
  background: #17a085;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(32, 201, 151, 0.3);
}

.continue-btn:disabled {
  background: #dee2e6;
  color: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.primary-btn,
.secondary-btn {
  flex: 1;
  padding: 1.5rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn {
  background: #20c997;
  color: white;
}

.secondary-btn {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.primary-btn:hover,
.secondary-btn:hover {
  transform: translateY(-1px);
}

/* ==================== 모달 스타일 ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: #fff;
  border-radius: 16px;
  padding: 0;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: 0.2s;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.modal-body {
  padding: 24px;
}

.transfer-summary {
  background: #f0f8f7;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #20c997;
}

.summary-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-bottom: 1px solid #f1f3f4;
}

.summary-item.total {
  border-top: 2px solid #20c997;
  border-bottom: none;
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
}

.summary-item .label {
  color: #666;
  font-weight: 500;
}

.summary-item .value {
  color: #333;
  font-weight: 600;
}

.password-section {
  margin-bottom: 20px;
}

.password-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.password-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1.2rem;
  text-align: center;
  letter-spacing: 0.5em;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.password-input:focus {
  outline: none;
  border-color: #20c997;
}

.password-input:disabled {
  background: #f8f9fa;
  color: #666;
}

.password-hint {
  color: #6c757d;
  font-size: 0.85rem;
  margin-top: 8px;
  text-align: center;
}

.password-error {
  color: #dc3545;
  font-size: 0.85rem;
  text-align: center;
  padding: 8px;
  background: #f8d7da;
  border-radius: 6px;
  margin-top: 8px;
}

.password-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f0f8f7;
  border-radius: 8px;
  margin-top: 8px;
}

.password-loading .loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #20c997;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #f8f9fa;
}

.cancel-btn,
.confirm-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
  border: none;
  min-width: 80px;
}

.cancel-btn {
  background: #6c757d;
  color: #fff;
}

.cancel-btn:hover:not(:disabled) {
  background: #5a6268;
}

.confirm-btn {
  background: #20c997;
  color: #fff;
}

.confirm-btn:hover:not(:disabled) {
  background: #17a085;
}

.cancel-btn:disabled,
.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 반응형 */
@media (max-width: 768px) {
  .main-content {
    padding: 2rem;
  }

  .step-container {
    max-width: 100%;
  }

  .currency-grid {
    grid-template-columns: 1fr;
  }

  .balance-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .input-with-confirm {
    flex-direction: column;
    align-items: stretch;
  }

  .confirm-btn {
    margin-top: 1rem;
  }

  .recipient-summary {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .completion-buttons {
    flex-direction: column;
  }

  .currency-card {
    padding: 1.5rem;
  }

  .direct-transfer-badge {
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
  }

  .selected-currency-info {
    flex-direction: column;
    gap: 1rem;
  }

  .modal-container {
    width: 95%;
    margin: 20px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .cancel-btn,
  .confirm-btn {
    width: 100%;
  }
}
</style>
