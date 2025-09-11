<template>
  <div class="remit-step-page">
    <h1 class="page-title">해외 송금 신청</h1>

    <!-- STEP 진행 표시 -->
    <div class="step-indicators">
      <div
          v-for="(stepName, index) in stepNames"
          :key="index"
          :class="['step-item', { active: currentStep === index + 1, completed: currentStep > index + 1 }]"
      >
        STEP {{ index + 1 }}
        <div class="step-label">{{ stepName }}</div>
      </div>
    </div>

    <!-- STEP 컴포넌트 -->
    <TermsAgree v-show="currentStep === 1" ref="termsAgreeComponent" />

    <RemitInfo
        v-if="currentStep === 2"
        ref="remitInfoComponent"
        v-model:senderName="localSenderName"
        v-model:selectedReason="localSelectedReason"
        v-model:selectedRecipient="localSelectedRecipient"
        v-model:staffMessage="staffMessage"
        v-model:identityFiles="identityFiles"
        v-model:reasonFiles="reasonFiles"
        v-model:senderCountryNumber="localSenderCountryNumber"
        v-model:senderPhoneNumber="localSenderPhoneNumber"
        v-model:senderEmail="localSenderEmail"
        v-model:senderCountry="localSenderCountry"
        v-model:senderAddress="localSenderAddress"
        @update:isValid="remitInfoValid = $event"
    />

    <WithdrawInfo
        v-show="currentStep === 3"
        ref="withdrawInfoComponent"
        v-model:selectedAccount="selectedAccount"
        v-model:amountInput="amountInput"
        v-model:isValid="isWithdrawValid"
        v-model:accountPin="accountPin"
        :selected-recipient="localSelectedRecipient"
        @update:totalAmountKRW="totalAmountKRW = $event"
        @update:totalAmountForeign="totalAmountForeign = $event"
        @update:feeAmountKRW="feeInCurrency = $event"
        @update:convertedAmount="convertedAmount = $event"
    />

    <RecipientInfo
        v-if="currentStep === 4"
        v-model:relationship="relationship"
        v-model:relationFiles="relationFiles"
        :selected-recipient="localSelectedRecipient"
        @update:selectedRecipient="localSelectedRecipient = $event"
    />

    <ConfirmationStep
        v-if="currentStep === 5"
        :sender-name="localSenderName"
        :selected-account="selectedAccount"
        :recipient="localSelectedRecipient"
        :relationship="relationship"
        :relation-files="relationFiles"
        :reason="localSelectedReason"
        :identity-files="identityFiles"
        :reason-files="reasonFiles"
        :amount="amountInput"
        :currency="selectedAccount?.currencyCode || selectedCurrency"
        :fee="feeInCurrency"
        :converted-amount="convertedAmount"
        :recipient-currency="localSelectedRecipient?.currencyCode"
        :staff-message="staffMessage"
        :total-amount-krw="totalAmountKRW"
        :total-amount-foreign="totalAmountForeign"
        :is-foreign-account="selectedAccount?.currencyCode !== 'KRW'"
    />

    <CompletionStep
        v-if="currentStep === 6"
        @go-home="goHome"
        @go-to-history="goToHistory"
    />

    <!-- STEP 이동 버튼 -->
    <div class="navigation-buttons" v-if="currentStep !== 6">
      <!-- STEP 1에서는 이전 버튼 숨김 -->
      <button v-if="currentStep !== 1" @click="prevStep">이전</button>
      <button @click="nextStep" :disabled="isNextDisabled">
        {{ currentStep === 5 ? '완료' : '다음' }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

import TermsAgree from '@/views/ForeignTransfer/components/TransferRequest/TermsAgree.vue'
import RemitInfo from '@/views/ForeignTransfer/components/TransferRequest/RemitInfo.vue'
import WithdrawInfo from '@/views/ForeignTransfer/components/TransferRequest/WithdrawInfo.vue'
import RecipientInfo from '@/views/ForeignTransfer/components/TransferRequest/RecipientInfo.vue'
import ConfirmationStep from '@/views/ForeignTransfer/components/TransferRequest/ConfirmationStep.vue'
import CompletionStep from '@/views/ForeignTransfer/components/TransferRequest/CompletionStep.vue'

const router = useRouter()
const currentStep = ref(1)

// STEP 데이터
const localSenderName = ref('')
const localSelectedReason = ref('')
const localSelectedRecipient = ref(null)
const staffMessage = ref('')
const identityFiles = ref([])
const reasonFiles = ref([])
const localSenderCountryNumber = ref('')
const localSenderPhoneNumber = ref('')
const localSenderEmail = ref('')
const localSenderCountry = ref('')
const localSenderAddress = ref('')

const amountInput = ref(0)
const selectedCurrency = ref('USD')
const selectedAccount = ref(null)
const totalAmountKRW = ref(0)
const isWithdrawValid = ref(false)
const remitInfoValid = ref(false)
const accountPin = ref('')
const convertedAmount = ref(0)
const feeInCurrency = ref(0)
const totalAmountForeign = ref(0)

const relationship = ref('')
const relationFiles = ref([])

// STEP 컴포넌트 ref
const termsAgreeComponent = ref(null)
const remitInfoComponent = ref(null)
const withdrawInfoComponent = ref(null)

// STEP 전체 송금 데이터
const senderInfo = ref({})

// STEP 전송용 데이터
const requestData = ref({})

// STEP 이름
const stepNames = ['약관동의', '송금정보', '출금정보', '수취인 정보', '확인', '완료']

// -----------------------------
// STEP 이동
// -----------------------------
const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--
}

