<template>
  <div class="inquiry-page">
    <div class="inquiry-wrap">
      <div class="inquiry-card">
        <div class="inquiry-header">
          <h3>1:1 문의</h3>
          <a-button type="primary" @click="goToInquiryWrite()">문의하기</a-button>
        </div>

        <a-table
          :loading="loading"
          :columns="columns"
          :data-source="rows"
          :row-key="rowKey"
          :pagination="pagination"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <a-typography-link
                :style="{cursor: record.status === 'WITHDRAW' ? 'not-allowed' : 'pointer', color: record.status === 'WITHDRAW' ? '#999' : '' }"
                @click.stop="handleTitleClick(record)">
                {{ record.title }}
              </a-typography-link>
            </template>

            <template v-else-if="column.key === 'status'">
              <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
            </template>
          </template>
        </a-table>
      </div>
    </div>
  </div>

   <a-modal
    v-model:open="detailOpen"
    title="문의 내용"
    :footer="null"
    @cancel="closeDetail"
    :destroyOnClose="true"
    :maskClosable="true"
    :centered="true"
    :width="680"
    wrapClassName="inquiry-detail-modal"
  >
    <a-skeleton :loading="detailLoading" active :paragraph="{ rows: 6 }">
      <div v-if="detail" class="detail-container">
        <div class="detail-head">
          <div class="title-row">
            <span class="detail-title">{{ detail.title }}</span>
            <a-tag class="detail-status" :color="statusColor(detail.status)">
              {{ statusLabel(detail.status) }}
            </a-tag>
            <div class="spacer"></div>

            <!-- 철회 버튼 -->
            <a-button
              v-if="canWithdraw(detail)"
              danger
              :loading="withdrawLoading"
              @click="confirmWithdraw(detail.id)"
              size="small"
            >철회</a-button>
          </div>

          <div class="meta-row">
            <CalendarOutlined />
            <span class="meta-date">{{ formatDate(detail.createdAt) }}</span>
            <a-divider type="vertical" />
          </div>
        </div>

        <a-divider class="detail-divider" />
        <div class="detail-content">{{ detail.content }}</div>

        <!-- 답변 토글/보기 -->
        <div class="answer-actions" v-if="canShowAnswerButton(detail)">
          <a-button type="default" @click="toggleAnswer(detail.id)" :loading="answerLoading" size="small">
            {{ answerOpen ? '답변 숨기기' : '답변 보기' }}
          </a-button>
        </div>

        <a-spin :spinning="answerLoading">
          <div v-if="answerOpen && answer" class="answer-box">
            <div class="answer-meta">
              관리자 답변 · {{ formatDate(answer.createdAt) }}
            </div>
            <div class="answer-content">
              {{ answer.content }}
            </div>
          </div>
        </a-spin>
      </div>
    </a-skeleton>
  </a-modal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { CalendarOutlined } from '@ant-design/icons-vue'
import { Modal, message } from 'ant-design-vue'

const router = useRouter()

const goToInquiryWrite = () => router.push('/inquiry/write')

const columns = [
  { title: '번호', dataIndex: 'number', key: 'number', width: 100 },
  { title: '제목', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '상태', dataIndex: 'status', key: 'status', width: 120 },
  { title: '등록일', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
]

const loading = ref(false)
const rows = ref([])
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total) => `총 ${total}건`,
})

const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref(null)

const answerOpen = ref(false)
const answerLoading = ref(false)
const answer = ref(null)

const withdrawLoading = ref(false)

const rowKey = (record) => record.id

