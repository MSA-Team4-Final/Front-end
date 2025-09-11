<template>
  <div v-if="isOpen" class="chatbot-container" :class="{ minimized: isMinimized }" :style="containerStyle">
    <div class="chatbot-header" @mousedown="startDrag" @touchstart.prevent="startDrag">
      <div class="chatbot-title">💬 Korex 챗봇</div>
      <button class="close-btn" @click="toggleOpen">×</button>
    </div>

    <div class="chatbot-body">
      <div class="messages" ref="messagesContainer">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.sender === '사용자' ? 'user' : 'bot']">
          <span class="sender">{{ msg.sender }}:</span> {{ msg.text }}
        </div>
      </div>

      <input
        type="text"
        v-model="inputText"
        @keyup.enter="sendMessage"
        placeholder="메시지를 입력하세요"
        :disabled="isSending"
        aria-label="챗봇 메시지 입력창"
      />
    </div>

    <!-- 크기 조절 핸들 -->
    <div class="resize-handle" @mousedown="startResize" @touchstart.prevent="startResize"></div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Chatbot',
  data() {
    return {
      isOpen: false,
      isMinimized: false,
      inputText: '',
      messages: [],
      isSending: false,
      sessionId: '',
      dragging: false,
      resizing: false,
      posX: 0,
      posY: 150,
      dragOffsetX: 0,
      dragOffsetY: 0,
      containerWidth: 350,
      containerHeight: 500,
      startMouseX: 0,
      startMouseY: 0,
      startWidth: 350,
      startHeight: 500,
      minWidth: 280,
      maxWidth: 640,
      minHeight: 280,
      maxHeight: 840
    };
  },
  mounted() {
    const saved = localStorage.getItem('chatbotSessionId');
    if (saved) {
      this.sessionId = saved;
    } else {
      const generated = `web-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      this.sessionId = generated;
      localStorage.setItem('chatbotSessionId', generated);
    }

    // 초기 위치를 챗봇 버튼 위쪽으로 설정
    this.setInitialPosition();

    // 이벤트 리스너 등록
    window.addEventListener('mousemove', this.onDrag);
    window.addEventListener('mouseup', this.stopDrag);
    window.addEventListener('touchmove', this.onDrag, { passive: false });
    window.addEventListener('touchend', this.stopDrag);
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('toggle-chatbot', this.onToggleEvent);
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onDrag);
    window.removeEventListener('mouseup', this.stopDrag);
    window.removeEventListener('touchmove', this.onDrag);
    window.removeEventListener('touchend', this.stopDrag);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('toggle-chatbot', this.onToggleEvent);
  },
  methods: {
    setInitialPosition() {
      // 챗봇 버튼 위치에 맞춘 초기 위치 설정
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // 챗봇 버튼이 bottom: 24px, right: 24px에 있음
      // 챗봇 창을 그 위쪽에 위치시킴
      this.posX = Math.max(0, vw - this.containerWidth - 24);
      this.posY = Math.max(0, vh - this.containerHeight - 90);
    },
    onToggleEvent() {
      // 헤더 챗봇 버튼으로 열기/닫기 토글
      this.isOpen = !this.isOpen;
      
      if (this.isOpen) {
        this.setInitialPosition();
        this.$nextTick(() => this.scrollToBottom());
      }
    },
    toggleOpen() {
      // X 버튼으로 닫기
      this.isOpen = false;
    },
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    async sendMessage() {
      const prompt = this.inputText.trim();
      if (!prompt || this.isSending) return;

      this.isSending = true;
      this.messages.push({ sender: '사용자', text: prompt });
      this.inputText = '';
      this.$nextTick(() => this.scrollToBottom());

      try {
        const response = await axios.post('/api/chatbot/ask', {
          prompt: prompt,
          sessionId: this.sessionId,
        });

        const botReply =
          typeof response.data === 'string'
            ? response.data
            : response.data.response || '응답이 없습니다.';

        this.messages.push({ sender: '챗봇', text: botReply });
      } catch (error) {
        this.messages.push({
          sender: '챗봇',
          text: '오류가 발생했습니다. 다시 시도해 주세요.',
        });
      } finally {
        this.isSending = false;
        this.$nextTick(() => this.scrollToBottom());
      }
    },
    startDrag(e) {
      if (!this.isOpen) return;
      const point = e.touches ? e.touches[0] : e;
      this.dragging = true;
      this.resizing = false;
      this.dragOffsetX = point.clientX - this.posX;
      this.dragOffsetY = point.clientY - this.posY;
    },
    startResize(e) {
      if (!this.isOpen) return;
      const point = e.touches ? e.touches[0] : e;
      this.resizing = true;
      this.dragging = false;
      this.startMouseX = point.clientX;
      this.startMouseY = point.clientY;
      this.startWidth = this.containerWidth;
      this.startHeight = this.containerHeight;
    },
    onDrag(e) {
      const point = e.touches ? e.touches[0] : e;
      if (e.cancelable) e.preventDefault();
      
      if (this.dragging) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const maxX = Math.max(0, vw - this.containerWidth);
        const maxY = Math.max(0, vh - this.containerHeight);
        const nextX = point.clientX - this.dragOffsetX;
        const nextY = point.clientY - this.dragOffsetY;
        this.posX = Math.min(Math.max(0, nextX), maxX);
        this.posY = Math.min(Math.max(0, nextY), maxY);
      } else if (this.resizing) {
        const deltaX = point.clientX - this.startMouseX;
        const deltaY = point.clientY - this.startMouseY;
        let nextW = this.startWidth + deltaX;
        let nextH = this.startHeight + deltaY;
        
        nextW = Math.min(Math.max(this.minWidth, nextW), this.maxWidth);
        nextH = Math.min(Math.max(this.minHeight, nextH), this.maxHeight);
        
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (this.posX + nextW > vw) nextW = vw - this.posX;
        if (this.posY + nextH > vh) nextH = vh - this.posY;
        
        this.containerWidth = nextW;
        this.containerHeight = nextH;
      }
    },
    stopDrag() {
      this.dragging = false;
      this.resizing = false;
    },
    onWindowResize() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      this.posX = Math.min(this.posX, Math.max(0, vw - this.containerWidth));
      this.posY = Math.min(this.posY, Math.max(0, vh - this.containerHeight));
      
      if (this.posX + this.containerWidth > vw) {
        this.containerWidth = Math.max(this.minWidth, vw - this.posX);
      }
      if (this.posY + this.containerHeight > vh) {
        this.containerHeight = Math.max(this.minHeight, vh - this.posY);
      }
    },
  },
  computed: {
    containerStyle() {
      return {
        top: this.posY + 'px',
        left: this.posX + 'px',
        width: this.containerWidth + 'px',
        height: this.containerHeight + 'px'
      };
    }
  }
};
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  background: white;
  border: 1px solid #009490;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 148, 144, 0.15);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow: hidden;
  /* 아래에서 위로 슬라이드 애니메이션 */
  animation: slideUp 0.3s ease-out;
}

/* 슬라이드 업 애니메이션 */
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 나가는 애니메이션 (Vue transition 사용 시) */
.chatbot-container.slide-down {
  animation: slideDown 0.3s ease-in forwards;
}

@keyframes slideDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
}

.chatbot-header {
  background: #009490;
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  border-radius: 12px 12px 0 0;
}

.chatbot-title {
  font-weight: 600;
  font-size: 14px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 18px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chatbot-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
  background: white;
}

.messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
  padding-right: 8px;
  word-break: break-word;
}

.message {
  margin-bottom: 12px;
  line-height: 1.4;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 85%;
}

.message.user {
  background-color: #009490;
  color: white;
  align-self: flex-end;
  margin-left: auto;
}

.message.bot {
  background-color: #f0f8f8;
  color: #333;
  align-self: flex-start;
  border: 1px solid #e0f0f0;
}

.sender {
  font-weight: 600;
  margin-right: 6px;
}

input[type='text'] {
  border: 1px solid #009490;
  padding: 12px;
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

input[type='text']:focus {
  border-color: #007b78;
  box-shadow: 0 0 0 2px rgba(0, 148, 144, 0.1);
}

.resize-handle {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 14px;
  height: 14px;
  cursor: se-resize;
}

.resize-handle::before {
  content: '';
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 8px;
  height: 8px;
  border-right: 2px solid #009490;
  border-bottom: 2px solid #009490;
  opacity: 0.5;
}
</style>
