<template>
  <div class="signup-wrapper">
    <main class="signup-section">
      <div class="identity-card with-divider">

        <!-- Left: 안내 -->
        <aside class="left-section">
          <h2 class="left-title">신분증 정보 입력</h2>
          <p class="left-desc">
            신분증 사진을 업로드하여 이름과 생년월일을 자동으로 인식합니다.<br />
            정확한 정보를 위해 선명하게 촬영된 사진을 사용해주세요.
          </p>
          <ul class="bullets">
            <li>사진은 JPG, PNG 형식만 지원됩니다.</li>
            <li>파일 크기는 최대 5MB까지 업로드 가능합니다.</li>
          </ul>
        </aside>

        <div class="divider" aria-hidden="true"></div>

        <!-- Right: 파일 업로드 -->
        <section class="right-section">
          <div class="upload-section">
            <label class="upload-label">
              <input type="file" accept="image/*" @change="handleFileUpload" />
              사진 업로드 / 촬영
            </label>
          </div>

          <!-- OCR 결과 -->
          <div v-if="ocrResult" class="ocr-result">
            <template v-if="ocrResult.under19">
              <p style="color: #ff4d4f; font-weight: 600;">⚠️ 미성년자는 가입이 불가합니다.</p>
            </template>
            <template v-else>
              <p><strong>이름:</strong> {{ ocrResult.name }}</p>
              <p><strong>생년월일:</strong> {{ ocrResult.birth }}</p>
              <p><strong>주민등록번호:</strong> {{ ocrResult.rrn }}</p>
            </template>
          </div>

          <!-- 이전/다음 버튼 -->
          <div class="actions">
            <button class="btn-prev" @click="goPrev">이전</button>
            <button
              class="btn-next"
              :disabled="!ocrResult || ocrResult.under19"
              @click="goNext"
            >
              다음
            </button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useSignupStore } from '@/stores/signup'
import axios from 'axios'

const router = useRouter()
const signupStore = useSignupStore()

const state = reactive({
  uploadUrl: 'http://192.168.230.13:8080/api/ocr/upload-analyze',
  ocrResult: null,
  form: { name: '', birth: '' },
})

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await axios.post(state.uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    signupStore.setSignupData({
      name: res.data.name,
      birth: res.data.birth
    })
    state.form.birth = res.data.birth
    state.ocrResult = {
      ...res.data,
      under19: res.data.under19 === true || res.data.under19 === 'true'
    }

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

const { ocrResult } = toRefs(state)
</script>

<style scoped>
.signup-wrapper { 
  border-radius: 16px;
  min-height: calc(100% + 40px);
  background: #f5f7fb;
 }

.signup-section { 
  max-width: 1040px; 
  margin: 12px auto 32px; 
  padding: 0 16px;
 }

.identity-card {
  display: grid;
  grid-template-columns: 360px 1px 1fr;
  margin-top: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(20,20,20,.06);
  overflow: hidden;
  padding: 32px;
  gap: 24px;
}

.with-divider .divider {
  background: #f0f0f0;
  width: 1px;
}

.left-section {
  padding: 28px 24px;
  background: linear-gradient(180deg, #f7fbff, #ffffff);
}

.left-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 8px;
}

.left-desc {
  color: #667085;
  margin: 0 0 16px;
  line-height: 1.5;
}

.bullets {
  margin: 0;
  padding-left: 18px;
  color: #667085;
}

.bullets li {
  margin: 6px 0;
}

.right-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.upload-section {
  width: 100%;
  display: flex;
  justify-content: center;
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
  gap: 12px;
  width: 100%;
}

.btn-prev, .btn-next {
  flex: 1;
  padding: 12px 0;
  border-radius: 10px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: transform .02s ease;
}

.btn-prev {
  background: #f0f0f0;
  color: #333;
}

.btn-next {
  background: #1677ff;
  color: #fff;
}

.btn-next:disabled {
  background: #bfbfbf;
  cursor: not-allowed;
}

.btn-prev:active, .btn-next:active {
  transform: translateY(1px);
}

/* 반응형 */
@media (max-width: 960px) {
  .identity-card {
    grid-template-columns: 1fr;
  }
  .with-divider .divider {
    display: none;
  }
}
</style>
