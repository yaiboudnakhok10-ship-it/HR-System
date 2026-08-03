<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useWalkieAssetStore } from '@/stores/walkie_asset.store'
import { useWelfareRequestStore } from '@/stores/welfare_request.store'
import Chart from 'chart.js/auto'

const assetStore = useWalkieAssetStore()
const welfareStore = useWelfareRequestStore()

const loading = ref(true)
const trendChartRef = ref(null)
const pieChartRef = ref(null)
let trendChart = null
let pieChart = null

// ── Date Filtering ────────────────────────────────────────
const selectedFilter = ref('all') // all, week, last_week, month, last_month, custom
const customStartDate = ref('')
const customEndDate = ref('')

const filterOptions = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'สัปดาห์นี้', value: 'week' },
  { label: 'สัปดาห์ก่อน', value: 'last_week' },
  { label: 'เดือนนี้', value: 'month' },
  { label: 'เดือนก่อน', value: 'last_month' },
  { label: 'กำหนดเอง', value: 'custom' },
]

const filteredData = computed(() => {
  const assets = assetStore.requests || []
  const welfares = welfareStore.requests || []
  
  const now = new Date()
  let start = null
  let end = null

  if (selectedFilter.value === 'week') {
    const day = now.getDay()
    start = new Date(now)
    start.setDate(now.getDate() - day)
    start.setHours(0,0,0,0)
  } else if (selectedFilter.value === 'last_week') {
    const day = now.getDay()
    start = new Date(now)
    start.setDate(now.getDate() - day - 7)
    start.setHours(0,0,0,0)
    end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23,59,59,999)
  } else if (selectedFilter.value === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (selectedFilter.value === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    end = new Date(now.getFullYear(), now.getMonth(), 0)
  } else if (selectedFilter.value === 'custom') {
    if (customStartDate.value) start = new Date(customStartDate.value)
    if (customEndDate.value) end = new Date(customEndDate.value)
  }

  const filterFn = (r) => {
    if (!start && !end) return true
    const d = new Date(r.item_date)
    if (start && d < start) return false
    if (end && d > end) return false
    return true
  }

  return {
    assets: assets.filter(filterFn),
    welfares: welfares.filter(filterFn)
  }
})

// ── Drill-down Detail Modal ──
const showModal = ref(false)
const selectedEmployee = ref(null)
const employeeHistory = ref([])

function openDetail(employeeName) {
  const assets = filteredData.value.assets
  const welfares = filteredData.value.welfares
  
  const history = []
  
  // Collect Assets
  assets.forEach(r => {
    const name = `${r.title || ''}${r.first_name} ${r.last_name}`.trim()
    if (name === employeeName) {
      history.push({
        type: 'ทรัพย์สินบริษัท',
        topic: 'เบิกทรัพย์สิน',
        item: r.asset_name || r.component || '-',
        date: r.item_date,
        image: r.image_url,
        name: name
      })
    }
  })
  
  // Collect Welfares
  welfares.forEach(r => {
    const name = `${r.title || ''}${r.first_name} ${r.last_name}`.trim()
    if (name === employeeName) {
      history.push({
        type: 'สวัสดิการ',
        topic: r.welfare_type || 'สวัสดิการ',
        item: r.welfare_item || '-',
        date: r.item_date,
        image: r.image_url,
        name: name
      })
    }
  })

  employeeHistory.value = history.sort((a, b) => new Date(b.date) - new Date(a.date))
  selectedEmployee.value = employeeName
  showModal.value = true
}

// ── Lifecycle ─────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([
    assetStore.fetchRequests(),
    welfareStore.fetchRequests()
  ])
  loading.value = false
  
  nextTick(() => {
    initCharts()
  })
})

// ── Computed Stats ────────────────────────────────────────
const today = new Date().toISOString().split('T')[0]

