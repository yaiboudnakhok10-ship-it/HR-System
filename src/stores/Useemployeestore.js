// stores/useEmployeeStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase2 } from '@/services/supabase2'   // ← ดึงจาก DB2

export const useEmployeeStore = defineStore('employees', () => {
  const employees = ref([])
  const loading   = ref(false)
  const error     = ref(null)

  // ดึงพนักงานทั้งหมด
  async function getEmployees() {
    loading.value = true
    const { data, error: err } = await supabase2
      .from('employees')
      .select('id, employee_code, fullname, position, department')

    if (!err) employees.value = data
    else error.value = err.message
    loading.value = false
  }

  // ค้นหาพนักงานด้วย employee_code หรือ fullname
  // ส่งกลับ field เดิมที่ FormcasesPage.vue ใช้:
  //   item.employee_code → emp.code
  //   item.fullname      → emp.name
  //   item.department    → emp.dept  (ใช้ department เป็น "ตำแหน่ง" เหมือนเดิม)
  async function searchByCode(query) {
    if (!query) return []
    loading.value = true
    error.value   = null

    const { data, error: err } = await supabase2
      .from('employees')
      .select('id, employee_code, fullname, position, department')
      .or(`employee_code.ilike.%${query}%,fullname.ilike.%${query}%`)
      .limit(10)

    loading.value = false
    if (err) { error.value = err.message; return [] }

    // map position → department ให้ตรงกับที่ฟอร์มใช้งาน
    // emp.dept ใน FormcasesPage รับ item.department
    // ถ้าอยากแสดง "position" แทน ให้เปลี่ยน department: row.position
    return (data || []).map(row => ({
      id:            row.id,
      employee_code: row.employee_code,
      fullname:      row.fullname,
      department:    row.position || row.department || '',  // แสดงตำแหน่งในช่อง "ตำแหน่ง"
    }))
  }

  // ดึงพนักงาน 1 คน ด้วย employee_code
  async function getByCode(code) {
    if (!code) return null
    const { data, error: err } = await supabase2
      .from('employees')
      .select('id, employee_code, fullname, position, department')
      .eq('employee_code', code)
      .single()

    if (err) return null
    return data
  }

  async function addEmployee(payload) {
    const { error: err } = await supabase2
      .from('employees')
      .insert(payload)

    if (!err) await getEmployees()
    else error.value = err.message
  }

  return {
    employees,
    loading,
    error,
    getEmployees,
    addEmployee,
    searchByCode,
    getByCode,
  }
})