<template>
  <div class="dash-wrap">

    <!-- HEADER -->
    <div class="dash-header">
      <div style="flex: 1;">
        <h2 class="dash-title">
          <i class="fas fa-chart-bar"></i> Dashboard ใบเตือนพนักงาน
        </h2>
        <p class="dash-sub">ข้อมูลของ Dashboard ทั้งหมด</p>
      </div>

      <!-- DATE FILTER -->
      <div class="date-filter-group">
        <div class="segmented">
          <button class="seg-btn" :class="{ active: dateFilterMode === 'all' }" @click="setDateFilter('all')">ทั้งหมด</button>
          <button class="seg-btn" :class="{ active: dateFilterMode === 'this_week' }" @click="setDateFilter('this_week')">สัปดาห์นี้</button>
          <button class="seg-btn" :class="{ active: dateFilterMode === 'last_week' }" @click="setDateFilter('last_week')">สัปดาห์ก่อน</button>
          <button class="seg-btn" :class="{ active: dateFilterMode === 'this_month' }" @click="setDateFilter('this_month')">เดือนนี้</button>
          <button class="seg-btn" :class="{ active: dateFilterMode === 'last_month' }" @click="setDateFilter('last_month')">เดือนก่อน</button>
          <button class="seg-btn" :class="{ active: dateFilterMode === 'custom' }" @click="setDateFilter('custom')">
            <i class="fas fa-calendar-alt"></i> กำหนดเอง
          </button>
        </div>
        <div v-if="dateFilterMode === 'custom'" class="custom-date-inputs">
          <input type="date" v-model="customStartDate" class="mode-select" />
          <span>-</span>
          <input type="date" v-model="customEndDate" class="mode-select" />
        </div>
        <button class="refresh-btn" @click="refreshData" title="รีเฟรชข้อมูล">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        </button>
      </div>

      <div class="update-time" style="width: 100%; justify-content: flex-end;">
        <i class="fas fa-clock"></i> อัปเดต: {{ updateTime }}
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="loading-box">
      <i class="fas fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...
    </div>

    <template v-else>
      <!-- STAT CARDS -->
      <div class="stat-grid">
        <div class="stat-card" style="--accent:#7c3aed">
          <div class="stat-accent"></div>
          <div class="stat-label">ใบเตือนค่าปับ ทั้งหมด</div>
          <div class="stat-val">{{ tableCountStats.disciplineTotal }}</div>
          <div class="stat-delta">{{ tableCountStats.disciplineTotal }} รายการ</div>
        </div>
        <div class="stat-card" style="--accent:#1D9E75">
          <div class="stat-accent"></div>
          <div class="stat-label">ใบเตือนวาจา+วินัย ทั้งหมด</div>
          <div class="stat-val">{{ tableCountStats.verbalTotal }}</div>
          <div class="stat-delta">{{ tableCountStats.verbalTotal }} รายการ</div>
        </div>
        <div class="stat-card" style="--accent:#378ADD">
          <div class="stat-accent"></div>
          <div class="stat-label">ใบเตือนวาจา+วินัย เดือนนี้</div>
          <div class="stat-val">{{ tableCountStats.verbalMonth }}</div>
          <div class="stat-delta">{{ tableCountStats.verbalMonth }} รายการ</div>
        </div>
        <div class="stat-card" style="--accent:#EF9F27">
          <div class="stat-accent"></div>
          <div class="stat-label">ใบเตือนค่าปับ เดือนนี้</div>
          <div class="stat-val">{{ tableCountStats.disciplineMonth }}</div>
          <div class="stat-delta">{{ tableCountStats.disciplineMonth }} รายการ</div>
        </div>
      </div>

      <!-- ROW 2: daily chart + donut -->
      <div class="chart-grid-2col">
        <div class="card">
          <div class="card-head">
            <div class="card-title">สถิติใบเตือนรายวันในเดือน (แนวโน้ม)</div>
            <div class="nav-row">
              <div class="segmented">
                <button class="seg-btn" :class="{ active: dailyMode === 'docs' }" @click="setDailyMode('docs')">ตามใบเตือน</button>
                <button class="seg-btn" :class="{ active: dailyMode === 'caseType' }" @click="setDailyMode('caseType')">ตามประเภทเหตุการณ์</button>
              </div>
              <button class="nav-btn" @click="changeMonth(-1)">◀</button>
              <span class="nav-label">{{ MONTHS_TH[currentMonth] }} {{ currentYear }}</span>
              <button class="nav-btn" @click="changeMonth(1)">▶</button>
            </div>
          </div>
          <div style="position:relative;width:100%;height:280px">
            <canvas ref="dailyCanvas"></canvas>
          </div>
          <div class="chart-note">💡 คลิกที่จุดข้อมูลเพื่อดูจำนวน</div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-title">สัดส่วนประเภทใบเตือน</div>
            <span class="card-sub">{{ MONTHS_TH[currentMonth] }} {{ currentYear }}</span>
          </div>
          <div style="position:relative;width:100%;height:180px">
            <canvas ref="donutCanvas"></canvas>
          </div>
          <div class="donut-legend">
            <div v-for="item in donutLegend" :key="item.key" class="donut-leg-row">
              <span class="leg-dot" :style="{background: item.color}"></span>
              <span class="donut-leg-label">{{ item.label }}</span>
              <span class="donut-leg-val">{{ item.count }} ({{ item.pct }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SUMMARY TABLE BY WARNING TYPE -->
      <div class="card" style="margin-bottom:14px;">
        <div class="card-head">
          <div class="card-title">สรุปจำนวนใบเตือนแต่ละประเภท (ของใครของมัน)</div>
          <span class="card-sub">จำนวนทั้งหมด</span>
        </div>
        <div class="summary-split">
          <div>
            <div class="subhead">จอดแซ / อื่นๆ (ประเภทเหตุการณ์)</div>
            <div class="table-wrap">
              <table class="small-table">
                <thead>
                  <tr>
                    <th>ชื่อ</th>
                    <th style="text-align:center">จำนวนทั้งหมด</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in caseTypeTotalRows" :key="r.key">
                    <td>{{ r.key }}</td>
                    <td style="text-align:center"><strong>{{ r.total }}</strong></td>
                  </tr>
                  <tr v-if="caseTypeTotalRows.length === 0">
                    <td colspan="2" style="text-align:center;color:#94a3b8;padding:12px;">ไม่มีข้อมูล</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div class="subhead">วาจา / วินัย (ประเภทเอกสาร)</div>
            <div class="table-wrap">
              <table class="small-table">
                <thead>
                  <tr>
                    <th>ชื่อ</th>
                    <th style="text-align:center">จำนวนทั้งหมด</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in docTypeTotalRows" :key="r.key">
                    <td>{{ r.label }}</td>
                    <td style="text-align:center"><strong>{{ r.total }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 3: monthly bar + employee table -->
      <div class="chart-grid-equal">
        <div class="card">
          <div class="card-head">
            <div class="card-title">ภาพรวมรายเดือน (คลิกที่แท่งเพื่อดูจำนวน)</div>
            <div class="nav-row">
              <select v-model="monthlyMode" class="mode-select">
                <option value="docs">ตามใบเตือน</option>
                <option value="caseType">ตามประเภทเหตุการณ์</option>
              </select>
              <button class="nav-btn" @click="changeYear(-1)">◀</button>
              <span class="nav-label">ปี {{ currentYear }}</span>
              <button class="nav-btn" @click="changeYear(1)">▶</button>
            </div>
          </div>
          <div style="position:relative;width:100%;height:260px">
            <canvas ref="monthlyCanvas"></canvas>
          </div>
          <div class="chart-note">💡 คลิกที่แท่งกราฟเพื่อดูจำนวนแยกประเภท</div>
        </div>

        <!-- ตารางพนักงาน + inline expand -->
        <div class="card" style="overflow:hidden;">
          <div class="card-head">
            <div class="card-title">จำนวนคนที่ได้รับใบเตือน (สูงสุด 10 คน)</div>
            <span class="card-sub">{{ filteredEmpList.length }} / {{ empList.length }} คน</span>
          </div>
          <div style="margin-bottom:10px;">
            <input
              v-model.trim="empSearchQuery"
              type="text"
              class="mode-select"
              placeholder="ค้นหา รหัส/ชื่อ/แผนก"
              style="width:100%;"
            />
          </div>
          <div class="table-wrap scrollable-table" style="max-height:320px;overflow-y:auto">
            <table>
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>แผนก</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="emp in topEmpList" :key="emp.code">
                  <!-- แถวพนักงาน -->
                  <tr
                    class="data-row"
                    :class="{ 'row-expanded': expandedCode === emp.code }"
                    @click="toggleExpand(emp.code)"
                    style="cursor:pointer;"
                  >
                    <td class="td-code">{{ emp.code }}</td>
                    <td class="td-name">{{ emp.name }}</td>
                    <td class="td-dept">{{ emp.dept }}</td>
                  </tr>
                  <!-- แถว inline expand -->
                  <tr v-if="expandedCode === emp.code" class="expand-row">
                    <td colspan="3" style="padding:0;">
                      <div class="expand-box">
                        <div class="expand-head">
                          <span class="expand-title">
                            <i class="fas fa-list-ul"></i>
                            ใบเตือนของ <strong>{{ emp.name }}</strong>
                          </span>
                          <button class="close-expand-btn" @click="expandedCode = null">✕</button>
                        </div>
                        <table class="inner-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>หัวข้อ/ประเภทเหตุการณ์</th>
                              <th style="text-align:center;">จำนวนใบเตือน</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(group, idx) in groupedItemsByType(emp.items)"
                              :key="emp.code + '-group-' + group.label + '-' + idx"
                              class="inner-row"
                            >
                              <td class="td-code">{{ idx + 1 }}</td>
                              <td>
                                <span class="src-pill" :style="group.fromCaseType ? { background:'#eef2ff', color:'#3730a3' } : { background:'#fef3c7', color:'#92400e' }">
                                  {{ group.label }}
                                </span>
                              </td>
                              <td style="text-align:center;font-weight:700;">{{ group.count }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </template>
                <tr v-if="topEmpList.length === 0">
                  <td colspan="3" style="text-align:center;color:#94a3b8;padding:20px;">ไม่มีข้อมูล</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="scroll-hint" v-if="filteredEmpList.length > 10">▼ เลื่อนดูเพิ่มเติม</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useDisciplineListStore }    from '../stores/cases.stores'
import { useVerbalWarningListStore } from '../stores/verbal_warning_list.store'
import Chart from 'chart.js/auto'

const disciplineStore = useDisciplineListStore()
const verbalStore     = useVerbalWarningListStore()

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

const PUNISH_LABELS = {
  verbal:   'ตักเตือนวาจา',
  written1: 'ตักเตือน ครั้งที่ 1',
  written2: 'ตักเตือน ครั้งที่ 2',
  written3: 'ตักเตือน ครั้งที่ 3',
  other:    'อื่นๆ',
}
const PUNISH_COLORS = {
  verbal:   '#1D9E75',
  written1: '#EF9F27',
  written2: '#E24B4A',
  written3: '#D85A30',
  other:    '#7F77DD',
}

const now           = new Date()
const currentMonth  = ref(now.getMonth())
const currentYear   = ref(now.getFullYear())
const updateTime    = ref('')
const expandedCode  = ref(null)
const empSearchQuery = ref('')
const downloadingId = ref(null)
const dailyMode     = ref('docs') // docs | caseType
const monthlyMode   = ref('docs') // docs | caseType

// --- Date Filter State ---
const dateFilterMode  = ref('all') // all | this_week | last_week | this_month | last_month | custom
const customStartDate = ref('')
const customEndDate   = ref('')

const dailyCanvas   = ref(null)
const donutCanvas   = ref(null)
const monthlyCanvas = ref(null)
let dailyChart, donutChart, monthlyChart
let monthlyRenderToken = 0

const loading = computed(() => disciplineStore.loading || verbalStore.loading)

// ─── formatDateDMY (เหมือน list tables) ──────────────────────────────────
function formatDateDMY(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d)) {
    const parts = String(val).split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return val
  }
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function parseDate(dateStr) {
  if (!dateStr) return null
  try {
    const d = new Date(String(dateStr).replace(/\+00.*$/, ''))
    return isNaN(d.getTime()) ? null : d
  } catch { return null }
}

function getStartOfWeek(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function getEndOfWeek(d) {
  const date = getStartOfWeek(d)
  date.setDate(date.getDate() + 6)
  date.setHours(23, 59, 59, 999)
  return date
}

const dateRange = computed(() => {
  const today = new Date()
  let start = null
  let end = null

  if (dateFilterMode.value === 'this_week') {
    start = getStartOfWeek(today)
    end = getEndOfWeek(today)
  } else if (dateFilterMode.value === 'last_week') {
    const lastWeek = new Date(today)
    lastWeek.setDate(today.getDate() - 7)
    start = getStartOfWeek(lastWeek)
    end = getEndOfWeek(lastWeek)
  } else if (dateFilterMode.value === 'this_month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1)
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
  } else if (dateFilterMode.value === 'last_month') {
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)
  } else if (dateFilterMode.value === 'custom') {
    if (customStartDate.value) start = new Date(customStartDate.value + 'T00:00:00')
    if (customEndDate.value) {
      end = new Date(customEndDate.value + 'T23:59:59')
    }
  }
  return { start, end }
})

function filterByDateRange(rows) {
  if (!rows) return []
  const { start, end } = dateRange.value
  if (!start && !end) return rows

  return rows.filter(r => {
    const d = parseDate(r.created_at || r.incident_date)
    if (!d) return false
    if (start && d < start) return false
    if (end && d > end) return false
    return true
  })
}

const filteredDisciplineCases = computed(() => filterByDateRange(disciplineStore.cases))
const filteredVerbalCases = computed(() => filterByDateRange(verbalStore.cases))

// ─── allData ──────────────────────────────────────────────────────────────
const allData = computed(() => {
  const normalized = []
  ;(filteredDisciplineCases.value || []).forEach(row => {
    const types = Array.isArray(row.punish_types) && row.punish_types.length ? row.punish_types : ['other']
    types.forEach(pt => normalized.push({ ...row, punish_type: pt, source: 'discipline_cases', date_field: row.created_at || row.incident_date }))
  })
  ;(filteredVerbalCases.value || []).forEach(row => {
    const types = []
    if (row.punish_verbal)   types.push('verbal')
    if (row.punish_written1) types.push('written1')
    if (row.punish_written2) types.push('written2')
    if (row.punish_written3) types.push('written3')
    if (row.punish_other)    types.push('other')
    const ft = types.length ? types : ['verbal']
    ft.forEach(pt => normalized.push({ ...row, punish_type: pt, source: 'verbal_warning_cases', date_field: row.created_at || row.incident_date }))
  })
  return normalized
})

// ข้อมูลฐาน (นับตาม "เอกสาร" จริง) — verbal_warning_cases 1 แถวอาจเป็นได้ 2 เอกสาร
const baseRows = computed(() => {
  const rows = []
  ;(filteredDisciplineCases.value || []).forEach(row => {
    rows.push({
      ...row,
      source: 'discipline_cases',
      source_table: 'discipline_cases',
      doc_kind: 'discipline', // ใบเตือนวินัย
      date_field: row.created_at || row.incident_date,
    })
  })
  ;(filteredVerbalCases.value || []).forEach(row => {
    const hasVerbal = !!row.punish_verbal
    const hasWritten = !!(row.punish_written1 || row.punish_written2 || row.punish_written3 || row.punish_other)

    // ใบเตือนวาจา (1 เอกสาร)
    if (hasVerbal) {
      rows.push({
        ...row,
        source: 'verbal_warning_cases',
        source_table: 'verbal_warning_cases',
        doc_kind: 'verbal',
        // ให้ PDF ใน dashboard สะท้อนเฉพาะใบวาจา
        punish_verbal: true,
        punish_written1: false,
        punish_written2: false,
        punish_written3: false,
        punish_other: false,
        date_field: row.created_at || row.incident_date,
      })
    }
    // ใบเตือนวินัย (1 เอกสาร) — อยู่ในตาราง verbal_warning_cases เช่นกัน
    if (hasWritten) {
      rows.push({
        ...row,
        source: 'verbal_warning_cases',
        source_table: 'verbal_warning_cases',
        doc_kind: 'discipline',
        // ให้ PDF ใน dashboard สะท้อนเฉพาะใบวินัย
        punish_verbal: false,
        punish_written1: !!row.punish_written1,
        punish_written2: !!row.punish_written2,
        punish_written3: !!row.punish_written3,
        punish_other: !!row.punish_other,
        date_field: row.created_at || row.incident_date,
      })
    }
  })
  return rows
})

function getMonthData(m, y) {
  return allData.value.filter(d => {
    const dt = parseDate(d.date_field)
    return dt && dt.getMonth() === m && dt.getFullYear() === y
  })
}
function getDaysInMonth(m, y) { return new Date(y, m + 1, 0).getDate() }

const isWrittenDoc = (row) => !!(row?.punish_written1 || row?.punish_written2 || row?.punish_written3 || row?.punish_other)
const isDisciplineOnlyDoc = (row) => !!(row?.punish_written1 || row?.punish_written2 || row?.punish_written3)
const isOtherDoc = (row) => !!row?.punish_other

const verbalTableStats = computed(() => {
  const all = filteredVerbalCases.value || []
  return {
    totalVerbal: all.filter(r => !!r.punish_verbal).length,
    totalDiscipline: all.filter(r => isDisciplineOnlyDoc(r)).length,
    totalOther: all.filter(r => isOtherDoc(r)).length,
    totalWritten: all.filter(r => isWrittenDoc(r)).length,
    totalAll: all.filter(r => !!r.punish_verbal).length + all.filter(r => isDisciplineOnlyDoc(r)).length + all.filter(r => isOtherDoc(r)).length,
  }
})

const tableCountStats = computed(() => {
  const disciplineRows = filteredDisciplineCases.value || []
  const verbalRows = filteredVerbalCases.value || []

  const inCurrentMonth = (row) => {
    const dt = parseDate(row.created_at || row.incident_date)
    return dt && dt.getMonth() === currentMonth.value && dt.getFullYear() === currentYear.value
  }

  return {
    disciplineTotal: disciplineRows.length,
    verbalTotal: verbalRows.length,
    disciplineMonth: disciplineRows.filter(inCurrentMonth).length,
    verbalMonth: verbalRows.filter(inCurrentMonth).length,
  }
})

const empMap = computed(() => {
  const map = {}
  baseRows.value.forEach(d => {
    const key = d.employee_code
    if (!key) return
    if (!map[key]) map[key] = { code: d.employee_code, name: d.employee_name, dept: d.position || d.department || '-', items: [] }
    map[key].items.push(d)
  })
  return map
})
const empList    = computed(() => Object.values(empMap.value).map(e => ({ ...e, count: e.items.length })).sort((a, b) => b.count - a.count))
const filteredEmpList = computed(() => {
  const q = (empSearchQuery.value || '').trim().toLowerCase()
  if (!q) return empList.value
  return empList.value.filter(e =>
    String(e.code || '').toLowerCase().includes(q) ||
    String(e.name || '').toLowerCase().includes(q) ||
    String(e.dept || '').toLowerCase().includes(q)
  )
})
const topEmpList = computed(() => filteredEmpList.value.slice(0, 10))

// ─── ตารางขวา: วาจา / วินัย (จำนวนทั้งหมดจาก verbal_warning_cases) ───────
const docTypeTotalRows = computed(() => ([
  { key: 'verbal', label: 'ใบเตือนวาจา', total: verbalTableStats.value.totalVerbal },
  { key: 'written', label: 'ใบเตือนวินัย', total: verbalTableStats.value.totalWritten },
]))

// ─── ตารางซ้าย: ประเภทเหตุการณ์ (จำนวนทั้งหมดจาก discipline_cases) ────────
const caseTypeTotalRows = computed(() => {
  const rows = filteredDisciplineCases.value || []
  const map = {}
  rows.forEach(d => {
    const k = (d.case_type && String(d.case_type).trim() !== '') ? String(d.case_type) : 'ไม่ระบุ'
    if (!map[k]) map[k] = { key: k, total: 0 }
    map[k].total++
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
})

function toggleExpand(code) { expandedCode.value = expandedCode.value === code ? null : code }

function groupedItemsByType(items = []) {
  const map = new Map()
  items.forEach((item) => {
    const hasCaseType = !!(item.case_type && String(item.case_type).trim() !== '')
    const label = hasCaseType
      ? String(item.case_type).trim()
      : (item.doc_kind === 'verbal' ? 'ใบเตือนวาจา' : 'ใบเตือนวินัย')
    if (!map.has(label)) map.set(label, { label, count: 0, fromCaseType: hasCaseType })
    map.get(label).count += 1
  })
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'th'))
}

const donutLegend = computed(() => {
  const md     = getMonthData(currentMonth.value, currentYear.value)
  const counts = { verbal: 0, written1: 0, written2: 0, written3: 0, other: 0 }
  md.forEach(d => { if (d.punish_type in counts) counts[d.punish_type]++; else counts.other++ })
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return Object.keys(counts).filter(k => counts[k] > 0).map(k => ({
    key: k, label: PUNISH_LABELS[k], color: PUNISH_COLORS[k], count: counts[k],
    pct: Math.round(counts[k] / total * 100),
  }))
})

function buildDailyChart() {
  if (!dailyCanvas.value) return
  if (dailyChart) dailyChart.destroy()

  const oldTip = document.getElementById('daily-custom-tip')
  if (oldTip) oldTip.remove()

  const chartColor = isDarkMode.value ? '#94a3b8' : '#64748b'
  const gridColor  = isDarkMode.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
  const strokeColor = isDarkMode.value ? '#1a1a1a' : '#ffffff'

  // Register custom plugin to draw data labels
  const dataLabelsPlugin = {
    id: 'customDataLabels',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx
      ctx.save()
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex)
        if (meta.hidden) return
        meta.data.forEach((datapoint, index) => {
          const val = dataset.data[index]
          if (!val || val === 0) return
          
          const x = datapoint.x
          const y = datapoint.y - 15
          const color = dataset.borderColor
          
          ctx.font = 'bold 12px Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.strokeStyle = strokeColor
          ctx.lineWidth = 3
          ctx.strokeText(val, x, y)
          ctx.fillStyle = color
          ctx.fillText(val, x, y)
        })
      })
      ctx.restore()
    }
  }

  Chart.register(dataLabelsPlugin)

  const days   = getDaysInMonth(currentMonth.value, currentYear.value)
  const labels = Array.from({ length: days }, (_, i) => `${i + 1}`)
  const datasets = []

  if (dailyMode.value === 'caseType') {
    const palette = ['#0ea5e9', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#eab308', '#14b8a6', '#6366f1', '#ec4899']
    const mdCase = (filteredDisciplineCases.value || []).filter(r => {
      const dt = parseDate(r.created_at || r.incident_date)
      return dt && dt.getMonth() === currentMonth.value && dt.getFullYear() === currentYear.value
    })
    const map = new Map()
    mdCase.forEach(r => {
      const dt = parseDate(r.created_at || r.incident_date); if (!dt) return
      const day = dt.getDate() - 1; if (day < 0 || day >= days) return
      const key = (r.case_type && String(r.case_type).trim() !== '') ? String(r.case_type) : 'ไม่ระบุ'
      if (!map.has(key)) map.set(key, Array.from({ length: days }, () => 0))
      map.get(key)[day]++
    })
    Array.from(map.keys()).forEach((k, idx) => {
      datasets.push({
        label: `เหตุการณ์: ${k}`,
        data: map.get(k),
        borderColor: palette[idx % palette.length],
        backgroundColor: 'transparent',
        tension: 0.4,
        fill: false,
        pointBackgroundColor: palette[idx % palette.length],
        pointBorderColor: strokeColor,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointHitRadius: 36,
        borderWidth: 2.2,
      })
    })
  } else {
    // นับจาก verbal_warning_cases ตารางเดียว ให้ตรงกับหน้า verbal_warningPage.vue
    const md = (filteredVerbalCases.value || []).filter(r => {
      const dt = parseDate(r.created_at || r.incident_date)
      return dt && dt.getMonth() === currentMonth.value && dt.getFullYear() === currentYear.value
    })
    const verbal = Array.from({ length: days }, () => 0)
    const disc = Array.from({ length: days }, () => 0)
    md.forEach(d => {
      const dt = parseDate(d.created_at || d.incident_date); if (!dt) return
      const day = dt.getDate() - 1; if (day < 0 || day >= days) return
      if (d.punish_verbal) verbal[day]++
      if (isWrittenDoc(d)) disc[day]++
    })
    datasets.push(
      {
        label: 'ใบเตือนวาจา',
        data: verbal,
        borderColor: '#1D9E75',
        backgroundColor: 'transparent',
        tension: 0.4,
        fill: false,
        pointBackgroundColor: '#1D9E75',
        pointBorderColor: strokeColor,
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 7,
        pointHitRadius: 40,
        borderWidth: 2.2,
      },
      {
        label: 'ใบเตือนวินัย',
        data: disc,
        borderColor: '#378ADD',
        backgroundColor: 'transparent',
        tension: 0.4,
        fill: false,
        pointBackgroundColor: '#378ADD',
        pointBorderColor: strokeColor,
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 7,
        pointHitRadius: 40,
        borderWidth: 2.2,
      }
    )
  }

  dailyChart = new Chart(dailyCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { left: 12, right: 16 } },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 11 },
            usePointStyle: true,
            pointStyleWidth: 8,
            padding: 16,
            color: chartColor,
          },
        },
        tooltip: { enabled: false },
      },
      interaction: { mode: 'nearest', intersect: false, axis: 'x' },
      scales: {
        x: {
          title: {
            display: true,
            text: `วันที่ (${MONTHS_TH[currentMonth.value]} ${currentYear.value})`,
            font: { size: 10 },
            color: chartColor,
          },
          ticks: {
            font: { size: 8 },
            maxRotation: 0,
            color: chartColor,
            maxTicksLimit: 35,
            callback: (v, i) => `${i + 1}`,
          },
          grid: { color: gridColor },
          offset: false,
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { size: 10 }, color: chartColor },
          grid: { color: gridColor },
          title: {
            display: true,
            text: 'จำนวน (ครั้ง)',
            font: { size: 10 },
            color: chartColor,
          },
        },
      },
    },
  })
}

