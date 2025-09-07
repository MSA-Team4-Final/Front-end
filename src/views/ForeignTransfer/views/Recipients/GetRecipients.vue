<template>
  <div class="recipient-page">
    <div class="recipient-card">
      <div class="card-header">
        <h1>수취인 목록</h1>
        <div class="list-actions">
          <button @click="goToCreate" class="icon-btn">
            <span class="material-icons">add</span>
          </button>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="recipient-table">
          <thead>
          <tr>
            <th>이름</th>
            <th>통화</th>
            <th>은행명</th>
            <th>계좌번호</th>
            <th>연락처</th>
            <th>이메일</th>
            <th></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="recipient in recipients" :key="recipient.recipientId">
            <td>{{ recipient.name }}</td>
            <td>{{ recipient.currencyCode }}</td>
            <td>{{ recipient.bankName }}</td>
            <td>{{ recipient.accountNumber }}</td>
            <td>{{ formatPhone(recipient.countryNumber, recipient.phoneNumber) }}</td>
            <td>{{ recipient.email }}</td>
            <td class="action-buttons">
              <button @click="editRecipient(recipient.recipientId)" class="icon-btn">
                <span class="material-icons">edit</span>
              </button>
              <button @click="deactivateRecipient(recipient.recipientId)" class="icon-btn danger">
                <span class="material-icons">delete</span>
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      recipients: [],
    };
  },
  created() {
    this.fetchRecipients();
  },
  methods: {
    async fetchRecipients() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          alert("로그인이 필요합니다.");
          this.$router.push("/login");
          return;
        }

        // ✅ 활성화된 수취인만 조회
        const res = await axios.get("/api/foreign-transfer/recipients/active", {
          headers: { Authorization: `Bearer ${token}` },
        });

        this.recipients = res.data;
      } catch (err) {
        console.error("📥 Axios 응답 오류:", err.response || err);
        if (err.response && err.response.status === 401) {
          alert("세션이 만료되었거나 인증에 실패했습니다. 다시 로그인해주세요.");
          this.$router.push("/login");
        }
      }
    },
    goToCreate() {
      this.$router.push("/recipients/post");
    },
    editRecipient(id) {
      this.$router.push(`/recipients/edit/${id}`);
    },
    async deactivateRecipient(id) {
      if (!confirm("정말 삭제하시겠습니까?")) return;

      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          alert("로그인이 필요합니다.");
          this.$router.push("/login");
          return;
        }

        // ✅ PATCH 요청으로 비활성화
        await axios.patch(`/api/foreign-transfer/recipients/${id}/deactivate`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ 목록 다시 조회
        await this.fetchRecipients();
      } catch (err) {
        console.error("수취인 비활성화 실패:", err.response || err);
        alert("수취인 비활성화 중 오류가 발생했습니다.");
      }
    },
    formatPhone(countryNumber, phoneNumber) {
      const numbers = phoneNumber.replace(/\D/g, '');
      return `+${countryNumber} ${numbers}`;
    }
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

.recipient-page { max-width: 950px; margin: 2rem auto; padding: 1rem; font-family: 'Pretendard Variable', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #333; }

.recipient-card { background-color: #fff; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: flex; flex-direction: column; gap: 20px; }

.card-header { padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
.card-header h1 { margin: 0; color: #008681; font-size: 28px; font-weight: 700; }
.list-actions { display: flex; justify-content: flex-end; }

.table-wrapper { overflow-x: auto; border-radius: 10px; border: none; padding: 0; background-color: transparent; box-shadow: none; }

.recipient-table { width: 100%; border-collapse: collapse; border: none; table-layout: auto; min-width: 850px; margin: 0 auto; }
.recipient-table th { padding: 8px; background-color: #E6F5F4; color: #008681; font-weight: 600; text-align: center; word-break: break-word; }
.recipient-table td { padding: 8px; background-color: #F9FEFD; text-align: center; font-size: 14px; word-break: break-word; vertical-align: middle; }

.action-buttons {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  width: 60px;
}

.icon-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  color: #008681;
}
.icon-btn:hover { color: #2e8b57; }
.icon-btn.danger { color: #dc2626; }
.icon-btn.danger:hover { color: #b91c1c; }

.material-icons { font-size: 20px; }

@media (max-width: 768px) {
  .card-header h1 { font-size: 24px; }
  .recipient-table { min-width: unset; font-size: 13px; }
  .icon-btn { padding: 3px; font-size: 18px; }
  .action-buttons { width: 50px; gap: 0.2rem; }
}
</style>
