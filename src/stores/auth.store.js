import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import bcrypt from 'bcryptjs'

export const useAuthStore = defineStore('auth', () => {
  const SESSION_KEY = 'clinic_tdl_token'
  const EXPIRE_DAYS = 7 // ✅ กำหนดวันหมดอายุ

  // ── Token Helpers ──────────────────────────────────────
  function createToken(data) {
    const now = Date.now()
    const expireAt = now + EXPIRE_DAYS * 24 * 60 * 60 * 1000 // 7 วัน (ms)
    const payload = { ...data, expireAt }
    return payload
  }

  function parseToken(raw) {
    try {
      const payload = typeof raw === 'string' ? JSON.parse(raw) : raw
      // ✅ เช็คว่าหมดอายุยัง
      if (!payload.expireAt || Date.now() > payload.expireAt) {
        localStorage.removeItem(SESSION_KEY)
        return null
      }
      return payload
    } catch { return null }
  }

  function loadSession() {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return parseToken(raw)
  }

  // ── State ──────────────────────────────────────────────
  const session = ref(loadSession())
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => !!session.value)
  const isUser = computed(() => session.value?.status === 'user')

  // ── Login ──────────────────────────────────────────────
  async function login(username, password) {
    loading.value = true
    error.value = ''
    try {
      const { data, error: err } = await supabase
        .from('system_users')
        .select('*')
        .eq('username', username.trim())
        .single()

      if (err || !data) {
        error.value = 'ไม่พบชื่อผู้ใช้งานนี้'
        return false
      }

      const match = await bcrypt.compare(password, data.password_hash)
      if (!match) {
        error.value = 'รหัสผ่านไม่ถูกต้อง'
        return false
      }

      if (data.status !== 'user') {
        error.value = 'ไม่มีสิทธิ์เข้าใช้งานระบบนี้'
        return false
      }

      // ✅ สร้าง token พร้อมวันหมดอายุ
      const sessionData = {
        userId: data.id,
        username: data.username,
        fullname: data.fullname,
        status: data.status,
      }
      const token = createToken(sessionData)
      session.value = token
      localStorage.setItem(SESSION_KEY, JSON.stringify(token))

      return true
    } catch (e) {
      error.value = 'เกิดข้อผิดพลาด: ' + e.message
      return false
    } finally {
      loading.value = false
    }
  }

  // ── Logout ─────────────────────────────────────────────
  function logout() {
    session.value = null
    localStorage.removeItem(SESSION_KEY)
  }

  // ── Update User Profile ────────────────────────────────
  async function updateUserProfile(userId, updateData) {
    try {
      const dataToUpdate = { ...updateData }
      
      // Hash password if provided
      if (dataToUpdate.password_hash && !dataToUpdate.password_hash.startsWith('$2')) {
        dataToUpdate.password_hash = await bcrypt.hash(dataToUpdate.password_hash, 10)
      }

      const { data, error: err } = await supabase
        .from('system_users')
        .update(dataToUpdate)
        .eq('id', userId)
        .select()
        .single()

      if (err) throw err

      // Update local session
      session.value = { ...session.value, ...updateData }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session.value))

      return { success: true, data }
    } catch (e) {
      error.value = 'เกิดข้อผิดพลาด: ' + e.message
      return { success: false, error: e.message }
    }
  }

  // ── เช็ควันหมดอายุที่เหลือ (optional แสดง UI) ──────────
  const expireInfo = computed(() => {
    if (!session.value?.expireAt) return null
    const remain = session.value.expireAt - Date.now()
    const days = Math.floor(remain / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remain % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return { days, hours }
  })

  return { session, loading, error, isLoggedIn, isUser, login, logout, updateUserProfile, expireInfo }
})