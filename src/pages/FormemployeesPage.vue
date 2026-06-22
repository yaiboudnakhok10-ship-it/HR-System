<script setup>
import { ref, onMounted } from 'vue'
import { useEmployeeStore } from '@/stores/employees.stores'

const store = useEmployeeStore()

onMounted(() => {
  store.getEmployees()
})

// ───────────────────────────────────────────
// Form State
// ───────────────────────────────────────────
const form = ref({
  employee_code: '',
  fullname: '',
  tel: '',
  dob: '',
  address: '',
  department: '',
  position: '',
  project: '',
  company: '',
  status: '',
  real_resigned: '',
})

const errors = ref({
  employee_code: false,
  fullname: false,
  department: false,
})

// รายการที่รอบันทึก (pending)
const pendingList = ref([])

const saving = ref(false)
const successMsg = ref('')

// ───────────────────────────────────────────
// Methods
// ───────────────────────────────────────────
function validate() {
  errors.value.employee_code = !form.value.employee_code.trim()
  errors.value.fullname      = !form.value.fullname.trim()
  errors.value.department    = !form.value.department.trim()
  return !errors.value.employee_code && !errors.value.fullname && !errors.value.department
}

// ปุ่ม "เพิ่ม" → เพิ่มลง pendingList ก่อน
function addToPending() {
  if (!validate()) return

  const payload = {
    _tempId:          Date.now(),
    employee_code:    form.value.employee_code.trim(),
    fullname:         form.value.fullname.trim(),
    tel:              form.value.tel.trim()             || null,
    dob:              form.value.dob                    || null,
    address:          form.value.address.trim()         || null,
    department:       form.value.department.trim(),
    position:         form.value.position.trim()        || null,
    project:          form.value.project.trim()         || null,
    company:          form.value.company.trim()         || null,
    status:           form.value.status.trim()          || null,
    real_resigned:    form.value.real_resigned          || null,
  }

  pendingList.value.push(payload)
  clearForm()
}

// ลบรายการออกจาก pending
function removeFromPending(tempId) {
  pendingList.value = pendingList.value.filter(e => e._tempId !== tempId)
}

// ปุ่ม "บันทึกข้อมูล" → ส่งทั้งหมดลง Supabase
async function saveAll() {
  if (pendingList.value.length === 0) return

  saving.value = true
  successMsg.value = ''

  for (const item of pendingList.value) {
    const payload = { ...item }
    delete payload._tempId
    await store.addEmployee(payload)
    if (store.error) break
  }

  saving.value = false

  if (!store.error) {
    successMsg.value = `บันทึกข้อมูลพนักงาน ${pendingList.value.length} คน สำเร็จ!`
    pendingList.value = []
    store.getEmployees()
    setTimeout(() => { successMsg.value = '' }, 3500)
  }
}

function clearForm() {
  Object.keys(form.value).forEach(k => (form.value[k] = ''))
  errors.value = { employee_code: false, fullname: false, department: false }
}

