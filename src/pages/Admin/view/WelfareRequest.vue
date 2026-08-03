<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useWelfareRequestStore } from '@/stores/welfare_request.store'
import { useWelfareTypeStore } from '@/stores/welfare_type.store'
import { useEmployeeStore } from '@/stores/employee.store'
import { useSupervisorStore } from '@/stores/supervisor.store'
import { useAuthStore } from '@/stores/auth.store'
import { supabaseExternal } from '@/services/supabase_external'
import Swal from 'sweetalert2'

const store = useWelfareRequestStore()
const welfareTypeStore = useWelfareTypeStore()
const employeeStore = useEmployeeStore()
const supervisorStore = useSupervisorStore()
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
  welfare_type: '',
  welfare_item: '',
  remark: '',
  item_date: '',
  amount: 0,
  signer1_name: '',
  signer2_name: '',
  signer1_position: '',
  signer2_position: '',
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
  welfareTypeStore.fetchTypes()
  
  if (history.state && history.state.editData) {
    prepareEditData(history.state.editData)
  }
})

// ปิด dropdown เมื่อคลิกที่อื่น
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('._HEW_input_search_wrap')) {
      showDropdown.value = false
    }
  })
}

// ── Functions ─────────────────────────────────────────────
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

async function searchEmployee() {
  const code = mainForm.value.employee_code.trim()
  if (!code) return
  
  isSearching.value = true
  try {
    const { data, error } = await supabaseExternal
      .from('employees')
      .select('*')
      .eq('employee_code', code)
      .single()

    if (error || !data) {
      Swal.fire({ icon: 'error', title: 'ไม่พบข้อมูล', text: 'ไม่พบรหัสพนักงานนี้ในระบบ' })
      clearMainForm()
    } else {
      selectEmployee(data)
      Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 })
        .fire({ icon: 'success', title: 'พบข้อมูล: ' + data.firstname + ' ' + data.lastname })
    }
  } catch (e) {
    console.error('Search error:', e)
  } finally {
    isSearching.value = false
    showDropdown.value = false
  }
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
}

function clearMainForm() {
  mainForm.value = { employee_code: '', title: '', first_name: '', last_name: '', position: '', department: '', project: '', company: '', work_age: '', phone: '' }
}

function prepareEditData(data) {
  isEditMode.value = true
  editRequestId.value = data.id

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

  itemForm.value = {
    welfare_type: data.welfare_type || '',
    welfare_item: data.welfare_item || '',
    remark: data.remark || '',
    item_date: data.item_date || '',
    amount: data.amount || 0,
    signer1_name: data.signer1_name || '',
    signer2_name: data.signer2_name || '',
    signer1_position: data.signer1_position || '',
    signer2_position: data.signer2_position || '',
    image_file: null,
    image_preview: data.image_url || '',
    signature1_preview: data.signature1_url || '',
    signature2_preview: data.signature2_url || '',
  }

  cartItems.value = [{ ...itemForm.value, id: data.id, is_existing: true }]
}

function onFileChange(e, type) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    if (type === 'image') {
      itemForm.value.image_file = file
      itemForm.value.image_preview = event.target.result
    } else if (type === 'sig1') {
      itemForm.value.signature1_preview = event.target.result
    } else if (type === 'sig2') {
      itemForm.value.signature2_preview = event.target.result
    }
  }
  reader.readAsDataURL(file)
}

function removePreview(type) {
  if (type === 'image') {
    itemForm.value.image_file = null
    itemForm.value.image_preview = ''
  } else if (type === 'sig1') {
    itemForm.value.signature1_preview = ''
  } else if (type === 'sig2') {
    itemForm.value.signature2_preview = ''
  }
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
  if (!itemForm.value.welfare_type || !itemForm.value.welfare_item) {
    Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกหัวข้อและรายการสวัสดิการ' })
    return
  }
  cartItems.value.push({ ...itemForm.value, id: Date.now() })
  resetItemForm()
  Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true })
    .fire({ icon: 'success', title: 'เพิ่มรายการสำเร็จ' })
}

function resetItemForm() {
  itemForm.value = {
    welfare_type: '', welfare_item: '', remark: '', item_date: '', amount: 0,
    signer1_name: '', signer2_name: '', signer1_position: '', signer2_position: '',
    image_file: null, image_preview: '', signature1_preview: '', signature2_preview: ''
  }
}

function removeFromCart(index) {
  Swal.fire({
    title: 'ยืนยันการลบ?',
    text: 'ต้องการลบรายการนี้ออกจากตะกร้า?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#ef4444'
  }).then(result => {
    if (result.isConfirmed) {
      cartItems.value.splice(index, 1)
    }
  })
}

