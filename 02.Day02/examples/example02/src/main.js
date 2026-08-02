import {
  Chart,
  CategoryScale,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';

// 只註冊此折線圖實際使用的控制器、元素、座標軸與外掛。
Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Title
);

const ctx = document.getElementById('lineChart');

new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
    datasets: [
      {
        label: '2024 年銷售額（萬元）',
        data: [12, 19, 8, 15, 22, 17],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.3)',
        tension: 0.3,
        fill: false
      },
      {
        label: '2023 年銷售額（萬元）',
        data: [8, 15, 6, 12, 18, 14],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.3)',
        tension: 0.3,
        fill: false
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: '每月銷售額比較（2023 vs 2024）'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});
