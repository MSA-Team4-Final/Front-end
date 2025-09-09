<template>
  <section class="remit-info-section-v4">
    <h2 class="section-title-v4">송금 정보 확인</h2>

    <!-- 보내는 분 정보 -->
    <div class="info-table-v4">
      <div class="info-row-v4">
        <label class="input-label-v4">보내는 분 이름</label>
        <span>{{ senderName || '-' }}</span>
      </div>
      <div class="info-row-v4">
        <label class="input-label-v4">계좌</label>
        <span>KOREX BANK / {{ selectedAccount?.accountNumber }}</span>
      </div>
      <div class="info-row-v4" v-if="staffMessage">
        <label class="input-label-v4">메시지</label>
        <span>{{ staffMessage }}</span>
      </div>

      <!-- 본인인증 서류 -->
      <div class="info-row-v4">
        <label class="input-label-v4">본인인증 서류</label>
        <span>{{ identityFiles.length ? identityFiles.map(f => f.name).join(', ') : '미등록' }}</span>
      </div>
    </div>

    <!-- 받는 분 정보 -->
    <div class="info-table-v4">
      <div class="info-row-v4">
        <label class="input-label-v4">받는 분 이름</label>
        <span>{{ recipient?.name || '-' }}</span>
      </div>
      <div class="info-row-v4">
        <label class="input-label-v4">계좌</label>
        <span>{{ recipient?.bank || 'KOREX BANK' }} / {{ recipient?.accountNumber || '-' }} </span>
      </div>
      <div class="info-row-v4">
        <label class="input-label-v4">관계</label>
        <span>{{ relationship || '-' }}</span>
      </div>
      <div class="info-row-v4">
        <label class="input-label-v4">관계 증빙 서류</label>
        <span>{{ relationFiles.length ? relationFiles.map(f => f.name).join(', ') : '미등록' }}</span>
      </div>
    </div>

    <!-- 송금 사유 및 증빙서류 -->
    <div class="info-table-v4">
      <div class="info-row-v4">
        <label class="input-label-v4">송금 사유</label>
        <span>{{ reason }}</span>
      </div>
      <div class="info-row-v4">
        <label class="input-label-v4">사유 증빙 서류</label>
        <span>{{ reasonFiles.length ? reasonFiles.map(f => f.name).join(', ') : '미등록' }}</span>
      </div>
    </div>

    <!-- 송금 금액 / 수수료 -->
    <div class="info-table-v4">
      <div class="info-row-v4 highlight-row">
        <label class="input-label-v4">환전 금액</label>
        <span>
      {{ isForeignAccount
            ? totalAmountForeign.toLocaleString() + ' ' + currency + " (외화계좌)"
            : convertedAmount.toLocaleString() + ' ' + recipientCurrency + " (원화계좌)"
          }}
    </span>
      </div>

      <div class="info-row-v4 highlight-row">
        <label class="input-label-v4">수수료</label>
        <span>{{ fee.toLocaleString() }} KRW (원화계좌)</span>
      </div>

      <div class="info-row-v4 highlight-row" v-if="isForeignAccount">
        <label class="input-label-v4">총 차감액</label>
        <span>
          {{ isForeignAccount
            ? totalAmountForeign.toLocaleString() + ' ' + currency + " + " + fee.toLocaleString() + ' KRW'
            : totalAmountKRW.toLocaleString() + ' KRW'
          }}
        </span>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ConfirmationStep',
  props: {
    senderName: { type: String, default: '' },
    selectedAccount: { type: Object, default: () => ({}) },
    recipient: { type: Object, default: () => ({}) },
    relationship: { type: String, default: '' },
    relationFiles: { type: Array, default: () => [] },
    staffMessage: { type: String, default: '' },
    amount: { type: Number, default: 0 },               // 송금액 (외화 기준)
    currency: { type: String, default: '' },
    fee: { type: Number, default: 0 },                  // 수수료 (외화 기준)
    totalAmountKRW: { type: Number, default: 0 },      // 총 KRW 금액
    convertedAmount: { type: Number, default: 0 },      // 환전 금액
    recipientCurrency: { type: String, default: '' },   // 수취 통화
    identityFiles: { type: Array, default: () => [] },
    reason: { type: String, default: '' },
    reasonFiles: { type: Array, default: () => [] },
    totalAmountForeign: { type: Number, default: 0 },   // 총 외화 계좌 금액
    isForeignAccount: { type: Boolean, default: false }, // 외화 계좌 여부
  },
  computed: {
    reasonText() {
      const map = {
        reason1: '유학생 등록비',
        reason2: '유학생 생활비',
        reason3: '기타'
      }
      return map[this.reason] || '-'
    }
  }
}
</script>

<style scoped>
.remit-info-section-v4 {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  font-family: 'Pretendard Variable', sans-serif;
  color: #333333;
}

.section-title-v4 {
  font-size: 26px;
  font-weight: 700;
  color: #008681;
  margin-bottom: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.info-table-v4 {
  background-color: #f8f8f8;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  margin-bottom: 30px;
}

.info-row-v4 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #eeeeee;
}

.input-label-v4 {
  font-size: 15px;
  color: #666666;
  font-weight: 500;
  flex-basis: 35%;
  flex-shrink: 0;
  text-align: left;
}

.info-row-v4 span {
  font-size: 15px;
  color: #333333;
  text-align: right;
}

.highlight-row span {
  font-weight: 700;
  color: #008681;
  font-size: 16px;
}
</style>
