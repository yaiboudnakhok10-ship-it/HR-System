<script setup>
import { empSignatures } from '../stores/empSignatures.store'
import { onMounted, ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth.store'
const auth = useAuthStore()

const store = empSignatures()
const searchQuery = ref('')

// ── Drawer ──────────────────────────────────────────────
const drawerOpen = ref(false)
const saving     = ref(false)
const editMode   = ref(false)
const editId     = ref(null)

// ── Delete confirm ───────────────────────────────────────
const deleteConfirmOpen = ref(false)
const deleteTarget      = ref(null)
const deleting          = ref(false)
const deleteError       = ref('')

const form = ref({
  signature_name:  '',
  signature_image: '',
  responsibility:  '',
})

// ── Signature Upload ─────────────────────────────────────
const sigPreview     = ref(null)
const sigFileInput   = ref(null)
const sigUploading   = ref(false)
const sigUploadError = ref('')

async function onSigFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => { sigPreview.value = ev.target.result }
  reader.readAsDataURL(file)

  sigUploading.value   = true
  sigUploadError.value = ''

  try {
    const ext      = file.name.split('.').pop()
    const filename = `sig_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('signatures')
      .upload(filename, file, { upsert: true })

    if (upErr) throw upErr

    const { data } = supabase.storage
      .from('signatures')
      .getPublicUrl(filename)

    form.value.signature_image = data.publicUrl
  } catch (err) {
    sigUploadError.value       = 'อัปโหลดไม่สำเร็จ: ' + err.message
    form.value.signature_image = ''
    sigPreview.value           = null
  } finally {
    sigUploading.value = false
  }
}

function removeSig() {
  sigPreview.value           = null
  form.value.signature_image = ''
  sigUploadError.value       = ''
  if (sigFileInput.value) sigFileInput.value.value = ''
}

// ── Drawer helpers ────────────────────────────────────────
function openDrawer()  { editMode.value = false; editId.value = null; drawerOpen.value = true }
function closeDrawer() { drawerOpen.value = false; resetForm() }

function openEditDrawer(item) {
  editMode.value = true
  editId.value   = item.id
  form.value = {
    signature_name:  item.signature_name  || '',
    signature_image: item.signature_image || '',
    responsibility:  item.responsibility  || '',
  }
  sigPreview.value = item.signature_image || null
  drawerOpen.value = true
}

function resetForm() {
  form.value = { signature_name: '', signature_image: '', responsibility: '' }
  sigPreview.value      = null
  sigUploadError.value  = ''
  editMode.value        = false
  editId.value          = null
  if (sigFileInput.value) sigFileInput.value.value = ''
}

async function submitForm() {
  if (!form.value.signature_name) return
  saving.value = true
  try {
    if (editMode.value && editId.value) {
      await store.updateSignature(editId.value, form.value)
    } else {
      await store.addSignature({
        ...form.value,
        created_by: auth.session?.fullname || auth.session?.username || null, // ✅
        created_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // ✅ UTC+7
      })
    }
    closeDrawer()
    store.getSignatures()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────
function openDeleteConfirm(item) {
  deleteTarget.value      = item
  deleteConfirmOpen.value = true
}
function closeDeleteConfirm() {
  deleteConfirmOpen.value = false
  deleteTarget.value      = null
  deleteError.value       = ''
}
async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value    = true
  deleteError.value = ''
  try {
    await store.deleteSignature(deleteTarget.value.id)
    store.getSignatures()
    closeDeleteConfirm()
  } catch (e) {
    if (e.message === 'FK_VIOLATION') {
      deleteError.value = 'ไม่สามารถลบได้ เนื่องจากข้อมูลนี้ถูกใช้งานอยู่ในระบบ'
    } else {
      deleteError.value = 'เกิดข้อผิดพลาด: ' + e.message
    }
  } finally {
    deleting.value = false
  }
}

// ── Table ─────────────────────────────────────────────────
onMounted(() => store.getSignatures())

function formatDate(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d)) return val
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const filteredSignatures = computed(() => {
  if (!searchQuery.value.trim()) return store.signatures
  const q = searchQuery.value.toLowerCase()
  return store.signatures.filter(item =>
    (item.signature_name || '').toLowerCase().includes(q) ||
    (item.responsibility || '').toLowerCase().includes(q) ||
    (item.created_by     || '').toLowerCase().includes(q)
  )
})
</script>

<template>
  <div class="page-wrapper">

    <!-- ── Page Header ── -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon-wrap">
          <i class="fa fa-signature"></i>
        </div>
        <div>
          <h1 class="page-title">ลายเช็นพนักงาน</h1>
          <p class="page-subtitle">จัดการข้อมูลลายเช็นพนักงานทั้งหมดในระบบ</p>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn-add" @click="openDrawer">
          <i class="fa fa-plus"></i>
          <span>เพิ่มลายเช็น</span>
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
              placeholder="ค้นหา ชื่อ, ความรับผิดชอบ, ผู้สร้าง..."
              class="search-input"
            />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <i class="fa fa-xmark"></i>
            </button>
          </div>
          <transition name="fade">
            <div class="result-chip" v-if="searchQuery">
              <i class="fa fa-filter-circle-xmark"></i>
              พบ <strong>{{ filteredSignatures.length }}</strong> รายการ
            </div>
          </transition>
        </div>
        <div class="toolbar-right">
          <div class="count-chip">
            <i class="fa fa-list"></i>
            <span>ทั้งหมด <strong>{{ store.signatures.length }}</strong> รายการ</span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="sig-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th>ชื่อลายเช็น</th>
              <th>รูปภาพลายเช็น</th>
              <th>ความรับผิดชอบ</th>
              <th>ผู้สร้าง</th>
              <th>วันที่สร้าง</th>
              <th class="th-actions">จัดการ</th>
            </tr>
          </thead>
          <tbody>

            <tr v-if="store.loading">
              <td colspan="7" class="state-cell">
                <div class="state-content">
                  <div class="spinner"></div>
                  <span>กำลังโหลดข้อมูล...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredSignatures.length === 0">
              <td colspan="7" class="state-cell">
                <div class="state-content empty">
                  <div class="empty-icon-wrap">
                    <i class="fa fa-file-circle-xmark"></i>
                  </div>
                  <span class="empty-title">{{ searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่พบข้อมูลลายเช็น' }}</span>
                  <span class="empty-sub" v-if="searchQuery">ลองใช้คำค้นหาอื่น หรือล้างตัวกรอง</span>
                  <button v-else class="btn-add-empty" @click="openDrawer">
                    <i class="fa fa-plus"></i> เพิ่มลายเช็นรายการแรก
                  </button>
                </div>
              </td>
            </tr>

            <tr v-else v-for="(item, idx) in filteredSignatures" :key="item.id" class="data-row">
              <td class="td-num">{{ idx + 1 }}</td>
              <td>
                <div class="cell-name">
                  <div class="avatar-circle">
                    <i class="fa fa-signature"></i>
                  </div>
                  <span class="name-text">{{ item.signature_name || '—' }}</span>
                </div>
              </td>
              <td>
                <div class="sig-cell">
                  <img
                    v-if="item.signature_image && item.signature_image.startsWith('http')"
                    :src="item.signature_image"
                    class="sig-thumb"
                    alt="ลายเช็น"
                  />
                  <span v-else class="null-dash">—</span>
                </div>
              </td>
              <td class="cell-detail">
                <span v-if="item.responsibility" class="detail-text">{{ item.responsibility }}</span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <span class="creator-tag" v-if="item.created_by">
                  <i class="fa fa-circle-user"></i>{{ item.created_by }}
                </span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <div class="date-cell">
                  <i class="fa fa-clock date-icon"></i>
                  <span>{{ formatDate(item.created_at) }}</span>
                </div>
              </td>
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

      <!-- Footer -->
      <div class="card-footer" v-if="!store.loading && filteredSignatures.length > 0">
        <span class="footer-info"></span>
      </div>

    </div>

    <!-- ════ DRAWER OVERLAY ════ -->
    <transition name="overlay-fade">
      <div class="drawer-overlay" v-if="drawerOpen" @click="closeDrawer"></div>
    </transition>

    <!-- ════ DELETE CONFIRM MODAL ════ -->
    <transition name="overlay-fade">
      <div class="modal-overlay" v-if="deleteConfirmOpen" @click="closeDeleteConfirm">
        <transition name="modal-pop">
          <div class="modal-box" v-if="deleteConfirmOpen" @click.stop>
            <div class="modal-icon-wrap">
              <i class="fa fa-triangle-exclamation"></i>
            </div>
            <h3 class="modal-title">ยืนยันการลบ</h3>
            <p class="modal-desc">
              คุณต้องการลบลายเช็น<br/>
              <strong>{{ deleteTarget?.signature_name }}</strong> ใช่หรือไม่?<br/>
              <span class="modal-warn">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
            </p>
            <div v-if="deleteError" class="delete-error-box">
              <i class="fa fa-circle-exclamation"></i>
              <span>{{ deleteError }}</span>
            </div>
            <div class="modal-actions">
              <button class="btn-cancel" @click="closeDeleteConfirm">
                <i class="fa fa-xmark"></i> ยกเลิก
              </button>
              <button class="btn-delete-confirm" @click="confirmDelete" :disabled="deleting">
                <span v-if="deleting" class="btn-spinner"></span>
                <i v-else class="fa fa-trash"></i>
                {{ deleting ? 'กำลังลบ...' : 'ลบข้อมูล' }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- ════ DRAWER PANEL ════ -->
    <transition name="drawer-slide">
      <div class="drawer-panel" v-if="drawerOpen">

        <!-- Header -->
        <div class="drawer-header">
          <div class="drawer-header-left">
            <div class="drawer-icon" :class="{ 'drawer-icon-edit': editMode }">
              <i :class="editMode ? 'fa fa-pen-to-square' : 'fa fa-plus'"></i>
            </div>
            <div>
              <h2 class="drawer-title">{{ editMode ? 'แก้ไขลายเช็น' : 'เพิ่มลายเช็นใหม่' }}</h2>
              <p class="drawer-sub">{{ editMode ? 'แก้ไขข้อมูลแล้วกดบันทึก' : 'กรอกข้อมูลให้ครบถ้วนแล้วกดบันทึก' }}</p>
            </div>
          </div>
          <button class="drawer-close" @click="closeDrawer" title="ปิด">
            <i class="fa fa-xmark"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="drawer-body">

          <!-- ชื่อลายเช็น -->
          <div class="form-section">
            <div class="form-section-label">
              <i class="fa fa-signature"></i> ข้อมูลลายเช็น
            </div>
            <div class="form-group">
              <label class="form-label required">ชื่อลายเช็น</label>
              <input
                v-model="form.signature_name"
                type="text"
                class="form-input"
                placeholder="ระบุชื่อลายเช็น..."
              />
            </div>
          </div>

          <!-- รูปภาพลายเช็น -->
          <div class="form-section">
            <div class="form-section-label">
              <i class="fa fa-image"></i> รูปภาพลายเช็น
            </div>
            <div
              class="sig-upload-zone"
              :class="{
                'has-preview': sigPreview || form.signature_image,
                'is-uploading': sigUploading
              }"
              @click="!sigUploading && sigFileInput?.click()"
              @dragover.prevent
              @drop.prevent="e => !sigUploading && onSigFileChange({ target: { files: e.dataTransfer.files } })"
            >
              <template v-if="sigUploading">
                <div class="sig-upload-icon">
                  <div class="spinner" style="width:22px;height:22px;border-width:2.5px;"></div>
                </div>
                <span class="sig-upload-text">กำลังอัปโหลด...</span>
              </template>

              <template v-else-if="!sigPreview && !form.signature_image">
                <div class="sig-upload-icon"><i class="fa fa-cloud-arrow-up"></i></div>
                <span class="sig-upload-text">คลิกหรือลากไฟล์ภาพลายเช็นมาวาง</span>
                <span class="sig-upload-hint">PNG, JPG, SVG ขนาดไม่เกิน 2MB</span>
              </template>

              <template v-else>
                <img :src="sigPreview || form.signature_image" class="sig-preview-img" alt="signature preview" />
                <button class="sig-remove-btn" type="button" @click.stop="removeSig" title="ลบ/เปลี่ยน">
                  <i class="fa fa-pen"></i>
                </button>
              </template>
            </div>

            <div v-if="sigUploadError" class="sig-error-box">
              <i class="fa fa-circle-exclamation"></i>
              <span>{{ sigUploadError }}</span>
            </div>

            <input ref="sigFileInput" type="file" accept="image/*" style="display:none" @change="onSigFileChange" />
          </div>

          <!-- ความรับผิดชอบ -->
          <div class="form-section">
            <div class="form-section-label">
              <i class="fa fa-note-sticky"></i> ความรับผิดชอบ
            </div>
            <textarea
              v-model="form.responsibility"
              class="form-textarea"
              rows="4"
              placeholder="ระบุความรับผิดชอบ (ถ้ามี)"
            ></textarea>
          </div>

        </div>

        <!-- Footer -->
        <div class="drawer-footer">
          <button class="btn-cancel" @click="closeDrawer">
            <i class="fa fa-xmark"></i> ยกเลิก
          </button>
          <button
            class="btn-save"
            @click="submitForm"
            :disabled="!form.signature_name || saving || sigUploading"
          >
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
.page-wrapper { padding: 0; font-family: 'Nunito', 'Barlow', sans-serif; position: relative; }
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
.sig-table { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 700px; }
.sig-table thead tr { background: var(--sb-search-bg); border-bottom: 2px solid var(--tb-border); }
.sig-table th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 800; color: var(--tb-sub); text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
.th-num { width: 44px; text-align: center; }
.sig-table tbody tr { border-bottom: 1px solid var(--tb-border); transition: background 0.15s; }
.sig-table tbody tr:last-child { border-bottom: none; }
.data-row:hover { background: var(--sb-hover); }
.sig-table td { padding: 11px 14px; color: var(--tb-text); vertical-align: middle; }
.td-num { text-align: center; font-size: 11.5px; font-weight: 700; color: var(--tb-sub); }

.cell-name { display: flex; align-items: center; gap: 9px; }
.avatar-circle { width: 30px; height: 30px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px var(--accent-glow); }
.name-text { font-weight: 700; color: var(--tb-text); }
.sig-cell { display: flex; align-items: center; }
.sig-thumb { height: 32px; max-width: 90px; object-fit: contain; border-radius: 5px; border: 1px solid var(--tb-border); background: var(--sb-search-bg); padding: 2px 4px; transition: border-color 0.2s, transform 0.2s; cursor: zoom-in; }
.sig-thumb:hover { border-color: var(--accent); transform: scale(1.08); }
.cell-detail { max-width: 260px; }
.detail-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 12px; color: var(--tb-sub); font-weight: 500; line-height: 1.5; }
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
.card-footer { padding: 10px 16px; border-top: 1px solid var(--tb-border); background: var(--sb-search-bg); }

.th-actions { text-align: center; width: 90px; }
.td-actions { text-align: center; }
.actions-wrap { display: inline-flex; align-items: center; gap: 6px; }
.btn-action { width: 30px; height: 30px; border-radius: 7px; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; transition: all 0.18s; }
.btn-edit { background: rgba(25,118,210,0.1); color: var(--accent); border: 1px solid rgba(25,118,210,0.2); }
.btn-edit:hover { background: var(--accent); color: #fff; transform: translateY(-1px); }
.btn-delete { background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.18); }
.btn-delete:hover { background: #ef4444; color: #fff; transform: translateY(-1px); }

.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(2px); z-index: 400; }
.drawer-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 100vw; background: var(--tb-bg); border-left: 1px solid var(--tb-border); box-shadow: -8px 0 40px rgba(0,0,0,0.14); z-index: 500; display: flex; flex-direction: column; overflow: hidden; }
.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--tb-border); flex-shrink: 0; }
.drawer-header-left { display: flex; align-items: center; gap: 12px; }
.drawer-icon { width: 38px; height: 38px; border-radius: 10px; background: var(--accent); display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px var(--accent-glow); flex-shrink: 0; }
.drawer-icon i { color: #fff; font-size: 15px; }
.drawer-icon-edit { background: #f59e0b; box-shadow: 0 3px 10px rgba(245,158,11,0.35); }
.drawer-title { font-size: 15px; font-weight: 800; color: var(--tb-text); margin: 0; }
.drawer-sub { font-size: 11.5px; color: var(--tb-sub); margin: 1px 0 0; }
.drawer-close { width: 32px; height: 32px; border-radius: 8px; background: none; border: none; cursor: pointer; color: var(--tb-sub); font-size: 15px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.drawer-close:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

.drawer-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.drawer-body::-webkit-scrollbar { width: 3px; }
.drawer-body::-webkit-scrollbar-thumb { background: var(--tb-border); border-radius: 3px; }
.form-section { display: flex; flex-direction: column; gap: 12px; }
.form-section-label { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 800; color: var(--tb-sub); text-transform: uppercase; letter-spacing: 0.7px; padding-bottom: 8px; border-bottom: 1px solid var(--tb-border); }
.form-section-label i { font-size: 11px; color: var(--accent); }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 11.5px; font-weight: 700; color: var(--tb-text); }
.form-label.required::after { content: ' *'; color: #ef4444; }
.form-input { width: 100%; padding: 9px 12px; border: 2px solid var(--tb-border); border-radius: 8px; font-size: 13px; font-family: inherit; font-weight: 600; background: var(--sb-search-bg); color: var(--tb-text); outline: none; transition: all 0.2s; box-sizing: border-box; }
.form-input:focus { border-color: var(--accent); background: var(--tb-bg); box-shadow: 0 0 0 3px var(--accent-glow2); }
.form-input::placeholder { color: var(--tb-sub); font-weight: 500; opacity: 0.8; }

/* ── Signature Upload ── */
.sig-upload-zone { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 20px 16px; border: 2px dashed var(--tb-border); border-radius: 10px; background: var(--sb-search-bg); cursor: pointer; transition: all 0.2s; min-height: 100px; }
.sig-upload-zone:hover { border-color: var(--accent); background: var(--accent-glow2); }
.sig-upload-zone.has-preview { padding: 8px; border-style: solid; border-color: var(--accent); background: var(--accent-glow2); }
.sig-upload-zone.is-uploading { cursor: not-allowed; opacity: 0.7; }
.sig-upload-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(25,118,210,0.1); display: flex; align-items: center; justify-content: center; }
.sig-upload-icon i { font-size: 16px; color: var(--accent); }
.sig-upload-text { font-size: 12.5px; font-weight: 700; color: var(--tb-text); }
.sig-upload-hint { font-size: 11px; color: var(--tb-sub); }
.sig-preview-img { max-height: 80px; max-width: 100%; object-fit: contain; border-radius: 6px; }
.sig-remove-btn { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; color: #fff; border: none; cursor: pointer; font-size: 11px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; box-shadow: 0 2px 6px rgba(239,68,68,0.4); }
.sig-remove-btn:hover { background: #dc2626; }
.sig-error-box { display: flex; align-items: center; gap: 7px; padding: 8px 12px; margin-top: 4px; background: rgba(239,68,68,0.07); border: 1.5px solid rgba(239,68,68,0.22); border-radius: 8px; font-size: 12px; font-weight: 600; color: #dc2626; }
.sig-error-box i { font-size: 13px; flex-shrink: 0; }

.form-textarea { width: 100%; padding: 9px 12px; border: 1.5px solid var(--tb-border); border-radius: 8px; font-size: 12.5px; font-family: inherit; font-weight: 500; background: var(--sb-search-bg); color: var(--tb-text); outline: none; resize: vertical; line-height: 1.6; transition: all 0.2s; }
.form-textarea:focus { border-color: var(--accent); background: var(--tb-bg); box-shadow: 0 0 0 3px var(--accent-glow2); }
.form-textarea::placeholder { color: var(--tb-sub); font-weight: 400; }

.drawer-footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--tb-border); background: var(--sb-search-bg); flex-shrink: 0; }
.btn-cancel { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; background: none; border: 1.5px solid var(--tb-border); border-radius: 8px; font-size: 12.5px; font-weight: 700; font-family: inherit; color: var(--tb-sub); cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { border-color: #ef4444; color: #ef4444; }
.btn-save { display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-size: 12.5px; font-weight: 700; font-family: inherit; cursor: pointer; box-shadow: 0 3px 12px var(--accent-glow); transition: all 0.2s; }
.btn-save:hover:not(:disabled) { background: var(--accent-dark); transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(3px); z-index: 600; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-box { background: var(--tb-bg); border: 1px solid var(--tb-border); border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); padding: 28px 28px 24px; width: 100%; max-width: 360px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.modal-icon-wrap { width: 52px; height: 52px; border-radius: 50%; background: rgba(239,68,68,0.1); border: 2px solid rgba(239,68,68,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.modal-icon-wrap i { font-size: 22px; color: #ef4444; }
.modal-title { font-size: 16px; font-weight: 800; color: var(--tb-text); margin: 0; }
.modal-desc { font-size: 13px; font-weight: 500; color: var(--tb-sub); line-height: 1.7; margin: 0; }
.modal-desc strong { color: var(--tb-text); font-weight: 800; }
.modal-warn { font-size: 11.5px; color: #ef4444; font-weight: 600; }
.modal-actions { display: flex; gap: 10px; margin-top: 4px; width: 100%; justify-content: center; }
.btn-delete-confirm { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; background: #ef4444; color: #fff; border: none; border-radius: 9px; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; box-shadow: 0 3px 12px rgba(239,68,68,0.3); transition: all 0.2s; }
.btn-delete-confirm:hover:not(:disabled) { background: #dc2626; transform: translateY(-1px); }
.btn-delete-confirm:disabled { opacity: 0.55; cursor: not-allowed; }
.delete-error-box { display: flex; align-items: flex-start; gap: 8px; width: 100%; padding: 10px 14px; background: rgba(239,68,68,0.07); border: 1.5px solid rgba(239,68,68,0.25); border-radius: 9px; font-size: 12.5px; font-weight: 600; color: #dc2626; text-align: left; line-height: 1.5; }
.delete-error-box i { font-size: 14px; flex-shrink: 0; margin-top: 1px; }

.modal-pop-enter-active { transition: opacity 0.2s, transform 0.2s; }
.modal-pop-leave-active { transition: opacity 0.15s, transform 0.15s; }
.modal-pop-enter-from, .modal-pop-leave-to { opacity: 0; transform: scale(0.92); }
.overlay-fade-enter-active, .overlay-fade-leave-active { transition: opacity 0.25s ease; }
.overlay-fade-enter-from, .overlay-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.drawer-slide-leave-active { transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1); }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.95); }
@media (max-width: 480px) { .drawer-panel { width: 100%; } }
</style>