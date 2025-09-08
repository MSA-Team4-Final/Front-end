<template>
  <div class="completion-step-container">
    <div class="completion-message-box">
      <h2 class="title">해외 송금 신청이 완료되었습니다.</h2>
      <p class="subtitle">
        고객님의 소중한 송금 건이 정상적으로 처리되었습니다. <br />
        더욱 안전하고 편리한 서비스를 위해 노력하겠습니다.
      </p>
    </div>

    <div class="button-group">
      <button @click="$emit('go-home')">홈으로 돌아가기</button>
      <button @click="$emit('go-to-history')">내역 조회</button>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'

// emit 이벤트를 업데이트합니다.
defineEmits(['go-home', 'go-to-history'])
</script>

<style scoped>
/* 템플릿의 클래스 이름과 일치하도록 수정 */
.completion-step-container { background:#fff; border-radius:12px; padding:24px; margin-bottom:20px; text-align:center; }
.completion-message-box .title { font-size:26px; font-weight:700; color:#008681; margin-bottom:10px; }
.completion-message-box .subtitle { font-size:16px; margin-bottom:20px; color:#333; }
.button-group button { padding:10px 20px; border-radius:8px; border:none; background:#009b99; color:white; font-weight:600; cursor:pointer; margin: 0 5px; }
.button-group button:hover { background:#008681; }
.icon-circle { font-size: 3rem; color: #008681; margin-bottom: 15px; }
</style>
