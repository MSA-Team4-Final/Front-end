<template>
  <div class="main-content">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>데이터를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <h3>오류가 발생했습니다</h3>
        <p>{{ error }}</p>
        <button @click="loadData" class="retry-btn">다시 시도</button>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <template v-else>
      <!-- 페이지 헤더 -->
      <div class="page-header-section">
        <button class="back-btn" @click="goBack">←</button>
        <div class="header-info">
          <h1 class="page-title">거래 내역</h1>
          <div class="currency-selector">
            <label for="currency-select">통화 선택:</label>
            <select id="currency-select" v-model="selectedCurrency" @change="onCurrencyChange" class="currency-select">
              <option value="KRW">🇰🇷 원화 (KRW)</option>
              <option value="USD">🇺🇸 달러 (USD)</option>
              <option value="EUR">🇪🇺 유로 (EUR)</option>
              <option value="JPY">🇯🇵 엔화 (JPY)</option>
              <option value="GBP">🇬🇧 파운드 (GBP)</option>
              <option value="AUD">🇦🇺 호주달러 (AUD)</option>
              <option value="CAD">🇨🇦 캐나다달러 (CAD)</option>
              <option value="CHF">🇨🇭 스위스프랑 (CHF)</option>
              <option value="CNY">🇨🇳 위안화 (CNY)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 잔액 정보 -->
      <div class="balance-section">
        <div class="single-currency-balance">
          <div class="currency-display">
            <span class="currency-flag">{{ getCurrencyFlag(selectedCurrency) }}</span>
            <h2 class="currency-title">{{ getCurrencyName(selectedCurrency) }} </h2>
          </div>
          <div class="balance-display">
            <div class="current-balance">
              {{ formatCurrencyAmount(currentBalance, selectedCurrency) }}
            </div>
            <div class="krw-balance" v-if="selectedCurrency !== 'KRW'">
              ≈ {{ formatAmount(convertToKRW(currentBalance, exchangeRate)) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 요약 통계 -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-label">이번 달 수입</div>
          <div class="summary-value income">
            +{{ formatCurrencyAmount(monthlyStats.income, selectedCurrency) }}
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-label">이번 달 지출</div>
          <div class="summary-value expense">
            -{{ formatCurrencyAmount(monthlyStats.expense, selectedCurrency) }}
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-label">이번 달 거래 횟수</div>
          <div class="summary-value">{{ monthlyStats.count }}회</div>
        </div>
      </div>

      <!-- 필터 및 정렬 -->
      <div class="filter-section">
        <div class="filter-options">
          <select v-model="selectedPeriod" class="filter-select" @change="applyFilters">
            <option value="all">전체 기간</option>
            <option value="month">최근 1개월</option>
            <option value="week">최근 1주일</option>
          </select>
          <select v-model="selectedType" class="filter-select" @change="applyFilters">
            <option value="all">모든 거래</option>
            <option value="income">입금</option>
            <option value="expense">출금</option>
          </select>
        </div>
        <select v-model="sortBy" class="sort-select" @change="applyFilters">
          <option value="date">날짜순</option>
          <option value="amount">금액순</option>
        </select>
      </div>

      <!-- 거래 내역 리스트 -->
      <div class="transactions-container">
        <h3>
          {{ getCurrencyName(selectedCurrency) }} 거래 내역
          <span class="transaction-count">({{ filteredTransactions.length }}건)</span>
        </h3>

        <!-- 거래 내역이 없는 경우 -->
        <div v-if="filteredTransactions.length === 0" class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-text">거래 내역이 없습니다</div>
          <div class="empty-state-subtext">첫 거래를 시작해보세요!</div>
        </div>

        <!-- 거래 내역 목록 -->
        <div v-else class="transaction-list">
          <div v-for="transaction in filteredTransactions" :key="transaction.id" class="transaction-item"
            @click="showTransactionDetail(transaction)">
            <div class="transaction-icon" :class="getTransactionTypeClass(transaction)">
              {{ getTransactionIcon(transaction) }}
            </div>
            <div class="transaction-info">
              <div class="transaction-desc">{{ getTransactionDescription(transaction) }}</div>
              <div class="transaction-details">
                <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
                <span class="transaction-method">{{ getTransactionMethod(transaction) }}</span>
              </div>
            </div>
            <div class="transaction-amount" :class="getTransactionTypeClass(transaction)">
              {{ getTransactionAmountDisplay(transaction) }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- 거래 상세 모달 -->
  <div v-if="selectedTransaction" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>거래 상세</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="modal-body">
        <div class="detail-row">
          <span class="detail-label">통화</span>
          <span class="detail-value">
            {{ getCurrencyFlag(selectedCurrency) }} {{ getCurrencyName(selectedCurrency) }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">거래 종류</span>
          <span class="detail-value">{{ getTransactionTypeText(selectedTransaction) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">금액</span>
          <span class="detail-value" :class="getTransactionTypeClass(selectedTransaction)">
            {{ getTransactionAmountDisplay(selectedTransaction) }}
          </span>
        </div>
        <div v-if="selectedCurrency !== 'KRW'" class="detail-row">
          <span class="detail-label">원화 환산</span>
          <span class="detail-value">
            {{ getTransactionAmountKRW(selectedTransaction) }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">거래일시</span>
          <span class="detail-value">{{ formatDateTime(selectedTransaction.createdAt) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">거래 방법</span>
          <span class="detail-value">{{ getTransactionMethod(selectedTransaction) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">거래 ID</span>
          <span class="detail-value">{{ selectedTransaction.id }}</span>
        </div>
        <div class="detail-row" v-if="selectedTransaction.fromUserName">
          <span class="detail-label">송금인</span>
          <span class="detail-value">{{ selectedTransaction.fromUserName }}</span>
        </div>
        <div class="detail-row" v-if="selectedTransaction.toUserName">
          <span class="detail-label">수취인</span>
          <span class="detail-value">{{ selectedTransaction.toUserName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'TransactionHistory',
  setup() {
    const router = useRouter()
    const route = useRoute()

    // 기본 설정
    const currentUserId = ref(localStorage.getItem('userId') || 1)

    // 반응형 데이터
    const loading = ref(true)
    const error = ref(null)
    const selectedCurrency = ref('KRW')
    const currentBalance = ref(0)
    const exchangeRate = ref(1)
    const monthlyStats = ref({
      income: 0,
      expense: 0,
      count: 0
    })
    const allTransactions = ref([])
    const transactions = ref([])

    // 필터 및 정렬
    const selectedPeriod = ref('all')
    const selectedType = ref('all')
    const sortBy = ref('date')
    const selectedTransaction = ref(null)

    // 통화 정보 매핑
    const currencyInfo = {
      'KRW': { name: '원화', flag: '🇰🇷' },
      'USD': { name: '달러', flag: '🇺🇸' },
      'EUR': { name: '유로', flag: '🇪🇺' },
      'JPY': { name: '엔화', flag: '🇯🇵' },
      'GBP': { name: '파운드', flag: '🇬🇧' },
      'AUD': { name: '호주달러', flag: '🇦🇺' },
      'CAD': { name: '캐나다달러', flag: '🇨🇦' },
      'CHF': { name: '스위스프랑', flag: '🇨🇭' },
      'CNY': { name: '위안화', flag: '🇨🇳' }
    }

    // 필터링된 거래 목록
    const filteredTransactions = computed(() => {
      let filtered = [...allTransactions.value]

      // 1. 선택된 통화와 관련된 거래만 필터링
      filtered = filtered.filter(transaction => {
        if (transaction.transactionType === 'EXCHANGE') {
          return transaction.fromCurrencyCode === selectedCurrency.value ||
            transaction.toCurrencyCode === selectedCurrency.value
        }

        if (transaction.transactionType === 'TRANSFER') {
          return transaction.fromCurrencyCode === selectedCurrency.value ||
            transaction.toCurrencyCode === selectedCurrency.value
        }

        return transaction.fromCurrencyCode === selectedCurrency.value ||
          transaction.toCurrencyCode === selectedCurrency.value
      })

      // 2. 거래 타입 필터링
      if (selectedType.value !== 'all') {
        filtered = filtered.filter(transaction => {
          const transactionTypeClass = getTransactionTypeClass(transaction)

          if (selectedType.value === 'income') {
            return transactionTypeClass === 'income'
          } else if (selectedType.value === 'expense') {
            return transactionTypeClass === 'expense'
          }
          return true
        })
      }

      // 3. 기간 필터링
      if (selectedPeriod.value !== 'all') {
        const now = new Date()
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.createdAt)

          if (selectedPeriod.value === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return transactionDate >= weekAgo
          } else if (selectedPeriod.value === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return transactionDate >= monthAgo
          }
          return true
        })
      }

      // 4. 정렬
      filtered.sort((a, b) => {
        if (sortBy.value === 'date') {
          return new Date(b.createdAt) - new Date(a.createdAt)
        } else if (sortBy.value === 'amount') {
          const amountA = getTransactionAmount(a)
          const amountB = getTransactionAmount(b)
          return amountB - amountA
        }
        return 0
      })

      return filtered
    })

    // 클라이언트에서 월간 통계 계산
    const calculatedMonthlyStats = computed(() => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

      // 이번 달 거래만 필터링
      const monthlyTransactions = allTransactions.value.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt)
        return transactionDate >= startOfMonth && transactionDate <= now
      })

      // 선택된 통화와 관련된 거래만 필터링
      const currencyRelatedTransactions = monthlyTransactions.filter(transaction => {
        if (transaction.transactionType === 'EXCHANGE') {
          return transaction.fromCurrencyCode === selectedCurrency.value ||
            transaction.toCurrencyCode === selectedCurrency.value
        }

        if (transaction.transactionType === 'TRANSFER') {
          return transaction.fromCurrencyCode === selectedCurrency.value ||
            transaction.toCurrencyCode === selectedCurrency.value
        }

        return transaction.fromCurrencyCode === selectedCurrency.value ||
          transaction.toCurrencyCode === selectedCurrency.value
      })

      let income = 0
      let expense = 0
      let count = currencyRelatedTransactions.length

      currencyRelatedTransactions.forEach(transaction => {
        const transactionTypeClass = getTransactionTypeClass(transaction)
        const amount = getTransactionAmount(transaction)

        if (transactionTypeClass === 'income') {
          income += amount
        } else {
          expense += amount
        }
      })

      return {
        income,
        expense,
        count
      }
    })

    // 컴포넌트 마운트 시 데이터 로드
    onMounted(async () => {
      selectedCurrency.value = route.query.currencyCode || 'KRW'
      await loadData()
    })

    // URL 파라미터 변경 감지
    watch(() => route.query.currencyCode, (newCurrency) => {
      if (newCurrency && newCurrency !== selectedCurrency.value) {
        selectedCurrency.value = newCurrency
        loadData()
      }
    })

    // 통화 변경
    const onCurrencyChange = async () => {
      router.replace({
        path: '/account/detail',
        query: {
          currencyCode: selectedCurrency.value
        }
      })

      await loadData()
    }

    // 데이터 로드
    const loadData = async () => {
      try {
        loading.value = true
        error.value = null

        await Promise.allSettled([
          loadBalance(),
          loadTransactions()
        ]).then(results => {
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.error(`API 호출 ${index} 실패:`, result.reason)
            }
          })
        })

      } catch (err) {
        console.error('데이터 로드 실패:', err)
        error.value = err.message || '데이터를 불러오는 중 오류가 발생했습니다.'
      } finally {
        loading.value = false
      }
    }

    // 잔액 조회
    const loadBalance = async () => {
      try {
        const response = await fetch(`http://192.168.230.13:8080/api/balance/${currentUserId.value}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('잔액 조회 실패')
        }

        const data = await response.json()

        if (Array.isArray(data)) {
          const currencyBalance = data.find(b => b.code === selectedCurrency.value)
          if (currencyBalance) {
            currentBalance.value = parseFloat(currencyBalance.amount.toString().replace(/,/g, '')) || 0

            if (selectedCurrency.value !== 'KRW') {
              await loadExchangeRate()
            } else {
              exchangeRate.value = 1
            }
          } else {
            currentBalance.value = 0
            exchangeRate.value = 1
          }
        } else {
          console.warn('예상과 다른 잔액 API 응답:', data)
          currentBalance.value = 0
          exchangeRate.value = 1
        }
      } catch (error) {
        console.error('잔액 조회 실패:', error)
        currentBalance.value = 0
        exchangeRate.value = 1
      }
    }

    // 환율 조회
    const loadExchangeRate = async () => {
      try {
        const response = await fetch(`http://192.168.230.13:8080/api/exchange/realtime/${selectedCurrency.value}`)
        const rateData = await response.json()

        if (rateData && rateData.length > 0 && rateData[0].base_rate) {
          const baseRateStr = rateData[0].base_rate
          const cleanRate = baseRateStr.replace(/,/g, '')
          let rate = parseFloat(cleanRate)

          if (selectedCurrency.value === 'JPY') {
            rate = rate / 100
          }

          exchangeRate.value = rate
        } else {
          exchangeRate.value = selectedCurrency.value === 'JPY' ? 9.4 : 1300
        }
      } catch (error) {
        console.error('환율 조회 실패:', error)
        exchangeRate.value = selectedCurrency.value === 'JPY' ? 9.4 : 1300
      }
    }

    // 거래 내역 조회
    const loadTransactions = async () => {
      try {
        const params = new URLSearchParams({
          period: 'all',
          type: 'all',
          sortBy: 'date'
        })

        const response = await fetch(
          `http://192.168.230.13:8080/api/transaction/history/${currentUserId.value}?${params}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data) {
          if (data.success && Array.isArray(data.transactions)) {
            allTransactions.value = data.transactions
          } else if (Array.isArray(data.transactions)) {
            allTransactions.value = data.transactions
          } else if (Array.isArray(data)) {
            allTransactions.value = data
          } else {
            console.warn('예상과 다른 거래내역 API 응답:', data)
            allTransactions.value = []
          }
        } else {
          allTransactions.value = []
        }

      } catch (error) {
        console.error('거래 내역 로드 실패:', error)
        allTransactions.value = []
      }
    }

    // 필터 적용
    const applyFilters = () => {
      console.log('필터 적용됨:', {
        selectedPeriod: selectedPeriod.value,
        selectedType: selectedType.value,
        sortBy: sortBy.value,
        selectedCurrency: selectedCurrency.value
      })
    }

    // 뒤로가기
    const goBack = () => {
      router.push('/mypage')
    }

    // 거래 상세 보기
    const showTransactionDetail = (transaction) => {
      console.log('거래 상세 보기:', transaction)
      selectedTransaction.value = transaction
    }

    // 모달 닫기
    const closeModal = () => {
      selectedTransaction.value = null
    }

    // 헬퍼 함수들
    const getCurrencyName = (code) => {
      return currencyInfo[code]?.name || code
    }

    const getCurrencyFlag = (code) => {
      return currencyInfo[code]?.flag || '💱'
    }

    const formatAmount = (amount) => {
      if (!amount && amount !== 0) return '0원'
      return new Intl.NumberFormat('ko-KR').format(Math.floor(amount)) + '원'
    }

    const formatCurrencyAmount = (amount, currencyCode) => {
      if (!amount && amount !== 0) return `0 ${currencyCode}`
      const cleanAmount = parseFloat(amount.toString().replace(/,/g, ''))

      if (currencyCode === 'KRW') {
        return new Intl.NumberFormat('ko-KR').format(Math.floor(cleanAmount)) + '원'
      }
      return new Intl.NumberFormat('ko-KR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(cleanAmount) + ' ' + currencyCode
    }

    const convertToKRW = (amount, rate) => {
      const cleanAmount = parseFloat(amount.toString().replace(/,/g, ''))
      return Math.floor(cleanAmount * rate)
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const formatDateTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    // 거래 타입 분류 - WITHDRAWAL 타입 추가
    const getTransactionTypeClass = (transaction) => {
      // 충전은 항상 income
      if (transaction.transactionType === 'DEPOSIT') {
        return 'income'
      }

      // 출금은 항상 expense (핵심 수정 부분)
      if (transaction.transactionType === 'WITHDRAWAL' || transaction.transactionType === 'WITHDRAW') {
        return 'expense'
      }

      // 환전의 경우: 선택된 통화 기준으로 입금/출금 판단
      if (transaction.transactionType === 'EXCHANGE') {
        if (transaction.toCurrencyCode === selectedCurrency.value) {
          return 'income'
        } else if (transaction.fromCurrencyCode === selectedCurrency.value) {
          return 'expense'
        }
      }

      // 송금의 경우: 사용자 기준으로 판단
      if (transaction.transactionType === 'TRANSFER') {
        return transaction.toUserId === parseInt(currentUserId.value) ? 'income' : 'expense'
      }

      // 기타 거래
      return transaction.toUserId === parseInt(currentUserId.value) ? 'income' : 'expense'
    }

    // 거래 관련 함수들
    const getTransactionDescription = (transaction) => {
      switch (transaction.transactionType) {
        case 'TRANSFER':
          return transaction.fromUserId === parseInt(currentUserId.value)
            ? `${transaction.toUserName}님에게 송금`
            : `${transaction.fromUserName}님으로부터 수신`
        case 'EXCHANGE':
          return `${transaction.fromCurrencyCode} → ${transaction.toCurrencyCode} 환전`
        case 'DEPOSIT':
          return `${transaction.fromCurrencyCode} 충전`
        case 'WITHDRAWAL':
        case 'WITHDRAW':
          return `${transaction.fromCurrencyCode} 출금`
        default:
          return '기타'
      }
    }

    const getTransactionMethod = (transaction) => {
      switch (transaction.transactionType) {
        case 'TRANSFER':
          return '친구송금'
        case 'EXCHANGE':
          return '환전'
        case 'DEPOSIT':
          return '충전'
        case 'WITHDRAWAL':  // 추가
        case 'WITHDRAW':    // 기존 타입도 지원
          return '출금'
        default:
          return '기타'
      }
    }

    const getTransactionTypeText = (transaction) => {
      return getTransactionTypeClass(transaction) === 'income' ? '입금' : '출금'
    }

    // 거래 금액 계산
    const getTransactionAmount = (transaction) => {
      const isIncome = getTransactionTypeClass(transaction) === 'income'

      if (transaction.transactionType === 'EXCHANGE') {
        if (transaction.toCurrencyCode === selectedCurrency.value) {
          return transaction.receiveAmount
        } else if (transaction.fromCurrencyCode === selectedCurrency.value) {
          return transaction.sendAmount || transaction.totalDeductedAmount
        }
      }

      if (transaction.transactionType === 'TRANSFER') {
        return isIncome ? transaction.receiveAmount : (transaction.sendAmount || transaction.totalDeductedAmount)
      }

      return isIncome ? transaction.receiveAmount : (transaction.sendAmount || transaction.totalDeductedAmount)
    }

    // 거래 금액 표시 - 부호를 올바르게 처리
    const getTransactionAmountDisplay = (transaction) => {
      const isIncome = getTransactionTypeClass(transaction) === 'income'
      const amount = getTransactionAmount(transaction)
      const sign = isIncome ? '+' : '-'

      // 금액은 항상 절댓값으로 표시
      const absAmount = Math.abs(amount)

      return `${sign}${formatCurrencyAmount(absAmount, selectedCurrency.value)}`
    }

    const getTransactionAmountKRW = (transaction) => {
      const isIncome = getTransactionTypeClass(transaction) === 'income'
      const amount = getTransactionAmount(transaction)
      const krwAmount = convertToKRW(amount, exchangeRate.value)
      const sign = isIncome ? '+' : '-'
      return `${sign}${formatAmount(krwAmount)}`
    }

    const getTransactionIcon = (transaction) => {
      switch (transaction.transactionType) {
        case 'TRANSFER':
          return getTransactionTypeClass(transaction) === 'income' ? '📥' : '📤'
        case 'EXCHANGE':
          return '💱'
        case 'DEPOSIT':
          return '💰'
        case 'WITHDRAWAL':
        case 'WITHDRAW':
          return '🏧'
        default:
          return '💳'
      }
    }

    return {
      // 반응형 데이터
      loading,
      error,
      selectedCurrency,
      currentBalance,
      exchangeRate,
      monthlyStats: calculatedMonthlyStats,
      transactions,
      allTransactions,
      filteredTransactions,
      selectedPeriod,
      selectedType,
      sortBy,
      selectedTransaction,
      currentUserId,

      // 메서드
      onCurrencyChange,
      loadData,
      applyFilters,
      goBack,
      showTransactionDetail,
      closeModal,

      // 헬퍼 함수
      getCurrencyName,
      getCurrencyFlag,
      formatAmount,
      formatCurrencyAmount,
      convertToKRW,
      formatDate,
      formatDateTime,
      getTransactionDescription,
      getTransactionMethod,
      getTransactionTypeClass,
      getTransactionTypeText,
      getTransactionAmount,
      getTransactionAmountDisplay,
      getTransactionAmountKRW,
      getTransactionIcon
    }
  }
}
</script>

<style scoped>
/* 기존 스타일은 그대로 유지 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.main-content {
  flex: 1;
  padding: 3rem 2rem;
  margin-left: 15rem;
  margin-right: 15rem;
}

/* 로딩 상태 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  margin: 2rem 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #20c997;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 에러 상태 */
.error-container {
  padding: 2rem;
  background: white;
  border-radius: 16px;
  margin: 2rem 0;
  border: 1px solid #e9ecef;
}

.error-message {
  text-align: center;
  color: #dc3545;
}

.error-message h3 {
  margin-bottom: 1rem;
  color: #dc3545;
}

.error-message p {
  margin-bottom: 1.5rem;
  color: #6c757d;
}

.retry-btn {
  background: #20c997;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #17a085;
}

/* 페이지 헤더 */
.page-header-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  margin-bottom: 2rem;
  border: 1px solid #e9ecef;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #f8f9fa;
}

.header-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
}

.currency-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.currency-selector label {
  color: #6c757d;
  font-weight: 500;
  font-size: 0.9rem;
}

.currency-select {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
  min-width: 200px;
}

.currency-select:focus {
  outline: none;
  border-color: #20c997;
}

/* 잔액 섹션 */
.balance-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid #e9ecef;
}

/* 단일 통화 잔액 */
.single-currency-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.currency-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.currency-display .currency-flag {
  font-size: 3rem;
}

.currency-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.balance-display {
  text-align: right;
}

.current-balance {
  font-size: 2rem;
  font-weight: bold;
  color: #20c997;
}

.krw-balance {
  color: #6c757d;
  margin-top: 0.25rem;
}

/* 요약 카드 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  text-align: center;
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-label {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.summary-value {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
}

.summary-value.income {
  color: #20c997;
}

.summary-value.expense {
  color: #dc3545;
}

/* 필터 섹션 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.filter-options {
  display: flex;
  gap: 1rem;
}

.filter-select,
.sort-select {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus,
.sort-select:focus {
  outline: none;
  border-color: #20c997;
}

/* 거래 내역 컨테이너 */
.transactions-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e9ecef;
}

.transactions-container h3 {
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.transaction-count {
  color: #6c757d;
  font-weight: normal;
  font-size: 1rem;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.transaction-item:hover {
  background: #e9ecef;
  border-color: #20c997;
  transform: translateY(-1px);
}

.transaction-icon {
  font-size: 1.5rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.transaction-info {
  flex: 1;
}

.transaction-desc {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #333;
}

.transaction-details {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #6c757d;
  flex-wrap: wrap;
}

.transaction-date {
  position: relative;
}

.transaction-date::after {
  
  color: #dee2e6;
}

.transaction-method {
  color: #20c997;
  font-weight: 500;
}

.transaction-amount {
  font-weight: 600;
  font-size: 1.1rem;
  text-align: right;
  min-width: 120px;
}

.transaction-amount.expense {
  color: #dc3545;
}

.transaction-amount.income {
  color: #20c997;
}

/* 비어있는 상태 */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
}

.empty-state-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state-text {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.empty-state-subtext {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 16px 16px 0 0;
}

.modal-header h3 {
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.25rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #e9ecef;
}

.modal-body {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #6c757d;
  font-weight: 500;
  font-size: 0.9rem;
}

.detail-value {
  font-weight: 600;
  color: #333;
  text-align: right;
}

.detail-value.income {
  color: #20c997;
}

.detail-value.expense {
  color: #dc3545;
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .summary-cards {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 2rem;
    margin-right: 2rem;
  }

  .page-header-section {
    flex-direction: column;
    gap: 1.5rem;
  }

  .header-info {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .currency-selector {
    width: 100%;
    justify-content: space-between;
  }

  .currency-select {
    flex: 1;
    min-width: auto;
  }

  .single-currency-balance {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .currency-display {
    justify-content: center;
  }

  .balance-display {
    text-align: center;
  }

  .filter-section {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .filter-options {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .transaction-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .transaction-amount {
    align-self: flex-end;
    text-align: right;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>
