<template>
  <div class="deposit-withdraw-history-container">
    <a-card title="충전 / 출금 내역" class="history-card">
      <!-- 필터 영역 -->
      <div class="filter-section">
        <a-row :gutter="16" align="middle">
          <a-col :span="8">
            <a-select
              v-model:value="filterType"
              placeholder="거래 유형"
              style="width: 100%"
              @change="handleFilterChange"
            >
              <a-select-option value="">전체</a-select-option>
              <a-select-option value="DEPOSIT">충전</a-select-option>
              <a-select-option value="withdraw">출금</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="8">
            <a-range-picker
              v-model:value="dateRange"
              style="width: 100%"
              @change="handleFilterChange"
            />
          </a-col>
          <a-col :span="8">
            <a-button type="primary" @click="resetFilters">
              초기화
            </a-button>
          </a-col>
        </a-row>
      </div>

      <!-- 요약 정보 -->
      <div class="summary-section">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-statistic
              title="총 충전 금액"
              :value="totalDeposit"
              suffix="원"
              :value-style="{ color: '#3f8600' }"
            />
          </a-col>
          <a-col :span="8">
            <a-statistic
              title="총 출금 금액"
              :value="totalWithdraw"              
              suffix="원"
              :value-style="{ color: '#cf1322' }"
            />
          </a-col>
          <a-col :span="8">
            <a-statistic
              title="순 입금액"
              :value="netAmount"
              suffix="원"
              :value-style="{ color: netAmount >= 0 ? '#3f8600' : '#cf1322' }"
            />
          </a-col>
        </a-row>
      </div>

      <!-- 거래 내역 테이블 -->
      <a-table
        :data-source="filteredtransaction"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        row-key="transactionId"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'transactionType'">
            <a-tag :color="getTypeColor(record.transactionType)">
              {{ getTypeText(record.transactionType) }}
            </a-tag>
          </template>
          
          <template v-else-if="column.key === 'amount'">
            <span :class="record.transactionType === 'DEPOSIT' ? 'amount-positive' : 'amount-negative'">
              {{ record.transactionType === 'DEPOSIT' ? '+' : '-' }}{{ formatCurrency(record.amount) }}원
            </span>
          </template>
          
          <template v-else-if="column.key === 'account_info'">
            <div class="account-info">
              <span class="from-account">{{ formatAccountName(record.fromAccount) }}</span>
              <ArrowRightOutlined class="arrow-icon" />
              <span class="to-account">{{ formatAccountName(record.toAccount) }}</span>
            </div>
          </template>
          
          <template v-else-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>
          
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="viewDetail(record)">
              상세보기
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 상세 보기 모달 -->
    <a-modal
      v-model:open="showDetailModal"
      title="거래 상세 정보"
      :footer="null"
      width="600px"
    >
      <div v-if="selectedTransaction" class="transaction-detail">
        <a-descriptions bordered :column="2">
          <a-descriptions-item label="거래 ID">
            {{ selectedTransaction.transactionId }}
          </a-descriptions-item>
          <a-descriptions-item label="거래 유형">
            <a-tag :color="getTypeColor(selectedTransaction.transactionType)">
              {{ getTypeText(selectedTransaction.transactionType) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="거래 금액">
            <span :class="selectedTransaction.transactionType === 'DEPOSIT' ? 'amount-positive' : 'amount-negative'">
              {{ selectedTransaction.transactionType === 'DEPOSIT' ? '+' : '-' }}{{ formatCurrency(selectedTransaction.amount) }}원
            </span>
          </a-descriptions-item>
          <a-descriptions-item label="수수료">
            {{ formatCurrency(selectedTransaction.feeAmount || 0) }}원
          </a-descriptions-item>
          <a-descriptions-item label="출금 계좌">
            {{ formatAccountName(selectedTransaction.fromAccount) }}
          </a-descriptions-item>
          <a-descriptions-item label="입금 계좌">
            {{ formatAccountName(selectedTransaction.toAccount) }}
          </a-descriptions-item>
          <a-descriptions-item label="거래 일시" :span="2">
            {{ formatDate(selectedTransaction.createdAt) }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ArrowRightOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import axios from 'axios'
import dayjs from 'dayjs'

const loading = ref(false)
const showDetailModal = ref(false)
const selectedTransaction = ref(null)

// 필터 상태
const filterType = ref('')
const dateRange = ref([])

// 데이터
const transaction = ref([])
const summary = ref({
  totalDeposit: 0,
  totalWithdraw: 0,
  netAmount: 0
})
const totalDeposit = computed(() => summary.value?.totalDeposit || 0)
const totalWithdraw = computed(() => summary.value?.totalWithdraw || 0)
const netAmount = computed(() => summary.value?.netAmount || 0)

// 페이지네이션
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `${range[0]}-${range[1]} / 총 ${total}건`
})

// 테이블 컬럼 정의
const columns = [
  {
    title: '거래일시',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
    sorter: true
  },
  {
    title: '거래유형',
    dataIndex: 'transactionType',
    key: 'transactionType',
    width: 100
  },
  {
    title: '계좌 정보',
    key: 'account_info',
    width: 250
  },
  {
    title: '거래금액',
    dataIndex: 'amount',
    key: 'amount',
    width: 150,
    align: 'right'
  },
  {
    title: '액션',
    key: 'action',
    width: 80,
    align: 'center'
  }
]

// API 호출 함수들
const fetchtransaction = async () => {
  try {
    loading.value = true
    
    const params = new URLSearchParams()
    if (filterType.value) params.append('type', filterType.value)
    if (dateRange.value && dateRange.value.length === 2) {
      params.append('startDate', dateRange.value[0].toISOString())
      params.append('endDate', dateRange.value[1].toISOString())
    }
    
    const response = await axios.get(`/api/transaction/deposit-withdraw-history?${params}`)
    
    // 데이터 정렬 - 최신 거래가 먼저 오도록
    const sortedData = response.data.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
    
    transaction.value = sortedData
    pagination.total = sortedData.length
    
    // 요약 정보 조회
    await fetchSummary()
    
  } catch (error) {
    console.error('거래 내역 조회 실패:', error)
    message.error('거래 내역을 불러오는데 실패했습니다.')
    
    // 에러 발생시 빈 데이터로 초기화
    transaction.value = []
    summary.value = {
      totalDeposit: 0,
      totalWithdraw: 0,
      netAmount: 0
    }
    pagination.total = 0
    
  } finally {
    loading.value = false
  }
}

const fetchSummary = async () => {
  try {
    const params = new URLSearchParams()
    if (filterType.value) params.append('type', filterType.value)
    if (dateRange.value && dateRange.value.length === 2) {
      params.append('startDate', dateRange.value[0].toISOString())
      params.append('endDate', dateRange.value[1].toISOString())
    }
    
    const response = await axios.get(`/api/transaction/deposit-withdraw-summary?${params}`)
    summary.value = response.data
    console.log('요약 정보:', summary.value)

  } catch (error) {
    console.error('요약 정보 조회 실패:', error)
    summary.value = {
      totalDeposit: 0,
      totalWithdraw: 0,
      netAmount: 0
    }
  }
}

// 필터링된 거래 내역 (페이지네이션용)
const filteredtransaction = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return transaction.value.slice(start, end)
})

