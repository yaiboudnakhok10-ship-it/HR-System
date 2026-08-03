<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore }           from '@/stores/auth.store'
import { useDisciplineListStore } from '@/stores/cases.stores'
import { useVerbalWarningListStore } from '@/stores/verbal_warning_list.store'
import { useEmployeeStore }       from '@/stores/Useemployeestore'
import Swal   from 'sweetalert2'

const auth            = useAuthStore()
const disciplineStore = useDisciplineListStore()
const verbalStore     = useVerbalWarningListStore()
const empStore        = useEmployeeStore()

const router = useRouter()
const route  = useRoute()

const menuItems = [
  { name: 'Dashboard',           path: '/admin/asset-management', icon: 'fa-chart-pie' },
  { name: 'ฟอร์มเบิกชับสินบริษัท',  path: '/admin/company-withdrawal',     icon: 'fa-truck-ramp-box'  },
  { name: 'ฟอร์มเบิกสวัสดิการ',  path: '/admin/welfare-request', icon: 'fa-hand-holding-medical'  },
  {
    name: 'ประเภทลายเช็น',
    icon: 'fa-signature',
    children: [
      { name: 'ลายเช็นหัวหน้า', path: '/admin/document',      icon: 'fa-user-check' },
      { name: 'ลายเช็นพนักงาน',   path: '/admin/EmpSignatures', icon: 'fa-id-card'  },
    ],
  },
  {
    name: 'ประเภทกหัวข้อ',
    icon: 'fa-folder-tree',
    children: [
      { name: 'หัวข้อเบิกชับสินบริษัท', path: '/admin/regulation-type-asset', icon: 'fa-box-archive' },
      { name: 'หัวข้อเบิกสวัสดิการ', path: '/admin/regulation-type-welfare', icon: 'fa-hospital-user' },
    ],
  }
]

// ── Sidebar ────────────────────────────────────────────────
const sidebarCollapsed  = ref(false)
const mobileSidebarOpen = ref(false)
const isMobile          = ref(window.innerWidth <= 768)

function toggleSidebar() {
  if (isMobile.value) mobileSidebarOpen.value = !mobileSidebarOpen.value
  else sidebarCollapsed.value = !sidebarCollapsed.value
}
function closeMobileSidebar() { mobileSidebarOpen.value = false }

// ── Submenu ────────────────────────────────────────────────
const openSubmenus = ref({})
function toggleSubmenu(name) { openSubmenus.value[name] = !openSubmenus.value[name] }
function isSubmenuOpen(name) { return !!openSubmenus.value[name] }
function isChildActive(item) { return item.children?.some(c => route.path === c.path) }

// ── Dark mode ──────────────────────────────────────────────
const isDark = ref(false)
function applyDark(on) {
  isDark.value = on
  document.body.classList.toggle('dark', on)
  try { localStorage.setItem('erhr_darkmode', on ? '1' : '0') } catch { void 0 }
}
function toggleDark() { applyDark(!isDark.value) }

// ── DateTime ───────────────────────────────────────────────
const now = ref(new Date())
let clockTimer = null

const datetimeStr = computed(() => {
  const d = now.value
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const month = months[d.getMonth()]
  const day   = d.getDate()
  const year  = d.getFullYear()
  let h       = d.getHours()
  const ampm  = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${month} ${day}, ${year}, ${String(h).padStart(2,'0')}:${mm}:${ss} ${ampm}`
})

function formatNotifTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(String(dateStr).replace(/\+00.*$/, ''))
  if (isNaN(d)) return ''
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  const day   = d.getDate()
  const month = months[d.getMonth()]
  const year  = d.getFullYear() + 543
  const hh    = String(d.getHours()).padStart(2, '0')
  const mm    = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hh}:${mm} น.`
}

function formatNotifDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(String(dateStr).replace(/\+00.*$/, ''))
  if (isNaN(d)) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

// ── Warning notifications ──────────────────────────────────
const allWarningData = computed(() => {
  const list = []
  ;(disciplineStore.cases || []).forEach(row => list.push({ ...row, source: 'discipline_cases' }))
  ;(verbalStore.cases   || []).forEach(row => list.push({ ...row, source: 'verbal_warning_cases' }))
  return list
})

const READ_WARNING_KEY = 'erhr_read_warning_ids'
const readWarnings = ref(new Set())

function loadReadWarnings() {
  try {
    const raw = localStorage.getItem(READ_WARNING_KEY)
    if (!raw) return
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) readWarnings.value = new Set(arr)
  } catch { void 0 }
}

function persistReadWarnings() {
  try {
    localStorage.setItem(READ_WARNING_KEY, JSON.stringify([...readWarnings.value]))
  } catch { void 0 }
}

function warningTypeKeys(row) {
  // discipline_cases: แยกตามหัวข้อ/ประเภทเหตุการณ์
  if (row.source === 'discipline_cases') {
    const caseType = String(row.case_type || '').trim()
    return [{ key: `case:${caseType || 'ไม่ระบุ'}`, label: caseType || 'ไม่ระบุ' }]
  }
  // verbal_warning_cases: แยก วาจา / วินัย
  const types = []
  if (row.punish_verbal) {
    types.push({ key: 'doc:ใบเตือนวาจา', label: 'ใบเตือนวาจา' })
  }
  if (row.punish_written1 || row.punish_written2 || row.punish_written3 || row.punish_other) {
    types.push({ key: 'doc:ใบเตือนวินัย', label: 'ใบเตือนวินัย' })
  }
  return types.length ? types : [{ key: 'doc:ใบเตือนวาจา', label: 'ใบเตือนวาจา' }]
}

const warningNotifications = computed(() => {
  const map = {}
  allWarningData.value.forEach(d => {
    const code = d.employee_code
    if (!code) return
    const name = d.employee_name || '-'
    const dept = d.position || d.department || '-'
    const dtRaw = d.created_at || d.incident_date || null
    const latestCandidateSubject = d.subject || d.detail || ''
    warningTypeKeys(d).forEach(t => {
      const groupKey = `${code}::${t.key}`
      if (!map[groupKey]) {
        map[groupKey] = { code, name, dept, typeLabel: t.label, count: 0, latestAt: null, latestSubject: '', records: [] }
      }
      map[groupKey].count += 1
      map[groupKey].records.push({
        dateRaw: dtRaw,
        dateLabel: formatNotifDate(dtRaw),
        subject: latestCandidateSubject || '-',
      })
      if (!map[groupKey].latestAt || (dtRaw && new Date(dtRaw) > new Date(map[groupKey].latestAt))) {
        map[groupKey].latestAt = dtRaw
        map[groupKey].latestSubject = latestCandidateSubject
      }
    })
  })
  return Object.values(map)
    .filter(e => e.count >= 3)
    .map(e => {
      const count = e.count
      const color = count >= 4 ? 'notif-amber' : 'notif-red'
      return {
        id: `warn-${e.code}-${e.typeLabel}`, icon: 'fa-triangle-exclamation', color,
        title: `ครบ ${count} ครั้ง: ${e.typeLabel}`,
        desc: `รหัส: ${e.code} — ${e.name}`,
        dept: e.dept,
        incidentDate: formatNotifDate(e.latestAt),
        subject: e.latestSubject || '',
        records: (e.records || [])
          .sort((a, b) => (new Date(b.dateRaw || 0)).getTime() - (new Date(a.dateRaw || 0)).getTime())
          .slice(0, Math.max(3, count)),
        time: formatNotifTime(e.latestAt || new Date().toISOString()),
        count,
      }
    })
    .filter(n => !readWarnings.value.has(n.id))
})

