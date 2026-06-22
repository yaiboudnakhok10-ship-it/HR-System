<script setup>
import { useEmployeeStore } from '../stores/employees.stores'
import { onMounted, ref, computed } from 'vue'

const store = useEmployeeStore()

const searchText = ref('')
const filterDept  = ref('')

onMounted(() => {
  store.getEmployees()
})

const departments = computed(() => {
  const depts = store.employees.map(e => e.department).filter(Boolean)
  return [...new Set(depts)]
})

const filtered = computed(() => {
  return store.employees.filter(emp => {
    const matchSearch =
      !searchText.value ||
      emp.employee_code?.toLowerCase().includes(searchText.value.toLowerCase()) ||
      emp.fullname?.toLowerCase().includes(searchText.value.toLowerCase())
    const matchDept =
      !filterDept.value || emp.department === filterDept.value
    return matchSearch && matchDept
  })
})

function clearFilter() {
  searchText.value = ''
  filterDept.value = ''
}

function formatDate(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d)) return val
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <div class="page-wrap">

    <div class="page-card">

      <!-- Card Header -->
      <div class="card-header">
        <div class="page-title">รายชื่อพนักงาน</div>
      </div>

      <div class="card-divider"></div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="search-wrap">
          <i class="fa fa-search search-icon"></i>
          <input
            v-model="searchText"
            class="search-input"
            placeholder="ค้นหาด้วยรหัสพนักงาน หรือชื่อ-นามสกุล"
          />
        </div>
        <select v-model="filterDept" class="dept-select">
          <option value="">ทุกแผนก</option>
          <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
        </select>
        <button class="btn-clear" @click="clearFilter">
          <i class="fa fa-rotate-left"></i> ล้างตัวกรอง
        </button>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table class="emp-table">
          <thead>
            <tr>
              <th>รหัสพนักงาน</th>
              <th>ชื่อ-นามสกุล</th>
              <th>ตำแหน่ง</th>
              <th>แผนก</th>
              <th>โครงการ</th>
              <th>บริษัท</th>
              <th>เบอร์โทร</th>
              <th>วันเดือนปีเกีด</th>
              <th>สถานะ</th>
              <th>ผู้บันทึก</th>
              <th>บันทึกเมื่อ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="10" class="no-data">
                <i class="fa fa-spinner fa-spin"></i>
                <span>กำลังโหลดข้อมูล...</span>
              </td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="10" class="no-data">
                <i class="fa fa-inbox"></i>
                <span>ไม่พบข้อมูลพนักงาน</span>
              </td>
            </tr>
            <tr v-for="emp in filtered" :key="emp.id" class="emp-row">
              <td class="td-code">{{ emp.employee_code }}</td>
              <td class="td-name">{{ emp.fullname }}</td>
              <td class="td-pos">{{ emp.position || '-' }}</td>
              <td>{{ emp.department || '-' }}</td>
              <td>{{ emp.project || '-' }}</td>
              <td>{{ emp.company || '-' }}</td>
              <td>{{ emp.tel || '-' }}</td>
              <td>{{ emp.dob || '-' }}</td>
              <td>
                <span :class="['status-badge', emp.status === 'active' ? 'status-active' : 'status-resigned']">
                  {{ emp.status === 'active' ? 'พนักงาน' : 'ลาออก' }}
                </span>
              </td>
              <td>
                <span class="created-by" v-if="emp.created_by">{{ emp.created_by }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="td-date">{{ formatDate(emp.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

.page-wrap {
  font-family: "SF Thonburi", system-ui, sans-serif;
  font-weight: 400;
  padding: 20px;
}

/* ════════════════════════════
   CARD
════════════════════════════ */
.page-card {
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  overflow: hidden;
}

/* ── Card Header ── */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  flex-wrap: wrap;
  gap: 10px;
}
.page-title {
  font-size: 20px;
  font-weight: 900;
  color: #111827;
}

.card-divider { height: 1px; background: #e8eaed; }

/* ── Filter Bar ── */
.filter-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid #e8eaed;
  flex-wrap: wrap;
  background: #fafbfc;
}
.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: #9ca3af; font-size: 13px; pointer-events: none;
}
.search-input {
  width: 100%; padding: 8px 12px 8px 34px;
  border: 1.5px solid #e5e7eb; border-radius: 9px; font-size: 13px;
  font-family: "SF Thonburi", system-ui, sans-serif;
  color: #1a2035; background: #fff; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
}
.search-input:focus { border-color: #1976d2; box-shadow: 0 0 0 3px rgba(25,118,210,.10); }
.search-input::placeholder { color: #c4c9d4; }

.dept-select {
  padding: 8px 30px 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 9px;
  font-size: 13px; font-weight: 600;
  font-family: "SF Thonburi", system-ui, sans-serif;
  color: #374151; background: #fff;
  outline: none; cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%239ca3af' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; min-width: 130px;
}
.dept-select:focus { border-color: #1976d2; }

.btn-clear {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; background: #f3f4f6; color: #6b7280;
  border: 1.5px solid #e5e7eb; border-radius: 9px;
  font-size: 13px; font-weight: 700;
  font-family: "SF Thonburi", system-ui, sans-serif;
  cursor: pointer; transition: all 0.2s;
}
.btn-clear:hover { background: #e5e7eb; color: #374151; }

/* ── Table ── */
.table-wrap { overflow-x: auto; }
.emp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.emp-table thead tr { background: #f8fafc; border-bottom: 2px solid #e8eaed; }
.emp-table th {
  padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600;
  color: #9ca3af; white-space: nowrap; letter-spacing: 0.3px;
}
.emp-table td {
  padding: 11px 16px; border-bottom: 1px solid #f3f4f6;
  color: #111827; font-size: 14px; font-weight: 600; white-space: nowrap;
}
.emp-row:last-child td { border-bottom: none; }
.emp-row:hover td { background: #f0f7ff; }

.td-code { font-weight: 700; color: #111827; }
.td-name { font-weight: 700; color: #111827; }
.td-pos  { color: #6b7280; font-size: 13px; font-weight: 500; }
.td-date { color: #9ca3af; font-size: 12px; font-weight: 400; }
.text-muted { color: #9ca3af; }

/* Status Badge */
.status-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 700;
}
.status-active   { background: rgba(22,163,74,0.10);  color: #16a34a; }
.status-resigned { background: rgba(239,68,68,0.10);  color: #dc2626; }

.created-by {
  display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700;
  color: #1976d2; background: rgba(25,118,210,0.08); padding: 2px 9px; border-radius: 20px;
}

.no-data { text-align: center; padding: 48px 16px !important; color: #9ca3af; font-size: 13px; }
.no-data i { font-size: 32px; display: block; margin-bottom: 8px; opacity: 0.4; }
</style>