// 유틸리티 메서드
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0'
  return new Intl.NumberFormat('ko-KR').format(amount)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 계좌명에서 앞의 "은행-" 부분 제거하는 함수
const formatAccountName = (accountName) => {
  if (!accountName) return ''
  
  // "은행-기업은행" -> "기업은행"
  if (accountName.includes('-')) {
    return accountName.split('-').pop()
  }
  
  return accountName
}

const getTypeColor = (type) => {
  return type === 'DEPOSIT' ? 'green' : 'red'
}

const getTypeText = (type) => {
  return type === 'DEPOSIT' ? '충전' : '출금'
}

// 이벤트 핸들러
const handleFilterChange = () => {
  pagination.current = 1
  fetchtransaction()
}

const resetFilters = () => {
  filterType.value = ''
  dateRange.value = []
  pagination.current = 1
  fetchtransaction()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

const viewDetail = (record) => {
  selectedTransaction.value = record
  showDetailModal.value = true
}

// 초기화
onMounted(() => {
  console.log('충전/출금 내역 컴포넌트 마운트됨')
  fetchtransaction()
})
</script>

<style scoped>
.deposit-withdraw-history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.history-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.summary-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #e6f7ff;
}

.account-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1.4;
  gap: 8px;
}

.from-account {
  color: #666;
  text-align: center;
  word-break: break-all;
  white-space: nowrap;
}

.to-account {
  color: #333;
  font-weight: 500;
  text-align: center;
  word-break: break-all;
  white-space: nowrap;
}

.arrow-icon {
  color: #1890ff;
  font-size: 14px;
  flex-shrink: 0;
}

.amount-positive {
  color: #52c41a;
  font-weight: bold;
}

.amount-negative {
  color: #ff4d4f;
  font-weight: bold;
}

.transaction-detail {
  margin-top: 16px;
}

/* Ant Design 컴포넌트 스타일 오버라이드 */
:deep(.ant-table-tbody > tr > td) {
  padding: 12px 8px;
  vertical-align: middle;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
}

:deep(.ant-statistic-content) {
  font-size: 24px;
  font-weight: 600;
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

:deep(.ant-descriptions-item-label) {
  font-weight: 600;
  background: #fafafa;
}

:deep(.ant-descriptions-item-content) {
  background: #fff;
}

:deep(.ant-card-head-title) {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

:deep(.ant-select-selector) {
  border-radius: 6px;
}

:deep(.ant-btn) {
  border-radius: 6px;
}

:deep(.ant-input) {
  border-radius: 6px;
}

:deep(.ant-picker) {
  border-radius: 6px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .deposit-withdraw-history-container {
    padding: 10px;
  }
  
  .filter-section .ant-row {
    flex-direction: column;
  }
  
  .filter-section .ant-col {
    width: 100% !important;
    margin-bottom: 8px;
  }
  
  .summary-section .ant-row {
    flex-direction: column;
  }
  
  .summary-section .ant-col {
    width: 100% !important;
    margin-bottom: 16px;
  }
  
  :deep(.ant-statistic-content) {
    font-size: 20px;
  }
  
  .account-info {
    font-size: 10px;
    gap: 4px;
  }
  
  :deep(.ant-table-tbody > tr > td) {
    padding: 8px 4px;
  }
}

/* 테이블 행 hover 효과 */
:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f5f5 !important;
}

/* 로딩 상태 스타일 */
:deep(.ant-table-loading .ant-table-tbody > tr > td) {
  background: transparent;
}

/* 빈 상태 스타일 */
:deep(.ant-empty) {
  padding: 40px 0;
}

:deep(.ant-empty-description) {
  color: #999;
}

/* 페이지네이션 스타일 */
:deep(.ant-pagination) {
  margin-top: 20px;
  text-align: center;
}

:deep(.ant-pagination-options) {
  margin-left: 16px;
}
</style>
