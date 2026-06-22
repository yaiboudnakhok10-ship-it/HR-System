import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useSupervisorStore = defineStore('supervisor', () => {
  const supervisors = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchSupervisors() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('supervisors')
      .select(`
        *,
        system_users (
          fullname
        )
      `)
      .order('created_at', { ascending: false })
    
    if (!err) {
      supervisors.value = data || []
    } else {
      error.value = err.message
    }
    loading.value = false
  }

  async function uploadSignature(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `supervisor_${Math.random()}.${fileExt}`
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

  async function addSupervisor(payload) {
    const { data, error: err } = await supabase
      .from('supervisors')
      .insert([payload])
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function updateSupervisor(id, payload) {
    const { error: err } = await supabase
      .from('supervisors')
      .update(payload)
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function deleteSupervisor(id, imagePath) {
    // Delete record
    const { error: err } = await supabase
      .from('supervisors')
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
    supervisors,
    loading,
    error,
    fetchSupervisors,
    uploadSignature,
    addSupervisor,
    updateSupervisor,
    deleteSupervisor,
  }
})
