<template>
  <div class="remittance-cards-page">
    <h1 class="page-title">해외 송금 안내</h1>

    <!-- 송금 절차 -->
    <section class="steps-section">
      <h2 class="section-title">송금 절차</h2>
      <div class="steps-container">
        <div
            v-for="(step, index) in steps"
            :key="index"
            class="step-card"
        >
          <div class="step-icon">
            <span class="step-number">{{ index + 1 }}</span>
          </div>
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-desc">{{ step.description }}</p>
          <router-link
              v-if="step.link"
              :to="step.link"
              class="step-link"
          >
            페이지로 이동 →
          </router-link>

          <!-- 중앙 연결선 -->
          <div v-if="index < steps.length - 1" class="step-connector">
            <div class="connector-line"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- 승인 절차 + 안내 박스들 -->
    <section class="row-section">
      <!-- 승인 절차 -->
      <div class="half-section timeline-box">
        <h2 class="section-title">승인 절차</h2>
        <div class="timeline">
          <div v-for="(step, index) in approvalSteps" :key="index" class="timeline-item">
            <div class="timeline-icon">{{ approvalIcons[index] }}</div>
            <div class="timeline-content">
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 안내 박스들 -->
      <div class="half-section">
        <!-- 주의사항 -->
        <div class="info-box">
          <h2 class="section-title">주의 사항</h2>
          <ul class="warning-list">
            <li>잘못된 정보는 송금 지연 또는 반려의 원인이 될 수 있습니다.</li>
            <li>환율 변동에 따라 송금 금액이 달라질 수 있으니 송금 전 확인하세요.</li>
            <li>송금 처리 시간은 국가, 은행, 공휴일에 따라 달라질 수 있습니다.</li>
            <li>수취인 정보가 정확해야 송금 지연이나 반려를 방지할 수 있습니다.</li>
            <li>고액 송금 시 추가 서류 제출이 필요할 수 있습니다.</li>
          </ul>
        </div>

        <!-- 필요 서류 -->
        <div class="info-box">
          <h2 class="section-title">필요 서류 안내</h2>
          <ul class="warning-list">
            <li>본인인증 서류 - 기본 증명서, 신분증 사본, 운전 면허증 사본 등</li>
            <li>송금 사유 증빙 서류 - 유학 증명서 등</li>
            <li>관계 증빙 서류 - 가족 관계 증명서, 기본 증명서 등</li>
          </ul>
        </div>
      </div>
    </section>
    <!-- 고객센터 -->
    <section class="info-box">
      <h2 class="section-title">고객센터 안내</h2>
      <p>
        문의 사항은 <strong>02-5173-1111</strong> / <strong>02-8080-1111</strong> 으로 연락주시거나,
        <a href="#">고객센터</a>, <a href="#">챗봇</a>을 이용해주세요.
      </p>
    </section>
  </div>
</template>

<script>
export default {
  data() {
    return {
      steps: [
        {
          title: '수취인 정보 등록',
          description: '송금 요청 전 수취인 정보를 작성하여 수취인을 등록합니다.',
          icon: 'fas fa-user-check',
          link: '/recipients/post',
        },
        {
          title: '송금 요청 신청서 작성',
          description: '온라인 송금 요청 신청서를 작성하여 송금을 요청합니다.',
          icon: 'fas fa-pencil-alt',
          link: '/ForeignTransfer',
        },
        {
          title: '송금 요청 승인',
          description: '작성한 송금 요청서를 확인하고 송금 승인을 진행합니다.',
          icon: 'fas fa-check-circle',
          link: '/ForeignTransfer/list',
        },
        {
          title: '송금 완료',
          description: '송금이 완료되면 수취인에게 알림이 발송되어 송금 완료 사실을 안내합니다.',
          icon: 'fas fa-receipt',
        },
      ],
      approvalSteps: [
        {
          title: '송금 요청 접수',
          description: '고객이 송금 신청서와 수취인 정보를 제출합니다.',
        },
        {
          title: '내부 확인 및 승인',
          description: '제출된 정보와 서류를 검토하여 승인 절차를 진행합니다.',
        },
        {
          title: '송금 처리',
          description: '승인 후 출금 계좌에서 금액이 인출되어 은행으로 송금됩니다.',
        },
        {
          title: '송금 완료 안내',
          description: '송금 완료 후 고객님께 알림으로 결과가 전달됩니다.',
        },
      ],
      approvalIcons: ['1','2','3','4']
    };
  },
};
</script>

