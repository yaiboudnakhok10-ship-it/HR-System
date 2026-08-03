<script setup>
import { computed, onMounted, ref } from 'vue'
import Swal from 'sweetalert2'
import { useAuthStore } from '@/stores/auth.store'
import { useTopicRecordsStore } from '@/stores/topic_records.store'

const auth = useAuthStore()
const store = useTopicRecordsStore()

const searchQuery = ref('')

const drawerOpen = ref(false)
const saving = ref(false)
const editMode = ref(false)
const editId = ref(null)

const form = ref({
  topic: '',
})

const currentRecorder = computed(() => auth.session?.fullname || auth.session?.username || 'unknown')

const filteredList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return store.topic_records
  return (store.topic_records || []).filter(row => {
    return (
      String(row.topic || '').toLowerCase().includes(q) ||
      String(row.recorded_by || '').toLowerCase().includes(q)
    )
  })
})

function openDrawer() {
  editMode.value = false
  editId.value = null
  form.value = { topic: '' }
  drawerOpen.value = true
}

function openEditDrawer(row) {
  editMode.value = true
  editId.value = row.id
  form.value = { topic: row.topic || '' }
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  editMode.value = false
  editId.value = null
  form.value = { topic: '' }
}

function formatDateTime(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d)) return String(val)
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

async function submitForm() {
  const topic = form.value.topic.trim()
  if (!topic) {
    await Swal.fire({ icon: 'warning', title: 'แจ้งเตือน', text: 'กรุณากรอกชื่อประเภทการเตือน', confirmButtonText: 'ตกลง' })
    return
  }

  saving.value = true
  try {
    if (editMode.value && editId.value) {
      await store.updateTopicRecord(editId.value, { topic })
      await Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกการแก้ไขเรียบร้อย', timer: 1400, showConfirmButton: false })
    } else {
      await store.addTopicRecord({
        topic,
        recorded_by: currentRecorder.value,
        recorded_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      })
      await Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'เพิ่มข้อมูลเรียบร้อย', timer: 1400, showConfirmButton: false })
    }
    closeDrawer()
    await store.getTopicRecords()
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message || String(e), confirmButtonText: 'ตกลง' })
  } finally {
    saving.value = false
  }
}

async function confirmDelete(row) {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'ยืนยันการลบ',
    html: `ต้องการลบ <b>${row.topic || '-'}</b> ใช่หรือไม่?`,
    showCancelButton: true,
    confirmButtonText: 'ลบข้อมูล',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#ef4444',
  })
  if (!result.isConfirmed) return

  try {
    await store.deleteTopicRecord(row.id)
    await store.getTopicRecords()
    await Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1200, showConfirmButton: false })
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message || String(e), confirmButtonText: 'ตกลง' })
  }
}

onMounted(async () => {
  await store.getTopicRecords()
  if (store.error) {
    await Swal.fire({ icon: 'error', title: 'โหลดข้อมูลไม่สำเร็จ', text: store.error, confirmButtonText: 'ตกลง' })
  }
})
</script>

