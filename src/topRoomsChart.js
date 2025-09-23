import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js/auto/+esm';

Chart.register(...registerables);
Chart.defaults.font.family = "'Manrope', sans-serif";

const ctx = document.getElementById('topRoomsChart')?.getContext('2d');
if (ctx) {
  const instance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Room A', 'Room B', 'Room C', 'Room D', 'Room E'],
      datasets: [{
        label: 'Total Earnings (₱)',
        data: [12450, 9200, 7850, 6400, 5200],
        backgroundColor: [
          '#147B42', '#3B8E47', '#61A34F', '#8BBE5C', '#B4CB68'
        ],
        borderRadius: 12,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            callback: value => `₱${value}`,
            color: '#6B7280',
          },
          grid: {
            color: '#E5E7EB'
          }
        },
        y: {
          ticks: {
            color: '#374151',
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `₱${context.parsed.x}`
          }
        },
        legend: {
          display: false
        }
      }
    }
  });

  // Expose instance and an updater without changing design
  window.topRoomsChartInstance = instance;
  window.updateTopRoomsChart = function(labels, values) {
    try {
      if (!Array.isArray(labels) || !Array.isArray(values)) return;
      instance.data.labels = labels;
      instance.data.datasets[0].data = values;
      instance.update();
    } catch (_) {}
  };
}