const stats = computed(() => {
  const assets = filteredData.value.assets
  const welfares = filteredData.value.welfares

  const assetsToday = assets.filter(r => r.item_date === today).length
  const welfareToday = welfares.filter(r => r.item_date === today).length
  
  const totalAssetAmount = assets.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const totalWelfareAmount = welfares.reduce((sum, r) => sum + Number(r.amount || 0), 0)

  // Frequency of Requesters (Unified)
  const frequencyMap = {}
  
  assets.forEach(r => {
    const name = `${r.title || ''}${r.first_name} ${r.last_name}`.trim()
    if (!frequencyMap[name]) frequencyMap[name] = { name, assetCount: 0, welfareCount: 0, total: 0 }
    frequencyMap[name].assetCount++
    frequencyMap[name].total++
  })

  welfares.forEach(r => {
    const name = `${r.title || ''}${r.first_name} ${r.last_name}`.trim()
    if (!frequencyMap[name]) frequencyMap[name] = { name, assetCount: 0, welfareCount: 0, total: 0 }
    frequencyMap[name].welfareCount++
    frequencyMap[name].total++
  })

  const topRequesters = Object.values(frequencyMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  return {
    assetsToday,
    welfareToday,
    assetsTotal: assets.length,
    welfareTotal: welfares.length,
    totalAssetAmount,
    totalWelfareAmount,
    topRequesters
  }
})

// ── Chart Logic ───────────────────────────────────────────
function initCharts() {
  if (trendChart) trendChart.destroy()
  if (pieChart) pieChart.destroy()

  const assets = filteredData.value.assets
  const welfares = filteredData.value.welfares

  // Trend Data (Last 7 days)
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7Days.push(d.toISOString().split('T')[0])
  }

  const assetTrend = last7Days.map(date => assets.filter(r => r.item_date === date).length)
  const welfareTrend = last7Days.map(date => welfares.filter(r => r.item_date === date).length)

  // 1. Line Chart: Trends
  const ctxTrend = trendChartRef.value.getContext('2d')
  trendChart = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: last7Days.map(d => formatDateLabel(d)),
      datasets: [
        {
          label: 'เบิกทรัพย์สิน',
          data: assetTrend,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'เบิกสวัสดิการ',
          data: welfareTrend,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  })

  // 2. Pie Chart: Total Distribution
  const ctxPie = pieChartRef.value.getContext('2d')
  pieChart = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: ['เบิกทรัพย์สิน', 'เบิกสวัสดิการ'],
      datasets: [{
        data: [assets.length, welfares.length],
        backgroundColor: ['#0ea5e9', '#10b981'],
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  })
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

// Set global Chart.js defaults for Thai fonts
if (typeof window !== 'undefined' && window.Chart) {
  window.Chart.defaults.font.family = "'Sarabun', 'Noto Sans Thai', sans-serif";
}

// Watch for store or filter changes to update charts
watch(() => [assetStore.requests, welfareStore.requests, selectedFilter.value, customStartDate.value, customEndDate.value], () => {
  if (!loading.value) {
    nextTick(() => initCharts())
  }
}, { deep: true })
</script>

<template>
  <div class="dashboard-container">
    <div class="header-section">
      <div class="header-content">
        <h1><i class="fas fa-chart-pie"></i> ระบบวิเคราะห์ข้อมูล (Dashboard)</h1>
        <p>สรุปภาพรวมการเบิกทรัพย์สินและสวัสดิการพนักงาน</p>
      </div>
      <div class="header-actions">
        <!-- Date Filters -->
        <div class="filter-wrapper">
          <div class="filter-group">
            <button 
              v-for="opt in filterOptions" 
              :key="opt.value"
              class="filter-btn"
              :class="{ active: selectedFilter === opt.value }"
              @click="selectedFilter = opt.value"
            >
              <i v-if="opt.value === 'custom'" class="far fa-calendar-alt"></i>
              {{ opt.label }}
            </button>
          </div>
          
          <!-- Custom Date Picker -->
          <div v-if="selectedFilter === 'custom'" class="custom-date-inputs animate-in">
            <input type="date" v-model="customStartDate" class="date-input">
            <span class="date-sep">ถึง</span>
            <input type="date" v-model="customEndDate" class="date-input">
          </div>
        </div>

        <button class="btn-refresh" @click="onMounted" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i> รีเฟรชข้อมูล
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <!-- Card 1: Assets Today -->
      <div class="kpi-card asset-today">
        <div class="kpi-icon"><i class="fas fa-boxes"></i></div>
        <div class="kpi-info">
          <span class="kpi-label">เบิกทรัพย์สิน (วันนี้)</span>
          <h2 class="kpi-value">{{ stats.assetsToday }}</h2>
          <span class="kpi-sub">รายการ</span>
        </div>
      </div>

      <!-- Card 2: Welfare Today -->
      <div class="kpi-card welfare-today">
        <div class="kpi-icon"><i class="fas fa-hand-holding-heart"></i></div>
        <div class="kpi-info">
          <span class="kpi-label">เบิกสวัสดิการ (วันนี้)</span>
          <h2 class="kpi-value">{{ stats.welfareToday }}</h2>
          <span class="kpi-sub">รายการ</span>
        </div>
      </div>

      <!-- Card 3: Total Assets -->
      <div class="kpi-card asset-total">
        <div class="kpi-icon"><i class="fas fa-clipboard-check"></i></div>
        <div class="kpi-info">
          <span class="kpi-label">ทรัพย์สินทั้งหมด</span>
          <h2 class="kpi-value">{{ stats.assetsTotal }}</h2>
          <span class="kpi-sub">{{ stats.totalAssetAmount.toLocaleString() }} บาท</span>
        </div>
      </div>

      <!-- Card 4: Total Welfare -->
      <div class="kpi-card welfare-total">
        <div class="kpi-icon"><i class="fas fa-history"></i></div>
        <div class="kpi-info">
          <span class="kpi-label">สวัสดิการทั้งหมด</span>
          <h2 class="kpi-value">{{ stats.welfareTotal }}</h2>
          <span class="kpi-sub">{{ stats.totalWelfareAmount.toLocaleString() }} บาท</span>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-grid">
      <div class="chart-card main-chart">
        <div class="chart-header">
          <h3><i class="fas fa-chart-line"></i> แนวโน้มการทำรายการ (7 วันล่าสุด)</h3>
        </div>
        <div class="chart-body">
          <canvas ref="trendChartRef"></canvas>
        </div>
      </div>

      <div class="chart-card side-chart">
        <div class="chart-header">
          <h3><i class="fas fa-chart-pie"></i> สัดส่วนรายการ</h3>
        </div>
        <div class="chart-body">
          <canvas ref="pieChartRef"></canvas>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Frequency & Tables -->
    <div class="details-grid">
      <div class="table-card">
        <div class="table-header">
          <h3><i class="fas fa-users"></i> สรุปจำนวนการเบิกแยกตามพนักงาน</h3>
        </div>
        <div class="table-body">
          <table v-if="stats.topRequesters.length > 0">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>ชื่อ-นามสกุล</th>
                <th class="text-center">ทรัพย์สินบริษัท</th>
                <th class="text-center">สวัสดิการ</th>
                <th class="text-center">รวมทั้งหมด</th>
                <th class="text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(requester, idx) in stats.topRequesters" :key="idx">
                <td>{{ idx + 1 }}</td>
                <td><span class="requester-name">{{ requester.name }}</span></td>
                <td class="text-center"><span class="badge-asset">{{ requester.assetCount }}</span></td>
                <td class="text-center"><span class="badge-welfare">{{ requester.welfareCount }}</span></td>
                <td class="text-center"><strong>{{ requester.total }}</strong> ครั้ง</td>
                <td class="text-center">
                  <button class="btn-view-detail" @click="openDetail(requester.name)">
                    <i class="fas fa-eye"></i> ดูประวัติ
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">ไม่มีข้อมูลการเบิก</div>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-header">
          <h3><i class="fas fa-info-circle"></i> สรุปสถานะระบบ (KPI)</h3>
        </div>
        <div class="summary-body">
          <div class="kpi-item">
            <span class="kpi-item-label">เฉลี่ยการเบิกต่อวัน</span>
            <span class="kpi-item-value">{{ (stats.assetsTotal / 30).toFixed(2) }}</span>
          </div>
          <div class="kpi-item">
            <span class="kpi-item-label">มูลค่าทรัพย์สินเฉลี่ย</span>
            <span class="kpi-item-value">{{ stats.assetsTotal ? (stats.totalAssetAmount / stats.assetsTotal).toLocaleString() : 0 }} ฿</span>
          </div>
          <div class="kpi-item">
            <span class="kpi-item-label">อัตราส่วนสวัสดิการ</span>
            <span class="kpi-item-value text-green">{{ stats.welfareTotal ? ((stats.welfareTotal / (stats.assetsTotal + stats.welfareTotal)) * 100).toFixed(1) : 0 }}%</span>
          </div>
          <div class="system-status">
            <div class="status-dot"></div>
            <span>ระบบทำงานปกติ: เชื่อมต่อ Supabase สำเร็จ</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content animate-in">
        <div class="modal-header">
          <h3><i class="fas fa-history"></i> ประวัติการเบิก: {{ selectedEmployee }}</h3>
          <button class="btn-close" @click="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="table-responsive">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>รูปภาพ</th>
                  <th>ประเภทการเบิก</th>
                  <th>หัวข้อการขอเบิก</th>
                  <th>รายการขอเบิก</th>
                  <th>วันที่</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(h, i) in employeeHistory" :key="i">
                  <td>
                    <div class="history-img-wrap" v-if="h.image">
                      <img :src="h.image" alt="item">
                    </div>
                    <span v-else class="text-muted">ไม่มีรูป</span>
                  </td>
                  <td>
                    <span class="badge-category" :class="h.type === 'สวัสดิการ' ? 'welfare' : 'asset'">
                      {{ h.type }}
                    </span>
                  </td>
                  <td>
                    <span class="badge-type" :class="h.type === 'สวัสดิการ' ? 'welfare' : 'asset'">
                      {{ h.topic }}
                    </span>
                  </td>
                  <td>{{ h.item }}</td>
                  <td>{{ h.date || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@100..900&display=swap');

.dashboard-container {
  padding: 24px;
  background: #f1f5f9;
  min-height: 100vh;
  font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
}

/* Header */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.header-content h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}
.header-content p {
  color: #64748b;
  font-size: 14px;
}
.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

/* Date Filters Style */
.filter-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.filter-group {
  display: flex;
  background: white;
  padding: 4px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
}
.filter-btn {
  padding: 6px 16px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.filter-btn:hover {
  color: #1e293b;
  background: #f8fafc;
}
.filter-btn.active {
  background: #f0f9ff;
  color: #0ea5e9;
}

.custom-date-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.date-input {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: #1e293b;
  outline: none;
}
.date-input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1);
}
.date-sep {
  font-size: 12px;
  color: #64748b;
}

.btn-refresh {
  padding: 10px 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #1e293b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-refresh:hover:not(:disabled) {
  background: #f8fafc;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}
.kpi-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 16px;
  border-left: 5px solid #cbd5e1;
}
.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.kpi-info .kpi-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}
.kpi-info h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 2px 0;
}
.kpi-info .kpi-sub {
  font-size: 12px;
  color: #94a3b8;
}

