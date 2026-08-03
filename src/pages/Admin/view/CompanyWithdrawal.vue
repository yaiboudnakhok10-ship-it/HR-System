<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useWalkieAssetStore } from '@/stores/walkie_asset.store'
import { useEmployeeStore } from '@/stores/employee.store'
import { useSupervisorStore } from '@/stores/supervisor.store'
import { useAssetRequestStore } from '@/stores/asset_request.store'
import { useAuthStore } from '@/stores/auth.store'
import { supabaseExternal } from '@/services/supabase_external'
import Swal from 'sweetalert2'

const store = useWalkieAssetStore()
const employeeStore = useEmployeeStore()
const supervisorStore = useSupervisorStore()
const assetTypeStore = useAssetRequestStore()
const auth = useAuthStore()
const router = useRouter()

// ── State ─────────────────────────────────────────────────
const mainForm = ref({
  employee_code: '',
  title: '',
  first_name: '',
  last_name: '',
  position: '',
  department: '',
  project: '',
  company: '',
  work_age: '',
  phone: '',
})

const itemForm = ref({
  request_type: '',
  request_item: '',
  asset_no: '',
  serial_no: '',
  detail: '',
  component: '',
  item_date: '',
  amount: 0,
  signer1_name: '',
  signer2_name: '',
  signer1_position: '',
  signer2_position: '',
  remark: '',
  image_file: null,
  image_preview: '',
  signature1_preview: '',
  signature2_preview: '',
})

const cartItems = ref([])
const isSearching = ref(false)
const externalEmployees = ref([])
const showDropdown = ref(false)
const isEditMode = ref(false)
const editRequestId = ref(null)

// ── Lifecycle ─────────────────────────────────────────────
onMounted(async () => {
  employeeStore.fetchEmployees()
  supervisorStore.fetchSupervisors()
  assetTypeStore.fetchRequests()
  fetchExternalEmployees()

  // ตรวจสอบว่ามีการส่งข้อมูลมาเพื่อแก้ไขหรือไม่
  if (history.state && history.state.editData) {
    prepareEditData(history.state.editData)
  }
})

// ── Functions ─────────────────────────────────────────────
function prepareEditData(data) {
  isEditMode.value = true
  editRequestId.value = data.id

  // เติมข้อมูลหลัก (Main Form)
  mainForm.value = {
    employee_code: data.employee_code || '',
    title: data.title || '',
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    position: data.position || '',
    department: data.department || '',
    project: data.project || '',
    company: data.company || '',
    work_age: data.work_age || '',
    phone: data.phone || '',
  }

  // เติมข้อมูลรายละเอียดลงใน itemForm เพื่อให้แสดงในฟอร์มแก้ไขทันที
  itemForm.value = {
    request_type: data.request_type || '',
    request_item: data.request_item || '',
    asset_no: data.asset_no || '',
    serial_no: data.serial_no || '',
    detail: data.detail || '',
    component: data.component || '',
    item_date: data.item_date || '',
    amount: data.amount || 0,
    signer1_name: data.signer1_name || '',
    signer2_name: data.signer2_name || '',
    signer1_position: data.signer1_position || '',
    signer2_position: data.signer2_position || '',
    remark: data.remark || '',
    image_file: null,
    image_preview: data.image_url || '',
    signature1_preview: data.signature1_url || '',
    signature2_preview: data.signature2_url || '',
  }

  // ใส่ลงในตะกร้าด้วยเพื่อให้ระบบบันทึกรู้ว่าต้องอัปเดต ID นี้
  cartItems.value = [{
    ...itemForm.value,
    id: data.id,
    is_existing: true
  }]
}

function cancelEdit() {
  isEditMode.value = false
  editRequestId.value = null
  cartItems.value = []
  mainForm.value = { employee_code: '', title: '', first_name: '', last_name: '', position: '', department: '', project: '', company: '', work_age: '', phone: '' }
  router.push('/admin/company-withdrawal-show')
}
async function fetchExternalEmployees(query = '') {
  isSearching.value = true
  try {
    let q = supabaseExternal.from('employees').select('*')
    if (query) {
      q = q.or(`employee_code.ilike.%${query}%,firstname.ilike.%${query}%,lastname.ilike.%${query}%`)
    }
    const { data, error } = await q.limit(20)
    if (!error) {
      externalEmployees.value = data
    }
  } catch (e) {
    console.error('Fetch external error:', e)
  } finally {
    isSearching.value = false
  }
}