const nextStep = async () => {
  try {
    switch(currentStep.value) {
      case 1:
        if (termsAgreeComponent.value) {
          await termsAgreeComponent.value.agreeTerms()
          const termsState = termsAgreeComponent.value.terms.map(t => ({id: t.id, agreed: t.agreed}))
          senderInfo.value = {...senderInfo.value, terms: termsState}
          await checkRecipientsAndProceed()
        }
        break
      case 2:
        if (!remitInfoValid.value) {
          alert('보내는 분 정보가 누락되었거나 올바르지 않습니다.')
          return
        }
        if (remitInfoComponent.value) {
          senderInfo.value = {...senderInfo.value, ...remitInfoComponent.value.saveSenderDataLocal()}
        }
        currentStep.value++
        break
      case 3:
        if (!selectedAccount.value) {
          alert('출금 정보가 올바르지 않습니다.')
          return
        }

        // null 체크 추가
        const withdrawalData = withdrawInfoComponent.value?.getWithdrawalData()
        if (!withdrawalData) {
          alert('출금 정보가 준비되지 않았습니다.')
          return
        }

        totalAmountKRW.value = withdrawalData.totalAmountKRW || 0
        totalAmountForeign.value = withdrawalData.totalAmountForeign || 0
        feeInCurrency.value = withdrawalData.feeInKRW || 0
        amountInput.value = withdrawalData.amountInput || 0
        convertedAmount.value = withdrawalData.convertedAmount || 0

        currentStep.value++
        break
      case 4:
        if (!localSelectedRecipient.value || !relationship.value) {
          alert('수취인 정보가 올바르게 입력되지 않았습니다.')
          return
        }
        currentStep.value++
        break
      case 5:
        await submitTransfer()
        break
      default:
        currentStep.value++
        break
    }
  } catch(err) {
    console.error(err)
  }
}

// 수취인 목록 확인 후 STEP 이동
const checkRecipientsAndProceed = async () => {
  try {
    const res = await axios.get('/api/foreign-transfer/recipients/active')
    const list = res.data?.recipients || res.data || []
    if (list.length === 0) {
      alert('먼저 수취인을 등록해주세요.')
      await router.push('/recipients/post')
      return
    }
    currentStep.value++
  } catch(err) {
    console.error(err)
    alert('수취인 목록 조회 실패')
  }
}