<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon-wrap">
          <i class="fa fa-triangle-exclamation"></i>
        </div>
        <div>
          <h1 class="page-title">ประเภทการเตือน</h1>
          <p class="page-subtitle">จัดการข้อมูลประเภทการเตือนทั้งหมด</p>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn-add" type="button" @click="openDrawer">
          <i class="fa fa-plus"></i>
          <span>เพิ่มประเภทการเตือน</span>
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <i class="fa fa-magnifying-glass search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหา ชื่อประเภท, ผู้บันทึก..."
              class="search-input"
            />
            <button v-if="searchQuery" class="search-clear" type="button" @click="searchQuery = ''">
              <i class="fa fa-xmark"></i>
            </button>
          </div>

          <transition name="fade">
            <div class="result-chip" v-if="searchQuery">
              <i class="fa fa-filter-circle-xmark"></i>
              พบ <strong>{{ filteredList.length }}</strong> รายการ
            </div>
          </transition>
        </div>

        <div class="toolbar-right">
          <div class="count-chip">
            <i class="fa fa-list"></i>
            <span>ทั้งหมด <strong>{{ store.topic_records.length }}</strong> รายการ</span>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="doc-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th>ชื่อประเภทการเตือน</th>
              <th>ผู้บันทึก</th>
              <th>บันทึกเมื่อ</th>
              <th class="th-actions">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="5" class="state-cell">
                <div class="state-content">
                  <div class="spinner"></div>
                  <span>กำลังโหลดข้อมูล...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredList.length === 0">
              <td colspan="5" class="state-cell">
                <div class="state-content empty">
                  <div class="empty-icon-wrap">
                    <i class="fa fa-triangle-exclamation"></i>
                  </div>
                  <span class="empty-title">{{ searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่พบข้อมูลประเภทการเตือน' }}</span>
                  <span class="empty-sub" v-if="searchQuery">ลองใช้คำค้นหาอื่น หรือล้างตัวกรอง</span>
                  <button v-else class="btn-add-empty" type="button" @click="openDrawer">
                    <i class="fa fa-plus"></i> เพิ่มประเภทการเตือนรายการแรก
                  </button>
                </div>
              </td>
            </tr>

            <tr v-else v-for="(row, idx) in filteredList" :key="row.id" class="data-row">
              <td class="td-num">{{ idx + 1 }}</td>
              <td>
                <div class="cell-name">
                  <div class="avatar-circle">
                    <i class="fa fa-triangle-exclamation"></i>
                  </div>
                  <span class="name-text">{{ row.topic || '—' }}</span>
                </div>
              </td>
              <td>
                <span class="creator-tag" v-if="row.recorded_by">
                  <i class="fa fa-circle-user"></i>{{ row.recorded_by }}
                </span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <div class="date-cell">
                  <i class="fa fa-clock date-icon"></i>
                  <span>{{ formatDateTime(row.recorded_at) }}</span>
                </div>
              </td>
              <td class="td-actions">
                <div class="actions-wrap">
                  <button class="btn-action btn-edit" type="button" title="แก้ไข" @click="openEditDrawer(row)">
                    <i class="fa fa-pen-to-square"></i>
                  </button>
                  <button class="btn-action btn-delete" type="button" title="ลบ" @click="confirmDelete(row)">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <transition name="overlay-fade">
      <div class="drawer-overlay" v-if="drawerOpen" @click="closeDrawer"></div>
    </transition>

    <transition name="drawer-slide">
      <div class="drawer-panel" v-if="drawerOpen">
        <div class="drawer-header">
          <div class="drawer-header-left">
            <div class="drawer-icon" :class="{ 'drawer-icon-edit': editMode }">
              <i :class="editMode ? 'fa fa-pen-to-square' : 'fa fa-plus'"></i>
            </div>
            <div>
              <h2 class="drawer-title">{{ editMode ? 'แก้ไขประเภทการเตือน' : 'เพิ่มประเภทการเตือนใหม่' }}</h2>
              <p class="drawer-sub">{{ editMode ? 'แก้ไขข้อมูลแล้วกดบันทึก' : 'กรอกข้อมูลให้ครบถ้วนแล้วกดบันทึก' }}</p>
            </div>
          </div>
          <button class="drawer-close" type="button" @click="closeDrawer" title="ปิด">
            <i class="fa fa-xmark"></i>
          </button>
        </div>

        <div class="drawer-body">
          <div class="form-section">
            <div class="form-section-label">
              <i class="fa fa-triangle-exclamation"></i> ข้อมูลประเภทการเตือน
            </div>
            <div class="form-group">
              <label class="form-label required">ชื่อประเภทการเตือน</label>
              <input
                v-model="form.topic"
                type="text"
                class="form-input"
                placeholder="ระบุชื่อประเภทการเตือน..."
              />
              <div class="field-hint">
                ผู้บันทึกจะถูกบันทึกอัตโนมัติจากผู้ใช้งานที่ล็อกอิน
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-footer">
          <button class="btn-cancel" type="button" @click="closeDrawer">
            <i class="fa fa-xmark"></i> ยกเลิก
          </button>
          <button class="btn-save" type="button" @click="submitForm" :disabled="!form.topic.trim() || saving">
            <span v-if="saving" class="btn-spinner"></span>
            <i v-else class="fa fa-floppy-disk"></i>
            {{ saving ? 'กำลังบันทึก...' : (editMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล') }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@font-face {
  font-family: 'Noto Serif Lao';
  src: url('../fonts/NotoSerifLao-Regular.ttf') format('truetype');
  font-weight: 400;
}
@font-face {
  font-family: 'Noto Serif Lao';
  src: url('../fonts/NotoSerifLao-Regular.ttf') format('truetype');
  font-weight: 700;
}

.page-wrapper { padding: 0; font-family: 'Noto Serif Lao', 'Nunito', 'Barlow', sans-serif; position: relative; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-header-left { display: flex; align-items: center; gap: 14px; }
.page-icon-wrap { width: 44px; height: 44px; border-radius: 12px; background: var(--accent); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px var(--accent-glow); flex-shrink: 0; }
.page-icon-wrap i { color: #fff; font-size: 18px; }
.page-title { font-size: 18px; font-weight: 800; color: var(--tb-text); line-height: 1.2; margin: 0; transition: color 0.3s; }
.page-subtitle { font-size: 12px; color: var(--tb-sub); margin: 2px 0 0; transition: color 0.3s; }

.btn-add { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; box-shadow: 0 4px 14px var(--accent-glow); transition: all 0.2s; }
.btn-add:hover { background: var(--accent-dark); transform: translateY(-1px); }
.btn-add i { font-size: 12px; }

.card { background: var(--tb-bg); border: 1px solid var(--tb-border); border-radius: 14px; box-shadow: var(--shadow-sm); overflow: hidden; transition: background 0.3s, border-color 0.3s; }
.card-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--tb-border); flex-wrap: wrap; transition: border-color 0.3s; }
.toolbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; }
.toolbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.search-box { position: relative; min-width: 200px; max-width: 340px; flex: 1; }
.search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--tb-sub); font-size: 13px; pointer-events: none; }
.search-input { width: 100%; padding: 8px 32px 8px 34px; border: 1.5px solid var(--tb-border); border-radius: 8px; font-size: 12.5px; font-family: inherit; font-weight: 600; background: var(--sb-search-bg); color: var(--tb-text); outline: none; transition: all 0.2s; }
.search-input:focus { border-color: var(--accent); background: var(--tb-bg); box-shadow: 0 0 0 3px var(--accent-glow2); }
.search-input::placeholder { color: var(--tb-sub); font-weight: 500; }
.search-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--tb-sub); font-size: 12px; padding: 3px; border-radius: 4px; transition: color 0.2s; }
.search-clear:hover { color: #ef4444; }
.result-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; background: rgba(25,118,210,0.08); border: 1px solid rgba(25,118,210,0.18); border-radius: 20px; font-size: 12px; font-weight: 600; color: var(--accent); white-space: nowrap; }
.count-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; background: var(--sb-search-bg); border: 1px solid var(--tb-border); border-radius: 20px; font-size: 12px; font-weight: 600; color: var(--tb-sub); white-space: nowrap; }

