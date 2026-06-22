import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useEmployeeStore = defineStore('employees', () => {
  const employees = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function getEmployees() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('employees')
      .select('*')

    if (!err) employees.value = data
    else error.value = err.message
    loading.value = false
  }

  async function addEmployee(payload) {
    const { error: err } = await supabase
      .from('employees')
      .insert(payload)

    if (!err) await getEmployees()
    else error.value = err.message
  }

  // ต้อง return addEmployee ออกมาด้วย ✅
  return { employees, loading, error, getEmployees, addEmployee }
})