<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')">✖</button>
      <h2>송금 상세 정보</h2>

      <div v-if="transfer" class="detail-grid">

        <!-- 거래/송금 정보 -->
        <div class="card">
          <h3>거래/송금 정보</h3>
          <div class="row"><span>송금 통화:</span> {{ transfer.senderCurrencyCode || "-" }}</div>
          <div class="row"><span>송금 금액:</span> {{ transfer.transferAmount }} {{ transfer.senderCurrencyCode }}</div>
          <div class="row" v-if="transfer.recipientCurrencyCode !== 'KRW'">
            <span>환전 금액:</span> {{ transfer.convertedAmount }} {{ transfer.recipientCurrencyCode }}
          </div>
          <div class="row" v-if="transfer.recipientCurrencyCode !== 'KRW'">
            <span>적용 환율:</span> 1 {{ transfer.senderCurrencyCode }} = {{ transfer.appliedRate || "-" }} {{ transfer.recipientCurrencyCode }}
          </div>
          <div class="row"><span>수수료:</span> {{ transfer.feeAmount }} KRW</div>
          <div class="row">
            <span>송금 상태:</span>
            <span :class="statusClass(transfer.transferStatus)">
              {{ transferStatus(transfer.transferStatus) }}
            </span>
          </div>
          <div class="row"><span>송금 사유:</span> {{ transfer.transferReason || "-" }}</div>
          <div class="row"><span>전달할 메시지:</span> {{ transfer.staffMessage || "없음" }}</div>
        </div>

        <!-- 송금인 정보 -->
        <div class="card">
          <h3>송금인</h3>
          <div class="row"><span>이름:</span> {{ transfer.senderName || "-" }}</div>
          <div class="row"><span>계좌 번호:</span> {{ transfer.senderAccountNumber || "-" }}</div>
          <div class="row"><span>국가:</span> {{ transfer.senderCountry || "-" }}</div>
          <div class="row"><span>주소:</span> {{ transfer.senderAddress || "-" }}</div>
          <div class="row"><span>이메일:</span> {{ transfer.senderEmail || "-" }}</div>
          <div class="row"><span>연락처:</span> +{{ transfer.senderCountryNumber || "-" }} {{ transfer.senderPhoneNumber || "-" }}</div>
          <div class="row">
            <span>송금 시간:</span>
            {{ formatDate(transfer.createdAt) }}
          </div>
        </div>

        <!-- 수취인 정보 -->
        <div class="card">
          <h3>수취인</h3>
          <div class="row"><span>이름:</span> {{ transfer.recipientName || "-" }}</div>
          <div class="row"><span>통화:</span> {{ transfer.recipientCurrencyCode || "-" }}</div>
          <div class="row"><span>관계:</span> {{ transfer.relationRecipient || "-" }}</div>
          <div class="row"><span>은행명:</span> {{ transfer.recipientBank || "-" }}</div>
          <div class="row"><span>계좌번호:</span> {{ transfer.recipientAccountNumber || "-" }}</div>
          <div class="row"><span>주소:</span> {{ transfer.recipientAddress || "-" }}</div>
          <div class="row"><span>연락처:</span> +{{ transfer.recipientCountryNumber || "-" }} {{ transfer.recipientPhoneNumber || "-" }}</div>
          <div class="row"><span>이메일:</span> {{ transfer.recipientEmail || "-" }}</div>
          <div class="row"><span>국가:</span> {{ transfer.recipientCountry || "-" }}</div>
        </div>

      </div>

      <div v-else class="loading-text">로딩 중...</div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  props: ["transferId", "token", "visible"],
  data() { return { transfer: null }; },
  watch: {
    transferId: { immediate: true, handler() { if(this.transferId) this.fetchTransferDetail(); } },
    visible(val) { if(val && this.transferId) this.fetchTransferDetail(); }
  },
  methods: {
    async fetchTransferDetail() {
      if (!this.transferId || !this.token) return;
      try {
        const response = await axios.get("/api/foreign-transfer/history", {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        this.transfer = response.data.find(t => t.transferId === this.transferId);
      } catch (error) { console.error("송금 상세 조회 실패:", error); }
    },
    transferStatus(status) {
      const map = { NOT_STARTED: "송금 전", IN_PROGRESS: "진행 중", COMPLETED: "완료", FAILED: "실패", REJECTED: "반려" };
      return map[status] || "-";
    },
    statusClass(status) {
      return {
        notstarted: status === "NOT_STARTED",
        inprogress: status === "IN_PROGRESS",
        completed: status === "COMPLETED",
        failed: status === "FAILED",
        rejected: status === "REJECTED"
      };
    },
    formatDate(datetime) { return datetime ? new Date(datetime).toLocaleString() : "-"; }
  }
};
</script>

<style scoped>
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 50; }
.modal-content { background: white; width: 100%; max-width: 600px; max-height: 85vh; padding: 16px; border-radius: 10px; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); position: relative; overflow-y: auto; }
.close-btn { position: absolute; top: 10px; right: 10px; border: none; background: transparent; font-size: 18px; cursor: pointer; color: #6b7280; }
.close-btn:hover { color: #111827; }

.detail-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 12px; }
.card { padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f9fafb; }
.card h3 { margin-bottom: 8px; color: #0c4a6e; font-size: 15px; }
.row { display: flex; justify-content: space-between; padding: 4px 0; }
.row span:first-child { font-weight: 500; color: #1e293b; }
.loading-text { text-align: center; color: #6b7280; margin-top: 10px; }
</style>