function setDailyMode(mode) {
  dailyMode.value = mode
  buildDailyChart()
}

function buildDonutChart() {
  if (!donutCanvas.value) return
  if (donutChart) donutChart.destroy()
  const md     = getMonthData(currentMonth.value, currentYear.value)
  const counts = { verbal: 0, written1: 0, written2: 0, written3: 0, other: 0 }
  md.forEach(d => { if (d.punish_type in counts) counts[d.punish_type]++; else counts.other++ })
  const keys  = Object.keys(counts).filter(k => counts[k] > 0)
  const total = keys.reduce((a, k) => a + counts[k], 0) || 1
  donutChart = new Chart(donutCanvas.value, {
    type: 'doughnut',
    data: {
      labels: keys.map(k => PUNISH_LABELS[k]),
      datasets: [{ data: keys.map(k => counts[k]), backgroundColor: keys.map(k => PUNISH_COLORS[k]), borderWidth: 0, hoverOffset: 4 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} (${Math.round(ctx.raw/total*100)}%)` } }
      },
    },
  })
}

function buildMonthlyChart() {
  if (!monthlyCanvas.value) return
  monthlyRenderToken += 1
  const renderToken = monthlyRenderToken
  if (monthlyChart) {
    monthlyChart.destroy()
    monthlyChart = null
  }
  // กันกรณีมี chart ค้างบน canvas เดิม
  const existing = Chart.getChart(monthlyCanvas.value)
  if (existing) existing.destroy()

  const chartColor = isDarkMode.value ? '#94a3b8' : '#64748b'
  const gridColor  = isDarkMode.value ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const datasets = []

  if (monthlyMode.value === 'caseType') {
    const palette = ['#0ea5e9', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#eab308', '#14b8a6', '#6366f1']
    const map = {}
    ;(filteredDisciplineCases.value || []).forEach(r => {
      const dt = parseDate(r.created_at || r.incident_date)
      if (!dt || dt.getFullYear() !== currentYear.value) return
      const k = (r.case_type && String(r.case_type).trim() !== '') ? String(r.case_type) : 'ไม่ระบุ'
      if (!map[k]) map[k] = Array.from({ length: 12 }, () => 0)
      map[k][dt.getMonth()]++
    })
    // จำกัดจำนวน series เพื่อไม่ให้กราฟหน่วงเวลา toggle
    const entries = Object.keys(map).map((k) => ({
      key: k,
      data: map[k],
      total: map[k].reduce((a, b) => a + b, 0),
    })).sort((a, b) => b.total - a.total)

    const topEntries = entries.slice(0, 8)
    const restEntries = entries.slice(8)

    topEntries.forEach((e, i) => {
      datasets.push({
        label: `เหตุการณ์: ${e.key}`,
        data: e.data,
        backgroundColor: palette[i % palette.length],
        borderRadius: 3,
      })
    })

    if (restEntries.length) {
      const other = Array.from({ length: 12 }, () => 0)
      restEntries.forEach(e => e.data.forEach((v, idx) => { other[idx] += v }))
      datasets.push({
        label: 'เหตุการณ์: อื่นๆ',
        data: other,
        backgroundColor: '#94a3b8',
        borderRadius: 3,
      })
    }
  } else {
    const verbal = Array.from({ length: 12 }, () => 0)
    const disc   = Array.from({ length: 12 }, () => 0)
    ;(filteredVerbalCases.value || []).forEach(r => {
      const dt = parseDate(r.created_at || r.incident_date)
      if (!dt || dt.getFullYear() !== currentYear.value) return
      const m = dt.getMonth()
      if (r.punish_verbal) verbal[m]++
      if (isWrittenDoc(r)) disc[m]++
    })
    datasets.push(
      { label: 'ใบเตือนวาจา',  data: verbal, backgroundColor: '#1D9E75', borderRadius: 3 },
      { label: 'ใบเตือนวินัย', data: disc,   backgroundColor: '#378ADD', borderRadius: 3 },
    )
  }

  const chartInstance = new Chart(monthlyCanvas.value, {
    type: 'bar',
    data: { labels: MONTHS_TH, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: chartColor, font: { size: 11 } }
        },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} ครั้ง` } }
      },
      scales: {
        x: { stacked: false, ticks: { font: { size: 10 }, color: chartColor }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { stepSize: 2, font: { size: 10 }, color: chartColor }, grid: { color: gridColor }, grace: '15%' },
      },
      animation: {
        onComplete: function () {
          if (renderToken !== monthlyRenderToken) return
          const chart = this
          if (!chart || !chart.ctx) return
          const ctx = chart.ctx; ctx.save()
          chart.data.datasets.forEach((dataset, di) => {
            const meta = chart.getDatasetMeta(di); if (meta.hidden) return
            meta.data.forEach((bar, i) => {
              const v = dataset.data[i]; if (!v) return
              ctx.fillStyle = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor
              ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
              ctx.fillText(v, bar.x, bar.y - 2)
            })
          })
          ctx.restore()
        },
      },
      onClick: (event, activeElements) => {
        if (!activeElements.length) return
        const { datasetIndex, index } = activeElements[0]
        const ds = chartInstance.data.datasets[datasetIndex]
        alert(`📊 ${ds.label}\n📅 ${MONTHS_TH[index]} ${currentYear.value}\n🔢 จำนวน: ${ds.data[index]} ครั้ง`)
      },
    },
  })
  monthlyChart = chartInstance
}

