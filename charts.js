// ============================================================
// INDIAN RAILWAYS ANALYTICS PLATFORM – CHARTS MODULE
// All Chart.js chart factories
// ============================================================

const ChartDefaults = {
  font: { family: 'Inter' },
  color: '#a8c4d8',
  plugins: {
    legend: {
      labels: {
        color: '#a8c4d8',
        font: { family: 'Inter', size: 11 },
        boxWidth: 12,
        boxHeight: 12,
        padding: 14,
      }
    },
    tooltip: {
      backgroundColor: 'rgba(6,15,30,0.95)',
      titleColor: '#e8f4f8',
      bodyColor: '#a8c4d8',
      borderColor: 'rgba(30,77,154,0.4)',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      titleFont: { family: 'Rajdhani', size: 13, weight: '700' },
      bodyFont: { family: 'Inter', size: 11 },
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(30,77,154,0.12)', drawBorder: false },
      ticks: { color: '#5d8aa8', font: { family: 'Inter', size: 10 } },
    },
    y: {
      grid: { color: 'rgba(30,77,154,0.12)', drawBorder: false },
      ticks: { color: '#5d8aa8', font: { family: 'Inter', size: 10 } },
    }
  }
};

Chart.defaults.font.family = 'Inter';
Chart.defaults.color = '#a8c4d8';

const COLORS = {
  blue: '#2563d4',
  lightBlue: '#60a5fa',
  red: '#e74c3c',
  darkRed: '#c0392b',
  gold: '#f39c12',
  green: '#1abc9c',
  purple: '#8e44ad',
  teal: '#0097a7',
  orange: '#e67e22',
  pink: '#e91e63',
  cyan: '#00bcd4',
  indigo: '#3f51b5',
};

const GRADIENTS = {};

function makeGradient(ctx, color1, color2, vertical = true) {
  const key = `${color1}-${color2}-${vertical}`;
  if (GRADIENTS[key]) return GRADIENTS[key];
  const g = vertical
    ? ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
    : ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
  g.addColorStop(0, color1);
  g.addColorStop(1, color2);
  GRADIENTS[key] = g;
  return g;
}

// ─── CHART REGISTRY ───────────────────────────────────────
const chartRegistry = {};

function destroyChart(id) {
  if (chartRegistry[id]) {
    try {
      chartRegistry[id].destroy();
    } catch(e) {}
    delete chartRegistry[id];
  }
}

function registerChart(id, chart) {
  chartRegistry[id] = chart;
  return chart;
}

// Helper to safely get 2D context and destroy any existing chart on that canvas first
function safeGetContext(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  try {
    const existingChart = Chart.getChart(canvas) || Chart.getChart(canvasId);
    if (existingChart) {
      existingChart.destroy();
    }
  } catch (e) {
    console.warn('Error checking existing chart for canvas', canvasId, e);
  }
  destroyChart(canvasId);
  return canvas.getContext('2d');
}

// ─── 1. REVENUE TREND (Mixed) ─────────────────────────────
function buildRevenueTrendChart(years, passenger, freight, total) {
  const ctx = safeGetContext('chart-revenue-trend');
  if (!ctx) return null;
  return registerChart('chart-revenue-trend', new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Passenger Revenue',
          data: passenger.map(v => (v / 1000).toFixed(1)),
          backgroundColor: 'rgba(37,99,212,0.75)',
          borderRadius: 4,
          order: 2,
        },
        {
          label: 'Freight Revenue',
          data: freight.map(v => (v / 1000).toFixed(1)),
          backgroundColor: 'rgba(26,188,156,0.75)',
          borderRadius: 4,
          order: 2,
        },
        {
          label: 'Total Revenue',
          data: total.map(v => (v / 1000).toFixed(1)),
          type: 'line',
          borderColor: COLORS.gold,
          backgroundColor: 'rgba(243,156,18,0.1)',
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.gold,
          pointRadius: 3,
          tension: 0.4,
          fill: false,
          order: 1,
          yAxisID: 'y1',
        }
      ]
    },
    options: {
      ...getBaseOptions(),
      plugins: { ...ChartDefaults.plugins, legend: { ...ChartDefaults.plugins.legend, position: 'top' } },
      scales: {
        x: ChartDefaults.scales.x,
        y: { ...ChartDefaults.scales.y, stacked: true, title: { display: true, text: '₹ Thousand Crore', color: '#5d8aa8', font: { size: 10 } } },
        y1: {
          ...ChartDefaults.scales.y,
          position: 'right',
          grid: { display: false },
          title: { display: true, text: 'Total (₹K Cr)', color: '#5d8aa8', font: { size: 10 } },
        }
      }
    }
  }));
}

