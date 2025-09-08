<template>
  <div class="forex-system">
    <div class="content-wrap">
      <main class="main-content">
        <h1>환율 차트</h1>

        <!-- ✅ 공통 탭 컴포넌트 사용 -->
        <TabNav current="rateChart" />

        <!-- 통화 선택 및 차트 컨트롤 -->
        <div class="chart-controls">
          <div class="currency-selector">
            <label>통화 선택 (여러 개 선택 시 정규화 차트 표시):</label>
            <div class="currency-checkboxes">
              <label v-for="currency in availableCurrencies" :key="currency.code" class="checkbox-item">
                <input 
                  type="checkbox" 
                  :value="currency.code" 
                  v-model="selectedCurrencies"
                  @change="fetchCurrencyRates"
                />
                <span>{{ currency.code }} - {{ currency.name }}</span>
              </label>
            </div>
          </div>
          
          <div class="chart-info" v-if="selectedCurrencies.length > 0">
            <p>선택된 통화: {{ selectedCurrencies.join(', ') }}</p>
            <p v-if="ratesFromApi.length > 0" class="data-info">
               데이터 기간: {{ ratesFromApi[0].date }} ~ {{ ratesFromApi[ratesFromApi.length - 1].date }}
             </p>
           </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>환율 데이터를 불러오는 중...</p>
        </div>

        <!-- 차트 컴포넌트 -->
        <div v-else-if="ratesFromApi.length > 0" class="chart-container">
          <ExchangeRateChart :rates="displayedRates" :originalRates="ratesFromApi" :currencies="selectedCurrencies" />
        </div>

        <!-- 데이터 없음 상태 -->
        <div v-else-if="selectedCurrencies.length > 0 && !loading" class="no-data">
          <p>선택한 통화의 환율 데이터가 없습니다.</p>
        </div>

        <!-- 초기 안내 -->
        <div v-else class="initial-guide">
          <h3>환율 차트 사용법</h3>
          <p>위의 통화 선택에서 원하는 통화들을 선택하면 해당 통화들의 일자별 환율 변동을 비교 차트로 확인할 수 있습니다.</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import ExchangeRateChart from '@/components/chart/ExchangeRateChart.vue';
import TabNav from '@/components/exchange_info/TabNav.vue';


export default {
  components: {
    ExchangeRateChart,
    TabNav,
  },
  data() {
    return {
      selectedCurrencies: [],
      ratesFromApi: [],
      loading: false,
      availableCurrencies: [
      { code: 'USD', name: '미국 달러' },
        { code: 'EUR', name: '유로' },
        { code: 'JPY', name: '일본 엔' },
        { code: 'GBP ', name: '파운드 스털링' },
        { code: 'AUD ', name: '호주 달러' },        
        { code: 'CAD', name: '캐나다 달러' },
        { code: 'CHF', name: '스위스 프랑' },
        { code: 'CNY', name: '중국 위안' },
      ],
    };
  },
  computed: {
    displayedRates() {
      // 통화가 하나면 원본 데이터 그대로
      if (this.selectedCurrencies.length <= 1) return this.ratesFromApi;

      // 통화가 2개 이상이면 각 통화 값을 정규화 (첫 유효값 = 100)
      // ratesFromApi는 [{ date: 'YYYY-MM-DD', USD: 1234.5, EUR: 1500, ... }, ...] 형태
      const normalized = this.ratesFromApi.map(row => ({ ...row }));

      this.selectedCurrencies.forEach(code => {
        // 첫 유효값 찾기
        let firstValue = null;
        for (let i = 0; i < normalized.length; i++) {
          const v = normalized[i][code];
          if (typeof v === 'number' && !isNaN(v)) {
            firstValue = v;
            break;
          }
        }
        if (!firstValue || firstValue === 0) return;

        // 100 기준으로 스케일링
        for (let i = 0; i < normalized.length; i++) {
          const v = normalized[i][code];
          if (typeof v === 'number' && !isNaN(v)) {
            normalized[i][code] = (v / firstValue) * 100;
          }
        }
      });

      return normalized;
    }
  },
  methods: {
    async fetchCurrencyRates() {
      if (this.selectedCurrencies.length === 0) {
        this.ratesFromApi = [];
        return;
      }

      this.loading = true;
      try {
        // 모든 선택된 통화의 데이터를 병렬로 가져오기
        const promises = this.selectedCurrencies.map(async (currency) => {
          const response = await fetch(`/api/exchange/by-currency/${currency}`);
          if (response.ok) {
            const data = await response.json();
            return { currency, data };
          } else {
            console.error(`${currency} 데이터 조회 실패:`, response.status);
            return { currency, data: [] };
          }
        });

        const results = await Promise.all(promises);
        
        // 날짜별로 데이터 통합
        const dateMap = new Map();
        
        results.forEach(({ currency, data }) => {
          console.log(`${currency} 데이터:`, data);
          data.forEach(rate => {
            console.log(`${currency} 개별 데이터:`, rate);
            const date = this.formatDate(rate.baseDate);
            if (!dateMap.has(date)) {
              dateMap.set(date, { date });
            }
            // baseRate가 존재하고 유효한 값인 경우에만 처리
            if (rate.baseRate !== undefined && rate.baseRate !== null) {
              const rateValue = typeof rate.baseRate === 'string' 
                ? parseFloat(rate.baseRate.replace(/,/g, ''))
                : parseFloat(rate.baseRate);
              if (!isNaN(rateValue)) {
                dateMap.get(date)[currency] = rateValue;
              }
            } else {
              console.warn(`${currency}의 baseRate가 유효하지 않음:`, rate.baseRate);
            }
          });
        });

        // 날짜순으로 정렬
        this.ratesFromApi = Array.from(dateMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        console.log('통합된 환율 데이터:', this.ratesFromApi);
      } catch (error) {
        console.error('통화별 환율 조회 오류:', error);
        alert('환율 데이터 조회 중 오류가 발생했습니다.');
        this.ratesFromApi = [];
      } finally {
        this.loading = false;
      }
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0');
      } catch (error) {
        console.error('날짜 변환 오류:', error, dateStr);
        return '';
      }
    }
  }
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

.chart-controls {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.currency-selector {
  margin-bottom: 16px;
}

.currency-selector label {
  font-weight: 600;
  color: #009490;
  font-size: 1.1rem;
  display: block;
  margin-bottom: 12px;
}

.currency-checkboxes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.checkbox-item:hover {
  background: #f8f9fa;
  border-color: #009490;
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #009490;
}

.checkbox-item span {
  font-size: 0.95rem;
  color: #333;
}

.chart-info {
  border-top: 1px solid #e9ecef;
  padding-top: 16px;
}

.chart-info p {
  margin: 4px 0;
  color: #666;
}

.chart-info .data-info {
  font-size: 0.9rem;
  color: #009490;
  font-weight: 500;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #009490;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chart-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  min-height: 400px;
}

.no-data {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 60px 20px;
  text-align: center;
  color: #666;
}

.initial-guide {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
}

.initial-guide h3 {
  color: #009490;
  margin-bottom: 16px;
}

.initial-guide p {
  color: #666;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px 16px;
  }
  
  .currency-checkboxes {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .currency-checkboxes {
    grid-template-columns: 1fr;
  }
}
</style>
  