function buildAllCharts() { nextTick(() => { buildDailyChart(); buildDonutChart(); buildMonthlyChart() }) }

watch(loading, async (val) => {
  if (!val) {
    const now = new Date()
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const yyyy = now.getFullYear()
    const hh = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    updateTime.value = `${dd}/${mm}/${yyyy} ${hh}:${min} น.`
    await nextTick(); buildAllCharts()
  }
})

function setDateFilter(mode) {
  dateFilterMode.value = mode
}

function refreshData() {
  disciplineStore.fetchAll()
  verbalStore.fetchAll()
}

watch([filteredDisciplineCases, filteredVerbalCases], () => {
  buildAllCharts()
}, { deep: true })

watch(dailyMode, () => {
  buildDailyChart()
})

watch([() => currentYear.value, () => monthlyMode.value], async () => {
  await nextTick()
  buildMonthlyChart()
})

async function changeMonth(dir) {
  currentMonth.value += dir
  if (currentMonth.value < 0)  { currentMonth.value = 11; currentYear.value-- }
  if (currentMonth.value > 11) { currentMonth.value = 0;  currentYear.value++ }
  await nextTick(); buildDailyChart(); buildDonutChart()
}
function changeYear(dir) { currentYear.value += dir }

// ─── Utilities ────────────────────────────────────────────────────────────
const toBase64 = async (url) => {
  try {
    if (!url) return ''
    const res = await fetch(url); const blob = await res.blob()
    return new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob) })
  } catch { return '' }
}
const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
  const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s)
})

// ─── render iframe → canvas ───────────────────────────────────────────────
const renderPageToCanvas = (fullHtml, pageIndex) => new Promise((resolve, reject) => {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:0;left:-9999px;width:794px;height:1123px;border:none;visibility:hidden;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument; doc.open(); doc.write(fullHtml); doc.close()
  const tryCapture = async (attempt = 0) => {
    try {
      await new Promise(r => setTimeout(r, 900))
      const pages = doc.querySelectorAll('.page'); const target = pages[pageIndex] || doc.body
      const canvas = await window.html2canvas(target, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', width: 794, windowWidth: 794, scrollX: 0, scrollY: 0, logging: false })
      document.body.removeChild(iframe); resolve(canvas)
    } catch (err) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 500)); tryCapture(attempt + 1) }
      else { document.body.removeChild(iframe); reject(err) }
    }
  }
  iframe.onload = () => tryCapture()
})