function statusColor(s) {
  if (s === 'ANSWERED') return 'success'
  if (s === 'WITHDRAW') return 'error'
  return 'default' // REGISTERED
}
function statusLabel(s) {
  if (s === 'ANSWERED') return '답변완료'
  if (s === 'WITHDRAW') return '철회됨'
  return '접수'
}
function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function fetchData() {
  loading.value = true
  try {
    const res = await axios.get('/api/inquiries/list', {
      params: {
        page: pagination.value.current - 1,
        size: pagination.value.pageSize,
        sort: 'createdAt,desc'
      },
    })
    const content = res.data?.content ?? []
    const total   = res.data?.totalElements ?? content.length

    rows.value = content.map((it, index) => ({
      id: it.id,
      number: index + 1,
      title: it.title,
      status: it.status,
      createdAt: formatDate(it.createdAt),
    }))
    pagination.value = { ...pagination.value, total }
  } catch (e) {
    console.error(e)
    message.error('문의 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

function handleTitleClick(record) {
  if (record.status === 'WITHDRAW') {
    message.info('철회된 문의는 열람할 수 없습니다.')
    return
  }
  openDetail(record.id)
}

function handleTableChange(pag) {
  pagination.value = { ...pagination.value, current: pag.current, pageSize: pag.pageSize }
  fetchData()
}

async function openDetail(id) {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null
  answerOpen.value = false
  answer.value = null
  try {
    const { data } = await axios.get(`/api/inquiries/${id}`)
    detail.value = data
  } catch (e) {
    console.error(e)
    message.error('문의 상세 내역을 불러오지 못했습니다.')
    detailOpen.value = false
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  detailOpen.value = false
  detail.value = null
  answerOpen.value = false
  answer.value = null
}

function canShowAnswerButton(d) {
  if (!d) return false
  if (typeof d.hasAnswer === 'boolean') return d.hasAnswer
  return d.status === 'ANSWERED'
}

function canWithdraw(d) {
  if (!d) return false
  const deleted = d.deleted === true
  const isOpen = d.status === 'REGISTERED'
  return isOpen && !deleted
}

async function toggleAnswer(id) {
  if (!answerOpen.value) {
    answerLoading.value = true
    try {
      const { data } = await axios.get(`/api/inquiries/${id}/answer`)
      answer.value = data
      answerOpen.value = true
    } catch (e) {
      if (e?.response?.status === 404) {
        message.info('등록된 답변이 없습니다.')
      } else {
        message.error('답변을 불러오지 못했습니다.')
      }
      answer.value = null
      answerOpen.value = false
    } finally {
      answerLoading.value = false
    }
  } else {
    // 닫기
    answerOpen.value = false
  }
}

function confirmWithdraw(id) {
  Modal.confirm({
    title: '문의 철회',
    content: '관리자 답변 전까지만 철회할 수 있습니다. 진행하시겠습니까?',
    okText: '철회',
    okType: 'danger',
    cancelText: '취소',
    onOk: async () => {
      withdrawLoading.value = true
      try {
        await axios.post(`/api/inquiries/${id}/withdraw`)
        message.success('문의가 철회되었습니다.')
        closeDetail()
        fetchData()
      } catch (e) {
        const msg = e?.response?.data?.message || '철회에 실패했습니다.'
        message.error(msg)
      } finally {
        withdrawLoading.value = false
      }
    }
  })
}

onMounted(fetchData)
</script>

<style scoped>
.inquiry-page { 
  width: 100%; 
  background: transparent; 
  background-color: #f0f2f5;
  padding-top: 20px;
}
.inquiry-wrap { 
  width: 100%; 
  padding: 0; 
  margin: 0; 
}
.inquiry-card { 
  width: 60%; 
  margin: 20px auto;
  height: calc(100vh - 40px); 
  max-width: 900px; 
  min-width: 320px;
  display: flex;
  flex-direction: column; 
  background: #fff; 
  border-radius: 16px; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.06); 
  padding: 24px 24px 16px; 
  box-sizing: border-box;
}
.inquiry-header{ 
  width: 100%; 
  display:flex; 
  align-items:center; 
  justify-content:space-between; 
  margin-bottom: 12px; 
}
.inquiry-title{ 
  margin: 0; 
  font-weight: 700; 
  font-size: 20px; 
  color: #101828; 
}

:deep(.main-content) { 
  padding: 0; 
  background: transparent;
 }
:global(.inquiry-detail-modal .ant-modal-content){
  border-radius: 18px;
 }
:global(.inquiry-detail-modal .ant-modal-header){
   border-bottom: none; 
   padding-bottom: 0; 
  }
:global(.inquiry-detail-modal .ant-modal-body){ 
  height: 60vh; 
  overflow-y: auto; 
  padding: 16px 20px;
 }

.detail-title { 
  font-weight:700; 
  font-size:18px; 
  color:#101828; 
}
.title-row { 
  display:flex; 
  align-items:center; 
  gap:8px; 
}
.title-row .spacer { 
  flex: 1; 
}
.meta-row { 
  color:#667085; 
  margin-top:4px; 
}
.meta-id { 
  font-variant-numeric: tabular-nums;
 }
.detail-divider { 
  margin:12px 0; 
}
.detail-content { 
  white-space:pre-wrap; 
  word-break:break-word; 
  line-height:1.7; 
  color:#344054;
 }

.answer-actions { 
  margin-top: 12px;
 }
.answer-box { 
  margin-top: 10px; 
  background:#f7f9fc; 
  border:1px solid #edf1f7; 
  border-radius:12px; 
  padding:12px 14px; 
}
.answer-meta { 
  font-size: 12px; 
  color:#667085; 
  margin-bottom: 6px; 
}
.answer-content { 
  white-space: pre-wrap; 
  word-break: break-word; 
  color:#1f2937; 
}

@media (max-width: 768px) {
  :global(.inquiry-detail-modal .ant-modal-body){ 
    height: 70vh; 
  }
}
</style>