.asset-today { border-left-color: #0ea5e9; }
.asset-today .kpi-icon { background: #e0f2fe; color: #0ea5e9; }
.welfare-today { border-left-color: #10b981; }
.welfare-today .kpi-icon { background: #dcfce7; color: #10b981; }
.asset-total { border-left-color: #8b5cf6; }
.asset-total .kpi-icon { background: #f3e8ff; color: #8b5cf6; }
.welfare-total { border-left-color: #f59e0b; }
.welfare-total .kpi-icon { background: #fef3c7; color: #f59e0b; }

/* Charts */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}
.chart-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}
.chart-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 16px;
}
.chart-body {
  height: 300px;
  position: relative;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}
.table-card, .summary-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}
.table-header h3, .summary-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
}
th {
  text-align: left;
  font-size: 13px;
  color: #64748b;
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}
td {
  padding: 12px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
}
.text-center { text-align: center; }
.requester-name { font-weight: 600; }

.badge-asset, .badge-welfare {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}
.badge-asset { background: #e0f2fe; color: #0369a1; }
.badge-welfare { background: #dcfce7; color: #15803d; }

.btn-view-detail {
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-view-detail:hover {
  background: #0ea5e9;
  color: white;
  border-color: #0ea5e9;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
  padding: 20px;
}
.modal-content {
  background: white;
  width: 100%;
  max-width: 900px;
  max-height: 85vh;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
.btn-close {
  background: none; border: none; font-size: 28px; color: #94a3b8; cursor: pointer;
}
.modal-body {
  padding: 24px;
  overflow-y: auto;
}
.history-img-wrap {
  width: 50px; height: 50px; border-radius: 8px; overflow: hidden; background: #f1f5f9;
}
.history-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.badge-type {
  padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;
}
.badge-type.asset { background: #e0f2fe; color: #0369a1; }
.badge-type.welfare { background: #dcfce7; color: #15803d; }

.badge-category {
  padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;
  text-transform: uppercase;
}
.badge-category.asset { border: 1px solid #0ea5e9; color: #0ea5e9; }
.badge-category.welfare { border: 1px solid #10b981; color: #10b981; }

.animate-in {
  animation: modalFadeIn 0.3s ease-out;
}
@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.frequency-bar-wrap {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}
.frequency-bar {
  height: 100%;
  background: #0ea5e9;
  border-radius: 4px;
}

.kpi-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px dashed #e2e8f0;
}
.kpi-item:last-child { border-bottom: none; }
.kpi-item-label { color: #64748b; font-size: 14px; }
.kpi-item-value { font-weight: 700; color: #1e293b; font-size: 16px; }
.text-green { color: #10b981; }

.system-status {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f0fdf4;
  border-radius: 8px;
  color: #15803d;
  font-size: 12px;
}
.status-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-style: italic;
}

@media (max-width: 1200px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-grid, .details-grid { grid-template-columns: 1fr; }
}
</style>
