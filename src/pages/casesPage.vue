<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon-wrap"><i class="fa fa-folder-open"></i></div>
        <div>
          <h1 class="page-title">ประวัติการลงโทษทางวินัย</h1>
          <p class="page-subtitle">รายการใบบินทั้งหมดในระบบ</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <i class="fa fa-magnifying-glass search-icon"></i>
            <input v-model="searchQuery" type="text" placeholder="ค้นหา รหัส, ชื่อ, ตำแหน่ง, สถานที่..." class="search-input"/>
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''"><i class="fa fa-xmark"></i></button>
          </div>

          <div class="filter-box">
            <i class="fa fa-filter filter-icon"></i>
            <select v-model="selectedCaseType" class="filter-select">
              <option value="">ทุกประเภทเหตุการณ์</option>
              <option v-for="t in caseTypeOptions" :key="t" :value="t">
                {{ t }}
              </option>
            </select>
          </div>

          <transition name="fade">
            <div class="result-chip" v-if="searchQuery || selectedCaseType">
              <i class="fa fa-filter-circle-xmark"></i>
              พบ <strong>{{ filtered.length }}</strong> รายการ
            </div>
          </transition>
        </div>
        <div class="toolbar-right">
          <div class="count-chip"><i class="fa fa-list"></i><span>ทั้งหมด <strong>{{ store.cases.length }}</strong> รายการ</span></div>
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
              <th>ประเภทเหตุการณ์</th>
              <th>สถานที่เกิดเหตุ</th>
              <th>ผู้ออกใบเตือน</th>
              <th>เพิ่มเมื่อ</th>
              <th>เอกสาร</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="10" class="state-cell">
                <div class="state-content"><div class="spinner"></div><span>กำลังโหลดข้อมูล...</span></div>
              </td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="10" class="state-cell">
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
                <span class="badge-code" v-if="c.employee_code"><i class="fa fa-id-badge"></i>{{ c.employee_code }}</span>
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
                <span class="position-text" v-if="c.position"><i class="fa fa-briefcase pos-icon"></i>{{ c.position }}</span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <div class="date-cell" v-if="c.incident_date"><i class="fa fa-calendar date-icon"></i>{{ formatDateDMY(c.incident_date) }}</div>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <span class="case-type-badge" v-if="c.case_type">{{ c.case_type }}</span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <span class="location-text" v-if="c.incident_location"><i class="fa fa-location-dot loc-icon"></i>{{ c.incident_location }}</span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <span class="creator-tag" v-if="c.created_by"><i class="fa fa-user"></i>{{ c.created_by }}</span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <div class="date-cell" v-if="c.created_at"><i class="fa fa-clock date-icon"></i>{{ formatDate(c.created_at) }}</div>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <div class="action-wrap">
                  <button class="btn-edit" @click="openEditModal(c)" title="แก้ไขข้อมูล">
                    <i class="fa fa-pen-to-square"></i>
                  </button>
                  <button class="btn-pdf" @click="downloadPDF(c)" :disabled="downloadingId === c.id" title="ดาวน์โหลด PDF">
                    <i :class="downloadingId === c.id ? 'fa fa-spinner fa-spin' : 'fa fa-file-pdf'"></i>
                    {{ downloadingId === c.id ? 'กำลังสร้าง...' : 'PDF' }}
                  </button>
                  <button class="btn-delete" @click="handleDelete(c)" :disabled="deletingId === c.id" title="ลบรายการ">
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

    <Teleport to="body">
    </Teleport>
  </div>
</template>

<script setup>
import { useDisciplineListStore } from '../stores/cases.stores'
import { onMounted, ref, computed } from 'vue'
import { useSignatureStore } from '@/stores/Usesignaturestore'
import { useDocumentTypeStore } from '@/stores/Usedocumenttypestore'
import { useRegulationTypeStore } from '../stores/regulation_type.store'
import { useRouter } from 'vue-router'

const store = useDisciplineListStore()
const sigStore = useSignatureStore()
const docStore = useDocumentTypeStore()
const regStore = useRegulationTypeStore()
const router = useRouter()
const searchQuery = ref('')
const selectedCaseType = ref('')
const deletingId = ref(null)
const downloadingId = ref(null)