function onSearchInput() {
  showDropdown.value = true
  fetchExternalEmployees(mainForm.value.employee_code)
}

function selectEmployee(emp) {
  mainForm.value.employee_code = emp.employee_code
  mainForm.value.title = emp.pn || ''
  mainForm.value.first_name = emp.firstname
  mainForm.value.last_name = emp.lastname
  mainForm.value.phone = emp.tel || ''
  mainForm.value.position = emp.department || '' // Mapping: ตำแหน่ง -> department
  mainForm.value.department = emp.position || '' // Mapping: แผนก -> position
  mainForm.value.project = emp.project || ''
  mainForm.value.company = emp.company || ''
  mainForm.value.work_age = emp.experience || '' // Mapping: อายุงาน -> experience
  showDropdown.value = false
  Swal.fire({ icon: 'success', title: 'พบข้อมูลพนักงาน', timer: 1000, showConfirmButton: false })
}

// ปิด dropdown เมื่อคลิกที่อื่น
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('._NOP_input_search_wrap')) {
      showDropdown.value = false
    }
  })
}

function onFileChange(e, type) {
  const file = e.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    if (type === 'image') {
      itemForm.value.image_file = file
      itemForm.value.image_preview = event.target.result
    }
  }
  reader.readAsDataURL(file)
}

function onSigner1Change() {
  const emp = employeeStore.employees.find(e => e.full_name === itemForm.value.signer1_name)
  itemForm.value.signature1_preview = emp ? emp.signature_image : ''
  itemForm.value.signer1_position = emp ? emp.position : ''
}

function onSigner2Change() {
  const sup = supervisorStore.supervisors.find(s => s.full_name === itemForm.value.signer2_name)
  itemForm.value.signature2_preview = sup ? sup.signature_image : ''
  itemForm.value.signer2_position = sup ? sup.position : ''
}

function addToCart() {
  if (!itemForm.value.request_type || !itemForm.value.request_item) {
    Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกหัวข้อและรายการขอเบิก' })
    return
  }

  cartItems.value.push({
    ...itemForm.value,
    id: Date.now(),
  })

  // Reset item form
  itemForm.value = {
    request_type: '',
    request_item: '',
    asset_no: '',
    serial_no: '',
    detail: '',
    component: '',
    item_date: '',
    amount: 0,
    signer1_name: '',
    signer2_name: '',
    signer1_position: '',
    signer2_position: '',
    remark: '',
    image_file: null,
    image_preview: '',
    signature1_preview: '',
    signature2_preview: '',
  }
  Swal.fire({ icon: 'success', title: 'เพิ่มรายการแล้ว', timer: 1000, showConfirmButton: false })
}

function removeFromCart(index) {
  cartItems.value.splice(index, 1)
}

