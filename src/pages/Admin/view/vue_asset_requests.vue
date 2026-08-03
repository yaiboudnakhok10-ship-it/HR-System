<script setup>
import { useAssetRequestStore } from '@/stores/asset_request.store'
import { onMounted, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import Swal from 'sweetalert2'

const auth = useAuthStore()
const store = useAssetRequestStore()

const searchQuery = ref('')

// ── Drawer ──────────────────────────────────────────────
const drawerOpen = ref(false)
const saving = ref(false)
const editMode = ref(false)
const editId = ref(null)

// ── Delete confirm ───────────────────────────────────────
const deleteConfirmOpen = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)
const deleteError = ref('')

// ── Form ─────────────────────────────────────────────────
const form = ref({
  title: '',
})

// ── Drawer helpers ────────────────────────────────────────
function openDrawer() {
  editMode.value = false
  editId.value = null
  form.value = { title: '' }
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  resetForm()
}

function openEditDrawer(item) {
  editMode.value = true
  editId.value = item.id
  form.value = {
    title: item.title || '',
  }
  drawerOpen.value = true
}

function resetForm() {
  form.value = { title: '' }
  editMode.value = false
  editId.value = null
}

async function submitForm() {
  if (!form.value.title.trim()) return
  saving.value = true
  try {
    if (editMode.value && editId.value) {
      await store.updateRequest(editId.value, {
        title: form.value.title.trim(),
      })
      Swal.fire({ title: 'สำเร็จ!', text: 'แก้ไขข้อมูลแล้ว', icon: 'success', timer: 1500, showConfirmButton: false })
    } else {
      await store.addRequest({
        title: form.value.title.trim(),
        created_by: auth.session?.userId,
      })
      Swal.fire({ title: 'สำเร็จ!', text: 'บันทึกข้อมูลแล้ว', icon: 'success', timer: 1500, showConfirmButton: false })
    }
    closeDrawer()
    store.fetchRequests()
  } catch (e) {
    console.error(e)
    Swal.fire({ title: 'เกิดข้อผิดพลาด', text: e.message, icon: 'error' })
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────
function openDeleteConfirm(item) {
  deleteTarget.value = item
  deleteConfirmOpen.value = true
}

function closeDeleteConfirm() {
  deleteConfirmOpen.value = false
  deleteTarget.value = null
  deleteError.value = ''
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await store.deleteRequest(deleteTarget.value.id)
    store.fetchRequests()
    closeDeleteConfirm()
    Swal.fire({ title: 'ลบสำเร็จ!', text: 'ข้อมูลถูกลบแล้ว', icon: 'success', timer: 1500, showConfirmButton: false })
  } catch (e) {
    deleteError.value = 'เกิดข้อผิดพลาด: ' + e.message
  } finally {
    deleting.value = false
  }
}

// ── Table ─────────────────────────────────────────────────
onMounted(() => store.fetchRequests())

function formatDate(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d)) return val
  return d.toLocaleDateString('th-TH', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const filteredList = computed(() => {
  if (!searchQuery.value.trim()) return store.requests
  const q = searchQuery.value.toLowerCase()
  return store.requests.filter(item =>
    (item.title || '').toLowerCase().includes(q) ||
    (item.system_users?.fullname || '').toLowerCase().includes(q)
  )
})
</script>

<template>
  <div class="page-wrapper">
    <!-- ── Page Header ── -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon-wrap">
          <i class="fa fa-box-archive"></i>
        </div>
        <div>
          <h1 class="page-title">หัวข้อเบิกชับสินบริษัท</h1>
          <p class="page-subtitle">จัดการรายการหัวข้อสำหรับการเบิกทรัพย์สิน</p>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn-add" @click="openDrawer">
          <i class="fa fa-plus"></i>
          <span>เพิ่มหัวข้อใหม่</span>
        </button>
      </div>
    </div>

    <!-- ── Card ── -->
    <div class="card">
      <!-- Toolbar -->
      <div class="card-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <i class="fa fa-magnifying-glass search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหา หัวข้อ, ผู้บันทึก..."
              class="search-input"
            />
          </div>
        </div>
        <div class="toolbar-right">
          <div class="count-chip">
            <span>ทั้งหมด <strong>{{ store.requests.length }}</strong> รายการ</span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="doc-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th>หัวข้อเบิกทรัพย์สิน</th>
              <th>ผู้บันทึก</th>
              <th>วันที่บันทึก</th>
              <th class="th-actions">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="5" class="state-cell">กำลังโหลดข้อมูล...</td>
            </tr>
            <tr v-else-if="filteredList.length === 0">
              <td colspan="5" class="state-cell">ไม่พบข้อมูล</td>
            </tr>
            <tr v-for="(item, idx) in filteredList" :key="item.id">
              <td class="td-num">{{ idx + 1 }}</td>
              <td class="font-bold">{{ item.title }}</td>
              <td>{{ item.system_users?.fullname || '-' }}</td>
              <td>{{ formatDate(item.created_at) }}</td>
              <td class="td-actions">
                <div class="actions-wrap">
                  <button class="btn-action btn-edit" @click="openEditDrawer(item)" title="แก้ไข">
                    <i class="fa fa-pen-to-square"></i>
                  </button>
                  <button class="btn-action btn-delete" @click="openDeleteConfirm(item)" title="ลบ">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Drawer ── -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="drawerOpen" class="drawer-overlay" @click="closeDrawer"></div>
      </transition>
      <transition name="slide">
        <div v-if="drawerOpen" class="drawer-panel">
          <div class="drawer-header">
            <h3>{{ editMode ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อใหม่' }}</h3>
            <button @click="closeDrawer"><i class="fa fa-times"></i></button>
          </div>
          <div class="drawer-body">
            <div class="form-group">
              <label>ชื่อหัวข้อเบิกทรัพย์สิน <span class="text-red-500">*</span></label>
              <input v-model="form.title" type="text" class="form-input" placeholder="ระบุชื่อหัวข้อ..." @keyup.enter="submitForm" />
            </div>
          </div>
          <div class="drawer-footer">
            <button class="btn-cancel" @click="closeDrawer">ยกเลิก</button>
            <button class="btn-save" @click="submitForm" :disabled="saving || !form.title.trim()">
              <i v-if="saving" class="fa fa-spinner fa-spin"></i>
              {{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}
            </button>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ── Delete Modal ── -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="deleteConfirmOpen" class="modal-overlay" @click="closeDeleteConfirm">
          <div class="modal-box" @click.stop>
            <i class="fa fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
            <h3>ยืนยันการลบ</h3>
            <p>คุณต้องการลบหัวข้อ <strong>{{ deleteTarget?.title }}</strong> ใช่หรือไม่?</p>
            <div class="modal-actions mt-6">
              <button class="btn-cancel" @click="closeDeleteConfirm">ยกเลิก</button>
              <button class="btn-delete-confirm" @click="confirmDelete" :disabled="deleting">
                {{ deleting ? 'กำลังลบ...' : 'ยืนยันการลบ' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.page-wrapper { padding: 0; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-header-left { display: flex; align-items: center; gap: 15px; }
.page-icon-wrap { width: 45px; height: 45px; background: #1976d2; color: white; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 20px; }
.page-title { font-size: 20px; font-weight: 800; margin: 0; }
.page-subtitle { font-size: 13px; color: #666; margin: 0; }

.btn-add { background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-add:hover { background: #1565c0; }

.card { background: white; border-radius: 12px; border: 1px solid #e0e0e0; overflow: hidden; }
.card-toolbar { padding: 15px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
.search-box { position: relative; width: 300px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999; }
.search-input { width: 100%; padding: 8px 12px 8px 35px; border: 1px solid #ddd; border-radius: 8px; outline: none; }
.count-chip { background: #f5f5f5; padding: 5px 12px; border-radius: 20px; font-size: 12px; }

.table-wrapper { width: 100%; overflow-x: auto; }
.doc-table { width: 100%; border-collapse: collapse; }
.doc-table th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; color: #666; border-bottom: 1px solid #eee; }
.doc-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
.th-num { width: 50px; text-align: center; }
.td-num { text-align: center; color: #999; }
.th-actions { width: 100px; text-align: center; }
.td-actions { text-align: center; }
.actions-wrap { display: flex; justify-content: center; gap: 8px; }
.btn-action { border: none; background: none; cursor: pointer; width: 32px; height: 32px; border-radius: 6px; transition: all 0.2s; }
.btn-edit { color: #1976d2; background: rgba(25, 118, 210, 0.1); }
.btn-edit:hover { background: #1976d2; color: white; }
.btn-delete { color: #dc2626; background: rgba(220, 38, 38, 0.1); }
.btn-delete:hover { background: #dc2626; color: white; }

.state-cell { padding: 40px !important; text-align: center; color: #999; }

/* Drawer & Modal Styles */
.drawer-overlay, .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; justify-content: center; align-items: center; }
.drawer-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; background: white; z-index: 10001; display: flex; flex-direction: column; box-shadow: -5px 0 15px rgba(0,0,0,0.1); }
.drawer-header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
.drawer-header h3 { margin: 0; font-size: 18px; }
.drawer-header button { border: none; background: none; font-size: 20px; cursor: pointer; color: #999; }
.drawer-body { padding: 20px; flex: 1; }
.drawer-footer { padding: 20px; border-top: 1px solid #eee; display: flex; gap: 10px; justify-content: flex-end; }

.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #444; }
.form-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; outline: none; }
.form-input:focus { border-color: #1976d2; }

.btn-save { background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-cancel { background: #f5f5f5; color: #666; border: 1px solid #ddd; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }

.modal-box { background: white; padding: 30px; border-radius: 15px; width: 400px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
.btn-delete-confirm { background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 0.3s; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

.text-red-500 { color: #dc2626; }
.font-bold { font-weight: 700; }
</style>
