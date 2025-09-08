<template>
  <div class="admin-dashboard">
    <div class="page-head">
      <div class="title-wrap">
        <h2 class="title">Dashboard</h2>
        <a-radio-group v-model="quickRange" size="small" @change="onQuickRangeChange">
          <a-radio-button v-for="r in quickRanges" :key="r.value" :value="r.value">
            {{ r.label }}
        </a-radio-button>
        </a-radio-group>
        <a-range-picker
          v-model:value="dateRange"
          :presets="presets"
          :allowClear="false"
          @change="fetchAll"
        />
      </div>
      <a-space>
        <a-button @click="refresh" :loading="loadingAll" icon="⟳">새로고침</a-button>
      </a-space>
    </div>

    <a-row :gutter="16" class="kpi-row">
      <a-col :xs="24" :sm="12" :md="8" :lg="6" v-for="k in kpis" :key="k.key">
        <a-card :loading="loading.metrics" class="kpi-card">
          <div class="kpi-head">
            <span class="kpi-label">{{ k.label }}</span>
            <a-tag :color="k.color">{{ k.tag }}</a-tag>
          </div>
          <div class="kpi-body">
            <a-statistic :value="metrics[k.key] ?? 0" :precision="k.precision || 0" />
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="bottom-row">
      <a-col :xs="24" :md="24">
        <a-card :loading="loading.restricted" class="restricted" title="제한 계정">
          <a-table
            size="small"
            :columns="restrictedCols"
            :data-source="restrictedRows"
            :pagination="{ pageSize: 3 }"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key==='reason'">
                <a-tag :color="record.reason==='FAILED_LOGIN_THRESHOLD' ? 'error' : 'warning'">
                  {{ reasonLabel(record.reason) }}
                </a-tag>
              </template>
              <template v-else-if="column.key==='action'">
                <a-space>
                  <a-button size="small" type="primary" @click="() => router.push('/admin/users')">이동</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import axios from 'axios'

const router = useRouter()

// 날짜 필터
const today = dayjs()
const dateRange = ref([today.add(-6,'day'), today])
const quickRanges = [
  { label: '7일', value: '7d' },
  { label: '30일', value: '30d' },
  { label: '90일', value: '90d' },
]
const quickRange = ref('7d')
const presets = [
  { label: '최근 7일', value: [dayjs().add(-6,'day'), dayjs()] },
  { label: '이번 달', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
]

function onQuickRangeChange(v){
  const map = { '7d': 6, '30d': 29, '90d': 89 }
  const end = dayjs()
  const start = end.add(-(map[v]||6), 'day')
  dateRange.value = [start, end]
  fetchAll()
}

// kpi
const loading = reactive({ metrics:false, restricted:false })
const loadingAll = computed(()=> Object.values(loading).some(Boolean))

const metrics = reactive({
  newUsers: 0,
  activeUsers: 0,
  restrictedUsers: 0,
  pendingInquiries: 0,
  pendingRemittances: 0,
})

const kpis = computed(()=>[
  { key:'newUsers', label:'가입자 수', color:'processing', tag:'Users'},
  { key:'activeUsers', label:'활성 사용자', color:'blue', tag:'Active'},
  { key:'restrictedUsers', label:'제한 계정', color:'error', tag:'Restricted'},
  { key:'pendingRemittances', label:'미처리 송금', color:'warning', tag:'Remittances'},
  { key:'pendingInquiries', label:'미처리 문의', color:'warning', tag:'Inquiries'}
])

const restrictedCols = [
  { title:'사용자', dataIndex:'email', key:'email' },
  { title:'사유', dataIndex: "reason", key:'reason' },
  { title:'일시', dataIndex:'restrictedAt', key:'restrictedAt', width: 160 },
  { title:'액션', key:'action', width: 140 },
]
const restrictedRows = ref([])

// Fetchers
function paramsWithRange(){
  const [s,e] = dateRange.value
  return {
    start: s.startOf('day').toISOString(),
    end: e.endOf('day').toISOString(),
  }
}

async function fetchMetrics(){
  loading.metrics = true
  try{
    const { data } = await axios.get('/api/admin/metrics', { params: paramsWithRange() })
    Object.assign(metrics, data.metrics || {})
  }finally{ loading.metrics = false }
}

async function fetchRestricted(){
  loading.restricted = true
  try{
    const { data } = await axios.get('/api/admin/restricted-latest', { params: { page:0, size:3 } })

    restrictedRows.value = (data || []).map(r => ({
      id: r.id,
      email: r.email,
      reason: r.reason,
      restrictedAt: formatDate(r.restrictedAt)
    }))
  }finally{ loading.restricted = false }
}

async function fetchAll(){
  await Promise.all([fetchMetrics(), fetchRestricted()])
}

function refresh(){ fetchAll() }

// Utils
function formatDate(iso){
  if(!iso) return '-'
  const d = dayjs(iso)
  return d.format('YYYY-MM-DD HH:mm')
}
function formatAmount(v){
  if (v==null) return '-'
  return new Intl.NumberFormat().format(v)
}
function reasonLabel(r){
  if (r==='FAILED_LOGIN_THRESHOLD') return '5회 비밀번호 오류'
  if (r==='EMAIL_UNVERIFIED') return '이메일 미인증'
  return r || '-'
}

onMounted(fetchAll)
watch(dateRange, (v,ov) => { 
  if(v!==ov) fetchAll() 
})
</script>

<style scoped>
.admin-dashboard { 
  padding: 24px; 
}
.page-head { 
  display:flex; 
  align-items:center; 
  justify-content:space-between; 
  margin-bottom: 24px; 
}
.title-wrap { 
  display:flex; 
  align-items:center; 
  gap:16px; 
}
.title { 
  margin:0; 
  font-size:24px; 
  font-weight:700; 
}
.kpi-row { 
  margin-bottom: 24px; 
}
.kpi-card { 
  border-radius: 14px; 
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  margin-bottom: 12px;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
}
.kpi-head { 
  display:flex; 
  align-items:center; 
  justify-content:space-between; 
  margin-bottom: 8px; 
}
.kpi-label { 
  color:#475467; 
  font-size:14px;
  font-weight: 500; 
}
.kpi-body { 
  display:flex; 
  align-items:flex-end; 
  justify-content:space-between; 
  gap:12px; 
}
.kpi-trend { 
  display:flex; 
  align-items:center; 
  gap:8px; 
  flex-shrink: 0;
}
.delta { 
  font-variant-numeric: tabular-nums; 
  font-size: 13px; 
  font-weight: 600;
}
.delta.up { 
  color: #0ea5e9; 
}
.delta.down { 
  color: #ef4444;
}
.bottom-row {
  margin-top: 24px;
}
.middle-row{ 
  margin-top: 12px; 
}
.restricted {
  border-radius: 14px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
</style>