import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useEmployeeStore = defineStore('employee', () => {
  const employees = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchEmployees() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('employee')
      .select(`
        *,
        system_users (
          fullname
        )
      `)
      .order('created_at', { ascending: false })
    
    if (!err) {
      employees.value = data || []
    } else {
      error.value = err.message
    }
    loading.value = false
  }

  async function uploadSignature(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `signatures/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('employees')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('employees')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function addEmployee(payload) {
    const { data, error: err } = await supabase
      .from('employee')
      .insert([payload])
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function updateEmployee(id, payload) {
    const { error: err } = await supabase
      .from('employee')
      .update(payload)
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function deleteEmployee(id, imagePath) {
    // Delete record
    const { error: err } = await supabase
      .from('employee')
      .delete()
      .eq('id', id)
    
    if (err) throw new Error(err.message)

    // Optional: Delete image from storage if exists
    if (imagePath) {
      try {
        const path = imagePath.split('/storage/v1/object/public/employees/')[1]
        if (path) {
          await supabase.storage.from('employees').remove([path])
        }
      } catch (e) {
        console.error('Failed to delete image:', e)
      }
    }
  }

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    uploadSignature,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  }
})
