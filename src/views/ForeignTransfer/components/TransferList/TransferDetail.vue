<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')">✖</button>
      <h2>송금 상세 정보</h2>

      <div v-if="transfer" class="detail-list">
        <div><strong>송금 금액:</strong> {{ formatAmount(transfer.transferAmount) }}</div>
        <div><strong>환전 금액:</strong> {{ formatAmount(transfer.convertedAmount) }}</div>
        <div><strong>적용 환율:</strong> {{ transfer.exchangeRate || "-" }}</div>
        <div><strong>수수료:</strong> {{ formatAmount(transfer.feeAmount) }}</div>
        <div><strong>총 차감 금액:</strong> {{ formatAmount(transfer.totalDeductedAmount) }}</div>
        <div><strong>계좌 유형:</strong> {{ transfer.accountType || "-" }}</div>
        <div><strong>송금 상태:</strong>
          <span :class="statusClass(transfer.transferStatus)">
            {{ transferStatus(transfer.transferStatus) }}
          </span>
        </div>
        <div><strong>송금 사유:</strong> {{ transfer.memo || "-" }}</div>
        <div><strong>송금 요청일:</strong> {{ transfer.requestDate || "-" }}</div>
        <div><strong>송금 완료일:</strong> {{ transfer.completionDate || "-" }}</div>
        <div><strong>출금 계좌:</strong> {{ transfer.senderAccount || "-" }}</div>
        <div><strong>수취 국가:</strong> {{ transfer.recipientCountry || "-" }}</div>

        <br>
        <div><strong>수취인 이름:</strong> {{ transfer.recipientName || "-" }}</div>
        <div><strong>연락처:</strong> {{ transfer.recipientPhone || "-" }}</div>
        <div><strong>이메일:</strong> {{ transfer.recipientEmail || "-" }}</div>
        <div><strong>주소:</strong> {{ transfer.recipientAddress || "-" }}</div>
        <div><strong>은행:</strong> {{ transfer.bankName || "-" }}</div>
        <div><strong>계좌번호:</strong> {{ transfer.accountNumber || "-" }}</div>
      </div>

      <div v-else class="loading-text">로딩 중...</div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  props: ["transferId", "token"],
  data() { return { transfer: null }; },
  methods: {
    async fetchTransferDetail() {
      if (!this.transferId || !this.token) return;

      try {
        const response = await axios.get(
            "/api/foreign-transfer/history",
            { headers: { Authorization: `Bearer ${this.token}` } }
        );

        // transferId로 필터링
        this.transfer = response.data.find(t => t.transferId === this.transferId);
      } catch (error) {
        console.error("송금 상세 조회 실패:", error);
      }
    },
    transferStatus(status) {
      switch(status){
        case "NOT_STARTED": return "송금 전";
        case "IN_PROGRESS": return "진행 중";
        case "COMPLETED": return "완료";
        case "FAILED": return "실패";
        case "REJECTED": return "반려";
        default: return "-";
      }
    },
    statusClass(status) {
      return {
        requested: status === "NOT_STARTED",
        inprogress: status === "IN_PROGRESS",
        approved: status === "COMPLETED",
        failed: status === "FAILED",
        rejected: status === "REJECTED"
      };
    },
    formatAmount(amount) { return amount != null ? amount.toLocaleString() + "원" : "-"; }
  },
  watch: {
    transferId: { immediate: true, handler() { if(this.transferId) this.fetchTransferDetail(); } }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.modal-content {
  background: white;
  width: 90%;
  max-width: 600px;
  padding: 24px;
  border-radius: 12px;
  position: relative;
  box-shadow: 0 6px 18px rgba(0,0,0,0.3);
  font-size: 15px;
}

.close-btn {
  position: absolute;
  top: 12px; right: 12px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
}
.close-btn:hover { color: #111827; }

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.loading-text {
  text-align: center;
  color: #6b7280;
}

/* 상태별 색상 */
.requested { color: #00908C; font-weight: 500; }
.inprogress { color: #3b82f6; font-weight: 500; }
.approved { color: #16a34a; font-weight: 500; }
.failed { color: #dc2626; font-weight: 500; }
.rejected { color: #dc2626; font-weight: 500; }

h2 { color: #00908C; font-size: 20px; margin-bottom: 16px; }
strong { color: #111827; }
</style>