// ════════════════════════════════════════════════════════════════════════════
// PDF: ใบวาจา — เหมือน verbal-list.vue เปะๆ
// ════════════════════════════════════════════════════════════════════════════
function getVerbalPrintHTML(c, logo1b64, logo2b64, hrImgB64) {
  const empName        = c.employee_name     || '_________________'
  const empCode        = c.employee_code     || '_________________'
  const empDept        = c.position          || '_________________'
  const empDamage      = c.subject           || ''
  const empDetail      = c.detail            || ''
  const empDate        = c.incident_date     ? formatDateDMY(c.incident_date) : '____/____/______'
  const empLocation    = c.incident_location || '_________________'
  const empWitness     = c.witness_name      || '_________________'
  const empWitnessCode = c.witness_code      || ''
  const damageVal      = c.damage_value      || ''

  const hasPersonal = !!(c.damage_personal)
  const hasAsset    = !!(c.damage_asset)
  const hasOther    = !!(c.damage_other)

  const hasViol     = !!(c.has_violation)
  const neverPunish = c.history_type === 'never'
  const hasPunish   = c.history_type !== 'never'
  const hrName      = c.hr_name          || '_________________'
  const hrResponsib = c.hr_responsibility || 'ພະຍານHR'

  const punish1     = !!(c.punish_verbal)
  const punish2     = !!(c.punish_written1)
  const punish3     = !!(c.punish_written2)
  const punish4     = !!(c.punish_written3)
  const punish5     = !!(c.punish_other)
  const punish5Text = c.punish_other_text || ''

  const witness1Name   = c.witness1_name   || '_________________'
  const witness1Detail = c.witness1_detail || ''
  const witness2Name   = c.witness2_name   || '_________________'
  const witness2Detail = c.witness2_detail || 'ຮັກສາການຜູ້ຈັດການສ່ວນບໍລິຫານຊັບພະຍາກອນບຸກຄົນ'

  const chk = (v) => v
    ? `<span style="width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px;">✓</span>`
    : `<span style="width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;"></span>`

  const logoHtml = `
    ${logo1b64 ? `<img src="${logo1b64}" style="height:22px;width:auto;object-fit:contain;">` : ''}
    ${logo2b64 ? `<img src="${logo2b64}" style="height:22px;width:auto;object-fit:contain;">` : ''}`

  const hrSigBox = `<span style="border-bottom:1px solid #888;display:inline-flex;align-items:center;justify-content:center;width:90px;min-height:48px;overflow:hidden;flex-shrink:0;">
    ${hrImgB64 ? `<img src="${hrImgB64}" style="width:88px;height:46px;object-fit:contain;object-position:center;display:block;">` : ''}
  </span>`

  const docSigBlock = (name, detail) => `
    <div style="margin-bottom:10px;">
      <div style="border-bottom:1px solid #888; display:inline-block; width:220px; min-height:40px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
        <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
      </div>
      <div style="font-size:10px; margin-top:4px;">(${name}) ${detail}</div>
    </div>`

  const punisherSigBlock = `
    <div style="margin-bottom:10px;">
      <div style="border-bottom:1px solid #888; display:inline-block; width:250px; min-height:40px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
        <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
      </div>
      <div style="font-size:10px; margin-top:4px;">(_________________) ຜູ້ມີອຳນາດຕັກເຕືອນ</div>
    </div>`

  const punish5Label = punish5
    ? `ອື່ນໆ (ເຊັນພະນັກງານ)&nbsp;<span style="display:inline-block;min-width:90px;border-bottom:1.5px solid #222;padding:0 4px;font-weight:700;">${punish5Text}</span>&nbsp;ເລີກຈ້າງ (HR/MD)`
    : `ອື່ນໆ (ເຊັນພະນักງານ)..............................................ເລີກຈ້າງ (HR/MD)`

  return `<!DOCTYPE html>
<html lang="lo"><head><meta charset="UTF-8"><title>ໜັງສືຕັກເຕືອນດ້ວຍວາຈາ</title>
${'<style>'}
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#fff;font-family:'Noto Sans Lao','Noto Sans Thai',sans-serif;font-size:11px;color:#000;line-height:1.6;}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;display:flex;flex-direction:column;}
  .page-inner{display:flex;flex-direction:column;padding:8mm 10mm;gap:0;}
  @media print{body{background:#fff;margin:0;padding:0;}.page{border:none;margin:0;}@page{size:A4;margin:0;}}
  .doc-header{border:1px solid #999;padding:5px 10px;margin-bottom:0;display:flex;align-items:center;}
  .doc-title{flex:1;text-align:center;font-size:13px;font-weight:700;}
  .doc-ref{font-size:10px;color:#444;white-space:nowrap;}
  .section-bar{background:#e0e0e0;border:1px solid #999;padding:3px 10px;font-weight:700;font-size:11px;flex-shrink:0;}
  .two-col-grid{display:grid;grid-template-columns:1fr 1px 1fr;}
  .col-left{padding:5px 10px;display:flex;flex-direction:column;}
  .col-divider{background:#999;}
  .col-right{padding:5px 10px;display:flex;flex-direction:column;}
  .field-row{display:flex;align-items:flex-start;margin-bottom:5px;}
  .inline-row{display:flex;align-items:flex-start;gap:0;margin-bottom:5px;}
  .fl{font-weight:600;white-space:nowrap;padding-top:1px;}
  .fl-w{min-width:105px;font-weight:600;white-space:nowrap;padding-top:1px;}
  .fl-sm{min-width:22px;font-weight:600;white-space:nowrap;padding-top:1px;}
  .fc{padding:0 3px;} .fv{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:2px;padding-top:1px;}
  .fv-md{width:90px;border-bottom:1px solid #888;min-height:16px;margin-right:8px;padding-bottom:2px;}
  .fve{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:2px;}
  .cb-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;}
  .bottom-section{border-top:1px solid #999;padding:5px 10px;flex-shrink:0;}
  .note-txt{font-size:9.5px;color:#444;font-style:italic;margin-bottom:3px;}
  .sign-row{display:flex;justify-content:space-between;gap:10px;}
  .sign-item{flex:1;text-align:center;font-size:10px;line-height:1.9;}
  .s2-header-wrap{display:flex;flex-shrink:0;}
  .s2-header-left{width:62%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;border-right:none;}
  .s2-header-right{width:38%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;}
  .s2-wrap{display:flex;}
  .s2-left{width:62%;padding:5px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;}
  .s2-right{width:38%;padding:5px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;}
  .s3-wrap{display:flex;}
  .s3-left{width:62%;padding:5px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;}
  .s3-right{width:38%;padding:5px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;}
  .item-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;line-height:1.5;font-size:10.5px;}
  .chk-lg{width:12px;height:12px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px;margin-top:1px;}
  .hr-thin{border:none;border-top:1px solid #aaa;margin:5px 0;}
  .sig-block{border:1px solid #999;border-top:none;flex-shrink:0;font-size:10.5px;line-height:2;padding:5px 10px;}
${'</style>'}</head><body>
<div class="page"><div class="page-inner">
  <div class="doc-header">
    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;margin-right:8px;">${logoHtml}</div>
    <div class="doc-title">ໜັງສືຕັກເຕືອນດ້ວຍວາຈາ</div>
    <div class="doc-ref">ເລກທີ: ………………………</div>
  </div>
  <div class="section-bar">ສ່ວນທີ 1 : ການລາຍງານຂໍ້ມູນຈິງ</div>
  <div style="border:1px solid #999;border-top:none;">
    <div class="two-col-grid">
      <div class="col-left">
        <div class="inline-row"><span class="fl">ຜູ້ກະທຳຄວາມຜິດ</span><span class="fc">:</span><span class="fv-md">${empName}</span><span class="fl-sm">ID</span><span class="fc">:</span><span class="fv">${empCode}</span></div>
        <div class="field-row"><span class="fl-w">ຕຳແໜ່ງ</span><span class="fc">:</span><span class="fv">${empDept}</span></div>
        <div class="field-row"><span class="fl-w">ວັນທີເກີດເຫດ</span><span class="fc">:</span><span class="fv">${empDate}</span></div>
        <div class="field-row"><span class="fl-w">ສະຖານທີ່ເກີດເຫດ</span><span class="fc">:</span><span class="fv">${empLocation}</span></div>
        <div class="inline-row"><span class="fl">ບຸກຄົນທີ່ຮູ້ເຫດການ</span><span class="fc">:</span><span class="fv-md">${empWitness}</span><span class="fl-sm">ID</span><span class="fc">:</span><span class="fve">${empWitnessCode}</span></div>
        <div class="field-row"><span class="fl-w">ລາຍງານເສຍຫາຍ</span><span class="fc">:</span><span class="fve">${damageVal}</span></div>
        <div style="margin-top:4px;">
          <div class="cb-row">${chk(hasPersonal)}<span style="font-size:10.5px;">ຕໍ່ບຸກຄົນ (ລະບຸຊື່ ແລະ ຜົນກະທົບທີ່ໄດ້ຮັບຈາກເຫດການ)</span></div>
          <div class="cb-row">${chk(hasAsset)}<span style="font-size:10.5px;">ຕໍ່ຊັບສິນ (ລະບຸລາຍການແລະມູນຄ່າຄວາມເສຍຫາຍ)</span></div>
          <div class="cb-row" style="margin-top:3px;">${chk(hasOther)}<span style="font-size:10.5px;">ອື່ນໆ ລະບຽບຂໍ້ບັງຄັບ ແລະ ກົດເກນບໍລິສັດ</span></div>
        </div>
      </div>
      <div class="col-divider"></div>
      <div class="col-right">
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:6px;">
          <span style="font-weight:600;font-size:11px;white-space:nowrap;">ເລື່ອງ:</span>
          <span style="font-size:11px;flex:1;border-bottom:1px solid #ddd;padding-bottom:2px;padding-left:3px;">${empDamage}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:4px;">
          <span style="font-weight:600;font-size:11px;white-space:nowrap;">ລາຍລະອຽດເຫດການ:</span>
          <span style="font-size:11px;flex:1;line-height:1.7;padding-left:3px;">${empDetail}</span>
        </div>
      </div>
    </div>
    <div class="bottom-section">
      <div class="note-txt">ຂ້າພະເຈົ້າຂໍຮັບຮອງວ່າຂໍ້ມູນຂ້າງເທິງເປັນຄວາມຈິງທູກປະການ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px 30px;margin-top:10px;">
        <div>${docSigBlock('_______________________', 'ຜູ້ສອບສວນ/ຜູ້ບັງຄັບບັນຊາ')}</div>
        <div>${docSigBlock(empName, 'ພະນັກງານທີ່ກະທຳຄວາມຜິດ')}</div>
      </div>
    </div>
  </div>
  <div class="s2-header-wrap">
    <div class="s2-header-left">ສ່ວນທີ 2 : ການພິຈาລະນາໂທດທາງວິໄນ (ຕົ້ນສັງກັດຫາລືຮ່ວມກັບຝ່າຍຊັບພະຍາກອນບຸກຄົນ)</div>
    <div class="s2-header-right">ປະຫວັດກະທຳຄວາມຜິດ ແລະ ຖືກລົງໂທด</div>
  </div>
  <div class="s2-wrap">
    <div class="s2-left">
      <div class="item-row">${chk(hasViol)}<span>ພະນັກງານຖຶກລົງໂທດທາງວິໄນ ເລື່ອງ ໝວດ 10 ວິໄນ ແລະ ບົດລົງໂທດທາງວິໄน ຂໍ້ 3 ວິໄນພະນັກງານ</span></div>
      <div class="item-row" style="padding-left:4px;"><span><strong>3.9.5</strong> ພະນັກງານຕ້ອງໃຊ້ ແລະ ບຳລຸງຮັກສາຊັບສິນຂອງບໍລິສັດ ໃຫ້ປຽບຄືດັ່ງຂອງຕົນເອງ ແລະ ຕ້ອງບຳລຸງຮັກສາຊັບສິນ</span></div>
      <div class="item-row" style="padding-left:4px;"><span><strong>3.9.3</strong> ພະນັກງານຕ້ອງລະວັງຊັບສິນຂອງບໍລິສັດ ບໍ່ໃຫ້ສູນຫາຍ ຫລື ຖືກທຳລາຍໄປ ແລະ ບໍ່ໃຫ້ເຊື່ອມຄ່າ ຫຼື ເສຍປະໂຫຍດ</span></div>
      <div style="font-size:9.5px;color:#333;padding-left:4px;">ຈຶ່ງແຈ້ງປະໂຫຍດດ້ວຍຕົນເອງ ແລະ ໃຫ້ທ່ານຮັບຊາບ ແລະ ຄຳນຶງດ້ວຍຕົວທ່ານເອງ</div>
    </div>
    <div class="s2-right">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;flex-wrap:wrap;">
        <span class="chk-lg">${neverPunish ? '✓' : ''}</span><span>ບໍ່ເຄີຍ</span>&nbsp;
        <span class="chk-lg">${hasPunish ? '✓' : ''}</span><span>ເຄີຍຖຶກໂທດທາງວິໄນ</span>
      </div>
      <hr class="hr-thin">
      <div style="font-size:10px;margin-top:4px;display:flex;align-items:flex-end;gap:6px;">
        <span style="white-space:nowrap;line-height:1;">ລົງຊື່ :</span>
        ${hrSigBox}
        <span style="font-size:9.5px;line-height:1;">(${hrName})</span>
      </div>
    </div>
  </div>
  <div class="section-bar">ສ່ວນທີ 3 ການລົງໂທດ (ພິຈາລະນາຮ່ວມກັບຝ່າຍບຸກຄົນ)</div>
  <div class="s3-wrap">
    <div class="s3-left">
      <div class="item-row"><span>ເຫັນສົມຄວນໃຫ້ລົງໂທດວິໄນ</span></div>
      <div class="item-row">${chk(punish1)}<span>ຕັກເຕືອນດ້ວຍວາຈາ</span></div>
      <div class="item-row">${chk(punish2)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 1)</span></div>
      <div class="item-row">${chk(punish3)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 2)</span></div>
      <div class="item-row">${chk(punish4)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 3) ແຈ້ງການລົງໂທດຄັ້ງຕໍ່ໄປ ຄື ພັກງານ ຫຼື ເລີກຈ້າງ</span></div>
      <div class="item-row">${chk(punish5)}<span>${punish5Label}</span></div>
    </div>
    <div class="s3-right" style="justify-content:center;align-items:center;text-align:center;">
      <div style="font-size:10px;line-height:1.8;">
        <div>ອຳນາດການລົງໂທດວິໄນຕາມຂໍ້ບັງຄັບ</div>
        <div>ກຳມะການຜູ້ຈັດການ ຫຼື ຜູ້ບັງຄັບບັນຊາ</div>
        <div>ແຕ່ละພะແນກເປັນຜູ້ໂທດ ຫຼື ຜູ້ມີອຳນາດ</div>
        <div>ກະທຳການແທນ ຫຼື ເປັນຜູ້ທີ່ໄດ້ຮັບການ</div>
        <div>ມອບໝາຍທາງບໍລິສັດ</div>
        <div style="margin-top:3px;color:#c00;font-weight:700;font-size:9.5px;">****ກໍລະນີເລີກຈ້າງສົ່ງຕໍ່ HR****</div>
      </div>
    </div>
  </div>
  <div class="sig-block">
    <div style="font-size:9.5px;color:#444;font-style:italic;margin-bottom:6px;">ບໍລິສັດ ຈຶ່ງຂໍໃຫ້ທ່ານປັບປຸງຕົວ ຫາກທ່ານກະທຳຄວາມຜິດຊ້ຳ ອາດຖືກລົງໂທດຮ້າຍແຮງຂຶ້ນ ຮອດຂັ້ນເລีກຈ้างໂດຍບໍ່ຈ່າຍຄ່າຊົດเชย</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px 30px;">
      <div>${punisherSigBlock}</div>
      <div>${docSigBlock(empName, 'ພະນັກງານ (ຜູ້ຖືກລົງໂທດ)')}</div>
      <div>${docSigBlock(witness1Name, witness1Detail)}</div>
      <div>
        <div style="margin-bottom:10px;">
          <div style="border-bottom:1px solid #888; display:inline-block; width:220px; min-height:40px; vertical-align:bottom; position:relative;">
            <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
            ${hrSigBox}
            <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
          </div>
          <div style="font-size:10px; margin-top:4px;">(${hrName}) ${hrResponsib}</div>
        </div>
      </div>
      <div>${docSigBlock(witness2Name, witness2Detail)}</div>
      <div></div>
    </div>
    <div style="font-size:8.5px;color:#444;font-style:italic;margin-top:6px;">( ຫາກທ່ານບໍ່ພໍໃຈການຕັກເຕືອນ/ລົງໂທດຕາມໜັງສືສະບັບນີ້ ທ່ານສາມາດຍື່ນເລື່ອງອຸທອນໄດ້ຕາມຂັ້ນຕອນໃນລະບົດບໍລິສັດ )</div>
  </div>
</div></div>
</body></html>`
}

