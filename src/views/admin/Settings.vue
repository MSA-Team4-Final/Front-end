<template>
  <div class="settings-page">
    <h2 class="page-title">설정</h2>
    <p class="page-subtitle">송금 및 환전 수수료를 설정하세요.</p>

    <a-card class="fee-card" title="친구송금 수수료">
      <a-form layout="inline">
        <a-form-item label="수수료 (%)">
          <a-slider
            v-model:value="fees.domestic"
            :min="0"
            :max="10"
            :step="0.01"
            style="width: 200px"
          />
          <a-input-number
            v-model:value="fees.domestic"
            :min="0"
            :max="10"
            :step="0.01"
            style="width: 80px; margin-left: 12px"
          />
        </a-form-item>
        <a-button type="primary" @click="saveFee('domestic')">저장</a-button>
      </a-form>
    </a-card>

    <a-card class="fee-card" title="해외송금 수수료">
      <a-form layout="inline">
        <a-form-item label="수수료 (%)">
          <a-slider
            v-model:value="fees.foreign"
            :min="0"
            :max="10"
            :step="0.01"
            style="width: 200px"
          />
          <a-input-number
            v-model:value="fees.foreign"
            :min="0"
            :max="10"
            :step="0.01"
            style="width: 80px; margin-left: 12px"
          />
        </a-form-item>
        <a-button type="primary" @click="saveFee('foreign')">저장</a-button>
      </a-form>
    </a-card>

    <a-card class="fee-card" title="환전 수수료">
      <a-form layout="inline">
             <a-form-item label="수수료 (%)">
          <a-slider
            v-model:value="fees.exchange"
            :min="0"
            :max="10"
            :step="0.01"
            style="width: 200px"
          />
          <a-input-number
            v-model:value="fees.exchange"
            :min="0"
            :max="10"
            :step="0.01"
            style="width: 80px; margin-left: 12px"
          />
        </a-form-item>                                                                                   
        <a-button type="primary" @click="saveFee('exchange')">저장</a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { message } from "ant-design-vue";
import axios from 'axios'

const fees = reactive({
  domestic: 0,
  foreign: 0,
  exchange: 0,
})

const feeLabel = {
  domestic: '친구송금',
  foreign: '해외송금',
  exchange: '환전'
}

const saveFee = async (type) => {
  try {
    const value = Number(fees[type]).toFixed(2)

    // 백엔드 API 호출
    await axios.post('/api/settings/fee', {
      type,
      rate: value
    })

    message.success(`${feeLabel[type]} 수수료가 저장되었습니다: ${value}%`)
  } catch (err) {
    const msg = err?.response?.data?.message || '수수료 저장 중 오류가 발생했습니다.'
    message.error(msg)
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.page-subtitle {
  color: #666;
  margin-bottom: 20px;
}

.fee-card {
  margin-bottom: 16px;
  border-radius: 12px;
}
</style>
