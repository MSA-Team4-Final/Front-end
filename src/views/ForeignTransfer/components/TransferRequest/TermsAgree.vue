<template>
  <section class="terms-section-v4">
    <div class="title-row-v4">
      <h2 class="section-title-v4">약관 동의</h2>
    </div>

    <div class="info-table-v4 terms-table-v4">
      <div class="info-row-v4 term-item-row" v-for="term in terms" :key="term.id">
        <div class="term-checkbox-row">
          <label :for="'agree-term-'+term.id" class="checkbox-label-v4">
            <input type="checkbox"
                   :id="'agree-term-'+term.id"
                   v-model="term.agreed"
                   class="hidden-checkbox-v4" />
            <span class="custom-checkbox-v4"></span>
            {{ term.title }}
            <span v-if="term.required" class="required-text-v4">(필수)</span>
          </label>

          <div class="term-actions">
            <button type="button"
                    class="agree-term-button-v4"
                    :class="{ active: term.agreed }"
                    @click="toggleAgree(term.id)">
              {{ term.agreed ? '동의 완료' : '약관 동의' }}
            </button>

            <button type="button" class="arrow-button-v4" @click="toggleTerm(term.id)">
              <svg :class="{ down: term.showContent }" xmlns="http://www.w3.org/2000/svg"
                   viewBox="0 0 24 24" fill="none"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="term.showContent" class="term-content-v4">{{ term.content }}</div>
      </div>

      <div class="info-row-v4 agree-all-row">
        <button type="button"
                class="agree-all-button-v4"
                :class="{ active: agreeAll }"
                @click="toggleAgreeAll">
          전체 동의
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, defineEmits, defineExpose, watch } from 'vue'

const emit = defineEmits(['agreed-success'])

const terms = ref([
  { id: 1, title:'해외 송금 서비스 이용약관', content:`1. 송금 한도: 5,000,000원 / 건\n2. 송금 수수료: 1~2% (환율 변동 포함)\n3. 환율 변동 책임: 이용자 부담\n4. 해외 수취인 정보 제공 동의\n5. 분쟁 해결 및 고객 지원 안내\n6. 부정 송금, 사기 등 불법행위 시 서비스 제한`, required:true, agreed:false, showContent:true },
  { id: 2, title:'개인정보 수집 및 이용 동의', content:`1. 수집 목적: 송금 처리, 본인 확인, 고객 지원\n2. 수집 항목: 이름, 연락처, 이메일, 계좌정보 등\n3. 보유 기간: 회원 탈퇴 후 3년\n4. 동의 거부 시 일부 서비스 이용 제한 가능`, required:true, agreed:false, showContent:true },
  { id: 3, title:'개인정보 제3자 제공 동의', content:`1. 제공 목적: 해외 송금 서비스 제공 및 법규 준수\n2. 제공 항목: 이름, 연락처, 계좌정보 등\n3. 제공받는 자: 송금업체, 금융기관\n4. 보유 및 이용기간: 서비스 종료 후 5년\n5. 동의 거부 시 일부 서비스 이용 제한 가능`, required:false, agreed:false, showContent:false }
])

const agreeAll = computed({
  get: () => terms.value.every(term => term.agreed),
  set(val) {
    terms.value.forEach(term => {
      term.agreed = val
      term.showContent = val
    })
  }
})

function toggleAgree(id) {
  const term = terms.value.find(t => t.id === id)
  if (term) term.agreed = !term.agreed
}

function toggleTerm(id) {
  const term = terms.value.find(t => t.id === id)
  if (term) term.showContent = !term.showContent
}

function toggleAgreeAll() {
  agreeAll.value = !agreeAll.value
}

// 필수 약관 체크
const isStepValid = computed(() => {
  return terms.value.filter(t => t.required).every(t => t.agreed)  // ✅ 필수 약관 모두 동의했는지 확인
})
const areTermsAgreed = computed(() => isStepValid.value)

function agreeTerms() {
  if (!isStepValid.value) return alert('필수 약관에 동의해주세요.')
  // 프론트에서 상태만 저장
  emit('agreed-success', terms.value.map(t => ({ id: t.id, agreed: t.agreed })))
}

// 상위 컴포넌트에서 상태 활용할 수 있도록 expose
defineExpose({ areTermsAgreed, terms, agreeTerms, isStepValid })
</script>


