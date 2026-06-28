<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon-wrap"><i class="fa fa-folder-open"></i></div>
        <div>
          <h1 class="page-title">{{ pageTitle }}</h1>
          <p class="page-subtitle">{{ pageSubtitle }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <i class="fa fa-magnifying-glass search-icon"></i>
            <input v-model="searchQuery" type="text"
              placeholder="ค้นหา รหัส, ชื่อ, ตำแหน่ง, สถานที่..."
              class="search-input" />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <i class="fa fa-xmark"></i>
            </button>
          </div>

          <!-- ✅ เพิ่ม Filter ประเภทเอกสาร -->
          <div class="filter-dropdown-wrap">
            <select v-model="typeFilter" class="filter-select">
              <option value="all">ใบเตือนทั้งหมด</option>
              <option value="verbal">ໜັງສືຕັກເຕືອນດ້ວຍວາຈາ</option>
              <option value="written">ໜັງສືເຕືອນທາງວິໄນ</option>
            </select>
          </div>

          <transition name="fade">
            <div class="result-chip" v-if="searchQuery || typeFilter !== 'all'">
              <i class="fa fa-filter-circle-xmark"></i> พบ <strong>{{ filtered.length }}</strong> รายการ
            </div>
          </transition>
        </div>
        <div class="toolbar-right">
          <div class="count-chip">
            <i class="fa fa-list"></i>
            <span>ทั้งหมด <strong>{{ store.cases.length }}</strong> รายการ</span>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="cases-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th>รหัสพนักงาน</th>
              <th>ชื่อ-นามสกุล</th>
              <th>ตำแหน่ง</th>
              <th>วันที่เกิดเหตุ</th>
              <th>สถานที่เกิดเหตุ</th>
              <th>เรื่อง</th>
              <th>ประเภทเอกสาร</th>
              <th>ผู้ออกใบเตือน</th>
              <th>เพิ่มเมื่อ</th>
              <th>เอกสาร</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="11" class="state-cell">
                <div class="state-content">
                  <div class="spinner"></div><span>กำลังโหลดข้อมูล...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="11" class="state-cell">
                <div class="state-content empty">
                  <div class="empty-icon-wrap"><i class="fa fa-folder-open"></i></div>
                  <span class="empty-title">{{ searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่พบข้อมูล' }}</span>
                  <span class="empty-sub" v-if="searchQuery">ลองใช้คำค้นหาอื่น</span>
                </div>
              </td>
            </tr>
            <tr v-else v-for="(c, idx) in filtered" :key="c.id" class="data-row">
              <td class="td-num">{{ idx + 1 }}</td>
              <td>
                <span class="badge-code" v-if="c.employee_code">
                  <i class="fa fa-id-badge"></i>{{ c.employee_code }}
                </span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <div class="cell-name" v-if="c.employee_name">
                  <div class="avatar-circle">{{ c.employee_name.charAt(0) }}</div>
                  <span class="name-text">{{ c.employee_name }}</span>
                </div>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <span class="position-text" v-if="c.position">
                  <i class="fa fa-briefcase pos-icon"></i>{{ c.position }}
                </span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <div class="date-cell" v-if="c.incident_date">
                  <i class="fa fa-calendar date-icon"></i>{{ formatDateDMY(c.incident_date) }}
                </div>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <span class="location-text" v-if="c.incident_location">
                  <i class="fa fa-location-dot loc-icon"></i>{{ c.incident_location }}
                </span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <span class="subject-text" v-if="c.subject">{{ c.subject }}</span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <span v-if="c.punish_verbal" class="badge-type verbal">
                    <i class="fa fa-comment-dots"></i> ໜັງສືຕັກເຕືອນດ້ວຍວາຈາ
                  </span>
                  <span v-if="c.punish_written1 || c.punish_written2 || c.punish_written3 || c.punish_other" class="badge-type written">
                    <i class="fa fa-gavel"></i> ໜັງສືເຕືອນທາງວິໄນ
                  </span>
                  <span v-if="!c.punish_verbal && !(c.punish_written1 || c.punish_written2 || c.punish_written3 || c.punish_other)" class="null-dash">—</span>
                </div>
              </td>
              <td>
                <span class="creator-tag" v-if="c.created_by">
                  <i class="fa fa-user"></i>{{ c.created_by }}
                </span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <div class="date-cell" v-if="c.created_at">
                  <i class="fa fa-clock date-icon"></i>{{ formatDate(c.created_at) }}
                </div>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <div class="action-wrap">
                  <button class="btn-edit" @click="openEdit(c)" title="แก้ไขข้อมูล">
                    <i class="fa fa-pen-to-square"></i>
                  </button>
                  <button class="btn-pdf" @click="downloadPDF(c)"
                    :disabled="downloadingId === c.id" title="ดาวน์โหลด PDF">
                    <i :class="downloadingId === c.id ? 'fa fa-spinner fa-spin' : 'fa fa-file-pdf'"></i>
                    {{ downloadingId === c.id ? 'กำลังสร้าง...' : 'PDF' }}
                  </button>
                  <button class="btn-delete" @click="handleDelete(c)"
                    :disabled="deletingId === c.id" title="ลบรายการ">
                    <i :class="deletingId === c.id ? 'fa fa-spinner fa-spin' : 'fa fa-trash'"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-footer" v-if="!store.loading && filtered.length > 0">
        <span class="footer-info">แสดง {{ filtered.length }} จาก {{ store.cases.length }} รายการ</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useVerbalWarningListStore } from '../stores/verbal_warning_list.store'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const store = useVerbalWarningListStore()
const router = useRouter()
const searchQuery = ref('')
const typeFilter = ref('all') 
const deletingId = ref(null)
const downloadingId = ref(null)

const openEdit = (c) => {
  if (!c?.id) return
  router.push({ path: '/form-verbal-warning', query: { id: String(c.id) } })
}

onMounted(() => {
  store.fetchAll()
  if (!document.querySelector('script[src*="sweetalert2"]')) {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11'
    document.head.appendChild(s)
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css'
    document.head.appendChild(l)
  }
})

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
  return `${dd}/${mm}/${d.getFullYear()}`
}

function formatDate(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d)) return val
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`
}

const filtered = computed(() => {
  let list = store.cases

  // ✅ กรองตามประเภท (Verbal / Written)
  if (typeFilter.value === 'verbal') {
    list = list.filter(c => c.punish_verbal)
  } else if (typeFilter.value === 'written') {
    list = list.filter(c => c.punish_written1 || c.punish_written2 || c.punish_written3 || c.punish_other)
  }

  // ✅ กรองตามคำค้นหา
  if (!searchQuery.value.trim()) return list
  const q = searchQuery.value.toLowerCase()
  return list.filter(c =>
    (c.employee_code || '').toLowerCase().includes(q) ||
    (c.employee_name || '').toLowerCase().includes(q) ||
    (c.position || '').toLowerCase().includes(q) ||
    (c.incident_location || '').toLowerCase().includes(q) ||
    (c.subject || '').toLowerCase().includes(q) ||
    (c.witness_name || '').toLowerCase().includes(q)
  )
})

// ✅ หัวข้อหน้าเปลี่ยนตาม Filter
const pageTitle = computed(() => {
  if (typeFilter.value === 'verbal') return 'ประวัติการตักเตือนด้วยวาจา'
  if (typeFilter.value === 'written') return 'ประวัติการตักเตือนด้วยวินัย'
  return 'ใบเตือนทั้งหมด'
})

const pageSubtitle = computed(() => {
  if (typeFilter.value === 'verbal') return 'รายการใบตักเตือนด้วยวาจาทั้งหมด'
  if (typeFilter.value === 'written') return 'รายการใบตักเตือนด้วยวินัยทั้งหมด'
  return 'รายการใบตักเตือนทุกประเภทในระบบ'
})

// ─── ลบ ──────────────────────────────────────────────────────────────────
const handleDelete = async (c) => {
  const Swal = window.Swal
  const result = await Swal.fire({
    title: 'ยืนยันการลบ?',
    html: `ลบข้อมูลของ <strong>${c.employee_name || '-'}</strong><br>
           <span style="font-size:13px;color:#888;">การลบไม่สามารถกู้คืนได้</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: '<i class="fa fa-trash"></i> ลบเลย',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
  })
  if (!result.isConfirmed) return

  deletingId.value = c.id
  try {
    await store.deleteCase(c.id)
    Swal.fire({ title: 'ลบสำเร็จ!', text: `ลบข้อมูล "${c.employee_name}" แล้ว`,
      icon: 'success', timer: 1800, showConfirmButton: false })
  } catch (err) {
    Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message, icon: 'error' })
  } finally {
    deletingId.value = null
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────
const toBase64 = async (url) => {
  try {
    if (!url) return ''
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch { return '' }
}

const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
  const s = document.createElement('script')
  s.src = src; s.onload = resolve; s.onerror = reject
  document.head.appendChild(s)
})

