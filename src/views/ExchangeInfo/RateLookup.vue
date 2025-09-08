<template>
  <div class="forex-system">

    <div class="content-wrap">
      <main class="main-content">
        <h1>환율 조회</h1>
        <TabNav current="rateLookup" />

        <!-- 환율 조회 탭 버튼들 -->
        <nav class="tabs">
          <button 
            :class="{ active: activeTab === 'realtime' }" 
            @click="activeTab = 'realtime'"
          >
            실시간 환율
          </button>
          <button 
            :class="{ active: activeTab === 'bydate' }" 
            @click="activeTab = 'bydate'"
          >
            날짜별 환율
          </button>
          <button 
            :class="{ active: activeTab === 'bycurrency' }" 
            @click="activeTab = 'bycurrency'"
          >
            통화별 환율
          </button>
       
        </nav>

        <!-- 실시간 환율 조회 -->
        <section v-if="activeTab === 'realtime'" class="search-box">
          <h3>실시간 환율 조회</h3>
          <p class="description">실시간 환율 정보입니다.(기준 시간 기준: )</p>
          
          <div v-if="realTimeRates.length > 0" class="result-box">
            <h4>실시간 환율 결과</h4>
            <div class="rates-table">
              <table>
                <thead>
                  <tr>
                    <th rowspan="2">통화</th>
                    <th rowspan="2">매매기준율</th>
                    <th colspan="2">현찰</th>
                    <th colspan="2">송금</th>
                    <th rowspan="2">대미환산율</th>
                  </tr>
                  <tr>
                    <th>사실때</th>
                    <th>파실때</th>
                    <th>보내실때</th>
                    <th>받으실때</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rate in realTimeRates" :key="rate.currency_code">
                    <td>
                      <button 
                        class="currency-link" 
                        @click="showCurrencyDetail(rate.currency_code)"
                      >
                        {{ rate.currency_code }}
                      </button>
                    </td>
                    <td>{{ rate.base_rate }}</td>
                    <td>{{ rate.buy_cash_rate }}</td>
                    <td>{{ rate.sell_cash_rate }}</td>
                    <td>{{ rate.send_rate }}</td>
                    <td>{{ rate.receive_rate }}</td>
                    <td>{{ rate.usd_conversion_rate }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- 날짜별 환율 조회 -->
        <section v-if="activeTab === 'bydate'" class="search-box">
          <h3>날짜별 환율 조회</h3>
          <p class="description">특정 날짜의 여러 통화 환율을 조회합니다.</p>
          <form @submit.prevent="getRatesByDate">
            <label>
              날짜 선택
              <input type="date" v-model="selectedDate" required />
            </label>
            <button type="submit" :disabled="loading" class="primary-btn">
              {{ loading ? '조회 중...' : '날짜별 환율 조회' }}
            </button>
          </form>
          
          <div v-if="ratesByDate.length > 0" class="result-box">
            <h4>{{ selectedDate }} 환율 결과</h4>
            <div class="rates-table">
              <table>
                <thead>
                  <tr>
                    <th rowspan="2">통화</th>
                    <th rowspan="2">매매기준율</th>
                    <th colspan="2">현찰</th>
                    <th colspan="2">송금</th>
                  </tr>
                  <tr>
                    <th>사실때</th>
                    <th>파실때</th>
                    <th>보내실때</th>
                    <th>받으실때</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rate in ratesByDate" :key="rate.currencyCode">
                    <td>{{ rate.currencyCode }}</td>
                    <td>{{ rate.baseRate }}</td>
                    <td>{{ rate.buyCashRate }}</td>
                    <td>{{ rate.sellCashRate }}</td>
                    <td>{{ rate.sendRate }}</td>
                    <td>{{ rate.receiveRate }}</td>
                  </tr>
                </tbody>
              </table>

            </div>
          </div>
        </section>

        <!-- 통화별 환율 조회 -->
        <section v-if="activeTab === 'bycurrency'" class="search-box">
          <h3>통화별 환율 조회</h3>
          <p class="description">특정 통화의 일자별 환율 변동을 조회합니다.</p>
          <form @submit.prevent="getRatesByCurrency">
            <label>
              통화 선택
              <select v-model="selectedCurrency" required>
                <option value="">선택하세요</option>
                <option value="USD">USD - 미국 달러</option>
                <option value="EUR">EUR - 유로</option>
                <option value="JPY">JPY - 일본 엔</option>
                <option value="GBP">GBP - 파운드 스털링</option>
                <option value="AUD">AUD - 호주 달러</option>
                <option value="CAD">CAD - 캐나다 달러</option>
                <option value="CHF">CHF - 스위스 프랑</option>
                <option value="CNY">CNY - 중국 위안</option>
              </select>
            </label>
            <button type="submit" :disabled="loading" class="primary-btn">
              {{ loading ? '조회 중...' : '통화별 환율 조회' }}
            </button>
          </form>
          
          <div v-if="ratesByCurrency.length > 0" class="result-box">
            <h4>{{ selectedCurrency }} 일자별 환율 변동</h4>
            <div class="rates-table">
              <table>
                <thead>
                  <tr>
                    <th rowspan="2">날짜</th>
                    <th rowspan="2">매매기준율</th>
                    <th colspan="2">현찰</th>
                    <th colspan="2">송금</th>
                  </tr>
                  <tr>
                    <th>사실때</th>
                    <th>파실때</th>
                    <th>보내실때</th>
                    <th>받으실때</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rate in ratesByCurrency" :key="rate.date">
                    <td>{{ formatDate(rate.baseDate) }}</td>
                    <td>{{ rate.baseRate }}</td>
                    <td>{{ rate.buyCashRate }}</td>
                    <td>{{ rate.sellCashRate }}</td>
                    <td>{{ rate.sendRate }}</td>
                    <td>{{ rate.receiveRate }}</td>
                    </tr>
                </tbody>
              </table>

            </div>
          </div>
        </section>

        <!-- 통화별 상세 데이터 모달 -->
        <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>{{ selectedCurrencyCode }} 실시간 환율 추이</h3>
              <button class="close-btn" @click="closeDetailModal">&times;</button>
            </div>
            
            <div class="modal-body">
              <div v-if="loadingDetail" class="loading">
                <p>데이터를 불러오는 중...</p>
              </div>
              
              <div v-else-if="currencyDetailData.length > 0" class="detail-content">
                <p class="detail-description">
                  {{ selectedCurrencyCode }}의 최근 수집된 실시간 환율 데이터입니다. (수집 시간: {{ formatDetailTime(currencyDetailData[currencyDetailData.length-1]?.crawl_time) }} ~ {{ formatDetailTime(currencyDetailData[0]?.crawl_time) }})
                </p>
                
                <div class="detail-table">
                  <table>
                    <thead>
                      <tr>
                        <th>수집 시간</th>
                        <th>매매기준율</th>
                        <th>현찰사실때</th>
                        <th>현찰파실때</th>
                        <th>송금보내실때</th>
                        <th>송금받으실때</th>
                        <th>대미환산율</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(data, index) in currencyDetailData" :key="index">
                        <td>{{ formatDetailTime(data.crawl_time) }}</td>
                        <td>{{ data.base_rate }}</td>
                        <td>{{ data.buy_cash_rate }}</td>
                        <td>{{ data.sell_cash_rate }}</td>
                        <td>{{ data.send_rate }}</td>
                        <td>{{ data.receive_rate }}</td>
                        <td>{{ data.usd_conversion_rate }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div v-else class="no-data">
                <p>해당 통화의 상세 데이터가 없습니다.</p>
              </div>
            </div>
          </div>
        </div>

        <footer class="footer-info">
          <span>조회시각: {{ currentTime }}</span>
        </footer>
      </main>
    </div>
  </div>
</template>

<script>
import TabNav from '@/components/exchange_info/TabNav.vue';

export default {
  name: 'RateLookup',
  components: { TabNav },
  data() {
    
    return {
      activeTab: 'realtime',
      loading: false,
      currentTime: this.getCurrentTime(),
      
      // 실시간 환율 데이터
      realTimeRates: [],
      
      // 날짜별 환율 데이터
      selectedDate: this.getToday(),
      ratesByDate: [],
      
      // 통화별 환율 데이터
      selectedCurrency: '',
      ratesByCurrency: [],

      // 통화별 상세 데이터 모달 관련 상태
      showDetailModal: false,
      selectedCurrencyCode: '',
      loadingDetail: false,
      currencyDetailData: [],
    };
  },
  // 페이지 로드 시 실시간 환율 조회
  mounted() {
    this.getRealTimeRates();
  },
  // 메서드
  methods: {
    getToday() {
      const d = new Date();
      return d.toISOString().slice(0, 10);
    },
    getCurrentTime() {
      const d = new Date();
      return d.getFullYear() + '년 ' + (d.getMonth()+1) + '월 ' + d.getDate() + '일 ' + 
             d.getHours() + '시' + d.getMinutes() + '분' + d.getSeconds() + '초';
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.getFullYear() + '-' + 
             String(date.getMonth() + 1).padStart(2, '0') + '-' + 
             String(date.getDate()).padStart(2, '0');
    },
    formatDetailTime(timestamp) {
      if (!timestamp) return 'N/A';
      
      try {
        // crawl_time 형식: "2025-08-19 10:08:07"
        const date = new Date(timestamp);
        
        // 유효한 날짜인지 확인
        if (isNaN(date.getTime())) {
          return timestamp; // 파싱 실패 시 원본 값 반환
        }
        
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0') + ' ' + 
               String(date.getHours()).padStart(2, '0') + ':' + 
               String(date.getMinutes()).padStart(2, '0') + ':' + 
               String(date.getSeconds()).padStart(2, '0');
      } catch (error) {
        console.error('시간 포맷팅 오류:', error);
        return timestamp; // 오류 시 원본 값 반환
      }
    },
    // 실시간 환율 조회 API
    async getRealTimeRates() {
      this.loading = true;
      try {
        console.log('실시간 환율 조회 시작...');
        const response = await fetch('/api/exchange/real-time');
        console.log('응답 상태:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('실시간 환율 데이터:', data);
          this.realTimeRates = data;
        } else {
          const errorText = await response.text();
          console.error('API 응답 오류:', response.status, errorText);
          alert(`실시간 환율 조회에 실패했습니다. (${response.status})`);
        }
      } catch (error) {
        console.error('실시간 환율 조회 오류:', error);
        alert('실시간 환율 조회 중 오류가 발생했습니다.');
      } finally {
        this.loading = false;
        this.currentTime = this.getCurrentTime();
      }
    },
    // 날짜별 환율 조회 API
    async getRatesByDate() {
      this.loading = true;
      try {
        console.log('날짜별 환율 조회 시작...', this.selectedDate);
        const response = await fetch(`/api/exchange/by-date?date=${this.selectedDate}`);
        console.log('응답 상태:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('날짜별 환율 데이터:', data);
          this.ratesByDate = data;
        } else {
          const errorText = await response.text();
          console.error('API 응답 오류:', response.status, errorText);
          alert(`날짜별 환율 조회에 실패했습니다. (${response.status})`);
        }
      } catch (error) {
        console.error('날짜별 환율 조회 오류:', error);
        alert('날짜별 환율 조회 중 오류가 발생했습니다.');
      } finally {
        this.loading = false;
        this.currentTime = this.getCurrentTime();
      }
    },
    
    // 통화별 환율 조회 API
    async getRatesByCurrency() {
      this.loading = true;
      try {
        console.log('통화별 환율 조회 시작...', this.selectedCurrency);
        const response = await fetch(`/api/exchange/by-currency/${this.selectedCurrency}`);
        console.log('응답 상태:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('통화별 환율 데이터:', data);
          this.ratesByCurrency = (data || []).sort((a, b) => {
            const da = new Date(a.baseDate);
            const db = new Date(b.baseDate);
            return db - da; // 날짜 내림차순 (최신 먼저)
          });
        } else {
          const errorText = await response.text();
          console.error('API 응답 오류:', response.status, errorText);
          alert(`통화별 환율 조회에 실패했습니다. (${response.status})`);
        }
      } catch (error) {
        console.error('통화별 환율 조회 오류:', error);
        alert('통화별 환율 조회 중 오류가 발생했습니다.');
      } finally {
        this.loading = false;
        this.currentTime = this.getCurrentTime();
      }
    },

    // 통화별 상세 데이터 조회 API
    async getCurrencyDetailData(currencyCode) {
      this.loadingDetail = true;
      try {
        console.log('통화별 상세 데이터 조회 시작...', currencyCode);
        const response = await fetch(`/api/exchange/realtime/${currencyCode}`);
        console.log('응답 상태:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('통화별 상세 데이터:', data);
          this.currencyDetailData = data;
        } else {
          const errorText = await response.text();
          console.error('API 응답 오류:', response.status, errorText);
          alert(`통화별 상세 데이터 조회에 실패했습니다. (${response.status})`);
        }
      } catch (error) {
        console.error('통화별 상세 데이터 조회 오류:', error);
        alert('통화별 상세 데이터 조회 중 오류가 발생했습니다.');
      } finally {
        this.loadingDetail = false;
      }
    },
    
    showCurrencyDetail(currencyCode) {
      this.selectedCurrencyCode = currencyCode;
      this.getCurrencyDetailData(currencyCode);
      this.showDetailModal = true;
    },
    closeDetailModal() {
      this.showDetailModal = false;
      this.currencyDetailData = []; // 모달 닫을 때 데이터 초기화
    },
    
    goTab(name) {
      if (name === 'rateChart') {
        this.$router.push('/rate-chart');
      }
    },
  },
};
</script>

<style scoped>
.forex-system {
  font-family: 'Noto Sans KR', Arial, sans-serif;
  background: #fafbfc;
  min-height: 100vh;
  width: 100vw;
  min-width: 0;
}

.content-wrap {
  width: 100%;
}

.main-content {
  width: 100%;
  padding: 40px 48px;
}

.main-content h1 {
  font-size: 2rem;
  margin-bottom: 24px;
  color: #222;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.tabs button {
  background: #f2f8f7;
  border: none;
  padding: 10px 18px;
  border-radius: 20px;
  color: #009490;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}

.tabs button.active, .tabs button:hover {
  background: #009490;
  color: #fff;
}

.search-box {
  background: #fff;
  padding: 24px 32px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
  color: #222;
}

.search-box h3 {
  margin: 0 0 8px 0;
  color: #009490;
  font-size: 1.2rem;
}

.description {
  color: #666;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.search-box form {
  display: flex;
  gap: 24px;
  align-items: flex-end;
  margin-bottom: 20px;
}

.search-box label {
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  color: #222;
}

.search-box select, .search-box input[type="date"] {
  margin-top: 6px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background: #fff;
  color: #222;
  font-family: inherit;
  outline: none;
  min-width: 150px;
}

.primary-btn {
  background: #009490;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: 0.2s;
  font-weight: 600;
  min-width: 120px;
}

.primary-btn:hover:not(:disabled) {
  background: #007c7a;
}

.primary-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result-box {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid #e9ecef;
}

.result-box h4 {
  margin: 0 0 16px 0;
  color: #009490;
  font-size: 1.1rem;
}

.rates-table {
  overflow-x: auto;
}

.rates-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.rates-table th,
.rates-table td {
  padding: 12px 8px;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
}

.rates-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #009490;
}

.rates-table tr:hover {
  background: #f8f9fa;
}

.footer-info {
  display: flex;
  gap: 32px;
  color: #888;
  font-size: 0.95rem;
  margin-top: 32px;
}

.currency-link {
  background: none;
  border: none;
  color: #5c5c5c;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  font-family: inherit;
  text-align: left;
}

.currency-link:hover {
  color: #0056b3;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 95%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #222;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #888;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.detail-content {
  color: #222;
}

.detail-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 15px;
}

.detail-table {
  overflow-x: auto;
}

.detail-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.detail-table th,
.detail-table td {
  padding: 10px 8px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.detail-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #009490;
}

.detail-table tr:hover {
  background: #f8f9fa;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #888;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px 16px;
  }
  
  .search-box form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .rates-grid {
    grid-template-columns: 1fr;
  }
  
  .rates-table {
    font-size: 0.9rem;
  }

  .modal-content {
    width: 98%;
    margin: 5px;
    max-width: 95vw;
  }

  .modal-header {
    padding: 12px 15px;
  }

  .modal-header h3 {
    font-size: 1.1rem;
  }

  .modal-body {
    padding: 15px;
  }

  .detail-table {
    font-size: 0.85rem;
  }

  .detail-table th,
  .detail-table td {
    padding: 8px 4px;
  }

  .currency-link {
    font-size: 0.9rem;
    padding: 2px 0;
  }
}
</style>