const unreadCount = computed(() => warningNotifications.value.length)

// ── Notification panel ─────────────────────────────────────
const notifOpen = ref(false)
function toggleNotif() { notifOpen.value = !notifOpen.value; profileOpen.value = false }
function closeNotif()  { notifOpen.value = false }
function markRead(id)  {
  readWarnings.value = new Set([...readWarnings.value, id])
  persistReadWarnings()
}
function markAllRead() {
  const ids = warningNotifications.value.map(n => n.id)
  if (ids.length) {
    readWarnings.value = new Set([...readWarnings.value, ...ids])
    persistReadWarnings()
  }
}

// ── Profile dropdown ───────────────────────────────────────
const profileOpen = ref(false)
const switchSystemOpen = ref(false)

function toggleProfile() { 
  profileOpen.value = !profileOpen.value
  notifOpen.value = false 
  switchSystemOpen.value = false
}
function closeProfile()  { profileOpen.value = false; switchSystemOpen.value = false }
function toggleSwitchSystem() { switchSystemOpen.value = !switchSystemOpen.value }

function navigateBackToERHR() {
  // นำทางกลับไปยังระบบใบเตือน
  router.push('/')
}

// ── Logout ─────────────────────────────────────────────────
async function handleLogout() {
  profileOpen.value = false
  const result = await Swal.fire({
    title: 'ออกจากระบบ?', text: 'คุณต้องการออกจากระบบใช่หรือไม่',
    icon: 'question', showCancelButton: true,
    confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
    confirmButtonText: '<i class="fa fa-right-from-bracket"></i> ออกจากระบบ',
    cancelButtonText: 'ยกเลิก', reverseButtons: true,
  })
  if (result.isConfirmed) {
    await Swal.fire({
      title: 'ออกจากระบบแล้ว', text: 'ขอบคุณที่ใช้งานระบบ ERHR',
      icon: 'success', timer: 1500, showConfirmButton: false, timerProgressBar: true,
    })
    auth.logout()
    router.push({ name: 'Login' })
  }
}

// ════════════════════════════════════════════════════════════
// ── EDIT PROFILE DRAWER ─────────────────────────────────────
// ════════════════════════════════════════════════════════════
const editProfileOpen  = ref(false)
const isSavingProfile  = ref(false)
const saveProfileError = ref('')

// ── Employee search ─────────────────────────────────────────
const profileEmpSearch        = ref('')
const profileEmpOptions       = ref([])
const profileShowEmpDropdown  = ref(false)
const profileSelectedEmployee = ref(null)
let profileEmpTimer = null

watch(profileEmpSearch, (val) => {
  if (profileEmpTimer) clearTimeout(profileEmpTimer)
  const q = (val || '').trim()
  if (!q) {
    profileEmpOptions.value       = []
    profileShowEmpDropdown.value  = false
    profileSelectedEmployee.value = null
    return
  }
  profileEmpTimer = setTimeout(async () => {
    const results = await empStore.searchByCode(q)
    profileEmpOptions.value      = results || []
    profileShowEmpDropdown.value = profileEmpOptions.value.length > 0
  }, 300)
})

function selectProfileEmployee(emp) {
  // แสดงแค่รหัสพนักงานใน input
  profileEmpSearch.value        = `${emp.employee_code}`
  profileSelectedEmployee.value = emp
  profileEmpOptions.value       = []
  profileShowEmpDropdown.value  = false
}

function clearProfileEmpSearch() {
  profileEmpSearch.value        = ''
  profileSelectedEmployee.value = null
  profileEmpOptions.value       = []
  profileShowEmpDropdown.value  = false
}

// ── Form fields ─────────────────────────────────────────────
const editUsername     = ref('')
const editPassword     = ref('')
const editShowPassword = ref(false)

function openEditProfile() {
  saveProfileError.value = ''
  if (auth.session?.employee_code) {
    // แสดงแค่รหัสพนักงานใน input ไม่เอาชื่อมาด้วย
    profileEmpSearch.value        = `${auth.session.employee_code}`
    profileSelectedEmployee.value = {
      employee_code: auth.session.employee_code,
      fullname:      auth.session.fullname || '',
      department:    auth.session.department || '',
    }
  } else {
    profileEmpSearch.value        = ''
    profileSelectedEmployee.value = null
  }
  profileEmpOptions.value      = []
  profileShowEmpDropdown.value = false
  editUsername.value     = auth.session?.username || ''
  editPassword.value     = ''
  editShowPassword.value = false
  editProfileOpen.value  = true
  profileOpen.value      = false
}

function closeEditProfile() { editProfileOpen.value = false }

async function saveProfileChanges() {
  saveProfileError.value = ''
  if (!profileSelectedEmployee.value) { saveProfileError.value = 'กรุณาเลือกพนักงาน'; return }
  if (!editUsername.value.trim())     { saveProfileError.value = 'กรุณากรอก Username'; return }

  isSavingProfile.value = true
  try {
    const updateData = {
      employee_code: profileSelectedEmployee.value.employee_code,
      fullname:      profileSelectedEmployee.value.fullname,
      username:      editUsername.value.trim(),
    }

    if (editPassword.value.trim()) {
      updateData.password_hash = editPassword.value.trim()
    }

    const result = await auth.updateUserProfile(auth.session.userId, updateData)
    
    if (!result.success) {
      throw new Error(result.error)
    }

    await Swal.fire({
      title: 'สำเร็จ!', 
      text: 'บันทึกข้อมูลแล้ว', 
      icon: 'success',
      timer: 1500, 
      showConfirmButton: false, 
      timerProgressBar: true,
    })
    editProfileOpen.value = false
  } catch (err) {
    console.error('Error saving profile:', err)
    saveProfileError.value = err.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่'
  } finally {
    isSavingProfile.value = false
  }
}

// ── Navigate / Resize / Lifecycle ──────────────────────────
function navigate(path) {
  router.push(path)
  if (isMobile.value) closeMobileSidebar()
  // ✅ ปิด dropdown/panel ต่างๆ เมื่อมีการเปลี่ยนหน้า
  notifOpen.value = false
  profileOpen.value = false
  switchSystemOpen.value = false
}
function onResize() {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) mobileSidebarOpen.value = false
}

onMounted(async () => {
  loadReadWarnings()
  window.addEventListener('resize', onResize)
  clockTimer = setInterval(() => { now.value = new Date() }, 1000)
  try { if (localStorage.getItem('erhr_darkmode') === '1') applyDark(true) } catch { void 0 }
  menuItems.forEach(m => {
    if (m.children && m.children.some(c => route.path === c.path))
      openSubmenus.value[m.name] = true
  })
  await Promise.all([disciplineStore.fetchAll(), verbalStore.fetchAll()])
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  clearInterval(clockTimer)
})

// ── v-click-outside ─────────────────────────────────────────
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value() }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el._clickOutside)
  },
}
</script>

