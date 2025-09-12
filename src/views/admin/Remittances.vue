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
            :color="record.status === 'COMPLETED'
              ? 'green'
              : record.status === 'FAILED'
              ? 'red'
              : 'blue'"
          >
            {{ translateStatus(record.status) }}
          </a-tag>
        </span>

        <!-- 승인/거절 버튼 -->
        <span v-else-if="column.dataIndex === 'action'">
          <a-space>
            <a-button
              type="primary"
              size="small"
              @click="approve(record)"
              :disabled="record.status !== 'NOT_STARTED'"
            >
              승인
            </a-button>
            <a-button
              danger
              size="small"
              @click="reject(record)"
              :disabled="record.status !== 'NOT_STARTED'"
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
  { title: '고객명', dataIndex: 'customerName', key: 'customerName' },
  { title: '송금 금액', dataIndex: 'amount', key: 'amount' },
  { title: '외화', dataIndex: 'currency', key: 'currency' },
  { title: '제출 서류', dataIndex: 'documents', key: 'documents' },
  { title: '상태', dataIndex: 'status', key: 'status' },
  { title: '승인/거절', dataIndex: 'action', key: 'action' },
]

function translateStatus(status) {
  switch (status) {
    case 'NOT_STARTED': return '대기중'
    case 'IN_PROGRESS': return '처리중'
    case 'COMPLETED': return '승인완료'
    case 'FAILED': return '거절'
    default: return status
  }
}

// 송금 데이터 불러오기
async function fetchRemittances() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/admin/list')
    remittances.value = data
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
    content: `${record.customerName}님의 송금 요청을 승인하시겠습니까?`,
    async onOk() {
      try {
        await axios.post(`/api/admin/${record.id}/approve`, null, {
          params: { status: 'COMPLETED' }, // 필요하면 유지
        })
        message.success('승인 처리되었습니다.')
        await fetchRemittances()
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
    content: `${record.customerName}님의 송금 요청을 거절하시겠습니까?`,
    async onOk() {
      try {
        await axios.post(`/api/admin/${record.id}/reject`, null, {
          params: { status: 'FAILED' }, // 필요하면 유지
        })
        message.success('거절 처리되었습니다.')
        await fetchRemittances()
      } catch (err) {
        message.error('거절 실패')
        console.error(err)
      }
    },
  })
}

// 파일 다운로드
async function downloadFile(file) {
  try {
    const response = await axios.get(file.url, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.name); // 원본 이름으로 저장
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    message.success(`${file.name} 다운로드 시작`);
  } catch (err) {
    message.error(`${file.name} 다운로드 실패`);
    console.error(err);
  }
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
