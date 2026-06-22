<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
const auth = useAuthStore() 

const router = useRouter()
const route = useRoute()

const menuItems = [
  { name: 'Dashboard',                path: '/',                icon: 'fa-gauge-high' },
  { name: 'ฟอร์มบันทึกข้อมูลพนักงาน', path: '/Formemp',    icon: 'fa-user-pen' },
  { name: 'รายงานข้อมูลพนักงาน',      path: '/employees', icon: 'fa-chart-bar' },
  { name: 'ผู้ใช้งานระบบ',            path: '/users',           icon: 'fa-users' },
]

// ── Sidebar ────────────────────────────────────────────────
const sidebarCollapsed = ref(false)
const mobileSidebarOpen = ref(false)
const isMobile = ref(window.innerWidth <= 768)

function toggleSidebar() {
  if (isMobile.value) { mobileSidebarOpen.value = !mobileSidebarOpen.value }
  else { sidebarCollapsed.value = !sidebarCollapsed.value }
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

// รูปแบบใหม่: Mar 25, 2026, 06:08:13 PM
const datetimeStr = computed(() => {
  const d = now.value
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const month = months[d.getMonth()]
  const day = d.getDate()
  const year = d.getFullYear()
  let h = d.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  const mm = String(d.getMinutes()).padStart(2,'0')
  const ss = String(d.getSeconds()).padStart(2,'0')
  return `${month} ${day}, ${year}, ${String(h).padStart(2,'0')}:${mm}:${ss} ${ampm}`
})

// ── Notifications ──────────────────────────────────────────
const notifOpen = ref(false)
const notifications = ref([
  { id: 1, icon: 'fa-file-circle-exclamation', color: 'notif-red',    title: 'ใบเตือนใหม่รอการอนุมัติ',    desc: 'พนักงาน สมชาย ใจดี — ใบเตือนครั้งที่ 1', time: '5 นาทีที่แล้ว',   read: false },
  { id: 2, icon: 'fa-user-tie',                color: 'notif-blue',   title: 'เจ้าหน้าที่ใหม่ถูกเพิ่ม',     desc: 'นางสาว มาลี สวยงาม เข้าสู่ระบบแล้ว',     time: '20 นาทีที่แล้ว', read: false },
  { id: 3, icon: 'fa-scale-balanced',          color: 'notif-amber',  title: 'บทลงโทษถูกแก้ไข',             desc: 'หมวด ละเมิดกฎระเบียบ — อัปเดตแล้ว',       time: '1 ชม.ที่แล้ว',   read: false },
  { id: 4, icon: 'fa-clock-rotate-left',       color: 'notif-green',  title: 'ประวัติใบเตือนถูกส่งออก',     desc: 'ไฟล์ Excel ถูกสร้างเรียบร้อยแล้ว',         time: '2 ชม.ที่แล้ว',   read: true  },
  { id: 5, icon: 'fa-list-check',              color: 'notif-purple', title: 'หัวข้อใบเตือนใหม่ถูกเพิ่ม', desc: 'หัวข้อ "ประพฤติตนไม่เหมาะสม" ถูกเพิ่ม',  time: 'เมื่อวาน',        read: true  },
])
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function toggleNotif() { notifOpen.value = !notifOpen.value; profileOpen.value = false }
function closeNotif()  { notifOpen.value = false }
function markAllRead() { notifications.value.forEach(n => n.read = true) }
function markRead(id)  { const n = notifications.value.find(n => n.id === id); if (n) n.read = true }
function removeNotif(id) { notifications.value = notifications.value.filter(n => n.id !== id) }

// ── Profile dropdown ───────────────────────────────────────
const profileOpen = ref(false)
function toggleProfile() { profileOpen.value = !profileOpen.value; notifOpen.value = false }
function closeProfile()  { profileOpen.value = false }

// ── Logout ─────────────────────────────────────────────────
function handleLogout() {
  profileOpen.value = false
  if (confirm('ต้องการออกจากระบบ?')) {
    auth.logout()
  }
}

// ── Navigate ───────────────────────────────────────────────
function navigate(path) {
  router.push(path)
  if (isMobile.value) closeMobileSidebar()
}

// ── Resize ────────────────────────────────────────────────
function onResize() {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) mobileSidebarOpen.value = false
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  clockTimer = setInterval(() => { now.value = new Date() }, 1000)
  try {
    if (localStorage.getItem('erhr_darkmode') === '1') applyDark(true)
  } catch { void 0 }
  menuItems.forEach(m => {
    if (m.children && m.children.some(c => route.path === c.path)) {
      openSubmenus.value[m.name] = true
    }
  })
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  clearInterval(clockTimer)
})