function formatDate(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d)) return val
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="page-wrap">

    <!-- ══════════════════════════════════
         FORM CARD
    ══════════════════════════════════ -->
    <div class="form-card">

      <!-- Header Bar -->
      <div class="header-bar">
        <div class="header-left">
          <div class="header-icon"></div>
          <div>
            <div class="header-title">ฟอร์มบันทึกข้อมูลพนักงาน</div>
            <div class="header-sub">เพิ่มข้อมูลพนักงานและข้อมูลการทำงาน</div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-outline" @click="clearForm">↺ ล้างข้อมูล</button>
        </div>
      </div>

      <!-- Success / Error Banner -->
      <div v-if="successMsg" class="banner banner-success">
        ✓ {{ successMsg }}
      </div>
      <div v-if="store.error" class="banner banner-error">
        ✕ เกิดข้อผิดพลาด: {{ store.error }}
      </div>

      <!-- Form Body -->
      <div class="form-body">

        <!-- ── ข้อมูลพนักงาน ── -->
        <div class="section-tag">ข้อมูลพนักงาน</div>
        <div class="grid-personal">

          <div class="field">
            <label>รหัสพนักงาน <span class="req">*</span></label>
            <input
              v-model="form.employee_code"
              type="text"
              placeholder="EMP-0001"
              :class="{ 'input-err': errors.employee_code }"
            />
            <span v-if="errors.employee_code" class="err-msg">กรุณากรอกรหัสพนักงาน</span>
          </div>

          <div class="field">
            <label>ชื่อ-นามสกุล <span class="req">*</span></label>
            <input
              v-model="form.fullname"
              type="text"
              placeholder="ชื่อเต็ม"
              :class="{ 'input-err': errors.fullname }"
            />
            <span v-if="errors.fullname" class="err-msg">กรุณากรอกชื่อ-นามสกุล</span>
          </div>

          <div class="field">
            <label>เบอร์โทรศัพท์</label>
            <input v-model="form.tel" type="tel" placeholder="08x-xxx-xxxx" />
          </div>

          <div class="field">
            <label>วันเดือนปีเกิด</label>
            <input v-model="form.dob" type="date" />
          </div>

          <div class="field span-4">
            <label>ที่อยู่</label>
            <textarea
              v-model="form.address"
              placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
            />
          </div>

        </div>

        <div class="divider" />

        <!-- ── ข้อมูลงาน ── -->
        <div class="section-tag">ข้อมูลงาน</div>
        <div class="grid-job-wrap">
          <div class="grid-job">

            <div class="field">
              <label>แผนก <span class="req">*</span></label>
              <input
                v-model="form.department"
                type="text"
                placeholder="ฝ่ายบัญชี, ฝ่าย IT"
                :class="{ 'input-err': errors.department }"
              />
              <span v-if="errors.department" class="err-msg">กรุณากรอกชื่อแผนก</span>
            </div>

            <div class="field">
              <label>ตำแหน่ง</label>
              <input v-model="form.position" type="text" placeholder="ตำแหน่ง" />
            </div>

            <div class="field">
              <label>โครงการ</label>
              <input v-model="form.project" type="text" placeholder="โครงการ" />
            </div>

            <div class="field">
              <label>บริษัท</label>
              <input v-model="form.company" type="text" placeholder="บริษัท" />
            </div>

            <div class="field">
              <label>สถานะพนักงาน</label>
              <input v-model="form.status" type="text" placeholder="เช่น พนักงาน, ลาออก" />
            </div>

            <div class="field">
              <label>วันทำงานวันสุดท้าย</label>
              <input v-model="form.real_resigned" type="date" />
            </div>

          </div>
        </div>

        <!-- ── ปุ่มเพิ่ม ── -->
        <div class="form-actions">
          <button class="btn-add" @click="addToPending">
            ＋ เพิ่มรายการ
          </button>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════
         PENDING CARD (รอบันทึก)
    ══════════════════════════════════ -->
    <div v-if="pendingList.length > 0" class="pending-card">

      <div class="pending-bar">
        <div class="pending-bar-left">
          <span class="pending-title">📋 รายการรอบันทึก</span>
          <span class="count-badge pending-badge">{{ pendingList.length }}</span>
        </div>
        <button
          class="btn-save"
          :disabled="saving"
          @click="saveAll"
        >
          <span v-if="saving" class="spinner" />
          <span v-else>💾</span>
          {{ saving ? 'กำลังบันทึก...' : `บันทึกข้อมูล ${pendingList.length} รายการ` }}
        </button>
      </div>

      <div class="table-wrap">
        <table class="emp-table">
          <thead>
            <tr>
              <th>#</th>
              <th>รหัสพนักงาน</th>
              <th>ชื่อ-นามสกุล</th>
              <th>เบอร์โทร</th>
              <th>แผนก</th>
              <th>ตำแหน่ง</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(emp, index) in pendingList"
              :key="emp._tempId"
              class="emp-row pending-row"
            >
              <td class="td-num">{{ index + 1 }}</td>
              <td class="td-code">{{ emp.employee_code }}</td>
              <td class="td-name">{{ emp.fullname }}</td>
              <td>{{ emp.tel || '-' }}</td>
              <td>{{ emp.department }}</td>
              <td>{{ emp.position || '-' }}</td>
              <td>
                <span class="stat-pill">{{ emp.status || '-' }}</span>
              </td>
              <td>
                <button class="btn-remove" @click="removeFromPending(emp._tempId)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══════════════════════════════════
         TABLE CARD (ข้อมูลใน Supabase)
    ══════════════════════════════════ -->
    <div class="table-card">

      <div class="table-bar">
        <div class="table-bar-left">
          <span class="table-icon"></span>
          <span class="table-title">รายชื่อพนักงาน</span>
          <span class="count-badge">{{ store.employees.length }}</span>
        </div>
      </div>

      <div class="table-wrap">
        <table class="emp-table">
          <thead>
            <tr>
              <th>#</th>
              <th>รหัสพนักงาน</th>
              <th>ชื่อ-นามสกุล</th>
              <th>เบอร์โทร</th>
              <th>วันเกิด</th>
              <th>แผนก</th>
              <th>ตำแหน่ง</th>
              <th>โครงการ</th>
              <th>บริษัท</th>
              <th>สถานะ</th>
              <th>วันสุดท้าย</th>
            </tr>
          </thead>
          <tbody>

            <tr v-if="store.loading">
              <td colspan="11" class="empty-cell">
                <div class="empty-state">
                  <span class="spinner spinner-dark" />
                  <span>กำลังโหลดข้อมูล...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="store.employees.length === 0">
              <td colspan="11" class="empty-cell">
                <div class="empty-state">
                  <div class="empty-icon">🗂</div>
                  <div class="empty-txt">ยังไม่มีข้อมูล — กรอกข้อมูลด้านบนแล้วกด เพิ่มรายการ</div>
                </div>
              </td>
            </tr>

            <tr
              v-else
              v-for="(emp, index) in store.employees"
              :key="emp.id"
              class="emp-row"
            >
              <td class="td-num">{{ index + 1 }}</td>
              <td class="td-code">{{ emp.employee_code }}</td>
              <td class="td-name">{{ emp.fullname }}</td>
              <td>{{ emp.tel || '-' }}</td>
              <td>{{ formatDate(emp.dob) }}</td>
              <td>{{ emp.department || '-' }}</td>
              <td>{{ emp.position || '-' }}</td>
              <td>{{ emp.project || '-' }}</td>
              <td>{{ emp.company || '-' }}</td>
              <td>
                <span class="stat-pill">{{ emp.status || '-' }}</span>
              </td>
              <td>{{ formatDate(emp.real_resigned) }}</td>
            </tr>

          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&display=swap');