<style scoped>
/* 기존 스타일 그대로 유지 */
.modal-backdrop {
  position: fixed; inset:0; background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000;
}
.modal-content {
  background:#fff; padding:24px; border-radius:12px; max-width:400px; text-align:center;
}
.modal-actions { display:flex; justify-content:space-around; margin-top:20px; }
.modal-actions button { padding:8px 16px; border:none; border-radius:6px; cursor:pointer; background:#009b99; color:#fff; transition:0.2s; }
.modal-actions button:hover { background:#007a78; }

.title-row-v4 { display:flex; justify-content:center; align-items:center; margin-bottom:28px; }
.terms-section-v4 { background:#fff; border-radius:12px; padding:24px; box-shadow:0 4px 15px rgba(0,0,0,0.08); font-family:'Pretendard Variable',sans-serif; color:#333; margin-bottom:2rem; }
.section-title-v4 { font-size:26px; font-weight:700; color:#008681; margin-bottom:28px; text-align:center; }
.info-table-v4 { background:#f8f8f8; border-radius:10px; border:1px solid #e0e0e0; overflow:hidden; display:flex; flex-direction:column; }
.info-row-v4 {display:flex; flex-direction:column; padding:14px 20px; border-bottom:1px solid #eee;}
.info-row-v4:last-child{border-bottom:none;}
.term-item-row{display:flex; flex-direction:column; width:100%;}
.term-checkbox-row{display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap;}
.checkbox-label-v4{display:flex; align-items:center; cursor:pointer; font-size:16px; color:#333; font-weight:500; flex-grow:1;}
.hidden-checkbox-v4{position:absolute; opacity:0; width:0; height:0;}
.custom-checkbox-v4{display:inline-block; width:22px; height:22px; border:2px solid #ccc; border-radius:6px; margin-right:12px; position:relative; transition:all 0.2s ease; flex-shrink:0; background:#fff;}
.hidden-checkbox-v4:checked + .custom-checkbox-v4{background:#009b99; border-color:#009b99;}
.hidden-checkbox-v4:checked + .custom-checkbox-v4::after{content:'✓'; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff; font-size:16px; font-weight:900;}
.required-text-v4{font-size:14px; color:#d9534f; margin-left:6px; font-weight:600;}
.term-actions{display:flex; align-items:center; gap:8px; margin-left:auto; margin-top:5px;}
.agree-term-button-v4{padding:6px 12px; background:#e0e0e0; color:#666; border:none; border-radius:6px; font-size:14px; cursor:pointer; transition:0.2s;}
.agree-term-button-v4.active{background:#009b99; color:#fff;}
.agree-term-button-v4:hover{background:#009b99; color:#fff;}
.term-content-v4{margin-top:10px; padding:12px; background:#fff; border-radius:8px; border:1px solid #e0e0e0; font-size:14px; color:#555; white-space:pre-line;}
.agree-all-row{display:flex; justify-content:flex-start; padding:18px 20px; background:#f0f0f0; border-top:1px solid #e0e0e0; align-items:center;}
.agree-all-button-v4{padding:10px 20px; background:#dcdcdc; color:#666; border:none; border-radius:8px; font-size:16px; font-weight:700; cursor:pointer; transition:0.2s ease; width:auto; max-width:200px;}
.agree-all-button-v4.active{background:#009b99; color:#fff; box-shadow:0 4px 12px rgba(61,153,112,0.2);}
.agree-all-button-v4:hover{background:#009b99; color:#fff;}
.arrow-button-v4 { background: #f8f8f8; border: none; padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s ease; }
.arrow-button-v4:hover { background: #e0e0e0; }
.arrow-button-v4 svg { width: 20px; height: 20px; stroke: #888; transition: transform 0.3s ease; }
.arrow-button-v4 svg.down { transform: rotate(180deg); }

@media(max-width:768px){
  .terms-section-v4{padding:16px;}
  .section-title-v4{font-size:22px;margin-bottom:20px;}
  .term-checkbox-row{flex-direction:column;align-items:flex-start;}
  .term-actions{margin-left:0;margin-top:8px;flex-wrap:wrap;}
  .term-content-v4{font-size:13px;padding:10px;}
  .arrow-button-v4{margin-top:5px;}
}
</style>
