  <template>
    <div class="modal-backdrop-v4" @click.self="closeModal">
      <div class="modal-content-v4">
        <header class="modal-header-v4">
          <h3 class="modal-title-v4">수취인 선택</h3>
          <button class="close-btn-v4" @click="closeModal">×</button>
        </header>
        <div class="modal-body-v4">
          <table class="recipient-table-v4">
            <thead>
            <tr>
              <th>이름</th>
              <th>은행명</th>
              <th>계좌번호</th>
              <th>통화</th>
              <th>이메일</th>
              <th>거주국가</th>
              <th>주소</th>
              <th>연락처</th>
              <th></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="r in recipients" :key="r.recipientId">
              <td>{{ r.name }}</td>
              <td>{{ r.bankName }}</td>
              <td>{{ r.accountNumber }}</td>
              <td>{{ r.currencyCode }}</td>
              <td>{{ r.email }}</td>
              <td>{{ r.country }}</td>
              <td>{{ r.engAddress }}</td>
              <td>+{{ r.countryNumber || "-"}} {{ r.phoneNumber }}</td>
              <td>
                <button class="select-button" @click="select(r)">선택</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import { defineProps, defineEmits } from 'vue'

  const props = defineProps({
    recipients: {
      type: Array,
      required: true
    }
  })

  const emit = defineEmits(['selectRecipient', 'closeModal'])

  function select(recipient) {
    emit('selectRecipient', {
      id: recipient.recipientId,
      name: recipient.name,
      bankName: recipient.bankName,
      accountNumber: recipient.accountNumber,
      currencyCode: recipient.currencyCode,
      email: recipient.email,
      country: recipient.country,
      engAddress: recipient.engAddress,
      countryNumber: recipient.countryNumber,
      phoneNumber: recipient.phoneNumber
    })
  }

  function closeModal() {
    emit('closeModal')
  }
  </script>

  <style scoped>
  /* 기존 스타일 그대로 유지 */
  .modal-backdrop-v4 { position: fixed; inset: 0; background-color: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 9999; font-family: 'Pretendard', sans-serif; }
  .modal-content-v4 { background: #fff; width: 95%; max-width: 1300px; max-height: 85vh; display: flex; flex-direction: column; border-radius: 12px; padding: 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.25); color: #333; }
  .modal-header-v4 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
  .modal-title-v4 { font-size: 26px; font-weight: 700; color: #008681; }
  .close-btn-v4 { background: transparent; border: none; font-size: 2rem; color: #666; cursor: pointer; }
  .close-btn-v4:hover { color: #333; }
  .modal-body-v4 {
    flex-grow: 1;
    overflow-y: auto;   /* ✅ 세로 스크롤만 */
    overflow-x: hidden; /* ✅ 가로 스크롤 제거 */
  }
  .recipient-table-v4 {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 14px;
    table-layout: auto; /* ✅ 내용 크기대로 확장 */
  }
  .recipient-table-v4 th, .recipient-table-v4 td { padding: 12px 10px; text-align: center; border-bottom: 1px solid #eee; word-break: break-word; }
  .recipient-table-v4 th:nth-child(5), .recipient-table-v4 td:nth-child(5) { width: 20%; }
  .recipient-table-v4 th { background-color: #E6F5F4; font-weight: 600; color: #008681; position: sticky; top: 0; z-index: 10; }
  .recipient-table-v4 td {
    white-space: nowrap;   /* ✅ 줄바꿈 안 함 */
    overflow: visible;     /* ✅ 잘림 없음 */
    text-overflow: unset;  /* ✅ ... 처리 없음 */
  }
  .select-button { padding: 8px 16px; background-color: #009b99; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; }
  .select-button:hover { background-color: #008681; }
  @media (max-width: 768px) {
    .modal-content-v4 { width: 98%; max-height: 90vh; padding: 15px; }
    .modal-title-v4 { font-size: 22px; }
    .recipient-table-v4 { font-size: 13px; }
    .recipient-table-v4 th, .recipient-table-v4 td { padding: 8px 6px; }
    .select-button { padding: 7px 14px; font-size: 13px; }
  }
  </style>