// 송금 제출 (STEP 5)
const submitTransfer = async () => {
  try {
    if (!withdrawInfoComponent.value) {
      alert('출금 계좌가 선택되지 않았습니다.')
      return
    }

    const withdrawalData = withdrawInfoComponent.value.getWithdrawalData()

    // 1️⃣ DTO에 맞게 데이터 구성
    const requestPayload = {
      // 송금 금액 / 계좌
      transferAmount: amountInput.value,
      accountType: selectedAccount.value.accountType, // AccountType enum 이름
      currencyCode: selectedAccount.value.currencyCode,
      accountPassword: accountPin.value,
      krwAccount: selectedAccount.value.currencyCode === 'KRW' ? selectedAccount.value.accountNumber : null,
      foreignAccount: selectedAccount.value.currencyCode !== 'KRW' ? selectedAccount.value.accountNumber: null,
      fromCurrency: selectedAccount.value.currencyCode,

      // 송금인 정보
      senderName: localSenderName.value,
      transferReason: localSelectedReason.value,
      countryNumber: localSenderCountryNumber.value,
      phoneNumber: localSenderPhoneNumber.value,
      email: localSenderEmail.value,
      country: localSenderCountry.value,
      engAddress: localSenderAddress.value,
      relationRecipient: relationship.value,
      accountNumber: selectedAccount.value.accountNumber,
      staffMessage: staffMessage.value || '',

      recipientId: localSelectedRecipient.value?.id || null,
      recipientName: localSelectedRecipient.value?.name || null,
      recipientBank: localSelectedRecipient.value?.bankName || null,
      recipientAccountNumber: localSelectedRecipient.value?.accountNumber || null,
      recipientEmail: localSelectedRecipient.value?.email || null,
      recipientCountryNumber: localSelectedRecipient.value?.countryNumber|| null,
      recipientPhoneNumber : localSelectedRecipient.value?.phoneNumber || null,
      recipientCurrencyCode: localSelectedRecipient.value?.currencyCode || null,
      recipientCountry : localSelectedRecipient.value?.country || null,
      recipientAddress : localSelectedRecipient.value?.engAddress || null,

      // 약관 동의
      agree1: termsAgreeComponent.value?.terms[0]?.agreed || false,
      agree2: termsAgreeComponent.value?.terms[1]?.agreed || false,
      agree3: termsAgreeComponent.value?.terms[2]?.agreed || false,

      totalAmountKRW: selectedAccount.value.currencyCode === 'KRW' ? totalAmountKRW.value : 0,
      convertedAmount: convertedAmount.value,
      feeAmount: feeInCurrency.value,
      totalAmountForeign: selectedAccount.value.currencyCode !== 'KRW' ? totalAmountForeign.value : 0,
    }

    // 2️⃣ FormData 생성
    const formData = new FormData()
    formData.append(
        'request',
        new Blob([JSON.stringify(requestPayload)], { type: 'application/json' })
    )

    // 3️⃣ 파일 첨부
    if (identityFiles.value.length > 0) formData.append('idFile', identityFiles.value[0])
    if (reasonFiles.value.length > 0) formData.append('proofDocumentFile', reasonFiles.value[0])
    if (relationFiles.value.length > 0) formData.append('relationDocumentFile', relationFiles.value[0])

    // 4️⃣ Axios POST 요청
    const response = await axios.post('/api/foreign-transfer/request', formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('송금 요청 성공:', response.data)
    console.log('💸 송금 요청 payload:', requestPayload)

    currentStep.value++

  } catch (error) {
    console.error('송금 처리 실패', error)
    alert('송금 처리 중 오류가 발생했습니다.')
  }
}

const isNextDisabled = computed(() => {
  if (currentStep.value === 2) return !remitInfoValid.value
  if (currentStep.value === 3) return !isWithdrawValid.value
  if (currentStep.value === 4) return !relationship.value || !localSelectedRecipient.value
  return false
})

const goHome = () => router.push('/')
const goToHistory = () => router.push('/ForeignTransfer/list')
</script>

<style scoped>
.remit-step-page { max-width: 850px; margin: 0 auto; padding: 1rem; font-family: 'Pretendard Variable', sans-serif; color: #333; }
.page-title { font-size: 28px; font-weight: 700; color: #008681; text-align: center; margin-top: 10px; margin-bottom: 30px; }
.step-indicators { display: flex; justify-content: space-between; margin-bottom: 30px; background-color: #f0f0f0; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.step-item { flex: 1; padding: 15px 10px; text-align: center; font-size: 16px; font-weight: 600; color: #888; cursor: pointer; transition: all 0.3s ease; position: relative; }
.step-item:not(:last-child)::after { content: '>'; position: absolute; right: -5px; top: 50%; transform: translateY(-50%); color: #ccc; font-weight: bold; }
.step-item.active { color: #008681; background-color: #E6F5F4; }
.step-item.completed { color: #008681; font-weight: 700; }
.step-item .step-label { font-size: 12px; color: #666; margin-top: 5px; }
.step-item.active::before { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; background-color: #008681; }

.navigation-buttons { margin-top: 30px; text-align: center; display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; }
.navigation-buttons button { padding: 12px 25px; font-size: 17px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.2s ease, box-shadow 0.2s ease; min-width: 120px; }
.navigation-buttons button:hover { background-color: #008681; color: #fff; }
.navigation-buttons button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