// ─── 2. PASSENGER GROWTH TREND ────────────────────────────
function buildPassengerTrendChart(years, passengers) {
  const ctx = safeGetContext('chart-passenger-trend');
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, 0, 260);
  grad.addColorStop(0, 'rgba(37,99,212,0.5)');
  grad.addColorStop(1, 'rgba(37,99,212,0.02)');

  return registerChart('chart-passenger-trend', new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Total Passengers (millions)',
        data: passengers,
        borderColor: '#2563d4',
        backgroundColor: grad,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#2563d4',
        pointRadius: 3,
        pointHoverRadius: 6,
      }]
    },
    options: {
      ...getBaseOptions(),
      plugins: {
        ...ChartDefaults.plugins,
        annotation: {
          annotations: {
            covid: {
              type: 'box',
              xMin: '2020',
              xMax: '2021',
              backgroundColor: 'rgba(192,57,43,0.07)',
              borderColor: 'rgba(192,57,43,0.3)',
              borderWidth: 1,
            }
          }
        }
      }
    }
  }));
}

// ─── 3. FREIGHT GROWTH ────────────────────────────────────
function buildFreightTrendChart(years, freight) {
  const ctx = safeGetContext('chart-freight-trend');
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(26,188,156,0.5)');
  grad.addColorStop(1, 'rgba(26,188,156,0.02)');

  return registerChart('chart-freight-trend', new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Freight (million tonnes)',
        data: freight,
        borderColor: '#1abc9c',
        backgroundColor: grad,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#1abc9c',
        pointRadius: 3,
      }]
    },
    options: getBaseOptions()
  }));
}

// ─── 4. ACCIDENTS TREND ───────────────────────────────────
function buildAccidentTrendChart(years, accData) {
  const ctx = safeGetContext('chart-accident-trend');
  if (!ctx) return null;
  return registerChart('chart-accident-trend', new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Derailments',
          data: accData.derailments,
          backgroundColor: 'rgba(231,76,60,0.75)',
          borderRadius: 3,
          stack: 'a',
        },
        {
          label: 'Collisions',
          data: accData.collisions,
          backgroundColor: 'rgba(230,126,34,0.75)',
          borderRadius: 3,
          stack: 'a',
        },
        {
          label: 'Level Crossing',
          data: accData.levelCrossing,
          backgroundColor: 'rgba(243,156,18,0.75)',
          borderRadius: 3,
          stack: 'a',
        },
        {
          label: 'Fires',
          data: accData.fires,
          backgroundColor: 'rgba(142,68,173,0.6)',
          borderRadius: 3,
          stack: 'a',
        },
        {
          label: 'Others',
          data: accData.others,
          backgroundColor: 'rgba(93,138,168,0.5)',
          borderRadius: 3,
          stack: 'a',
        },
      ]
    },
    options: {
      ...getBaseOptions(),
      scales: {
        x: ChartDefaults.scales.x,
        y: { ...ChartDefaults.scales.y, stacked: true },
      }
    }
  }));
}

// ─── 5. PUNCTUALITY TREND ────────────────────────────────
function buildPunctualityChart(years, overall, mail, express, vande) {
  const ctx = safeGetContext('chart-punctuality');
  if (!ctx) return null;
  return registerChart('chart-punctuality', new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Overall',
          data: overall,
          borderColor: COLORS.gold,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 3,
        },
        {
          label: 'Mail/Express',
          data: mail,
          borderColor: COLORS.blue,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [4, 3],
          tension: 0.4,
          pointRadius: 2,
        },
        {
          label: 'Express',
          data: express,
          borderColor: COLORS.green,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [4, 3],
          tension: 0.4,
          pointRadius: 2,
        },
        {
          label: 'Vande Bharat',
          data: vande,
          borderColor: '#c084fc',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
        },
      ]
    },
    options: {
      ...getBaseOptions(),
      scales: {
        x: ChartDefaults.scales.x,
        y: {
          ...ChartDefaults.scales.y,
          min: 60,
          max: 100,
          ticks: { ...ChartDefaults.scales.y.ticks, callback: v => v + '%' }
        }
      }
    }
  }));
}