<template>
  <div :class="['app-root', { dark: isDark, 'sb-collapsed': sidebarCollapsed && !isMobile }]">

    <!-- ════ TOPBAR ════ -->
    <header class="topbar">
      <div class="topbar-brand">
        <img src="/images/Thaidrill.jpeg" alt="ThaiDrill" class="brand-logo" />
        <div class="brand-text">
          <span class="brand-name">ThaiDrill Lao</span>
          <span class="brand-sub">ER System</span>
        </div>
      </div>

      <button class="tb-hamburger" @click="toggleSidebar" aria-label="Toggle sidebar">
        <i class="fa fa-bars"></i>
      </button>

      <div class="topbar-right">
        <div class="tb-actions">

          <!-- Dark Mode Toggle -->
          <button class="tb-dark-toggle" @click="toggleDark" :title="isDark ? 'Light Mode' : 'Dark Mode'">
            <i :class="isDark ? 'fa fa-moon' : 'fa fa-sun'" class="dark-toggle-icon"></i>
          </button>

          <!-- DateTime -->
          <div class="tb-datetime">
            <i class="fa fa-calendar"></i>
            <span class="tb-datetime-single">{{ datetimeStr }}</span>
          </div>

          <!-- Notification Bell -->
          <div class="tb-notif-wrap" v-click-outside="closeNotif">
            <button class="tb-notif-btn" @click="toggleNotif">
              <i class="fa fa-bell"></i>
              <span class="notif-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
            </button>
            <transition name="dropdown">
              <div class="tb-notif-panel" v-if="notifOpen">
                <div class="notif-header">
                  <span class="notif-title">การแจ้งเตือน</span>
                  <span class="notif-count-tag" v-if="unreadCount > 0">{{ unreadCount }} ใหม่</span>
                  <button class="notif-mark-all" @click="markAllRead" v-if="unreadCount > 0">อ่านทั้งหมด</button>
                </div>
                <div class="notif-list">
                  <div v-for="n in warningNotifications" :key="n.id" class="notif-item" @click="markRead(n.id)">
                    <div :class="['notif-icon-wrap', n.color]">
                      <i :class="['fa', n.icon]"></i>
                    </div>
                    <div class="notif-body">
                      <div class="notif-item-title">
                        <span class="notif-warn-badge">ครั้งที่ {{ n.count }}</span>
                        {{ n.title }}
                      </div>
                      <div class="notif-item-desc">{{ n.desc }}</div>
                      <div v-if="n.records && n.records.length" class="notif-records">
                        <div class="notif-record-row" v-for="(r, idx) in n.records" :key="n.id + '-r-' + idx">
                          <i class="fa fa-calendar"></i>
                          วันที่เกิดเหตุ: {{ r.dateLabel || '-' }} — เรื่อง: {{ r.subject || '-' }}
                        </div>
                      </div>
                      <div class="notif-item-dept" v-if="n.dept"><i class="fa fa-building"></i> {{ n.dept }}</div>
                      <div class="notif-item-time" v-if="n.time"><i class="fa fa-clock"></i> {{ n.time }}</div>
                    </div>
                  </div>
                  <div v-if="warningNotifications.length === 0" class="notif-empty">
                    <i class="fa fa-bell-slash"></i>
                    <span>ไม่มีการแจ้งเตือน</span>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <!-- Profile dropdown -->
          <div class="tb-profile-wrap" v-click-outside="closeProfile">
            <button class="tb-profile-btn" @click="toggleProfile">
              <div class="tb-avatar"><i class="fa fa-user"></i></div>
              <div class="tb-profile-info">
                <span class="tb-profile-name">{{ auth.session?.fullname || 'Admin User' }}</span>
                <span class="tb-profile-role">Name: {{ auth.session?.username || '-' }}</span>
              </div>
              <i class="fa fa-chevron-down tb-profile-arrow" :class="{ rotated: profileOpen }"></i>
            </button>
            <transition name="dropdown">
              <div class="tb-dropdown" v-if="profileOpen">
                <div class="tb-dropdown-header">
                  <div class="tb-avatar-container">
                    <img src="/images/Thaidrill.jpeg" alt="Avatar" class="tb-avatar-img" />
                  </div>
                  <div class="tb-profile-details">
                    <div class="tb-dd-name">{{ auth.session?.fullname || 'Admin User' }}</div>
                    <div class="tb-dd-code">{{ auth.session?.employee_code || '-' }} ({{ auth.session?.username || '-' }})</div>
                    <div class="tb-dd-badge-wrap">
                      <span class="tb-dd-badge">
                        <i class="fa fa-briefcase"></i> จนท.DMIS
                      </span>
                    </div>
                    <div class="tb-dd-dept">( Project Coordination )</div>
                  </div>
                </div>
                <div class="tb-dropdown-divider"></div>
                
                <div class="tb-dd-menu">
                  <button class="tb-dd-item" @click="openEditProfile">
                    <div class="tb-dd-icon-wrap blue"><i class="fa fa-user-pen"></i></div>
                    <span>แก้ไขข้อมูลโปรไฟล์</span>
                  </button>

                  <div class="tb-dd-group">
                    <button class="tb-dd-item" @click="toggleSwitchSystem">
                      <div class="tb-dd-icon-wrap purple"><i class="fa fa-right-left"></i></div>
                      <span class="flex-1">สลับระบบ</span>
                      <i class="fa fa-chevron-down tb-dd-arrow" :class="{ rotated: switchSystemOpen }"></i>
                    </button>
                    <transition name="submenu">
                      <div class="tb-dd-sub" v-if="switchSystemOpen">
                        <button class="tb-dd-item tb-dd-sub-item" @click="navigateBackToERHR">
                          <div class="tb-dd-icon-wrap purple-light"><i class="fa fa-file-invoice"></i></div>
                          <span>กลับไประบบใบเตือน</span>
                        </button>
                      </div>
                    </transition>
                  </div>

                  <button class="tb-dd-item tb-dd-logout" @click="handleLogout">
                    <div class="tb-dd-icon-wrap red"><i class="fa fa-right-from-bracket"></i></div>
                    <span>ออกจากระบบ</span>
                  </button>
                </div>

                <div class="tb-dd-footer">
                  เข้าสู่ระบบเมื่อ: {{ formatNotifDate(new Date()) }}
                </div>
              </div>
            </transition>
          </div>

        </div>
      </div>
    </header>

    <!-- ════ LAYOUT ════ -->
    <div class="layout">

      <!-- ════ SIDEBAR ════ -->
      <aside class="sidebar" :class="{ '_open': mobileSidebarOpen }">
        <nav>
          <template v-for="item in menuItems" :key="item.path || item.name">
            <template v-if="item.children">
              <a class="nav-item nav-parent" :class="{ 'has-active': isChildActive(item) }"
                href="#" @click.prevent="toggleSubmenu(item.name)">
                <i :class="['fa', item.icon]"></i>
                <span class="nav-label">{{ item.name }}</span>
                <i class="fa fa-chevron-right nav-arrow" :class="{ rotated: isSubmenuOpen(item.name) }"></i>
              </a>
              <transition name="submenu">
                <div class="submenu-wrap" v-if="isSubmenuOpen(item.name)">
                  <a v-for="child in item.children" :key="child.path"
                    class="nav-item nav-child" :class="{ active: route.path === child.path }"
                    href="#" @click.prevent="navigate(child.path)">
                    <i :class="['fa', child.icon]"></i>
                    <span class="nav-label">{{ child.name }}</span>
                  </a>
                </div>
              </transition>
            </template>
            <a v-else class="nav-item" :class="{ active: route.path === item.path }"
              href="#" @click.prevent="navigate(item.path)">
              <i :class="['fa', item.icon]"></i>
              <span class="nav-label">{{ item.name }}</span>
            </a>
          </template>
        </nav>
        <div class="sb-divider"></div>
        <div class="sb-bottom">
          <div class="sb-version">ERHR System v1.0</div>
        </div>
      </aside>

      <div v-if="mobileSidebarOpen" class="mobile-overlay" @click="closeMobileSidebar"></div>

      <main class="content-wrap">
        <div class="content-container">
          <router-view />
        </div>
      </main>
    </div>

    <!-- ════ EDIT PROFILE DRAWER ════ -->
    <Teleport to="body">
      <transition name="slide-right">
        <div v-if="editProfileOpen" class="profile-drawer-overlay" @click.self="closeEditProfile">
          <div class="drawer">

            <!-- Header -->
            <div class="drawer-header">
              <span class="drawer-title">
                <!-- ✅ เปลี่ยนไอคอน drawer header -->
                <i class="fa fa-user-pen"></i>
                แก้ไขข้อมูลผู้ใช้งาน
              </span>
              <button class="drawer-close" @click="closeEditProfile">
                <i class="fa fa-times"></i>
              </button>
            </div>

            <!-- Body -->
            <div class="drawer-body">

              <!-- ── ค้นหาพนักงาน ── -->
              <div class="field-group">
                <label class="field-label">
                  ค้นหารหัสพนักงาน <span class="field-required">*</span>
                </label>
                <div class="input-wrap">
                  <i class="fa fa-search input-icon-left"></i>
                  <input
                    v-model="profileEmpSearch"
                    class="field-input field-input--icon-l field-input--icon-r"
                    placeholder="กรอกรหัสพนักงาน"
                    autocomplete="off"
                  />
                  <button v-if="profileEmpSearch" type="button" class="input-clear-btn" @click="clearProfileEmpSearch">
                    <i class="fa fa-times"></i>
                  </button>
                  <i v-else-if="empStore.loading" class="fa fa-spinner fa-spin input-icon-right"></i>

                  <!-- Dropdown ผลค้นหา — ยังแสดงรหัส + ชื่อ + แผนก เหมือนเดิม -->
                  <div v-if="profileShowEmpDropdown" class="emp-dropdown">
                    <button
                      v-for="e in profileEmpOptions" :key="e.id || e.employee_code"
                      type="button" class="emp-option"
                      @click="selectProfileEmployee(e)"
                    >
                      <span class="emp-code-badge">{{ e.employee_code }}</span>
                      <span class="emp-name">{{ e.fullname }}</span>
                      <span class="emp-dept" v-if="e.department">({{ e.department }})</span>
                    </button>
                    <div
                      v-if="profileEmpOptions.length === 0 && profileEmpSearch.trim() && !empStore.loading"
                      class="emp-no-result"
                    >
                      <i class="fa fa-search"></i> ไม่พบพนักงานที่ค้นหา
                    </div>
                  </div>
                </div>

                <!-- Card พนักงานที่เลือก — แสดงชื่อ/แผนกที่นี่แทน -->
                <div v-if="profileSelectedEmployee" class="emp-selected-card">
                  <div class="emp-selected-row">
                    <span class="emp-selected-label">รหัส</span>
                    <span class="emp-selected-val emp-selected-code">{{ profileSelectedEmployee.employee_code }}</span>
                  </div>
                  <div class="emp-selected-row">
                    <span class="emp-selected-label">ชื่อ</span>
                    <span class="emp-selected-val">{{ profileSelectedEmployee.fullname }}</span>
                  </div>
                  <div v-if="profileSelectedEmployee.department" class="emp-selected-row">
                    <span class="emp-selected-label">ตำแหน่ง</span>
                    <span class="emp-selected-val">{{ profileSelectedEmployee.department }}</span>
                  </div>
                </div>
              </div>

              <!-- ── Username ── -->
              <div class="field-group">
                <label class="field-label">
                  Username <span class="field-required">*</span>
                </label>
                <div class="input-wrap">
                  <i class="fa fa-user input-icon-left"></i>
                  <input
                    v-model="editUsername"
                    class="field-input field-input--icon-l"
                    placeholder="กรอก Username"
                    autocomplete="off"
                  />
                </div>
              </div>

              <!-- ── Password ── -->
              <div class="field-group">
                <label class="field-label">
                  Password
                  <span class="field-hint">(เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)</span>
                </label>
                <div class="input-wrap">
                  <i class="fa fa-lock input-icon-left"></i>
                  <input
                    v-model="editPassword"
                    :type="editShowPassword ? 'text' : 'password'"
                    class="field-input field-input--icon-l field-input--icon-r"
                    placeholder="กรอกรหัสผ่านใหม่"
                  />
                  <button type="button" class="input-clear-btn" @click="editShowPassword = !editShowPassword">
                    <i :class="editShowPassword ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
                  </button>
                </div>
              </div>

              <!-- ── Error ── -->
              <div v-if="saveProfileError" class="error-msg">
                <i class="fa fa-circle-exclamation"></i>
                {{ saveProfileError }}
              </div>

            </div>

            <!-- Footer -->
            <div class="drawer-footer">
              <button class="btn-cancel" @click="closeEditProfile" :disabled="isSavingProfile">
                ยกเลิก
              </button>
              <button class="btn-save" @click="saveProfileChanges" :disabled="isSavingProfile">
                <i :class="isSavingProfile ? 'fa fa-spinner fa-spin' : 'fa fa-floppy-disk'"></i>
                {{ isSavingProfile ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}
              </button>
            </div>

          </div>
        </div>
      </transition>
    </Teleport>

  </div>
</template>

 <style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&family=Nunito:wght@400;600;700;800&family=Barlow:wght@400;500;600;700;800&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }

