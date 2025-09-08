<template>
  <div class="forex-system">
    <main class="main-content">
      <div class="exchange-main">
        <div class="exchange-form">
          <div class="form-header">
            <h1>환율 계산기</h1>
            
          </div>
          <!-- 환율 유형 선택 탭 -->
          <nav class="rate-type-tabs">
            <button 
              :class="{ active: selectedRateType === 'base_rate' }" 
              @click="selectedRateType = 'base_rate'"
            >
              매매기준율
            </button>
            <button 
              :class="{ active: selectedRateType === 'buy_cash_rate' }" 
              @click="selectedRateType = 'buy_cash_rate'"
            >
              현찰사실때
            </button>
            <button 
              :class="{ active: selectedRateType === 'sell_cash_rate' }" 
              @click="selectedRateType = 'sell_cash_rate'"
            >
              현찰파실때
            </button>
            <button 
              :class="{ active: selectedRateType === 'send_rate' }" 
              @click="selectedRateType = 'send_rate'"
            >
              송금보내실때
            </button>
            <button 
              :class="{ active: selectedRateType === 'receive_rate' }" 
              @click="selectedRateType = 'receive_rate'"
            >
              송금받으실때
            </button>
          </nav>

          <!-- 에러 메시지 -->
          <div v-if="error" class="error-message">
            ⚠️ {{ error }}
          </div>

          <!-- From Section -->
          <div class="currency-section">
            <div class="section-header">
              <span class="section-label">송금 통화</span>
            </div>

            <div class="currency-input-row">
              <select v-model="fromCurrency" class="currency-dropdown" @change="calculate">
                <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
                  {{ currency.label }}
                </option>
              </select>

              <input type="number" v-model.number="amount" class="amount-input" placeholder="0" min="0" @input="calculate" />
            </div>
          </div>

          <!-- Exchange Icon -->
          <div class="exchange-icon-container">
            <div class="exchange-icon" @click="swapCurrencies">
              ↕
            </div>
          </div>

          <!-- To Section -->
          <div class="currency-section">
            <div class="section-header">
              <span class="section-label">수취 통화</span>
            </div>

            <div class="currency-input-row">
              <select v-model="toCurrency" class="currency-dropdown" @change="calculate" :disabled="toCurrencyDisabled">
                <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
                  {{ currency.label }}
                </option>
              </select>

              <input type="number" :value="result" class="amount-input" placeholder="0" readonly />
            </div>
          </div>

          <!-- 환전 정보 Section -->
          <div class="exchange-info-section" v-if="result !== null && amount > 0">
            <div class="exchange-info-header">
              <span class="info-label">환전 정보 ({{ selectedRateTypeName }})</span>
            </div>

            <div class="fee-details">
              <div class="fee-row">
                <span class="fee-label">적용 환율</span>
                <span class="fee-value">{{ rateInfo }}</span>
              </div>
              <div class="fee-row total-row">
                <span class="fee-label">환전 결과</span>
                <span class="fee-value total-amount">{{ amount }} {{ fromCurrency }} → {{ result }} {{ toCurrency }}</span>
              </div>
            </div>
          </div>

        </div>

   
      </div>

      <footer class="footer-info">
        <span>기준일: {{ getToday() }}</span>
        <span>조회시각: {{ getCurrentTime() }}</span>
      </footer>
    </main>
  </div>
</template>