async function submitAll() {
  if (cartItems.value.length === 0 && !isEditMode.value) {
    Swal.fire({ icon: 'warning', title: 'ไม่มีรายการ', text: 'กรุณาเพิ่มรายการขอเบิกอย่างน้อย 1 รายการ' })
    return
  }

  // ในโหมดแก้ไข ถ้าในตะกร้าว่าง ให้ดึงจากฟอร์มปัจจุบันใส่ตะกร้าก่อนบันทึก
  if (isEditMode.value && cartItems.value.length === 0) {
    cartItems.value.push({
      ...itemForm.value,
      id: editRequestId.value,
      is_existing: true
    })
  } else if (isEditMode.value) {
    // อัปเดตข้อมูลล่าสุดจากฟอร์มลงในตะกร้า (เผื่อมีการแก้ไขหลังจากกด Edit มา)
    cartItems.value[0] = {
      ...cartItems.value[0],
      ...itemForm.value
    }
  }

  const confirmTitle = isEditMode.value ? 'ยืนยันการแก้ไข?' : 'ยืนยันการบันทึก?'
  const confirmText = isEditMode.value 
    ? 'ต้องการบันทึกการแก้ไขรายการใบเบิกนี้ใช่หรือไม่?' 
    : `ต้องการบันทึกรายการทั้งหมด ${cartItems.value.length} รายการใช่หรือไม่?`

  Swal.fire({
    title: confirmTitle,
    text: confirmText,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก'
  }).then(async (result) => {
    if (result.isConfirmed) {
      Swal.fire({ title: isEditMode.value ? 'กำลังอัปเดต...' : 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
      try {
        const savedItems = []
        for (const item of cartItems.value) {
          let uploadedImageUrl = item.image_preview // ใช้รูปเดิมถ้าไม่มีการเลือกใหม่
          if (item.image_file) {
            uploadedImageUrl = await store.uploadFile(item.image_file)
          }

          const payload = {
            ...mainForm.value,
            request_type: item.request_type,
            request_item: item.request_item,
            asset_no: item.asset_no,
            serial_no: item.serial_no,
            detail: item.detail,
            component: item.component,
            item_date: item.item_date,
            amount: item.amount,
            remark: item.remark,
            signer1_name: item.signer1_name,
            signer2_name: item.signer2_name,
            image_url: uploadedImageUrl,
            signature1_url: item.signature1_preview,
            signature2_url: item.signature2_preview,
            created_by: auth.session?.userId
          }

          let savedData
          if (isEditMode.value && item.is_existing) {
            // โหมดแก้ไข: อัปเดตข้อมูลเดิม
            savedData = await store.updateRequest(item.id, payload)
          } else {
            // โหมดปกติ: เพิ่มข้อมูลใหม่
            savedData = await store.addRequest(payload)
          }
          
          savedItems.push({ 
            ...savedData, 
            image_url: uploadedImageUrl || savedData.image_url,
            tenure: mainForm.value.work_age,
            signer1_position: item.signer1_position,
            signer2_position: item.signer2_position
          })
        }

        Swal.fire({ 
          icon: 'success', 
          title: isEditMode.value ? 'อัปเดตสำเร็จ' : 'บันทึกสำเร็จ', 
          text: isEditMode.value ? 'แก้ไขข้อมูลเรียบร้อยแล้ว ต้องการพิมพ์ใบขอเบิกใหม่หรือไม่?' : 'ต้องการพิมพ์ใบขอเบิกทันทีหรือไม่?',
          showCancelButton: true,
          confirmButtonText: 'พิมพ์ทันที',
          cancelButtonText: isEditMode.value ? 'กลับหน้าตาราง' : 'ยังไม่พิมพ์'
        }).then((printResult) => {
          if (printResult.isConfirmed) {
            printRequests(savedItems)
          }
          
          // เก็บสถานะ editMode ไว้ก่อนล้างค่า
          const wasEditing = isEditMode.value
          
          // ล้างข้อมูลฟอร์ม
          cartItems.value = []
          isEditMode.value = false
          editRequestId.value = null
          mainForm.value = { employee_code: '', title: '', first_name: '', last_name: '', position: '', department: '', project: '', company: '', work_age: '', phone: '' }
          
          // ถ้าเป็นโหมดแก้ไข ให้กลับไปหน้าตารางทันทีหลังจากกดตกลงหรือพิมพ์
          if (wasEditing) {
            router.push('/admin/company-withdrawal-show')
          }
        })
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message })
      }
    }
  })
}

// ── Print Functions ──────────────────────────────────────
const LOGO_URL_1 = "https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg"
const LOGO_URL_2 = "https://kxxfzlonktxoirgkvwfu.supabase.co/storage/v1/object/public/signatures/TDLao_MVDC_Joint_Venture-removebg-preview.png"