// ─── Build HTML (แบบ 1 ใบต่อหน้า A4 ตามฟอร์มต้นฉบับ) ────────────────────────
const getPrintHTML = (c, logo1b64, logo2b64, hrImgB64) => {
  // ✅ ตรวจสอบว่า detail เป็น JSON หรือไม่
  let parsedDetail = { text: '', reg_type: '', reg_list: [], history_detail: '' }
  try {
    if (c.detail && (c.detail.startsWith('{') || c.detail.startsWith('['))) {
      parsedDetail = JSON.parse(c.detail)
    } else {
      parsedDetail.text = c.detail || ''
    }
  } catch {
    parsedDetail.text = c.detail || ''
  }

  const historyDetail = c.history_detail || parsedDetail.history_detail || ''

  const empName        = c.employee_name     || ''
  const empCode        = c.employee_code     || ''
  const empDept        = c.position          || ''
  const empDamage      = c.subject           || ''
  const empDetail      = parsedDetail.text   || ''
  const empDate        = c.incident_date     ? formatDateDMY(c.incident_date) : ''
  const empLocation    = c.incident_location || ''
  const empWitness     = c.witness_name      || ''
  const empWitnessCode = c.witness_code      || ''
  const damageVal      = c.damage_value      || ''

  const hasPersonal = !!(c.damage_personal)
  const hasAsset    = !!(c.damage_asset)
  const hasOther    = !!(c.damage_other)

  const hasViol     = !!(c.has_violation)
  const neverPunish = c.history_type === 'never'
  const hasPunish   = c.history_type !== 'never'
  const hrName      = c.hr_name           || ''
  const hrResponsib = c.hr_responsibility || 'ພະຍານHR'
  const hrImgSrc    = hrImgB64

  // ✅ ดึงรายการกฎระเบียบจาก JSON ที่เราบันทึกไว้ใน detail
  const regulationList     = parsedDetail.reg_list || []

  const witness1Name   = c.witness1_name   || ''
  const witness1Detail = c.witness1_detail || ''
  const witness2Name   = c.witness2_name   || ''
  const witness2Detail = c.witness2_detail || 'ຮັກສາການສ່ວນບໍລິຫານຊັບພະຍາກອນບຸກຄົນ'

  const punish5Text = c.punish_other_text || ''

  const isVerbal = !!(c.punish_verbal)
  const docTitle = isVerbal ? 'ໜັງສືຕັກເຕືອນດ້ວຍວາຈາ' : 'ໜັງສືເຕືອນທາງວິໄນ'

  const chk = (v) => v
    ? `<span style="width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px;">✓</span>`
    : `<span style="width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;"></span>`

  const line = (w) =>
    `<span style="display:inline-block;width:${w};border-bottom:1px solid #555;"></span>`

  const docSigBlock = (name, detail) => `
    <div style="margin-bottom:8px;">
      <div style="display:flex;align-items:flex-end;gap:3px;line-height:1;">
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ລົງຊື່</span>
        ${line('180px')}
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ວັນທີ____/____/______</span>
      </div>
      <div style="margin-top:3px;margin-left:28px;width:180px;text-align:center;font-size:9px;line-height:1.15;word-break:break-word;">
        <div>(${name || '____________________'})</div>
        <div>${detail}</div>
      </div>
    </div>`

  const punisherSigBlock = `
    <div style="margin-bottom:8px;">
      <div style="display:flex;align-items:flex-end;gap:3px;line-height:1;">
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ລົງຊື່</span>
        ${line('200px')}
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ວັນທີ____/____/______</span>
      </div>
      <div style="margin-top:3px;margin-left:28px;width:200px;text-align:center;font-size:9px;line-height:1.15;word-break:break-word;">
        <div>(____________________)</div>
        <div>ຜູ້ມີອຳນາດຕັກເຕືອນ</div>
      </div>
    </div>`

  const hrSigBox = `
    <span style="display:inline-flex;align-items:flex-end;justify-content:center;
      width:120px;min-height:50px;border-bottom:1px solid #888;overflow:hidden;flex-shrink:0;">
      ${hrImgSrc ? `<img src="${hrImgSrc}" style="max-width:118px;max-height:48px;width:auto;height:auto;object-fit:contain;object-position:center bottom;display:block;">` : ''}
    </span>`

  const hrSigBlockFull = `
    <div style="margin-bottom:8px;">
      <div style="display:flex;align-items:flex-end;gap:3px;line-height:1;">
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ລົງຊື່</span>
        ${hrSigBox}
        <span style="font-size:9px;white-space:nowrap;padding-bottom:1px;">ວັນທີ____/____/______</span>
      </div>
      <div style="margin-top:3px;margin-left:28px;width:120px;text-align:center;font-size:9px;line-height:1.15;word-break:break-word;">
        <div>(${hrName || '____________________'})</div>
        <div>${hrResponsib}</div>
      </div>
    </div>`

  const punish5Label = c.punish_other
    ? `ອື່ນໆ (ເຊັນພະນັກງານ)&nbsp;<span style="display:inline-block;min-width:80px;border-bottom:1.5px solid #222;padding:0 4px;font-weight:700;">${punish5Text}</span>&nbsp;ເລີກຈ້າງ (HR/MD)`
    : `ອື່ນໆ (ເຊັນພະນັກງານ)..................................ເລີກຈ້າງ (HR/MD)`

  const assetSubRows = `
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;padding-left:14px;">
      <span style="min-width:12px;">1</span>
      <span style="flex:1;border-bottom:1px solid #888;min-height:13px;padding-left:4px;font-weight:700;">${hasAsset ? damageVal : ''}</span>
      <span style="padding-left:3px;">ກີບ</span>
    </div>
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;padding-left:14px;">
      <span style="min-width:12px;">2</span>
      <span style="flex:1;border-bottom:1px solid #888;min-height:13px;"></span>
      <span style="padding-left:3px;">ກີບ</span>
    </div>`

  // ✅ สร้าง HTML รายการกฎระเบียบสำหรับพิมพ์
  const regulationRowsHTML = regulationList.length
    ? regulationList.map((item, idx) =>
        `<div class="item-row" style="padding-left:4px;">
          <span><strong>${idx + 1}.</strong> ${item.name}</span>
        </div>`
      ).join('')
    : `<div class="item-row" style="padding-left:4px;color:#888;font-size:9px;">— ບໍ່ໄດ້ລະບຸລະບຽບ —</div>`

  return `<!DOCTYPE html>
<html lang="lo"><head><meta charset="UTF-8"><title>${docTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#fff;font-family:'Noto Sans Lao','Noto Sans Thai',Arial,sans-serif;font-size:10.5px;color:#000;line-height:1.6;}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;display:flex;flex-direction:column;}
  .page-inner{display:flex;flex-direction:column;padding:8mm 10mm;gap:0;}
  @media print{body{background:#fff;margin:0;padding:0;}.page{border:none;margin:0;}@page{size:A4;margin:0;}}

  .doc-header{border:1px solid #999;padding:5px 10px;margin-bottom:0;display:flex;align-items:center;}
  .doc-title{flex:1;text-align:center;font-size:13px;font-weight:700;}
  .doc-ref{font-size:10px;color:#444;white-space:nowrap;}

  .section-bar{background:#e0e0e0;border:1px solid #999;border-top:none;padding:3px 10px;font-weight:700;font-size:11px;flex-shrink:0;}

  .two-col-grid{display:grid;grid-template-columns:minmax(0,1.2fr) 1px minmax(0,0.8fr);border:1px solid #999;border-top:none;}
  .col-left{padding:6px 10px;display:flex;flex-direction:column;}
  .col-divider{background:#999;}
  .col-right{padding:6px 10px;display:flex;flex-direction:column;}

  .field-row{display:flex;align-items:flex-start;margin-bottom:5px;flex-wrap:nowrap;min-width:0;}
  .inline-row{display:flex;align-items:flex-start;gap:0;margin-bottom:5px;}
  .fl{font-weight:600;white-space:nowrap;padding-top:1px;}
  .fl-w{min-width:105px;font-weight:600;white-space:nowrap;padding-top:1px;flex-shrink:0;}
  .fl-sm{min-width:22px;font-weight:600;white-space:nowrap;padding-top:1px;}
  .fc{padding:0 3px;flex-shrink:0;}
  .fv{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:1px;padding-top:1px;min-width:0;overflow:hidden;word-break:break-all;}
  .fv-md{width:90px;flex-shrink:0;border-bottom:1px solid #888;min-height:16px;margin-right:8px;padding-bottom:1px;}
  .fve{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:1px;}

  .cb-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;}
  .item-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;line-height:1.5;font-size:10.5px;}

  .bottom-section{border:1px solid #999;border-top:none;padding:6px 10px;flex-shrink:0;}
  .note-txt{font-size:9.5px;color:#444;font-style:italic;margin-bottom:4px;}

  .s2-header-wrap{display:flex;flex-shrink:0;}
  .s2-header-left{width:62%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;border-right:none;}
  .s2-header-right{width:38%;padding:3px 8px;background:#bdbdbd;font-weight:700;font-size:10.5px;border:1px solid #999;border-top:none;}
  .s2-wrap{display:flex;}
  .s2-left{width:62%;padding:6px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;font-size:10.5px;line-height:1.6;}
  .s2-right{width:38%;padding:6px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;}

  .s3-wrap{display:flex;}
  .s3-left{width:62%;padding:6px 9px;border:1px solid #999;border-top:none;border-right:none;display:flex;flex-direction:column;}
  .s3-right{width:38%;padding:6px 9px;border:1px solid #999;border-top:none;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}

  .sig-block{border:1px solid #999;border-top:none;flex-shrink:0;font-size:10px;padding:8px 12px;}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 32px;margin-top:18px;}

  .hr-thin{border:none;border-top:1px solid #aaa;margin:5px 0;}
</style>
</head><body>
<div class="page"><div class="page-inner">

  <!-- HEADER -->
  <div class="doc-header">
    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;margin-right:8px;">
      <img src="${logo1b64}" style="height:22px;width:auto;object-fit:contain;">
      <img src="${logo2b64}" style="height:22px;width:auto;object-fit:contain;">
    </div>
    <div class="doc-title">${docTitle}</div>
    <div class="doc-ref">ເລກທີ: ………………………</div>
  </div>

  <!-- SECTION 1 -->
  <div class="section-bar">ສ່ວນທີ 1 : ການລາຍງານຂໍ້ມູນຈິງ</div>
  <div class="two-col-grid">
    <div class="col-left">
      <div class="inline-row">
        <span class="fl">ຜູ້ກະທຳຄວາມຜິດ</span><span class="fc">:</span>
        <span class="fv-md">${empName}</span>
        <span class="fl-sm">ID</span><span class="fc">:</span>
        <span class="fve">${empCode}</span>
      </div>
      <div class="field-row"><span class="fl-w">ຕຳແໜ່ງ</span><span class="fc">:</span><span class="fv">${empDept}</span></div>
      <div class="field-row"><span class="fl-w">ວັນທີເກີດເຫດ</span><span class="fc">:</span><span class="fv">${empDate}</span></div>
      <div class="field-row"><span class="fl-w">ສະຖານທີ່ເກີດເຫດ</span><span class="fc">:</span><span class="fv">${empLocation}</span></div>
      <div class="inline-row">
        <span class="fl">ຜູ້ຮູ້ເຫດການ</span><span class="fc">:</span>
        <span class="fv-md">${empWitness}</span>
        <span class="fl-sm">ID</span><span class="fc">:</span>
        <span class="fve">${empWitnessCode}</span>
      </div>
      <div class="field-row"><span class="fl-w">ລາຍງານເສຍຫາຍ</span><span class="fc">:</span><span class="fve">${damageVal}</span></div>
      <div style="margin-top:4px;">
        <div class="cb-row">${chk(hasPersonal)}<span style="font-size:9.5px;">ຕໍ່ບຸກຄົນ (ລະບຸຊື່ ແລະ ຜົນກະທົບທີ່ໄດ້ຮັບຈາກເຫດການ)</span></div>
        <div class="cb-row">${chk(hasAsset)}<span style="font-size:9.5px;">ຕໍ່ຊັບສິນ (ລະບຸລາຍການແລະມູນຄ່າຄວາມເສຍຫາຍ)</span></div>
        ${assetSubRows}
        <div class="cb-row" style="margin-top:2px;">${chk(hasOther)}<span style="font-size:9.5px;">ອື່ນໆ ລະບຽບຂໍ້ບັງຄັບ ແລະ ກົດເກນບໍລິສັດ</span></div>
      </div>
    </div>
    <div class="col-divider"></div>
    <div class="col-right">
      <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:4px;">
        <span style="font-weight:600;font-size:10px;white-space:nowrap;">ເລື່ອງ:</span>
        <span style="font-size:10px;flex:1;border-bottom:1px solid #ddd;padding-bottom:2px;padding-left:3px;">${empDamage}</span>
      </div>
      <div style="display:flex;align-items:baseline;gap:4px;">
        <span style="font-weight:600;font-size:10px;white-space:nowrap;">ລາຍລະອຽດ:</span>
        <span style="font-size:9.5px;flex:1;line-height:1.5;word-break:break-word;padding-left:3px;">${empDetail}</span>
      </div>
    </div>
  </div>

  <!-- Section 1 bottom sig -->
  <div class="bottom-section">
    <div class="note-txt">ຂ້າພະເຈົ້າຂໍຮັບຮອງວ່າຂໍ້ມູນຂ້າງເທິງເປັນຄວາມຈິງທູກປະການ</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;margin-top:4px;">
      <div>${docSigBlock('', 'ຜູ້ສອບສວນ/ຜູ້ບັງຄັບບັນຊາ')}</div>
      <div>${docSigBlock(empName, 'ພະນັກງານທີ່ກະທຳຄວາມຜິດ')}</div>
    </div>
  </div>

  <!-- SECTION 2 -->
  <div class="s2-header-wrap">
    <div class="s2-header-left">ສ່ວນທີ 2 : ການພິຈາລະນາໂທດທາງວິໄນ (ຕົ້ນສັງກັດຫາລືຮ່ວມກັບຝ່າຍຊັບພະຍາກອນບຸກຄົນ)</div>
    <div class="s2-header-right">ປະຫວັດກະທຳຄວາມຜິດ ແລະ ຖືກລົງໂທດ</div>
  </div>
  <div class="s2-wrap">
    <div class="s2-left">
      <div class="item-row">${chk(hasViol)}<span>ພະນັກງານຖຶກລົງໂທດທາງວິໄນ ເລື່ອງ ໝວດ 10 ວິໄນ ແລະ ບົດລົງໂທດທາງວິໄນ ຂໍ້ 3 ວິໄນພະນັກງານ</span></div>
      <!-- ✅ แสดงรายการ แทน 3.9.5 / 3.9.3 เดิม -->
      ${regulationRowsHTML}
      <div style="font-size:8.5px;color:#333;padding-left:4px;">ຈຶ່ງໄດ້ແຈ້ງໃຫ້ທ່ານຊາບ ແລະ ໃຫ້ທ່ານພິຈາລະນາດ້ວຍຕົນເອງ</div>
    </div>
    <div class="s2-right">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:5px;">${chk(neverPunish)}<span style="font-size:9.5px;">ບໍ່ເຄີຍ</span></div>
        <div style="display:flex;align-items:center;gap:5px;">${chk(hasPunish)}<span style="font-size:9.5px;">ເຄີຍຖຶກໂທດທາງວິໄນ</span></div>
      </div>
      <div style="margin-top:4px;">
        <div style="font-size:9px;font-weight:600;">ລາຍລະອຽດປະຫວັດ:</div>
        <div style="font-size:8.5px;line-height:1.4;padding-left:4px;">${historyDetail || ''}</div>
      </div>
      <hr class="hr-thin">
      <div style="font-size:9px;margin-top:4px;">
        <div style="display:flex;align-items:flex-end;gap:6px;line-height:1;">
          <span style="white-space:nowrap;line-height:1;padding-bottom:1px;min-width:70px;">ລົງຊື່ :</span>
          ${hrSigBox}
        </div>
        <div style="margin-top:2px;margin-left:calc(70px + 6px);width:180px;text-align:center;line-height:1.15;word-break:break-word;">
          (${hrName || '____________________'})
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION 3 -->
  <div class="section-bar">ສ່ວນທີ 3 ການລົງໂທດ (ພິຈາລະນາຮ່ວມກັບຝ່າຍບຸກຄົນ)</div>
  <div class="s3-wrap">
    <div class="s3-left">
      <div class="item-row"><span style="font-weight:700;">ເຫັນສົມຄວນໃຫ້ລົງໂທດວິໄນ</span></div>
      <div class="item-row">${chk(!!c.punish_verbal)}<span>ຕັກເຕືອນດ້ວຍວາຈາ</span></div>
      <div class="item-row">${chk(!!c.punish_written1)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 1)</span></div>
      <div class="item-row">${chk(!!c.punish_written2)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 2)</span></div>
      <div class="item-row">${chk(!!c.punish_written3)}<span>ຕັກເຕືອນເປັນໜັງສື (ຄັ້ງ 3) ແຈ້ງການລົງໂທດคັ້ງຕໍ່ໄປ ຄື ພັກງານ ຫຼື ເລີກຈ້າງ</span></div>
      <div class="item-row">${chk(!!c.punish_other)}<span>${punish5Label}</span></div>
    </div>
    <div class="s3-right">
      <div style="font-size:9.5px;line-height:1.6;">
        <div>ອຳນາດການລົງໂທດວິໄນຕາມຂໍ້ບັງຄັບ</div>
        <div>ກຳມະການຜູ້ຈັດການ ຫຼື ຜູ້ບັງຄັບບັນຊາ</div>
        <div>ແຕ່ລະພະແນກເປັນຜູ້ໂທด ຫຼື ຜູ້ມີອຳນາດ</div>
        <div>ກະທຳການແທນ ຫຼື ເປັນຜູ້ທີ່ໄດ້ຮັບການ</div>
        <div>ມອບໝາຍທາງບໍລິສັດ</div>
        <div style="margin-top:2px;color:#c00;font-weight:700;font-size:9px;">****ກໍລະນີເລີກຈ້າງສົ່ງຕໍ່ HR****</div>
      </div>
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="sig-block">
    <div style="font-size:9px;color:#444;font-style:italic;margin-bottom:4px;">
      ບໍລິສັດ ຈຶ່ງຂໍໃຫ້ທ່ານປັບປຸງຕົວ ຫາກທ່ານກະທຳຄວາມຜິດຊ້ຳ ອາດຖືກລົງໂທດຮ້າຍແຮງຂຶ້ນ ຮອດຂັ້ນເລີກຈ้างໂດຍບໍ່ຈ່າຍຄ່າຊົດເຊີย
    </div>
    <div class="sig-grid">
      <div>${punisherSigBlock}</div>
      <div>${docSigBlock(empName, 'ພະນັກງານ (ຜູ້ຖືກລົງໂທດ)')}</div>
      <div>${docSigBlock(witness1Name, witness1Detail)}</div>
      <div>${hrSigBlockFull}</div>
      <div>${docSigBlock(witness2Name, witness2Detail)}</div>
      <div></div>
    </div>
    <div style="font-size:8px;color:#444;font-style:italic;margin-top:8px;text-align:center;">
      ( ຫາກທ່ານບໍ່ພໍໃຈການຕັກເຕືອນ/ລົງໂທດຕາມໜັງສືສະບັບນີ້ ທ່ານສາມາດຍື່ນເລື່ອງອຸທອນໄດ້ຕາມຂັ້ນຕອນໃນລະບົບບໍລິສັດ )
    </div>
  </div>

</div></div>
</body></html>`
}