<style scoped>
.remittance-cards-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  color: #333;
  font-family: Arial, sans-serif;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #008681;
  text-align: center;
  margin-top: 10px;
  margin-bottom: 30px;
  font-family: 'Pretendard Variable', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
}

.section-title {
  font-size: 1.5rem;
  color: #009b99;
  margin-bottom: 15px;
  margin-top: 10px;
}

/* 송금 절차 카드 */
.steps-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  position: relative;
}

.step-card {
  flex: 1 1 220px;
  background: #f9f9f9;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  position: relative;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}

.step-icon {
  width: 50px;
  height: 50px;
  margin: 0 auto 10px;
  background: #009b99;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.step-title {
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.step-desc {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
}

.step-link {
  display: inline-block;
  margin-top: 5px;
  font-size: 0.85rem;
  font-weight: bold;
  color: #009b99;
  text-decoration: none;
}

.step-link:hover {
  text-decoration: underline;
}

/* 카드 연결선 중앙 + 선명하게 */
.step-connector {
  position: absolute;
  top: 50%; /* 카드 높이 중앙에 맞춤 */
  right: -20px; /* 카드 간격 고려 */
  width: 20px; /* 연결선 길이 */
  height: 4px; /* 선 두께 */
  background: #009b99;
  border-radius: 2px;
  transform: translateY(-50%);
  z-index: 0;
}

.connector-line {
  width: 100%;
  height: 100%;
  background: #009b99;
  border-radius: 2px;
}

/* 승인 절차 타임라인 */
.timeline-item {
  display: flex;
  align-items: flex-start;
  position: relative;
  margin-bottom: 2rem;
  min-height: 80px; /* step-card 높이와 비슷하게 조정 */
}

.timeline-content {
  background: #f9f9f9;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
  flex: 1;
  min-height: 80px; /* step-card와 동일 높이 */
}

.timeline-item::before {
  content: '';
  position: absolute;
  top: 22px;
  left: 22px;
  width: 2px;
  height: 100%;
  background: #009b99;
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-icon {
  background: #009b99;
  color: #fff;
  font-size: 1.2rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
  z-index: 1;
}

.timeline-content {
  background: #f9f9f9;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
  flex: 1;
}

.timeline-content h3 {
  margin: 0 0 0.5rem;
  color: #009b99;
  font-size: 1.1rem;
}

.timeline-content p {
  margin: 0;
  color: #555;
  line-height: 1.5;
}

/* 승인 절차 + 안내 박스 한 행 */
.row-section {
  display: flex;
  gap: 20px;
  margin-top: 25px;
}

.half-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 안내 박스 */
.info-box {
  background: #f9f9f9;
  padding: 20px 25px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
  margin-bottom: 43px;
}

.warning-list {
  margin: 0;
  padding-left: 20px;
}

.warning-list li {
  margin-bottom: 10px;
  line-height: 1.6;
  color: black;
}

a {
  color: #009b99;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* 모바일 대응 */
@media (max-width: 768px) {
  .steps-container {
    flex-direction: column;
    align-items: center;
  }
  .step-connector {
    display: none;
  }
  .row-section {
    flex-direction: column;
  }
  .timeline {
    padding-left: 20px;
  }
  .timeline-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .timeline-item::before {
    left: 22px;
    top: 44px;
  }
}
</style>
