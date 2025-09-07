<template>
  <section class="remit-info-section-v4">
    <h2 class="section-title-v4">출금 정보</h2>

    <div class="info-table-v4">
      <!-- 계좌 선택 -->
      <div class="info-row-v4 input-row">
        <label class="input-label-v4">출금 계좌</label>
        <select v-model="selectedAccountKey" class="input-field-v4">
          <option value="" disabled>계좌 선택</option>
          <option
              v-for="acc in filteredAccounts"
              :key="acc.accountNumber + acc.currencyCode"
              :value="acc.accountNumber + '_' + acc.currencyCode"
          >
            {{ acc.accountNumber }} / {{ acc.currencyCode }}
          </option>
        </select>
      </div>

      <!-- 계좌 안내 -->
      <div v-if="!selectedAccount" class="info-row-v4">
        <span class="input-label-v4">잔액</span>
        <span class="input-field-v4" style="text-align:right; color:#999;">
          출금 계좌를 선택해주세요
        </span>
      </div>

      <!-- 계좌 선택 후 표시 -->
      <template v-if="selectedAccount">
        <!-- 잔액 표시 -->
        <div class="info-row-v4">
          <span class="input-label-v4">잔액</span>
          <span class="input-field-v4" style="text-align:right">
            {{ selectedAccount.availableAmount.toLocaleString() }} {{ selectedAccount.currencyCode }}
          </span>
        </div>

        <!-- 계좌 비밀번호 입력 -->
        <div class="info-row-v4 input-row">
          <label class="input-label-v4">계좌 비밀번호</label>
          <input
              type="password"
              maxlength="4"
              v-model="accountPinLocal"
              class="input-field-v4"
              placeholder="4자리 입력"
              @input="updateValidity"
          />
        </div>

        <!-- 송금 금액 입력 -->
        <div class="info-row-v4 input-row">
          <label class="input-label-v4">송금 금액</label>
          <div style="display:flex; flex-direction:column; flex-grow:1; gap:4px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <input
                  type="number"
                  step="1"
                  v-model.number="transferAmount"
                  class="input-field-v4"
                  :class="{ 'invalid-amount': isInvalidAmount }"
                  placeholder="송금 금액 입력"
                  @input="calculateTransfer"
              />
              <span style="font-weight:600;">{{ selectedAccount.currencyCode }}</span>
            </div>
            <div style="font-size:12px; color:#666;">
              최대: {{ maxAmount.toLocaleString() }} {{ selectedAccount.currencyCode }} /
              최소: {{ minAmount.toLocaleString() }} {{ selectedAccount.currencyCode }}
            </div>
          </div>
        </div>

        <!-- 환율 표시 -->
        <div v-if="selectedRecipient" class="info-row-v4">
          <span class="input-label-v4">환율</span>
          <span class="input-field-v4" style="text-align:right">
            {{ selectedRecipient.currencyCode }} =
            {{ exchangeRateDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </span>
        </div>

        <!-- 수수료 표시 -->
        <div class="info-row-v4">
          <span class="input-label-v4">수수료 (원화 계좌 차감)</span>
          <span class="input-field-v4" style="text-align:right">
            {{ feeInKRW.toLocaleString() }} KRW
          </span>
        </div>

        <!-- 총 차감액 표시 -->
        <div class="info-row-v4">
          <span class="input-label-v4">총 차감액</span>
          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <span v-if="isForeignAccount">
              {{ transferAmount.toLocaleString(undefined, { minimumFractionDigits: decimals.value, maximumFractionDigits: decimals.value }) }}
              {{ selectedAccount.currencyCode }}
            </span>
            <span v-else>{{ totalAmountKRW.toLocaleString() }} KRW</span>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  selectedRecipient: { type: Object, default: null },
  initialAmount: { type: [Number, String], default: 0 },
  accountPin: { type: String, default: '' }
})

const emit = defineEmits([
  'update:selectedAccount',
  'update:amountInput',
  'update:totalAmountKRW',
  'update:feeAmountKRW',
  'update:convertedAmount',
  'update:isValid',
  'update:accountPin',
  'update:totalAmountForeign'
])

// -----------------------------
// 상태
// -----------------------------
const accounts = ref([])
const selectedAccountKey = ref('')
const selectedAccount = ref(null)
const transferAmount = ref(Number(props.initialAmount) || 0)
const feeInKRW = ref(0)
const convertedAmount = ref(0)
const totalAmountKRW = ref(0)
const totalAmountForeign = ref(0)
const isInvalidAmount = ref(false)
const accountPinLocal = ref(props.accountPin || '')
const exchangeRateDisplay = ref(0)

// 통화별 소수점
const currencyDecimals = { KRW:0, USD:2, EUR:2, JPY:0, GBP:2, AUD:2, CAD:2, CHF:2, CNY:2 }
const decimals = computed(() => currencyDecimals[selectedAccount.value?.currencyCode] ?? 2)

// 최소/최대 금액
const minAmounts = { KRW:1000, USD:10, EUR:10, JPY:100, GBP:10, AUD:10, CAD:10, CHF:10, CNY:10 }
const minAmount = computed(() => selectedAccount.value ? minAmounts[selectedAccount.value.currencyCode] ?? 1 : 0)
const maxAmount = computed(() => selectedAccount.value ? selectedAccount.value.availableAmount ?? 0 : 0)
const isForeignAccount = computed(() => selectedAccount.value && selectedAccount.value.currencyCode !== 'KRW')

