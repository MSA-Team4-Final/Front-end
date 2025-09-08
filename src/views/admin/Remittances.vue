<template>
  <div class="remittance-page">
    <h2>송금 관리</h2>
    <a-table
      :columns="columns"
      :data-source="remittances"
      row-key="id"
      :loading="loading"
      bordered
      :scroll="{ x: 900 }"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- NO -->
        <span v-if="column.dataIndex === 'no'">
          {{ index + 1 }}
        </span>

        <!-- 제출 서류 -->
        <span v-else-if="column.dataIndex === 'documents'">
          <ul>
            <li v-for="(doc, idx) in record.documents" :key="idx">
              {{ doc.name }}
              <a-button
                type="link"
                size="small"
                @click="downloadFile(doc)"
              >
                다운로드
              </a-button>
            </li>
          </ul>
        </span>

        <!-- 상태 -->
        <span v-else-if="column.dataIndex === 'status'">
          <a-tag
            :color="record.status === '승인완료'
              ? 'green'
              : record.status === '거절'
              ? 'red'
              : 'blue'"
          >
            {{ record.status }}
          </a-tag>
        </span>

        <!-- 승인/거절 버튼 -->
        <span v-else-if="column.dataIndex === 'action'">
          <a-space>
            <a-button
              type="primary"
              size="small"
              @click="approve(record)"
              :disabled="record.status !== '대기중'"
            >
              승인
            </a-button>
            <a-button
              danger
              size="small"
              @click="reject(record)"
              :disabled="record.status !== '대기중'"
            >
              거절
            </a-button>
          </a-space>
        </span>

        <span v-else>{{ record[column.dataIndex] }}</span>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import axios from 'axios'

const loading = ref(false)
const remittances = ref([])

const columns = [
  { title: 'NO', dataIndex: 'no', key: 'no' },
  { title: '고객명', dataIndex: 'customer', key: 'customer' },
  { title: '송금 금액', dataIndex: 'amount', key: 'amount' },
  { title: '외화', dataIndex: 'foreign', key: 'foreign' },
  { title: '제출 서류', dataIndex: 'documents', key: 'documents' },
  { title: '상태', dataIndex: 'status', key: 'status' },
  { title: '승인/거절', dataIndex: 'action', key: 'action' },
]

// 임시 데이터
async function fetchRemittances() {
  loading.value = true
  try {
    remittances.value = [
      {
        id: 1,
        customer: '홍길동',
        amount: 5000,
        foreign: 'USD',
        documents: [
          { name: '여권 사본.pdf', url: '/files/passport_hong.pdf' },
          { name: '송금 사유서.pdf', url: '/files/reason_hong.pdf' },
        ],
        status: '대기중',
      },
      {
        id: 2,
        customer: '김철수',
        amount: 12000,
        foreign: 'EUR',
        documents: [
          { name: '여권 사본.pdf', url: '/files/passport_kim.pdf' },
          { name: '거래명세서.pdf', url: '/files/statement_kim.pdf' },
          { name: '소득증명서.pdf', url: '/files/income_kim.pdf' },
        ],
        status: '대기중',
      },
    ]
  } catch (err) {
    message.error('송금 요청 데이터를 불러오는 데 실패했습니다.')
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 승인
async function approve(record) {
  Modal.confirm({
    title: '승인 처리',
    content: `${record.customer}님의 송금 요청을 승인하시겠습니까?`,
    async onOk() {
      try {
        record.status = '승인완료'
        message.success('승인 처리되었습니다.')
      } catch (err) {
        message.error('승인 실패')
        console.error(err)
      }
    },
  })
}

// 거절
async function reject(record) {
  Modal.confirm({
    title: '거절 처리',
    content: `${record.customer}님의 송금 요청을 거절하시겠습니까?`,
    async onOk() {
      try {
        record.status = '거절'
        message.error('거절 처리되었습니다.')
      } catch (err) {
        message.error('거절 실패')
        console.error(err)
      }
    },
  })
}

// 파일 다운로드
function downloadFile(file) {
  // 실제 서버 API 연결 시 axios.get(file.url, { responseType: 'blob' }) 사용 가능
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.name
  link.click()
  message.success(`${file.name} 다운로드 시작`)
}

onMounted(fetchRemittances)
</script>

<style scoped>
.remittance-page {
  padding: 16px;
  background-color: #f6f7fb;
}
:deep(.ant-table-tbody > tr > td) {
  padding: 12px 8px;
}
:deep(.ant-table-thead > tr > th) {
  background-color: #f9fafb;
  font-weight: 600;
  color: #475467;
}
</style>