function printRequests(items) {
  const printContents = items.map(item => buildPrintHTML(item)).join('')
  const finalHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>พิมพ์ใบขอเบิกทรัพย์สิน</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@100..900&family=Prompt:wght@100;300;400;500;600;700&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Phetsarath&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; }
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
            box-sizing: border-box;
            page-break-after: always;
          }
          .a4-sheet:last-child { page-break-after: auto; }
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
        ${printContents}
        <script>
          window.onload = function() {
            // รอรูปภาพโหลด 1 วินาทีเพื่อให้แน่ใจว่ารูปมาครบก่อนพิมพ์
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 1000);
          }
        <\/script>
      </body>
    </html>
  `
  const printWindow = window.open('', '_blank')
  printWindow.document.write(finalHtml)
  printWindow.document.close()
}

function buildPrintHTML(item) {
  const ts = new Date().toLocaleString('th-TH')
  const partsText = (item.component || '').replace(/^[-\u2022*]\s*/gm, '')
  const fullName = `${item.title || ''}${item.first_name} ${item.last_name}`.trim()

  const photoHTML = item.image_url 
    ? `<img src="${item.image_url}" style="max-width:100%;max-height:650px;object-fit:contain;display:block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
       <div style="display:none; text-align:center; padding: 20px; border: 1px dashed #ccc;">
         <div style="font-size: 24px; color: #999;">⚠️</div>
         <div style="font-size: 10pt; color: #666; margin-top: 5px;">ไม่สามารถโหลดรูปภาพได้ (URL: ${item.image_url})</div>
       </div>`
    : '<div style="color:#ccc;font-size:2.5rem;text-align:center;">📷</div><div style="color:#ccc;font-size:9pt;text-align:center;margin-top:6px;">ไม่มีรูปภาพ</div>'

  const sig1HTML = item.signature1_url
    ? `<div class="sig-col-img-wrap"><img src="${item.signature1_url}" class="sig-col-img"></div>`
    : '<div class="sig-col-dots">.................................</div>'

  const sig2HTML = item.signature2_url
    ? `<div class="sig-col-img-wrap"><img src="${item.signature2_url}" class="sig-col-img"></div>`
    : '<div class="sig-col-dots">.................................</div>'

  const amountFormatted = item.amount ? Number(item.amount).toLocaleString() : '0'

  return `
    <div class="a4-sheet">
      <div class="doc-header">
        <div class="doc-logo">
          <img src="${LOGO_URL_1}" alt="Logo 1">
          <img src="${LOGO_URL_2}" alt="Logo 2">
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
              <div class="info-row"><span class="info-lbl">อายุงาน :</span><span class="info-val">${item.tenure || item.work_age || ''}</span></div>
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
        1. ພະນັກງານຕ້ອງດູແລຊັບສິນຂອງຜູ້ວ່າຈ້າງໃຫ້ດີທີ່ສຸດ ແລະ ຮັບຜິດຊອບໃນຊັບສິນຂອງບໍລິສັດ<br>
        2. ຫຼັງຈາກພັກ ສະພາບຄວາມເປັນພະນັກງານຕ້ອງຄືນຊັບສິນຂອງບໍລິສັດທັງໝົດໃນສະພາບທີ່ດີ ຫຼື ໃນສະພາບທີ່ບໍລິສັດກວດສອບ ແລ້ວພໍໃຈ ກໍລະນີທີ່ຊັບສິນເສยຫາຍ/ສູນຫາຍ ພະນັກງານຕ້ອງຮັບຜິດຊອບ ຍົກເວັ້ນ: ຊັບສິນທີ່ເຊື່ອມສະພາບນັ້ນ ເກີດຈາກອາຍຸການໃຊ້ງານ ຫຼື ຕ້ອງບໍ່ໄດ້ເຊື່ອມສະພາບຈາກການໃຊ້ງານໂດຍຄວາມປະມາດ ບໍ່ລະມັດລະວັງ ຫຼື ຈົງໃຈ ໃຫ້ໄດ້ຄວາມເສຍຫາຍ ໂດຍບໍລິສັດຈະພິຈາລະນາຕາມເຫດຜົນ ແລະ ຂໍ້ແທ້ຈິງທີ່ເກີດຂຶ້ນ ໂດຍຄ່າສ້ອມແປງ ວັດສະດຸ ອຸປະກອນຕ່າງໆ ທີ່ເກີດຂຶ້ນ ເພື່ອໃຫ້ກັບມາໃຊ້ໄດ້ຕາມສະພາບເດີມນັ້ນ ບໍລິສັດອາດໃຫ້ພະນັກງານຊົດໃຊ້ຄ່າ ເສຍຫາຍ/ສູນຫາຍດັ່ງກ່າວທີ່ເກີດຂຶ້ນ ໂດຍຈ່າຍຕາມຈິງຕາມໃບບິນຮັບເງິນ ທັງນີ້ ບໍລິສັດຍິນຍອມຊົດໃຊ້ເປັນເງິນສົດ ຫຼື ໃຫ້ຫັກຈາກບັນຊີເງินເດືອນໄດ້ ຕາມທີ່ມີຍອດແຈ້ງຊຳລະໜີ້ຕາມຈິງ<br>
        3. ສັນຍາສະບັບນີ້ ມີຜົນທັນທີ. ສັນຍານີ້ ທັງສອງຝ່າຍໄດ້ອ່ານ ເຂົ້າໃຈຂໍ້ຄວາມ ໂດຍລະອຽດ ແລ້ວຈຶ່ງໄດ້ລົງລາຍເຊັນຊື່ ໄວ້ເປັນຫຼັກຖານສຳຄັນ ຕໍ່ໜ້າພະຍານ.
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
  `
}
</script>

<template>
  <div class="_NOP_container">
    <div class="_NOP_page_header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1><i class="fas fa-boxes"></i> แบบฟอร์มขอเบิกทรัพย์สินบริษัท</h1>
        <p>กรอกข้อมูลและเพิ่มรายการขอเบิกทรัพย์สินบริษัท</p>
      </div>
      <button class="_NOP_btn _NOP_btn_primary" @click="router.push('/admin/company-withdrawal-show')">
        <i class="fas fa-file-alt"></i> รายงานข้อมูลใบเบิก
      </button>
    </div>

    <div class="_NOP_main_grid">
      <!-- LEFT: ข้อมูลหลัก -->
      <div class="_NOP_card">
        <div class="_NOP_card_header">
          <i class="fas fa-clipboard-list"></i>
          <h3>ข้อมูลหลัก</h3>
        </div>
        <div class="_NOP_form_group">
          <label class="_NOP_form_label">รหัสไทยดิว / ชื่อพนักงาน</label>
          <div class="_NOP_input_search_wrap">
            <input 
              v-model="mainForm.employee_code" 
              type="text" 
              class="_NOP_form_control" 
              placeholder="ค้นหารหัส หรือ ชื่อพนักงาน..." 
              @input="onSearchInput"
              @focus="showDropdown = true"
            >
            <button type="button" class="_NOP_input_search_btn">
              <i v-if="isSearching" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-search"></i>
            </button>

            <!-- Dropdown Results -->
            <div v-if="showDropdown && externalEmployees.length > 0" class="_NOP_search_dropdown">
              <div 
                v-for="emp in externalEmployees" 
                :key="emp.id" 
                class="_NOP_dropdown_item"
                @click="selectEmployee(emp)"
              >
                <div class="emp-main">
                  <span class="emp-code">{{ emp.employee_code }}</span>
                  <span class="emp-name">{{ emp.firstname }} {{ emp.lastname }}</span>
                </div>
                <div class="emp-sub">{{ emp.department }} | {{ emp.position }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="_NOP_form_group">
          <label class="_NOP_form_label">ชื่อ-นามสกุล</label>
          <input :value="mainForm.first_name ? (mainForm.title + mainForm.first_name + ' ' + mainForm.last_name) : ''" type="text" class="_NOP_form_control" readonly placeholder="ชื่อ-นามสกุล">
        </div>
        <div class="_NOP_row">
          <div class="_NOP_form_group">
            <label class="_NOP_form_label">เบอร์โทร</label>
            <input v-model="mainForm.phone" type="text" class="_NOP_form_control" placeholder="เบอร์โทร">
          </div>
          <div class="_NOP_form_group">
            <label class="_NOP_form_label">ตำแหน่ง</label>
            <input v-model="mainForm.position" type="text" class="_NOP_form_control" placeholder="ตำแหน่ง">
          </div>
        </div>
        <div class="_NOP_row">
          <div class="_NOP_form_group">
            <label class="_NOP_form_label">แผนก</label>
            <input v-model="mainForm.department" type="text" class="_NOP_form_control" placeholder="แผนก">
          </div>
          <div class="_NOP_form_group">
            <label class="_NOP_form_label">โครงการ</label>
            <input v-model="mainForm.project" type="text" class="_NOP_form_control" placeholder="โครงการ">
          </div>
        </div>
        <div class="_NOP_row">
          <div class="_NOP_form_group">
            <label class="_NOP_form_label">บริษัท</label>
            <input v-model="mainForm.company" type="text" class="_NOP_form_control" placeholder="บริษัท">
          </div>
          <div class="_NOP_form_group">
            <label class="_NOP_form_label">อายุงาน</label>
            <input v-model="mainForm.work_age" type="text" class="_NOP_form_control" placeholder="อายุงาน">
          </div>
        </div>
        
        <div class="_NOP_info_badge">
          <i class="fas fa-info-circle"></i>
          <span>{{ isEditMode ? 'คุณกำลังอยู่ในโหมดแก้ไขข้อมูล' : 'กรุณากรอกข้อมูลพนักงานและเพิ่มรายการด้านล่าง' }}</span>
        </div>
        <button class="_NOP_btn _NOP_btn_success _NOP_btn_block _NOP_btn_lg" @click="submitAll">
          <i class="fas fa-save"></i> {{ isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลทั้งหมด' }}
        </button>
        <button v-if="isEditMode" class="_NOP_btn _NOP_btn_block" style="margin-top: 10px; background: #64748b; color: white;" @click="cancelEdit">
          ยกเลิกการแก้ไข
        </button>
      </div>

      <!-- RIGHT COLUMN -->
      <div style="display:flex;flex-direction:column;gap:25px;">
        <!-- เพิ่มรายการ -->
        <div class="_NOP_card">
          <div class="_NOP_card_header">
            <i class="fas fa-plus-circle"></i>
            <h3>เพิ่มรายการเบิกทรัพย์สิน</h3>
          </div>
          <div class="_NOP_row">
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">หัวข้อการขอเบิก</label>
              <select v-model="itemForm.request_type" class="_NOP_form_control">
                <option value="">เลือกหัวข้อการขอเบิก</option>
                <option v-for="type in assetTypeStore.requests" :key="type.id" :value="type.title">{{ type.title }}</option>
              </select>
            </div>
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">รายการขอเบิก</label>
              <input v-model="itemForm.request_item" type="text" class="_NOP_form_control" placeholder="ระบุรายการ...">
            </div>
          </div>
          <div class="_NOP_row_3">
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">ASSET No.</label>
              <input v-model="itemForm.asset_no" type="text" class="_NOP_form_control" placeholder="ASSET Number">
            </div>
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">Serial No.</label>
              <input v-model="itemForm.serial_no" type="text" class="_NOP_form_control" placeholder="Serial Number">
            </div>
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">รายละเอียด</label>
              <input v-model="itemForm.detail" type="text" class="_NOP_form_control" placeholder="รายละเอียด">
            </div>
          </div>
          <div class="_NOP_row_3">
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">ส่วนประกอบ</label>
              <input v-model="itemForm.component" type="text" class="_NOP_form_control" placeholder="ส่วนประกอบ">
            </div>
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">วันที่</label>
              <input v-model="itemForm.item_date" type="date" class="_NOP_form_control">
            </div>
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">จำนวนเงิน</label>
              <input v-model="itemForm.amount" type="number" class="_NOP_form_control">
            </div>
          </div>

          <!-- รูปภาพ & ลายเซ็น -->
          <div class="_NOP_row_3" style="margin-bottom:18px;">
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">รูปภาพ</label>
              <div class="_NOP_image_upload_box" :class="{ 'has-image': itemForm.image_preview }">
                <input type="file" accept="image/*" @change="e => onFileChange(e, 'image')">
                <div v-if="!itemForm.image_preview" class="_NOP_image_placeholder">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <span>คลิกเพื่อเลือกรูป</span>
                </div>
                <img v-if="itemForm.image_preview" :src="itemForm.image_preview" class="_NOP_preview_img" style="display:block">
              </div>
            </div>
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">ลายเซ็นพนักงาน (ดึงอัตโนมัติ)</label>
              <div class="_NOP_image_upload_box" :class="{ 'has-image': itemForm.signature1_preview }">
                <div v-if="!itemForm.signature1_preview" class="_NOP_image_placeholder">
                  <i class="fas fa-pen-nib"></i>
                  <span>เลือกลายเซ็นด้านล่าง</span>
                </div>
                <img v-if="itemForm.signature1_preview" :src="itemForm.signature1_preview" class="_NOP_preview_img" style="display:block">
              </div>
            </div>
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">ลายเซ็นหัวหน้า (ดึงอัตโนมัติ)</label>
              <div class="_NOP_image_upload_box" :class="{ 'has-image': itemForm.signature2_preview }">
                <div v-if="!itemForm.signature2_preview" class="_NOP_image_placeholder">
                  <i class="fas fa-pen-nib"></i>
                  <span>เลือกลายเซ็นด้านล่าง</span>
                </div>
                <img v-if="itemForm.signature2_preview" :src="itemForm.signature2_preview" class="_NOP_preview_img" style="display:block">
              </div>
            </div>
          </div>

          <div class="_NOP_row">
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">ชื่อผู้เซ็น 1 (พนักงาน)</label>
              <select v-model="itemForm.signer1_name" class="_NOP_form_control" @change="onSigner1Change">
                <option value="">เลือกพนักงานที่เซ็น...</option>
                <option v-for="emp in employeeStore.employees" :key="emp.id" :value="emp.full_name">{{ emp.full_name }}</option>
              </select>
            </div>
            <div class="_NOP_form_group">
              <label class="_NOP_form_label">ชื่อผู้เซ็น 2 (หัวหน้า)</label>
              <select v-model="itemForm.signer2_name" class="_NOP_form_control" @change="onSigner2Change">
                <option value="">เลือกหัวหน้าที่เซ็น...</option>
                <option v-for="sup in supervisorStore.supervisors" :key="sup.id" :value="sup.full_name">{{ sup.full_name }}</option>
              </select>
            </div>
          </div>

          <div class="_NOP_form_group">
            <label class="_NOP_form_label">หมายเหตุ</label>
            <textarea v-model="itemForm.remark" class="_NOP_form_control" placeholder="หมายเหตุ..."></textarea>
          </div>
          <button class="_NOP_btn _NOP_btn_primary _NOP_btn_block" @click="addToCart">
            <i class="fas fa-plus"></i> เพิ่มลงรายการ
          </button>
        </div>

        <!-- รายการที่รอการบันทึก -->
        <div class="_NOP_cart_section">
          <div class="_NOP_card_header">
            <i class="fas fa-shopping-cart"></i>
            <h3>รายการขอเบิก ({{ cartItems.length }} รายการ)</h3>
          </div>
          <div v-if="cartItems.length === 0" class="_NOP_empty_cart">
            <i class="fas fa-box-open"></i>
            <p>ยังไม่มีรายการ</p>
          </div>
          <div v-else>
            <div v-for="(item, index) in cartItems" :key="item.id" class="_NOP_cart_item">
              <div class="_NOP_cart_item_info">
                <div class="_NOP_cart_item_name">{{ item.request_type }} | {{ item.request_item }}</div>
                <div class="_NOP_cart_item_details">
                  ASSET: {{ item.asset_no }} | Serial: {{ item.serial_no }} | วันที่: {{ item.item_date }} | จำนวน: {{ item.amount }} บาท
                </div>
              </div>
              <button class="_NOP_btn_icon_only" @click="removeFromCart(index)">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* คัดลอก Style มาจาก table.txt โดยปรับแต่งเล็กน้อยให้เข้ากับ Vue */
._NOP_container { max-width:1400px; margin:0 auto; padding: 20px; color: #333; }
._NOP_page_header {
    background:white; padding:25px 30px; border-radius:12px;
    margin-bottom:25px; box-shadow:0 2px 8px rgba(0,0,0,0.08);
    border-left:5px solid #0ea5e9;
}
._NOP_page_header h1 { font-size:28px; font-weight:700; margin-bottom:5px; display:flex; align-items:center; gap:12px; }
._NOP_page_header h1 i { color:#0ea5e9; }
._NOP_page_header p { color:#64748b; font-size:15px; }

._NOP_main_grid { display:grid; grid-template-columns:450px 1fr; gap:20px; }
._NOP_card {
    background:white; border-radius:12px; padding:25px;
    box-shadow:0 2px 8px rgba(0,0,0,0.08); border:1px solid #bae6fd;
}
._NOP_card_header {
    display:flex; align-items:center; gap:10px;
    margin-bottom:20px; padding-bottom:15px; border-bottom:2px solid #f1f5f9;
}
._NOP_card_header h3 { font-size:18px; font-weight:600; }
._NOP_card_header i { font-size:20px; color:#0ea5e9; }

._NOP_form_group { margin-bottom:18px; }
._NOP_form_label { display:block; margin-bottom:6px; font-weight:600; font-size:13px; }
._NOP_form_control {
    width:100%; padding:11px 15px; border:1px solid #d1d5db;
    border-radius:8px; font-size:14px; background:white;
}
._NOP_form_control:focus { outline:none; border-color:#0ea5e9; box-shadow:0 0 0 3px rgba(14,165,233,0.1); }

._NOP_btn {
    padding:12px 24px; border:none; border-radius:8px; font-size:15px;
    font-weight:600; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px;
}
._NOP_btn_primary { background:#0ea5e9; color:white; }
._NOP_btn_success { background:#10b981; color:white; }
._NOP_btn_block { width:100%; }
._NOP_btn_lg { padding:14px 28px; font-size:16px; }

._NOP_cart_section {
    background:white; border-radius:12px; padding:25px;
    box-shadow:0 2px 8px rgba(0,0,0,0.08); border:1px solid #bae6fd;
}
._NOP_cart_item {
    display:flex; align-items:center; justify-content:space-between;
    padding:15px; border:1px solid #bae6fd; border-radius:10px; margin-bottom:12px;
}
._NOP_cart_item_info { flex:1; }
._NOP_cart_item_name { font-weight:600; font-size:15px; }
._NOP_cart_item_details { color:#64748b; font-size:13px; }

._NOP_empty_cart { text-align:center; padding:40px 20px; color:#94a3b8; }
._NOP_empty_cart i { font-size:48px; margin-bottom:15px; opacity:0.3; display:block; }

._NOP_info_badge {
    display:inline-flex; align-items:center; gap:8px; padding:10px 15px;
    background:#f0f9ff; border-left:3px solid #0ea5e9; border-radius:8px;
    margin-bottom:18px; font-size:13px; color:#0284c7; width:100%;
}

._NOP_row { display:grid; grid-template-columns:repeat(2,1fr); gap:15px; }
._NOP_row_3 { display:grid; grid-template-columns:repeat(3,1fr); gap:15px; }

._NOP_image_upload_box {
    border:2px dashed #bae6fd; border-radius:10px; cursor:pointer;
    background:#f8fafc; height:160px; display:flex; flex-direction:column;
    align-items:center; justify-content:center; position:relative; overflow:hidden;
}
._NOP_image_upload_box.has-image { border-style:solid; border-color:#0ea5e9; }
._NOP_image_upload_box input[type="file"] { position:absolute; inset:0; opacity:0; cursor:pointer; z-index:5; }
._NOP_image_placeholder { text-align:center; color:#94a3b8; }
._NOP_image_placeholder i { font-size:32px; display:block; margin-bottom:6px; }
._NOP_preview_img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; z-index:1; }

._NOP_input_search_wrap { position:relative; }
._NOP_input_search_btn {
    position:absolute; right:8px; top:50%; transform:translateY(-50%);
    border:none; background:none; cursor:pointer; color:#0ea5e9;
}

._NOP_btn_icon_only { background:none; border:none; color:#ef4444; cursor:pointer; font-size:18px; }

/* Search Dropdown Styles */
._NOP_search_dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 100;
    max-height: 300px;
    overflow-y: auto;
    margin-top: 5px;
}
._NOP_dropdown_item {
    padding: 10px 15px;
    cursor: pointer;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.2s;
}
._NOP_dropdown_item:last-child { border-bottom: none; }
._NOP_dropdown_item:hover { background: #f0f9ff; }
.emp-main { display: flex; gap: 10px; align-items: center; margin-bottom: 2px; }
.emp-code { font-weight: 700; color: #0ea5e9; font-size: 14px; }
.emp-name { font-weight: 600; color: #334155; font-size: 14px; }
.emp-sub { font-size: 12px; color: #64748b; }

@media (max-width:1024px) { ._NOP_main_grid{grid-template-columns:1fr} }
</style>
