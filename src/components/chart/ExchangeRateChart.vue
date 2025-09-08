<template>
  <div class="chart-card">
    <h2>환율 변동 비교 차트</h2>
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script>
import { defineComponent, computed } from "vue";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Line } from "vue-chartjs";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
);

export default defineComponent({
  name: "ExchangeRateChart",
  components: { Line },
  props: { 
    rates: { type: Array, required: true },
    currencies: { type: Array, required: true },
    originalRates: { type: Array, required: false, default: () => [] }
  },
  setup(props) {
    const colors = {
      USD: "#008485",
      EUR: "#005750", 
      JPY: "#00aba0",
      CNY: "#6fd3c4",
      CAD: "#ff6b6b",
      CHF: "#4ecdc4"
    };

    const chartData = computed(() => ({
      labels: props.rates.map((item) => item.date),
      datasets: props.currencies.map((currency) => ({
        label: `${currency} 환율`,
        data: props.rates.map((item) => item[currency] || null),
        borderColor: colors[currency] || "#009490",
        backgroundColor: colors[currency] || "#009490",
        tension: 0.3,
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: colors[currency] || "#009490",
        pointBorderColor: "#fff",
        pointBorderWidth: 1,
      })),
    }));

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: "top",
          labels: {
            font: {
              size: 14,
              weight: 'bold'
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        title: { 
          display: false 
        },
        tooltip: { 
          mode: "index", 
          intersect: false,
          callbacks: {
            label: function(context) {
              const currency = context.dataset.label.split(' ')[0];
              const dateLabel = context.label;
              // 원본 데이터에서 실제 값을 찾아 툴팁에 표시 (정규화 여부 무관)
              let originalValue = null;
              try {
                const row = (props.originalRates || []).find(r => r.date === dateLabel);
                const v = row ? row[currency] : null;
                if (typeof v === 'number' && !isNaN(v)) originalValue = v;
              } catch (e) {
                originalValue = null;
              }
              const shown = originalValue != null ? originalValue : context.parsed.y;
              return `${currency}: ${shown != null ? Number(shown).toLocaleString() : 'N/A'} KRW`;
            }
          }
        },
      },
      scales: {
        x: { 
          title: { 
            display: true, 
            text: "날짜",
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: { 
          title: { 
            display: true, 
            text: "환율 (KRW)",
            font: {
              size: 14,
              weight: 'bold'
            }
          }, 
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return value.toLocaleString();
            }
          }
        },
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };

    return { chartData, chartOptions };
  },
});
</script>

<style scoped>
.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-card h2 {
  color: #009490;
  margin-bottom: 20px;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.chart-card canvas {
  max-height: 400px;
}
</style>
  