<script>
export default {
  name: "HanaExchangeCalculator",
  data() {
    return {
      currencies: [
        { code: "KRW", label: "🇰🇷 한국 KRW" },
        { code: "USD", label: "🇺🇸 미국 USD" },
        { code: "JPY", label: "🇯🇵 일본 JPY" },
        { code: "EUR", label: "🇪🇺 유럽연합 EUR" },
        { code: "CNY", label: "🇨🇳 중국 CNY" },
        { code: "HKD", label: "🇭🇰 홍콩 HKD" },
        { code: "TWD", label: "🇹🇼 대만 TWD" },
        { code: "GBP", label: "🇬🇧 영국 GBP" },
        { code: "OMR", label: "🇴🇲 오만 OMR" },
        { code: "CAD", label: "🇨🇦 캐나다 CAD" },
      ],
      fromCurrency: "KRW",
      toCurrency: "USD",
      amount: null,
      result: null,
      rateInfo: null,
      exchangeRates: [], // API에서 받아온 환율 데이터
      loading: false,
      error: null,
      selectedRateType: 'base_rate' // 환율 유형 선택
    };
  },
  computed: {
    toCurrencyDisabled() {
      return false;
    },
    
    // KRW 기준 환율로 변환
    krwBasedRates() {
      if (!this.exchangeRates.length) return {};
      
      const rates = {};
      this.exchangeRates.forEach(rate => {
        if (rate.currency_code === 'KRW') return;
        
        // 선택된 환율 유형에 따라 환율 값 선택
        let rateValue = rate[this.selectedRateType];
        
        // N/A 값 처리
        if (rateValue === 'N/A') {
          // N/A인 경우 base_rate 사용
          rateValue = rate.base_rate;
        }
        
        // 쉼표 제거하고 숫자로 변환
        const numericRate = parseFloat(rateValue.replace(/,/g, ''));
        if (!isNaN(numericRate)) {
          // KRW -> 해당 통화 (1원당 해당 통화)
          rates[`KRW-${rate.currency_code}`] = (1 / numericRate).toFixed(6);
          // 해당 통화 -> KRW (1해당통화당 원)
          rates[`${rate.currency_code}-KRW`] = numericRate.toFixed(2);
        }
      });
      
      // 크로스 환율 계산 (USD 기준)
      this.exchangeRates.forEach(rate => {
        if (rate.currency_code === 'USD' || rate.currency_code === 'KRW') return;
        
        const usdRate = parseFloat(rate.usd_conversion_rate);
        if (!isNaN(usdRate)) {
          // USD -> 해당 통화
          rates[`USD-${rate.currency_code}`] = usdRate.toFixed(6);
          // 해당 통화 -> USD
          rates[`${rate.currency_code}-USD`] = (1 / usdRate).toFixed(6);
        }
      });
      
      // 다른 통화 간 환율 계산
      this.exchangeRates.forEach(rate1 => {
        if (rate1.currency_code === 'KRW') return;
        
        this.exchangeRates.forEach(rate2 => {
          if (rate2.currency_code === 'KRW' || rate1.currency_code === rate2.currency_code) return;
          
          const usdRate1 = parseFloat(rate1.usd_conversion_rate);
          const usdRate2 = parseFloat(rate2.usd_conversion_rate);
          
          if (!isNaN(usdRate1) && !isNaN(usdRate2)) {
            // rate1 -> rate2
            rates[`${rate1.currency_code}-${rate2.currency_code}`] = (usdRate1 / usdRate2).toFixed(6);
            // rate2 -> rate1
            rates[`${rate2.currency_code}-${rate1.currency_code}`] = (usdRate2 / usdRate1).toFixed(6);
          }
        });
      });
      
      return rates;
    },

    // 현재 선택된 환율 유형의 한글명
    selectedRateTypeName() {
      const typeNames = {
        'base_rate': '매매기준율',
        'buy_cash_rate': '현찰사실때',
        'sell_cash_rate': '현찰파실때',
        'send_rate': '송금보내실때',
        'receive_rate': '송금받으실때'
      };
      return typeNames[this.selectedRateType] || '매매기준율';
    }
  },
  
  async mounted() {
    await this.fetchExchangeRates();
  },

  watch: {
    // 환율 유형 변경 시 자동 계산
    selectedRateType() {
      if (this.amount && this.amount > 0) {
        this.calculate();
      }
    }
  },
  
  methods: {
    async fetchExchangeRates() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await fetch('/api/exchange/real-time');
        if (!response.ok) {
          throw new Error('환율 데이터를 가져오는데 실패했습니다.');
        }
        
        this.exchangeRates = await response.json();
        this.calculate(); // 초기 계산
      } catch (error) {
        console.error('환율 데이터 조회 실패:', error);
        this.error = '실시간 환율 데이터를 불러올 수 없습니다.';
        // 에러 시 기본 환율로 계산
        this.calculate();
      } finally {
        this.loading = false;
      }
    },

    calculate() {
      if (!this.fromCurrency || !this.toCurrency || !this.amount) {
        this.result = null;
        this.rateInfo = null;
        return;
      }
      
      if (this.fromCurrency === this.toCurrency) {
        this.result = this.amount;
        this.rateInfo = `1 ${this.fromCurrency} = 1.0000 ${this.toCurrency}`;
        return;
      }
      
      const key = `${this.fromCurrency}-${this.toCurrency}`;
      const rate = this.krwBasedRates[key];
      
      if (!rate) {
        this.result = null;
        this.rateInfo = "해당 환율 정보를 찾을 수 없습니다";
        return;
      }
      
      const calc = (this.amount * parseFloat(rate)).toFixed(2);
      this.result = calc;
      this.rateInfo = `1 ${this.fromCurrency} = ${parseFloat(rate).toFixed(4)} ${this.toCurrency}`;
    },

    swapCurrencies() {
      const temp = this.fromCurrency;
      this.fromCurrency = this.toCurrency;
      this.toCurrency = temp;
      this.calculate();
    },

    getCurrentRate() {
      if (!this.rateInfo) return "0.0000";
      const match = this.rateInfo.match(/= ([\d.]+)/);
      return match ? match[1] : "0.0000";
    },

    getToday() {
      const d = new Date();
      return d.toISOString().slice(0, 10);
    },

    getCurrentTime() {
      const d = new Date();
      return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}시${d.getMinutes()}분${d.getSeconds()}초`;
    },

    // 환율 새로고침
    refreshRates() {
      this.fetchExchangeRates();
    }
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

.main-content {
  flex: 1;
  padding: 40px 48px;
}

.main-content h1 {
  font-size: 2rem;
  margin-bottom: 24px;
  color: #222;
}

.exchange-main {
  display: flex;
  justify-content: center;
}

.exchange-form {
  max-width: 1000px;
  width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.form-subtitle {
  color: #666;
  margin-bottom: 0; /* Adjusted margin */
  font-size: 1rem;
}

.refresh-btn {
  background: #e9ecef;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap; /* Prevent text wrapping */
}

.refresh-btn:hover:not(:disabled) {
  background: #dee2e6;
}

.refresh-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  color: #888;
}

.error-message {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Currency Section Styles */
.currency-section {
  margin-bottom: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-label {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.currency-input-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.currency-dropdown {
  flex: 2;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
  color: #333;
  cursor: pointer;
}

.amount-input {
  flex: 3;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1.4rem;
  font-weight: 600;
  text-align: right;
  background: #fff;
}

.amount-input:read-only {
  background: #f8f9fa;
  color: #666;
}

/* 숫자 input의 화살표(스피너) 제거 */
.amount-input::-webkit-outer-spin-button,
.amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox용 */
.amount-input[type=number] {
  -moz-appearance: textfield;
}

/* Exchange Icon */
.exchange-icon-container {
  display: flex;
  justify-content: center;
  margin: 8px 0;
}

.exchange-icon {
  width: 40px;
  height: 40px;
  background: #fff;
  border: 2px solid #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: 0.2s;
}

.exchange-icon:hover {
  border-color: #009490;
  color: #009490;
}

/* 환전 정보 Section */
.exchange-info-section {
  margin: 24px 0;
  padding: 20px;
  background: #f0f8f7;
  border-radius: 12px;
  border: 1px solid #009490;
}

.exchange-info-header {
  margin-bottom: 16px;
}

.info-label {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.fee-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fee-row.total-row {
  border-top: 1px solid #009490;
  padding-top: 8px;
  margin-top: 8px;
}

.fee-label {
  color: #666;
  font-size: 0.9rem;
}

.fee-value {
  color: #333;
  font-weight: 500;
}

.fee-value.total-amount {
  color: #009490;
  font-size: 1.1rem;
  font-weight: 700;
}

/* Exchange Button */
.exchange-btn {
  width: 100%;
  background: #009490;
  color: #fff;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  margin-top: 20px;
}

.exchange-btn:hover:not(:disabled) {
  background: #007c7a;
}

.exchange-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Chart Section */
.chart-section {
  flex: 4;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  color: #009490;
  font-size: 1.2rem;
  margin: 0;
}

.chart-period {
  color: #333;
  font-weight: bold;
}

.mini-chart {
  height: 120px;
  position: relative;
  margin-bottom: 16px;
}

.chart-placeholder {
  height: 100%;
  background: linear-gradient(135deg, #f0f8f7 0%, #e8f4f3 100%);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.chart-line {
  position: absolute;
  bottom: 30%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: #009490;
  border-radius: 1px;
}

.chart-dates {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
  margin-top: 8px;
}

.footer-info {
  display: flex;
  gap: 32px;
  color: #888;
  font-size: 0.95rem;
  margin-top: 32px;
}

/* Rate Type Tabs */
.rate-type-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 10px;
}

.rate-type-tabs button {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 10px 15px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
}

.rate-type-tabs button:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #dee2e6;
}

.rate-type-tabs button:disabled {
  background: #ccc;
  cursor: not-allowed;
  color: #888;
}

.rate-type-tabs button.active {
  background: #009490;
  color: #fff;
  border-color: #009490;
}
</style>