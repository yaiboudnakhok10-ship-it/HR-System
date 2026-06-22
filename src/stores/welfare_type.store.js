import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useWelfareTypeStore = defineStore('welfare_type', () => {
  const types = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchTypes() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('welfare_requests') // ตารางสำหรับหัวข้อสวัสดิการ
      .select(`
        *,
        system_users (
          fullname
        )
      `)
      .order('created_at', { ascending: false })
    
    if (!err) {
      types.value = data || []
    } else {
      error.value = err.message
    }
    loading.value = false
  }

  async function addType(payload) {
    const { data, error: err } = await supabase
      .from('welfare_requests')
      .insert([payload])
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function updateType(id, payload) {
    const { error: err } = await supabase
      .from('welfare_requests')
      .update(payload)
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function deleteType(id) {
    const { error: err } = await supabase
      .from('welfare_requests')
      .delete()
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  return {
    types,
    loading,
    error,
    fetchTypes,
    addType,
    updateType,
    deleteType,
  }
})