@media (min-width: 769px) { html { zoom: 90%; } body { min-height: 111.11vh; } }
@media (min-width: 769px) and (max-width: 1024px) { html { zoom: 80%; } }

:root {
  --accent:       #1976d2;
  --accent-dark:  #0d47a1;
  --accent-glow:  rgba(25,118,210,0.30);
  --accent-glow2: rgba(25,118,210,0.10);
  --tb-bg:        #ffffff;
  --tb-border:    #e8eaed;
  --tb-text:      #374151;
  --tb-sub:       #9ca3af;
  --tb-icon:      #6b7280;
  --tb-hover:     #f3f4f6;
  --tb-h:         54px;
  --sb-bg:        #ffffff;
  --sb-border:    #e8eaed;
  --sb-hover:     #f0f7ff;
  --sb-text:      #4b5563;
  --sb-text-sub:  #9ca3af;
  --sb-width:     235px;
  --sb-search-bg: #f9fafb;
  --content-bg:   #f0f3f8;
  --shadow-sm:    0 1px 3px rgba(0,0,0,0.08);
  --sb-icon:        #1976d2;
  --sb-icon-active: #ffffff;
  --sb-icon-hover:  #1976d2;
}

body.dark, .app-root.dark {
  --tb-bg:        #000000;
  --tb-border:    #1f1f1f;
  --tb-text:      #f5f5f5;
  --tb-sub:       #d1d5db;
  --tb-icon:      #f5f5f5;
  --tb-hover:     #101010;
  --sb-bg:        #000000;
  --sb-border:    #1f1f1f;
  --sb-hover:     #0d0d0d;
  --sb-text:      #f5f5f5;
  --sb-text-sub:  #d1d5db;
  --sb-search-bg: #050505;
  --content-bg:   #000000;
  --shadow-sm:    0 1px 3px rgba(0,0,0,0.5);
  --sb-icon:        #60a5fa;
  --sb-icon-active: #ffffff;
  --sb-icon-hover:  #93c5fd;
}

body { font-family: 'Noto Sans Lao', 'Nunito', 'Barlow', sans-serif; background: var(--content-bg); min-height: 100vh; transition: background 0.3s; }
.app-root { display: flex; flex-direction: column; min-height: 100vh; }