// ════════════════════════════════════════════════════════════════════════════
// PDF: ใบวินัย 2 หน้า — เหมือน cases-list.vue เปะๆ
// ════════════════════════════════════════════════════════════════════════════
function getDisciplinePrintHTML(c, logo1b64, logo2b64, hrImgB64) {
  const empName        = c.employee_name     || ''
  const empCode        = c.employee_code     || ''
  const empDept        = c.position          || ''
  const empDamage      = c.subject           || ''
  const empDetail      = c.detail            || ''
  const empDate        = c.incident_date     ? formatDateDMY(c.incident_date) : ''
  const empLocation    = c.incident_location || ''
  const empWitness     = c.witness_name      || ''
  const empWitnessCode = c.witness_code      || ''
  const damageVal      = c.damage_value ? c.damage_value.toLocaleString() : ''
  const address        = c.address           || ''
  const caseTypeVal    = c.case_type         || ''

  const types      = c.damage_types || []
  const hasPersonal = types.includes('personal')
  const hasAsset    = types.includes('asset')
  const hasOther    = types.includes('other')

  const hasViol     = !!(c.has_violation)
  const neverPunish = c.history_type === 'never'
  const hasPunish   = c.history_type !== 'never'
  const hrName      = c.hr_name          || ''
  const hrResponsib = c.hr_responsibility || 'ພະຍານHR'

  const punishTypes  = c.punish_types || []
  const punish5Text  = c.punish_other_text || ''

  const witness1Name   = c.witness1_name   || ''
  const witness1Detail = c.witness1_detail || ''
  const witness2Name   = c.witness2_name   || ''
  const witness2Detail = c.witness2_detail || ''

  const totalKipNum = c.total_kip   ? Number(c.total_kip)   : 0
  const amtBahtNum  = c.amount_baht ? Number(c.amount_baht) : 0
  const amtKip      = totalKipNum > 0 ? totalKipNum.toLocaleString() : (c.damage_value?.toLocaleString() || '')
  const amtBaht     = amtBahtNum > 0  ? amtBahtNum.toLocaleString()  : ''
  const installment  = c.installments || ''
  const perInstall   = (c.installments && totalKipNum > 0) ? Math.round(totalKipNum / Number(c.installments)).toLocaleString() : ''
  const payDate      = c.pay_date ? formatDateDMY(c.pay_date) : ''

  const chairman  = c.commission_chairman      || ''
  const viceChair = c.commission_vice_chairman || ''
  const comm1     = c.commission_committee1    || ''
  const comm2     = c.commission_committee2    || ''
  const comm3     = c.commission_committee3    || ''
  const secretary = c.commission_secretary     || ''

  const kipLine1 = totalKipNum > 0 ? totalKipNum.toLocaleString() : ''

  const chk = (v) => v
    ? `<span style="width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px;">✓</span>`
    : `<span style="width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;"></span>`

  const logoHtml = `
    ${logo1b64 ? `<img src="${logo1b64}" style="height:22px;width:auto;object-fit:contain;">` : ''}
    ${logo2b64 ? `<img src="${logo2b64}" style="height:22px;width:auto;object-fit:contain;">` : ''}`

  const hrSigBox = `<span style="border-bottom:1px solid #888;display:inline-flex;align-items:center;justify-content:center;width:90px;min-height:48px;overflow:hidden;flex-shrink:0;">
    ${hrImgB64 ? `<img src="${hrImgB64}" style="width:88px;height:46px;object-fit:contain;object-position:center;display:block;">` : ''}
  </span>`

  const docSigBlock = (name, detail) => `
    <div style="margin-bottom:10px;">
      <div style="border-bottom:1px solid #888; display:inline-block; width:220px; min-height:40px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
        <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
      </div>
      <div style="font-size:10px; margin-top:4px;">(${name}) ${detail}</div>
    </div>`

  const punisherSigBlock = `
    <div style="margin-bottom:10px;">
      <div style="border-bottom:1px solid #888; display:inline-block; width:250px; min-height:40px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
        <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
      </div>
      <div style="font-size:10px; margin-top:4px;">(_________________) ຜູ້ມີອຳນາດຕັກເຕືອນ</div>
    </div>`

  const punish5Label = punishTypes.includes('other')
    ? `ອື່ນໆ (ເຊັນພະນັກງານ)&nbsp;<span style="display:inline-block;min-width:90px;border-bottom:1.5px solid #222;padding:0 4px;font-weight:700;">${punish5Text}</span>&nbsp;ເລີກຈ້າງ (HR/MD)`
    : `ອື່ນໆ (ເຊັນພະນັກງານ)..............................................ເລີກຈ้าง (HR/MD)`

  const assetSubRows = `
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;padding-left:16px;">
      <span style="min-width:12px;">1</span>
      <span style="flex:1;border-bottom:1px solid #888;min-height:15px;padding-left:4px;font-weight:700;">${kipLine1}</span>
      <span>ກີບ</span>
    </div>
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;padding-left:16px;">
      <span style="min-width:12px;">2</span>
      <span style="flex:1;border-bottom:1px solid #888;min-height:15px;"></span>
      <span>ກີບ</span>
    </div>`

  const css = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#fff;font-family:'Noto Sans Lao','Noto Sans Thai',Arial,sans-serif;font-size:11px;color:#000;line-height:1.6;}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;display:flex;flex-direction:column;}
  .page-inner{display:flex;flex-direction:column;padding:8mm 10mm;gap:0;}
  @media print{body{background:#fff;margin:0;padding:0;}.page{border:none;margin:0;page-break-after:always;}@page{size:A4;margin:0;}}
  .doc-header{border:1px solid #999;padding:5px 10px;margin-bottom:0;display:flex;align-items:center;}
  .doc-title{flex:1;text-align:center;font-size:13px;font-weight:700;}
  .doc-ref{font-size:10px;color:#444;white-space:nowrap;}
  .section-bar{background:#e0e0e0;border:1px solid #999;padding:3px 10px;font-weight:700;font-size:11px;flex-shrink:0;}
  .two-col-grid{display:grid;grid-template-columns:1fr 1px 1fr;}
  .col-left{padding:5px 10px;display:flex;flex-direction:column;}
  .col-divider{background:#999;}
  .col-right{padding:5px 10px;display:flex;flex-direction:column;}
  .field-row{display:flex;align-items:flex-start;margin-bottom:5px;}
  .inline-row{display:flex;align-items:flex-start;gap:0;margin-bottom:5px;}
  .fl{font-weight:600;white-space:nowrap;padding-top:1px;}
  .fl-w{min-width:105px;font-weight:600;white-space:nowrap;padding-top:1px;}
  .fl-sm{min-width:22px;font-weight:600;white-space:nowrap;padding-top:1px;}
  .fc{padding:0 3px;} .fv{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:2px;padding-top:1px;}
  .fv-md{width:90px;border-bottom:1px solid #888;min-height:16px;margin-right:8px;padding-bottom:2px;}
  .fve{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:2px;}
  .cb-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;}
  .bottom-section{border-top:1px solid #999;padding:5px 10px;flex-shrink:0;}
  .note-txt{font-size:9.5px;color:#444;font-style:italic;margin-bottom:3px;}
  .sign-row{display:flex;justify-content:space-between;gap:10px;}
  .sign-item{flex:1;text-align:center;font-size:10px;line-height:1.9;}
  .s2-header-wrap{display:flex;flex-shrink:0;}
  .s2-header-left{width:62%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;border-right:none;}
  .s2-header-right{width:38%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;}
  .s2-wrap{display:flex;}
  .s2-left{width:62%;padding:5px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;}
  .s2-right{width:38%;padding:5px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;}
  .s3-wrap{display:flex;}
  .s3-left{width:62%;padding:5px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;}
  .s3-right{width:38%;padding:5px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;}
  .item-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;line-height:1.5;font-size:10.5px;}
  .chk-lg{width:12px;height:12px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px;margin-top:1px;}
  .hr-thin{border:none;border-top:1px solid #aaa;margin:5px 0;}
  .sig-block{border:1px solid #999;border-top:none;flex-shrink:0;font-size:10.5px;line-height:2;padding:5px 10px;}
  .s4-body{display:grid;grid-template-columns:1fr 1px 1fr;border:1px solid #999;border-top:none;}
  .s4-left{padding:5px 10px;}
  .s4-div{background:#999;}
  .s4-right{padding:5px 10px;}
  .s5-body{border:1px solid #999;border-top:none;padding:7px 12px;}
  `

  const docHeader = `
  <div class="doc-header">
    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;margin-right:8px;">${logoHtml}</div>
    <div class="doc-title">ໜັງສືແຈ້ງໂທດທາງວິໄນ</div>
    <div class="doc-ref">ເລກທີ: ………………………</div>
  </div>`

  const committeeRows = [
    ['1.', chairman], ['2.', viceChair], ['3.', comm1],
    ['4.', comm2],    ['5.', comm3],     ['6.', secretary],
  ].map(([n, v]) => `
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px;font-size:10.5px;min-height:22px;">
      <span style="min-width:14px;font-weight:600;">${n}</span>
      <span style="border-bottom:1px solid #888;flex:1;min-height:15px;padding-bottom:1px;">${v}</span>
    </div>`).join('')

  const committeeRoles = [
    ['ປະທານຄະນະກຳມະການ',       '( ຜຈກ ຂອງພະນັກງານທີ່ກະທຳຜິດ)'],
    ['ຮອງປະທານຄະນະກຳມະການ',   '( ຜຈກ ໜ່ວຍງານອື່น)'],
    ['ເປັນກຳມະການ',             '( ຫໜ ຂອງພະນັກງານທີ່ກະທຳຜິດ)'],
    ['ເປັນກຳມະการ',             '( ຫໜ ໜ່ວຍງານອື່ນ)'],
    ['ເປັນກຳມະການ',             '( ຫໜ.ໜ່ວຍງານອື່ນ/ຜູ້ດູແລງານ)'],
    ['ກຳມະການເລຂານຸການ',       '( ສ່ວນຊັບພະຍາກອນບຸກຄົນ)'],
  ].map(([t, d]) => `
    <li style="display:flex;align-items:center;margin-bottom:8px;font-size:10.5px;min-height:22px;">
      <span style="min-width:150px;font-weight:600;white-space:nowrap;">${t}</span>
      <span style="color:#333;font-size:10px;">${d}</span>
    </li>`).join('')

  const page1 = `
<div class="page"><div class="page-inner">
  ${docHeader}
  <div class="section-bar">ສ່ວນທີ 1 : ການລາຍງານຂໍ້ມູນຈິງ</div>
  <div style="border:1px solid #999;border-top:none;">
    <div class="two-col-grid">
      <div class="col-left">
        <div class="inline-row"><span class="fl">ຜູ້ກະທຳຄວາມຜິດ</span><span class="fc">:</span><span class="fv-md">${empName}</span><span class="fl-sm">ID</span><span class="fc">:</span><span class="fv">${empCode}</span></div>
        <div class="field-row"><span class="fl-w">ຕຳແໜ່ງ</span><span class="fc">:</span><span class="fv">${empDept}</span></div>
        <div class="field-row"><span class="fl-w">ວັນທີເກີດເຫດ</span><span class="fc">:</span><span class="fv">${empDate}</span></div>
        <div class="field-row"><span class="fl-w">ສະຖານທີ່ເກີດເຫດ</span><span class="fc">:</span><span class="fv">${empLocation}</span></div>
        <div class="inline-row"><span class="fl">ບຸກຄົນທີ່ຮູ້ເຫດການ</span><span class="fc">:</span><span class="fv-md">${empWitness}</span><span class="fl-sm">ID</span><span class="fc">:</span><span class="fve">${empWitnessCode}</span></div>
        <div class="field-row"><span class="fl-w">ລາຍງານເສຍຫາຍ</span><span class="fc">:</span><span class="fve">${damageVal}</span></div>
        <div style="margin-top:4px;">
          <div class="cb-row">${chk(hasPersonal)}<span style="font-size:10.5px;">ຕໍ່ບຸກຄົນ (ລະບຸຊື່ ແລະ ຜົນກະທົບທີ່ໄດ້ຮັບຈາກເຫດການ)</span></div>
          <div class="cb-row">${chk(hasAsset)}<span style="font-size:10.5px;">ຕໍ່ຊັບສິນ (ລະບຸລາຍການແລະມູນຄ່າຄວາມເສຍຫາຍ)</span></div>
          ${assetSubRows}
          <div class="cb-row" style="margin-top:3px;">${chk(hasOther)}<span style="font-size:10.5px;">ອື່ນໆ ລະບຽບຂໍ້ບັງຄັບ ແລະ ກົດເກນບໍລິສັດ</span></div>
        </div>
      </div>
      <div class="col-divider"></div>
      <div class="col-right">
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:6px;">
          <span style="font-weight:600;font-size:11px;white-space:nowrap;">ເລື່ອງ:</span>
          <span style="font-size:11px;flex:1;border-bottom:1px solid #ddd;padding-bottom:2px;padding-left:3px;">${empDamage}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:4px;">
          <span style="font-weight:600;font-size:11px;white-space:nowrap;">ລາຍລະອຽดເຫດການ:</span>
          <span style="font-size:11px;flex:1;line-height:1.7;padding-left:3px;">${empDetail}</span>
        </div>
      </div>
    </div>
    <div class="bottom-section">
      <div class="note-txt">ຂ້າພະເຈົ້າຂໍຮັບຮອງວ່າຂໍ້ມູນຂ້າງເທິງເປັນຄວາມຈິງທູກປະການ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px 30px;margin-top:10px;">
        <div>${docSigBlock('______________________', 'ຜູ້ສອບສວນ/ຜູ້ບັງຄັບບັນຊາ')}</div>
        <div>${docSigBlock(empName, 'ພະນັກງານທີ່ກະທຳຄວາມຜິດ')}</div>
      </div>
    </div>
  </div>
  <div class="s2-header-wrap">
    <div class="s2-header-left">ສ່ວນທີ 2 : ການພິຈາລະນາໂທດທາງວິໄນ (ຕົ້ນສັງກັດຫາລືຮ່ວມກັບຝ່າຍຊับພະຍากອນບຸກຄົນ)</div>
    <div class="s2-header-right">ປະຫວັດກະທຳຄວາມຜິດ ແລະ ຖືກລົງໂທດ</div>
  </div>
  <div class="s2-wrap">
    <div class="s2-left">
      <div class="item-row">${chk(hasViol)}<span>ພະນັກງານຖຶກລົງໂທດທາງວິໄນ ເລື່ອງ ໝວດ 10 ວິໄນ ແລະ ບົດລົງໂທດທາງວິໄນ ຂໍ้ 3 ວິໄນພະນັກງານ</span></div>
      <div class="item-row" style="padding-left:4px;"><span><strong>3.9.5</strong> ພະນັກງານຕ້ອງໃຊ້ ແລະ ບຳລຸງຮັກສາຊັບສິນຂອງບໍລິສັດ ໃຫ້ປຽບຄືດັ່ງຂອງຕົນເອງ ແລະ ຕ້ອງບຳລຸງຮັກສາຊັບສິນ</span></div>
      <div class="item-row" style="padding-left:4px;"><span><strong>3.9.3</strong> ພະນັກງານຕ້ອງລະວັງຊັບສິນຂອງບໍລິສັດ ບໍ່ໃຫ້ສູນຫາຍ ຫລື ຖືກທຳลາຍໄປ ແລະ ບໍ່ໃຫ້ເຊື່ອມຄ່າ ຫຼື ເສຍປະໂຫຍດ</span></div>
      <div style="font-size:9.5px;color:#333;padding-left:4px;">ຈຶ່ງແຈ້ງປະໂຫຍດດ້ວຍຕົນເອງ ແລະ ໃຫ້ທ່ານຮັບຊາບ ແລະ ຄຳນຶງດ້ວຍຕົວທ່ານເອງ</div>
    </div>
    <div class="s2-right">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;flex-wrap:wrap;">
        <span class="chk-lg">${neverPunish ? '✓' : ''}</span><span>ບໍ່ເຄີຍ</span>&nbsp;
        <span class="chk-lg">${hasPunish ? '✓' : ''}</span><span>ເຄີຍຖຶກໂທດທາງວິໄນ</span>
      </div>
      <hr class="hr-thin">
      <div style="font-size:10px;margin-top:4px;display:flex;align-items:flex-end;gap:6px;">
        <span style="white-space:nowrap;line-height:1;">ລົງຊື່ :</span>
        ${hrSigBox}
        <span style="font-size:9.5px;line-height:1;">(${hrName})</span>
      </div>
    </div>
  </div>
  <div class="section-bar">ສ່ວນທີ 3 ການລົງໂທດ (ພິຈາລະນາຮ່ວມກັບຝ່າຍບຸກຄົນ)</div>
  <div class="s3-wrap">
    <div class="s3-left">
      <div class="item-row"><span>ເຫັນສົມຄວນໃຫ້ລົງໂທດວິໄນ</span></div>
      <div class="item-row">${chk(punishTypes.includes('verbal'))}<span>ຕັກເຕືອນດ້ວຍວາຈາ</span></div>
      <div class="item-row">${chk(punishTypes.includes('written1'))}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 1)</span></div>
      <div class="item-row">${chk(punishTypes.includes('written2'))}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 2)</span></div>
      <div class="item-row">${chk(punishTypes.includes('written3'))}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 3) ແຈ້ງການລົງໂທດຄັ້ງຕໍ່ໄປ ຄື ພັກງານ ຫຼື ເລີກຈ້າງ</span></div>
      <div class="item-row">${chk(punishTypes.includes('other'))}<span>${punish5Label}</span></div>
    </div>
    <div class="s3-right" style="justify-content:center;align-items:center;text-align:center;">
      <div style="font-size:10px;line-height:1.8;">
        <div>ອຳນາດການລົງໂທດວິໄນຕາມຂໍ້ບັງຄັບ</div>
        <div>ກຳມະການຜູ້ຈັດการ ຫຼື ຜູ້ບັງຄັບບັນຊາ</div>
        <div>ແຕ່ละພะແນກເປັນຜູ້ໂທດ ຫຼື ຜູ້ມີອຳນາດ</div>
        <div>ກະທຳການແທນ ຫຼື ເປັນຜູ້ທີ່ໄດ້ຮັບການ</div>
        <div>ມອບໝາຍທາງບໍລິສັດ</div>
        <div style="margin-top:3px;color:#c00;font-weight:700;font-size:9.5px;">****ກໍລະນີເລີກຈ้างສົ່ງຕໍ່ HR****</div>
      </div>
    </div>
  </div>
  <div class="sig-block">
    <div style="font-size:9.5px;color:#444;font-style:italic;margin-bottom:6px;">ບໍລິສັດ ຈຶ່ງຂໍໃຫ້ທ່ານປັບປຸງຕົວ ຫາກທ່ານກະທຳຄວາມຜິດຊ້ຳ ອາດຖືກລົງໂທດຮ້າຍແຮງຂຶ້ນ ຮອດຂັ້ນເລີກຈ້າງໂດຍບໍ່ຈ່າຍຄ່າຊົດເຊີຍ</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px 30px;">
      <div>${punisherSigBlock}</div>
      <div>${docSigBlock(empName, 'ພະນັກງານ')}</div>
      <div>${docSigBlock(witness1Name, witness1Detail)}</div>
      <div>
        <div style="margin-bottom:10px;">
          <div style="border-bottom:1px solid #888; display:inline-block; width:220px; min-height:40px; vertical-align:bottom; position:relative;">
            <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
            ${hrSigBox}
            <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
          </div>
          <div style="font-size:10px; margin-top:4px;">(${hrName}) ${hrResponsib}</div>
        </div>
      </div>
      <div>${docSigBlock(witness2Name, witness2Detail)}</div>
      <div></div>
    </div>
    <div style="font-size:8.5px;color:#444;font-style:italic;margin-top:6px;">( ຫາກທ່ານບໍ່ພໍใจການຕັກເຕືອນ/ລົງໂທດຕາມໜັງສືສະບັບນີ້ ທ່ານສາມາດຍື່ນເລື່ອງອຸທອນໄດ້ຕາມຂັ້ນຕອນໃນລະບົດບໍລິສັດ )</div>
  </div>
</div></div>`

  const page2 = `
<div class="page"><div class="page-inner">
  ${docHeader}
  <div class="section-bar">ສ່ວນທີ 4 ການແຕ່ງຕັ້ງຄະນະກຳມະການສອບສວນ ແລະ ພິຈາລະນາຄວາມຜິດ</div>
  <div style="font-size:10px;color:#444;font-style:italic;padding:4px 10px;border:1px solid #999;border-top:none;border-bottom:none;">
    &nbsp;&nbsp;&nbsp;&nbsp;ເພື່ອໃຫ້ການດຳເນີນການສອບສວນຫາຂໍ້ມູນຈິງສຳຫຼັບຄວາມຜິດທີ່ເກີດຂື້ນ ແລະການພິຈาລະນາໂທດທາງວິໄນເປັນໄປຢ່າງຖຶກຕ້ອງ
    <br> ແລະ ເກີດຕວາມຍຸດຕິທຳ ຈຶ່ງຂໍອະນຸຍາດແຕ່ງຕັ້ງຄະນະກຳມະການສອບສວນແລະພິຈาລະນາຄວາມຜິດ ດັ່ງນີ້:
  </div>
  <div class="s4-body">
    <div class="s4-left">${committeeRows}</div>
    <div class="s4-div"></div>
    <div class="s4-right"><ul style="list-style:none;padding:0;margin:0;">${committeeRoles}</ul></div>
  </div>
  <div style="display:flex;border:1px solid #999;border-top:none;">
    <div style="width:62%;padding:3px 8px;font-weight:700;font-size:10.5px;border-right:1px solid #999;">ຜູ້ສະເໜີ (ຜູ້ບັນຊາຕົ້ນສັງກັດ/ຝ່າຍຊັບພະຍາກອນບຸກຄົນ)</div>
    <div style="width:38%;padding:3px 8px;font-weight:700;font-size:10.5px;">ຜູ້ອະນຸມັດ (ກຳມະການຜູ້ຈັດການ)</div>
  </div>
  <div style="display:flex;border:1px solid #999;border-top:none;margin-bottom:0;">
    <div style="width:62%;padding:10px;border-right:1px solid #999;">
      <div style="border-bottom:1px solid #888; display:inline-block; width:220px; min-height:35px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
        <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
      </div>
    </div>
    <div style="width:38%;padding:10px;">
      <div style="border-bottom:1px solid #888; display:inline-block; width:180px; min-height:35px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
        <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
      </div>
    </div>
  </div>
  <div class="section-bar">ສ່ວນທີ 5 ຍິນຍອມຊົດໃຊ້ຄ່າເສຍຫາຍ (ກໍລະນີຊັບສິນຂອງບໍລິສັດເສຍຫາຍ)</div>
  <div class="s5-body">
    <div style="display:flex;justify-content:flex-end;gap:20px;margin-bottom:5px;">
      <div style="border-bottom:1px solid #888; display:inline-block; width:150px; min-height:20px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ທີ:</span>
      </div>
      <div style="border-bottom:1px solid #888; display:inline-block; width:150px; min-height:20px; vertical-align:bottom; position:relative;">
        <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ວັນທີ:</span>
      </div>
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      ຂ້າພະເຈົ້າ <span style="border-bottom:1px solid #888;display:inline-block;min-width:120px;">&nbsp;${empName}&nbsp;</span>
      &nbsp;(ພະນັກງານຜູ້ກະທຳຄວາມເສຍຫາຍ ເລກບັດປະຊາຊົນ): <span style="border-bottom:1px solid #888;display:inline-block;min-width:80px;">&nbsp;</span>
    </div>
    <div style="margin-bottom:6px;line-height:1.8;">
      ທີ່ຢູ່: <span style="border-bottom:1px solid #888;display:inline-block;min-width:200px;">&nbsp;${address}&nbsp;</span>
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      <strong>5.1)</strong> ຂ້າພະເຈົ້າຍອມຮັບຜິດໃນຄວາມເສຍຫາຍທີ່ເກີດຂື້ນ ຕໍ່ຊັບສິນຂອງບໍລິສັດໄດ້ແກ່ ເລື່ອງ:
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:130px;">&nbsp;${empDamage}&nbsp;</span>
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      ມູນຄ່າຊັບສິນທີ່ເສຍຫາຍ ຄ່າ Excess
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:100px;font-weight:700;">&nbsp;${amtBaht}&nbsp;</span>
      ບາດ ຄິດໄລ່ເປັນເງິນກີບ
      (<span style="border-bottom:1px solid #888;display:inline-block;min-width:90px;font-weight:700;">&nbsp;${amtKip} ກີບ&nbsp;</span>)
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      <strong>5.2)</strong> ຂ້າພະເຈົ້າຍິນຍອມໃຫ້ບໍລິສັດຕັດເງິນຕາມຂໍ້ 5.1) ຈຳນວນ
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:90px;font-weight:700;">&nbsp;${amtKip}&nbsp;</span> ກີບ
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      ໂດຍແບ່ງເປັນ <span style="border-bottom:1px solid #888;display:inline-block;min-width:35px;font-weight:700;">&nbsp;${installment}&nbsp;</span>
      ງວດ, ງວດລະ <span style="border-bottom:1px solid #888;display:inline-block;min-width:90px;font-weight:700;">&nbsp;${perInstall}&nbsp;</span>
      ກີบ, ຕັ້ງແຕ່ງວດວັນທີ: <span style="border-bottom:1px solid #888;display:inline-block;min-width:80px;font-weight:700;">&nbsp;${payDate}&nbsp;</span>
    </div>
    <div style="margin-bottom:6px;line-height:1.8;">ຫາກຂ້າພະເຈົ້າບໍ່ຍອມຊຳລະ ບໍລິສັດມີສິດດຳເນີນຄะດີຕາມກົດໝາຍ</div>
    <div style="margin-bottom:6px;line-height:1.7;">
      <strong>5.3)</strong> ກໍລະນີທີ່ຂ້າພະເຈົ້າພົ້ນຈາກການເປັນພະນັກງານ ໂດຍຍັງມີສ່ວນທີ່ຄ້າງຊຳລະ ຂ້າພະເຈົ້າຍິນດີນຳເງິນມາຊຳລະທັງໝົດ ພາຍໃນ 7 ວັນ.
    </div>
    <div style="font-size:9.5px;color:#444;font-style:italic;margin-bottom:12px;">(ຂ້າພະເຈົ້າໄດ້ອ່ານແລະເຂົ້າໃຈໃນຂໍ້ຄວາມດີແລ້ວ ຈຶ່ງໄດ້ລົງລາຍເຊັນຊື່ໄວ້ເພື່ອເປັນຫຼັກຖານ)</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px 30px;">
      <div>${docSigBlock(witness2Name, witness2Detail)}</div>
      <div>${docSigBlock(empName, 'ພະນັກງານ')}</div>
      <div>${docSigBlock(witness1Name, witness1Detail)}</div>
      <div>
        <div style="margin-bottom:10px;">
          <div style="border-bottom:1px solid #888; display:inline-block; width:220px; min-height:40px; vertical-align:bottom; position:relative;">
            <span style="position:absolute; bottom:2px; left:0; white-space:nowrap; font-size:10px;">ລົງຊື່</span>
            ${hrSigBox}
            <span style="position:absolute; bottom:2px; right:0; white-space:nowrap; font-size:10px;">ວັນທີ ____/____/______</span>
          </div>
          <div style="font-size:10px; margin-top:4px;">(${hrName}) ${hrResponsib}</div>
        </div>
      </div>
    </div>
  </div>
</div></div>`

  const page2WithCaseType = page2.replace(/Excess/g, `<span style="color:#000;">${caseTypeVal || 'Excess'}</span>`)
  return `<!DOCTYPE html><html lang="lo"><head><meta charset="UTF-8">${'<style>'}${css}${'</style>'}</head><body>${page1}${page2WithCaseType}</body></html>`
}

// ─── downloadPDF — ตรวจ source แล้วเรียก builder ที่ถูกต้อง ────────────────
const downloadPDF = async (item) => {
  const key = item.id + '-' + item.source
  downloadingId.value = key
  try {
    await Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
    ])
    const [logo1, logo2, hrImgB64] = await Promise.all([
      toBase64('https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg'),
      toBase64('https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png'),
      item.hr_image ? toBase64(item.hr_image) : Promise.resolve(''),
    ])
    const { jsPDF } = window.jspdf
    const empName = (item.employee_name || 'document').replace(/\s+/g, '_')
    const fromVerbalTable = item.source === 'verbal_warning_cases' || item.source_table === 'verbal_warning_cases'

    // verbal_warning_cases => ใช้ฟอร์มแบบหน้า verbal_warningPage.vue
    // discipline_cases (เช่น จอดแซ/ขาดงาน/อื่นๆ) => ใช้ฟอร์มแบบหน้า casesPage.vue
    if (fromVerbalTable) {
      // ─── ใบวาจา 1 หน้า (เหมือน verbal-list.vue) ───────────────────────
      const fullHtml = getVerbalPrintHTML(item, logo1, logo2, hrImgB64)
      const canvas = await new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'position:fixed;top:0;left:-9999px;width:794px;height:1123px;border:none;visibility:hidden;'
        document.body.appendChild(iframe)
        const doc = iframe.contentDocument
        doc.open(); doc.write(fullHtml); doc.close()
        iframe.onload = async () => {
          try {
            await new Promise(r => setTimeout(r, 900))
            const target = doc.querySelector('.page') || doc.body
            const c2 = await window.html2canvas(target, {
              scale: 2, useCORS: true, allowTaint: true,
              backgroundColor: '#ffffff', width: 794, windowWidth: 794,
              scrollX: 0, scrollY: 0, logging: false,
            })
            document.body.removeChild(iframe); resolve(c2)
          } catch (err) { document.body.removeChild(iframe); reject(err) }
        }
      })
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.97), 'JPEG', 0, 0, 210, 297)
      pdf.save(`ໜັງສືຕັກເຕືອນດ້ວຍວາຈາ_${empName}.pdf`)

    } else {
      // ─── ใบวินัย 2 หน้า (เหมือน cases-list.vue) ──────────────────────
      const fullHtml = getDisciplinePrintHTML(item, logo1, logo2, hrImgB64)
      const canvas1  = await renderPageToCanvas(fullHtml, 0)
      const canvas2  = await renderPageToCanvas(fullHtml, 1)
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      pdf.addImage(canvas1.toDataURL('image/jpeg', 0.97), 'JPEG', 0, 0, 210, 297)
      pdf.addPage()
      pdf.addImage(canvas2.toDataURL('image/jpeg', 0.97), 'JPEG', 0, 0, 210, 297)
      pdf.save(`ໜັງສືແຈ້ງໂທດ_${empName}.pdf`)
    }
  } catch (err) {
    console.error('PDF Error:', err); alert('เกิดข้อผิดพลาด: ' + err.message)
  } finally {
    downloadingId.value = null
  }
}

void downloadPDF

const isDarkMode = ref(false)

onMounted(async () => {
  isDarkMode.value = document.body.classList.contains('dark')
  const observer = new MutationObserver(() => {
    isDarkMode.value = document.body.classList.contains('dark')
  })
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

  await Promise.all([disciplineStore.fetchAll(), verbalStore.fetchAll()])
})

watch(isDarkMode, () => {
  buildAllCharts()
})

onBeforeUnmount(() => {
  if (dailyChart)   dailyChart.destroy()
  if (donutChart)   donutChart.destroy()
  if (monthlyChart) monthlyChart.destroy()
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.dash-wrap { padding: 20px; background: var(--content-bg); min-height: 100vh; font-family: 'Noto Sans Thai', 'Noto Sans Lao', sans-serif; font-size: 14px; color: var(--tb-text); transition: background 0.3s, color 0.3s; }
.dash-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
.dash-title { font-size: 20px; font-weight: 700; color: var(--tb-text); display: flex; align-items: center; gap: 10px; }
.dash-title i { color: #0ea5e9; }
.dash-sub { font-size: 13px; color: var(--tb-sub); margin-top: 4px; }
.update-time { font-size: 12px; color: var(--tb-sub); display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.loading-box { display: flex; align-items: center; gap: 10px; padding: 40px; justify-content: center; color: var(--tb-sub); }
.stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.stat-card { background: var(--tb-bg); border: 1px solid var(--tb-border); border-radius: 12px; padding: 16px 18px; position: relative; overflow: hidden; transition: background 0.3s, border-color 0.3s; }
.stat-accent { position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--accent); }
.stat-label { font-size: 12px; color: var(--tb-sub); margin-bottom: 8px; }
.stat-val { font-size: 28px; font-weight: 700; color: var(--tb-text); line-height: 1; }
.stat-delta { font-size: 11px; margin-top: 6px; color: var(--tb-sub); }
.chart-grid-2col { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; margin-bottom: 14px; }
.chart-grid-equal { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.card { background: var(--tb-bg); border: 1px solid var(--tb-border); border-radius: 12px; padding: 18px; transition: background 0.3s, border-color 0.3s; }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.card-title { font-size: 13px; font-weight: 700; color: var(--tb-text); }
.card-sub { font-size: 11px; color: var(--tb-sub); }
.nav-row { display: flex; align-items: center; gap: 8px; }
.date-filter-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.custom-date-inputs { display: flex; align-items: center; gap: 6px; }
.refresh-btn { background: var(--tb-bg); border: 1px solid var(--tb-border); border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--tb-sub); transition: 0.2s; }
.refresh-btn:hover { background: var(--tb-hover); color: var(--tb-text); }
.segmented { display: inline-flex; border: 1px solid var(--tb-border); border-radius: 10px; overflow: hidden; background: var(--tb-bg); }
.seg-btn { border: none; background: transparent; padding: 5px 10px; font-size: 11px; font-weight: 800; color: var(--tb-sub); cursor: pointer; transition: background 0.15s, color 0.15s; }
.seg-btn:hover { background: var(--tb-hover); color: var(--tb-text); }
.seg-btn.active { background: rgba(14, 165, 233, 0.14); color: #0ea5e9; }
.mode-select {
  border: 1px solid var(--tb-border);
  border-radius: 8px;
  background: var(--tb-bg);
  color: var(--tb-text);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
}
.nav-btn { background: none; border: 1px solid var(--tb-border); border-radius: 8px; padding: 4px 10px; font-size: 12px; color: var(--tb-text); cursor: pointer; transition: background 0.15s; }
.nav-btn:hover { background: var(--tb-hover); }
.nav-label { font-size: 13px; font-weight: 700; color: var(--tb-text); min-width: 90px; text-align: center; }
.chart-note { font-size: 10px; color: var(--tb-sub); margin-top: 8px; text-align: center; }
.donut-legend { margin-top: 12px; }
.donut-leg-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; }
.leg-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.donut-leg-label { flex: 1; color: var(--tb-sub); }
.donut-leg-val { font-weight: 700; color: var(--tb-text); }
.table-wrap { overflow-x: auto; }
.scrollable-table { overflow-y: auto; }
.scroll-hint { text-align: center; font-size: 10px; color: var(--tb-sub); margin-top: 6px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; background: transparent; }
th { text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 700; color: var(--tb-sub); border-bottom: 1px solid var(--tb-border); position: sticky; top: 0; background: var(--tb-bg); z-index: 1; }
td { padding: 8px 10px; border-bottom: 1px solid var(--tb-border); color: var(--tb-text); vertical-align: middle; }
tr:last-child td { border-bottom: none; }
.data-row:hover td { background: var(--tb-hover); }
.row-expanded td { background: var(--sb-hover) !important; }
.td-code { font-size: 11px; color: var(--tb-sub); }
.td-name { font-weight: 700; color: var(--tb-text); }
.td-dept { font-size: 11px; color: var(--tb-sub); }
.cnt-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; user-select: none; }
.cnt-badge:hover { opacity: 0.75; }
.expand-row td { padding: 0 !important; background: var(--tb-bg) !important; border-bottom: 2px solid #0ea5e9 !important; }
.expand-box { padding: 10px 12px 12px; }
.expand-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.expand-title { font-size: 12px; color: var(--tb-text); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.expand-title i { color: #0ea5e9; }
.pill-verbal { display:inline-block; padding:1px 8px; border-radius:20px; background:#E1F5EE; color:#0F6E56; font-size:11px; font-weight:700; }
.pill-disc   { display:inline-block; padding:1px 8px; border-radius:20px; background:#E6F1FB; color:#185FA5; font-size:11px; font-weight:700; }
.close-expand-btn { background: none; border: none; font-size: 16px; cursor: pointer; color: var(--tb-sub); padding: 0 4px; line-height: 1; }
.close-expand-btn:hover { color: #ef4444; }
.inner-table { width: 100%; border-collapse: collapse; font-size: 11.5px; background: var(--tb-bg); border-radius: 8px; overflow: hidden; border: 1px solid var(--tb-border); }
.inner-table th { font-size: 10px; padding: 6px 10px; background: var(--tb-hover); color: var(--tb-sub); font-weight: 700; border-bottom: 1px solid var(--tb-border); position: static; }
.inner-table td { padding: 7px 10px; border-bottom: 1px solid var(--tb-border); vertical-align: middle; color: var(--tb-text); }
.inner-row:last-child td { border-bottom: none; }
.inner-row:hover td { background: var(--tb-hover); }
.inner-row td.td-code { color: var(--tb-sub); }
.badge { padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.src-pill { padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.btn-pdf { border: none; border-radius: 8px; padding: 4px 10px; font-size: 11px; cursor: pointer; background: #3b82f6; color: #fff; display: inline-flex; align-items: center; gap: 4px; font-family: inherit; transition: background 0.15s; white-space: nowrap; }
.btn-pdf:hover:not(:disabled) { background: #2563eb; }
.btn-pdf:disabled { opacity: 0.5; cursor: not-allowed; }
.summary-split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.subhead { font-size: 12px; font-weight: 900; color: var(--tb-text); margin: 8px 0 8px; }
.small-table { font-size: 12px; }
@media (max-width: 1024px) { .chart-grid-2col { grid-template-columns: 1fr; } .chart-grid-equal { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } .summary-split { grid-template-columns: 1fr; } .dash-wrap { padding: 12px; } }

/* ── DARK MODE THEME ── */
.app-root.dark .dash-wrap { background: #0f172a; color: #e5e7eb; }
.app-root.dark .stat-card { background: #1a1a2e; border-color: #374151; }
.app-root.dark .stat-val { color: #fff; }
.app-root.dark .stat-label { color: #94a3b8; }
.app-root.dark .card { background: #1a1a2e; border-color: #374151; }
.app-root.dark .card-title { color: #e2e8f0; }
.app-root.dark .card-sub { color: #94a3b8; }
.app-root.dark .refresh-btn { background: #1a1a2e; border-color: #374151; color: #94a3b8; }
.app-root.dark .refresh-btn:hover { background: #1e293b; color: #e2e8f0; }
.app-root.dark .segmented { background: #1a1a2e; border-color: #374151; }
.app-root.dark .seg-btn { color: #94a3b8; }
.app-root.dark .seg-btn:hover { background: #1e293b; color: #e2e8f0; }
.app-root.dark .seg-btn.active { background: rgba(59, 130, 246, 0.18); color: #60a5fa; }
.app-root.dark .mode-select { background: #1a1a2e; border-color: #374151; color: #e2e8f0; }
.app-root.dark .nav-btn { border-color: #374151; color: #94a3b8; }
.app-root.dark .nav-label { color: #fff; }
.app-root.dark table th { background: #1a1a2e; border-color: #374151; color: #94a3b8; }
.app-root.dark table td { border-color: #374151; color: #cbd5e1; }
.app-root.dark .td-name { color: #fff; }
.app-root.dark .td-code, .app-root.dark .td-dept { color: #64748b; }
.app-root.dark .data-row:hover td { background: #1e293b; }
.app-root.dark .inner-table { background: #0f172a; border-color: #374151; }
.app-root.dark .inner-table th { background: #1e293b; border-color: #374151; color: #94a3b8; }
.app-root.dark .inner-table td { border-color: #374151; color: #cbd5e1; }
.app-root.dark .inner-row:hover td { background: #1e293b; }
.app-root.dark .expand-box { background: #1a1a2e; }
.app-root.dark .expand-title { color: #e2e8f0; }
.app-root.dark .close-expand-btn { color: #64748b; }
.app-root.dark .close-expand-btn:hover { color: #f87171; }
.app-root.dark .pill-verbal { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.app-root.dark .pill-disc { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.app-root.dark .donut-leg-val { color: #fff; }
.app-root.dark .dash-title { color: #fff; }
.app-root.dark .dash-sub { color: #94a3b8; }
.app-root.dark .update-time { color: #64748b; }
</style>