// ─── 6. FREIGHT COMMODITY PIE ─────────────────────────────
function buildFreightPieChart(canvasId) {
  const ctx = safeGetContext(canvasId);
  if (!ctx) return null;
  const d = IRData.freight;
  const latest = d.coal[15] + d.foodGrains[15] + d.iron[15] + d.cement[15] +
    d.fertilizer[15] + d.petroleum[15] + d.containers[15] + d.others[15];

  return registerChart(canvasId, new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Coal', 'Iron & Steel', 'Cement', 'Food Grains', 'Fertilizers', 'Petroleum', 'Containers', 'Others'],
      datasets: [{
        data: [d.coal[15], d.iron[15], d.cement[15], d.foodGrains[15],
               d.fertilizer[15], d.petroleum[15], d.containers[15], d.others[15]],
        backgroundColor: [
          'rgba(231,76,60,0.8)', 'rgba(230,126,34,0.8)', 'rgba(243,156,18,0.8)',
          'rgba(26,188,156,0.8)', 'rgba(37,99,212,0.8)', 'rgba(142,68,173,0.8)',
          'rgba(0,151,167,0.8)', 'rgba(93,138,168,0.6)'
        ],
        borderWidth: 0,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        ...ChartDefaults.plugins,
        legend: { ...ChartDefaults.plugins.legend, position: 'right' },
        tooltip: {
          ...ChartDefaults.plugins.tooltip,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw} MT (${(ctx.raw / latest * 100).toFixed(1)}%)`,
          }
        }
      }
    }
  }));
}

// ─── 7. ZONE RADAR ────────────────────────────────────────
function buildZoneRadarChart(canvasId, zones, metric) {
  const ctx = safeGetContext(canvasId);
  if (!ctx) return null;
  const topZones = zones.slice(0, 8);
  const values = topZones.map(z => IRData.zoneData[z][metric] || 0);

  return registerChart(canvasId, new Chart(ctx, {
    type: 'radar',
    data: {
      labels: topZones,
      datasets: [{
        label: metric.charAt(0).toUpperCase() + metric.slice(1),
        data: values,
        borderColor: COLORS.gold,
        backgroundColor: 'rgba(243,156,18,0.12)',
        borderWidth: 2,
        pointBackgroundColor: COLORS.gold,
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: ChartDefaults.plugins,
      scales: {
        r: {
          grid: { color: 'rgba(30,77,154,0.2)' },
          angleLines: { color: 'rgba(30,77,154,0.2)' },
          pointLabels: { color: '#a8c4d8', font: { size: 10, family: 'Inter' } },
          ticks: { display: false },
        }
      }
    }
  }));
}

// ─── 8. CANCELLATION BAR ─────────────────────────────────
function buildCancellationChart(years, cancellations) {
  const ctx = safeGetContext('chart-cancellation');
  if (!ctx) return null;
  return registerChart('chart-cancellation', new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{
        label: 'Cancellations',
        data: cancellations,
        backgroundColor: cancellations.map((v, i) =>
          v > 13000 ? 'rgba(231,76,60,0.8)' : v < 10000 ? 'rgba(26,188,156,0.75)' : 'rgba(37,99,212,0.7)'
        ),
        borderRadius: 4,
      }]
    },
    options: {
      ...getBaseOptions(),
      plugins: { ...ChartDefaults.plugins, legend: { display: false } }
    }
  }));
}

// ─── 9. PASSENGER CLASS BREAKDOWN ────────────────────────
function buildPassengerClassChart(canvasId) {
  const ctx = safeGetContext(canvasId);
  if (!ctx) return null;
  const d = IRData.passengers;
  return registerChart(canvasId, new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['2nd Class (Unreserved)', 'Sleeper Class', 'Upper Class'],
      datasets: [{
        data: [d.secondClass[15], d.sleeperClass[15], d.upperClass[15]],
        backgroundColor: ['rgba(37,99,212,0.8)', 'rgba(26,188,156,0.8)', 'rgba(243,156,18,0.8)'],
        borderWidth: 0,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: { ...ChartDefaults.plugins, legend: { ...ChartDefaults.plugins.legend, position: 'bottom' } }
    }
  }));
}

// ─── 10. OPERATING RATIO ─────────────────────────────────
function buildOperatingRatioChart(years, ratio) {
  const ctx = safeGetContext('chart-op-ratio');
  if (!ctx) return null;
  return registerChart('chart-op-ratio', new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Operating Ratio (%)',
        data: ratio,
        borderColor: ratio.map(v => v > 100 ? COLORS.red : COLORS.green),
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        tension: 0.3,
        pointBackgroundColor: ratio.map(v => v > 100 ? COLORS.red : COLORS.green),
        pointRadius: 4,
        segment: {
          borderColor: ctx => ctx.p0.parsed.y > 100 ? COLORS.red : COLORS.green,
        }
      },
      {
        label: '100% Benchmark',
        data: years.map(() => 100),
        borderColor: 'rgba(243,156,18,0.5)',
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        backgroundColor: 'transparent',
      }]
    },
    options: {
      ...getBaseOptions(),
      scales: {
        x: ChartDefaults.scales.x,
        y: {
          ...ChartDefaults.scales.y,
          ticks: { ...ChartDefaults.scales.y.ticks, callback: v => v + '%' },
          min: 80, max: 150,
        }
      }
    }
  }));
}

// ─── 11. ZONE BAR CHART ───────────────────────────────────
function buildZoneBarChart(canvasId, zones, metric, color) {
  const ctx = safeGetContext(canvasId);
  if (!ctx) return null;
  const filteredZones = zones.filter(z => z !== 'Metro');
  const values = filteredZones.map(z => IRData.zoneData[z][metric]);
  const sorted = filteredZones.map((z, i) => ({ z, v: values[i] })).sort((a, b) => b.v - a.v);

  return registerChart(canvasId, new Chart(ctx, {
    type: 'bar',
    indexAxis: 'y',
    data: {
      labels: sorted.map(s => s.z),
      datasets: [{
        label: metric.charAt(0).toUpperCase() + metric.slice(1),
        data: sorted.map(s => s.v),
        backgroundColor: sorted.map((_, i) => {
          const alpha = 0.85 - i * 0.04;
          return color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
        }),
        borderRadius: 4,
      }]
    },
    options: {
      ...getBaseOptions(),
      indexAxis: 'y',
      plugins: { ...ChartDefaults.plugins, legend: { display: false } },
    }
  }));
}

// ─── 12. FORECAST CHART ───────────────────────────────────
function buildForecastChart(canvasId, histYears, histData, forecastYears, forecastData, label, color) {
  const ctx = safeGetContext(canvasId);
  if (!ctx) return null;
  const allYears = [...histYears.slice(-8), ...forecastYears];
  const histSlice = histData.slice(-8);
  const nullPad = new Array(forecastYears.length).fill(null);
  const forecastPad = new Array(histSlice.length - 1).fill(null);

  return registerChart(canvasId, new Chart(ctx, {
    type: 'line',
    data: {
      labels: allYears,
      datasets: [
        {
          label: `Historical ${label}`,
          data: [...histSlice, ...nullPad],
          borderColor: color,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 3,
        },
        {
          label: `Forecast ${label}`,
          data: [...forecastPad, histSlice[histSlice.length - 1], ...forecastData],
          borderColor: color,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          borderDash: [6, 4],
          tension: 0.4,
          pointRadius: 4,
          pointStyle: 'triangle',
          pointBackgroundColor: color,
        }
      ]
    },
    options: {
      ...getBaseOptions(),
      plugins: {
        ...ChartDefaults.plugins,
        legend: { ...ChartDefaults.plugins.legend, position: 'top' },
        annotation: {
          annotations: {
            divider: {
              type: 'line',
              xMin: '2024',
              xMax: '2024',
              borderColor: 'rgba(243,156,18,0.4)',
              borderWidth: 1.5,
              borderDash: [4, 3],
              label: {
                display: true,
                content: 'Forecast →',
                color: '#f39c12',
                font: { size: 10, family: 'Inter' },
                position: 'start',
              }
            }
          }
        }
      }
    }
  }));
}

// ─── 13. SEASONAL DEMAND ─────────────────────────────────
function buildSeasonalChart(canvasId = 'chart-seasonal') {
  const ctx = safeGetContext(canvasId);
  if (!ctx) return null;
  const d = IRData.seasonalDemand;
  return registerChart(canvasId, new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.months,
      datasets: [
        {
          label: 'FY2024 Demand Index',
          data: d.index2024,
          backgroundColor: d.index2024.map(v => v > 130 ? 'rgba(231,76,60,0.8)' : v > 110 ? 'rgba(243,156,18,0.75)' : 'rgba(37,99,212,0.7)'),
          borderRadius: 5,
        },
        {
          label: '15-Year Average',
          data: d.indexAvg,
          type: 'line',
          borderColor: COLORS.gold,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [4, 3],
          pointRadius: 3,
          tension: 0.4,
        }
      ]
    },
    options: getBaseOptions()
  }));
}

// ─── 14. DELAY REASONS POLAR ──────────────────────────────
function buildDelayReasonsChart() {
  const ctx = safeGetContext('chart-delay-reasons');
  if (!ctx) return null;
  return registerChart('chart-delay-reasons', new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: IRData.delayReasons.labels,
      datasets: [{
        data: IRData.delayReasons.values,
        backgroundColor: [
          'rgba(231,76,60,0.7)', 'rgba(37,99,212,0.7)', 'rgba(230,126,34,0.7)',
          'rgba(26,188,156,0.7)', 'rgba(142,68,173,0.7)', 'rgba(243,156,18,0.7)'
        ],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { ...ChartDefaults.plugins, legend: { ...ChartDefaults.plugins.legend, position: 'right' } },
      scales: {
        r: {
          grid: { color: 'rgba(30,77,154,0.2)' },
          ticks: { display: false },
        }
      }
    }
  }));
}

// ─── 15. ROLLING STOCK ───────────────────────────────────
function buildRollingStockChart(years) {
  const ctx = safeGetContext('chart-rolling-stock');
  if (!ctx) return null;
  const d = IRData.rollingStock;
  return registerChart('chart-rolling-stock', new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Locomotives',
          data: d.locomotives,
          borderColor: COLORS.red,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 2,
          yAxisID: 'y',
        },
        {
          label: 'Coaches (x10)',
          data: d.coaches.map(v => Math.round(v / 10)),
          borderColor: COLORS.blue,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 2,
          yAxisID: 'y',
        },
        {
          label: 'Wagons (x100)',
          data: d.wagons.map(v => Math.round(v / 100)),
          borderColor: COLORS.green,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 2,
          yAxisID: 'y',
        },
      ]
    },
    options: getBaseOptions()
  }));
}

// ─── 16. ELECTRIFICATION PROGRESS ───────────────────────
function buildElectrificationChart(years) {
  const ctx = safeGetContext('chart-electrification');
  if (!ctx) return null;
  const d = IRData.infrastructure;
  const pct = d.electrifiedKm.map((e, i) => ((e / d.routeKm[i]) * 100).toFixed(1));

  return registerChart('chart-electrification', new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Electrified KM',
          data: d.electrifiedKm,
          backgroundColor: 'rgba(243,156,18,0.7)',
          borderRadius: 3,
          yAxisID: 'y',
        },
        {
          label: 'Total Route KM',
          data: d.routeKm,
          backgroundColor: 'rgba(37,99,212,0.4)',
          borderRadius: 3,
          yAxisID: 'y',
        },
        {
          label: 'Electrification %',
          data: pct,
          type: 'line',
          borderColor: COLORS.green,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 3,
          yAxisID: 'y1',
        }
      ]
    },
    options: {
      ...getBaseOptions(),
      scales: {
        x: ChartDefaults.scales.x,
        y: { ...ChartDefaults.scales.y, title: { display: true, text: 'Route KM', color: '#5d8aa8', font: { size: 10 } } },
        y1: {
          position: 'right',
          grid: { display: false },
          ticks: { color: '#5d8aa8', font: { size: 10 }, callback: v => v + '%' },
          min: 0, max: 105,
        }
      }
    }
  }));
}

// ─── 17. CASUALTY TREND ───────────────────────────────────
function buildCasualtyChart(years, casualties) {
  const ctx = safeGetContext('chart-casualties');
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(231,76,60,0.4)');
  grad.addColorStop(1, 'rgba(231,76,60,0.02)');

  return registerChart('chart-casualties', new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Total Casualties',
        data: casualties,
        borderColor: COLORS.red,
        backgroundColor: grad,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: COLORS.red,
        pointRadius: 3,
      }]
    },
    options: {
      ...getBaseOptions(),
      plugins: { ...ChartDefaults.plugins, legend: { display: false } }
    }
  }));
}

// ─── 18. CANCELLATION REASONS PIE ───────────────────────
function buildCancellationPieChart() {
  const ctx = safeGetContext('chart-cancel-reasons');
  if (!ctx) return null;
  const d = IRData.cancellationReasons.currentBreakdown;
  return registerChart('chart-cancel-reasons', new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Technical Failure', 'Path Conflict', 'Weather', 'Crew Shortage', 'Planned Maintenance', 'Security', 'Other'],
      datasets: [{
        data: [d.technical, d.pathConflict, d.weather, d.crewShortage, d.planned, d.security, d.other],
        backgroundColor: [
          'rgba(231,76,60,0.8)', 'rgba(37,99,212,0.8)', 'rgba(26,188,156,0.8)',
          'rgba(243,156,18,0.8)', 'rgba(142,68,173,0.7)', 'rgba(230,126,34,0.8)', 'rgba(93,138,168,0.7)'
        ],
        borderWidth: 0,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: { ...ChartDefaults.plugins, legend: { ...ChartDefaults.plugins.legend, position: 'right' } }
    }
  }));
}

// ─── 19. YOY REVENUE GROWTH ──────────────────────────────
function buildYoYRevenueChart(years, total) {
  const ctx = safeGetContext('chart-yoy-revenue');
  if (!ctx) return null;
  const growth = total.map((v, i) => i === 0 ? 0 : (((v - total[i - 1]) / total[i - 1]) * 100).toFixed(1));
  return registerChart('chart-yoy-revenue', new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years.slice(1),
      datasets: [{
        label: 'YoY Revenue Growth (%)',
        data: growth.slice(1),
        backgroundColor: growth.slice(1).map(v => v < 0 ? 'rgba(231,76,60,0.8)' : 'rgba(37,99,212,0.7)'),
        borderRadius: 4,
      }]
    },
    options: {
      ...getBaseOptions(),
      plugins: { ...ChartDefaults.plugins, legend: { display: false } },
      scales: {
        x: ChartDefaults.scales.x,
        y: { ...ChartDefaults.scales.y, ticks: { ...ChartDefaults.scales.y.ticks, callback: v => v + '%' } }
      }
    }
  }));
}

// ─── 20. ZONE REVENUE HORIZONTAL BAR ────────────────────
function buildZoneRevenueChart() {
  const ctx = safeGetContext('chart-zone-revenue');
  if (!ctx) return null;
  const zones = Object.entries(IRData.zoneData).sort((a, b) => b[1].revenue - a[1].revenue);

  return registerChart('chart-zone-revenue', new Chart(ctx, {
    type: 'bar',
    indexAxis: 'y',
    data: {
      labels: zones.map(z => z[0]),
      datasets: [{
        label: 'Revenue (₹ Crore)',
        data: zones.map(z => z[1].revenue),
        backgroundColor: zones.map((_, i) => {
          const colors = ['rgba(243,156,18,0.85)', 'rgba(26,188,156,0.8)', 'rgba(37,99,212,0.75)'];
          return colors[Math.min(i, 2)] || 'rgba(93,138,168,0.6)';
        }),
        borderRadius: 4,
      }]
    },
    options: {
      ...getBaseOptions(),
      indexAxis: 'y',
      plugins: { ...ChartDefaults.plugins, legend: { display: false } },
    }
  }));
}

// ─── 21. PREMIUM TRAIN GROWTH ────────────────────────────
function buildPremiumTrainChart(years) {
  const ctx = safeGetContext('chart-premium-trains');
  if (!ctx) return null;
  const d = IRData.premiumTrains;
  return registerChart('chart-premium-trains', new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        { label: 'Vande Bharat', data: d.vandeBharat, borderColor: '#c084fc', backgroundColor: 'transparent', borderWidth: 2.5, tension: 0.4, pointRadius: 3 },
        { label: 'Rajdhani', data: d.rajdhani, borderColor: COLORS.gold, backgroundColor: 'transparent', borderWidth: 2, tension: 0.3, pointRadius: 2 },
        { label: 'Shatabdi', data: d.shatabdi, borderColor: COLORS.green, backgroundColor: 'transparent', borderWidth: 2, tension: 0.3, pointRadius: 2 },
        { label: 'Duronto', data: d.duronto, borderColor: COLORS.orange, backgroundColor: 'transparent', borderWidth: 2, tension: 0.3, pointRadius: 2 },
      ]
    },
    options: getBaseOptions()
  }));
}

// ─── 22. LEVEL CROSSING ELIMINATION ─────────────────────
function buildLevelCrossingChart(years) {
  const ctx = safeGetContext('chart-level-crossing');
  if (!ctx) return null;
  return registerChart('chart-level-crossing', new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Unmanned Level Crossings',
        data: IRData.infrastructure.levelCrossings,
        borderColor: COLORS.red,
        backgroundColor: 'rgba(231,76,60,0.08)',
        fill: true,
        borderWidth: 2.5,
        tension: 0.3,
        pointRadius: 3,
      }]
    },
    options: {
      ...getBaseOptions(),
      plugins: { ...ChartDefaults.plugins, legend: { display: false } }
    }
  }));
}

// ─── 23. EMPLOYEE TREND ───────────────────────────────────
function buildEmployeeChart(years) {
  const ctx = safeGetContext('chart-employees');
  if (!ctx) return null;
  return registerChart('chart-employees', new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Total Employees',
        data: IRData.employees.total,
        borderColor: COLORS.teal,
        backgroundColor: 'rgba(0,151,167,0.1)',
        fill: true,
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 3,
      }]
    },
    options: getBaseOptions()
  }));
}

// ─── 24. PASSENGER KM ────────────────────────────────────
function buildPassengerKmChart(years) {
  const ctx = safeGetContext('chart-passenger-km');
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, 0, 260);
  grad.addColorStop(0, 'rgba(142,68,173,0.4)');
  grad.addColorStop(1, 'rgba(142,68,173,0.02)');
  return registerChart('chart-passenger-km', new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Passenger-KM (billion)',
        data: IRData.passengers.passengerKm,
        borderColor: '#c084fc',
        backgroundColor: grad,
        fill: true,
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 3,
      }]
    },
    options: getBaseOptions()
  }));
}

// ─── 25. NTK FREIGHT ─────────────────────────────────────
function buildNTKChart(years) {
  const ctx = safeGetContext('chart-ntk');
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(0,151,167,0.5)');
  grad.addColorStop(1, 'rgba(0,151,167,0.02)');
  return registerChart('chart-ntk', new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Net Tonne-KM (billion)',
        data: IRData.freight.netTonneKm,
        borderColor: COLORS.teal,
        backgroundColor: grad,
        fill: true,
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 3,
      }]
    },
    options: getBaseOptions()
  }));
}

// ─── 26. REGRESSION SCATTER PLOT ─────────────────────────
function buildRegressionScatterChart(canvasId, labelX, labelY, dataPoints, regressionPoints) {
  const ctx = safeGetContext(canvasId);
  if (!ctx) return null;

  const scatterData = dataPoints.map(p => ({ x: p.x, y: p.y }));
  // Align regression line with sorted X values so it draws a continuous straight line
  const regressionData = dataPoints.map((p, idx) => ({ x: p.x, y: regressionPoints[idx] }))
                                    .sort((a, b) => a.x - b.x);

  return registerChart(canvasId, new Chart(ctx, {
    data: {
      datasets: [
        {
          type: 'scatter',
          label: 'Historical Data Points',
          data: scatterData,
          backgroundColor: '#60a5fa',
          borderColor: 'rgba(96,165,250,0.5)',
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          type: 'line',
          label: 'Regression Fit Line',
          data: regressionData,
          borderColor: '#f39c12',
          borderWidth: 2.5,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
        }
      ]
    },
    options: {
      ...getBaseOptions(),
      plugins: {
        ...ChartDefaults.plugins,
        legend: { ...ChartDefaults.plugins.legend, display: true, position: 'top' },
        tooltip: {
          ...ChartDefaults.plugins.tooltip,
          callbacks: {
            label: (context) => {
              if (context.dataset.type === 'scatter') {
                return ` Year: ${dataPoints[context.dataIndex].year} | X: ${context.parsed.x.toLocaleString()} | Y: ${context.parsed.y.toLocaleString()}`;
              }
              return ` Regression Fit: ${context.parsed.y.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          ...ChartDefaults.scales.x,
          type: 'linear',
          position: 'bottom',
          title: { display: true, text: labelX, color: '#5d8aa8', font: { size: 10, family: 'Inter', weight: '600' } }
        },
        y: {
          ...ChartDefaults.scales.y,
          title: { display: true, text: labelY, color: '#5d8aa8', font: { size: 10, family: 'Inter', weight: '600' } }
        }
      }
    }
  }));
}