/* ── TOPBAR ── */
.topbar { position: fixed; top: 0; left: 0; right: 0; height: var(--tb-h); background: var(--tb-bg); border-bottom: 1px solid var(--tb-border); display: flex; align-items: center; z-index: 1000; box-shadow: var(--shadow-sm); transition: background 0.3s, border-color 0.3s; }
.topbar-brand { width: var(--sb-width); min-width: var(--sb-width); display: flex; align-items: center; gap: 11px; padding: 0 18px; height: 100%; border-right: 1px solid var(--tb-border); flex-shrink: 0; overflow: hidden; transition: width 0.28s, min-width 0.28s, border-color 0.3s; }
.brand-logo { width: 36px; height: 36px; flex-shrink: 0; object-fit: contain; display: block; }
.brand-text { display: flex; flex-direction: column; line-height: 1.2; }
.brand-name { font-size: 13.5px; font-weight: 800; color: #e53935; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; transition: opacity 0.2s, color 0.3s; }
.brand-sub  { font-size: 10px; font-weight: 600; color: var(--accent); letter-spacing: 0.8px; text-transform: uppercase; white-space: nowrap; transition: opacity 0.2s, color 0.3s; }

.tb-hamburger { display: flex; align-items: center; justify-content: center; width: 50px; height: 100%; background: transparent !important; border: none !important; cursor: pointer; color: var(--tb-icon); font-size: 17px; transition: color 0.2s; flex-shrink: 0; box-shadow: none !important; }
.tb-hamburger:hover { color: var(--accent); background: transparent !important; }
.app-root.dark .tb-hamburger, .app-root.dark .tb-hamburger:hover { background: transparent !important; border: none !important; }

.topbar-right { flex: 1; display: flex; align-items: center; justify-content: flex-end; padding: 0 16px; }
.tb-actions   { display: flex; align-items: center; gap: 10px; }

.tb-dark-toggle { width: 38px; height: 38px; border-radius: 50%; background: transparent !important; border: none !important; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; flex-shrink: 0; box-shadow: none !important; }
.tb-dark-toggle:hover { background: rgba(255,255,255,0.10) !important; }
.tb-dark-toggle:active { transform: scale(0.92); }
.app-root.dark .tb-dark-toggle, .app-root.dark .tb-dark-toggle:hover { background: transparent !important; border-color: transparent !important; }
.app-root.dark .tb-dark-toggle:hover { background: rgba(255,255,255,0.08) !important; }
.app-root.dark .tb-dark-toggle i, .app-root.dark .tb-dark-toggle .dark-toggle-icon { color: #FFD700 !important; font-size: 18px !important; }
.app-root:not(.dark) .tb-dark-toggle i, .app-root:not(.dark) .tb-dark-toggle .dark-toggle-icon { color: #e53935 !important; font-size: 18px !important; }

.tb-datetime { display: flex; align-items: center; gap: 9px; padding: 6px 4px; }
.tb-datetime i { font-size: 13px; color: var(--tb-icon); flex-shrink: 0; }
.tb-datetime-single { font-size: 12.5px; font-weight: 700; color: var(--tb-text); letter-spacing: 0.3px; font-family: 'Barlow', sans-serif; white-space: nowrap; transition: color 0.3s; }

.tb-notif-wrap { position: relative; }
.tb-notif-btn { position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 50%; background: transparent !important; border: none !important; color: var(--tb-icon); font-size: 18px; cursor: pointer; transition: color 0.2s; box-shadow: none !important; }
.tb-notif-btn:hover { color: var(--accent); background: transparent !important; }
.app-root.dark .tb-notif-btn, .app-root.dark .tb-notif-btn:hover { background: transparent !important; border: none !important; }
.notif-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: #fff; font-size: 9px; font-weight: 800; min-width: 17px; height: 17px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 3px; border: 2px solid var(--tb-bg); transition: border-color 0.3s; }

.tb-notif-panel { position: absolute; top: calc(100% + 8px); right: 0; width: 360px; background: var(--tb-bg); border: 1px solid var(--tb-border); border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.14); z-index: 300; overflow: hidden; transition: background 0.3s, border-color 0.3s; }
.notif-header { display: flex; align-items: center; gap: 8px; padding: 14px 16px 12px; border-bottom: 1px solid var(--tb-border); }
.notif-title { font-size: 13px; font-weight: 800; color: var(--tb-text); flex: 1; }
.notif-count-tag { font-size: 10px; font-weight: 700; background: #ef4444; color: #ffffff; padding: 2px 8px; border-radius: 20px; }
.notif-mark-all { font-size: 11px; font-weight: 600; color: var(--accent); background: none; border: none; cursor: pointer; font-family: inherit; padding: 3px 8px; border-radius: 6px; transition: background 0.15s; }
.notif-mark-all:hover { background: var(--sb-hover); }
.notif-list { max-height: 380px; overflow-y: auto; }
.notif-list::-webkit-scrollbar { width: 3px; }
.notif-list::-webkit-scrollbar-thumb { background: var(--sb-border); border-radius: 3px; }
.notif-item { display: flex; align-items: flex-start; gap: 11px; padding: 12px 14px; border-bottom: 1px solid var(--tb-border); cursor: pointer; transition: background 0.15s; }
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: var(--tb-hover); }
.notif-icon-wrap { width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 15px; }
.notif-red    { background: rgba(239,68,68,0.12);  color: #ef4444; }
.notif-blue   { background: rgba(25,118,210,0.12); color: #1976d2; }
.notif-amber  { background: rgba(245,158,11,0.12); color: #d97706; }
.notif-green  { background: rgba(22,163,74,0.12);  color: #16a34a; }
.notif-purple { background: rgba(124,58,237,0.12); color: #7c3aed; }
.notif-body { flex: 1; min-width: 0; }
.notif-item-title { font-size: 12.5px; font-weight: 700; color: var(--tb-text); transition: color 0.3s; line-height: 1.3; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.notif-item-desc  { font-size: 11.5px; color: var(--tb-sub); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notif-records { margin-top: 5px; display: flex; flex-direction: column; gap: 3px; }
.notif-record-row { font-size: 11px; color: var(--tb-sub); line-height: 1.35; display: flex; align-items: flex-start; gap: 5px; white-space: normal; }
.notif-record-row i { font-size: 9px; margin-top: 2px; opacity: 0.8; }
.notif-item-dept  { font-size: 11px; color: var(--tb-sub); margin-top: 3px; display: flex; align-items: center; gap: 4px; opacity: 0.8; }
.notif-item-dept i { font-size: 9px; }
.notif-item-time  { font-size: 10.5px; color: var(--tb-sub); margin-top: 4px; display: flex; align-items: center; gap: 4px; opacity: 0.7; }
.notif-item-time i { font-size: 9px; }
.notif-warn-badge { display: inline-block; padding: 1px 7px; border-radius: 20px; background: rgba(239,68,68,0.12); color: #ef4444; font-size: 10px; font-weight: 800; white-space: nowrap; flex-shrink: 0; }
.notif-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: var(--tb-sub); font-size: 12.5px; }
.notif-empty i { font-size: 28px; opacity: 0.4; }

.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }

.tb-profile-wrap { position: relative; }
.tb-profile-btn { display: flex; align-items: center; gap: 9px; padding: 5px 8px 5px 5px; background: transparent !important; border: none !important; border-radius: 10px; cursor: pointer; transition: all 0.2s; font-family: inherit; box-shadow: none !important; }
.tb-profile-btn:hover { background: rgba(255,255,255,0.08) !important; }
.app-root.dark .tb-profile-btn, .app-root.dark .tb-profile-btn:hover { background: transparent !important; border: none !important; }
.app-root.dark .tb-profile-btn:hover { background: rgba(255,255,255,0.06) !important; }
.tb-avatar { width: 34px; height: 34px; border-radius: 50%; background: transparent !important; border: 1.5px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tb-avatar i { font-size: 15px; color: var(--tb-icon); }
.tb-avatar-lg { width: 40px; height: 40px; }
.tb-avatar-lg i { font-size: 18px; }
.app-root.dark .tb-avatar { background: transparent !important; border-color: rgba(255,255,255,0.20) !important; }
.app-root.dark .tb-avatar i { color: #e5e7eb !important; }
.tb-profile-info { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.25; }
.tb-profile-name { font-size: 12.5px; font-weight: 700; color: var(--tb-text); transition: color 0.3s; }
.tb-profile-role { font-size: 10.5px; font-weight: 600; color: var(--tb-sub); transition: color 0.3s; }
.tb-profile-arrow { font-size: 10px; color: var(--tb-sub); transition: transform 0.25s, color 0.3s; }
.tb-profile-arrow.rotated { transform: rotate(180deg); }

.tb-dropdown { position: absolute; top: calc(100% + 8px); right: 0; width: 220px; background: var(--tb-bg); border: 1px solid var(--tb-border); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 300; overflow: hidden; transition: background 0.3s, border-color 0.3s; }
.tb-dropdown-header { display: flex; align-items: center; gap: 10px; padding: 14px 14px 12px; }
.tb-dd-name  { font-size: 13px; font-weight: 700; color: var(--tb-text); }
.tb-dd-email { font-size: 11px; color: var(--tb-sub); }
.tb-dropdown-divider { height: 1px; background: var(--tb-border); margin: 0 10px; }
.tb-dd-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; background: none; border: none; cursor: pointer; font-size: 12.5px; font-weight: 600; color: var(--sb-text); font-family: inherit; transition: background 0.15s, color 0.15s; text-align: left; }
.tb-dd-item i { font-size: 13px; width: 16px; color: var(--tb-sub); }
.tb-dd-item:hover { background: var(--tb-hover); color: var(--accent); }
.tb-dd-item:hover i { color: var(--accent); }
.tb-dd-logout   { color: #ef4444; }
.tb-dd-logout i { color: #ef4444; }
.tb-dd-logout:hover { background: rgba(239,68,68,0.07); color: #ef4444; }

/* ── LAYOUT ── */
.layout { display: flex; flex: 1; margin-top: var(--tb-h); min-height: calc(100vh - var(--tb-h)); }

/* ── SIDEBAR ── */
.sidebar { width: var(--sb-width); min-width: var(--sb-width); background: var(--sb-bg); border-right: 1px solid var(--sb-border); position: fixed; top: var(--tb-h); bottom: 0; left: 0; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; z-index: 900; transition: width 0.28s ease, min-width 0.28s ease, left 0.3s ease, background 0.3s, border-color 0.3s; box-shadow: 2px 0 12px rgba(0,0,0,0.04); }
.sidebar::-webkit-scrollbar { width: 3px; }
.sidebar::-webkit-scrollbar-thumb { background: var(--sb-border); border-radius: 3px; }
nav { flex: 1; padding: 4px 8px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 7px; cursor: pointer; transition: all 0.15s ease; color: var(--sb-text); font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; margin-bottom: 2px; text-decoration: none; user-select: none; }
.nav-item i { font-size: 15px; width: 20px; min-width: 20px; text-align: center; flex-shrink: 0; color: var(--sb-icon); transition: color 0.15s; }
.nav-item:hover { background: var(--sb-hover); color: var(--accent); }
.nav-item:hover i { color: var(--sb-icon-hover); }
.nav-item.active { background: var(--accent); color: #fff; box-shadow: 0 3px 14px var(--accent-glow); }
.nav-item.active i { color: var(--sb-icon-active) !important; }
.nav-label { flex: 1; }
.nav-parent .nav-arrow { font-size: 10px; color: var(--sb-text-sub); transition: transform 0.25s, color 0.15s; flex-shrink: 0; }
.nav-parent .nav-arrow.rotated { transform: rotate(90deg); }
.nav-parent:hover .nav-arrow { color: var(--accent); }
.nav-parent.has-active { color: var(--accent); }
.nav-parent.has-active > i { color: var(--accent) !important; }
.submenu-wrap { overflow: hidden; }
.nav-child { padding: 8px 12px 8px 42px; font-size: 12.5px; }
.nav-child i { font-size: 13px; }
.submenu-enter-active { transition: max-height 0.25s ease, opacity 0.2s ease; max-height: 300px; }
.submenu-leave-active { transition: max-height 0.2s ease, opacity 0.15s ease; }
.submenu-enter-from, .submenu-leave-to   { max-height: 0; opacity: 0; }
.submenu-enter-to,   .submenu-leave-from { max-height: 300px; opacity: 1; }
.sb-divider { height: 1px; background: var(--sb-border); margin: 8px 12px; transition: background 0.3s; }
.sb-bottom  { padding: 0; flex-shrink: 0; }
.sb-version { text-align: center; font-size: 10px; color: var(--sb-text-sub); padding: 6px 0 10px; letter-spacing: 0.5px; }

.content-wrap { flex: 1; margin-left: var(--sb-width); min-height: calc(100vh - var(--tb-h)); display: flex; flex-direction: column; position: relative; overflow: hidden; transition: margin-left 0.28s ease; background: var(--content-bg); }
.content-container { flex: 1; padding: 24px; min-height: calc(100vh - var(--tb-h)); }
.mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 850; }

/* ── COLLAPSED ── */
.sb-collapsed .sidebar       { width: 58px; min-width: 58px; }
.sb-collapsed .content-wrap  { margin-left: 58px; }
.sb-collapsed .topbar-brand  { width: 58px; min-width: 58px; }
.sb-collapsed .brand-name    { opacity: 0; width: 0; overflow: hidden; }
.sb-collapsed .nav-label, .sb-collapsed .dark-label, .sb-collapsed .sb-version,
.sb-collapsed .switch, .sb-collapsed .nav-arrow, .sb-collapsed .submenu-wrap,
.sb-collapsed .sb-divider { display: none; }
.sb-collapsed .nav-item   { justify-content: center; padding: 10px 0; }
.sb-collapsed .nav-item i { width: auto; font-size: 17px; }
.sb-collapsed .nav-child  { padding: 10px 0; }

@media (max-width: 768px) {
  html { zoom: 1 !important; }
  .topbar-brand { display: none; }
  .tb-hamburger { border-right: none; }
  .sidebar { left: -100%; box-shadow: none; width: var(--sb-width) !important; min-width: var(--sb-width) !important; }
  .sidebar._open { left: 0; box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
  .mobile-overlay { display: block; }
  .content-wrap { margin-left: 0 !important; width: 100%; }
  .tb-datetime { display: none; }
  .tb-notif-panel { width: 300px; right: -60px; }
  .drawer { max-width: 100% !important; }
}

/* ════ DARK MODE ════ */
.app-root.dark .nav-item i     { color: var(--sb-icon) !important; }
.app-root.dark .nav-item:hover i { color: var(--sb-icon-hover) !important; }
.app-root.dark .nav-item.active i { color: var(--sb-icon-active) !important; }
.app-root.dark .nav-parent.has-active > i { color: var(--accent) !important; }
.app-root.dark { background: #000000; color: #f5f5f5; }

.app-root.dark .layout,
.app-root.dark .content-wrap,
.app-root.dark .content-container,
.app-root.dark main { background: #000000; color: #f5f5f5; }

.app-root.dark .notif-red i    { color: #ef4444 !important; }
.app-root.dark .notif-amber i  { color: #d97706 !important; }
.app-root.dark .notif-blue i   { color: #1976d2 !important; }
.app-root.dark .notif-green i  { color: #16a34a !important; }
.app-root.dark .notif-purple i { color: #7c3aed !important; }
.app-root.dark .tb-dd-logout i { color: #ef4444 !important; }
.app-root.dark .tb-dd-item:hover i { color: var(--accent) !important; }

.app-root.dark input[type="text"], 
.app-root.dark input[type="email"],
.app-root.dark input[type="password"], 
.app-root.dark input[type="number"],
.app-root.dark input[type="date"], 
.app-root.dark input[type="time"],
.app-root.dark input[type="search"], 
.app-root.dark textarea, 
.app-root.dark select {
  background: #1a1a1a; color: #ffffff; border-color: #333333;
}

.app-root.dark table { background: #050505; color: #ffffff; }
.app-root.dark thead { background: #000000; color: #ffffff; }
.app-root.dark tbody tr { border-color: #333333; }
.app-root.dark tbody tr:hover { background: #101010; }
.app-root.dark td, .app-root.dark th { color: #ffffff; border-color: #333333; }
.app-root.dark .table-wrap { background: #050505; }

.app-root.dark .card, .app-root.dark .form-group,
.app-root.dark .tb-dropdown, .app-root.dark .tb-notif-panel,
.app-root.dark .drawer, .app-root.dark .emp-dropdown { background: #050505; border-color: #222222; }

.app-root.dark h1, .app-root.dark h2, .app-root.dark h3,
.app-root.dark h4, .app-root.dark h5, .app-root.dark h6, .app-root.dark p { color: #f3f4f6; }
.app-root.dark .modal, .app-root.dark .dialog, .app-root.dark .popup { background: #050505 !important; color: #f3f4f6 !important; }
.app-root.dark [style*="background: white"], .app-root.dark [style*="background: #fff"],
.app-root.dark [style*="background: #ffffff"], .app-root.dark [style*="background:#fff"],
.app-root.dark [style*="background:#ffffff"] { background: #050505 !important; color: #f3f4f6 !important; }
.app-root.dark [style*="background-color: #f"], .app-root.dark [style*="background: rgb(248"],
.app-root.dark [style*="background: rgb(249"], .app-root.dark [style*="background: rgb(250"],
.app-root.dark [style*="background: rgb(255"] { background: #050505 !important; color: #f3f4f6 !important; }
.app-root.dark [style*="color: white"], .app-root.dark [style*="color: #fff"],
.app-root.dark [style*="color: #ffffff"] { color: #f3f4f6 !important; }
.app-root.dark .content-container, .app-root.dark .page-wrapper, .app-root.dark main { background: #000000 !important; color: #f3f4f6 !important; }
.app-root.dark span, .app-root.dark small { color: #e5e7eb !important; }

/* ════ LIGHT MODE ════ */
.app-root:not(.dark) input[type="text"], .app-root:not(.dark) input[type="email"],
.app-root:not(.dark) input[type="password"], .app-root:not(.dark) input[type="number"],
.app-root:not(.dark) input[type="date"], .app-root:not(.dark) input[type="time"],
.app-root:not(.dark) input[type="search"], .app-root:not(.dark) textarea,
.app-root:not(.dark) select { background: #ffffff !important; color: #1f2937 !important; border-color: #d1d5db !important; }
.app-root:not(.dark) input::placeholder, .app-root:not(.dark) textarea::placeholder { color: #9ca3af !important; }
.app-root:not(.dark) table { background: #ffffff !important; color: #1f2937 !important; }
.app-root:not(.dark) thead { background: #f3f4f6 !important; color: #1f2937 !important; }
.app-root:not(.dark) tbody tr { border-color: #e5e7eb !important; }
.app-root:not(.dark) tbody tr:hover { background: #f9fafb !important; }
.app-root:not(.dark) td, .app-root:not(.dark) th { color: #1f2937 !important; border-color: #e5e7eb !important; }
.app-root:not(.dark) h1, .app-root:not(.dark) h2, .app-root:not(.dark) h3,
.app-root:not(.dark) h4, .app-root:not(.dark) h5, .app-root:not(.dark) h6,
.app-root:not(.dark) p { color: #1f2937 !important; }
.app-root:not(.dark) label { color: #374151 !important; }
.app-root:not(.dark) span, .app-root:not(.dark) small { color: #4b5563 !important; }
.app-root:not(.dark) .card, .app-root:not(.dark) .form-group,
.app-root:not(.dark) .content-container { background: #f0f3f8 !important; color: #1f2937 !important; }

/* ════ DRAWER STYLES ════ */
.profile-drawer-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.42);
  display: flex;
  justify-content: flex-end;
  z-index: 9999;
}
.drawer {
  width: 100%; max-width: 420px; height: 100%;
  background: var(--tb-bg);
  border-left: 1px solid var(--tb-border);
  display: flex; flex-direction: column;
}

/* ── Custom Profile Dropdown Styles ── */
.tb-avatar-container {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--accent);
  margin-bottom: 12px;
  flex-shrink: 0;
}
.tb-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.tb-profile-details {
  text-align: center;
  width: 100%;
}
.tb-dd-name {
  font-size: 16px;
  font-weight: 800;
  color: var(--tb-text);
  margin-bottom: 2px;
}
.tb-dd-code {
  font-size: 12px;
  color: var(--tb-sub);
  margin-bottom: 8px;
}
.tb-dd-badge-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 6px;
}
.tb-dd-badge {
  background: rgba(25, 118, 210, 0.1);
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.tb-dd-dept {
  font-size: 11px;
  color: var(--tb-sub);
  font-weight: 600;
}
.tb-dropdown {
  width: 280px !important;
  padding: 0 !important;
}
.tb-dropdown-header {
  flex-direction: column !important;
  align-items: center !important;
  padding: 24px 16px !important;
}
.tb-dd-menu {
  padding: 8px;
}
.tb-dd-item {
  padding: 10px 12px !important;
  border-radius: 8px !important;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 12px !important;
  font-size: 13.5px !important;
}
.tb-dd-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.tb-dd-icon-wrap.blue { background: rgba(25, 118, 210, 0.1); color: var(--accent); }
.tb-dd-icon-wrap.purple { background: rgba(124, 58, 237, 0.1); color: #7c3aed; }
.tb-dd-icon-wrap.purple-light { background: rgba(124, 58, 237, 0.05); color: #7c3aed; }
.tb-dd-icon-wrap.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.tb-dd-arrow {
  font-size: 10px;
  color: var(--tb-sub);
  transition: transform 0.2s;
}
.tb-dd-arrow.rotated { transform: rotate(180deg); }

.tb-dd-sub {
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid var(--tb-border);
  margin-top: -4px;
  margin-bottom: 8px;
}
.tb-dd-sub-item {
  margin-top: 4px;
}

.tb-dd-footer {
  padding: 12px;
  text-align: center;
  font-size: 10px;
  color: var(--tb-sub);
  border-top: 1px solid var(--tb-border);
  background: var(--tb-hover);
}

.flex-1 { flex: 1; }

.drawer {
  width: 100%; max-width: 420px; height: 100%;
  background: var(--tb-bg);
  border-left: 1px solid var(--tb-border);
  display: flex; flex-direction: column;
  box-shadow: -6px 0 32px rgba(0,0,0,0.18);
  transition: background 0.3s, border-color 0.3s;
}

/* Slide animation */
.slide-right-enter-active { transition: transform 0.28s cubic-bezier(.4,0,.2,1), opacity 0.25s ease; }
.slide-right-leave-active { transition: transform 0.22s cubic-bezier(.4,0,.2,1), opacity 0.2s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); opacity: 0; }

.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--tb-border);
  flex-shrink: 0; transition: border-color 0.3s;
}
.drawer-title {
  font-size: 15px; font-weight: 800; color: var(--tb-text);
  display: flex; align-items: center; gap: 9px; transition: color 0.3s;
}
.drawer-title i { color: #1976d2; font-size: 15px; }
.drawer-close {
  width: 32px; height: 32px; border: none;
  background: var(--tb-hover); border-radius: 8px;
  color: var(--tb-sub); cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.drawer-close:hover { color: var(--tb-text); background: var(--sb-border); }

.drawer-body {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 22px 20px;
  display: flex; flex-direction: column; gap: 0;
}
.drawer-body::-webkit-scrollbar { width: 3px; }
.drawer-body::-webkit-scrollbar-thumb { background: var(--sb-border); border-radius: 3px; }

.drawer-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--tb-border);
  display: flex; gap: 10px; justify-content: flex-end;
  flex-shrink: 0; transition: border-color 0.3s;
}

/* ── Field group ── */
.field-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
.field-label { font-size: 12.5px; font-weight: 700; color: var(--tb-text); display: flex; align-items: center; gap: 5px; flex-wrap: wrap; transition: color 0.3s; }
.field-required { color: #dc2626; font-size: 13px; }
.field-hint     { font-size: 11px; font-weight: 500; color: var(--tb-sub); }

/* ── Input ── */
.input-wrap { position: relative; display: flex; align-items: center; }
.field-input {
  width: 100%; padding: 10px 12px;
  border: 1.5px solid var(--tb-border); border-radius: 9px;
  font-size: 13px; font-family: inherit;
  background: var(--sb-search-bg); color: var(--tb-text);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  box-sizing: border-box;
}
.field-input--icon-l { padding-left: 36px; }
.field-input--icon-r { padding-right: 36px; }
.field-input:focus { border-color: #1976d2; box-shadow: 0 0 0 3px rgba(25,118,210,0.10); background: var(--tb-bg); }
.field-input::placeholder { color: var(--tb-sub); opacity: 0.65; }
.input-icon-left  { position: absolute; left: 11px; color: var(--tb-sub); font-size: 13px; pointer-events: none; z-index: 1; }
.input-icon-right { position: absolute; right: 11px; color: var(--tb-sub); font-size: 12px; pointer-events: none; }
.input-clear-btn  { position: absolute; right: 9px; background: none; border: none; cursor: pointer; color: var(--tb-sub); font-size: 12px; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: color 0.15s, background 0.15s; }
.input-clear-btn:hover { color: var(--tb-text); background: var(--tb-hover); }

/* ── Employee Dropdown ── */
.emp-dropdown { position: absolute; top: calc(100% + 5px); left: 0; right: 0; border: 1.5px solid var(--tb-border); border-radius: 10px; background: var(--tb-bg); max-height: 220px; overflow-y: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.13); z-index: 600; }
.emp-dropdown::-webkit-scrollbar { width: 3px; }
.emp-dropdown::-webkit-scrollbar-thumb { background: var(--sb-border); border-radius: 3px; }
.emp-option { width: 100%; text-align: left; padding: 10px 12px; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; font-family: inherit; border-bottom: 1px solid var(--tb-border); transition: background 0.15s; }
.emp-option:last-child { border-bottom: none; }
.emp-option:hover { background: var(--sb-hover); }
.emp-code-badge { font-weight: 700; color: #1976d2; background: rgba(25,118,210,0.09); padding: 2px 8px; border-radius: 5px; font-family: monospace; font-size: 12px; flex-shrink: 0; }
.emp-name { color: var(--tb-text); font-weight: 600; flex: 1; min-width: 0; }
.emp-dept { font-size: 11.5px; color: var(--tb-sub); }
.emp-no-result { padding: 16px 12px; text-align: center; color: var(--tb-sub); font-size: 12.5px; display: flex; align-items: center; justify-content: center; gap: 6px; }

/* ── Selected card ── */
.emp-selected-card { margin-top: 8px; padding: 12px 14px; background: rgba(25,118,210,0.05); border: 1.5px solid rgba(25,118,210,0.18); border-radius: 10px; display: flex; flex-direction: column; gap: 6px; }
.emp-selected-row   { display: flex; align-items: center; gap: 10px; font-size: 12.5px; }
.emp-selected-label { font-weight: 700; color: var(--tb-sub); min-width: 54px; }
.emp-selected-val   { font-weight: 600; color: var(--tb-text); }
.emp-selected-code  { font-family: monospace; color: #1976d2; background: rgba(25,118,210,0.08); padding: 1px 8px; border-radius: 5px; }

/* ── Error ── */
.error-msg { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.22); border-radius: 8px; color: #dc2626; font-size: 12.5px; font-weight: 600; margin-top: 4px; }

/* ── Buttons ── */
.btn-save { display: flex; align-items: center; gap: 7px; padding: 9px 22px; background: #1976d2; color: #fff; border: none; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.2s, transform 0.15s; box-shadow: 0 2px 8px rgba(25,118,210,0.25); }
.btn-save:hover:not(:disabled) { background: #1565c0; transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.btn-cancel { padding: 9px 18px; background: var(--tb-hover); color: var(--tb-sub); border: 1.5px solid var(--tb-border); border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.btn-cancel:hover:not(:disabled) { color: var(--tb-text); background: var(--sb-border); }
.btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Dark mode drawer overrides ── */
.app-root.dark .drawer { background: #111111 !important; border-left-color: #2a2a2a !important; }
.app-root.dark .drawer-header { border-bottom-color: #2a2a2a !important; }
.app-root.dark .drawer-footer { border-top-color: #2a2a2a !important; }
.app-root.dark .drawer-title  { color: #ffffff !important; }
.app-root.dark .drawer-close  { background: #1a1a1a !important; color: #aaaaaa !important; }
.app-root.dark .drawer-close:hover { background: #2a2a2a !important; color: #ffffff !important; }
.app-root.dark .field-input   { background: #000000 !important; border-color: #333333 !important; color: #ffffff !important; }
.app-root.dark .field-input:focus { border-color: #1976d2 !important; background: #0a0a0a !important; }
.app-root.dark .field-input::placeholder { color: #888888 !important; }
.app-root.dark .emp-dropdown  { background: #111111 !important; border-color: #2a2a2a !important; }
.app-root.dark .emp-option    { border-bottom-color: #222222 !important; }
.app-root.dark .emp-option:hover { background: #1a1a1a !important; }
.app-root.dark .emp-selected-card { background: rgba(25,118,210,0.08) !important; border-color: rgba(25,118,210,0.25) !important; }
.app-root.dark .input-clear-btn { color: #888888 !important; }
.app-root.dark .input-clear-btn:hover { color: #ffffff !important; background: #222222 !important; }
.app-root.dark .btn-cancel { background: #1a1a1a !important; color: #aaaaaa !important; border-color: #333333 !important; }
.app-root.dark .btn-cancel:hover:not(:disabled) { background: #2a2a2a !important; color: #ffffff !important; }
.app-root.dark .btn-save { background: #1976d2 !important; }
.app-root.dark .btn-save:hover:not(:disabled) { background: #1565c0 !important; }

</style>