.page-wrap {
  font-family: 'IBM Plex Sans Thai', system-ui, sans-serif;
  font-size: 13px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ══ FORM CARD ══ */
.form-card {
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.header-bar {
  background: #0f4c81;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-icon {
  width: 36px; height: 36px;
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.header-title { color: #fff; font-size: 15px; font-weight: 600; }
.header-sub   { color: rgba(255,255,255,0.6); font-size: 11px; margin-top: 2px; }
.header-actions { display: flex; gap: 8px; }
.btn-outline {
  padding: 6px 13px;
  background: rgba(255,255,255,0.12);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 7px;
  font-size: 12px; font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-outline:hover { background: rgba(255,255,255,0.22); }

.banner {
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 500;
}
.banner-success {
  background: rgba(22,163,74,0.08);
  color: #15803d;
  border-bottom: 1px solid rgba(22,163,74,0.15);
}
.banner-error {
  background: rgba(220,38,38,0.07);
  color: #b91c1c;
  border-bottom: 1px solid rgba(220,38,38,0.15);
}

.form-body { padding: 16px 18px; }
.section-tag {
  display: inline-block;
  font-size: 11px; font-weight: 600;
  color: #0f4c81;
  background: rgba(15,76,129,0.08);
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 12px;
  letter-spacing: 0.3px;
}

.grid-personal {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.span-4 { grid-column: 1 / 5; }

.grid-job-wrap { display: block; }
.grid-job {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.field { display: flex; flex-direction: column; gap: 4px; }
.field label {
  font-size: 11px; font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.req { color: #dc2626; }
.field input,
.field textarea {
  padding: 7px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  font-size: 12px;
  font-family: inherit;
  color: #111827;
  background: #f9fafb;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  width: 100%;
  box-sizing: border-box;
}
.field input:focus,
.field textarea:focus {
  border-color: #0f4c81;
  box-shadow: 0 0 0 3px rgba(15,76,129,0.1);
  background: #fff;
}
.field input[type="date"] { color: #111827; }
.field textarea { resize: none; height: 56px; line-height: 1.5; }
.input-err { border-color: #dc2626 !important; }
.err-msg { font-size: 10px; color: #dc2626; }
.divider { height: 1px; background: #f3f4f6; margin: 14px 0; }

/* ── ปุ่มเพิ่ม ── */
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.btn-add:hover {
  background: #15803d;
  transform: translateY(-1px);
}

/* ══ PENDING CARD ══ */
.pending-card {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.pending-bar {
  padding: 11px 16px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #fde68a;
  gap: 12px; flex-wrap: wrap;
}
.pending-bar-left { display: flex; align-items: center; gap: 8px; }
.pending-title { font-size: 14px; font-weight: 600; color: #92400e; }
.pending-badge { background: #d97706; }

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: #0f4c81;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.btn-save:hover:not(:disabled) {
  background: #1565c0;
  transform: translateY(-1px);
}
.btn-save:disabled {
  background: #93c5fd;
  cursor: not-allowed;
  transform: none;
}

.pending-row td { background: #fffbeb; }
.pending-row:hover td { background: #fef3c7; }

.btn-remove {
  padding: 3px 9px;
  background: transparent;
  color: #dc2626;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.btn-remove:hover { background: #fee2e2; }

.spinner {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner-dark {
  border-color: rgba(15,76,129,0.2);
  border-top-color: #0f4c81;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ══ TABLE CARD ══ */
.table-card {
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.table-bar {
  padding: 11px 16px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #f3f4f6;
}
.table-bar-left { display: flex; align-items: center; gap: 8px; }
.table-icon  { font-size: 15px; }
.table-title { font-size: 14px; font-weight: 600; color: #111827; }
.count-badge {
  background: #0f4c81; color: #fff;
  font-size: 11px; font-weight: 600;
  padding: 2px 8px; border-radius: 20px;
  min-width: 22px; text-align: center;
}

.table-wrap { overflow-x: auto; }
.emp-table {
  width: 100%; border-collapse: collapse;
  font-size: 12px; min-width: 960px;
}
.emp-table thead tr {
  background: #f8fafc;
  border-bottom: 2px solid #f3f4f6;
}
.emp-table th {
  padding: 9px 12px; text-align: left;
  font-size: 11px; font-weight: 600;
  color: #9ca3af; white-space: nowrap; letter-spacing: 0.3px;
}
.emp-table td {
  padding: 9px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #111827; white-space: nowrap;
}
.emp-row:last-child td { border-bottom: none; }
.emp-row:hover td { background: #f0f7ff; }
.td-num  { color: #9ca3af; font-size: 11px; }
.td-code { font-weight: 600; color: #0f4c81; }
.td-name { font-weight: 600; }
.stat-pill {
  display: inline-block;
  padding: 2px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
  background: #f3f4f6; color: #6b7280;
}
.empty-cell { text-align: center; padding: 40px 16px !important; }
.empty-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 8px;
  color: #9ca3af; font-size: 12px;
}
.empty-icon { font-size: 32px; opacity: 0.3; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .grid-personal { grid-template-columns: repeat(2, 1fr); }
  .span-4 { grid-column: 1 / 3; }
  .grid-job { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 540px) {
  .grid-personal { grid-template-columns: 1fr; }
  .span-4 { grid-column: 1 / 2; }
  .grid-job { grid-template-columns: 1fr; }
}
</style>
