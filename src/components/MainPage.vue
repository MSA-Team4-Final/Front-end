<template>
  <div class="home-system">
    <div class="mainpage-wrap">
      <div class="mainpage-top">
        <div 
          class="carousel-area"
          @mouseenter="pauseAutoSlide"
          @mouseleave="resumeAutoSlide"
        >
          <div class="carousel-container">
            <div class="carousel-wrapper" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">

              <div class="carousel-slide">
                <div class="carousel-label">환영합니다</div> 
                <div class="carousel-title">스마트한 환율 관리<br>시작하세요!</div>
                <div class="carousel-desc">실시간 환율 정보와<br>맞춤형 알림 서비스</div>
                <button class="carousel-btn" @click="$router.push('/rate-lookup')">환율 조회하기</button>
              </div>
              
              <div class="carousel-slide">
                <div class="carousel-label">환율뉴스</div>
                <div class="carousel-title">실시간 환율<br>뉴스 & 동향</div>
                <div class="carousel-desc">최신 환율 소식과<br>전문가 분석을 확인하세요</div>
                <button class="carousel-btn" @click="$router.push('/rate-news')">뉴스 보기</button>
              </div>

              <div class="carousel-slide">
                <div class="carousel-label">이벤트</div>
                <div class="carousel-title">알람이 울리는 순간<br>돈기운이 터진다!</div>
                <div class="carousel-desc">놀이터랑 친구하고<br>도나와라 머니클락 굿즈 받기</div>
                <button class="carousel-btn">자세히보기</button>
              </div>

            </div>
            <div class="carousel-indicators">
              <button 
                v-for="(slide, index) in totalSlides" 
                :key="index"
                class="indicator"
                :class="{ active: currentSlide === index }"
                @click="goToSlide(index)"
              ></button>
            </div>
            
            <button class="carousel-nav prev" @click="prevSlide">‹</button>
            <button class="carousel-nav next" @click="nextSlide">›</button>
          </div>

      </div>

          <div class="mainpage-icon-menu">
            <div class="icon-menu-row">
              <button class="icon-menu-btn" @click="onFeatureClick('rate-lookup')">
                <img src="@/assets/환율버튼.png" alt="환율조회" class="icon-img" />
                <span>환율조회</span>
              </button>
              <button class="icon-menu-btn" @click="onFeatureClick('remittance')">
                <img src="@/assets/친구송금버튼.png" alt="친구송금" class="icon-img" />
                <span>친구송금</span>
              </button>
            </div>

            <div class="icon-menu-row">  
              <button class="icon-menu-btn" @click="onFeatureClick('exchange')">
                <img src="@/assets/환전버튼.png" alt="환전" class="icon-img" />
                <span>환전</span>
              </button>
              <button class="icon-menu-btn" @click="onFeatureClick('ForeignTransfer')">
                <img src="@/assets/해외송금버튼.png" alt="해외송금" class="icon-img" />
                <span>해외송금</span>
              </button>
            </div>

            <div class="icon-menu-row single">
              <button class="icon-menu-btn" @click="onFeatureClick('accountDetail')">
                <img src="@/assets/계좌조회버튼.png" alt="계좌 조회" class="icon-img" />
                <span>계좌조회</span>
              </button>
            </div>

          </div>
      </div>
      
      <div class="exchange-news-container">
        <div class="exchange-rate-section">
          <div class="section-header" @click="$router.push('/rate-lookup')" style="cursor: pointer;">
            <h2>환율 정보</h2>
            <div class="last-update"></div>
          </div>
          
          <div class="forex-rate-container">
            <div class="forex-rate-list">
              <div
                  v-for="item in processedForexRates"
                  :key="item.currency_code"
                  class="rate-row"
              >
                <span class="flag" aria-hidden="true">{{ item.flag }}</span>
                <span class="pair">{{ item.pair }}</span>
                <span class="rate">{{ formatRate(item.base_rate) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="exchange-news-section">

          <div class="section-header" @click="$router.push('/rate-news')" style="cursor: pointer;">
            <h2>환율 뉴스</h2>
            <div class="last-update"></div>
          </div>

          <div class="news-container">
            <div class="news-list">
              <div
                  v-for="news in exchangeNews"
                  :key="news.link"
                  class="news-item"
                  @click="openNewsLink(news.link)"
              >
                <div class="news-title">{{ news.title }}</div>
                <div class="news-time">{{ formatNewsTime(news.date) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      forexRates: {},
      lastUpdateTime: '',
      exchangeNews: [],
      newsUpdateTime: '',
      loading: false,
      error: null,
      // 캐러셀 관련 데이터
      currentSlide: 0,
      totalSlides: 3,
      autoSlideInterval: null
    };
  },
  computed: {
    processedForexRates() {
      const rates = [];
      const currencyFlags = {
        'USD': '🇺🇸', 'JPY': '🇯🇵', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'CHF': '🇨🇭',
        'CAD': '🇨🇦', 'AUD': '🇦🇺', 'NZD': '🇳🇿', 'HKD': '🇭🇰', 'CNY': '🇨🇳',
        'SEK': '🇸🇪', 'DKK': '🇩🇰', 'NOK': '🇳🇴', 'THB': '🇹🇭', 'SGD': '🇸🇬'
      };
      
      Object.keys(this.forexRates).forEach(currencyCode => {
        const currencyData = this.forexRates[currencyCode];
        if (currencyData && currencyData.currency_code) {
          rates.push({
            currency_code: currencyCode,
            pair: `${currencyCode}/KRW`,
            flag: currencyFlags[currencyCode] || '💱',
            base_rate: currencyData.base_rate,
            crawl_time: currencyData.crawl_time
          });
        }
      });
      
      // 원하는 순서대로 정렬
      const order = ['USD', 'JPY', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'NZD', 'HKD', 'CNY', 'SEK', 'DKK', 'NOK', 'THB', 'SGD'];
      return rates.sort((a, b) => {
        const aIndex = order.indexOf(a.currency_code);
        const bIndex = order.indexOf(b.currency_code);
        return aIndex - bIndex;
      });
    }
  },
  async mounted() {
    await Promise.all([
      this.fetchExchangeRates(),
      this.fetchExchangeNews()
    ]);

    // 캐러셀 자동 슬라이드 시작
    this.startAutoSlide();
    // 1분마다 환율 데이터 업데이트
    setInterval(this.fetchExchangeRates, 60 * 1000);
    // 5분마다 뉴스 데이터 업데이트
    setInterval(this.fetchExchangeNews, 5 * 60 * 1000);
  },
  beforeUnmount() { // Vue 3 호환성을 위해 beforeDestroy -> beforeUnmount로 변경
    // 컴포넌트 파괴 시 인터벌 정리
    this.stopAutoSlide();
  },
  methods: {
    // 캐러셀 관련 메서드
    nextSlide() {
      this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    },
    prevSlide() {
      this.currentSlide = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
    },
    goToSlide(index) {
      this.currentSlide = index;
    },
    startAutoSlide() {
      // 이미 실행 중인 인터벌이 있다면 중복 실행 방지
      if (this.autoSlideInterval) return;
      this.autoSlideInterval = setInterval(() => {
        this.nextSlide();
      }, 4000); // 4초마다 자동 슬라이드
    },
    stopAutoSlide() {
      if (this.autoSlideInterval) {
        clearInterval(this.autoSlideInterval);
        this.autoSlideInterval = null;
      }
    },
    // 마우스 호버 시 자동 슬라이드 정지/재시작
    pauseAutoSlide() {
      this.stopAutoSlide();
    },
    resumeAutoSlide() {
      this.startAutoSlide();
    },
    
    async fetchExchangeRates() {
      try {
        this.loading = true;
        this.error = null;
        
        const response = await fetch('/api/exchange/main-page-data');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        this.forexRates = data;
        
        const firstCurrency = Object.keys(data)[0];
        if (data[firstCurrency] && data[firstCurrency].crawl_time) {
          this.lastUpdateTime = data[firstCurrency].crawl_time;
        }
        
      } catch (error) {
        console.error('환율 데이터를 가져오는 중 오류 발생:', error);
        this.error = '환율 데이터를 불러올 수 없습니다.';
      } finally {
        this.loading = false;
      }
    },
    
    formatRate(rate) {
      if (!rate) return '-';
      return rate.toString();
    },
    
    async fetchExchangeNews() {
      try {
        const response = await fetch('/api/exchange/news');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        this.exchangeNews = data;
        
        if (data.length > 0) {
          this.newsUpdateTime = data[0].crawl_time;
        }
        
      } catch (error) {
        console.error('환율 뉴스를 가져오는 중 오류 발생:', error);
      }
    },
    
    formatNewsTime(timeString) {
      if (!timeString) return '';
      const date = new Date(timeString);
      return date.toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    openNewsLink(link) {
      window.open(link, '_blank');
    },
    
    goForex() {
      window.location.href = '/rate-lookup';
    },
    
    onFeatureClick(feature) {
      if (feature === 'rate-lookup') {
        this.$router.push('/rate-lookup');
      }
      else if (feature === 'ForeignTransfer') {
        this.$router.push('/ForeignTransfer')
      }
      else if (feature === 'remittance') {
        this.$router.push('/remittance')
      }
      else if (feature === 'exchange') {
        this.$router.push('/exchange')
      }
      else if (feature === 'accountDetail') {
        this.$router.push('/mypage?section=accountDetail')
      }
      else {
        alert('준비중인 기능입니다: ' + feature);
      }
    },
    
    goAccount(){
      window.location.href = '#/Account';
    }
  },
};
</script>

<style scoped>
.home-system {
  font-family: 'Noto Sans KR', Arial, sans-serif;
  background: #f4f8fb;
  min-height: 100vh;
  width: 100%;
  min-width: 0;
}

.mainpage-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 40px 24px;
}

.mainpage-top {
  display: flex;
  gap: 30px; /* 캐러셀과 버튼 메뉴 사이 간격 추가 */
  justify-content: space-between;
  align-items: flex-start;
  padding-top: 70px; /* 헤더와의 사이 간격 추가 */
}

/* 캐러셀 영역 수정 */
.carousel-area {
  flex: 1;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(217, 18, 18, 0.06);
  min-width: 800px; /* 340px → 280px로 줄임 */
  min-height: 380px; /* 400px → 500px로 증가 */
  height: 100%; /* 부모 컨테이너 높이에 맞춤 */
  position: relative;
  overflow: hidden;
}

.carousel-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.carousel-wrapper {
  display: flex;
  width: 300%; /* 3개 슬라이드 */
  height: 100%;
  transition: transform 0.5s ease-in-out;
}

.carousel-slide {
  width: 100%; /*한 슬라이드에 전부 나오도록  */
  padding: 40px 36px 36px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box; /* 패딩이 너비에 포함되도록 설정 */

}

.carousel-label {
  display: inline-block;
  background: #f4f8fb;
  color: #222;
  font-size: 1rem;
  border-radius: 8px;
  padding: 4px 16px;
  margin-bottom: 18px;
  width: fit-content;
}

.carousel-title {
  font-size: 2.1rem;
  font-weight: bold;
  color: #111;
  margin-bottom: 18px;
  line-height: 1.3;
}

.carousel-desc {
  color: #888;
  font-size: 1.1rem;
  margin-bottom: 24px;
}

.carousel-btn {
  background: #009490;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: fit-content;
}

.carousel-btn:hover {
  background: #009490;
}

/* 인디케이터 스타일 */
.carousel-indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: background 0.3s;
  padding: 0;
}

