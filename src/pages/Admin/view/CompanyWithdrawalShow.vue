<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWalkieAssetStore } from '@/stores/walkie_asset.store'
import Swal from 'sweetalert2'

const store = useWalkieAssetStore()
const router = useRouter()

const searchQuery = ref('')
const deletingId = ref(null)
const downloadingId = ref(null)

// ── Image Preview Modal ──
const showImageModal = ref(false)
const previewImageUrl = ref('')

function openImagePreview(url) {
  if (!url) return
  previewImageUrl.value = url
  showImageModal.value = true
}

// ── Lifecycle ─────────────────────────────────────────────
onMounted(async () => {
  store.fetchRequests()
})

// ── Computed ──────────────────────────────────────────────
const filteredList = computed(() => {
  if (!searchQuery.value.trim()) return store.requests
  const q = searchQuery.value.toLowerCase()
  return store.requests.filter(item =>
    (item.first_name || '').toLowerCase().includes(q) ||
    (item.last_name || '').toLowerCase().includes(q) ||
    (item.employee_code || '').toLowerCase().includes(q) ||
    (item.request_type || '').toLowerCase().includes(q) ||
    (item.request_item || '').toLowerCase().includes(q)
  )
})

// ── Functions ─────────────────────────────────────────────
function formatDateDMY(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d)) return val
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

// ── Print Functions ───
const LOGO_URL_1 = "https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg"
const LOGO_URL_2 = "https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png"

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