onMounted(() => {
  store.fetchAll()
  sigStore.getSignatures()
  docStore.getDocuments()
  regStore.getRegulationTypes()
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

const openEditModal = (c) => {
  router.push({ path: '/form-discipline', query: { id: c.id } })
}

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
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`
}

const formatLaoDate = (dateStr) => {
  if (!dateStr) return '____/____/______'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  const months = [
    'ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ',
    'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'
  ]
  return `${day} ${months[month - 1]} ${year}`
}

const caseTypeOptions = computed(() => {
  const types = new Set()
  store.cases.forEach(c => {
    if (c.case_type && String(c.case_type).trim() !== '') {
      types.add(String(c.case_type))
    }
  })
  return Array.from(types).sort()
})

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const type = selectedCaseType.value
  return store.cases.filter(c => {
    const matchSearch = !q
      ? true
      : (c.employee_code || '').toLowerCase().includes(q) ||
        (c.employee_name || '').toLowerCase().includes(q) ||
        (c.position || '').toLowerCase().includes(q) ||
        (c.incident_location || '').toLowerCase().includes(q) ||
        (c.subject || '').toLowerCase().includes(q) ||
        (c.witness_name || '').toLowerCase().includes(q)
    const matchType = !type || c.case_type === type
    return matchSearch && matchType
  })
})

const handleDelete = async (c) => {
  const Swal = window.Swal
  const result = await Swal.fire({
    title: 'ยืนยันการลบ?',
    html: `ลบข้อมูลของ <strong>${c.employee_name || '-'}</strong><br><span style="font-size:13px;color:#888;">การลบไม่สามารถกู้คืนได้</span>`,
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
    Swal.fire({ title: 'ลบสำเร็จ!', text: `ลบข้อมูล "${c.employee_name}" แล้ว`, icon: 'success', timer: 1800, showConfirmButton: false })
  } catch (err) {
    Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message, icon: 'error' })
  } finally {
    deletingId.value = null
  }
}

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

// ==================== สร้าง HTML สำหรับ PDF ====================
const getPrintHTML = (c, logo1b64, logo2b64, hrImgB64) => {
  const empName          = c.employee_name       || '_________________'
  const empCode          = c.employee_code       || '_________________'
  const empDept          = c.position            || '_________________'
  const empDamage        = c.subject             || ''
  const empDetail        = c.detail              || ''
  const empDateRaw       = c.incident_date       || ''
  const empDateFormatted = formatLaoDate(empDateRaw)
  const empLocation      = c.incident_location   || '_________________'
  const empWitness       = c.witness_name        || '_________________'
  const empWitnessCode   = c.witness_code        || ''
  const damageVal        = c.damage_value ? Number(c.damage_value).toLocaleString() : ''
  const investigator     = c.investigator        || '_________________'
  const address          = c.address             || ''
  const caseTypeVal      = c.case_type           || ''

  // ✅ รองรับ kip mode เหมือนฟอร์ม
  const currType         = c.currency_type       || 'baht'
  const isKipMode        = currType === 'kip'
  const currLabelPrint   = currType === 'dollar' ? 'ໂດລາ' : currType === 'kip' ? 'ກີບ' : 'ບາດ'
  const currSymbol       = currType === 'dollar' ? '$'     : currType === 'kip' ? '₭'  : '฿'

  const types      = c.damage_types || []
  const hasPersonal = types.includes('personal')
  const hasAsset    = types.includes('asset')
  const hasOther    = types.includes('other')

  const historyStr  = c.history_type || ''
  const historyTypes = historyStr.split(',').map(s => s.trim())
  const neverPunish  = historyTypes.includes('never')
  const hasPunish    = historyTypes.includes('has')
  const hasViol      = !!(c.has_violation)

  const regulationList     = Array.isArray(c.regulation_list)     ? c.regulation_list     : []
  const regulationTypeName = c.regulation_type_name || ''

  const regulationTypeLabel = regulationTypeName
    ? `<div class="item-row" style="padding-left:4px;font-weight:700;"></div>`
    : ''

  const regulationRowsHTML = regulationList.length
    ? regulationList.map((item, idx) =>
        `<div class="item-row" style="padding-left:4px;">
          <span><strong>${idx + 1}.</strong> ${item.name || item}</span>
        </div>`
      ).join('')
    : `<div class="item-row" style="padding-left:4px;font-size:9px;color:#888;">— ບໍ່ໄດ້ລະບຸລະບຽບ —</div>`

  const hrName      = c.hr_name           || '_________________'
  const hrResponsib = c.hr_responsibility || 'ພະຍານHR'
  const hrImgSrc    = hrImgB64            || c.hr_image || ''

  const punishTypes = c.punish_types     || []
  const punish5Text = c.punish_other_text || ''

  const witness1Name   = c.witness1_name   || '_________________'
  const witness1Detail = c.witness1_detail || ''
  const witness2Name   = c.witness2_name   || '_________________'
  const witness2Detail = c.witness2_detail || 'ຮັກສາການຜູ້ຈັດການສ່ວນບໍລິຫານຊັບພະຍາກອນບຸກຄົນ'

  // ✅ คำนวณตัวเลขรองรับ 3 โหมด: baht / dollar / kip
  const amountBahtNum         = c.amount_baht ? Number(c.amount_baht) : 0
  const percentNum            = c.percent     ? Number(c.percent)     : 0
  const amountAfterPercentNum = c.amount_after_percent
    ? Number(c.amount_after_percent)
    : (percentNum > 0 ? amountBahtNum * (percentNum / 100) : amountBahtNum)
  const rateKipNum            = c.rate_kip    ? Number(c.rate_kip)    : 0

  // ✅ kip mode: ใช้ amount_kip_direct หรือ total_kip
  const totalKipNum = isKipMode
    ? (c.amount_kip_direct
        ? Number(c.amount_kip_direct)
        : (c.total_kip ? Number(c.total_kip) : 0))
    : (c.total_kip
        ? Number(c.total_kip)
        : (amountAfterPercentNum * rateKipNum))

  const installmentsNum      = c.installments ? Number(c.installments) : 0
  const perInstallmentKipNum = (installmentsNum > 0 && totalKipNum > 0)
    ? Math.round(totalKipNum / installmentsNum) : 0

  const amtBahtDisplay         = amountBahtNum.toLocaleString()
  const amtAfterPercentDisplay = amountAfterPercentNum.toLocaleString()
  const amtKip                 = totalKipNum > 0 ? totalKipNum.toLocaleString() : ''
  const installment            = installmentsNum || ''
  const perInstall             = perInstallmentKipNum > 0 ? perInstallmentKipNum.toLocaleString() : ''
  const payDateRaw             = c.pay_date || ''
  const payDateFormatted       = formatLaoDate(payDateRaw)

  // ✅ จำนวนเงินต้นสำหรับแสดงในส่วนที่ 5
  const displayAmountOrig = isKipMode
    ? totalKipNum.toLocaleString()
    : amtAfterPercentDisplay

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

  const hrSigBox = `<span style="border-bottom:1px solid #888;display:inline-flex;align-items:flex-end;justify-content:center;width:180px;min-height:68px;overflow:hidden;flex-shrink:0;">
    ${hrImgSrc ? `<img src="${hrImgSrc}" style="max-width:178px;max-height:66px;width:auto;height:auto;object-fit:contain;object-position:center bottom;display:block;">` : ''}
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
    : `ອື່ນໆ (ເຊັນພະນັກງານ)..............................................ເລີກຈ້າງ (HR/MD)`

  const assetSubRows = `
    <div class="sub-row"><span class="sub-num">1</span><span class="sub-line">${kipLine1}</span><span class="sub-unit">ກີບ</span></div>
    <div class="sub-row"><span class="sub-num">2</span><span class="sub-line"></span><span class="sub-unit"></span></div>`

  const titleText = `ໜັງສືໃບເຕືອນ${caseTypeVal ? ` ${caseTypeVal}` : ''}`

  // ✅ แสดง % line เฉพาะ baht/dollar mode เหมือนฟอร์ม
  const percentLine = (!isKipMode && percentNum > 0 && amountBahtNum > 0)
    ? `<div style="margin-bottom:6px;line-height:1.8;">
         ມູນຄ່າຈຳນວນເງິນ ${amtBahtDisplay} ${currLabelPrint} x ຄູນ ${percentNum}% ເທົ່າກັບຈຳນວນເງິນ ${amtAfterPercentDisplay} ${currLabelPrint}
       </div>`
    : ''

  const css = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#fff;font-family:'Noto Sans Lao','Noto Sans Thai',sans-serif;font-size:11px;color:#000;line-height:1.6;}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;display:flex;flex-direction:column;}
  .page-inner{display:flex;flex-direction:column;padding:6mm 9mm;gap:0;}
  @media print{body{background:#fff;margin:0;padding:0;}.page{border:none;margin:0;page-break-after:always;}@page{size:A4;margin:0;}}
  .doc-header{border:1px solid #999;padding:4px 10px;margin-bottom:0;display:flex;align-items:center;}
  .doc-title{flex:1;text-align:center;font-size:13px;font-weight:700;}
  .doc-ref{font-size:10px;color:#444;white-space:nowrap;}
  .section-bar{background:#e0e0e0;border:1px solid #999;padding:3px 10px;font-weight:700;font-size:11px;flex-shrink:0;}
  .two-col-grid{display:grid;grid-template-columns:1fr 1px 1fr;}
  .col-left{padding:5px 10px;display:flex;flex-direction:column;}
  .col-divider{background:#999;}
  .col-right{padding:5px 10px;display:flex;flex-direction:column;}
  .field-row{display:flex;align-items:flex-start;margin-bottom:4px;}
  .info-row{display:flex;align-items:baseline;gap:4px;margin-bottom:5px;flex-wrap:wrap;}
  .info-label{font-weight:600;white-space:nowrap;}
  .info-value{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:2px;}
  .info-id-label{font-weight:600;white-space:nowrap;margin-left:8px;}
  .info-id-value{border-bottom:1px solid #888;min-width:70px;text-align:left;padding-bottom:2px;}
  .inline-row{display:flex;align-items:flex-start;gap:0;margin-bottom:5px;}
  .fl{font-weight:600;white-space:nowrap;padding-top:1px;}
  .fl-w{min-width:105px;font-weight:600;white-space:nowrap;padding-top:1px;}
  .fl-sm{min-width:22px;font-weight:600;white-space:nowrap;padding-top:1px;}
  .fc{padding:0 3px;}
  .fv{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:2px;padding-top:1px;}
  .fv-md{width:90px;border-bottom:1px solid #888;min-height:16px;margin-right:8px;padding-bottom:2px;}
  .fve{flex:1;border-bottom:1px solid #888;min-height:16px;padding-bottom:2px;}
  .cb-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:4px;}
  .sub-row{display:flex;align-items:center;gap:4px;margin-bottom:3px;padding-left:16px;flex-wrap:nowrap;}
  .sub-num{min-width:12px;flex-shrink:0;}
  .sub-line{flex:1;border-bottom:1px solid #888;min-height:15px;padding-left:4px;font-weight:700;white-space:nowrap;overflow-x:auto;}
  .sub-unit{padding-left:3px;flex-shrink:0;white-space:nowrap;}
  .bottom-section{border-top:1px solid #999;padding:4px 10px;flex-shrink:0;}
  .note-txt{font-size:9.5px;color:#444;font-style:italic;margin-bottom:2px;}
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
  .item-row{display:flex;align-items:flex-start;gap:5px;margin-bottom:3px;line-height:1.5;font-size:10.5px;}
  .chk{width:11px;height:11px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;}
  .chk-lg{width:12px;height:12px;border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px;margin-top:1px;}
  .hr-thin{border:none;border-top:1px solid #aaa;margin:4px 0;}
  .sig-block{border:1px solid #999;border-top:none;flex-shrink:0;font-size:10.5px;line-height:1.9;padding:4px 10px;}
  .s4-body{display:grid;grid-template-columns:1fr 1px 1fr;border:1px solid #999;border-top:none;}
  .s4-left{padding:5px 10px;}
  .s4-div{background:#999;}
  .s4-right{padding:5px 10px;}
  .s5-body{border:1px solid #999;border-top:none;padding:7px 12px;}
  .currency-badge-print {
    display:inline-block;padding:0 2px;border-radius:0;font-size:9.5px;font-weight:700;
    margin-left:4px;border:none;background:transparent;
  }
  .currency-badge-baht   { background:transparent;color:#000;border:none; }
  .currency-badge-dollar { background:transparent;color:#000;border:none; }
  .currency-badge-kip    { background:transparent;color:#000;border:none; }`

  const docHeader = `
  <div class="doc-header">
    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;margin-right:8px;">${logoHtml}</div>
    <div class="doc-title">${titleText}</div>
    <div class="doc-ref">ເລກທີ: ………………………</div>
  </div>`

  const page1 = `
<div class="page"><div class="page-inner">
  ${docHeader}
  <div class="section-bar">ສ່ວນທີ 1 : ການລາຍງານຂໍ້ມູນຈິງ</div>
  <div style="border:1px solid #999;border-top:none;">
    <div class="two-col-grid">
      <div class="col-left">
        <div class="info-row">
          <span class="info-label">ຜູ້ກະທຳຄວາມຜິດ</span><span>:</span>
          <span class="info-value">${empName}</span>
          <span class="info-id-label">ID</span><span>:</span>
          <span class="info-id-value">${empCode}</span>
        </div>
        <div class="field-row"><span class="fl-w">ຕຳແໜ່ງ</span><span class="fc">:</span><span class="fv">${empDept}</span></div>
        <div class="field-row"><span class="fl-w">ວັນທີເກີດເຫດ</span><span class="fc">:</span><span class="fv">${empDateFormatted}</span></div>
        <div class="field-row"><span class="fl-w">ສະຖານທີ່ເກີດເຫດ:</span><span class="fc">:</span><span class="fv">${empLocation}</span></div>
        <div class="info-row">
          <span class="info-label">ບຸກຄົນທີ່ຮູ້ເຫດການ:</span><span>:</span>
          <span class="info-value">${empWitness}</span>
          <span class="info-id-label">ID</span><span>:</span>
          <span class="info-id-value">${empWitnessCode}</span>
        </div>
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
          <span style="font-weight:600;font-size:11px;white-space:nowrap;">ລາຍລະອຽດເຫດການ:</span>
          <span style="font-size:11px;flex:1;line-height:1.7;padding-left:3px;">${empDetail}</span>
        </div>
      </div>
    </div>
    <div class="bottom-section">
      <div class="note-txt">ຂ້າພະເຈົ້າຂໍຮັບຮອງວ່າຂໍ້ມູນຂ້າງເທິງເປັນຄວາມຈິງທູກປະການ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px 30px;margin-top:10px;">
        <div>${docSigBlock(investigator, 'ຜູ້ສອບສວນ/ຜູ້ບັງຄັບບັນຊາ')}</div>
        <div>${docSigBlock(empName, 'ພະນັກງານທີ່ກະທຳຄວາມຜິດ')}</div>
      </div>
    </div>
  </div>

  <div class="s2-header-wrap">
    <div class="s2-header-left">ສ່ວນທີ 2 : ການພິຈາລະນາໂທດທາງວິໄນ (ຕົ້ນສັງກັດຫາລືຮ່ວມກັບຝ່າຍຊັບພະຍາກອນບຸກຄົນ)</div>
    <div class="s2-header-right">ປະຫວັດກະທຳຄວາມຜິດ ແລະ ຖືກລົງໂທດ</div>
  </div>
  <div class="s2-wrap">
    <div class="s2-left">
      <div class="item-row">${chk(hasViol)}<span>ພະນັກງານຖຶກລົງໂທດທາງວິໄນ ເລື່ອງ ໝວດ 10 ວິໄນ ແລະ ບົດລົງໂທດທາງວິໄນ ຂໍ້ 3 ວິໄນພະນັກງານ</span></div>
      ${regulationTypeLabel}
      ${regulationRowsHTML}
      <div style="font-size:9.5px;color:#333;padding-left:4px;">ຈຶ່ງແຈ້ງປະໂຫຍດດ້ວຍຕົນເອງ ແລະ ໃຫ້ທ່ານຮັບຊາບ ແລະ ຄຳນຶງດ້ວຍຕົວທ່ານເອງ</div>
    </div>
    <div class="s2-right">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;flex-wrap:wrap;">
        <span class="chk-lg">${neverPunish ? '✓' : ''}</span><span>ບໍ່ເຄີຍ</span>&nbsp;
        <span class="chk-lg">${hasPunish ? '✓' : ''}</span><span>ເຄີຍຖຶກໂທດທາງວິໄນ</span>
      </div>
      <hr class="hr-thin">
      <div style="font-size:10px;margin-top:4px;">
        <div style="display:flex;align-items:flex-end;gap:6px;line-height:1;">
          <span style="white-space:nowrap;line-height:1;min-width:70px;">ລົງຊື່ :</span>
          ${hrSigBox}
        </div>
        <div style="margin-top:2px;margin-left:calc(70px + 6px);width:180px;text-align:center;font-size:9.5px;line-height:1.15;word-break:break-word;">
          (${hrName || '____________________'})
        </div>
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
        <div>ກຳມະການຜູ້ຈັດການ ຫຼື ຜູ້ບັງຄັບບັນຊາ</div>
        <div>ແຕ່ລະພະແນກເປັນຜູ້ໂທດ ຫຼື ຜູ້ມີອຳນາດ</div>
        <div>ກະທຳການແທນ ຫຼື ເປັນຜູ້ທີ່ໄດ້ຮັບການ</div>
        <div>ມອບໝາຍທາງບໍລິສັດ</div>
        <div style="margin-top:3px;color:#c00;font-weight:700;font-size:9.5px;">****ກໍລະນີເລີກຈ້າງສົ່ງຕໍ່ HR****</div>
      </div>
    </div>
  </div>

  <div class="sig-block">
    <div style="font-size:9.5px;color:#444;font-style:italic;margin-bottom:6px;">
      ບໍລິສັດ ຈຶ່ງຂໍໃຫ້ທ່ານປັບປຸງຕົວ ຫາກທ່ານກະທຳຄວາມຜິດຊ້ຳ ອາດຖືກລົງໂທດຮ້າຍແຮງຂຶ້ນ ຮອດຂັ້ນເລີກຈ້າງໂດຍບໍ່ຈ່າຍຄ່າຊົດເຊີຍ
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;">
      <div style="margin-bottom:6px;">${punisherSigBlock}</div>
      <div style="margin-bottom:6px;">
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;">ລົງຊື່</span>
          <span style="border-bottom:1px solid #888;display:inline-flex;align-items:center;justify-content:center;width:90px;min-height:48px;flex-shrink:0;"></span>
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="font-size:10px;margin-top:2px;">(${empName}) ພະນັກງານ (ຜູ້ຖືກລົງໂທດ)</div>
      </div>
      <div style="margin-bottom:6px;">${docSigBlock(witness1Name, witness1Detail)}</div>
      <div style="margin-bottom:6px;">
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;min-width:28px;display:inline-block;">ລົງຊື່</span>
          ${hrSigBox}
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="font-size:10px;margin-top:2px;">(${hrName}) ${hrResponsib}</div>
      </div>
      <div>${docSigBlock(witness2Name, witness2Detail)}</div>
      <div></div>
    </div>
    <div style="font-size:8.5px;color:#444;font-style:italic;margin-top:6px;">
      ( ຫາກທ່ານບໍ່ພໍໃຈການຕັກເຕືອນ/ລົງໂທດຕາມໜັງສືສະບັບນີ້ ທ່ານສາມາດຍື່ນເລື່ອງອຸທອນໄດ້ຕາມຂັ້ນຕອນໃນລະບົບບໍລິສັດ )
    </div>
  </div>
</div></div>`

  const committeeRows = [
    ['1.', chairman], ['2.', viceChair], ['3.', comm1],
    ['4.', comm2],   ['5.', comm3],     ['6.', secretary],
  ].map(([n, v]) => `
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:8px;font-size:10.5px;min-height:22px;">
      <span style="min-width:14px;font-weight:600;">${n}</span>
      <span style="border-bottom:1px solid #888;flex:1;min-height:15px;padding-bottom:1px;">${v}</span>
    </div>`).join('')

  const committeeRoles = [
    ['ປະທານຄະນະກຳມະການ',    '( ຜຈກ ຂອງພະນັກງານທີ່ກະທຳຜິດ)'],
    ['ຮອງປະທານຄະນະກຳມະການ', '( ຜຈກ ໜ່ວຍງານອື່ນ)'],
    ['ເປັນກຳມະການ',          '( ຫໜ ຂອງພະນັກງານທີ່ກະທຳຜິດ)'],
    ['ເປັນກຳມະການ',          '( ຫໜ ໜ່ວຍງານອື່ນ)'],
    ['ເປັນກຳມະການ',          '( ຫໜ.ໜ່ວຍງານອື່ນ/ຜູ້ດູແລງານ)'],
    ['ກຳມະການເລຂານຸການ',     '( ສ່ວນຊັບພະຍາກອນບຸກຄົນ)'],
  ].map(([t, d]) => `
    <li style="display:flex;align-items:center;margin-bottom:8px;font-size:10.5px;min-height:22px;">
      <span style="min-width:150px;font-weight:600;white-space:nowrap;">${t}</span>
      <span style="color:#333;font-size:10px;">${d}</span>
    </li>`).join('')

  const page2 = `
<div class="page"><div class="page-inner">
  ${docHeader}
  <div class="section-bar">ສ່ວນທີ 4 ການແຕ່ງຕັ້ງຄະນະກຳມະການສອບສວນ ແລະ ພິຈາລະນາຄວາມຜິດ</div>
  <div style="font-size:10px;color:#444;font-style:italic;padding:4px 10px;border:1px solid #999;border-top:none;border-bottom:none;">
    &nbsp;&nbsp;&nbsp;&nbsp;ເພື່ອໃຫ້ການດຳເນີນການສອບສວນຫາຂໍ້ມູນຈິງສຳຫຼັບຄວາມຜິດທີ່ເກີດຂື້ນ ແລະການພິຈາລະນາໂທດທາງວິໄນເປັນໄປຢ່າງຖຶກຕ້ອງ <br> ແລະ ເກີດຕວາມຍຸດຕິທຳ ຈຶ່ງຂໍອະນຸຍາດແຕ່ງຕັ້ງຄະນະກຳມະການສອບສວນແລະພິຈາລະນາຄວາມຜິດ ດັ່ງນີ້:
  </div>
  <div class="s4-body">
    <div class="s4-left">${committeeRows}</div>
    <div class="s4-div"></div>
    <div class="s4-right"><ul style="list-style:none;padding:0;margin:0;">${committeeRoles}</ul></div>
  </div>
  <div style="display:flex;border:1px solid #999;border-top:none;">
    <div style="width:62%;padding:3px 8px;background:#fff;font-weight:700;font-size:10.5px;border-right:1px solid #999;">ຜູ້ສະເໜີ (ຜູ້ບັນຊາຕົ້ນສັງກັດ/ຝ່າຍຊັບພະຍາກອນບຸກຄົນ)</div>
    <div style="width:38%;padding:3px 8px;background:#fff;font-weight:700;font-size:10.5px;">ຜູ້ອະນຸມັດ (ກຳມະການຜູ້ຈັດການ)</div>
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
      <span>ທີ: <span style="display:inline-block;">.............................</span></span>
      <span>ວັນທີ: <span style="display:inline-block;">.............................</span></span>
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      ຂ້າພະເຈົ້າ <span style="border-bottom:1px solid #888;display:inline-block;min-width:120px;">&nbsp;${empName}&nbsp;</span>
      &nbsp;(ພະນັກງານຜູ້ກະທຳຄວາມເສຍຫາຍ ເລກບັດປະຊາຊົນ): <span style="border-bottom:1px solid #888;display:inline-block;min-width:80px;">&nbsp;</span>
    </div>
    <div style="margin-bottom:6px;line-height:1.8;">
      ທີ່ຢູ່: <span style="border-bottom:1px solid #888;display:inline-block;min-width:200px;">&nbsp;${address}&nbsp;</span>
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      <strong>5.1)</strong> ຂ້າພະເຈົ້າຍອມຮັບຜິດໃນຄວາມເສຍຫາຍທີ່ເກີດຂື້ນຈາກການຕັ້ງໃຈ ຫຼຶ ຈາກການທີ່ບໍ່ຕັ້ງໃຈ ແລະ ເປັນຜົນເກີດຄວາມເສຍຫາຍ<br> ຕໍ່ຊັບສິນຂອງບໍລິສັດໄດ້ແກ່ ເລື່ອງ:
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:130px;">&nbsp;${empDamage}&nbsp;</span>
    </div>
    ${percentLine}
    <div style="margin-bottom:4px;line-height:1.8;">
      ມູນຄ່າຊັບສິນທີ່ເສຍຫາຍເບື້ອງຕົ້ນ ຄ່າ <span style="color:#000;">${caseTypeVal || 'Excess'}</span>
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:100px;font-weight:700;">&nbsp;${displayAmountOrig}&nbsp;</span>
      <span class="currency-badge-print currency-badge-${currType}">${currLabelPrint} ${currSymbol}</span>
      ${isKipMode
        ? ''
        : `ຄິດໄລ່ເປັນເງິນກີບ
          ${amtKip
            ? `(<span style="border-bottom:1px solid #888;display:inline-block;min-width:90px;font-weight:700;">&nbsp;${amtKip} ກີບ&nbsp;</span>)`
            : `(<span style="border-bottom:1px solid #888;display:inline-block;min-width:90px;">&nbsp;&nbsp;</span>)`
          }`
      }
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      <strong>5.2)</strong> ຂ້າພະເຈົ້າຍິນຍອມໃຫ້ບໍລິສັດຕັດເງິນຕາມຂໍ້ 5.1) ຈຳນວນ
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:90px;font-weight:700;">&nbsp;${amtKip}&nbsp;</span>
      ກີບ ອອກຈາກເງິນຄ່າຈ້າງ
    </div>
    <div style="margin-bottom:4px;line-height:1.8;">
      ໂດຍແບ່ງເປັນ
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:35px;font-weight:700;">&nbsp;${installment}&nbsp;</span>
      ງວດ, ງວດລະ
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:90px;font-weight:700;">&nbsp;${perInstall}&nbsp;</span>
      ກີບ, ຕັ້ງແຕ່ງວດວັນທີ:
      <span style="border-bottom:1px solid #888;display:inline-block;min-width:80px;font-weight:700;">&nbsp;${payDateFormatted}&nbsp;</span>
    </div>
    <div style="margin-bottom:6px;line-height:1.8;">ຫາກຂ້າພະເຈົ້າບໍ່ຍອມຊຳລະ ບໍລິສັດມີສິດດຳເນີນຄະດີຕາມກົດໝາຍ</div>
    <div style="margin-bottom:6px;line-height:1.7;">
      <strong>5.3)</strong> ກໍລະນີທີ່ຂ້າພະເຈົ້າພົ້ນຈາກການເປັນພະນັກງານ ໂດຍຍັງມີສ່ວນທີ່ຄ້າງຊຳລະຄ່າເສຍຫາຍ ຂ້າພະເຈົ້າຍິນດີນຳເງິນມາຊຳລະຕ່າເສຍຫາຍທັງໝົດ <br> ໂດຍໄວທີ່ສູດພາຍໃນ 7 ວັນ ຫຼື ຕາມຕົົກລົງກັນ.
    </div>
    <div style="font-size:9.5px;color:#444;font-style:italic;margin-bottom:12px;">
      (ຂ້າພະເຈົ້າໄດ້ອ່ານແລະເຂົ້າໃຈໃນຂໍ້ຄວາມດີແລ້ວ ຈຶ່ງໄດ້ລົງລາຍເຊັນຊື່ໄວ້ເພື່ອເປັນຫຼັກຖານ)
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
      <div style="margin-bottom:4px;">
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;">ລົງຊື່</span>
          <span style="border-bottom:1px solid #888;display:inline-flex;align-items:center;justify-content:center;width:90px;min-height:48px;flex-shrink:0;"></span>
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="font-size:10px;margin-top:2px;">(${witness2Name}) ${witness2Detail}</div>
      </div>
      <div style="margin-bottom:4px;">
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;">ລົງຊື່</span>
          <span style="border-bottom:1px solid #888;display:inline-flex;align-items:center;justify-content:center;width:90px;min-height:48px;flex-shrink:0;"></span>
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="font-size:10px;margin-top:2px;">(${empName}) ພະນັກງານ</div>
      </div>
      <div>
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;">ລົງຊື່</span>
          <span style="border-bottom:1px solid #888;display:inline-flex;align-items:center;justify-content:center;width:90px;min-height:48px;overflow:hidden;flex-shrink:0;"></span>
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="font-size:10px;margin-top:2px;">(${witness1Name}) ${witness1Detail}</div>
      </div>
      <div>
        <div style="display:flex;align-items:flex-end;gap:3px;">
          <span style="white-space:nowrap;line-height:1;">ລົງຊື່</span>
          ${hrSigBox}
          <span style="white-space:nowrap;font-size:9.5px;line-height:1;">ວັນທີ ____/____/______</span>
        </div>
        <div style="margin-top:2px;margin-left:calc(28px + 3px);width:180px;text-align:center;font-size:10px;line-height:1.15;word-break:break-word;">
          <div>(${hrName || '____________________'})</div>
          <div>${hrResponsib}</div>
        </div>
      </div>
    </div>
  </div>
</div></div>`

  return `<!DOCTYPE html>
<html lang="lo"><head><meta charset="UTF-8"><title>${titleText}</title>
<style>${css}</style>
</head><body>
${page1}
${page2}
</body></html>`
}

// ==================== Render iframe → Canvas ====================
const renderPageToCanvas = (fullHtml, pageIndex) => new Promise((resolve, reject) => {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:0;left:-9999px;width:794px;height:1123px;border:none;visibility:hidden;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument
  doc.open(); doc.write(fullHtml); doc.close()

  const tryCapture = async (attempt = 0) => {
    try {
      await new Promise(r => setTimeout(r, 900))
      const pages = doc.querySelectorAll('.page')
      const target = pages[pageIndex] || doc.body
      const canvas = await window.html2canvas(target, {
        scale: 2, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', width: 794, windowWidth: 794,
        scrollX: 0, scrollY: 0, logging: false,
      })
      document.body.removeChild(iframe)
      resolve(canvas)
    } catch (err) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 500))
        tryCapture(attempt + 1)
      } else {
        document.body.removeChild(iframe)
        reject(err)
      }
    }
  }
  iframe.onload = () => tryCapture()
})

// ==================== ดาวน์โหลด PDF ====================
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
    const fullHtml = getPrintHTML(c, logo1, logo2, hrImgB64)
    const canvas1  = await renderPageToCanvas(fullHtml, 0)
    const canvas2  = await renderPageToCanvas(fullHtml, 1)
    const { jsPDF } = window.jspdf
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    pdf.addImage(canvas1.toDataURL('image/jpeg', 0.97), 'JPEG', 0, 0, 210, 297)
    pdf.addPage()
    pdf.addImage(canvas2.toDataURL('image/jpeg', 0.97), 'JPEG', 0, 0, 210, 297)
    const name = (c.employee_name || 'document').replace(/\s+/g, '_')
    pdf.save(`ໜັງສືໃບເຕືອນ_${name}.pdf`)
  } catch (err) {
    console.error('PDF Error:', err)
    alert('เกิดข้อผิดพลาด: ' + err.message)
  } finally {
    downloadingId.value = null
  }
}
</script>

<style scoped>
.page-wrapper{padding:0;font-family:'Nunito','Barlow',sans-serif;}
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
.filter-box{position:relative;min-width:180px;max-width:260px;}
.filter-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#64748b;font-size:12px;pointer-events:none;}
.filter-select{width:100%;padding:8px 10px 8px 30px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;font-family:inherit;font-weight:600;background:#fff;color:#1e293b;outline:none;transition:all 0.2s;appearance:none;background-image:linear-gradient(45deg,transparent 50%,#64748b 50%),linear-gradient(135deg,#64748b 50%,transparent 50%);background-position:calc(100% - 16px) 50%,calc(100% - 11px) 50%;background-size:5px 5px,5px 5px;background-repeat:no-repeat;}
.filter-select:focus{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,0.12);}
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
.cases-table td{padding:11px 14px;color:#1e293b;vertical-align:middle;}
.td-num{text-align:center;font-size:11.5px;font-weight:700;color:#64748b;}
.badge-code{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;background:rgba(25,118,210,0.08);border:1px solid rgba(25,118,210,0.18);border-radius:6px;font-size:11.5px;font-weight:800;color:#0ea5e9;white-space:nowrap;}
.badge-code i{font-size:10px;opacity:0.7;}
.cell-name{display:flex;align-items:center;gap:9px;}
.avatar-circle{width:30px;height:30px;border-radius:50%;background:#0ea5e9;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.name-text{font-weight:700;color:#1e293b;}
.position-text{display:flex;align-items:center;gap:5px;font-size:12px;color:#64748b;font-weight:600;}
.pos-icon{font-size:10px;opacity:0.6;}
.location-text{display:flex;align-items:center;gap:5px;font-size:12px;color:#64748b;font-weight:600;}
.loc-icon{font-size:10px;color:#ef4444;opacity:0.8;}
.creator-tag{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#64748b;}
.creator-tag i{font-size:11px;opacity:0.7;}
.date-cell{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#64748b;font-weight:600;white-space:nowrap;}
.date-icon{font-size:11px;opacity:0.5;}
.null-dash{color:#cbd5e1;font-size:14px;}
.case-type-badge{display:inline-flex;align-items:center;justify-content:center;padding:3px 9px;border-radius:999px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);font-size:11px;font-weight:700;color:#1d4ed8;white-space:nowrap;}
.action-wrap{display:flex;align-items:center;gap:6px;}
.btn-edit{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.25);border-radius:7px;color:#0284c7;font-size:12px;cursor:pointer;transition:all 0.15s;flex-shrink:0;}
.btn-edit:hover:not(:disabled){background:rgba(14,165,233,0.18);transform:translateY(-1px);}
.btn-edit:disabled{opacity:0.5;cursor:not-allowed;}
.btn-pdf{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;background:rgba(234,179,8,0.12);border:1px solid rgba(234,179,8,0.35);border-radius:7px;color:#b45309;font-size:11.5px;font-weight:700;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
.btn-pdf:hover:not(:disabled){background:rgba(234,179,8,0.22);transform:translateY(-1px);}
.btn-pdf:disabled{opacity:0.6;cursor:not-allowed;}
.btn-pdf i{font-size:12px;}
.btn-delete{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:7px;color:#ef4444;font-size:12px;cursor:pointer;transition:all 0.15s;flex-shrink:0;}
.btn-delete:hover:not(:disabled){background:rgba(239,68,68,0.18);transform:translateY(-1px);}
.btn-delete:disabled{opacity:0.5;cursor:not-allowed;}
.state-cell{padding:0 !important;}
.state-content{display:flex;flex-direction:column;align-items:center;gap:10px;padding:52px 24px;color:#64748b;font-size:13px;font-weight:600;}
.empty-icon-wrap{width:52px;height:52px;border-radius:50%;background:#f8fafc;border:2px dashed #e2e8f0;display:flex;align-items:center;justify-content:center;}
.empty-icon-wrap i{font-size:20px;color:#64748b;opacity:0.5;}
.empty-title{font-size:13.5px;font-weight:700;color:#1e293b;}
.empty-sub{font-size:12px;color:#64748b;}
.spinner{width:28px;height:28px;border:3px solid #e2e8f0;border-top-color:#0ea5e9;border-radius:50%;animation:spin 0.7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.card-footer{padding:10px 16px;border-top:1px solid #e2e8f0;background:#f8fafc;}
.footer-info{font-size:12px;color:#64748b;font-weight:600;}
.fade-enter-active,.fade-leave-active{transition:opacity 0.2s,transform 0.2s;}
.fade-enter-from,.fade-leave-to{opacity:0;transform:scale(0.95);}

.app-root.dark .page-wrapper{background:#0f172a;color:#e5e7eb;}
.app-root.dark .card{background:#1a1a2e;border-color:#374151;color:#e5e7eb;}
.app-root.dark .card-toolbar{border-bottom-color:#374151;}
.app-root.dark thead{background:#0f172a;color:#d1d5db;border-bottom-color:#374151;}
.app-root.dark tbody tr{border-color:#374151;}
.app-root.dark tbody tr:hover{background:#2d3748;}
.app-root.dark td{border-color:#374151;color:#d1d5db;}
.app-root.dark th{color:#d1d5db;border-color:#374151;}
.app-root.dark .search-input{background:#2d3748;border-color:#4b5563;color:#e5e7eb;}
.app-root.dark .search-input::placeholder{color:#9ca3af;}
.app-root.dark .filter-select{background:#2d3748;border-color:#4b5563;color:#e5e7eb;}
.app-root.dark .empty-icon-wrap{background:#2d3748;border-color:#4b5563;}
.app-root.dark .empty-icon-wrap i{color:#6b7280;}
.app-root.dark .empty-title{color:#d1d5db;}
.app-root.dark .empty-sub{color:#a0aec0;}
.app-root.dark .card-footer{background:#2d3748;border-top-color:#374151;}
.app-root.dark .footer-info{color:#a0aec0;}
.app-root.dark h1,.app-root.dark h2,.app-root.dark h3{color:#e5e7eb;}
.app-root.dark p{color:#a0aec0;}
</style>