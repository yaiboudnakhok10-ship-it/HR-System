// src/i18n/index.js
import { ref } from 'vue'

const messages = {
  TH: {
    // Topbar
    brand: 'ระบบ ERHR',
    profile: 'โปรไฟล์',
    settings: 'ตั้งค่า',
    logout: 'ออกจากระบบ',
    administrator: 'ผู้ดูแลระบบ',
    confirmLogout: 'ต้องการออกจากระบบ?',

    // Sidebar search
    searchMenu: 'ค้นหาเมนู...',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    version: 'ERHR System v1.0',

    // Menu items
    home:        'หน้าหลัก',
    employees:   'พนักงาน',
    cases:       'เคส',
    dashboard:   'หน้า Dashboard',
    warningForm: 'ฟอร์มสร้างใบเตือน',
    warningHistory: 'ประวัติการแจกใบเตือน',
    warningTypes:   'ประเภทใบเตือน',

    // Submenu - Warning Types
    warningData:       'ข้อมูลใบเตือน',
    warningSubject:    'ข้อมูลหัวข้อใบเตือน',
    warningPunishment: 'ข้อมูลบทลงโทษ',
    warningOfficer:    'ข้อมูลเจ้าหน้าที่',

    // Pages - Home
    dashboardTitle:   'แดชบอร์ด',
    dashboardWelcome: 'ยินดีต้อนรับสู่ระบบ ERHR',

    // Pages - Employees
    employeeTitle:    'จัดการพนักงาน',
    employeeAdd:      'เพิ่มพนักงาน',
    employeeName:     'ชื่อ-นามสกุล',
    employeePosition: 'ตำแหน่ง',
    employeeDept:     'แผนก',
    employeeStatus:   'สถานะ',
    employeeSearch:   'ค้นหาพนักงาน...',

    // Pages - Cases
    caseTitle:    'จัดการเคส',
    caseAdd:      'เพิ่มเคส',
    caseNo:       'เลขที่เคส',
    caseSubject:  'หัวข้อ',
    caseAssignee: 'ผู้รับผิดชอบ',
    casePriority: 'ความสำคัญ',
    caseStatus:   'สถานะ',

    // Common
    save:     'บันทึก',
    cancel:   'ยกเลิก',
    edit:     'แก้ไข',
    delete:   'ลบ',
    search:   'ค้นหา',
    noData:   'ไม่พบข้อมูล',
    loading:  'กำลังโหลด...',
    actions:  'การดำเนินการ',
    total:    'ทั้งหมด',
    active:   'ใช้งาน',
    inactive: 'ไม่ใช้งาน',
    high:     'สูง',
    medium:   'กลาง',
    low:      'ต่ำ',
  },

  EN: {
    brand:        'ERHR System',
    profile:      'Profile',
    settings:     'Settings',
    logout:       'Logout',
    administrator:'Administrator',
    confirmLogout:'Confirm logout?',

    searchMenu: 'Search menu...',
    darkMode:   'Dark Mode',
    lightMode:  'Light Mode',
    version:    'ERHR System v1.0',

    home:           'Home',
    employees:      'Employees',
    cases:          'Cases',
    dashboard:      'Dashboard',
    warningForm:    'Create Warning Form',
    warningHistory: 'Warning History',
    warningTypes:   'Warning Types',

    warningData:       'Warning Data',
    warningSubject:    'Warning Subject Data',
    warningPunishment: 'Punishment Data',
    warningOfficer:    'Officer Data',

    dashboardTitle:   'Dashboard',
    dashboardWelcome: 'Welcome to ERHR System',

    employeeTitle:    'Employee Management',
    employeeAdd:      'Add Employee',
    employeeName:     'Full Name',
    employeePosition: 'Position',
    employeeDept:     'Department',
    employeeStatus:   'Status',
    employeeSearch:   'Search employees...',

    caseTitle:    'Case Management',
    caseAdd:      'Add Case',
    caseNo:       'Case No.',
    caseSubject:  'Subject',
    caseAssignee: 'Assignee',
    casePriority: 'Priority',
    caseStatus:   'Status',

    save:     'Save',
    cancel:   'Cancel',
    edit:     'Edit',
    delete:   'Delete',
    search:   'Search',
    noData:   'No data found',
    loading:  'Loading...',
    actions:  'Actions',
    total:    'Total',
    active:   'Active',
    inactive: 'Inactive',
    high:     'High',
    medium:   'Medium',
    low:      'Low',
  },

  LA: {
    brand:        'ລະບົບ ERHR',
    profile:      'ໂປຣໄຟລ໌',
    settings:     'ການຕັ້ງຄ່າ',
    logout:       'ອອກຈາກລະບົບ',
    administrator:'ຜູ້ດູແລລະບົບ',
    confirmLogout:'ຢືນຢັນການອອກຈາກລະບົບ?',

    searchMenu: 'ຄົ້ນຫາເມນູ...',
    darkMode:   'ໂໝດມືດ',
    lightMode:  'ໂໝດສະຫວ່າງ',
    version:    'ERHR System v1.0',

    home:           'ໜ້າຫຼັກ',
    employees:      'ພະນັກງານ',
    cases:          'ເຄດ',
    dashboard:      'ໜ້າ Dashboard',
    warningForm:    'ຟອມສ້າງໃບເຕືອນ',
    warningHistory: 'ປະຫວັດການແຈກໃບເຕືອນ',
    warningTypes:   'ປະເພດໃບເຕືອນ',

    warningData:       'ຂໍ້ມູນໃບເຕືອນ',
    warningSubject:    'ຂໍ້ມູນຫົວຂໍ້ໃບເຕືອນ',
    warningPunishment: 'ຂໍ້ມູນບົດລົງໂທດ',
    warningOfficer:    'ຂໍ້ມູນເຈົ້າໜ້າທີ່',

    dashboardTitle:   'ແດຊບອດ',
    dashboardWelcome: 'ຍິນດີຕ້ອນຮັບສູ່ລະບົບ ERHR',

    employeeTitle:    'ຈັດການພະນັກງານ',
    employeeAdd:      'ເພີ່ມພະນັກງານ',
    employeeName:     'ຊື່-ນາມສະກຸນ',
    employeePosition: 'ຕໍາແໜ່ງ',
    employeeDept:     'ພະແນກ',
    employeeStatus:   'ສະຖານະ',
    employeeSearch:   'ຄົ້ນຫາພະນັກງານ...',

    caseTitle:    'ຈັດການເຄດ',
    caseAdd:      'ເພີ່ມເຄດ',
    caseNo:       'ເລກທີ່ເຄດ',
    caseSubject:  'ຫົວຂໍ້',
    caseAssignee: 'ຜູ້ຮັບຜິດຊອບ',
    casePriority: 'ຄວາມສໍາຄັນ',
    caseStatus:   'ສະຖານະ',

    save:     'ບັນທຶກ',
    cancel:   'ຍົກເລີກ',
    edit:     'ແກ້ໄຂ',
    delete:   'ລົບ',
    search:   'ຄົ້ນຫາ',
    noData:   'ບໍ່ພົບຂໍ້ມູນ',
    loading:  'ກຳລັງໂຫຼດ...',
    actions:  'ການດຳເນີນການ',
    total:    'ທັງໝົດ',
    active:   'ໃຊ້ງານ',
    inactive: 'ບໍ່ໃຊ້ງານ',
    high:     'ສູງ',
    medium:   'ກາງ',
    low:      'ຕໍ່າ',
  }
}

const currentLang = ref('TH')

try {
  const saved = localStorage.getItem('erhr_lang')
  if (saved && messages[saved]) currentLang.value = saved
} catch { void 0 }

function t(key) {
  return messages[currentLang.value]?.[key] ?? messages['EN']?.[key] ?? key
}

function setLang(lang) {
  if (!messages[lang]) return
  currentLang.value = lang
  try { localStorage.setItem('erhr_lang', lang) } catch { void 0 }
}

export function useLang() {
  return { lang: currentLang, t, setLang, availableLangs: Object.keys(messages) }
}
