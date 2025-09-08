<template>
  <div class="foreign-transfer-page">
    <div class="transfer-card">
      <div class="card-header">
        <h1 class="page-title">송금 거래 내역</h1>
        <div class="filter-period">
          <input type="date" v-model="startDate" />
          <span>~</span>
          <input type="date" v-model="endDate" />
          <button @click="fetchTransfers">조회</button>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="transfer-table">
          <thead>
          <tr>
            <th>수취인 이름</th>
            <th>통화</th>
            <th>은행</th>
            <th>계좌번호</th>
            <th>이메일</th>
            <th>송금 금액</th>
            <th>송금 상태</th>
            <th>상세</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="transfer in transfers" :key="transfer.transferId">
            <td>{{ transfer.recipientName || "-" }}</td>
            <td>{{ transfer.recipientCurrencyCode || "-" }}</td>
            <td>{{ transfer.recipientBank || "-" }}</td>
            <td>{{ transfer.recipientAccountNumber || "-" }}</td>
            <td>{{ transfer.recipientEmail || "-" }}</td>
            <td>{{ formatAmount(transfer.transferAmount) }}</td>
            <td :class="transferStatusClass(transfer.transferStatus)">
              {{ transferStatusText(transfer.transferStatus) }}
            </td>
            <td>
              <button class="detail-btn" @click="viewDetail(transfer.transferId)">상세</button>
            </td>
          </tr>
          <tr v-if="transfers.length === 0">
            <td colspan="10">조회된 거래가 없습니다.</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <TransferDetail
        v-if="selectedTransferId"
        :transferId="selectedTransferId"
        :token="token"
        :visible="!!selectedTransferId"
        @close="selectedTransferId = null"
    />
  </div>
</template>

<script>
import axios from "axios";
import TransferDetail from "@/views/ForeignTransfer/components/TransferList/TransferDetail.vue";

export default {
  components: { TransferDetail },
  data() {
    return {
      transfers: [],
      startDate: "",
      endDate: "",
      selectedTransferId: null,
      token: localStorage.getItem("accessToken") || "",
    };
  },
  methods: {
    async fetchTransfers() {
      if (!this.token) {
        alert("로그인이 필요합니다.");
        this.$router.push("/login");
        return;
      }

      try {
        const params = {};
        if (this.startDate) params.startDate = this.startDate;
        if (this.endDate) params.endDate = this.endDate;

        const res = await axios.get("/api/foreign-transfer/history", {
          headers: { Authorization: `Bearer ${this.token}` },
          params,
        });

        this.transfers = res.data;
      } catch (err) {
        console.error("송금 거래 내역 조회 실패:", err.response || err);
        this.transfers = [];
      }
    },
    viewDetail(id) { this.selectedTransferId = id; },

    transferStatusText(status) {
      switch(status) {
        case "NOT_STARTED": return "송금 전";
        case "IN_PROGRESS": return "진행 중";
        case "COMPLETED": return "완료";
        case "FAILED": return "실패";
        default: return "-";
      }
    },
    transferStatusClass(status) {
      return {
        notstarted: status === "NOT_STARTED",
        inprogress: status === "IN_PROGRESS",
        completed: status === "COMPLETED",
        failed: status === "FAILED"
      };
    },
    formatAmount(amount) { return amount?.toLocaleString() + "원"; },
    formatPhone(phone) {
      if (!phone) return "-";
      const numbers = phone.replace(/\D/g, "");
      return numbers.length > 0 ? `+${numbers}` : "-";
    },
  },
  mounted() { this.fetchTransfers(); }
};
</script>

<style scoped>
.transfer-card {
  background-color: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 25px;
}
.card-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.page-title { color: #008681; font-size: 28px; font-weight: 700; }
.foreign-transfer-page {
  max-width: 950px;
  margin: 0 auto;
  padding: 1rem;
  font-family: 'Pretendard Variable', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  color: #333;
}
.filter-period {
  display: flex; align-items: center; gap: 10px; margin-top: 20px;
}
.filter-period input { padding: 6px 10px; border: 1px solid #ccc; border-radius: 5px; }
.filter-period button { padding: 6px 14px; background-color: #009b99; color: white; border: none; border-radius: 5px; cursor: pointer; transition: 0.2s; }
.filter-period button:hover { background-color: #008681; }
.table-wrapper { overflow-x: auto; border-radius: 10px; padding: 0; background-color: transparent; }
.transfer-table { width: 100%; border-collapse: collapse; table-layout: auto; min-width: 850px; margin: 0 auto; }
.transfer-table th { padding: 8px; background-color: #E6F5F4; color: #008681; font-weight: 600; text-align: center; word-break: break-word; }
.transfer-table td { padding: 8px; background-color: #F9FEFD; text-align: center; font-size: 14px; word-break: break-word; vertical-align: middle; }

.detail-btn { padding: 4px 10px; color: #3d9970; background: transparent; border: 1px solid #3d9970; border-radius: 4px; cursor: pointer; font-size: 13px; transition: 0.2s; }
.detail-btn:hover { background-color: #009b99; color: white; }

/* 상태 색상 */
.notstarted { color: #d97706; font-weight: 500; }
.inprogress { color: #3b82f6; font-weight: 500; }
.completed { color: #2e8b57; font-weight: 500; }
.failed { color: #dc2626; font-weight: 500; }
.submitted { color: #f59e0b; font-weight: 500; }

@media (max-width: 768px) {
  .page-title { font-size: 24px; margin-bottom: 20px }
  .filter-period { flex-wrap: wrap; justify-content: center }
  .filter-period input { width: 130px; }
  .table-wrapper { padding: 10px 0; }
  .transfer-table { min-width: unset; font-size: 13px; }
  .detail-btn { padding: 3px 6px; font-size: 12px; }
}
</style>