// ─── 27. SIMULATION TREND CHART ──────────────────────────
function buildSimulationChart(canvasId, histYears, histData, forecastYears, baselineData, simulatedData, label, color) {
  const ctx = safeGetContext(canvasId);
  if (!ctx) return null;

  const allYears = [...histYears.slice(-8), ...forecastYears];
  const histSlice = histData.slice(-8);
  const nullPad = new Array(forecastYears.length).fill(null);
  const forecastPad = new Array(histSlice.length - 1).fill(null);

  // Connect forecast arrays from the last historical value
  const baselineSeries = [...forecastPad, histSlice[histSlice.length - 1], ...baselineData];
  const simulatedSeries = [...forecastPad, histSlice[histSlice.length - 1], ...simulatedData];

  return registerChart(canvasId, new Chart(ctx, {
    type: 'line',
    data: {
      labels: allYears.map(y => y > 2024 ? `FY${y}` : `FY${y}`),
      datasets: [
        {
          label: `Historical ${label}`,
          data: [...histSlice, ...nullPad],
          borderColor: color,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 3,
        },
        {
          label: `Baseline Forecast`,
          data: baselineSeries,
          borderColor: 'rgba(255, 255, 255, 0.35)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0.4,
          pointRadius: 3,
          pointStyle: 'circle',
        },
        {
          label: `Simulated Scenario`,
          data: simulatedSeries,
          borderColor: '#1abc9c',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointStyle: 'triangle',
          pointBackgroundColor: '#1abc9c',
        }
      ]
    },
    options: {
      ...getBaseOptions(),
      plugins: {
        ...ChartDefaults.plugins,
        legend: { ...ChartDefaults.plugins.legend, position: 'top' },
        annotation: {
          annotations: {
            divider: {
              type: 'line',
              xMin: '2024',
              xMax: '2024',
              borderColor: 'rgba(243,156,18,0.4)',
              borderWidth: 1.5,
              borderDash: [4, 3],
              label: {
                display: true,
                content: 'Forecast →',
                color: '#f39c12',
                font: { size: 9, family: 'Inter' },
                position: 'start',
              }
            }
          }
        }
      }
    }
  }));
}

// ─── HELPER ───────────────────────────────────────────────
function getBaseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: ChartDefaults.plugins,
    scales: ChartDefaults.scales,
  };
}

window.chartRegistry = chartRegistry;

window.IRCharts = {
  buildRevenueTrendChart, buildPassengerTrendChart, buildFreightTrendChart,
  buildAccidentTrendChart, buildPunctualityChart, buildFreightPieChart,
  buildZoneRadarChart, buildCancellationChart, buildPassengerClassChart,
  buildOperatingRatioChart, buildZoneBarChart, buildForecastChart,
  buildSeasonalChart, buildDelayReasonsChart, buildRollingStockChart,
  buildElectrificationChart, buildCasualtyChart, buildCancellationPieChart,
  buildYoYRevenueChart, buildZoneRevenueChart, buildPremiumTrainChart,
  buildLevelCrossingChart, buildEmployeeChart, buildPassengerKmChart,
  buildNTKChart, buildRegressionScatterChart, buildSimulationChart,
};
