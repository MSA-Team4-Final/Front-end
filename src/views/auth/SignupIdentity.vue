<template>
  <div class="signup-wrapper">
    <main class="signup-section">
      <div class="identity-card">

        <!-- QR 촬영 -->
        <div class="qr-section">
          <QRCodeVue :value="qrUploadUrl" :size="200" />
        </div>

        <!-- 파일 업로드 -->
        <div class="upload-section">
          <label class="upload-label">
            <input type="file" accept="image/*" capture="environment" @change="handleFileUpload" />
            사진 업로드 / 촬영
          </label>
        </div>

        <!-- OCR 결과 -->
        <div v-if="ocrResult" class="ocr-result">
          <p><strong>이름:</strong> {{ ocrResult.name }}</p>
          <p><strong>생년월일:</strong> {{ ocrResult.birth }}</p>
          <p><strong>주민등록번호:</strong> {{ ocrResult.rrn }}</p>
        </div>

        <!-- 이전/다음 버튼 -->
        <div class="actions">
          <button class="btn prev" @click="goPrev">이전</button>
          <button class="btn next" :disabled="!ocrResult" @click="goNext">다음</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import QRCodeVue from 'qrcode.vue'

const router = useRouter();

const state = reactive({
  qrUploadUrl: 'http://121.142.236.15:8080/api/ocr/upload-analyze',
  ocrResult: null,
  form: { name: '', birth: '' },
})

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await axios.post(state.qrUploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    state.ocrResult = res.data
    state.form.name = res.data.name
    state.form.birth = res.data.birth

  } catch (err) {
    console.error(err)
  }
}

function goPrev() {
  router.push('/signup')
}

function goNext() {
  router.push('/signup/info')
}

const { qrUploadUrl, ocrResult } = toRefs(state)
</script>

<style scoped>
.signup-wrapper {
  min-height: calc(100% + 40px);
  display: flex;
  flex-direction: column;
  background: #f5f7fb;
  box-sizing: border-box;
  border-radius: 16px;
}

.signup-section {
  flex: 1;
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 16px 32px;
  display: flex;
  justify-content: center;
  overflow: auto;
}

.identity-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(20,20,20,.06);
  padding: 32px;
  margin-top: 15px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.qr-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}

.upload-section {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.upload-label {
  display: inline-block;
  padding: 12px 20px;
  background: #f5faff;
  border: 1px solid #e6f1ff;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  color: #1677ff;
}

.ocr-result {
  width: 100%;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  color: #444;
}

.actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 12px 0;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  font-size: 16px;
  transition: transform .02s ease;
}

.btn.prev {
  background: #f0f0f0;
  color: #333;
}

.btn.next {
  background: #1677ff;
  color: #fff;
}

.btn.next:disabled {
  background: #bfbfbf;
  cursor: not-allowed;
}

.btn:active {
  transform: translateY(1px);
}
</style>
