<template>
  <footer class="footer-bar">
    <div class="footer-top">
      <div class="footer-links-texts">
        <!-- <span>사고신고</span>
        <span>인증센터</span>
        <span>손님의소리(칭찬/불만/제안 등)</span>
        <span>상담센터</span>
        <span class="bold">개인정보처리방침</span>
        <span>영업점 찾기</span> -->
        <div class="footer-copy">
        © Korex. All rights reserved.
      </div>
      </div>
      <div class="footer-customer">
        <div>
          <span class="label">고객센터</span>
          <span class="number">5173-1111 / 8080-1111</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'FooterBar',
};
</script>

<style scoped>
.footer-bar {
  background: #fff;
  border-top: 1.5px solid #e0e0e0;
  padding: 10px 0 0 0;
  font-family: 'Noto Sans KR', Arial, sans-serif;
  color: #222;
  font-size: 1rem;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 3px 0px 3px 4px;
  flex-wrap: wrap;
  gap: 20px;
  font-family: 'Noto Sans KR', Arial, sans-serif;
  color: #222;
  font-size: 1rem;
  background: #fff;
}

.footer-links-texts {
  display: flex;
  flex-wrap: wrap;
  gap: 15px 25px;
  min-width: 250px;
  max-width: 100%;
  line-height: 2;
  color: #444;
}

.footer-links-texts span {
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s;
}

.footer-links-texts span:hover {
  color: #009490;
}

.footer-links-texts .bold {
  font-weight: 700;
  color: #009490;
}

.footer-customer {
  text-align: right;
  min-width: 220px;
  margin-top: 0;
}

.footer-customer .label {
  display: block;
  color: #009490;
  font-size: 0.98rem;
  margin-bottom: 2px;
}

.footer-customer .number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #222;
}

.footer-copy {
  color: #888;
  font-size: 0.9rem;
  min-width: 180px;
  white-space: nowrap;
  margin: 0;
  line-height: 1.8;
  user-select: none;
  text-align: left;
  flex-basis: 100%;
  order: 2;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 48px 0 48px;
}

.consumer-btn {
  background: #f7f7f7;
  border: none;
  border-radius: 16px;
  padding: 10px 24px;
  font-size: 1.1rem;
  color: #009490;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.consumer-btn:hover {
  background: #e0f7f4;
}

@media (max-width: 900px) {
  .footer-top {
    flex-direction: column;
    align-items: flex-start;
    padding: 0 16px;
  }
  .footer-customer {
    text-align: left;
    margin-top: 16px;
  }
  .footer-middle, .footer-bottom {
    padding-top: 16px;
  }
  .footer-copy {
    flex-basis: auto;
    order: unset;
  }
}
</style>