// ── v-click-outside ────────────────────────────────────────
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value() }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el._clickOutside)
  }
}
</script>

<template>
  <div :class="['app-root', { dark: isDark, 'sb-collapsed': sidebarCollapsed && !isMobile }]">

    <!-- ════ TOPBAR ════ -->
    <header class="topbar">
      <div class="topbar-brand">
        <div class="brand-icon">TD</div>
        <span class="brand-name">ThaiDrill Lao</span>
      </div>

      <!-- ปุ่ม Chevron แทน hamburger -->
      <button class="tb-hamburger" @click="toggleSidebar" aria-label="Toggle sidebar">
  <i class="fa fa-bars"></i>
</button>

      <div class="topbar-right">
        <div class="tb-actions">

          <!-- Dark Mode Toggle -->
          <button class="tb-dark-toggle" @click="toggleDark" :title="isDark ? 'Light Mode' : 'Dark Mode'" aria-label="Toggle dark mode">
            <i :class="isDark ? 'fa fa-moon' : 'fa fa-sun'" :style="{ color: isDark ? '#FFD700' : '#ffffff' }"></i>
          </button>

          <!-- DateTime รูปแบบใหม่ -->
          <div class="tb-datetime">
            <i class="fa fa-calendar"></i>
            <span class="tb-datetime-single">{{ datetimeStr }}</span>
          </div>

          <!-- Notification Bell -->
          <div class="tb-notif-wrap" v-click-outside="closeNotif">
            <button class="tb-notif-btn" @click="toggleNotif" aria-label="Notifications">
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
                  <div
                    v-for="n in notifications" :key="n.id"
                    class="notif-item" :class="{ unread: !n.read }"
                    @click="markRead(n.id)"
                  >
                    <div :class="['notif-icon-wrap', n.color]">
                      <i :class="['fa', n.icon]"></i>
                    </div>
                    <div class="notif-body">
                      <div class="notif-item-title">{{ n.title }}</div>
                      <div class="notif-item-desc">{{ n.desc }}</div>
                      <div class="notif-item-time"><i class="fa fa-clock"></i> {{ n.time }}</div>
                    </div>
                    <button class="notif-remove" @click.stop="removeNotif(n.id)" title="ลบ">
                      <i class="fa fa-xmark"></i>
                    </button>
                  </div>
                  <div v-if="notifications.length === 0" class="notif-empty">
                    <i class="fa fa-bell-slash"></i>
                    <span>ไม่มีการแจ้งเตือน</span>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <!-- Profile dropdown -->
          <div class="tb-profile-wrap" v-click-outside="closeProfile">
            <button class="tb-profile-btn" @click="toggleProfile" aria-label="Profile">
              <div class="tb-avatar"><i class="fa fa-user"></i></div>
              <div class="tb-profile-info">
              <span class="tb-profile-name">{{ auth.session?.fullname || 'Admin User' }}</span>
                <span class="tb-profile-role">ผู้ดูแลระบบ</span>
              </div>
              <i class="fa fa-chevron-down tb-profile-arrow" :class="{ rotated: profileOpen }"></i>
            </button>

            <transition name="dropdown">
              <div class="tb-dropdown" v-if="profileOpen">
                <div class="tb-dropdown-header">
                  <div class="tb-avatar tb-avatar-lg"><i class="fa fa-user"></i></div>
                  <div>
                     <div class="tb-dd-name">{{ auth.session?.fullname || 'Admin User' }}</div>
                    <div class="tb-dd-email">{{ auth.session?.employee_code || '' }}</div>
                  </div>
                </div>
                <div class="tb-dropdown-divider"></div>
                <button class="tb-dd-item" @click="profileOpen = false">
                  <i class="fa fa-user-circle"></i><span>โปรไฟล์</span>
                </button>
                <button class="tb-dd-item" @click="profileOpen = false">
                  <i class="fa fa-gear"></i><span>ตั้งค่า</span>
                </button>
                <div class="tb-dropdown-divider"></div>
                <button class="tb-dd-item tb-dd-logout" @click="handleLogout">
                  <i class="fa fa-right-from-bracket"></i><span>ออกจากระบบ</span>
                </button>
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
              <a
                class="nav-item nav-parent"
                :class="{ 'has-active': isChildActive(item) }"
                href="#"
                @click.prevent="toggleSubmenu(item.name)"
              >
                <i :class="['fa', item.icon]"></i>
                <span class="nav-label">{{ item.name }}</span>
                <i class="fa fa-chevron-right nav-arrow" :class="{ rotated: isSubmenuOpen(item.name) }"></i>
              </a>
              <transition name="submenu">
                <div class="submenu-wrap" v-if="isSubmenuOpen(item.name)">
                  <a
                    v-for="child in item.children" :key="child.path"
                    class="nav-item nav-child"
                    :class="{ active: route.path === child.path }"
                    href="#"
                    @click.prevent="navigate(child.path)"
                  >
                    <i :class="['fa', child.icon]"></i>
                    <span class="nav-label">{{ child.name }}</span>
                  </a>
                </div>
              </transition>
            </template>

            <a
              v-else
              class="nav-item"
              :class="{ active: route.path === item.path }"
              href="#"
              @click.prevent="navigate(item.path)"
            >
              <i :class="['fa', item.icon]"></i>
              <span class="nav-label">{{ item.name }}</span>
            </a>

          </template>
        </nav>

        <div class="sb-divider"></div>

        <div class="sb-bottom">
          <div class="sb-footer-card">
            <div class="dark-row" @click="toggleDark">
              <i :class="['fa', isDark ? 'fa-sun' : 'fa-moon']"></i>
              <span class="dark-label">{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
              <label class="switch" @click.stop>
                <input type="checkbox" :checked="isDark" @change="applyDark($event.target.checked)" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
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
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Thai:wght@400;700&family=Nunito:wght@400;600;700;800&family=Barlow:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }

@media (min-width: 769px)  { html { zoom: 75%; } body { min-height: 133.33vh; } }
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
}

body.dark, .app-root.dark {
  --tb-bg:        #1a1a1a;
  --tb-border:    #333333;
  --tb-text:      #ffffff;
  --tb-sub:       #cccccc;
  --tb-icon:      #ffffff;
  --tb-hover:     #2a2a2a;
  --sb-bg:        #000000;
  --sb-border:    #333333;
  --sb-hover:     #1a1a1a;
  --sb-text:      #ffffff;
  --sb-text-sub:  #cccccc;
  --sb-search-bg: #1a1a1a;
  --content-bg:   #0a0a0a;
  --shadow-sm:    0 1px 3px rgba(0,0,0,0.5);
}

body { font-family: 'Noto Sans Lao', 'Nunito', 'Barlow', sans-serif; background: var(--content-bg); min-height: 100vh; transition: background 0.3s; }
.app-root { display: flex; flex-direction: column; min-height: 100vh; }

/* TOPBAR */
.topbar {
  position: fixed; top: 0; left: 0; right: 0; height: var(--tb-h);
  background: var(--tb-bg); border-bottom: 1px solid var(--tb-border);
  display: flex; align-items: center;
  z-index: 200; box-shadow: var(--shadow-sm);
  transition: background 0.3s, border-color 0.3s;
}
.topbar-brand {
  width: var(--sb-width); min-width: var(--sb-width);
  display: flex; align-items: center; gap: 11px;
  padding: 0 18px; height: 100%;
  border-right: 1px solid var(--tb-border);
  flex-shrink: 0; overflow: hidden;
  transition: width 0.28s, min-width 0.28s, border-color 0.3s;
}
.brand-icon {
  width: 30px; height: 30px; flex-shrink: 0;
  background: var(--accent); border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 11px; color: #fff;
  box-shadow: 0 2px 10px var(--accent-glow);
}
.brand-name {
  font-size: 13.5px; font-weight: 800; color: var(--tb-text);
  text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;
  transition: opacity 0.2s, color 0.3s;
}
.tb-hamburger {
  display: flex; align-items: center; justify-content: center;
  width: 50px; height: 100%; background: none; border: none; cursor: pointer;
  color: #ffffff; font-size: 17px;
  transition: color 0.2s; flex-shrink: 0;
}
.tb-hamburger:hover { color: #ffffff; background: none; }
.topbar-right { flex: 1; display: flex; align-items: center; justify-content: flex-end; padding: 0 16px; }
.tb-actions { display: flex; align-items: center; gap: 10px; }

/* Dark Mode Toggle */
.tb-dark-toggle {
  width: 36px; height: 36px; border-radius: 8px; background: transparent; border: none;
  color: #ffffff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; font-size: 14px; flex-shrink: 0; text-shadow: 0 0 0 1px #9ca3af;
}
.tb-dark-toggle:hover { background: var(--tb-hover); color: #ffffff; text-shadow: 0 0 0 1px #9ca3af; }
.tb-dark-toggle:active { transform: scale(0.95); }

/* DateTime — รูปแบบใหม่ single line */
.tb-datetime {
  display: flex; align-items: center; gap: 9px; padding: 6px 4px;
  transition: background 0.3s, border-color 0.3s;
}
.tb-datetime i { font-size: 14px; color: #ffffff; flex-shrink: 0; }
.tb-datetime-single {
  font-size: 13px; font-weight: 700; color: var(--tb-text);
  letter-spacing: 0.3px; font-family: 'Barlow', sans-serif;
  transition: color 0.3s; white-space: nowrap;
}

/* Notification Bell */
.tb-notif-wrap { position: relative; }
.tb-notif-btn {
  position: relative; display: flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--tb-hover); border: 1px solid var(--tb-border);
  color: #ffffff; font-size: 16px; cursor: pointer; transition: all 0.2s; text-shadow: 0 0 0 1px #9ca3af;
}
.tb-notif-btn:hover { border-color: var(--tb-border); color: #ffffff; background: var(--sb-hover); text-shadow: 0 0 0 1px #9ca3af; }
.notif-badge {
  position: absolute; top: -5px; right: -5px;
  background: #ef4444; color: #fff;
  font-size: 9px; font-weight: 800;
  min-width: 17px; height: 17px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px; border: 2px solid var(--tb-bg); transition: border-color 0.3s;
}

.tb-notif-panel {
  position: absolute; top: calc(100% + 8px); right: 0;
  width: 340px; background: var(--tb-bg);
  border: 1px solid var(--tb-border); border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  z-index: 300; overflow: hidden;
  transition: background 0.3s, border-color 0.3s;
}
.notif-header {
  display: flex; align-items: center; gap: 8px; padding: 14px 16px 12px;
  border-bottom: 1px solid var(--tb-border);
}
.notif-title { font-size: 13px; font-weight: 800; color: var(--tb-text); flex: 1; transition: color 0.3s; }
.notif-count-tag {
  font-size: 10px; font-weight: 700;
  background: rgba(255,255,255,0.12); color: #ffffff;
  padding: 2px 8px; border-radius: 20px;
}
.notif-mark-all {
  font-size: 11px; font-weight: 600; color: #ffffff;
  background: none; border: none; cursor: pointer;
  font-family: inherit; padding: 3px 8px; border-radius: 6px; transition: background 0.15s;
}
.notif-mark-all:hover { background: var(--sb-hover); }

.notif-list { max-height: 340px; overflow-y: auto; }
.notif-list::-webkit-scrollbar { width: 3px; }
.notif-list::-webkit-scrollbar-thumb { background: var(--sb-border); border-radius: 3px; }

.notif-item {
  display: flex; align-items: flex-start; gap: 11px;
  padding: 12px 14px; border-bottom: 1px solid var(--tb-border);
  cursor: pointer; transition: background 0.15s; position: relative;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: var(--tb-hover); }
.notif-item.unread { background: rgba(25,118,210,0.04); }
.notif-item.unread::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; background: var(--accent); border-radius: 0 2px 2px 0;
}
.notif-icon-wrap {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.notif-red    { background: rgba(239,68,68,0.12);  color: #ef4444; }
.notif-blue   { background: rgba(25,118,210,0.12); color: #1976d2; }
.notif-amber  { background: rgba(245,158,11,0.12); color: #d97706; }
.notif-green  { background: rgba(22,163,74,0.12);  color: #16a34a; }
.notif-purple { background: rgba(124,58,237,0.12); color: #7c3aed; }

.notif-body { flex: 1; min-width: 0; }
.notif-item-title { font-size: 12.5px; font-weight: 700; color: var(--tb-text); transition: color 0.3s; line-height: 1.3; }
.notif-item-desc  { font-size: 11.5px; color: var(--tb-sub); margin-top: 2px; transition: color 0.3s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notif-item-time  { font-size: 10.5px; color: var(--tb-sub); margin-top: 4px; display: flex; align-items: center; gap: 4px; opacity: 0.7; }
.notif-item-time i { font-size: 9px; }
.notif-remove {
  background: none; border: none; cursor: pointer;
  color: var(--tb-sub); font-size: 12px; padding: 3px 5px;
  border-radius: 5px; opacity: 0; transition: opacity 0.15s, background 0.15s; flex-shrink: 0;
}
.notif-item:hover .notif-remove { opacity: 1; }
.notif-remove:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
.notif-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 32px 16px; color: var(--tb-sub); font-size: 12.5px;
}
.notif-empty i { font-size: 28px; opacity: 0.4; }

/* Profile */
.tb-profile-wrap { position: relative; }
.tb-profile-btn {
  display: flex; align-items: center; gap: 9px;
  padding: 5px 10px 5px 5px;
  background: var(--tb-hover); border: 1px solid var(--tb-border);
  border-radius: 10px; cursor: pointer; transition: all 0.2s; font-family: inherit;
}
.tb-profile-btn:hover { border-color: var(--accent); background: var(--sb-hover); }
.tb-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; box-shadow: 0 2px 8px var(--accent-glow);
}
.tb-avatar i { font-size: 14px; color: #fff; }
.tb-avatar-lg { width: 40px; height: 40px; }
.tb-avatar-lg i { font-size: 18px; }
.tb-profile-info { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.25; }
.tb-profile-name { font-size: 12px; font-weight: 700; color: var(--tb-text); transition: color 0.3s; }
.tb-profile-role { font-size: 10px; color: var(--tb-sub); transition: color 0.3s; }
.tb-profile-arrow { font-size: 10px; color: var(--tb-sub); transition: transform 0.25s, color 0.3s; }
.tb-profile-arrow.rotated { transform: rotate(180deg); }

.tb-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0; width: 220px;
  background: var(--tb-bg); border: 1px solid var(--tb-border);
  border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  z-index: 300; overflow: hidden; transition: background 0.3s, border-color 0.3s;
}
.tb-dropdown-header { display: flex; align-items: center; gap: 10px; padding: 14px 14px 12px; }
.tb-dd-name { font-size: 13px; font-weight: 700; color: var(--tb-text); transition: color 0.3s; }
.tb-dd-email { font-size: 11px; color: var(--tb-sub); transition: color 0.3s; }
.tb-dropdown-divider { height: 1px; background: var(--tb-border); margin: 0 10px; }
.tb-dd-item {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px;
  background: none; border: none; cursor: pointer; font-size: 12.5px; font-weight: 600;
  color: var(--sb-text); font-family: inherit; transition: background 0.15s, color 0.15s; text-align: left;
}
.tb-dd-item i { font-size: 13px; width: 16px; color: var(--tb-sub); }
.tb-dd-item:hover { background: var(--tb-hover); color: var(--accent); }
.tb-dd-item:hover i { color: var(--accent); }
.tb-dd-logout { color: #ef4444; }
.tb-dd-logout i { color: #ef4444; }
.tb-dd-logout:hover { background: rgba(239,68,68,0.07); color: #ef4444; }

.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }

/* LAYOUT */
.layout { display: flex; flex: 1; margin-top: var(--tb-h); min-height: calc(100vh - var(--tb-h)); }

/* SIDEBAR */
.sidebar {
  width: var(--sb-width); min-width: var(--sb-width);
  background: var(--sb-bg); border-right: 1px solid var(--sb-border);
  position: fixed; top: var(--tb-h); bottom: 0; left: 0;
  display: flex; flex-direction: column;
  overflow-y: auto; overflow-x: hidden; z-index: 150;
  transition: width 0.28s ease, min-width 0.28s ease, left 0.3s ease, background 0.3s, border-color 0.3s;
  box-shadow: 2px 0 12px rgba(0,0,0,0.04);
}
.sidebar::-webkit-scrollbar { width: 3px; }
.sidebar::-webkit-scrollbar-thumb { background: var(--sb-border); border-radius: 3px; }

nav { flex: 1; padding: 4px 8px; }

.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 7px; cursor: pointer;
  transition: all 0.15s ease; color: var(--sb-text); font-size: 13px; font-weight: 600;
  white-space: nowrap; overflow: hidden; margin-bottom: 2px;
  text-decoration: none; user-select: none;
}
.nav-item i { font-size: 14px; width: 18px; min-width: 18px; text-align: center; flex-shrink: 0; color: var(--sb-text); transition: color 0.15s; }
.nav-item:hover { background: var(--sb-hover); color: var(--accent); }
.nav-item:hover i { color: var(--accent); }
.nav-item.active { background: var(--accent); color: #fff; box-shadow: 0 3px 14px var(--accent-glow); }
.nav-item.active i { color: #fff; }
.nav-label { flex: 1; }

.nav-parent .nav-arrow { font-size: 10px; color: var(--sb-text-sub); transition: transform 0.25s, color 0.15s; flex-shrink: 0; }
.nav-parent .nav-arrow.rotated { transform: rotate(90deg); }
.nav-parent:hover .nav-arrow { color: var(--accent); }
.nav-parent.has-active { color: var(--accent); }
.nav-parent.has-active i { color: var(--accent); }

.submenu-wrap { overflow: hidden; }
.nav-child { padding: 8px 12px 8px 42px; font-size: 12.5px; }
.nav-child i { font-size: 12px; }

.submenu-enter-active { transition: max-height 0.25s ease, opacity 0.2s ease; max-height: 300px; }
.submenu-leave-active { transition: max-height 0.2s ease, opacity 0.15s ease; }
.submenu-enter-from, .submenu-leave-to { max-height: 0; opacity: 0; }
.submenu-enter-to, .submenu-leave-from { max-height: 300px; opacity: 1; }

.sb-divider { height: 1px; background: var(--sb-border); margin: 8px 12px; transition: background 0.3s; }
.sb-bottom { padding: 0; flex-shrink: 0; }
.sb-footer-card { margin: 0 10px 12px; border: 1px solid var(--sb-border); border-radius: 12px; overflow: hidden; transition: border-color 0.3s; background: var(--sb-search-bg); }
.dark-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; transition: background 0.15s; }
.dark-row:hover { background: var(--sb-hover); }
.dark-row i { font-size: 13px; width: 18px; min-width: 18px; text-align: center; color: var(--sb-text-sub); }
.dark-label { font-size: 12.5px; font-weight: 600; color: var(--sb-text); flex: 1; transition: color 0.3s; }

.switch { position: relative; display: inline-block; width: 36px; height: 19px; flex-shrink: 0; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background: #d1d5db; border-radius: 20px; transition: 0.3s; }
.slider:before { content:''; position:absolute; height:13px; width:13px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:0.3s; box-shadow:0 1px 4px rgba(0,0,0,0.25); }
input:checked + .slider { background: var(--accent); }
input:checked + .slider:before { transform: translateX(17px); }

.sb-version { text-align: center; font-size: 10px; color: var(--sb-text-sub); padding: 6px 0 10px; letter-spacing: 0.5px; transition: color 0.3s; }

/* CONTENT */
.content-wrap { flex: 1; margin-left: var(--sb-width); min-height: calc(100vh - var(--tb-h)); display: flex; flex-direction: column; position: relative; overflow: hidden; transition: margin-left 0.28s ease; background: var(--content-bg); }
.content-container { flex: 1; padding: 24px; min-height: calc(100vh - var(--tb-h)); }
.mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 140; }

/* COLLAPSED */
.sb-collapsed .sidebar        { width: 58px; min-width: 58px; }
.sb-collapsed .content-wrap   { margin-left: 58px; }
.sb-collapsed .topbar-brand   { width: 58px; min-width: 58px; }
.sb-collapsed .brand-name     { opacity: 0; width: 0; overflow: hidden; }
.sb-collapsed .nav-label,
.sb-collapsed .dark-label,
.sb-collapsed .sb-version,
.sb-collapsed .sb-search,
.sb-collapsed .switch,
.sb-collapsed .nav-arrow,
.sb-collapsed .submenu-wrap   { display: none; }
.sb-collapsed .sb-divider     { display: none; }
.sb-collapsed .sb-footer-card { margin: 0 4px 8px; border-radius: 8px; }
.sb-collapsed .nav-item       { justify-content: center; padding: 10px 0; }
.sb-collapsed .nav-item i     { width: auto; }
.sb-collapsed .nav-child      { padding: 10px 0; }
.sb-collapsed .dark-row       { justify-content: center; padding: 10px 0; }
.sb-collapsed .dark-row i     { width: auto; }

/* GLOBAL DARK MODE FOR FORMS AND TABLES */
.app-root.dark {
  background: #0a0a0a !important;
  color: #ffffff !important;
}

.app-root.dark body,
.app-root.dark * {
  background-color: inherit !important;
  color: inherit !important;
}

.app-root.dark input[type="text"],
.app-root.dark input[type="email"],
.app-root.dark input[type="password"],
.app-root.dark input[type="number"],
.app-root.dark input[type="date"],
.app-root.dark input[type="time"],
.app-root.dark input[type="search"],
.app-root.dark textarea,
.app-root.dark select {
  background: #1a1a1a !important;
  color: #ffffff !important;
  border-color: #333333 !important;
}

.app-root.dark input[type="text"]::placeholder,
.app-root.dark input[type="email"]::placeholder,
.app-root.dark input[type="password"]::placeholder,
.app-root.dark input[type="number"]::placeholder,
.app-root.dark input[type="date"]::placeholder,
.app-root.dark input[type="time"]::placeholder,
.app-root.dark input[type="search"]::placeholder,
.app-root.dark textarea::placeholder {
  color: #9ca3af !important;
}

.app-root.dark table {
  background: #0a0a0a !important;
  color: #ffffff !important;
}

.app-root.dark thead {
  background: #000000 !important;
  color: #ffffff !important;
}

.app-root.dark tbody tr {
  border-color: #333333 !important;
}

.app-root.dark tbody tr:hover {
  background: #1a1a1a !important;
}

.app-root.dark td,
.app-root.dark th {
  color: #ffffff !important;
  border-color: #333333 !important;
}

.app-root.dark .table-wrap {
  background: #2d3748 !important;
}

.app-root.dark button,
.app-root.dark .btn {
  background: #3b82f6 !important;
  color: #fff !important;
  border-color: #3b82f6 !important;
}

.app-root.dark button:hover,
.app-root.dark .btn:hover {
  background: #2563eb !important;
  border-color: #2563eb !important;
}

.app-root.dark button:disabled,
.app-root.dark .btn:disabled {
  background: #4b5563 !important;
}

.app-root.dark label {
  color: #d1d5db !important;
}

.app-root.dark .card,
.app-root.dark .form-group {
  background: #2d3748 !important;
  border-color: #374151 !important;
}

.app-root.dark h1,
.app-root.dark h2,
.app-root.dark h3,
.app-root.dark h4,
.app-root.dark h5,
.app-root.dark h6,
.app-root.dark p {
  color: #e5e7eb !important;
}

.app-root.dark .modal,
.app-root.dark .dialog,
.app-root.dark .popup {
  background: #1f2937 !important;
  color: #e5e7eb !important;
}

/* Override white backgrounds to dark */
.app-root.dark [style*="background: white"],
.app-root.dark [style*="background: #fff"],
.app-root.dark [style*="background: #ffffff"],
.app-root.dark [style*="background:#fff"],
.app-root.dark [style*="background:#ffffff"] {
  background: #2d3748 !important;
  color: #e5e7eb !important;
}

/* Override light backgrounds */
.app-root.dark [style*="background-color: #f"],
.app-root.dark [style*="background: rgb(248"],
.app-root.dark [style*="background: rgb(249"],
.app-root.dark [style*="background: rgb(250"],
.app-root.dark [style*="background: rgb(255"] {
  background: #2d3748 !important;
  color: #e5e7eb !important;
}

/* Change any white text to light text */
.app-root.dark [style*="color: white"],
.app-root.dark [style*="color: #fff"],
.app-root.dark [style*="color: #ffffff"] {
  color: #e5e7eb !important;
}

/* Dark backgrounds for common containers */
.app-root.dark .content-container,
.app-root.dark .page-wrapper,
.app-root.dark main {
  background: #0f172a !important;
  color: #e5e7eb !important;
}

/* Border colors in dark mode */
.app-root.dark [style*="border"],
.app-root.dark border {
  border-color: #374151 !important;
}

/* Span and small text */
.app-root.dark span,
.app-root.dark small {
  color: #d1d5db !important;
}

/* ════ LIGHT MODE STYLES ════ */
/* Ensure light mode has clear contrast and visibility */

/* Light mode text and backgrounds */
.app-root:not(.dark) input[type="text"],
.app-root:not(.dark) input[type="email"],
.app-root:not(.dark) input[type="password"],
.app-root:not(.dark) input[type="number"],
.app-root:not(.dark) input[type="date"],
.app-root:not(.dark) input[type="time"],
.app-root:not(.dark) input[type="search"],
.app-root:not(.dark) textarea,
.app-root:not(.dark) select {
  background: #ffffff !important;
  color: #1f2937 !important;
  border-color: #d1d5db !important;
}

.app-root:not(.dark) input[type="text"]::placeholder,
.app-root:not(.dark) input[type="email"]::placeholder,
.app-root:not(.dark) input[type="password"]::placeholder,
.app-root:not(.dark) input[type="number"]::placeholder,
.app-root:not(.dark) input[type="date"]::placeholder,
.app-root:not(.dark) input[type="time"]::placeholder,
.app-root:not(.dark) input[type="search"]::placeholder,
.app-root:not(.dark) textarea::placeholder {
  color: #9ca3af !important;
}

.app-root:not(.dark) table {
  background: #ffffff !important;
  color: #1f2937 !important;
}

.app-root:not(.dark) thead {
  background: #f3f4f6 !important;
  color: #1f2937 !important;
}

.app-root:not(.dark) tbody tr {
  border-color: #e5e7eb !important;
}

.app-root:not(.dark) tbody tr:hover {
  background: #f9fafb !important;
}

.app-root:not(.dark) td,
.app-root:not(.dark) th {
  color: #1f2937 !important;
  border-color: #e5e7eb !important;
}

.app-root:not(.dark) h1,
.app-root:not(.dark) h2,
.app-root:not(.dark) h3,
.app-root:not(.dark) h4,
.app-root:not(.dark) h5,
.app-root:not(.dark) h6,
.app-root:not(.dark) p {
  color: #1f2937 !important;
}

.app-root:not(.dark) label {
  color: #374151 !important;
}

.app-root:not(.dark) span,
.app-root:not(.dark) small {
  color: #4b5563 !important;
}

.app-root:not(.dark) .card,
.app-root:not(.dark) .form-group,
.app-root:not(.dark) .content-container {
  background: #f0f3f8 !important;
  color: #1f2937 !important;
}

/* MOBILE */
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
}
</style>