async function submitAll() {
  if (!mainForm.value.first_name) {
    Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาค้นหารหัสพนักงานก่อน' })
    return
  }
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
    // อัปเดตข้อมูลล่าสุดจากฟอร์มลงในตะกร้า
    cartItems.value[0] = {
      ...cartItems.value[0],
      ...itemForm.value
    }
  }

  const confirmTitle = isEditMode.value ? 'ยืนยันการแก้ไข?' : 'ยืนยันบันทึกข้อมูล?'
  const confirmText = isEditMode.value 
    ? 'ต้องการบันทึกการแก้ไขรายการใบเบิกนี้ใช่หรือไม่?' 
    : `ต้องการบันทึกรายการทั้งหมด ${cartItems.value.length} รายการใช่หรือไม่?`

  Swal.fire({
    title: confirmTitle,
    text: confirmText,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#0ea5e9'
  }).then(async (result) => {
    if (result.isConfirmed) {
      Swal.fire({ title: isEditMode.value ? 'กำลังอัปเดต...' : 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
      try {
        const savedItems = []
        for (const item of cartItems.value) {
          let uploadedImageUrl = item.image_preview
          if (item.image_file) {
            uploadedImageUrl = await store.uploadFile(item.image_file)
          }

          const payload = {
            ...mainForm.value,
            welfare_type: item.welfare_type,
            welfare_item: item.welfare_item,
            remark: item.remark,
            item_date: item.item_date,
            amount: item.amount,
            signer1_name: item.signer1_name,
            signer2_name: item.signer2_name,
            image_url: uploadedImageUrl,
            signature1_url: item.signature1_preview,
            signature2_url: item.signature2_preview,
            created_by: auth.session?.userId
          }

          let savedData
          if (isEditMode.value && item.is_existing) {
            savedData = await store.updateRequest(item.id, payload)
          } else {
            savedData = await store.addRequest(payload)
          }
          
          savedItems.push({ 
            ...savedData, 
            image_url: uploadedImageUrl,
            signer1_position: item.signer1_position,
            signer2_position: item.signer2_position
          })
        }

        Swal.fire({ 
          icon: 'success', 
          title: isEditMode.value ? 'อัปเดตสำเร็จ' : 'บันทึกสำเร็จ!', 
          text: isEditMode.value ? 'แก้ไขข้อมูลเรียบร้อยแล้ว ต้องการพิมพ์ใบเบิกใหม่หรือไม่?' : 'บันทึกข้อมูลเรียบร้อย ต้องการพิมพ์ใบเบิกหรือไม่?',
          showCancelButton: true,
          confirmButtonText: 'พิมพ์ทันที',
          cancelButtonText: isEditMode.value ? 'กลับหน้าตาราง' : 'ยังไม่พิมพ์'
        }).then((printResult) => {
          if (printResult.isConfirmed) printRequests(savedItems)
          
          const wasEditing = isEditMode.value
          resetAll()
          
          if (wasEditing) {
            router.push('/admin/welfare-request-show')
          }
        })
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: e.message })
      }
    }
  })
}

function resetAll() {
  clearMainForm()
  resetItemForm()
  cartItems.value = []
  isEditMode.value = false
}

// ── Print Functions ───
const LOGO_URL_1 = "https://dkbgdrnwixbukchansmz.supabase.co/storage/v1/object/public/imgwal/img_L2509021_0_1772065500425.jpg"