// 계좌 필터링 (수취인 기준)
const filteredAccounts = computed(() => {
  if (!accounts.value.length) return []
  const recipientCurrency = props.selectedRecipient?.currencyCode
  if (!recipientCurrency) return accounts.value.filter(acc => acc.currencyCode === 'KRW')
  return accounts.value.filter(acc => acc.currencyCode === 'KRW' || acc.currencyCode === recipientCurrency)
})

// -----------------------------
// 계좌 불러오기
// -----------------------------
const loadAccounts = async () => {
  try {
    const token = localStorage.getItem('accessToken')
    const res = await axios.get('/api/foreign-transfer/balances', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (Array.isArray(res.data?.balances)) accounts.value = res.data.balances

    // 최초 계좌 자동 선택
    if (accounts.value.length && !selectedAccountKey.value) {
      selectedAccountKey.value = accounts.value[0].accountNumber + '_' + accounts.value[0].currencyCode
    }
  } catch (e) {
    console.error('계좌 불러오기 실패', e)
  }
}

// -----------------------------
// 금액/환율 계산
// -----------------------------
const calculateTransfer = async () => {
  if (!selectedAccount.value) return

  if (transferAmount.value <= 0) {
    isInvalidAmount.value = true
    updateValidity()
    return
  }

  try {
    const token = localStorage.getItem('accessToken')
    const res = await axios.post(
        '/api/foreign-transfer/exchange',
        {
          fromCurrency: selectedAccount.value.currencyCode,
          toCurrency: props.selectedRecipient?.currencyCode,
          amount: transferAmount.value,
          accountType: isForeignAccount.value ? 'FOREIGN' : 'KRW'
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    )

    const data = res.data
    exchangeRateDisplay.value = Number(data.exchangeRate ?? 0)

    if (!isForeignAccount.value) {
      convertedAmount.value = Number(data.toAmount ?? 0)
      feeInKRW.value = Number(data.fee ?? 0)
      totalAmountKRW.value = Number(data.totalDeductedAmount ?? 0)
      totalAmountForeign.value = convertedAmount.value
    } else {
      convertedAmount.value = Number(data.toAmount ?? 0)
      feeInKRW.value = Number(data.fee ?? 0)
      totalAmountForeign.value = Number(data.totalDeductedAmount ?? transferAmount.value)
      totalAmountKRW.value = Number(data.totalDeductedAmountKRW ?? 0)
    }

    // 금액 유효성 체크
    isInvalidAmount.value = transferAmount.value < minAmount.value || totalAmountKRW.value > maxAmount.value
    updateValidity()
  } catch (e) {
    console.error('환율/수수료 계산 실패', e)
    convertedAmount.value = 0
    feeInKRW.value = 0
    totalAmountKRW.value = 0
    totalAmountForeign.value = 0
    exchangeRateDisplay.value = 0
    isInvalidAmount.value = true
    updateValidity()
  }
}

// -----------------------------
// 유효성 emit
// -----------------------------
const updateValidity = () => {
  const valid = !isInvalidAmount.value && accountPinLocal.value.length === 4
  emit('update:isValid', valid)
}

// -----------------------------
// 계좌 선택 감지
// -----------------------------
watch([selectedAccountKey, () => props.selectedRecipient, () => transferAmount.value], async () => {
  if (!accounts.value.length) return
  if (selectedAccountKey.value) {
    const [accNum, currency] = selectedAccountKey.value.split('_')
    selectedAccount.value = accounts.value.find(acc => acc.accountNumber === accNum && acc.currencyCode === currency) || null
  } else {
    selectedAccount.value = null
  }
  emit('update:selectedAccount', selectedAccount.value)
  if(selectedAccount.value) await calculateTransfer() // async로 처리
})

watch(accountPinLocal, val => {
  emit('update:accountPin', val)
  updateValidity()
})

// -----------------------------
// 초기 로딩
// -----------------------------
onMounted(async () => {
  await loadAccounts()
  if (selectedAccount.value) calculateTransfer()
})

// -----------------------------
// 외부 반환
// -----------------------------
const getWithdrawalData = () => ({
  amountInput: transferAmount.value,
  totalAmountKRW: totalAmountKRW.value,
  totalAmountForeign: totalAmountForeign.value,
  feeInCurrency: feeInKRW.value,
  convertedAmount: convertedAmount.value
})

defineExpose({ getWithdrawalData })
</script>

<style scoped>
.remit-info-section-v4 {
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  font-family: 'Pretendard Variable', sans-serif;
  color: #333;
}
.section-title-v4 {
  font-size: 26px;
  font-weight: 700;
  color: #008681;
  margin-bottom: 28px;
  display: flex;
  justify-content: center;
}
.info-table-v4 {
  background-color: #f8f8f8;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  margin-bottom: 30px;
}
.info-row-v4 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #eee;
}
.input-label-v4 {
  font-size: 15px;
  color: #666;
  font-weight: 500;
  flex-basis: 35%;
  flex-shrink: 0;
  text-align: left;
}
.input-field-v4 {
  flex-grow: 1;
  padding: 8px 12px;
  border: 1px solid #dcdcdc;
  border-radius: 6px;
  font-size: 16px;
  color: #333;
  width: auto;
  box-sizing: border-box;
  text-align: right;
}
.input-field-v4:focus {
  outline: none;
  border-color: #009b99;
  box-shadow: 0 0 0 3px rgba(61,153,112,0.1);
}
.invalid-amount {
  border-color: red !important;
  box-shadow: 0 0 0 3px rgba(255,0,0,0.1);
}
</style>