async function downloadPDF(item) {
  downloadingId.value = item.id
  try {
    await Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
    ])

    const [logo1, logo2, assetImgB64, sig1B64, sig2B64] = await Promise.all([
      toBase64(LOGO_URL_1),
      toBase64(LOGO_URL_2),
      item.image_url ? toBase64(item.image_url) : Promise.resolve(''),
      item.signature1_url ? toBase64(item.signature1_url) : Promise.resolve(''),
      item.signature2_url ? toBase64(item.signature2_url) : Promise.resolve(''),
    ])

    const htmlContent = buildPrintHTML(item, logo1, logo2, assetImgB64, sig1B64, sig2B64)

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:0;left:-9999px;width:210mm;min-height:297mm;border:none;'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument
    doc.open(); doc.write(htmlContent); doc.close()

    iframe.onload = async () => {
      try {
        await new Promise(r => setTimeout(r, 1000))
        const sheets = doc.body.querySelectorAll('.a4-sheet')
        
        const { jsPDF } = window.jspdf
        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

        for (let i = 0; i < sheets.length; i++) {
          const canvas = await window.html2canvas(sheets[i], {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
          })
          const imgData = canvas.toDataURL('image/jpeg', 0.95)
          if (i > 0) pdf.addPage()
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
        }

        const fileName = `Withdrawal_${item.employee_code || 'Doc'}_${new Date().getTime()}.pdf`
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

function buildPrintHTML(item, logo1, logo2, assetImg, sig1, sig2) {
  const ts = new Date().toLocaleString('th-TH')
  const partsText = (item.component || '').replace(/^[-\u2022*]\s*/gm, '')
  const fullName = `${item.title || ''}${item.first_name} ${item.last_name}`.trim()

  const photoHTML = assetImg 
    ? `<img src="${assetImg}" style="max-width:100%;max-height:650px;object-fit:contain;display:block;">`
    : '<div style="color:#ccc;font-size:2.5rem;text-align:center;">📷</div><div style="color:#ccc;font-size:9pt;text-align:center;margin-top:6px;">ไม่มีรูปภาพ</div>'

  const sig1HTML = sig1
    ? `<div class="sig-col-img-wrap"><img src="${sig1}" class="sig-col-img"></div>`
    : '<div class="sig-col-dots">.................................</div>'

  const sig2HTML = sig2
    ? `<div class="sig-col-img-wrap"><img src="${sig2}" class="sig-col-img"></div>`
    : '<div class="sig-col-dots">.................................</div>'

  const amountFormatted = item.amount ? Number(item.amount).toLocaleString() : '0'

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@100..900&family=Prompt:wght@100;300;400;500;600;700&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Phetsarath&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
          body { margin: 0; padding: 0; background: white; }
          .print-container { width: 210mm; }
          .a4-sheet {
            width: 210mm;
            height: 297mm;
            background: white;
            padding: 12mm 15mm 16mm 15mm;
            font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
            font-size: 9.5pt;
            line-height: 1.5;
            color: #1a1a1a;
            position: relative;
            page-break-after: always;
          }
          .lao-text { font-family: 'Phetsarath', 'Noto Sans Lao', sans-serif !important; line-height: 1.8; }
          .doc-header { display: flex; align-items: center; margin-bottom: 10px; }
          .doc-logo { background: white; padding: 5px 8px; border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; gap: 10px; }
          .doc-logo img { height: 35px; width: auto; object-fit: contain; display: block; }
          .doc-title-center { flex: 1; text-align: center; font-size: 14pt; font-weight: 800; color: #1a1a1a; }
          .doc-header-spacer { width: 110px; flex-shrink: 0; }
          .sec-box { border: 1.5px solid #444; margin-bottom: 8px; }
          .sec-title { background: #b8b8b8; text-align: center; font-weight: 700; font-size: 10pt; padding: 4px 10px; border-bottom: 1.5px solid #444; color: #1a1a1a; }
          .sec-body { padding: 6px 14px; }
          .info-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
          .info-left { padding-right: 12px; border-right: 1px solid #ccc; }
          .info-right { padding-left: 12px; }
          .info-row { display: grid; grid-template-columns: 105px 1fr; align-items: baseline; padding: 3.5px 0; gap: 2px; }
          .info-lbl { font-weight: 700; color: #111; font-size: 8.8pt; white-space: nowrap; }
          .info-val { font-size: 8.8pt; color: #1a1a1a; min-height: 15px; word-break: break-word; }
          .info-row-full { display: grid; grid-template-columns: 160px 1fr; align-items: baseline; padding: 3.5px 0; gap: 2px; }
          .info-lbl-lg { font-weight: 700; color: #111; font-size: 8.8pt; white-space: nowrap; }
          .info-val-full { font-size: 8.8pt; color: #1a1a1a; min-height: 15px; }
          .info-val-tall { min-height: 28px; white-space: pre-wrap; }
          .sig-emp-section { margin-top: 14px; display: flex; flex-direction: column; align-items: center; margin-left: auto; width: 50%; padding-right: 10mm; }
          .sig-emp-dots { font-size: 9.5pt; letter-spacing: 2px; color: #000; margin-top: 22px; text-align: center; }
          .sig-emp-name { font-size: 8.8pt; color: #222; text-align: center; margin-top: 3px; }
          .sig-emp-date { font-size: 9pt; margin-top: 6px; display: flex; align-items: center; gap: 6px; align-self: flex-start; }
          .sig-bottom-wrap { display: grid; grid-template-columns: 1fr 1fr; margin-top: 20px; padding-left: 10%; padding-right: 2%; gap: 0; }
          .sig-col { display: flex; flex-direction: column; align-items: flex-start; padding: 0 8px; }
          .sig-col-label { font-size: 9pt; font-weight: 600; margin-bottom: 0; }
          .sig-col-img-wrap { height: 90px; width: 220px; display: flex; align-items: center; justify-content: flex-start; margin-top: 6px; margin-left: 28px; overflow: hidden; }
          .sig-col-img { max-height: 88px; max-width: 218px; width: auto; height: auto; object-fit: contain; display: block; }
          .sig-col-dots { font-size: 9.5pt; letter-spacing: 1.5px; color: #444; margin-top: 60px; margin-left: 28px; }
          .sig-col-name { font-size: 8.5pt; color: #222; margin-top: 3px; margin-left: 28px; }
          .sig-col-date { font-size: 8.5pt; margin-top: 4px; display: flex; align-items: center; gap: 4px; margin-left: 28px; }
          .sig-col-role { font-size: 7.8pt; color: #444; margin-top: 3px; line-height: 1.45; margin-left: 28px; }
          .doc-timestamp { position: absolute; bottom: 10mm; right: 15mm; font-size: 7.5pt; color: #666; }
          .p2-cond-title { background: #b8b8b8; text-align: center; font-weight: 700; font-size: 10pt; padding: 4px 10px; border: 1.5px solid #444; border-bottom: none; color: #1a1a1a; }
          .p2-cond-box { border: 1.5px solid #444; padding: 8px 14px; margin-bottom: 16px; font-size: 8pt; line-height: 1.75; color: #1a1a1a; }
          .p2-photo-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 14px; width: 95%; border: 1px solid #ccc; padding: 5px; background: white; min-height: 400px; }
          .p2-photo-wrap img { max-width: 100%; max-height: 650px; object-fit: contain; display: block; }
          .p2-sig-wrap { display: flex; flex-direction: column; align-items: center; margin-top: 18px; }
          .p2-sig-label { font-size: 9.5pt; font-weight: 600; }
          .p2-sig-dots { font-size: 9.5pt; letter-spacing: 2px; color: #000; margin-top: 22px; }
          .p2-sig-name { font-size: 8.8pt; color: #222; margin-top: 3px; text-align: center; }
          .p2-sig-date { font-size: 9pt; margin-top: 6px; display: flex; align-items: center; gap: 6px; }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="a4-sheet">
            <div class="doc-header">
              <div class="doc-logo">
                <img src="${logo1}" alt="Logo 1">
                <img src="${logo2}" alt="Logo 2">
              </div>
              <div class="doc-title-center">แบบฟอร์มขอเบิกทรัพย์สินบริษัท</div>
              <div class="doc-header-spacer"></div>
            </div>

            <div class="sec-box">
              <div class="sec-title">ข้อมูลส่วนพนักงาน</div>
              <div class="sec-body">
                <div class="info-2col">
                  <div class="info-left">
                    <div class="info-row"><span class="info-lbl">รหัสพนักงาน :</span><span class="info-val">${item.employee_code || ''}</span></div>
                    <div class="info-row"><span class="info-lbl">ชื่อ และ นามสกุล :</span><span class="info-val">${fullName}</span></div>
                    <div class="info-row"><span class="info-lbl">ตำแหน่ง :</span><span class="info-val">${item.position || ''}</span></div>
                    <div class="info-row"><span class="info-lbl">แผนก :</span><span class="info-val">${item.department || ''}</span></div>
                  </div>
                  <div class="info-right">
                    <div class="info-row"><span class="info-lbl">โครงการ :</span><span class="info-val">${item.project || ''}</span></div>
                    <div class="info-row"><span class="info-lbl">บริษัท :</span><span class="info-val">${item.company || ''}</span></div>
                    <div class="info-row"><span class="info-lbl">อายุงาน :</span><span class="info-val">${item.work_age || ''}</span></div>
                    <div class="info-row"><span class="info-lbl">เบอร์โทร :</span><span class="info-val">${item.phone || ''}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="sec-box">
              <div class="sec-title">ส่วนรายการขอเบิกทรัพย์สิน</div>
              <div class="sec-body">
                <div class="info-row-full"><span class="info-lbl-lg">หัวข้อการขอเบิกทรัพย์สิน :</span><span class="info-val-full">${item.request_type || ''}</span></div>
                <div class="info-row-full"><span class="info-lbl-lg">รายการขอเบิก :</span><span class="info-val-full">${item.request_item || ''}</span></div>
                <div class="info-row-full"><span class="info-lbl-lg">หมายเหตุ :</span><span class="info-val-full">${item.remark || ''}</span></div>
                <div class="info-row-full"><span class="info-lbl-lg">ASSET Number :</span><span class="info-val-full">${item.asset_no || '–'}</span></div>
                <div class="info-row-full" style="margin-top:3px;"><span class="info-lbl-lg">Serial Number :</span><span class="info-val-full">${item.serial_no || ''}</span></div>
                <div class="info-row-full" style="margin-top:3px;"><span class="info-lbl-lg">รายละเอียด :</span><span class="info-val-full">${item.detail || ''}</span></div>
                <div class="info-row-full" style="margin-top:3px;"><span class="info-lbl-lg">ส่วนประกอบ :</span><span class="info-val-full info-val-tall">${partsText}</span></div>
                <div class="info-row-full" style="margin-top:5px;"><span class="info-lbl-lg">วันที่ :</span><span class="info-val-full">${item.item_date || ''}</span></div>
                <div class="info-row-full"><span class="info-lbl-lg">จำนวนเงิน :</span><span class="info-val-full">${amountFormatted}</span></div>
              </div>
            </div>

            <div class="sig-emp-section">
              <div class="p2-sig-label">ลงชื่อพนักงานผู้ร้องขอ :</div>
              <div class="sig-emp-dots"> .............................</div>
              <div class="sig-emp-name">( ${fullName || '.................................................'} )</div>
              <div class="sig-emp-date">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>วันที่ :</strong><span style="color:#555;letter-spacing:1px;">....... / ....... / .......</span></div>
            </div>

            <div class="sig-bottom-wrap">
              <div class="sig-col">
                <div class="sig-col-label">ลงชื่อ:</div>
                ${sig1HTML}
                <div class="sig-col-name">( ${item.signer1_name || ''} )</div>
                <div class="sig-col-date"><strong>วันที่ :</strong><span style="color:#555;">......... / ......... / .........</span></div>
                <div class="sig-col-role">${item.signer1_position || ''}</div>
              </div>
              <div class="sig-col">
                <div class="sig-col-label">ลงชื่อ:</div>
                ${sig2HTML}
                <div class="sig-col-name">( ${item.signer2_name || ''} )</div>
                <div class="sig-col-date"><strong>วันที่ :</strong><span style="color:#555;">......... / ......... / .........</span></div>
                <div class="sig-col-role">${item.signer2_position || ''}</div>
              </div>
            </div>

            <div class="doc-timestamp">${ts}</div>
          </div>

          <div class="a4-sheet" style="display:flex;flex-direction:column;">
            <div class="p2-cond-title lao-text"><u>เงื่ยนไข</u></div>
            <div class="p2-cond-box lao-text">
              1. ພະນັກງານຕ້ອງດູແລຊັບສິນຂອງຜູ້ວ່າຈ້າງໃຫ້ດີທີ່ສຸດ ແລະ ຮັບຜິດຊອບໃນຊັບສິນของບໍລິສັດ<br>
              2. ຫຼັງຈາກພັກ ສະພາບຄວາມເປັນພະນັກງານຕ້ອງຄືນຊັບສິນของບໍລິສັດທັງໝົດໃນສະພາບທີ່ດີ ຫຼື ໃນສະພາບທີ່ບໍລິສັດກວດສອບ ແລ້ວພໍໃຈ ກໍລະນີທີ່ຊັບສິນເສยຫາຍ/ສູນຫາຍ ພະນັກງານต้องรับผิดชอบ ยกเว้น: ทรัพย์สินที่เสื่อมสภาพนั้น เกิดจากอายุการใช้งาน หรือ ต้องไม่ได้รับความเสื่อมสภาพจากการใช้งานโดยความประมาท ไม่ระมัดระวัง หรือ จงใจ ให้ได้ความเสียหาย โดยบริษัทจะพิจารณาตามเหตุผล และ ข้อแท้จริงที่เกิดขึ้น โดยค่าซ่อมแซม วัสดุ อุปกรณ์ต่างๆ ที่เกิดขึ้น เพื่อให้กลับมาใช้ได้ตามสภาพเดิมนั้น บริษัทอาจให้พนักงานชดใช้ค่า เสียหาย/สูญหายดังกล่าวที่เกิดขึ้น โดยจ่ายตามจริงตามใบเสร็จรับเงิน ทั้งนี้ บริษัทยินยอมชดใช้เป็นเงินสด หรือ ให้หักจากบัญชีเงินเดือนได้ ตามที่มียอดแจ้งชำระหนี้ตามจริง<br>
              3. สัญญาฉบับนี้ มีผลทันที. สัญญานี้ ทั้งสองฝ่ายได้อ่าน เข้าใจข้อความ โดยละเอียด แล้วจึงได้ลงลายเซ็นชื่อ ไว้เป็นหลักฐานสำคัญ ต่อหน้าพยาน.
            </div>

            <div class="p2-photo-wrap">${photoHTML}</div>

            <div class="p2-sig-wrap">
              <div class="p2-sig-label">ลงชื่อพนักงานผู้ร้องขอ :</div>
              <div class="p2-sig-dots">.........................</div>
              <div class="p2-sig-name">( ${fullName || '.................................................'} )</div>
              <div class="p2-sig-date"><strong>วันที่ :</strong><span style="color:#555;letter-spacing:1px;">....... / ....... / .......</span></div>
            </div>

            <div class="doc-timestamp">${ts}</div>
          </div>
        </div>
      </body>
    </html>
  `
}

async function handleDelete(item) {
  const result = await Swal.fire({
    title: 'ยืนยันการลบ?',
    html: `ลบข้อมูลใบเบิกของ <strong>${item.first_name} ${item.last_name}</strong><br>
           <span style="font-size:13px;color:#888;">การลบไม่สามารถกู้คืนได้</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: '<i class="fa fa-trash"></i> ลบเลย',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
  })

  if (result.isConfirmed) {
    deletingId.value = item.id
    try {
      await store.deleteRequest(item.id)
      Swal.fire({ title: 'ลบสำเร็จ!', text: 'ข้อมูลถูกลบเรียบร้อยแล้ว.', icon: 'success', timer: 1500, showConfirmButton: false })
      store.fetchRequests()
    } catch (e) {
      Swal.fire('เกิดข้อผิดพลาด!', e.message, 'error')
    } finally {
      deletingId.value = null
    }
  }
}

function handleEdit(item) {
  // ส่งข้อมูลไปยังหน้าฟอร์มผ่าน state ของ router
  router.push({
    name: 'CompanyWithdrawal',
    state: { editData: JSON.parse(JSON.stringify(item)) }
  })
}
</script>

<template>
  <div class="page-wrapper">
    <!-- ── Page Header ── -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon-wrap"><i class="fa fa-file-invoice"></i></div>
        <div>
          <h1 class="page-title">รายงานข้อมูลใบขอเบิกทรัพย์สิน</h1>
          <p class="page-subtitle">แสดงรายการประวัติการขอเบิกทรัพย์สินทั้งหมดในระบบ</p>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn-back" @click="router.push('/admin/company-withdrawal')">
          <i class="fas fa-arrow-left"></i> กลับไปฟอร์ม
        </button>
      </div>
    </div>

    <!-- ── Card ── -->
    <div class="card">
      <div class="card-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <i class="fa fa-magnifying-glass search-icon"></i>
            <input v-model="searchQuery" type="text"
              placeholder="ค้นหา รหัส, ชื่อ, หัวข้อ, รายการ..."
              class="search-input" />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <i class="fa fa-xmark"></i>
            </button>
          </div>

          <transition name="fade">
            <div class="result-chip" v-if="searchQuery">
              <i class="fa fa-filter-circle-xmark"></i> พบ <strong>{{ filteredList.length }}</strong> รายการ
            </div>
          </transition>
        </div>
        <div class="toolbar-right">
          <div class="count-chip">
            <i class="fa fa-list"></i>
            <span>ทั้งหมด <strong>{{ store.requests.length }}</strong> รายการ</span>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="cases-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th>รูปภาพ</th>
              <th>รหัสพนักงาน</th>
              <th>ชื่อ-นามสกุล</th>
              <th>หัวข้อ / รายการเบิก</th>
              <th>วันที่เบิก</th>
              <th>จำนวนเงิน</th>
              <th>บันทึกโดย / วันที่</th>
              <th class="th-actions">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="9" class="state-cell">
                <div class="state-content">
                  <div class="spinner"></div><span>กำลังโหลดข้อมูล...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredList.length === 0">
              <td colspan="9" class="state-cell">
                <div class="state-content empty">
                  <div class="empty-icon-wrap"><i class="fa fa-folder-open"></i></div>
                  <span class="empty-title">{{ searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่พบข้อมูล' }}</span>
                  <span class="empty-sub" v-if="searchQuery">ลองใช้คำค้นหาอื่น</span>
                </div>
              </td>
            </tr>
            <tr v-for="(item, idx) in filteredList" :key="item.id" class="data-row">
              <td class="td-num">{{ idx + 1 }}</td>
              <td>
                <div class="img-preview-cell" v-if="item.image_url" @click="openImagePreview(item.image_url)" style="cursor: zoom-in;" title="คลิกเพื่อดูรูปขยาย">
                  <img :src="item.image_url" alt="Asset" />
                </div>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <span class="badge-code" v-if="item.employee_code">
                  <i class="fa fa-id-badge"></i>{{ item.employee_code }}
                </span>
                <span v-else class="null-dash">—</span>
              </td>
              <td>
                <div class="cell-name">
                  <div class="avatar-circle">{{ item.first_name?.charAt(0) }}</div>
                  <span class="name-text">{{ item.title || '' }}{{ item.first_name }} {{ item.last_name }}</span>
                </div>
              </td>
              <td>
                <div class="item-info">
                  <span class="item-type">{{ item.request_type }}</span>
                  <span class="item-name">{{ item.request_item }}</span>
                </div>
              </td>
              <td>
                <div class="date-cell">
                  <i class="fa fa-calendar date-icon"></i>{{ item.item_date || '-' }}
                </div>
              </td>
              <td>
                <span class="amount-text">{{ item.amount ? Number(item.amount).toLocaleString() : '0' }}</span>
              </td>
              <td>
                <div class="creator-col">
                  <span class="creator-tag" v-if="item.system_users?.fullname">
                    <i class="fa fa-user"></i>{{ item.system_users.fullname }}
                  </span>
                  <div class="date-cell" style="margin-top: 4px;">
                    <i class="fa fa-clock date-icon"></i>{{ formatDate(item.created_at) }}
                  </div>
                </div>
              </td>
              <td>
                <div class="action-wrap">
                  <button class="btn-pdf" @click="downloadPDF(item)"
                    :disabled="downloadingId === item.id" title="ดาวน์โหลด PDF">
                    <i :class="downloadingId === item.id ? 'fa fa-spinner fa-spin' : 'fa fa-file-pdf'"></i>
                    {{ downloadingId === item.id ? 'กำลังสร้าง...' : 'PDF' }}
                  </button>
                  <button class="btn-edit-action" @click="handleEdit(item)" title="แก้ไขข้อมูล">
                    <i class="fa fa-pen-to-square"></i>
                  </button>
                  <button class="btn-delete" @click="handleDelete(item)"
                    :disabled="deletingId === item.id" title="ลบรายการ">
                    <i :class="deletingId === item.id ? 'fa fa-spinner fa-spin' : 'fa fa-trash'"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-footer" v-if="!store.loading && filteredList.length > 0">
        <span class="footer-info">แสดง {{ filteredList.length }} จาก {{ store.requests.length }} รายการ</span>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <div v-if="showImageModal" class="image-modal-overlay" @click.self="showImageModal = false">
      <div class="image-modal-content animate-in">
        <button class="btn-close-modal" @click="showImageModal = false">&times;</button>
        <img :src="previewImageUrl" alt="Preview" class="full-preview-img">
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&display=swap');

.page-wrapper{padding:24px;font-family:'Noto Sans Lao','Noto Sans Thai','Nunito','Barlow',sans-serif;}
.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;}
.page-header-left{display:flex;align-items:center;gap:14px;}
.page-icon-wrap{width:44px;height:44px;border-radius:12px;background:#0ea5e9;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.page-icon-wrap i{color:#fff;font-size:18px;}
.page-title{font-size:18px;font-weight:800;color:#1e293b;line-height:1.2;margin:0;}
.page-subtitle{font-size:12px;color:#64748b;margin:2px 0 0;}

.btn-back {
  padding: 8px 16px; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px;
  color: #64748b; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px;
}
.btn-back:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }

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

.img-preview-cell { width: 60px; height: 40px; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; background: #f8fafc; }
.img-preview-cell img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
.img-preview-cell:hover img { transform: scale(1.1); }

/* Image Modal Styles */
.image-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
  padding: 20px;
}

.image-modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.full-preview-img {
  max-width: 100%;
  max-height: 85vh;
  border-radius: 8px;
  box-shadow: 0 0 30px rgba(0,0,0,0.5);
  object-fit: contain;
}

.btn-close-modal {
  position: absolute;
  top: -40px;
  right: -40px;
  background: none;
  border: none;
  color: white;
  font-size: 40px;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-close-modal:hover {
  color: #ef4444;
}

.animate-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.badge-code{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;background:#f1f5f9;border-radius:6px;color:#475569;font-weight:700;font-size:11.5px;}
.cell-name{display:flex;align-items:center;gap:10px;}
.avatar-circle{width:28px;height:28px;border-radius:50%;background:#0ea5e9;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;text-transform:uppercase;}
.name-text{font-weight:700;color:#1e293b;}

.item-info { display: flex; flex-direction: column; gap: 2px; }
.item-type { font-weight: 700; color: #0ea5e9; font-size: 11px; }
.item-name { color: #475569; font-weight: 600; }

.amount-text { font-weight: 800; color: #10b981; }

.date-cell{display:inline-flex;align-items:center;gap:6px;color:#475569;font-weight:600; white-space: nowrap;}
.date-icon{font-size:11px;color:#94a3b8;}

.creator-tag{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;color:#64748b;font-weight:600;font-size:11px;}
.creator-col { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }

.action-wrap{display:flex;align-items:center;gap:6px;}
.btn-pdf{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#0ea5e9;border:none;border-radius:8px;color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;transition:all 0.2s;}
.btn-pdf:hover:not(:disabled){background:#0284c7;transform:translateY(-1px);box-shadow:0 4px 6px -1px rgba(14,165,233,0.2);}
.btn-pdf:disabled{opacity:0.6;cursor:not-allowed;}

.btn-edit-action{width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;color:#0ea5e9;cursor:pointer;transition:all 0.2s;}
.btn-edit-action:hover{background:#0ea5e9;border-color:#0ea5e9;color:#fff;}

.btn-delete{width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:#fff;border:1.5px solid #fee2e2;border-radius:8px;color:#ef4444;cursor:pointer;transition:all 0.2s;}
.btn-delete:hover:not(:disabled){background:#ef4444;border-color:#ef4444;color:#fff;}

.state-cell{padding:40px;text-align:center;}
.state-content{display:flex;flex-direction:column;align-items:center;gap:12px;color:#64748b;}
.spinner{width:24px;height:24px;border:3px solid #e2e8f0;border-top-color:#0ea5e9;border-radius:50%;animation:spin 0.8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

.empty-icon-wrap{width:56px;height:56px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin-bottom:8px;}
.empty-icon-wrap i{font-size:24px;color:#94a3b8;}
.empty-title{font-size:14px;font-weight:700;color:#1e293b;}
.empty-sub{font-size:12px;color:#64748b;}

.card-footer{padding:12px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;}
.footer-info{font-size:12px;color:#64748b;font-weight:600;}
.null-dash{color:#cbd5e1;font-weight:400;}

.fade-enter-active,.fade-leave-active{transition:opacity 0.2s;}
.fade-enter-from,.fade-leave-to{opacity:0;}

.th-actions { width: 120px; text-align: center; }
</style>