.indicator.active {
  background: #009490;
}

/* 네비게이션 버튼 */
.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.8);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.3s, background 0.3s;
  color: #333;
  opacity: 0; /* 기본적으로 숨김 */
}

.carousel-area:hover .carousel-nav {
  opacity: 1; /* 호버 시 나타남 */
}

.carousel-nav:hover {
  background: rgba(255, 255, 255, 0.95);
}

.carousel-nav.prev {
  left: 15px;
}

.carousel-nav.next {
  right: 15px;
}

/* 개인화 인사말 스타일 추가 */
.welcome-message {
  font-size: 1.2rem;
  font-weight: 600;
  color: #009490;
  margin-bottom: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.mainpage-icon-menu {
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-items: center;
  
}

.icon-menu-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 110px;
  border-radius: 16px;
  border: none;
  background: #e0f7f4;
  color: #009490;
  box-shadow: 0 2px 8px rgba(0,148,144,0.08);
  font-size: 1.08rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  
}

.icon-menu-btn .icon-img {
  width: 40px;
  height: 40px;
  margin-bottom: 10px;
}

.icon-menu-btn:hover {
  background: #009490;
  color: #fff;
}

.icon-menu-row {
  display: flex;
  flex-direction: row;
  gap: 30px; /* 15px → 25px로 증가 */
  justify-content: center;
  align-items: center;
}