// ─── Download PDF (แบบ 1 ใบต่อหน้า A4 โดยใช้ html2canvas + jspdf) ──────────
const downloadPDF = async (c) => {
  downloadingId.value = c.id
  try {
    await Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
    ])

    const [logo1, logo2, hrImgB64] = await Promise.all([
      toBase64('https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg'),
      toBase64('https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png'),
      c.hr_image ? toBase64(c.hr_image) : Promise.resolve(''),
    ])
    const htmlContent = getPrintHTML(c, logo1, logo2, hrImgB64)

    // สร้าง Iframe ลับเพื่อเรนเดอร์ HTML
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:0;left:-9999px;width:210mm;height:297mm;border:none;'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument
    doc.open(); doc.write(htmlContent); doc.close()

    iframe.onload = async () => {
      try {
        await new Promise(r => setTimeout(r, 800)) // รอให้ฟอนต์และรูปโหลด
        const target = doc.body.querySelector('.page') || doc.body
        const canvas = await window.html2canvas(target, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        })

        const { jsPDF } = window.jspdf
        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)

        const fileName = `Warning_${c.employee_code || 'Document'}_${new Date().getTime()}.pdf`
        pdf.save(fileName)

        document.body.removeChild(iframe)
        downloadingId.value = null
      } catch (err) {
        console.error('Capture Error:', err)
        document.body.removeChild(iframe)
        throw err
      }
    }
  } catch (err) {
    console.error('PDF Error:', err)
    window.Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message, icon: 'error' })
    downloadingId.value = null
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&display=swap');
.page-wrapper{padding:24px;font-family:'Noto Sans Lao','Noto Sans Thai','Nunito','Barlow',sans-serif;}
.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;}
.page-header-left{display:flex;align-items:center;gap:14px;}
.page-icon-wrap{width:44px;height:44px;border-radius:12px;background:#0ea5e9;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.page-icon-wrap i{color:#fff;font-size:18px;}
.page-title{font-size:18px;font-weight:800;color:#1e293b;line-height:1.2;margin:0;}
.page-subtitle{font-size:12px;color:#64748b;margin:2px 0 0;}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;}
.card-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;}
.toolbar-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex:1;}
.toolbar-right{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.search-box{position:relative;min-width:200px;max-width:340px;flex:1;}
.search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#64748b;font-size:13px;pointer-events:none;}
.search-input{width:100%;padding:8px 32px 8px 34px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12.5px;font-family:inherit;font-weight:600;background:#fff;color:#1e293b;outline:none;transition:all 0.2s;}
.search-input:focus{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,0.12);}
.search-input::placeholder{color:#64748b;font-weight:500;}
.search-clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#64748b;font-size:12px;padding:3px;border-radius:4px;}
.search-clear:hover{color:#ef4444;}

/* ✅ สไตล์ Filter Dropdown */
.filter-dropdown-wrap {
  margin-left: 8px;
  min-width: 180px;
}
.filter-select {
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid #e2e8f0;border-radius: 8px;font-size: 12.5px;font-family: inherit;font-weight: 600;background: #fff;color: #1e293b;outline: none;cursor: pointer;transition: all 0.2s;appearance: none;background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");background-repeat: no-repeat;background-position: right 10px center;background-size: 14px;padding-right: 32px;}
.filter-select:focus {border-color: #0ea5e9;box-shadow: 0 0 0 3px rgba(14,165,233,0.12);}
.result-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;background:rgba(25,118,210,0.08);border:1px solid rgba(25,118,210,0.18);border-radius:20px;font-size:12px;font-weight:600;color:#0ea5e9;white-space:nowrap;}
.count-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;font-size:12px;font-weight:600;color:#64748b;white-space:nowrap;}
.table-wrapper{overflow-x:auto;}
.cases-table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:1100px;}
.cases-table thead tr{background:#f8fafc;border-bottom:2px solid #e2e8f0;}
.cases-table th{padding:11px 14px;text-align:left;font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;white-space:nowrap;}
.th-num{width:44px;text-align:center;}
.cases-table tbody tr{border-bottom:1px solid #e2e8f0;transition:background 0.15s;}
.cases-table tbody tr:last-child{border-bottom:none;}
.data-row:hover{background:#f8fafc;}
.state-cell{padding:40px;text-align:center;}
.state-content{display:flex;flex-direction:column;align-items:center;gap:12px;color:#64748b;}
.spinner{width:24px;height:24px;border:3px solid #e2e8f0;border-top-color:#0ea5e9;border-radius:50%;animation:spin 0.8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.empty-icon-wrap{width:56px;height:56px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin-bottom:8px;}
.empty-icon-wrap i{font-size:24px;color:#94a3b8;}
.empty-title{font-size:14px;font-weight:700;color:#1e293b;}
.empty-sub{font-size:12px;color:#64748b;}
.badge-code{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;background:#f1f5f9;border-radius:6px;color:#475569;font-weight:700;font-size:11.5px;}
.cell-name{display:flex;align-items:center;gap:10px;}
.avatar-circle{width:28px;height:28px;border-radius:50%;background:#0ea5e9;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;text-transform:uppercase;}
.name-text{font-weight:700;color:#1e293b;}
.position-text{display:inline-flex;align-items:center;gap:5px;color:#475569;font-weight:600;}
.pos-icon{font-size:11px;color:#94a3b8;}
.date-cell{display:inline-flex;align-items:center;gap:6px;color:#475569;font-weight:600;}
.date-icon{font-size:11px;color:#94a3b8;}
.location-text{display:inline-flex;align-items:center;gap:5px;color:#475569;font-weight:600;}
.loc-icon{font-size:11px;color:#94a3b8;}
.subject-text{font-weight:600;color:#1e293b;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}
.badge-type{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;font-size:11.5px;font-weight:700;white-space:nowrap;}
.badge-type.verbal{background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.2);color:#0ea5e9;}
.badge-type.written{background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);color:#f97316;}
.creator-tag{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;color:#64748b;font-weight:600;font-size:11px;}
.action-wrap{display:flex;align-items:center;gap:6px;}
.btn-edit{width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:#fff;border:1.5px solid #dbeafe;border-radius:8px;color:#2563eb;cursor:pointer;transition:all 0.2s;}
.btn-edit:hover:not(:disabled){background:#eff6ff;transform:translateY(-1px);}
.btn-edit:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
.btn-pdf{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#0ea5e9;border:none;border-radius:8px;color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;transition:all 0.2s;}
.btn-pdf:hover:not(:disabled){background:#0284c7;transform:translateY(-1px);box-shadow:0 4px 6px -1px rgba(14,165,233,0.2);}
.btn-pdf:disabled{opacity:0.6;cursor:not-allowed;}
.btn-delete{width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:#fff;border:1.5px solid #fee2e2;border-radius:8px;color:#ef4444;cursor:pointer;transition:all 0.2s;}
.btn-delete:hover:not(:disabled){background:#ef4444;border-color:#ef4444;color:#fff;}
.card-footer{padding:12px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;}
.footer-info{font-size:12px;color:#64748b;font-weight:600;}
.null-dash{color:#cbd5e1;font-weight:400;}
.fade-enter-active,.fade-leave-active{transition:opacity 0.2s;}
.fade-enter-from,.fade-leave-to{opacity:0;}
</style>