.table-wrapper { overflow-x: auto; }
.doc-table { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 680px; }
.doc-table thead tr { background: var(--sb-search-bg); border-bottom: 2px solid var(--tb-border); }
.doc-table th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 800; color: var(--tb-sub); text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
.th-num { width: 44px; text-align: center; }
.doc-table tbody tr { border-bottom: 1px solid var(--tb-border); transition: background 0.15s; }
.doc-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--sb-hover); }
.doc-table td { padding: 11px 14px; color: var(--tb-text); vertical-align: middle; }
.td-num { text-align: center; font-size: 11.5px; font-weight: 700; color: var(--tb-sub); }
.cell-name { display: flex; align-items: center; gap: 9px; }
.avatar-circle { width: 30px; height: 30px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px var(--accent-glow); }
.name-text { font-weight: 700; color: var(--tb-text); }
.creator-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--tb-sub); }
.date-cell { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--tb-sub); font-weight: 600; white-space: nowrap; }
.date-icon { font-size: 11px; opacity: 0.5; }
.null-dash { color: var(--tb-border); font-size: 14px; }
.state-cell { padding: 0 !important; }
.state-content { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 52px 24px; color: var(--tb-sub); font-size: 13px; font-weight: 600; }
.empty-icon-wrap { width: 52px; height: 52px; border-radius: 50%; background: var(--sb-search-bg); border: 2px dashed var(--tb-border); display: flex; align-items: center; justify-content: center; }
.empty-icon-wrap i { font-size: 20px; color: var(--tb-sub); opacity: 0.5; }
.empty-title { font-size: 13.5px; font-weight: 700; color: var(--tb-text); }
.empty-sub { font-size: 12px; color: var(--tb-sub); }
.btn-add-empty { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; margin-top: 4px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-size: 12.5px; font-weight: 700; font-family: inherit; cursor: pointer; transition: background 0.2s; }
.btn-add-empty:hover { background: var(--accent-dark); }
.spinner { width: 28px; height: 28px; border: 3px solid var(--tb-border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.th-actions { text-align: center; width: 90px; }
.td-actions { text-align: center; }
.actions-wrap { display: inline-flex; align-items: center; gap: 6px; }
.btn-action { width: 30px; height: 30px; border-radius: 7px; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; transition: all 0.18s; }
.btn-edit { background: rgba(25,118,210,0.1); color: var(--accent); border: 1px solid rgba(25,118,210,0.2); }
.btn-edit:hover { background: var(--accent); color: #fff; transform: translateY(-1px); }
.btn-delete { background: rgba(239,68,68,0.10); color: #ef4444; border: 1px solid rgba(239,68,68,0.18); }
.btn-delete:hover { background: #ef4444; color: #fff; transform: translateY(-1px); }

.overlay-fade-enter-active, .overlay-fade-leave-active { transition: opacity 0.18s ease; }
.overlay-fade-enter-from, .overlay-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.22s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }

.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.30); z-index: 400; }
.drawer-panel { position: fixed; right: 0; top: 0; height: 100vh; width: 420px; max-width: calc(100vw - 16px); background: var(--tb-bg); border-left: 1px solid var(--tb-border); z-index: 500; box-shadow: 0 8px 30px rgba(0,0,0,0.18); display: flex; flex-direction: column; transition: background 0.3s, border-color 0.3s; }
.drawer-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--tb-border); }
.drawer-header-left { display: flex; align-items: center; gap: 12px; }
.drawer-icon { width: 40px; height: 40px; border-radius: 12px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px var(--accent-glow); }
.drawer-icon-edit { background: #f59e0b; box-shadow: 0 4px 14px rgba(245,158,11,0.25); }
.drawer-title { font-size: 14px; font-weight: 800; color: var(--tb-text); margin: 0; }
.drawer-sub { font-size: 11.5px; color: var(--tb-sub); margin: 2px 0 0; }
.drawer-close { width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--tb-border); background: transparent; cursor: pointer; color: var(--tb-sub); display: inline-flex; align-items: center; justify-content: center; transition: background 0.15s, color 0.15s, border-color 0.15s; }
.drawer-close:hover { background: var(--sb-hover); color: var(--tb-text); }
.drawer-body { padding: 16px; overflow: auto; flex: 1; }
.form-section { background: var(--sb-search-bg); border: 1px solid var(--tb-border); border-radius: 12px; padding: 12px; }
.form-section-label { font-size: 12px; font-weight: 800; color: var(--tb-text); display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.form-section-label i { color: var(--accent); }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 12px; font-weight: 700; color: var(--tb-text); }
.form-label.required::after { content: ' *'; color: #ef4444; }
.form-input { width: 100%; padding: 10px 12px; border: 1.5px solid var(--tb-border); border-radius: 10px; font-size: 13px; font-weight: 600; font-family: inherit; background: var(--tb-bg); color: var(--tb-text); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
.form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow2); }
.field-hint { font-size: 11.5px; color: var(--tb-sub); line-height: 1.35; }
.drawer-footer { padding: 12px 16px; border-top: 1px solid var(--tb-border); display: flex; justify-content: flex-end; gap: 8px; background: var(--tb-bg); }
.btn-cancel { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 10px; border: 1px solid var(--tb-border); background: transparent; color: var(--tb-text); font-weight: 800; font-size: 12.5px; cursor: pointer; font-family: inherit; transition: background 0.15s, border-color 0.15s; }
.btn-cancel:hover { background: var(--sb-hover); }
.btn-save { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 10px; border: none; background: var(--accent); color: #fff; font-weight: 800; font-size: 12.5px; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px var(--accent-glow); transition: background 0.2s, transform 0.2s, opacity 0.2s; }
.btn-save:hover { background: var(--accent-dark); transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