/* 맨 위 계좌조회 버튼을 넓게 */
.icon-menu-row.single .icon-menu-btn {
  flex-direction: row;
  width: 265px; /* 120px + 25px(gap) + 120px */
  height: 110px;
}

/* 환율 정보와 뉴스 컨테이너 */
.exchange-news-container {
  margin-top: 80px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* 환율 정보 섹션 스타일 */
.exchange-rate-section {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.section-header {
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.section-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #111;
}

.last-update {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.forex-rate-container {
  max-height: 400px;
  overflow-y: auto;
}

.forex-rate-list {
  background: #fff;
}

.rate-row {
  display: grid;
  grid-template-columns: 80px 1fr 120px;
  align-items: center;
  padding: 16px 24px;
  font-size: 1.05rem;
  font-weight: 600;
  transition: background-color 0.2s;
}

.rate-row:hover {
  background-color: #f8f9fa;
}

.rate-row + .rate-row {
  border-top: 1px solid #f0f0f0;
}

.flag {
  font-size: 1.7rem;
  margin-right: 8px;
  color: #111;
}

.pair {
  font-weight: 700;
  color: #111;
}

.rate {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

/* 스크롤바 스타일링 */
.forex-rate-container::-webkit-scrollbar {
  width: 8px;
}

.forex-rate-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.forex-rate-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.forex-rate-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 환율 뉴스 섹션 스타일 */
.exchange-news-section {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.news-container {
  max-height: 400px;
  overflow-y: auto;
}

.news-list {
  background: #fff;
}

.news-item {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.news-item:hover {
  background-color: #f8f9fa;
}

.news-item:last-child {
  border-bottom: none;
}

.news-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-time {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

/* 뉴스 스크롤바 스타일링 */
.news-container::-webkit-scrollbar {
  width: 8px;
}

.news-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.news-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.news-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@media (max-width: 900px) {
  .mainpage-top {
    flex-direction: column;
    gap: 18px;
  }
  
  .exchange-news-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .rate-row {
    grid-template-columns: 60px 1fr 100px;
    padding: 14px 16px;
    font-size: 0.95rem;
  }
  
  .section-header {
    padding: 20px 20px 12px 20px;
  }
  
  .section-header h2 {
    font-size: 1.2rem;
  }
}

@media (max-width: 600px) {
  .carousel-slide {
    padding: 30px 24px 24px 24px;
  }
  
  .carousel-title {
    font-size: 1.8rem;
  }
  
  .carousel-desc {
    font-size: 1rem;
  }
  
  .welcome-message {
    font-size: 1.1rem;
    margin-bottom: 12px;
  }
  
  .carousel-nav {
    width: 35px;
    height: 35px;
    font-size: 1.2rem;
  }
  
  .exchange-news-container {
    gap: 12px;
  }
  
  .rate-row {
    grid-template-columns: 50px 1fr 80px;
    padding: 12px 12px;
    font-size: 0.9rem;
  }
  
  .flag {
    font-size: 1.4rem;
  }
  
  .section-header {
    padding: 16px 16px 10px 16px;
  }
  
  .news-item {
    padding: 12px 16px;
  }
  
  .news-title {
    font-size: 0.9rem;
  }
}
</style>