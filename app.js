// ============================================================
// INDIAN RAILWAYS ANALYTICS PLATFORM – APP MODULE
// ============================================================

const App = (() => {
  // ─── STATE ───────────────────────────────────────────────
  let state = {
    currentPage: 'executive',
    selectedYear: 'all',
    selectedZone: 'all',
    selectedTrainType: 'all',
    chartsInitialized: {},
    yearExplorerBuilt: false,
  };

  // ─── NAVIGATION ─────────────────────────────────────────
  function navigate(pageId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-page="${pageId}"]`)?.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`)?.classList.add('active');

    const titles = {
      executive:   { title: 'Executive Overview',            sub: 'Ministry of Railways · Railway Board · FY2009–2024' },
      passenger:   { title: 'Passenger Analytics',           sub: 'Traffic, Revenue, Demand & Zone-wise Breakdown' },
      revenue:     { title: 'Revenue Analytics',             sub: 'Earnings, Growth, Operating Ratio & Forecasting' },
      freight:     { title: 'Freight Analytics',             sub: 'Commodity Movement, Loading & Corridor Performance' },
      safety:      { title: 'Safety & Accident Analytics',   sub: 'Collision, Derailment, Level Crossing & Risk Analysis' },
      cancellation:{ title: 'Cancellation & Delay Analytics',sub: 'Punctuality, Reasons & Weather Impact' },
      zone:        { title: 'Railway Zone Performance',      sub: 'Zone-wise Rankings, Revenue, Safety & Efficiency' },
      forecast:    { title: 'Forecasting & AI Insights',     sub: 'Predictive Analytics, 5-Year Projections & Intelligence' },
      yearexplorer:{ title: 'Year Data Explorer',            sub: 'Drill down into any fiscal year FY2009–FY2024' },
      sandbox:     { title: 'Advanced Analytics Sandbox',    sub: 'Correlation modeling, What-If projection simulation & data dictionaries' }
    };

    const t = titles[pageId] || titles.executive;
    document.getElementById('topbar-title').textContent = t.title;
    document.getElementById('topbar-breadcrumb').textContent = t.sub;
    state.currentPage = pageId;

    if (!state.chartsInitialized[pageId]) {
      setTimeout(() => initPageCharts(pageId), 60);
      state.chartsInitialized[pageId] = true;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─── BACKEND DETECTION ───────────────────────────────────
  let backendAvailable = false;

  async function checkBackend() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        if (data.backend === 'python') {
          if (!backendAvailable) {
            backendAvailable = true;
            updateBackendPill(true);
            // Trigger UI update if on Sandbox page
            if (state.currentPage === 'sandbox') {
              if (sandboxState.activeTab === 'correlation') updateCorrelation();
              else if (sandboxState.activeTab === 'simulator') updateSimulation();
            }
          }
          return;
        }
      }
    } catch (e) {
      // Backend not running
    }
    if (backendAvailable) {
      backendAvailable = false;
      updateBackendPill(false);
      // Fallback UI updates
      if (state.currentPage === 'sandbox') {
        if (sandboxState.activeTab === 'correlation') updateCorrelation();
        else if (sandboxState.activeTab === 'simulator') updateSimulation();
      }
    }
  }

  function updateBackendPill(isPython) {
    const pill = document.getElementById('backend-status-pill');
    if (pill) {
      if (isPython) {
        pill.textContent = 'Backend: Python API';
        pill.className = 'badge badge-python';
      } else {
        pill.textContent = 'Backend: Client-Side Fallback';
        pill.className = 'badge badge-js';
      }
    }
  }

  // ─── FILTERS ─────────────────────────────────────────────
  function applyFilters() {
    state.selectedYear = document.getElementById('filter-year').value;
    state.selectedZone = document.getElementById('filter-zone').value;
    state.selectedTrainType = document.getElementById('filter-train').value;
    state.chartsInitialized = {};
    state.yearExplorerBuilt = false;
    initPageCharts(state.currentPage);
    state.chartsInitialized[state.currentPage] = true;
    renderExecutiveKPIs();
    renderFilterBadges();
    showFilterToast();
  }

  function resetFilters() {
    document.getElementById('filter-year').value = 'all';
    document.getElementById('filter-zone').value = 'all';
    document.getElementById('filter-train').value = 'all';
    state.selectedYear = 'all';
    state.selectedZone = 'all';
    state.selectedTrainType = 'all';
    state.chartsInitialized = {};
    state.yearExplorerBuilt = false;
    initPageCharts(state.currentPage);
    state.chartsInitialized[state.currentPage] = true;
    renderExecutiveKPIs();
    renderFilterBadges();
  }

  function renderFilterBadges() {
    const active = [];
    if (state.selectedYear !== 'all') active.push(state.selectedYear);
    if (state.selectedZone !== 'all') active.push(state.selectedZone);
    if (state.selectedTrainType !== 'all') active.push(state.selectedTrainType);
    const el = document.getElementById('active-filters');
    if (el) el.textContent = active.length > 0 ? `${active.length} filter(s) active` : 'No filters';
  }

  function showFilterToast() {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background:rgba(6,15,30,0.95); border:1px solid rgba(37,99,212,0.4);
      color:#e8f4f8; padding:10px 18px; border-radius:10px;
      font-size:12px; font-family:Inter,sans-serif;
      box-shadow:0 8px 40px rgba(0,0,0,0.5);
    `;
    toast.innerHTML = `<span style="color:#1abc9c">✓</span> Filters applied`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // ─── CHART INITIALISATION ────────────────────────────────
  function initPageCharts(pageId) {
    const d = IRData;
    const years = d.years;  // [2009..2024] — 16 values, used as-is
    const C = IRCharts;

    try {
      switch (pageId) {

        // ── EXECUTIVE OVERVIEW ──────────────────────────────
        case 'executive':
          C.buildRevenueTrendChart(years, d.revenue.passenger, d.revenue.freight, d.revenue.total);
          C.buildPassengerTrendChart(years, d.passengers.total);
          C.buildFreightTrendChart(years, d.freight.total);
          initZoneMap();
          break;

        // ── PASSENGER ───────────────────────────────────────
        case 'passenger':
          buildPassengerPageCharts(years, d);
          break;

        // ── REVENUE ─────────────────────────────────────────
        case 'revenue':
          buildRevenuePage(years, d);
          break;

        // ── FREIGHT ─────────────────────────────────────────
        case 'freight':
          buildFreightPage(years, d);
          break;

        // ── SAFETY ──────────────────────────────────────────
        case 'safety':
          C.buildAccidentTrendChart(years, d.accidents);
          C.buildCasualtyChart(years, d.accidents.casualties);
          C.buildLevelCrossingChart(years);
          buildSafetyHeatmap();
          break;

        // ── CANCELLATION ────────────────────────────────────
        case 'cancellation':
          C.buildPunctualityChart(years, d.punctuality.overall, d.punctuality.mail, d.punctuality.express, d.punctuality.vande);
          C.buildCancellationChart(years, d.punctuality.cancellations);
          C.buildDelayReasonsChart();
          C.buildCancellationPieChart();
          C.buildSeasonalChart('chart-seasonal-cancel');
          break;

        // ── ZONE ────────────────────────────────────────────
        case 'zone':
          C.buildZoneRadarChart('chart-zone-radar', Object.keys(d.zoneData).slice(0, 8), 'revenue');
          C.buildZoneBarChart('chart-zone-passengers', Object.keys(d.zoneData), 'passengers', 'rgb(37,99,212)');
          C.buildZoneBarChart('chart-zone-freight-bar', Object.keys(d.zoneData).filter(z => z !== 'Metro'), 'freight', 'rgb(26,188,156)');
          renderZoneTable();
          break;

        // ── FORECAST ────────────────────────────────────────
        case 'forecast':
          C.buildForecastChart('chart-forecast-passengers', years, d.passengers.total, d.forecast.years, d.forecast.passengers, 'Passengers (M)', '#2563d4');
          C.buildForecastChart('chart-forecast-revenue', years, d.revenue.total.map(v => v / 1000), d.forecast.years, d.forecast.revenue.map(v => v / 1000), 'Revenue (₹K Cr)', '#f39c12');
          C.buildForecastChart('chart-forecast-freight', years, d.freight.total, d.forecast.years, d.forecast.freight, 'Freight (MT)', '#1abc9c');
          C.buildForecastChart('chart-forecast-accidents', years, d.accidents.total, d.forecast.years, d.forecast.accidents, 'Accidents', '#e74c3c');
          renderForecastTable();
          renderAIInsights();
          break;

        // ── YEAR EXPLORER ───────────────────────────────────
        case 'yearexplorer':
          buildYearExplorer();
          break;

        // ── ANALYTICS SANDBOX ───────────────────────────────
        case 'sandbox':
          initSandbox();
          break;
      }
    } catch (e) {
      console.warn('Chart init error on page', pageId, ':', e);
    }
  }

  // ─── PASSENGER PAGE CHARTS ───────────────────────────────
  function buildPassengerPageCharts(years, d) {
    // Separate canvas IDs from executive page: -p suffix
    const ctx = document.getElementById('chart-passenger-trend-p');
    if (ctx) {
      destroyAndRebuild('passenger-trend-p', ctx, {
        type: 'line',
        data: {
          labels: years,
          datasets: [{
            label: 'Total Passengers (millions)',
            data: d.passengers.total,
            borderColor: '#2563d4',
            backgroundColor: (() => {
              const g = ctx.getContext('2d').createLinearGradient(0,0,0,260);
              g.addColorStop(0,'rgba(37,99,212,0.5)'); g.addColorStop(1,'rgba(37,99,212,0.02)');
              return g;
            })(),
            fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 3,
          }]
        },
        options: baseChartOptions()
      });
    }
    try { IRCharts.buildPassengerKmChart(years); } catch(e) {}
    try { IRCharts.buildSeasonalChart('chart-seasonal'); } catch(e) {}
    try { IRCharts.buildPassengerClassChart('chart-passenger-class'); } catch(e) {}
    try { IRCharts.buildPremiumTrainChart(years); } catch(e) {}
    try { IRCharts.buildEmployeeChart(years); } catch(e) {}
    try { IRCharts.buildZoneBarChart('chart-zone-passengers-p', Object.keys(d.zoneData), 'passengers', 'rgb(37,99,212)'); } catch(e) {}
  }

  // ─── REVENUE PAGE CHARTS ─────────────────────────────────
  function buildRevenuePage(years, d) {
    // Revenue page has its own canvas: chart-revenue-trend-r
    const ctx = document.getElementById('chart-revenue-trend-r');
    if (ctx) {
      destroyAndRebuild('revenue-trend-r', ctx, {
        type: 'bar',
        data: {
          labels: years,
          datasets: [
            { label: 'Passenger Revenue', data: d.revenue.passenger.map(v => (v/1000).toFixed(1)), backgroundColor: 'rgba(37,99,212,0.75)', borderRadius: 4, stack: 's', order: 2 },
            { label: 'Freight Revenue',   data: d.revenue.freight.map(v => (v/1000).toFixed(1)),   backgroundColor: 'rgba(26,188,156,0.75)', borderRadius: 4, stack: 's', order: 2 },
            { label: 'Other Revenue',     data: d.revenue.other.map(v => (v/1000).toFixed(1)),     backgroundColor: 'rgba(142,68,173,0.6)', borderRadius: 4, stack: 's', order: 2 },
            { label: 'Total Revenue', data: d.revenue.total.map(v => (v/1000).toFixed(1)),
              type: 'line', borderColor: '#f39c12', backgroundColor: 'rgba(243,156,18,0.1)',
              borderWidth: 2.5, pointRadius: 3, tension: 0.4, fill: false, order: 1, yAxisID: 'y1' }
          ]
        },
        options: {
          ...baseChartOptions(),
          scales: {
            x: { grid:{color:'rgba(30,77,154,0.12)'}, ticks:{color:'#5d8aa8',font:{size:10}}, stacked: true },
            y: { grid:{color:'rgba(30,77,154,0.12)'}, ticks:{color:'#5d8aa8',font:{size:10}}, stacked: true },
            y1:{ position:'right', grid:{display:false}, ticks:{color:'#5d8aa8',font:{size:10}} }
          }
        }
      });
    }
    try { IRCharts.buildOperatingRatioChart(years, d.revenue.operatingRatio); } catch(e) {}
    try { IRCharts.buildYoYRevenueChart(years, d.revenue.total); } catch(e) {}
    try { IRCharts.buildZoneRevenueChart(); } catch(e) {}
  }

  // ─── FREIGHT PAGE CHARTS ─────────────────────────────────
  function buildFreightPage(years, d) {
    // chart-freight-trend-f is unique to freight page
    const ctx = document.getElementById('chart-freight-trend-f');
    if (ctx) {
      destroyAndRebuild('freight-trend-f', ctx, {
        type: 'line',
        data: {
          labels: years,
          datasets: [{
            label: 'Freight (million tonnes)',
            data: d.freight.total,
            borderColor: '#1abc9c',
            backgroundColor: (() => {
              const g = ctx.getContext('2d').createLinearGradient(0,0,0,260);
              g.addColorStop(0,'rgba(26,188,156,0.5)'); g.addColorStop(1,'rgba(26,188,156,0.02)');
              return g;
            })(),
            fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 3,
          }]
        },
        options: baseChartOptions()
      });
    }
    try { IRCharts.buildFreightPieChart('chart-freight-pie'); } catch(e) {}
    try { IRCharts.buildNTKChart(years); } catch(e) {}
    try { IRCharts.buildElectrificationChart(years); } catch(e) {}
    try { IRCharts.buildRollingStockChart(years); } catch(e) {}
  }

  // ─── HELPER: destroy old Chart instance then build new ───
  function destroyAndRebuild(registryKey, canvasEl, config) {
    if (chartRegistry[registryKey]) {
      chartRegistry[registryKey].destroy();
      delete chartRegistry[registryKey];
    }
    const chart = new Chart(canvasEl.getContext('2d'), config);
    chartRegistry[registryKey] = chart;
    return chart;
  }

  function baseChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeInOutQuart' },
      plugins: {
        legend: { labels: { color:'#a8c4d8', font:{family:'Inter',size:11}, boxWidth:12, padding:14 } },
        tooltip: { backgroundColor:'rgba(6,15,30,0.95)', titleColor:'#e8f4f8', bodyColor:'#a8c4d8', borderColor:'rgba(30,77,154,0.4)', borderWidth:1, padding:10, cornerRadius:8 }
      },
      scales: {
        x: { grid:{color:'rgba(30,77,154,0.12)'}, ticks:{color:'#5d8aa8',font:{size:10}} },
        y: { grid:{color:'rgba(30,77,154,0.12)'}, ticks:{color:'#5d8aa8',font:{size:10}} }
      }
    };
  }

  // ─── ZONE MAP ────────────────────────────────────────────
  let mapInitialized = false;
  function initZoneMap() {
    if (mapInitialized) return;
    const el = document.getElementById('zone-map');
    if (!el) return;

    const leafletMap = L.map('zone-map', { center:[22.5,82.5], zoom:5, zoomControl:true, attributionControl:false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains:'abcd', maxZoom:19 }).addTo(leafletMap);

    const zoneLocations = {
      'Northern':[28.63,77.22], 'Southern':[13.08,80.27], 'Central':[18.95,72.83],
      'Western':[23.02,72.57], 'Eastern':[22.57,88.36], 'South Central':[17.38,78.48],
      'South Eastern':[22.57,88.36], 'North Eastern':[26.75,83.37], 'Northeast Frontier':[26.19,91.75],
      'East Central':[25.59,85.13], 'North Central':[25.45,81.85], 'North Western':[26.92,75.82],
      'South Western':[12.97,77.59], 'East Coast':[20.29,85.82], 'South East Central':[21.25,81.62],
      'West Central':[23.17,79.94], 'Metro':[22.57,88.37],
    };

    const getColor = (zone) => {
      const rev = IRData.zoneData[zone]?.revenue || 0;
      if (rev > 30000) return '#f39c12';
      if (rev > 20000) return '#2563d4';
      if (rev > 12000) return '#1abc9c';
      return '#5d8aa8';
    };

    Object.entries(zoneLocations).forEach(([zone, coords]) => {
      const zd = IRData.zoneData[zone]; if (!zd) return;
      const color = getColor(zone);
      const radius = Math.max(12, Math.min(36, zd.revenue / 1500));
      const marker = L.circleMarker(coords, { radius, fillColor:color, color:'rgba(255,255,255,0.3)', weight:1.5, fillOpacity:0.75 }).addTo(leafletMap);
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;background:#0a1628;color:#e8f4f8;padding:12px 14px;border-radius:10px;min-width:180px;">
          <div style="font-family:Rajdhani,sans-serif;font-size:16px;font-weight:700;color:#f39c12;margin-bottom:8px;">${zone} Railway</div>
          <div style="font-size:11px;color:#a8c4d8;line-height:2;">
            <span style="color:#5d8aa8">Revenue:</span> ₹${zd.revenue.toLocaleString()} Cr<br>
            <span style="color:#5d8aa8">Passengers:</span> ${zd.passengers}M<br>
            <span style="color:#5d8aa8">Freight:</span> ${zd.freight} MT<br>
            <span style="color:#5d8aa8">Route KM:</span> ${zd.routeKm.toLocaleString()}<br>
            <span style="color:#5d8aa8">Punctuality:</span> ${zd.punctuality}%
          </div>
        </div>`, { className:'custom-popup' });
      marker.on('mouseover', function(){ this.openPopup(); });
    });

    const style = document.createElement('style');
    style.textContent = `.custom-popup .leaflet-popup-content-wrapper{background:transparent!important;box-shadow:0 8px 32px rgba(0,0,0,.6)!important;border:1px solid rgba(30,77,154,.4)!important;border-radius:12px!important;}.custom-popup .leaflet-popup-tip{display:none}.custom-popup .leaflet-popup-content{margin:0}.leaflet-control-zoom{border:1px solid rgba(30,77,154,.3)!important}.leaflet-control-zoom a{background:rgba(10,22,40,.9)!important;color:#a8c4d8!important;border:none!important}`;
    document.head.appendChild(style);
    mapInitialized = true;
  }

  // ─── SAFETY HEATMAP ──────────────────────────────────────
  function buildSafetyHeatmap() {
    const el = document.getElementById('safety-heatmap');
    if (!el) return;
    el.innerHTML = '';
    const zones = Object.keys(IRData.zoneData);
    const years = IRData.years;

    const header = document.createElement('div');
    header.style.cssText = 'display:grid;grid-template-columns:120px repeat(16,1fr);gap:3px;margin-bottom:6px;';
    header.innerHTML = '<div></div>' + years.map(y => `<div style="font-size:9px;color:#5d8aa8;text-align:center;">${y}</div>`).join('');
    el.appendChild(header);

    zones.slice(0, 8).forEach(zone => {
      const row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:120px repeat(16,1fr);gap:3px;margin-bottom:3px;';
      const label = document.createElement('div');
      label.style.cssText = 'font-size:10px;color:#a8c4d8;display:flex;align-items:center;padding-right:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      label.textContent = zone.replace(' Railway','');
      row.appendChild(label);
      const zoneWeight = {'Northern':0.12,'Southern':0.09,'Central':0.07,'Western':0.09,'Eastern':0.08,'South Central':0.09,'South Eastern':0.08,'North Eastern':0.07};
      years.forEach((y, i) => {
        const val = Math.round(IRData.accidents.total[i] * (zoneWeight[zone] || 0.06));
        const cell = document.createElement('div');
        const intensity = val / 20;
        const r = Math.round(192 + intensity * 40), g2 = Math.round(57 - intensity * 40), b = Math.round(43 - intensity * 20);
        cell.style.cssText = `height:22px;border-radius:3px;cursor:pointer;background:${val===0?'rgba(26,188,156,0.3)':`rgba(${r},${g2},${b},${0.3+intensity*0.65})`};border:1px solid rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:rgba(255,255,255,0.7);transition:transform 0.15s;`;
        cell.textContent = val;
        cell.title = `${zone} – ${y}: ${val} accidents`;
        cell.onmouseenter = () => { cell.style.transform='scale(1.3)'; cell.style.zIndex='10'; };
        cell.onmouseleave = () => { cell.style.transform=''; cell.style.zIndex=''; };
        row.appendChild(cell);
      });
      el.appendChild(row);
    });
  }

  // ─── ZONE TABLE ───────────────────────────────────────────
  function renderZoneTable() {
    const tbody = document.getElementById('zone-table-body');
    if (!tbody) return;
    const zones = Object.entries(IRData.zoneData).sort((a,b) => b[1].revenue - a[1].revenue);
    tbody.innerHTML = zones.map(([zone, d], i) => {
      const rank = i+1;
      const rankClass = rank===1?'rank-1':rank===2?'rank-2':rank===3?'rank-3':'rank-other';
      const barPct = ((d.revenue / 38500)*100).toFixed(0);
      const barColor = rank<=3?'#f39c12':rank<=6?'#2563d4':'#1abc9c';
      return `<tr>
        <td><span class="rank-badge ${rankClass}">${rank}</span></td>
        <td class="font-bold text-white">${zone}</td>
        <td><div class="progress-bar-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${barPct}%;background:${barColor};"></div></div><span class="progress-value">₹${(d.revenue/1000).toFixed(0)}K Cr</span></div></td>
        <td>${d.passengers.toLocaleString()}M</td>
        <td>${d.freight>0?d.freight+' MT':'<span class="text-muted">N/A</span>'}</td>
        <td>${d.routeKm.toLocaleString()} km</td>
        <td><span style="color:${d.punctuality>90?'#1abc9c':d.punctuality>85?'#f39c12':'#a8c4d8'}">${d.punctuality}%</span></td>
        <td><span style="color:${d.accidents===0?'#1abc9c':d.accidents<=2?'#f39c12':'#e74c3c'}">${d.accidents===0?'✓ 0':d.accidents}</span></td>
      </tr>`;
    }).join('');
  }

  // ─── AI INSIGHTS ─────────────────────────────────────────
  function renderAIInsights() {
    const el = document.getElementById('ai-insights-container');
    if (!el) return;
    const cm = {
      green:  { color:'#1abc9c', badge:'rgba(26,188,156,0.15)', bt:'#1abc9c' },
      gold:   { color:'#f39c12', badge:'rgba(243,156,18,0.15)', bt:'#f39c12' },
      blue:   { color:'#2563d4', badge:'rgba(37,99,212,0.15)',  bt:'#60a5fa' },
      purple: { color:'#8e44ad', badge:'rgba(142,68,173,0.15)', bt:'#c084fc' },
      red:    { color:'#c0392b', badge:'rgba(192,57,43,0.15)',  bt:'#e74c3c' },
    };
    el.innerHTML = IRData.insights.map(ins => {
      const c = cm[ins.color] || cm.blue;
      return `<div class="insight-card color-${ins.color}" style="--insight-color:${c.color}">
        <div class="insight-header"><span class="insight-emoji">${ins.icon}</span>
        <div class="insight-meta"><div class="insight-category">${ins.category}</div><div class="insight-title">${ins.title}</div></div></div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
          <span class="insight-value" style="color:${c.color}">${ins.value}</span>
          <span class="insight-badge" style="background:${c.badge};color:${c.bt};border:1px solid ${c.color}44;">${ins.badge}</span>
        </div>
        <div class="insight-body">${ins.detail}</div></div>`;
    }).join('');
  }

  // ─── EXECUTIVE KPIs ──────────────────────────────────────
  function renderExecutiveKPIs() {
    const k = IRData.kpis;
    const kpis = [
      { id:'kpi-passengers', value: k.totalPassengers2024.toLocaleString(), unit:'M', label:'Total Passengers', change:`+${k.passengerGrowth5Y}%`, dir:'up', sub:'vs 5Y ago', icon:'🧑‍🤝‍🧑' },
      { id:'kpi-pass-rev',   value:'₹'+(k.passengerRevenue2024/1000).toFixed(0), unit:'K Cr', label:'Passenger Revenue', change:'+28.1%', dir:'up', sub:'vs FY2019', icon:'🎫' },
      { id:'kpi-freight-rev',value:'₹'+(k.freightRevenue2024/1000).toFixed(0), unit:'K Cr', label:'Freight Revenue', change:'+29.9%', dir:'up', sub:'vs FY2019', icon:'🚚' },
      { id:'kpi-total-rev',  value:'₹'+(k.totalRevenue2024/1000).toFixed(0), unit:'K Cr', label:'Total Revenue', change:`+${k.revenueGrowth5Y}%`, dir:'up', sub:'vs FY2019', icon:'💰' },
      { id:'kpi-route-km',   value:(k.routeKm2024/1000).toFixed(0), unit:'K km', label:'Route KM', change:'+0.4%', dir:'up', sub:'vs FY2009', icon:'🛤️' },
      { id:'kpi-accidents',  value:k.accidents2024.toString(), unit:'', label:'Accident Count', change:`-${k.accidentReduction}%`, dir:'down', sub:'since FY2009', icon:'🛡️' },
      { id:'kpi-punctuality',value:k.punctuality2024+'%', unit:'', label:'Punctuality', change:'+12.8pp', dir:'up', sub:'vs FY2009', icon:'⏱️' },
      { id:'kpi-freight',    value:k.freightTotal2024.toLocaleString(), unit:'MT', label:'Total Freight', change:'+5.2%', dir:'up', sub:'vs FY2023', icon:'📦' },
    ];

    kpis.forEach(kpi => {
      const el = document.getElementById(kpi.id);
      if (!el) return;
      const dirText = kpi.dir === 'down' ? '↓' : '↑';
      const dirClass = kpi.id === 'kpi-accidents' ? 'up' : kpi.dir;
      el.innerHTML = `
        <div class="kpi-header">
          <div><div class="kpi-label">${kpi.label}</div><div class="kpi-value">${kpi.value}<span class="kpi-unit">${kpi.unit}</span></div></div>
          <div class="kpi-icon">${kpi.icon}</div>
        </div>
        <div class="kpi-change ${dirClass}">${dirText} ${kpi.change}</div>
        <div class="kpi-sub">${kpi.sub}</div>`;
    });
  }

  // ─── FORECAST TABLE ───────────────────────────────────────
  function renderForecastTable() {
    const el = document.getElementById('forecast-table-body');
    if (!el) return;
    const f = IRData.forecast;
    el.innerHTML = f.years.map((y, i) => {
      const passGrowth = ((f.passengers[i]/IRData.passengers.total[15]-1)*100).toFixed(1);
      const revGrowth  = ((f.revenue[i]/IRData.revenue.total[15]-1)*100).toFixed(1);
      const conf = [92,88,83,78,72][i];
      return `<tr>
        <td class="font-bold text-white">FY${y}</td>
        <td>${f.passengers[i].toLocaleString()}M <span class="text-green" style="font-size:10px;">(+${passGrowth}%)</span></td>
        <td>₹${(f.revenue[i]/1000).toFixed(0)}K Cr <span class="text-gold" style="font-size:10px;">(+${revGrowth}%)</span></td>
        <td>${f.freight[i].toLocaleString()} MT</td>
        <td style="color:${f.accidents[i]<25?'#1abc9c':'#f39c12'}">${f.accidents[i]}</td>
        <td>${f.punctuality[i]}%</td>
        <td><div class="progress-bar-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${conf}%;background:#2563d4;"></div></div><span class="progress-value">${conf}%</span></div></td>
      </tr>`;
    }).join('');
  }

  // ─── TIME ─────────────────────────────────────────────────
  function updateTime() {
    const el = document.getElementById('time-display');
    if (!el) return;
    const now = new Date();
    el.innerHTML = `<div style="font-weight:600;color:#e8f4f8">${now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div><div>${now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>`;
  }

  // ─── YEAR EXPLORER ───────────────────────────────────────
  function fmtN(n, dec=0) {
    if (n === null || n === undefined) return '—';
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: dec });
  }

  function metricRow(label, value, unit='', prev=null, invertGood=false) {
    let changeHtml = '';
    if (prev !== null && prev !== undefined && prev !== 0) {
      const d = ((value - prev) / Math.abs(prev) * 100).toFixed(1);
      const isGood = invertGood ? d <= 0 : d >= 0;
      const cls = isGood ? 'green' : 'red';
      const arrow = d >= 0 ? '▲' : '▼';
      changeHtml = `<span class="stat-chip ${cls}" style="font-size:9.5px;">${arrow} ${Math.abs(d)}% vs prev yr</span>`;
    }
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(30,77,154,0.12);">
      <span style="font-size:11px;color:#a8c4d8;">${label}</span>
      <span style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:600;color:#e8f4f8;">${fmtN(value)} <span style="font-size:10px;color:#5d8aa8;">${unit}</span> ${changeHtml}</span>
    </div>`;
  }

  function renderYearSnapshot(i) {
    const s = IRData.getYearSnapshot(i);
    const prev = i > 0 ? IRData.getYearSnapshot(i-1) : null;
    const base = IRData.getYearSnapshot(0);
    const isCOVID = s.year === 2020 || s.year === 2021;

    document.getElementById('year-snapshot-banner').innerHTML = `
      <div class="banner-icon">${isCOVID?'🦠':'📅'}</div>
      <div class="banner-text">
        <div class="banner-title">FY${s.year}-${String(s.year+1).slice(-2)} — Complete Data Snapshot</div>
        <div class="banner-desc">${isCOVID?'⚠️ COVID-19 Impact Year — Severe lockdown caused 84.5% passenger crash':'Indian Railways Annual Performance — '+s.fy}</div>
      </div>
      <div class="banner-stats">
        <div class="banner-stat"><div class="banner-stat-value">${fmtN(s.passengers)}M</div><div class="banner-stat-label">Passengers</div></div>
        <div class="banner-stat"><div class="banner-stat-value">₹${fmtN(Math.round(s.totalRevenue/1000))}K Cr</div><div class="banner-stat-label">Total Revenue</div></div>
        <div class="banner-stat"><div class="banner-stat-value">${fmtN(s.freight)} MT</div><div class="banner-stat-label">Freight</div></div>
      </div>`;

    document.getElementById('ys-passengers').innerHTML = [
      metricRow('Total Passengers', s.passengers, 'M', prev?.passengers),
      metricRow('Upper Class', s.upperClass, 'M', prev?.upperClass),
      metricRow('Sleeper Class', s.sleeperClass, 'M', prev?.sleeperClass),
      metricRow('Second Class', s.secondClass, 'M', prev?.secondClass),
      metricRow('Passenger-KM', s.passengerKm, 'B PKM', prev?.passengerKm),
      metricRow('Punctuality', s.punctuality, '%', prev?.punctuality),
      metricRow('Avg Train Delay', s.avgDelay, 'min', prev?.avgDelay, true),
      metricRow('Cancellations', s.cancellations, '', prev?.cancellations, true),
    ].join('');

    document.getElementById('ys-revenue').innerHTML = [
      metricRow('Total Revenue', s.totalRevenue, '₹ Cr', prev?.totalRevenue),
      metricRow('Passenger Revenue', s.passRevenue, '₹ Cr', prev?.passRevenue),
      metricRow('Freight Revenue', s.freightRevenue, '₹ Cr', prev?.freightRevenue),
      metricRow('Other Revenue', s.otherRevenue, '₹ Cr', prev?.otherRevenue),
      metricRow('Operating Ratio', s.operatingRatio, '%', prev?.operatingRatio, true),
      `<div style="padding:8px 0;font-size:10px;color:#5d8aa8;">Note: OR &lt; 100% = revenue exceeds working expenses (profitable)</div>`,
    ].join('');

    document.getElementById('ys-freight').innerHTML = [
      metricRow('Total Freight Loading', s.freight, 'MT', prev?.freight),
      metricRow('Coal', s.coal, 'MT', prev?.coal),
      metricRow('Iron & Steel', s.iron, 'MT', prev?.iron),
      metricRow('Cement', s.cement, 'MT', prev?.cement),
      metricRow('Food Grains', s.foodGrains, 'MT', prev?.foodGrains),
      metricRow('Petroleum', IRData.freight.petroleum[i], 'MT', i>0?IRData.freight.petroleum[i-1]:null),
      metricRow('Net Tonne-KM', s.freightNTK, 'B NTK', prev?.freightNTK),
    ].join('');

    document.getElementById('ys-safety').innerHTML = [
      metricRow('Total Accidents', s.accidents, '', prev?.accidents, true),
      metricRow('Derailments', s.derailments, '', i>0?IRData.accidents.derailments[i-1]:null, true),
      metricRow('Collisions', s.collisions, '', i>0?IRData.accidents.collisions[i-1]:null, true),
      metricRow('Level Crossing Accidents', s.levelCrossing, '', i>0?IRData.accidents.levelCrossing[i-1]:null, true),
      metricRow('Casualties', s.casualties, '', i>0?IRData.accidents.casualties[i-1]:null, true),
      metricRow('Unmanned Level Crossings', s.levelCrossings, '', i>0?IRData.infrastructure.levelCrossings[i-1]:null, true),
    ].join('');

    document.getElementById('ys-infra').innerHTML = [
      metricRow('Route KM', s.routeKm, 'km', prev?.routeKm),
      metricRow('Electrified KM', s.electrifiedKm, 'km', prev?.electrifiedKm),
      `<div style="padding:4px 0;font-size:10px;color:#5d8aa8;">Electrification: ${((s.electrifiedKm/s.routeKm)*100).toFixed(1)}% of route km</div>`,
      metricRow('Railway Stations', s.stations, '', prev?.stations),
      metricRow('Employees', s.employees, '', prev?.employees),
      `<div style="padding:4px 0;font-size:10px;color:#5d8aa8;">Staff per route km: ${(s.employees/s.routeKm).toFixed(1)}</div>`,
    ].join('');

    document.getElementById('ys-rolling').innerHTML = [
      metricRow('Total Locomotives', s.locomotives, '', prev?.locomotives),
      metricRow('Electric Locos', IRData.rollingStock.electricLocos[i], '', i>0?IRData.rollingStock.electricLocos[i-1]:null),
      metricRow('Coaches', s.coaches, '', prev?.coaches),
      metricRow('Wagons', s.wagons, '', prev?.wagons),
      metricRow('Vande Bharat Trains', s.vandeBharat||0, '', i>0?(IRData.premiumTrains.vandeBharat[i-1]||0):null),
      metricRow('Rajdhani Trains', IRData.premiumTrains.rajdhani[i], '', i>0?IRData.premiumTrains.rajdhani[i-1]:null),
    ].join('');

    // Comparison table
    const rows = [
      ['Passengers (M)', s.passengers, prev?.passengers, base.passengers],
      ['Total Revenue (₹ Cr)', s.totalRevenue, prev?.totalRevenue, base.totalRevenue],
      ['Freight (MT)', s.freight, prev?.freight, base.freight],
      ['Accidents', s.accidents, prev?.accidents, base.accidents],
      ['Punctuality (%)', s.punctuality, prev?.punctuality, base.punctuality],
      ['Operating Ratio (%)', s.operatingRatio, prev?.operatingRatio, base.operatingRatio],
      ['Route KM', s.routeKm, prev?.routeKm, base.routeKm],
      ['Electrified KM', s.electrifiedKm, prev?.electrifiedKm, base.electrifiedKm],
      ['Employees', s.employees, prev?.employees, base.employees],
    ];
    const th = 'padding:8px 12px;text-align:right;font-size:10px;color:#5d8aa8;font-weight:600;white-space:nowrap;';
    const td = 'padding:7px 12px;font-size:12px;color:#e8f4f8;text-align:right;border-bottom:1px solid rgba(30,77,154,0.1);';
    const tl = 'padding:7px 12px;font-size:11px;color:#a8c4d8;border-bottom:1px solid rgba(30,77,154,0.1);white-space:nowrap;';
    document.getElementById('ys-comparison').innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="${th}text-align:left;">Metric</th>
        <th style="${th}">FY${s.year} (Selected)</th>
        <th style="${th}">${prev?`FY${prev.year}`:'—'} (Prev)</th>
        <th style="${th}">FY2009 (Base)</th>
        <th style="${th}">Δ vs Base</th>
      </tr></thead><tbody>${rows.map(([label, cur, p, b]) => {
        const vs = b ? ((cur-b)/Math.abs(b)*100).toFixed(1) : '—';
        const col = vs !== '—' ? (vs > 0 ? '#1abc9c' : '#e74c3c') : '#a8c4d8';
        return `<tr><td style="${tl}">${label}</td><td style="${td}color:#60a5fa;font-weight:600;">${fmtN(cur)}</td><td style="${td}">${p!=null?fmtN(p):'—'}</td><td style="${td}">${fmtN(b)}</td><td style="${td}color:${col};">${vs!=='—'?(vs>0?'▲':'▼')+' '+Math.abs(vs)+'%':'—'}</td></tr>`;
      }).join('')}</tbody></table>`;

    document.getElementById('year-snapshot-panel').style.display = 'block';
    document.getElementById('year-snapshot-panel').scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function buildYearExplorer() {
    if (state.yearExplorerBuilt) return;
    state.yearExplorerBuilt = true;

    const grid = document.getElementById('year-btn-grid');
    if (!grid) return;
    grid.innerHTML = '';

    IRData.years.forEach((yr, i) => {
      const isCOVID = yr === 2020 || yr === 2021;
      const btn = document.createElement('button');
      btn.id = `yr-btn-${yr}`;
      btn.innerHTML = `<div style="font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;">FY${yr}</div><div style="font-size:9px;color:${isCOVID?'#e74c3c':'#5d8aa8'};margin-top:2px;">${isCOVID?'🦠 COVID':IRData.fyLabels[i].replace('FY','')}</div>`;
      btn.style.cssText = `padding:12px 16px;border-radius:10px;border:1px solid ${isCOVID?'rgba(192,57,43,0.4)':'rgba(30,77,154,0.25)'};background:${isCOVID?'rgba(192,57,43,0.06)':'rgba(13,33,68,0.6)'};color:#e8f4f8;cursor:pointer;transition:all 0.2s;min-width:82px;`;
      btn.addEventListener('mouseenter', () => { btn.style.background='rgba(37,99,212,0.2)'; btn.style.borderColor='rgba(37,99,212,0.5)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background=isCOVID?'rgba(192,57,43,0.06)':'rgba(13,33,68,0.6)'; btn.style.borderColor=isCOVID?'rgba(192,57,43,0.4)':'rgba(30,77,154,0.25)'; });
      btn.addEventListener('click', () => {
        document.querySelectorAll('#year-btn-grid button').forEach(b => { b.style.background=b.id.includes('2020')||b.id.includes('2021')?'rgba(192,57,43,0.06)':'rgba(13,33,68,0.6)'; b.style.borderColor=b.id.includes('2020')||b.id.includes('2021')?'rgba(192,57,43,0.4)':'rgba(30,77,154,0.25)'; });
        btn.style.background='rgba(37,99,212,0.35)';
        btn.style.borderColor='#2563d4';
        renderYearSnapshot(i);
      });
      grid.appendChild(btn);
    });

    const thead = document.getElementById('fht-head');
    const tbody = document.getElementById('fht-body');
    const thS = 'padding:8px 10px;text-align:right;font-size:9.5px;color:#5d8aa8;font-weight:600;white-space:nowrap;border-bottom:2px solid rgba(30,77,154,0.2);';
    const thL = 'padding:8px 10px;text-align:left;font-size:9.5px;color:#5d8aa8;font-weight:600;white-space:nowrap;border-bottom:2px solid rgba(30,77,154,0.2);position:sticky;left:0;background:#0d2144;';
    thead.innerHTML = `<tr><th style="${thL}">Metric</th>${IRData.years.map(y=>`<th style="${thS}">${y===2020||y===2021?'🦠 ':''}FY${y}</th>`).join('')}</tr>`;
    const metrics2 = [
      {l:'Passengers (M)',fn:i=>IRData.passengers.total[i]},
      {l:'PKM (B)',fn:i=>IRData.passengers.passengerKm[i]},
      {l:'Pass. Revenue (₹ Cr)',fn:i=>IRData.revenue.passenger[i]},
      {l:'Freight Revenue (₹ Cr)',fn:i=>IRData.revenue.freight[i]},
      {l:'Total Revenue (₹ Cr)',fn:i=>IRData.revenue.total[i]},
      {l:'Operating Ratio (%)',fn:i=>IRData.revenue.operatingRatio[i]},
      {l:'Freight Loading (MT)',fn:i=>IRData.freight.total[i]},
      {l:'— Coal (MT)',fn:i=>IRData.freight.coal[i]},
      {l:'— Iron & Steel (MT)',fn:i=>IRData.freight.iron[i]},
      {l:'NTK (B)',fn:i=>IRData.freight.netTonneKm[i]},
      {l:'Accidents',fn:i=>IRData.accidents.total[i]},
      {l:'— Derailments',fn:i=>IRData.accidents.derailments[i]},
      {l:'— Casualties',fn:i=>IRData.accidents.casualties[i]},
      {l:'Punctuality (%)',fn:i=>IRData.punctuality.overall[i]},
      {l:'Cancellations',fn:i=>IRData.punctuality.cancellations[i]},
      {l:'Avg Delay (min)',fn:i=>IRData.punctuality.avgDelayMin[i]},
      {l:'Route KM',fn:i=>IRData.infrastructure.routeKm[i]},
      {l:'Electrified KM',fn:i=>IRData.infrastructure.electrifiedKm[i]},
      {l:'Stations',fn:i=>IRData.infrastructure.stations[i]},
      {l:'Level Crossings',fn:i=>IRData.infrastructure.levelCrossings[i]},
      {l:'Locomotives',fn:i=>IRData.rollingStock.locomotives[i]},
      {l:'Coaches',fn:i=>IRData.rollingStock.coaches[i]},
      {l:'Wagons',fn:i=>IRData.rollingStock.wagons[i]},
      {l:'Employees',fn:i=>IRData.employees.total[i]},
      {l:'Vande Bharat',fn:i=>IRData.premiumTrains.vandeBharat[i]},
    ];
    const tdS2 = 'padding:6px 10px;text-align:right;font-size:11px;color:#e8f4f8;border-bottom:1px solid rgba(30,77,154,0.08);white-space:nowrap;';
    const tdL2 = 'padding:6px 10px;text-align:left;font-size:11px;color:#a8c4d8;border-bottom:1px solid rgba(30,77,154,0.08);white-space:nowrap;position:sticky;left:0;background:#0a1628;';
    tbody.innerHTML = metrics2.map((m, mi) => {
      const rowBg = mi%2===0?'':'background:rgba(30,77,154,0.04);';
      return `<tr style="${rowBg}"><td style="${tdL2}">${m.l}</td>${IRData.years.map((_,i)=>{
        const isCov = IRData.years[i]===2020||IRData.years[i]===2021;
        return `<td style="${tdS2}${isCov?'color:#e74c3c;':''}">${fmtN(m.fn(i))}</td>`;
      }).join('')}</tr>`;
    }).join('');

    // Auto-select latest year (FY2024)
    setTimeout(() => {
      const btn = document.getElementById('yr-btn-2024');
      if (btn) btn.click();
    }, 50);
  }

  // ─── STATISTICAL CORE MATH ──────────────────────────────
  const StatsMath = {
    mean(arr) {
      if (arr.length === 0) return 0;
      return arr.reduce((sum, v) => sum + v, 0) / arr.length;
    },
    median(arr) {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    },
    stdDev(arr, isSample = true) {
      if (arr.length <= 1) return 0;
      const avg = this.mean(arr);
      const sqDiffs = arr.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0);
      return Math.sqrt(sqDiffs / (arr.length - (isSample ? 1 : 0)));
    },
    cagr(startVal, endVal, periods) {
      if (startVal <= 0 || endVal <= 0 || periods <= 0) return 0;
      return (Math.pow(endVal / startVal, 1 / periods) - 1) * 100;
    },
    pearsonCorrelation(x, y) {
      const n = x.length;
      if (n === 0 || n !== y.length) return 0;
      const meanX = this.mean(x);
      const meanY = this.mean(y);
      let num = 0;
      let denX = 0;
      let denY = 0;
      for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      }
      if (denX === 0 || denY === 0) return 0;
      return num / Math.sqrt(denX * denY);
    },
    linearRegression(x, y) {
      const n = x.length;
      if (n === 0 || n !== y.length) return { m: 0, c: 0, r2: 0 };
      const meanX = this.mean(x);
      const meanY = this.mean(y);
      let num = 0;
      let den = 0;
      for (let i = 0; i < n; i++) {
        num += (x[i] - meanX) * (y[i] - meanY);
        den += Math.pow(x[i] - meanX, 2);
      }
      const m = den === 0 ? 0 : num / den;
      const c = meanY - m * meanX;
      
      let ssTot = 0;
      let ssRes = 0;
      for (let i = 0; i < n; i++) {
        const yPred = m * x[i] + c;
        ssTot += Math.pow(y[i] - meanY, 2);
        ssRes += Math.pow(y[i] - yPred, 2);
      }
      const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
      
      return { m, c, r2 };
    }
  };

  // Helper to extract nested properties from data module
  function getNestedProperty(obj, path) {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj);
  }

  // Sandbox State
  let sandboxState = {
    activeTab: 'correlation',
    simMetric: 'passengers',
  };

  // Initialize Sandbox controls and events
  function initSandbox() {
    // 1. Setup Sandbox internal tab switching
    document.querySelectorAll('[data-sandbox-tab]').forEach(btn => {
      // Remove any existing listener by cloning (prevents duplicate bindings)
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', () => {
        const targetTab = newBtn.dataset.sandboxTab;
        document.querySelectorAll('[data-sandbox-tab]').forEach(b => b.classList.remove('active'));
        newBtn.classList.add('active');
        
        document.querySelectorAll('.sandbox-tab-content').forEach(p => p.classList.remove('active-tab'));
        document.getElementById(`sandbox-tab-${targetTab}`)?.classList.add('active-tab');
        
        sandboxState.activeTab = targetTab;
        if (targetTab === 'correlation') {
          updateCorrelation();
        } else if (targetTab === 'simulator') {
          updateSimulation();
        }
      });
    });

    // 2. Correlation Axis Controls
    const xVarSelect = document.getElementById('corr-x-var');
    const yVarSelect = document.getElementById('corr-y-var');
    if (xVarSelect && yVarSelect) {
      xVarSelect.onchange = updateCorrelation;
      yVarSelect.onchange = updateCorrelation;
    }

    // 3. Simulator Controls
    const resetSimBtn = document.getElementById('reset-scenario-btn');
    if (resetSimBtn) {
      resetSimBtn.onclick = () => {
        document.getElementById('slider-gdp').value = 1.20;
        document.getElementById('slider-vb').value = 30;
        document.getElementById('slider-safety').value = 1.00;
        document.getElementById('slider-freight').value = 4.0;
        
        document.getElementById('slider-gdp-val').textContent = '1.20';
        document.getElementById('slider-vb-val').textContent = '30 / yr';
        document.getElementById('slider-safety-val').textContent = '1.00x';
        document.getElementById('slider-freight-val').textContent = '4.0% / yr';
        
        updateSimulation();
      };
    }

    ['slider-gdp', 'slider-vb', 'slider-safety', 'slider-freight'].forEach(id => {
      const slider = document.getElementById(id);
      if (slider) {
        slider.oninput = (e) => {
          const val = Number(e.target.value);
          let displayVal = val.toString();
          if (id === 'slider-gdp') displayVal = val.toFixed(2);
          else if (id === 'slider-vb') displayVal = `${val} / yr`;
          else if (id === 'slider-safety') displayVal = `${val.toFixed(2)}x`;
          else if (id === 'slider-freight') displayVal = `${val.toFixed(1)}% / yr`;
          
          document.getElementById(`${id}-val`).textContent = displayVal;
          updateSimulation();
        };
      }
    });

    // 4. Simulator Metrics Buttons
    const metricBtns = {
      'sim-chart-metric-pass': 'passengers',
      'sim-chart-metric-rev': 'revenue',
      'sim-chart-metric-acc': 'accidents'
    };
    Object.entries(metricBtns).forEach(([btnId, metric]) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.onclick = (e) => {
          document.querySelectorAll('#sandbox-tab-simulator .chart-btn').forEach(b => {
            if (b.id !== 'reset-scenario-btn') b.classList.remove('active');
          });
          btn.classList.add('active');
          sandboxState.simMetric = metric;
          updateSimulation();
        };
      }
    });

    // 5. CSV download buttons
    const fullCsvBtn = document.getElementById('download-full-csv');
    if (fullCsvBtn) fullCsvBtn.onclick = downloadFullDatasetCSV;

    const simCsvBtn = document.getElementById('download-sim-csv');
    if (simCsvBtn) simCsvBtn.onclick = downloadSimulationCSV;

    // Trigger initial calculation
    updateCorrelation();
  }

  // Calculate correlation and update regression UI
  async function updateCorrelation() {
    const xSelect = document.getElementById('corr-x-var');
    const ySelect = document.getElementById('corr-y-var');
    if (!xSelect || !ySelect) return;

    const xPath = xSelect.value;
    const yPath = ySelect.value;
    
    const d = IRData;
    const xRaw = getNestedProperty(d, xPath);
    const yRaw = getNestedProperty(d, yPath);
    
    if (!xRaw || !yRaw) return;

    // Align variables (skipping indices that are null or undefined)
    const alignedPoints = [];
    for (let i = 0; i < d.years.length; i++) {
      if (xRaw[i] !== null && xRaw[i] !== undefined && yRaw[i] !== null && yRaw[i] !== undefined) {
        alignedPoints.push({
          year: d.years[i],
          x: xRaw[i],
          y: yRaw[i]
        });
      }
    }

    if (alignedPoints.length < 2) return;

    const xVal = alignedPoints.map(p => p.x);
    const yVal = alignedPoints.map(p => p.y);

    let r, m, c, r2;
    let xMean, xMedian, xSD, xCV, xCAGR;
    let yMean, yMedian, ySD, yCV, yCAGR;

    if (backendAvailable) {
      try {
        const res = await fetch(`/api/correlation?x=${xPath}&y=${yPath}`);
        if (res.ok) {
          const resData = await res.json();
          r = resData.r;
          m = resData.m;
          c = resData.c;
          r2 = resData.r2;
          
          xMean = resData.descriptive.x.mean;
          xMedian = resData.descriptive.x.median;
          xSD = resData.descriptive.x.sd;
          xCV = resData.descriptive.x.cv;
          xCAGR = resData.descriptive.x.cagr;

          yMean = resData.descriptive.y.mean;
          yMedian = resData.descriptive.y.median;
          ySD = resData.descriptive.y.sd;
          yCV = resData.descriptive.y.cv;
          yCAGR = resData.descriptive.y.cagr;
        } else {
          throw new Error('API response not OK');
        }
      } catch (e) {
        console.log('Correlation API failed, falling back to local JS:', e);
        backendAvailable = false;
        updateBackendPill(false);
      }
    }

    // Fallback if backend calculation wasn't used or failed
    if (!backendAvailable || r === undefined) {
      // Compute coefficients
      r = StatsMath.pearsonCorrelation(xVal, yVal);
      const reg = StatsMath.linearRegression(xVal, yVal);
      m = reg.m;
      c = reg.c;
      r2 = reg.r2;

      // Descriptive Statistics for Panel
      xMean = StatsMath.mean(xVal);
      xMedian = StatsMath.median(xVal);
      xSD = StatsMath.stdDev(xVal);
      xCV = xMean !== 0 ? (xSD / xMean * 100) : 0;
      xCAGR = StatsMath.cagr(xVal[0], xVal[xVal.length - 1], xVal.length - 1);

      yMean = StatsMath.mean(yVal);
      yMedian = StatsMath.median(yVal);
      ySD = StatsMath.stdDev(yVal);
      yCV = yMean !== 0 ? (ySD / yMean * 100) : 0;
      yCAGR = StatsMath.cagr(yVal[0], yVal[yVal.length - 1], yVal.length - 1);
    }

    // Write statistics to UI elements
    document.getElementById('stat-r-val').textContent = r.toFixed(3);
    document.getElementById('stat-r2-val').textContent = r2.toFixed(3);
    const sign = c >= 0 ? '+' : '-';
    document.getElementById('stat-eq-val').textContent = `y = ${m.toFixed(4)}x ${sign} ${Math.abs(c).toFixed(2)}`;

    // Write descriptive panel stats
    const formatStat = (num) => Number(num).toLocaleString('en-IN', { maximumFractionDigits: 1 });
    
    document.getElementById('stat-x-mean').textContent = formatStat(xMean);
    document.getElementById('stat-x-median').textContent = formatStat(xMedian);
    document.getElementById('stat-x-sd').textContent = formatStat(xSD);
    document.getElementById('stat-x-cv').textContent = `${xCV.toFixed(1)}%`;
    document.getElementById('stat-x-cagr').textContent = xCAGR !== 0 ? `${xCAGR.toFixed(2)}%` : 'N/A';

    document.getElementById('stat-y-mean').textContent = formatStat(yMean);
    document.getElementById('stat-y-median').textContent = formatStat(yMedian);
    document.getElementById('stat-y-sd').textContent = formatStat(ySD);
    document.getElementById('stat-y-cv').textContent = `${yCV.toFixed(1)}%`;
    document.getElementById('stat-y-cagr').textContent = yCAGR !== 0 ? `${yCAGR.toFixed(2)}%` : 'N/A';

    // Compute regression line points (yFit = m * x + c)
    const regressionPoints = xVal.map(x => m * x + c);

    // Relation badge text & styles
    const relationBadge = document.getElementById('stat-relation-badge');
    const commentaryBox = document.getElementById('stat-commentary-box');
    const xLabel = xSelect.selectedOptions[0].text;
    const yLabel = ySelect.selectedOptions[0].text;

    let strength = 'Negligible';
    const absR = Math.abs(r);
    if (absR >= 0.8) strength = 'Strong';
    else if (absR >= 0.5) strength = 'Moderate';
    else if (absR >= 0.3) strength = 'Weak';

    const dir = r >= 0 ? 'Positive' : 'Negative';
    relationBadge.textContent = `${strength} ${dir}`;
    
    relationBadge.className = 'section-tag';
    if (strength === 'Strong') {
      relationBadge.classList.add(r >= 0 ? 'tag-live' : 'badge-red');
    } else if (strength === 'Moderate') {
      relationBadge.classList.add('tag-fy24');
    } else {
      relationBadge.classList.add('badge-blue');
    }

    let commentary = `<strong>Analytical Summary:</strong> A Pearson Correlation Coefficient of <strong>${r.toFixed(3)}</strong> indicates a <strong>${strength.toLowerCase()} ${dir.toLowerCase()} correlation</strong> between <em>${xLabel}</em> (X) and <em>${yLabel}</em> (Y). `;
    commentary += `The regression model explains <strong>${(r2 * 100).toFixed(1)}%</strong> of the variation in the dependent variable ($R^2 = ${r2.toFixed(3)}$). `;
    
    if (absR >= 0.6) {
      if (r > 0) {
        commentary += `This shows a strong direct progression: increases in ${xLabel} are highly associated with increases in ${yLabel}.`;
      } else {
        commentary += `This indicates a strong inverse relationship: expansions in ${xLabel} are statistically accompanied by declines in ${yLabel}, suggesting operational efficiency savings.`;
      }
    } else {
      commentary += `The historical timeline shows a weak linear relationship between these variables, which suggests that other confounding factors (such as funding changes, administrative decisions, or major disruptions like COVID-19) are the main drivers of the trend.`;
    }
    commentaryBox.innerHTML = commentary;

    // Trigger Chart factory
    IRCharts.buildRegressionScatterChart('chart-regression-scatter', xLabel, yLabel, alignedPoints, regressionPoints);
  }

  // Run the What-If simulation mathematical calculations
  async function runSimulationCalculations() {
    if (backendAvailable) {
      try {
        const gdp = document.getElementById('slider-gdp').value;
        const vb = document.getElementById('slider-vb').value;
        const safety = document.getElementById('slider-safety').value;
        const freight = document.getElementById('slider-freight').value;
        const res = await fetch(`/api/simulate?gdpElasticity=${gdp}&vandeBharatCount=${vb}&safetyMultiplier=${safety}&freightRate=${freight}`);
        if (res.ok) {
          return await res.json();
        } else {
          throw new Error('API response not OK');
        }
      } catch (e) {
        console.log('Simulation API failed, falling back to local JS:', e);
        backendAvailable = false;
        updateBackendPill(false);
      }
    }

    const d = IRData;
    const gdpSlider = Number(document.getElementById('slider-gdp').value);
    const passGrowthRate = 0.065 * gdpSlider;
    
    // 1. Simulate passengers
    const simPassengers = [];
    let lastPass = d.passengers.total[15]; // FY24 passengers
    for (let i = 0; i < 5; i++) {
      lastPass = Math.round(lastPass * (1 + passGrowthRate));
      simPassengers.push(lastPass);
    }

    // 2. Simulate revenues
    let lastPassRev = d.revenue.passenger[15];
    let lastFreightRev = d.revenue.freight[15];
    let lastOtherRev = d.revenue.other[15];
    const simRevenue = [];
    const freightRate = Number(document.getElementById('slider-freight').value) / 100;
    const vbSlider = Number(document.getElementById('slider-vb').value);
    
    for (let i = 0; i < 5; i++) {
      const passRatio = simPassengers[i] / (i === 0 ? d.passengers.total[15] : simPassengers[i-1]);
      lastPassRev = lastPassRev * passRatio * (1 + 0.0002 * vbSlider) * 1.04;
      lastFreightRev = lastFreightRev * (1 + freightRate) * 1.05;
      lastOtherRev = lastOtherRev * 1.05;
      
      simRevenue.push(Math.round(lastPassRev + lastFreightRev + lastOtherRev));
    }

    // 3. Simulate accidents
    const safetySlider = Number(document.getElementById('slider-safety').value);
    const simAccidents = [];
    let lastAcc = d.accidents.total[15]; // FY24 accidents
    for (let i = 0; i < 5; i++) {
      const decay = 1 - 0.18 * safetySlider + 0.0013 * vbSlider;
      lastAcc = Math.max(2, Math.round(lastAcc * decay));
      simAccidents.push(lastAcc);
    }

    return {
      passengers: simPassengers,
      revenue: simRevenue,
      accidents: simAccidents
    };
  }

  // Update Simulator UI and rebuild chart overlay
  async function updateSimulation() {
    const d = IRData;
    const sim = await runSimulationCalculations();

    const formatValue = (v, unit='') => Number(v).toLocaleString('en-IN') + unit;
    
    document.getElementById('sim-kpi-passengers').textContent = formatValue(sim.passengers[4], 'M');
    document.getElementById('sim-kpi-revenue').textContent = '₹' + formatValue(Math.round(sim.revenue[4] / 1000), 'K Cr');
    document.getElementById('sim-kpi-accidents').textContent = sim.accidents[4];

    let histData, baselineData, simulatedData, label, color;
    
    if (sandboxState.simMetric === 'passengers') {
      histData = d.passengers.total;
      baselineData = d.forecast.passengers;
      simulatedData = sim.passengers;
      label = 'Passengers (M)';
      color = '#2563d4';
    } else if (sandboxState.simMetric === 'revenue') {
      histData = d.revenue.total.map(v => v / 1000);
      baselineData = d.forecast.revenue.map(v => v / 1000);
      simulatedData = sim.revenue.map(v => v / 1000);
      label = 'Revenue (₹K Cr)';
      color = '#f39c12';
    } else if (sandboxState.simMetric === 'accidents') {
      histData = d.accidents.total;
      baselineData = d.forecast.accidents;
      simulatedData = sim.accidents;
      label = 'Accidents';
      color = '#e74c3c';
    }

    IRCharts.buildSimulationChart('chart-sandbox-simulator', d.years, histData, d.forecast.years, baselineData, simulatedData, label, color);
  }

  // CSV Trigger Download Helper
  function triggerCSVDownload(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export full historical dataset
  function downloadFullDatasetCSV() {
    const d = IRData;
    let csv = 'Year,Fiscal Year,Passengers Originating (M),Passenger-KM (B),Passenger Revenue (₹ Cr),Freight Revenue (₹ Cr),Other Revenue (₹ Cr),Total Revenue (₹ Cr),Operating Ratio (%),Freight Loading (MT),Net Tonne-KM (B),Total Accidents,Derailments,Casualties,Punctuality (%),Cancellations,Avg Delay (min),Route KM,Electrified KM,Stations,Level Crossings,Locomotives,Coaches,Wagons,Employees\n';
    
    for (let i = 0; i < d.years.length; i++) {
      const s = d.getYearSnapshot(i);
      csv += [
        d.years[i],
        s.fy,
        s.passengers,
        s.passengerKm,
        s.passRevenue,
        s.freightRevenue,
        s.otherRevenue,
        s.totalRevenue,
        s.operatingRatio,
        s.freight,
        s.freightNTK,
        s.accidents,
        s.derailments,
        s.casualties,
        s.punctuality,
        s.cancellations,
        s.avgDelay,
        s.routeKm,
        s.electrifiedKm,
        s.stations,
        s.levelCrossings,
        s.locomotives,
        s.coaches,
        s.wagons,
        s.employees
      ].join(',') + '\n';
    }
    triggerCSVDownload(csv, 'indian_railways_historical_dataset.csv');
  }

  // Export current What-If simulation numbers
  async function downloadSimulationCSV() {
    const d = IRData;
    const sim = await runSimulationCalculations();
    let csv = 'Year,Baseline Passengers (M),Simulated Passengers (M),Baseline Revenue (₹ Cr),Simulated Revenue (₹ Cr),Baseline Accidents,Simulated Accidents\n';
    
    for (let i = 0; i < d.forecast.years.length; i++) {
      csv += [
        `FY${d.forecast.years[i]}`,
        d.forecast.passengers[i],
        sim.passengers[i],
        d.forecast.revenue[i],
        sim.revenue[i],
        d.forecast.accidents[i],
        sim.accidents[i]
      ].join(',') + '\n';
    }
    triggerCSVDownload(csv, 'indian_railways_simulated_projections.csv');
  }

  // Export zone performance metrics
  function downloadZoneCSV() {
    const zones = Object.entries(IRData.zoneData).sort((a, b) => b[1].revenue - a[1].revenue);
    let csv = 'Rank,Zone,Revenue (₹ Cr),Passengers (M),Freight (MT),Route KM,Punctuality (%),Accidents\n';
    
    zones.forEach(([zone, d], i) => {
      csv += [
        i + 1,
        zone,
        d.revenue,
        d.passengers,
        d.freight,
        d.routeKm,
        d.punctuality,
        d.accidents
      ].join(',') + '\n';
    });
    triggerCSVDownload(csv, 'indian_railways_zone_performance.csv');
  }

  // ─── INIT ────────────────────────────────────────────────
  function init() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.page));
      el.addEventListener('keypress', e => { if (e.key==='Enter'||e.key===' ') el.click(); });
    });

    document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
    document.getElementById('reset-filters')?.addEventListener('click', resetFilters);
    ['filter-year','filter-zone','filter-train'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
    });

    // Bind CSV downloads
    document.getElementById('download-history-csv')?.addEventListener('click', downloadFullDatasetCSV);
    document.getElementById('download-zone-csv')?.addEventListener('click', downloadZoneCSV);

    renderExecutiveKPIs();
    initPageCharts('executive');
    state.chartsInitialized.executive = true;

    // Detect Python API backend availability
    checkBackend();
    setInterval(checkBackend, 5000);

    updateTime();
    setInterval(updateTime, 1000);
    setTimeout(() => {
      document.querySelectorAll('.kpi-value').forEach(el => {
        el.style.opacity='0'; el.style.transform='translateY(8px)';
        setTimeout(() => { el.style.transition='all 0.5s cubic-bezier(0.4,0,0.2,1)'; el.style.opacity='1'; el.style.transform='translateY(0)'; }, 100+Math.random()*300);
      });
    }, 300);
  }

  return { init, navigate, renderAIInsights, renderForecastTable };
})();

document.addEventListener('DOMContentLoaded', App.init);