function printRequests(items) {
  const printContents = items.map(item => buildPrintHTML(item)).join('')
  const finalHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>พิมพ์ใบขอเบิกสวัสดิการ</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@100..900&family=Prompt:wght@100;300;400;500;600;700&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Phetsarath&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
          body { margin: 0; padding: 0; background: #f0f0f0; }
          .a4-sheet {
            width: 210mm; min-height: 297mm; background: white; 
            padding: 12mm 15mm 16mm 15mm; font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; 
            font-size: 9.5pt; line-height: 1.5; color: #1a1a1a; position: relative;
            page-break-after: always; margin: 0 auto;
          }
          .lao-text { font-family: 'Phetsarath', sans-serif !important; line-height: 1.8; }
          .doc-header { display: flex; align-items: center; margin-bottom: 10px; }
          .doc-logo { background: white; padding: 5px 8px; border-radius: 4px; flex-shrink: 0; width: 110px; display: flex; align-items: center; justify-content: center; }
          .doc-logo img { height: 48px; width: auto; object-fit: contain; display: block; }
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
          
          .p2-cond-title { background: #b8b8b8; text-align: center; font-weight: 700; font-size: 10pt; padding: 4px 10px; border: 1.5px solid #444; border-bottom: none; color: #1a1a1a; }
          .p2-cond-box { border: 1.5px solid #444; padding: 8px 14px; margin-bottom: 10px; font-size: 8pt; line-height: 1.75; color: #1a1a1a; }
          .p2-photo-wrap { display: flex; justify-content: center; align-items: center; width: 100%; border: 1.5px solid #444; height: 750px; padding: 10px; margin-bottom: 10px; background: white; overflow: hidden; }
          .p2-photo-wrap img { width: 100%; height: 100%; max-height: 730px; object-fit: contain; display: block; image-rendering: -webkit-optimize-contrast; }
          .p2-sig-wrap { display: flex; flex-direction: column; align-items: center; margin-top: 10px; }
          .p2-sig-label { font-size: 9.5pt; font-weight: 600; }
          .p2-sig-dots { font-size: 9.5pt; letter-spacing: 2px; color: #000; margin-top: 22px; }
          .p2-sig-name { font-size: 8.8pt; color: #222; margin-top: 3px; text-align: center; }
          .p2-sig-date { font-size: 9pt; margin-top: 6px; display: flex; align-items: center; gap: 6px; }
          
          .doc-timestamp { position: absolute; bottom: 10mm; right: 15mm; font-size: 7.5pt; color: #666; }
        </style>
      </head>
      <body>
        ${printContents}
        <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 1200); }<\/script>
      </body>
    </html>
  `
  const printWindow = window.open('', '_blank')
  printWindow.document.write(finalHtml)
  printWindow.document.close()
}

function buildPrintHTML(item) {
  const ts = new Date().toLocaleString('th-TH')
  const fullName = `${item.title || ''}${item.first_name} ${item.last_name}`.trim()
  const amountStr = item.amount ? Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'

  return `
    <!-- PAGE 1 -->
    <div class="a4-sheet">
      <div class="doc-header">
        <div class="doc-logo"><img src="${LOGO_URL_1}"></div>
        <div class="doc-title-center">แบบฟอร์มขอเบิกสวัสดิการ</div>
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
        <div class="sec-title">ส่วนรายการขอเบิกสวัสดิการ</div>
        <div class="sec-body">
          <div class="info-row-full"><span class="info-lbl-lg">หัวข้อสวัสดิการ ผลตอบแทน :</span><span class="info-val-full">${item.welfare_type || ''}</span></div>
          <div class="info-row-full"><span class="info-lbl-lg">รายการสวัสดิการ :</span><span class="info-val-full">${item.welfare_item || ''}</span></div>
          <div class="info-row-full"><span class="info-lbl-lg">หมายเหตุ :</span><span class="info-val-full">${item.remark || ''}</span></div>
          <div class="info-row-full"><span class="info-lbl-lg">วันที่ :</span><span class="info-val-full">${item.item_date || '–'}</span></div>
          <div class="info-row-full"><span class="info-lbl-lg">จำนวนเงิน :</span><span class="info-val-full">${amountStr}</span></div>
        </div>
      </div>
      
      <div class="sig-emp-section">
        <div class="p2-sig-label">ลงชื่อพนักงานผู้ร้องขอ :</div>
        <div class="sig-emp-dots">.............................</div>
        <div class="sig-emp-name">( ${fullName} )</div>
        <div class="sig-emp-date">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>วันที่:</strong><span style="color:#555;letter-spacing:1px;">..... / ..... / .......</span></div>
      </div>
      
      <div class="sig-bottom-wrap">
        <div class="sig-col">
          <div class="sig-col-label">ลงชื่อ:</div>
          ${item.signature1_url ? `<div class="sig-col-img-wrap"><img src="${item.signature1_url}" class="sig-col-img"></div>` : '<div class="sig-col-dots">.................................</div>'}
          <div class="sig-col-name">( ${item.signer1_name || '........................................'} )</div>
          <div class="sig-col-date"><strong>วันที่ :</strong><span style="color:#555;">......... / ......... / .........</span></div>
          <div class="sig-col-role">${item.signer1_position || 'จนท.สวัสดิการและพนักงานสัมพันธ์'}</div>
        </div>
        <div class="sig-col">
          <div class="sig-col-label">ลงชื่อ:</div>
          ${item.signature2_url ? `<div class="sig-col-img-wrap"><img src="${item.signature2_url}" class="sig-col-img"></div>` : '<div class="sig-col-dots">.................................</div>'}
          <div class="sig-col-name">( ${item.signer2_name || '........................................'} )</div>
          <div class="sig-col-date"><strong>วันที่ :</strong><span style="color:#555;">......... / ......... / .........</span></div>
          <div class="sig-col-role">${item.signer2_position || 'ผู้จัดการส่วนปฎิบัติการทรัพยากรบุคคล'}</div>
        </div>
      </div>
      
      <div class="doc-timestamp">${ts}</div>
    </div>

    <!-- PAGE 2 -->
    <div class="a4-sheet">
      <div class="p2-cond-title lao-text"><u>เงื่อนไข:</u></div>
      <div class="p2-cond-box lao-text">
        -
      </div>
      
      <div class="p2-photo-wrap">
        ${item.image_url ? `<img src="${item.image_url}">` : '<div style="color:#ccc; font-size:14pt;">📷</div>'}
      </div>
      
      <div class="p2-sig-wrap">
        <div class="p2-sig-label">ลงชื่อพนักงานผู้ร้องขอ :</div>
        <div class="p2-sig-dots">.........................</div>
        <div class="p2-sig-name">( ${fullName} )</div>
        <div class="p2-sig-date"><strong>วันที่ :</strong><span style="color:#555;letter-spacing:1px;">....... / ....... / .......</span></div>
      </div>
      
      <div class="doc-timestamp">${ts}</div>
    </div>
  `
}
</script>

<template>
  <div class="_HEW_container">
    <div class="_HEW_page_header _HEW_animate_in">
      <h1><i class="fas fa-boxes"></i> แบบฟอร์มขอเบิกสวัสดิการ</h1>
      <p>กรอกข้อมูลและเพิ่มรายการขอเบิกสวัสดิการ</p>
    </div>

    <div class="_HEW_main_grid">
      <!-- LEFT: ข้อมูลหลัก -->
      <div class="_HEW_card _HEW_animate_in" style="animation-delay:0.1s;">
        <div class="_HEW_card_header">
          <i class="fas fa-clipboard-list"></i>
          <h3>ข้อมูลหลัก</h3>
        </div>
        <div class="_HEW_form_group">
          <label class="_HEW_form_label">รหัสไทยดิว</label>
          <div class="_HEW_input_search_wrap">
            <input v-model="mainForm.employee_code" type="text" class="_HEW_form_control" placeholder="กรุณาป้อนรหัสไทยดิว แล้วกด Enter" @input="onSearchInput" @focus="showDropdown = true" @keyup.enter="searchEmployee">
            <button type="button" class="_HEW_input_search_btn" @click="searchEmployee" title="ค้นหา">
              <i class="fas fa-search"></i>
            </button>
            
            <!-- Search Dropdown -->
            <div v-if="showDropdown && externalEmployees.length > 0" class="_HEW_search_dropdown">
              <div v-for="emp in externalEmployees" :key="emp.id" class="_HEW_dropdown_item" @click="selectEmployee(emp)">
                <div class="emp-main">
                  <span class="emp-code">{{ emp.employee_code }}</span>
                  <span class="emp-name">{{ emp.firstname }} {{ emp.lastname }}</span>
                </div>
                <div class="emp-sub">{{ emp.department }} | {{ emp.position }}</div>
              </div>
            </div>
          </div>
          <small style="color:#64748b;margin-top:4px;display:block;">กด Enter หรือกดปุ่มค้นหาเพื่อดึงข้อมูล</small>
        </div>
        <div class="_HEW_form_group">
          <label class="_HEW_form_label">ชื่อ-นามสกุล</label>
          <input :value="mainForm.first_name ? (mainForm.title + mainForm.first_name + ' ' + mainForm.last_name) : ''" type="text" class="_HEW_form_control" :class="{ '_HEW_auto_filled': mainForm.first_name }" readonly placeholder="ดึงข้อมูลจากรหัสไทยดิว">
        </div>
        <div class="_HEW_row">
          <div class="_HEW_form_group">
            <label class="_HEW_form_label">เบอร์โทร</label>
            <input v-model="mainForm.phone" type="text" class="_HEW_form_control" :class="{ '_HEW_auto_filled': mainForm.phone }" readonly placeholder="ดึงข้อมูลอัตโนมัติ">
          </div>
          <div class="_HEW_form_group">
            <label class="_HEW_form_label">ตำแหน่ง</label>
            <input v-model="mainForm.position" type="text" class="_HEW_form_control" :class="{ '_HEW_auto_filled': mainForm.position }" readonly placeholder="ดึงข้อมูลอัตโนมัติ">
          </div>
        </div>
        <div class="_HEW_row">
          <div class="_HEW_form_group">
            <label class="_HEW_form_label">แผนก</label>
            <input v-model="mainForm.department" type="text" class="_HEW_form_control" :class="{ '_HEW_auto_filled': mainForm.department }" readonly placeholder="ดึงข้อมูลอัตโนมัติ">
          </div>
          <div class="_HEW_form_group">
            <label class="_HEW_form_label">โครงการ</label>
            <input v-model="mainForm.project" type="text" class="_HEW_form_control" :class="{ '_HEW_auto_filled': mainForm.project }" readonly placeholder="ดึงข้อมูลอัตโนมัติ">
          </div>
        </div>
        <div class="_HEW_row">
          <div class="_HEW_form_group">
            <label class="_HEW_form_label">บริษัท</label>
            <input v-model="mainForm.company" type="text" class="_HEW_form_control" :class="{ '_HEW_auto_filled': mainForm.company }" readonly placeholder="ดึงข้อมูลอัตโนมัติ">
          </div>
          <div class="_HEW_form_group">
            <label class="_HEW_form_label">อายุงาน</label>
            <input v-model="mainForm.work_age" type="text" class="_HEW_form_control" :class="{ '_HEW_auto_filled': mainForm.work_age }" readonly placeholder="ดึงข้อมูลอัตโนมัติ">
          </div>
        </div>

        <div class="_HEW_info_badge">
          <i class="fas fa-info-circle"></i>
          <span>{{ isEditMode ? 'โหมดแก้ไขข้อมูล' : 'กรุณาค้นหารหัสไทยดิวและเพิ่มรายการก่อนบันทึก' }}</span>
        </div>

        <button class="_HEW_btn _HEW_btn_success _HEW_btn_block _HEW_btn_lg" @click="submitAll">
          <i class="fas fa-save"></i> {{ isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล' }}
        </button>

        <button v-if="!isEditMode" class="_HEW_btn _HEW_btn_primary _HEW_btn_block" style="margin-top:10px;" @click="router.push('/admin/welfare-request-show')">
          <i class="fas fa-list-alt"></i> รายงานข้อมูลสวัสดิการ
        </button>
      </div>

      <!-- RIGHT COLUMN -->
      <div style="display:flex; flex-direction:column; gap:25px;">
        <!-- เพิ่มรายการเบิกสวัสดิการ -->
        <div class="_HEW_card _HEW_animate_in" style="animation-delay:0.2s;">
          <div class="_HEW_card_header">
            <i class="fas fa-plus-circle"></i>
            <h3>เพิ่มรายการเบิกสวัสดิการ</h3>
          </div>
          <div class="_HEW_row">
            <div class="_HEW_form_group">
              <label class="_HEW_form_label">หัวข้อสวัสดิการ</label>
              <select v-model="itemForm.welfare_type" class="_HEW_form_control">
                <option value="">เลือกหัวข้อสวัสดิการ</option>
                <option v-for="type in welfareTypeStore.types" :key="type.id" :value="type.title">{{ type.title }}</option>
              </select>
            </div>
            <div class="_HEW_form_group">
              <label class="_HEW_form_label">รายการสวัสดิการ</label>
              <input v-model="itemForm.welfare_item" type="text" class="_HEW_form_control" placeholder="กรอกรายการขอเบิก">
            </div>
          </div>
          <div class="_HEW_row">
            <div class="_HEW_form_group">
              <label class="_HEW_form_label">วันที่</label>
              <input v-model="itemForm.item_date" type="date" class="_HEW_form_control">
            </div>
            <div class="_HEW_form_group">
              <label class="_HEW_form_label">จำนวนเงิน</label>
              <input v-model="itemForm.amount" type="number" class="_HEW_form_control" placeholder="0.00">
            </div>
          </div>

          <!-- กล่องรูปภาพ 3 ช่อง -->
          <div class="_HEW_row_3" style="margin-bottom:18px;">
            <!-- รูปภาพ -->
            <div class="_HEW_form_group" style="margin-bottom:0;">
              <label class="_HEW_form_label">รูปภาพ</label>
              <div class="_HEW_image_upload_box" :class="{ 'has-image': itemForm.image_preview }">
                <input type="file" @change="onFileChange($event, 'image')" accept="image/*">
                <div v-if="!itemForm.image_preview" class="_HEW_image_placeholder">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <span>คลิกเพื่อเลือกรูปภาพ</span>
                </div>
                <img v-if="itemForm.image_preview" :src="itemForm.image_preview" class="_HEW_preview_img" style="display:block">
                <div class="_HEW_image_label_overlay">📷 รูปภาพ</div>
                <button v-if="itemForm.image_preview" type="button" class="_HEW_image_remove_btn" style="display:flex" @click.stop="removePreview('image')">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            <!-- รูปลายเซ็น 1 -->
            <div class="_HEW_form_group" style="margin-bottom:0;">
              <label class="_HEW_form_label">รูปลายเซ็น 1</label>
              <div class="_HEW_image_upload_box" :class="{ 'has-image': itemForm.signature1_preview }">
                <input type="file" @change="onFileChange($event, 'sig1')" accept="image/*">
                <div v-if="!itemForm.signature1_preview" class="_HEW_image_placeholder">
                  <i class="fas fa-pen-nib"></i>
                  <span>คลิกเพื่อเลือกรูปลายเซ็น</span>
                </div>
                <img v-if="itemForm.signature1_preview" :src="itemForm.signature1_preview" class="_HEW_preview_img" style="display:block">
                <div class="_HEW_image_label_overlay">✍️ ลายเซ็น 1</div>
                <button v-if="itemForm.signature1_preview" type="button" class="_HEW_image_remove_btn" style="display:flex" @click.stop="removePreview('sig1')">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            <!-- รูปลายเซ็น 2 -->
            <div class="_HEW_form_group" style="margin-bottom:0;">
              <label class="_HEW_form_label">รูปลายเซ็น 2</label>
              <div class="_HEW_image_upload_box" :class="{ 'has-image': itemForm.signature2_preview }">
                <input type="file" @change="onFileChange($event, 'sig2')" accept="image/*">
                <div v-if="!itemForm.signature2_preview" class="_HEW_image_placeholder">
                  <i class="fas fa-pen-nib"></i>
                  <span>คลิกเพื่อเลือกรูปลายเซ็น</span>
                </div>
                <img v-if="itemForm.signature2_preview" :src="itemForm.signature2_preview" class="_HEW_preview_img" style="display:block">
                <div class="_HEW_image_label_overlay">✍️ ลายเซ็น 2</div>
                <button v-if="itemForm.signature2_preview" type="button" class="_HEW_image_remove_btn" style="display:flex" @click.stop="removePreview('sig2')">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="_HEW_row">
            <div class="_HEW_form_group">
              <label class="_HEW_form_label">ชื่อผู้เซ็น 1 (พนักงาน)</label>
              <select v-model="itemForm.signer1_name" class="_HEW_form_control" @change="onSigner1Change">
                <option value="">เลือกพนักงานที่เซ็น...</option>
                <option v-for="emp in employeeStore.employees" :key="emp.id" :value="emp.full_name">{{ emp.full_name }}</option>
              </select>
            </div>
            <div class="_HEW_form_group">
              <label class="_HEW_form_label">ชื่อผู้เซ็น 2 (หัวหน้า)</label>
              <select v-model="itemForm.signer2_name" class="_HEW_form_control" @change="onSigner2Change">
                <option value="">เลือกหัวหน้าที่เซ็น...</option>
                <option v-for="sup in supervisorStore.supervisors" :key="sup.id" :value="sup.full_name">{{ sup.full_name }}</option>
              </select>
            </div>
          </div>

          <div class="_HEW_form_group">
            <label class="_HEW_form_label">หมายเหตุ</label>
            <textarea v-model="itemForm.remark" class="_HEW_form_control" placeholder="หมายเหตุ"></textarea>
          </div>

          <button class="_HEW_btn _HEW_btn_primary _HEW_btn_block _HEW_btn_lg" @click="addToCart">
            <i class="fas fa-plus"></i> เพิ่มรายการ
          </button>
        </div>

        <!-- Cart Items -->
        <div class="_HEW_cart_section _HEW_animate_in" style="animation-delay:0.3s;">
          <div class="_HEW_card_header">
            <i class="fas fa-shopping-cart"></i>
            <h3>รายการขอเบิกสวัสดิการ (<span id="_HEW_PR_cartCount">{{ cartItems.length }}</span> รายการ)</h3>
          </div>
          <div v-if="cartItems.length === 0" class="_HEW_empty_cart">
            <i class="fas fa-box-open"></i>
            <p>ยังไม่มีรายการ</p>
            <small>เพิ่มรายการด้านบนเพื่อเริ่มต้น</small>
          </div>
          <div v-else class="_HEW_table_container">
            <table class="_HEW_cart_table">
              <thead>
                <tr>
                  <th style="width: 50px;">ลำดับ</th>
                  <th style="width: 100px;">รูปภาพ</th>
                  <th>หัวข้อการขอเบิก</th>
                  <th>รายการขอเบิก</th>
                  <th style="width: 120px;">วันที่</th>
                  <th style="width: 80px;">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in cartItems" :key="item.id">
                  <td style="text-align: center;">{{ index + 1 }}</td>
                  <td style="text-align: center;">
                    <img v-if="item.image_preview" :src="item.image_preview" class="_HEW_cart_thumb">
                    <span v-else style="color:#94a3b8; font-size: 11px;">ไม่มีรูป</span>
                  </td>
                  <td>{{ item.welfare_type }}</td>
                  <td>
                    <div style="font-weight: 600;">{{ item.welfare_item }}</div>
                    <div v-if="item.amount" style="font-size: 12px; color: #059669; font-weight: 700;">
                      {{ Number(item.amount).toLocaleString() }} บาท
                    </div>
                  </td>
                  <td style="text-align: center;">{{ item.item_date || '-' }}</td>
                  <td style="text-align: center;">
                    <button class="_HEW_btn_icon_only" @click="removeFromCart(index)" title="ลบรายการ">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* CSS styles matched exactly from table.txt */
._HEW_container { max-width:1400px; margin:0 auto; padding: 20px; color: #333; font-family: 'Noto Sans Thai', sans-serif; }
:root {
    --_HEW_primary_color:#0ea5e9; --_HEW_primary_dark:#0284c7;
    --_HEW_success_color:#10b981; --_HEW_danger_color:#ef4444;
    --_HEW_dark_color:#1e293b;    --_HEW_border_color:#bae6fd;
}

._HEW_page_header {
    background:white; padding:25px 30px; border-radius:12px;
    margin-bottom:25px; box-shadow:0 2px 8px rgba(0,0,0,0.08);
    border-left:5px solid var(--_HEW_primary_color);
}
._HEW_page_header h1 {
    font-size:28px; font-weight:700; color:var(--_HEW_dark_color);
    margin-bottom:5px; display:flex; align-items:center; gap:12px;
}
._HEW_page_header h1 i { color:var(--_HEW_primary_color); }
._HEW_page_header p { color:#64748b; font-size:15px; }

._HEW_main_grid { display:grid; grid-template-columns:450px 1fr; gap:20px; margin-bottom:30px; }
._HEW_card {
    background:white; border-radius:12px; padding:25px;
    box-shadow:0 2px 8px rgba(0,0,0,0.08); border:1px solid var(--_HEW_border_color);
}
._HEW_card_header {
    display:flex; align-items:center; gap:10px;
    margin-bottom:20px; padding-bottom:15px; border-bottom:2px solid #f1f5f9;
}
._HEW_card_header h3 { font-size:18px; font-weight:600; color:var(--_HEW_dark_color); }
._HEW_card_header i  { font-size:20px; color:var(--_HEW_primary_color); }

._HEW_form_group { margin-bottom:18px; position:relative; }
._HEW_form_label { display:block; margin-bottom:6px; font-weight:600; color:var(--_HEW_dark_color); font-size:13px; }
._HEW_form_control {
    width:100%; padding:11px 15px; border:1px solid #d1d5db;
    border-radius:8px; font-size:14px; transition:all 0.2s ease;
    background:white; font-family:'Noto Sans Thai',sans-serif;
}
._HEW_form_control:focus { outline:none; border-color:var(--_HEW_primary_color); box-shadow:0 0 0 3px rgba(14,165,233,0.1); }
._HEW_form_control:disabled, ._HEW_form_control[readonly] {
    background:#f8fafc; cursor:not-allowed;
    color:var(--_HEW_primary_dark); font-weight:500; border-color:var(--_HEW_border_color);
}
textarea._HEW_form_control { resize:vertical; min-height:80px; }

._HEW_btn {
    padding:12px 24px; border:none; border-radius:8px; font-size:15px;
    font-weight:600; cursor:pointer; transition:all 0.2s ease;
    display:inline-flex; align-items:center; justify-content:center;
    gap:8px; font-family:'Noto Sans Thai',sans-serif;
}
._HEW_btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(14,165,233,0.15); }
._HEW_btn:active { transform:translateY(0); }
._HEW_btn_primary { background:var(--_HEW_primary_color); color:white; }
._HEW_btn_success { background:var(--_HEW_success_color); color:white; }
._HEW_btn_danger  { background:var(--_HEW_danger_color);  color:white; }
._HEW_btn_block   { width:100%; }
._HEW_btn_lg      { padding:14px 28px; font-size:16px; }

._HEW_cart_section {
    background:white; border-radius:12px; padding:25px;
    box-shadow:0 2px 8px rgba(0,0,0,0.08); border:1px solid var(--_HEW_border_color);
}
._HEW_table_container { overflow-x: auto; }
._HEW_cart_table { width: 100%; border-collapse: collapse; min-width: 600px; }
._HEW_cart_table th, ._HEW_cart_table td { padding: 12px; border: 1px solid #e2e8f0; text-align: left; font-size: 14px; }
._HEW_cart_table th { background: #f8fafc; font-weight: 700; color: var(--_HEW_dark_color); }
._HEW_cart_table tr:hover { background: #f8fafc; }
._HEW_empty_cart { text-align:center; padding:40px 20px; color:#94a3b8; }
._HEW_empty_cart i { font-size:48px; margin-bottom:15px; opacity:0.3; display:block; }

._HEW_info_badge {
    display:inline-flex; align-items:center; gap:8px; padding:10px 15px;
    background:#f0f9ff; border-left:3px solid var(--_HEW_primary_color);
    border-radius:8px; margin-bottom:18px; font-size:13px;
    color:var(--_HEW_primary_dark); width:100%;
}
._HEW_info_badge i { color:var(--_HEW_primary_color); }
._HEW_auto_filled { background-color:#f0f9ff !important; border-left:3px solid var(--_HEW_primary_color) !important; }

._HEW_btn_icon_only {
    background:none; border:none; color:#ef4444; font-size:18px;
    cursor:pointer; padding:8px 12px; border-radius:6px; transition:all 0.2s ease;
}
._HEW_btn_icon_only:hover { background:#fee2e2; transform:scale(1.1); }

._HEW_row   { display:grid; grid-template-columns:repeat(2,1fr); gap:15px; }
._HEW_row_3 { display:grid; grid-template-columns:repeat(3,1fr); gap:15px; }

._HEW_image_upload_box {
    border:2px dashed #bae6fd; border-radius:10px; cursor:pointer;
    transition:all 0.2s ease; background:#f8fafc; height:160px;
    display:flex; flex-direction:column; align-items:center;
    justify-content:center; position:relative; overflow:hidden;
}
._HEW_image_upload_box:hover { border-color:var(--_HEW_primary_color); background:#f0f9ff; }
._HEW_image_upload_box.has-image { border-style:solid; border-color:var(--_HEW_primary_color); padding:0 !important; }
._HEW_image_upload_box input[type="file"] { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; z-index:5; }
._HEW_image_placeholder { pointer-events:none; text-align:center; }
._HEW_image_placeholder i { font-size:32px; color:#94a3b8; display:block; margin-bottom:6px; }
._HEW_image_placeholder span { font-size:12px; color:#94a3b8; }
._HEW_preview_img {
    position:absolute; top:0; left:0; width:100%; height:100%;
    object-fit:contain; border-radius:8px; z-index:1; pointer-events:none;
}
._HEW_image_remove_btn {
    position:absolute; top:5px; right:5px; background:#ef4444; color:white;
    border:none; border-radius:50%; width:24px; height:24px; font-size:11px;
    cursor:pointer; align-items:center; justify-content:center;
    z-index:10; line-height:1; box-shadow:0 2px 6px rgba(0,0,0,0.3);
}
._HEW_image_remove_btn:hover { background:#dc2626; transform:scale(1.1); }
._HEW_image_label_overlay {
    position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.45);
    color:white; font-size:11px; text-align:center; padding:4px 0;
    border-radius:0 0 8px 8px; z-index:2; pointer-events:none;
}

._HEW_input_search_wrap { position:relative; }
._HEW_input_search_wrap ._HEW_form_control { padding-right:42px; }
._HEW_input_search_btn {
    position:absolute; right:8px; top:50%; transform:translateY(-50%);
    border:none; border-radius:6px; width:28px; height:28px; cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:12px;
    transition:all 0.2s; background:none;
}
._HEW_input_search_btn:hover { background: #f0f9ff; }

/* Search Dropdown Styles */
._HEW_search_dropdown {
    position: absolute; top: 100%; left: 0; right: 0; background: white;
    border: 1px solid var(--_HEW_border_color); border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 100;
    max-height: 250px; overflow-y: auto; margin-top: 5px;
}
._HEW_dropdown_item {
    padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f1f5f9;
    transition: background 0.15s;
}
._HEW_dropdown_item:last-child { border-bottom: none; }
._HEW_dropdown_item:hover { background: #f0f9ff; }
.emp-main { display: flex; gap: 10px; align-items: center; }
.emp-code { font-weight: 700; color: var(--_HEW_primary_color); font-size: 13px; }
.emp-name { font-weight: 600; font-size: 14px; color: var(--_HEW_dark_color); }
.emp-sub { font-size: 11px; color: #64748b; margin-top: 2px; }

@keyframes _HEW_fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
._HEW_animate_in { animation:_HEW_fadeIn 0.5s ease-out; }
._HEW_cart_thumb { height:50px; width:70px; object-fit:contain; border-radius:6px; border:1px solid #bae6fd; background: #fff; }

@media (max-width:1024px) { ._HEW_main_grid{grid-template-columns:1fr} ._HEW_row_3{grid-template-columns:repeat(2,1fr)} }
@media (max-width:768px) {
    ._HEW_page_header h1{font-size:22px} ._HEW_card{padding:15px}
    ._HEW_row,._HEW_row_3{grid-template-columns:1fr} ._HEW_cart_item{flex-direction:column;gap:10px}
}
</style>
