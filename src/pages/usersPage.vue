<script setup>
import { useSers } from '../stores/users.stores'
import { useAuthStore } from '@/stores/auth.store'
import { useEmployeeStore } from '../stores/Useemployeestore'
import { onMounted, ref, watch } from 'vue'
import bcrypt from 'bcryptjs'

const store    = useSers()
const auth     = useAuthStore()
const empStore = useEmployeeStore()

function getNowUTC7() {
  const now = new Date()
  const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return utc7.toISOString()
}

onMounted(() => {
  store.getUsers()
})

function formatDate(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d)) return val
  return d.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })
}

// ── Toast ──────────────────────────────────────────────────
const showToast = ref(false)
const toastMsg  = ref('')
const toastType = ref('success')

function triggerToast(msg, type = 'success') {
  toastMsg.value  = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

// ── Confirm Dialog ─────────────────────────────────────────
const showConfirm   = ref(false)
const confirmMsg    = ref('')
const confirmAction = ref(null)

function openConfirm(msg, action) {
  confirmMsg.value    = msg
  confirmAction.value = action
  showConfirm.value   = true
}
function doConfirm() {
  showConfirm.value = false
  if (confirmAction.value) confirmAction.value()
}
function cancelConfirm() {
  showConfirm.value   = false
  confirmAction.value = null
}

// ── Employee Search ────────────────────────────────────────
const empSearch        = ref('')
const employeeOptions  = ref([])
const showEmpDropdown  = ref(false)
const selectedEmployee = ref(null)
let empTimer = null

watch(empSearch, (val) => {
  if (empTimer) clearTimeout(empTimer)
  const q = (val || '').trim()
  if (!q) {
    employeeOptions.value  = []
    showEmpDropdown.value  = false
    selectedEmployee.value = null
    return
  }
  empTimer = setTimeout(async () => {
    const results = await empStore.searchByCode(q)
    employeeOptions.value = results || []
    showEmpDropdown.value = employeeOptions.value.length > 0
  }, 300)
})

function selectEmployee(emp) {
  empSearch.value        = `${emp.employee_code} - ${emp.fullname}`
  selectedEmployee.value = emp
  employeeOptions.value  = []
  showEmpDropdown.value  = false
}

// ── Drawer (Add only) ──────────────────────────────────────
const showDrawer  = ref(false)
const saving      = ref(false)
const saveError   = ref('')

const newUsername  = ref('')
const newPassword  = ref('')
const showPassword = ref(false)

function openAdd() {
  saveError.value        = ''
  empSearch.value        = ''
  selectedEmployee.value = null
  employeeOptions.value  = []
  newUsername.value      = ''
  newPassword.value      = ''
  showPassword.value     = false
  showDrawer.value       = true
}

function closeDrawer() {
  showDrawer.value = false
}

async function handleSave() {
  saveError.value = ''
  if (!selectedEmployee.value)   { saveError.value = 'กรุณาเลือกพนักงาน'; return }
  if (!newUsername.value.trim()) { saveError.value = 'กรุณากรอก Username'; return }
  if (!newPassword.value.trim()) { saveError.value = 'กรุณากรอก Password'; return }

  saving.value = true
  try {
    const password_hash = await bcrypt.hash(newPassword.value, 10)
    const payload = {
      employee_code: selectedEmployee.value.employee_code,
      fullname:      selectedEmployee.value.fullname,
      username:      newUsername.value.trim(),
      password_hash,
      status:        'user',
      created_by:    auth.session?.fullname || auth.session?.username || null,
      created_at:    getNowUTC7(),
    }
    await store.addUsers(payload)
    if (store.error) throw new Error(store.error)
    triggerToast('เพิ่มผู้ใช้งานสำเร็จ')
    closeDrawer()
  } catch (e) {
    saveError.value = 'บันทึกล้มเหลว: ' + (e.message || 'กรุณาลองใหม่')
  } finally {
    saving.value = false
  }
}

// ── Delete ─────────────────────────────────────────────────
function handleDelete(u) {
  openConfirm(
    `ต้องการลบผู้ใช้งาน "${u.username}" ใช่หรือไม่?`,
    async () => {
      await store.deleteUser(u.id)
      if (store.error) {
        triggerToast('ลบข้อมูลล้มเหลว', 'error')
      } else {
        triggerToast('ลบผู้ใช้งานสำเร็จ')
      }
    }
  )
}
</script>

<template>
  <div class="page-wrap">
    <div class="page-card">

      <div class="card-header">
        <div class="page-title">รายชื่อผู้ใช้งาน</div>
        <button class="btn-add" @click="openAdd">
          <i class="fa fa-plus"></i> เพิ่มผู้ใช้งาน
        </button>
      </div>

      <div class="card-divider"></div>

      <div class="table-wrap">
        <table class="emp-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>รหัสพนักงาน</th>
              <th>ชื่อ-นามสกุล</th>
              <th>ผู้ที่เพิ่ม</th>
              <th>เพิ่มเมื่อ</th>
              <th style="text-align:center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="6" class="no-data">
                <i class="fa fa-spinner fa-spin"></i>
                <span>กำลังโหลดข้อมูล...</span>
              </td>
            </tr>
            <tr v-else-if="store.system_users.length === 0">
              <td colspan="6" class="no-data">
                <i class="fa fa-inbox"></i>
                <span>ไม่พบข้อมูลผู้ใช้งาน</span>
              </td>
            </tr>
            <tr v-for="u in store.system_users" :key="u.id" class="emp-row">
              <td><span class="username-badge">{{ u.username }}</span></td>
              <td class="td-code">{{ u.employee_code || '-' }}</td>
              <td class="td-name">{{ u.fullname || '-' }}</td>
              <td>
                <span class="created-by" v-if="u.created_by">{{ u.created_by }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="td-date">{{ formatDate(u.created_at) }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-delete" @click="handleDelete(u)" title="ลบ">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- ── Drawer (Add) ── -->
    <Teleport to="body">
      <div v-if="showDrawer" class="drawer-overlay" @click.self="closeDrawer">
        <div class="drawer">
          <div class="drawer-header">
            <span class="drawer-title">
              <i class="fa fa-user-plus"></i>
              เพิ่มผู้ใช้งาน
            </span>
            <button class="drawer-close" @click="closeDrawer">
              <i class="fa fa-times"></i>
            </button>
          </div>

          <div class="drawer-body">

            <!-- ค้นหาพนักงาน -->
            <div class="field-group">
              <label class="field-label">
                ค้นหารหัสพนักงาน <span class="required">*</span>
              </label>
              <div class="input-wrap" style="position:relative;">
                <input
                  v-model="empSearch"
                  class="field-input"
                  style="padding: 9px 36px 9px 12px"
                  placeholder="กรอกรหัสหรือชื่อพนักงาน"
                  autocomplete="off"
                />
                <button
                  v-if="empSearch"
                  type="button"
                  class="toggle-pw"
                  @click="empSearch = ''; selectedEmployee = null; employeeOptions = []; showEmpDropdown = false"
                >
                  <i class="fa fa-times"></i>
                </button>
                <i
                  v-else-if="empStore.loading"
                  class="fa fa-spinner fa-spin input-icon-right"
                ></i>

                <div v-if="showEmpDropdown" class="emp-dropdown">
                  <button
                    v-for="e in employeeOptions"
                    :key="e.id"
                    type="button"
                    class="emp-option"
                    @click="selectEmployee(e)"
                  >
                    <span class="emp-option-code">{{ e.employee_code }}</span>
                    <span class="emp-option-name">{{ e.fullname }}</span>
                    <span class="emp-option-dept">({{ e.department }})</span>
                  </button>
                  <div
                    v-if="employeeOptions.length === 0 && empSearch.trim() && !empStore.loading"
                    class="emp-no-result"
                  >
                    <i class="fa fa-search"></i> ไม่พบพนักงานที่ค้นหา
                  </div>
                </div>
              </div>

              <div v-if="selectedEmployee" class="emp-selected-card">
                <div class="emp-selected-row">
                  <span class="emp-selected-label">รหัส</span>
                  <span class="emp-selected-val emp-selected-code">{{ selectedEmployee.employee_code }}</span>
                </div>
                <div class="emp-selected-row">
                  <span class="emp-selected-label">ชื่อ</span>
                  <span class="emp-selected-val">{{ selectedEmployee.fullname }}</span>
                </div>
                <div v-if="selectedEmployee.department" class="emp-selected-row">
                  <span class="emp-selected-label">ตำแหน่ง</span>
                  <span class="emp-selected-val">{{ selectedEmployee.department }}</span>
                </div>
              </div>
            </div>

            <!-- Username -->
            <div class="field-group">
              <label class="field-label">Username <span class="required">*</span></label>
              <div class="input-wrap">
                <input
                  v-model="newUsername"
                  class="field-input"
                  style="padding: 9px 12px"
                  placeholder="กรอก Username"
                  autocomplete="off"
                />
              </div>
            </div>

            <!-- Password -->
            <div class="field-group">
              <label class="field-label">
                Password <span class="required">*</span>
              </label>
              <div class="input-wrap">
                <input
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  class="field-input"
                  style="padding: 9px 36px 9px 12px"
                  placeholder="กรอกรหัสผ่าน"
                />
                <button type="button" class="toggle-pw" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
                </button>
              </div>
            </div>

            <div class="error-msg" v-if="saveError">
              <i class="fa fa-circle-exclamation"></i> {{ saveError }}
            </div>

          </div>

          <div class="drawer-footer">
            <button class="btn-cancel" @click="closeDrawer">ยกเลิก</button>
            <button class="btn-save" @click="handleSave" :disabled="saving">
              <i :class="saving ? 'fa fa-spinner fa-spin' : 'fa fa-floppy-disk'"></i>
              {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Confirm Dialog ── -->
    <Teleport to="body">
      <div v-if="showConfirm" class="confirm-overlay">
        <div class="confirm-box">
          <div class="confirm-icon"><i class="fa fa-triangle-exclamation"></i></div>
          <div class="confirm-msg">{{ confirmMsg }}</div>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="cancelConfirm">ยกเลิก</button>
            <button class="btn-confirm-del" @click="doConfirm">
              <i class="fa fa-trash"></i> ยืนยันลบ
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Toast ── -->
    <Teleport to="body">
      <div
        v-if="showToast"
        :class="['toast', toastType === 'error' ? 'toast-error' : 'toast-success']"
      >
        <i :class="toastType === 'error' ? 'fa fa-circle-xmark' : 'fa fa-circle-check'"></i>
        {{ toastMsg }}
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

.page-wrap {
  font-family: "SF Thonburi", system-ui, sans-serif;
  font-weight: 400;
  padding: 20px;
}
.page-card {
  background: var(--tb-bg);
  border: 1px solid var(--tb-border);
  border-radius: 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  overflow: hidden;
}
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px; flex-wrap: wrap; gap: 10px;
}
.page-title {
  font-size: 20px; font-weight: 900; color: var(--tb-text);
  transition: color 0.3s;
}
.btn-add {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 16px; background: #1976d2; color: #fff;
  border: none; border-radius: 9px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: background 0.2s, transform 0.15s;
  box-shadow: 0 2px 8px rgba(25,118,210,0.25);
}
.btn-add:hover { background: #1565c0; transform: translateY(-1px); }
.card-divider { height: 1px; background: var(--tb-border); }

.table-wrap { overflow-x: auto; }
.emp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.emp-table thead tr {
  background: var(--sb-search-bg);
  border-bottom: 2px solid var(--tb-border);
}
.emp-table th {
  padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600;
  color: var(--tb-sub); white-space: nowrap; letter-spacing: 0.3px;
}
.emp-table td {
  padding: 11px 16px; border-bottom: 1px solid var(--tb-border);
  color: var(--tb-text); font-size: 14px; font-weight: 600; white-space: nowrap;
  transition: color 0.3s, border-color 0.3s, background 0.3s;
}
.emp-row:last-child td { border-bottom: none; }
.emp-row:hover td { background: var(--sb-hover); }
.td-code { font-weight: 700; font-family: 'Barlow', monospace; }
.td-name { font-weight: 700; }
.td-date { color: var(--tb-sub); font-size: 12px; }
.text-muted { color: var(--tb-sub); }
.username-badge { font-size: 13px; font-weight: 700; }
.created-by {
  display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700;
  color: #1976d2; background: rgba(25,118,210,0.08); padding: 2px 9px; border-radius: 20px;
}
.no-data {
  text-align: center; padding: 48px 16px !important;
  color: var(--tb-sub); font-size: 13px;
}
.no-data i { font-size: 32px; display: block; margin-bottom: 8px; opacity: 0.4; }

.action-btns { display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-delete {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(220,38,38,0.08); color: #dc2626;
  border: 1px solid rgba(220,38,38,0.20); cursor: pointer;
  font-size: 12px; transition: all 0.2s;
}
.btn-delete:hover { background: #dc2626; color: #fff; }

.drawer-overlay {
  position: fixed; top: 54px; left: 0; right: 0; bottom: 0;
  z-index: 40; background: rgba(0,0,0,0.35);
  display: flex; justify-content: flex-end;
}
.drawer {
  width: 100%; max-width: 400px;
  background: var(--tb-bg);
  border-left: 1px solid var(--tb-border);
  display: flex; flex-direction: column;
  height: 100%; box-shadow: -4px 0 24px rgba(0,0,0,0.15);
}
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px; border-bottom: 1px solid var(--tb-border);
}
.drawer-title {
  font-size: 15px; font-weight: 800; color: var(--tb-text);
  display: flex; align-items: center; gap: 8px;
}
.drawer-title i { color: #1976d2; }
.drawer-close {
  width: 32px; height: 32px; border: none;
  background: var(--tb-hover); border-radius: 8px;
  color: var(--tb-sub); cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.drawer-close:hover { color: var(--tb-text); }
.drawer-body {
  flex: 1; overflow-y: auto; padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
}
.drawer-footer {
  padding: 16px 20px; border-top: 1px solid var(--tb-border);
  display: flex; justify-content: flex-end; gap: 10px;
}

.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label {
  font-size: 12px; font-weight: 700; color: var(--tb-text);
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
}
.required { color: #dc2626; }
.input-wrap { position: relative; }
.input-icon-right {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: var(--tb-sub); font-size: 13px; pointer-events: none;
}
.toggle-pw {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: var(--tb-sub); font-size: 13px; padding: 4px;
}
.toggle-pw:hover { color: var(--tb-text); }
.field-input {
  width: 100%; box-sizing: border-box; padding: 9px 12px;
  border: 1.5px solid var(--tb-border); border-radius: 9px; font-size: 13px;
  color: var(--tb-text); background: var(--sb-search-bg); outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field-input:focus {
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25,118,210,0.10);
  background: var(--tb-bg);
}
.field-input::placeholder { color: var(--tb-sub); opacity: 0.6; }

.emp-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  border: 1.5px solid var(--tb-border); border-radius: 9px;
  background: var(--tb-bg); max-height: 210px; overflow-y: auto;
  box-shadow: 0 6px 20px rgba(0,0,0,0.13);
  z-index: 100;
}
.emp-option {
  width: 100%; text-align: left; padding: 9px 12px; border: none;
  background: none; cursor: pointer; display: flex; align-items: baseline;
  gap: 7px; font-size: 13px; transition: background 0.15s; flex-wrap: wrap;
  border-bottom: 1px solid var(--tb-border);
}
.emp-option:last-child { border-bottom: none; }
.emp-option:hover { background: var(--sb-hover); }
.emp-option-code {
  font-weight: 700; color: #1976d2;
  background: rgba(25,118,210,0.08);
  padding: 1px 7px; border-radius: 5px;
  font-family: monospace; font-size: 12px; flex-shrink: 0;
}
.emp-option-name { color: var(--tb-text); font-weight: 600; }
.emp-option-dept { font-size: 11px; color: var(--tb-sub); }
.emp-no-result {
  padding: 14px 12px; text-align: center;
  color: var(--tb-sub); font-size: 12px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}

.emp-selected-card {
  margin-top: 6px; padding: 10px 14px;
  background: rgba(25,118,210,0.05);
  border: 1.5px solid rgba(25,118,210,0.18);
  border-radius: 10px;
  display: flex; flex-direction: column; gap: 5px;
}
.emp-selected-row {
  display: flex; align-items: center; gap: 8px; font-size: 12px;
}
.emp-selected-label {
  font-weight: 700; color: var(--tb-sub); min-width: 52px;
}
.emp-selected-val { font-weight: 600; color: var(--tb-text); }
.emp-selected-code {
  font-family: monospace; color: #1976d2;
  background: rgba(25,118,210,0.08);
  padding: 1px 8px; border-radius: 5px;
}

.error-msg {
  display: flex; align-items: center; gap: 7px; padding: 10px 12px;
  background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.20);
  border-radius: 8px; color: #dc2626; font-size: 12px; font-weight: 600;
}

.btn-save {
  display: flex; align-items: center; gap: 7px; padding: 9px 20px;
  background: #1976d2; color: #fff; border: none; border-radius: 9px;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  box-shadow: 0 2px 8px rgba(25,118,210,0.25);
}
.btn-save:hover:not(:disabled) { background: #1565c0; transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-cancel {
  padding: 9px 16px; background: var(--tb-hover); color: var(--tb-sub);
  border: 1.5px solid var(--tb-border); border-radius: 9px;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-cancel:hover { color: var(--tb-text); }

.confirm-overlay {
  position: fixed; inset: 0; z-index: 9998;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.confirm-box {
  background: var(--tb-bg); border-radius: 16px; padding: 28px 24px;
  max-width: 360px; width: 100%;
  box-shadow: 0 8px 40px rgba(0,0,0,0.25);
  text-align: center; border: 1px solid var(--tb-border);
}
.confirm-icon { font-size: 40px; color: #f59e0b; margin-bottom: 12px; }
.confirm-msg {
  font-size: 14px; font-weight: 600; color: var(--tb-text);
  margin-bottom: 20px; line-height: 1.5;
}
.confirm-actions { display: flex; gap: 10px; justify-content: center; }
.btn-confirm-del {
  display: flex; align-items: center; gap: 7px; padding: 9px 20px;
  background: #dc2626; color: #fff; border: none; border-radius: 9px;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s;
}
.btn-confirm-del:hover { background: #b91c1c; }

.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  z-index: 9999; color: #fff; padding: 12px 24px; border-radius: 12px;
  font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: slideUp 0.3s ease;
}
.toast-success { background: #16a34a; }
.toast-error   { background: #dc2626; }
@keyframes slideUp {
  from { opacity: 0; transform: translateX(-50%) translateY(16px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
