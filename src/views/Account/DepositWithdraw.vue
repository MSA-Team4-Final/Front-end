<template>
  <div class="deposit-withdraw-container">
    <a-card title="입금 / 출금" class="main-card">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <!-- 입금 탭 -->
        <a-tab-pane key="deposit" tab="입금">
          <a-form :model="depositForm" :rules="depositRules" ref="depositFormRef" layout="vertical"
            @finish="handleDeposit">
            <a-form-item label="입금할 외부 계좌">
              <a-input
                :value="primaryAccount ? `${primaryAccount.bankName} ${primaryAccount.accountNumber}` : '등록된 주계좌가 없습니다'"
                disabled />
              <div class="account-balance" v-if="primaryAccount">
                잔액: {{ formatCurrency(primaryAccount.balance) }}원
              </div>
              <div class="no-account-warning" v-else>
                입금을 위해서는 주계좌를 등록해주세요.
              </div>
            </a-form-item>

            <a-form-item label="입금될 계좌">
              <a-input value="내 KRW 원화 계좌" disabled />
              <div class="account-balance">
                현재 잔액: {{ krwBalance }}원
              </div>
            </a-form-item>

            <a-form-item label="입금 금액" name="amount">
              <a-input-number v-model:value="depositForm.amount" :min="1000"
                :max="primaryAccount ? Math.min(5000000, primaryAccount.balance) : 0" :step="1000"
                placeholder="입금할 금액을 입력하세요" style="width: 100%" :disabled="!primaryAccount"
                :formatter="value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                :parser="value => value.replace(/\$\s?|(,*)/g, '')" />
              <div class="amount-buttons" v-if="primaryAccount">
                <a-button v-for="amount in getAvailableAmounts" :key="amount" size="small"
                  @click="depositForm.amount = amount">
                  +{{ formatCurrency(amount) }}
                </a-button>
              </div>
            </a-form-item>

            <a-form-item label="거래 비밀번호" name="transactionPassword">
              <a-input-password v-model:value="depositForm.transactionPassword" placeholder="거래 비밀번호 4자리를 입력하세요"
                maxlength="4" :disabled="!primaryAccount" />
            </a-form-item>

            <a-form-item>
              <a-button type="primary" html-type="submit" size="large" :loading="depositLoading"
                :disabled="!primaryAccount" block>
                {{ primaryAccount ? `${formatCurrency(depositForm.amount || 0)}원 입금하기` : '주계좌를 등록해주세요' }}
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- 출금 탭 -->
        <a-tab-pane key="withdraw" tab="출금">
          <a-form :model="withdrawForm" :rules="withdrawRules" ref="withdrawFormRef" layout="vertical"
            @finish="handleWithdraw">
            <a-form-item label="출금할 계좌">
              <a-input value="내 KRW 원화 계좌" disabled />
              <div class="account-balance">
                현재 잔액: {{ krwBalance }}원
              </div>
            </a-form-item>

            <a-form-item label="입금받을 외부 계좌">
              <a-input
                :value="primaryAccount ? `${primaryAccount.bankName} ${primaryAccount.accountNumber} (${primaryAccount.accountHolder})` : '등록된 주계좌가 없습니다'"
                disabled />
              <div class="no-account-warning" v-if="!primaryAccount">
                출금을 위해서는 주계좌를 등록해주세요.
              </div>
            </a-form-item>

            <a-form-item label="출금 금액" name="amount">
              <a-input-number v-model:value="withdrawForm.amount" :min="1000" :max="krwBalance" :step="1000"
                placeholder="출금할 금액을 입력하세요" style="width: 100%" :disabled="!primaryAccount"
                :formatter="value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                :parser="value => value.replace(/\$\s?|(,*)/g, '')" />
              <div class="amount-buttons" v-if="primaryAccount">
                <a-button v-for="amount in quickAmounts" :key="amount" size="small"
                  @click="withdrawForm.amount = amount" :disabled="amount > krwBalance">
                  +{{ formatCurrency(amount) }}
                </a-button>
                <a-button size="small" @click="withdrawForm.amount = krwBalance">
                  전액
                </a-button>
              </div>
            </a-form-item>

            <a-row :gutter="16" v-if="primaryAccount">
              <a-col :span="12">
                <a-form-item label="수수료">
                  <div class="fee-info">
                    {{ formatCurrency(withdrawalFee) }}원
                    <span class="fee-note">(출금 수수료)</span>
                  </div>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="실제 출금액">
                  <div class="final-amount">
                    {{ formatCurrency(Math.max(0, (withdrawForm.amount || 0) - withdrawalFee)) }}원
                  </div>
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="거래 비밀번호" name="transactionPassword">
              <a-input-password v-model:value="withdrawForm.transactionPassword" placeholder="거래 비밀번호 4자리를 입력하세요"
                maxlength="4" :disabled="!primaryAccount" />
            </a-form-item>

            <a-form-item>
              <a-button type="primary" html-type="submit" size="large" :loading="withdrawLoading"
                :disabled="!primaryAccount" block danger>
                {{ primaryAccount ? `${formatCurrency(withdrawForm.amount || 0)}원 출금하기` : '주계좌를 등록해주세요' }}
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 외부 계좌 관리 -->
    <a-card title="외부 계좌 관리" class="account-management-card" style="margin-top: 24px;">
      <a-alert message="주계좌 시스템 안내" description="보안을 위해 입금과 출금은 주계좌로만 가능합니다. 최대 3개까지 등록하고 그 중 하나를 주계좌로 설정해주세요."
        type="warning" show-icon style="margin-bottom: 16px;" />

      <a-button type="dashed" @click="openAddAccountModal" :disabled="externalAccounts.length >= 3" block>
        <PlusOutlined />
        새 외부 계좌 등록
        {{ externalAccounts.length >= 3 ? ' (최대 3개)' : ` (${externalAccounts.length}/3)` }}
      </a-button>

      <div class="external-accounts-list" v-if="externalAccounts.length > 0">
        <a-list :data-source="externalAccounts" item-layout="horizontal">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <div class="account-title">
                    {{ item.bankName }} {{ item.accountNumber }}
                    <a-tag v-if="item.isPrimary" color="red">주계좌 (입금/출금 전용)</a-tag>
                    <a-tag v-else color="gray">보조계좌</a-tag>
                  </div>
                </template>
                <template #description>
                  <div class="account-description">
                    <div>예금주: {{ item.accountHolder }}</div>
                    <div>잔액: {{ formatCurrency(item.balance) }}원</div>
                    <div class="account-date">등록일: {{ formatDate(item.createdAt) }}</div>
                    <div v-if="item.isPrimary" class="primary-note">
                      ※ 이 계좌로만 입금과 출금이 가능합니다
                    </div>
                  </div>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-button v-if="!item.isPrimary" size="small" type="primary" @click="setPrimaryAccount(item.accountId)"
                  :loading="primaryLoading === item.accountId">
                  주계좌로 설정
                </a-button>
                <a-tooltip v-if="item.isPrimary && externalAccounts.length > 1"
                  title="주계좌를 삭제하려면 다른 계좌를 주계좌로 변경한 후 삭제해주세요.">
                  <a-button size="small" danger disabled>삭제 불가</a-button>
                </a-tooltip>
                <a-popconfirm v-else :title="getDeleteConfirmMessage(item)" ok-text="삭제" cancel-text="취소"
                  @confirm="deleteAccount(item.accountId)">
                  <a-button size="small" danger :loading="deleteLoading === item.accountId">
                    삭제
                  </a-button>
                </a-popconfirm>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </div>

      <a-empty v-else description="등록된 외부 계좌가 없습니다">
        <template #image>
          <BankOutlined style="font-size: 48px; color: #ccc;" />
        </template>
      </a-empty>
    </a-card>

    <!-- 계좌 추가 모달 -->
    <a-modal v-model:open="showAddAccountModal" title="외부 계좌 등록" @ok="handleAddAccount"
      :confirm-loading="addAccountLoading" width="500px">
      <a-form :model="newAccountForm" :rules="newAccountRules" ref="newAccountFormRef" layout="vertical">
        <a-form-item label="은행 선택" name="bankCode">
          <a-select v-model:value="newAccountForm.bankCode" placeholder="은행을 선택하세요" show-search
            :filter-option="filterBankOption" :loading="bankLoading">
            <a-select-option v-for="bank in banks" :key="bank.code" :value="bank.code">
              {{ bank.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="계좌번호" name="accountNumber">
          <a-input v-model:value="newAccountForm.accountNumber" placeholder="계좌번호를 입력하세요 (하이픈 포함)" maxlength="20" />
        </a-form-item>

        <a-form-item label="예금주명" name="accountHolder">
          <a-input v-model:value="newAccountForm.accountHolder" placeholder="예금주명을 입력하세요" maxlength="10" />
        </a-form-item>

        <a-form-item label="초기 잔액" name="balance">
          <a-input-number v-model:value="newAccountForm.balance" :min="0" :max="100000000" placeholder="초기 잔액"
            style="width: 100%" :formatter="value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
            :parser="value => value.replace(/\$\s?|(,*)/g, '')" />
        </a-form-item>

        <a-form-item name="isPrimary">
          <a-checkbox v-model:checked="newAccountForm.isPrimary">
            주계좌로 설정 (입금/출금에 사용)
            <span v-if="externalAccounts.length === 0" style="color: #ff4d4f; margin-left: 8px;">
              ※ 첫 계좌는 자동으로 주계좌가 됩니다
            </span>
          </a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, BankOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import axios from 'axios'

// API Base URL
const API_BASE_URL = '/api'

// Loading states
const activeTab = ref('deposit')
const depositLoading = ref(false)
const withdrawLoading = ref(false)
const showAddAccountModal = ref(false)
const addAccountLoading = ref(false)
const primaryLoading = ref(null)
const deleteLoading = ref(null)
const bankLoading = ref(false)

// Data
const krwBalance = ref(0)
const externalAccounts = ref([])
const banks = ref([])

// Constants
const quickAmounts = [10000, 50000, 100000, 500000, 1000000]
const withdrawalFee = 1000

// Computed
const primaryAccount = computed(() => {
  return externalAccounts.value.find(acc => acc.isPrimary) || null
})

const getAvailableAmounts = computed(() => {
  if (!primaryAccount.value) return []

  const balance = primaryAccount.value.balance
  if (typeof balance !== 'number' || isNaN(balance)) return []

  return quickAmounts.filter(amount => amount <= primaryAccount.value.balance)
})

// Forms
const depositForm = reactive({
  amount: null,
  transactionPassword: ''
})

const withdrawForm = reactive({
  amount: null,
  transactionPassword: ''
})

const newAccountForm = reactive({
  bankCode: null,
  accountNumber: '',
  accountHolder: '',
  balance: 1000000,
  isPrimary: false
})

// Validation Rules
const depositRules = {
  amount: [
    { required: true, message: '입금 금액을 입력하세요' },
    { type: 'number', min: 1000, message: '최소 입금 금액은 1,000원입니다' },
    { type: 'number', max: 5000000, message: '최대 입금 금액은 5,000,000원입니다' }
  ],
  transactionPassword: [
    { required: true, message: '거래 비밀번호를 입력하세요' },
    { len: 4, message: '거래 비밀번호는 4자리입니다' }
  ]
}

const withdrawRules = {
  amount: [
    { required: true, message: '출금 금액을 입력하세요' },
    { type: 'number', min: 1000, message: '최소 출금 금액은 1,000원입니다' }
  ],
  transactionPassword: [
    { required: true, message: '거래 비밀번호를 입력하세요' },
    { len: 4, message: '거래 비밀번호는 4자리입니다' }
  ]
}

const newAccountRules = {
  bankCode: [{ required: true, message: '은행을 선택하세요' }],
  accountNumber: [
    { required: true, message: '계좌번호를 입력하세요' },
    { pattern: /^[\d-]+$/, message: '올바른 계좌번호 형식이 아닙니다' }
  ],
  accountHolder: [{ required: true, message: '예금주명을 입력하세요' }],
  balance: [
    { required: true, message: '초기 잔액을 입력하세요' },
    { type: 'number', min: 0, message: '잔액은 0원 이상이어야 합니다' }
  ]
}

// API Functions
const fetchKrwBalance = async () => {
  try {
    // 전체 잔액에서 KRW 추출
    const response = await axios.get(`${API_BASE_URL}/balance`)
    if (response.data.success && response.data.balances && response.data.balances.KRW) {
      krwBalance.value = response.data.balances.KRW.amount
      console.log(krwBalance.value)
    }
  } catch (error) {
    console.error('KRW 잔액 조회 실패:', error)
    message.error('잔액 조회에 실패했습니다.')
  }
}

const fetchExternalAccounts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/external-accounts`)
    externalAccounts.value = response.data
  } catch (error) {
    console.error('외부 계좌 목록 조회 실패:', error)
    message.error('외부 계좌 목록 조회에 실패했습니다.')
  }
}

const fetchAllBanks = async () => {
  try {
    bankLoading.value = true
    const response = await axios.get(`${API_BASE_URL}/bank`) // 모든 은행
    banks.value = response.data
  } catch (error) {
    console.error('은행 목록 조회 실패:', error)
    message.error('은행 목록 조회에 실패했습니다.')
  } finally {
    bankLoading.value = false
  }
}

const fetchMyActiveBanks = async () => {
  try {
    bankLoading.value = true
    const response = await axios.get(`${API_BASE_URL}/bank/my-banks`) // 내 활성 은행만
    banks.value = response.data
  } catch (error) {
    console.error('내 은행 목록 조회 실패:', error)
    message.error('내 은행 목록 조회에 실패했습니다.')
  } finally {
    bankLoading.value = false
  }
}

// Event Handlers
const openAddAccountModal = async () => {
  showAddAccountModal.value = true
  // 계좌 등록 시에는 모든 은행 목록 필요
  await fetchAllBanks()
}

const handleDeposit = async (values) => {
  if (!primaryAccount.value) {
    message.error('주계좌가 등록되지 않았습니다.')
    return
  }

  depositLoading.value = true
  try {
    const response = await axios.post(`${API_BASE_URL}/deposit-withdraw/deposit`, {
      amount: values.amount,
      transactionPassword: values.transactionPassword
    })

    message.success(`${formatCurrency(values.amount)}원이 입금되었습니다.`)

    // 데이터 새로고침
    await fetchKrwBalance()
    await fetchExternalAccounts()

    // 폼 초기화
    depositForm.amount = null
    depositForm.transactionPassword = ''
  } catch (error) {
    console.error('입금 실패:', error)
    const errorMessage = error.response?.data?.message || '입금 중 오류가 발생했습니다.'
    message.error(errorMessage)
  } finally {
    depositLoading.value = false
  }
}

const handleWithdraw = async (values) => {
  if (!primaryAccount.value) {
    message.error('주계좌가 등록되지 않았습니다.')
    return
  }

  withdrawLoading.value = true
  try {
    const response = await axios.post(`${API_BASE_URL}/deposit-withdraw/withdraw`, {
      amount: values.amount,
      transactionPassword: values.transactionPassword
    })

    const finalAmount = values.amount - withdrawalFee
    message.success(`${formatCurrency(finalAmount)}원이 출금되었습니다. (수수료: ${formatCurrency(withdrawalFee)}원)`)

    // 데이터 새로고침
    await fetchKrwBalance()
    await fetchExternalAccounts()

    // 폼 초기화
    withdrawForm.amount = null
    withdrawForm.transactionPassword = ''
  } catch (error) {
    console.error('출금 실패:', error)
    const errorMessage = error.response?.data?.message || '출금 중 오류가 발생했습니다.'
    message.error(errorMessage)
  } finally {
    withdrawLoading.value = false
  }
}

const handleAddAccount = async () => {
  try {
    await newAccountFormRef.value.validate()

    addAccountLoading.value = true

    const response = await axios.post(`${API_BASE_URL}/external-accounts`, {
      bankCode: newAccountForm.bankCode,
      accountNumber: newAccountForm.accountNumber,
      accountHolder: newAccountForm.accountHolder,
      balance: newAccountForm.balance,
      isPrimary: newAccountForm.isPrimary
    })

    message.success('외부 계좌가 등록되었습니다.')
    showAddAccountModal.value = false

    // 데이터 새로고침
    await fetchExternalAccounts()
    await fetchMyActiveBanks() // 내 활성 은행 목록도 새로고침

    // 폼 초기화
    newAccountForm.bankCode = null
    newAccountForm.accountNumber = ''
    newAccountForm.accountHolder = ''
    newAccountForm.balance = 1000000
    newAccountForm.isPrimary = false
  } catch (error) {
    console.error('계좌 등록 실패:', error)
    const errorMessage = error.response?.data?.message || '계좌 등록 중 오류가 발생했습니다.'
    message.error(errorMessage)
  } finally {
    addAccountLoading.value = false
  }
}

const setPrimaryAccount = async (accountId) => {
  try {
    primaryLoading.value = accountId

    const response = await axios.put(`${API_BASE_URL}/external-accounts/${accountId}/set-primary`)

    message.success('주계좌가 변경되었습니다.')

    // 데이터 새로고침
    await fetchExternalAccounts()
  } catch (error) {
    console.error('주계좌 설정 실패:', error)
    const errorMessage = error.response?.data?.message || '주계좌 설정 중 오류가 발생했습니다.'
    message.error(errorMessage)
  } finally {
    primaryLoading.value = null
  }
}

const deleteAccount = async (accountId) => {
  try {
    deleteLoading.value = accountId

    const response = await axios.delete(`${API_BASE_URL}/external-accounts/${accountId}`)

    message.success('외부 계좌가 삭제되었습니다.')

    // 데이터 새로고침
    await fetchExternalAccounts()
    await fetchMyActiveBanks() // 내 활성 은행 목록도 새로고침
  } catch (error) {
    console.error('계좌 삭제 실패:', error)
    const errorMessage = error.response?.data?.message || '계좌 삭제 중 오류가 발생했습니다.'
    message.error(errorMessage)
  } finally {
    deleteLoading.value = null
  }
}

// Utility Functions
const formatCurrency = (amount) => {
  if (amount == null || amount === '' || isNaN(amount)) return '0'
  // 숫자가 아닌 경우 숫자로 변환
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  // 변환 후에도 NaN인 경우
  if (isNaN(numAmount)) return '0'

  return new Intl.NumberFormat('ko-KR').format(numAmount)
}

const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm')
}

const filterBankOption = (input, option) => {
  return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

const getDeleteConfirmMessage = (account) => {
  if (externalAccounts.value.length === 1) {
    return '마지막 계좌를 삭제하면 입금/출금이 불가능해집니다. 정말 삭제하시겠습니까?'
  }
  return '정말로 이 계좌를 삭제하시겠습니까?'
}

// Refs
const depositFormRef = ref()
const withdrawFormRef = ref()
const newAccountFormRef = ref()

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchKrwBalance(),
    fetchExternalAccounts(),
    fetchMyActiveBanks() // 초기 로드 시에는 내 활성 은행만
  ])
})
</script>

<style scoped>
.deposit-withdraw-container {
  max-width: 800px;
  margin: 0 auto;
}

.main-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.account-balance {
  font-size: 12px;
  color: #1890ff;
  margin-top: 4px;
  font-weight: 500;
}

.no-account-warning {
  font-size: 12px;
  color: #ff4d4f;
  margin-top: 4px;
  font-weight: 500;
}

.amount-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.fee-info {
  font-size: 14px;
  color: #ff4d4f;
  font-weight: 500;
}

.fee-note {
  color: #666;
  font-size: 12px;
  margin-left: 4px;
}

.final-amount {
  font-size: 16px;
  font-weight: bold;
  color: #1890ff;
}

.account-management-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.external-accounts-list {
  margin-top: 16px;
}

.account-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-description {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-date {
  font-size: 11px;
  color: #999;
}

.primary-note {
  font-size: 11px;
  color: #ff4d4f;
  font-weight: 500;
}

:deep(.ant-tabs-card .ant-tabs-tab) {
  border-radius: 6px 6px 0 0;
}

:deep(.ant-input-number) {
  width: 100%;
}

:deep(.ant-select-selection-item) {
  font-size: 13px;
}

:deep(.ant-list-item-meta-description) {
  color: #666;
}

:deep(.ant-btn[disabled]) {
  opacity: 0.6;
}

:deep(.ant-input[disabled]) {
  background-color: #f5f5f5;
  color: #666;
}
</style>
