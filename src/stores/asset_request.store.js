import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useAssetRequestStore = defineStore('asset_request', () => {
  const requests = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchRequests() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('asset_requests')
      .select(`
        *,
        system_users (
          fullname
        )
      `)
      .order('created_at', { ascending: false })
    
    if (!err) {
      requests.value = data || []
    } else {
      error.value = err.message
    }
    loading.value = false
  }

  async function addRequest(payload) {
    const { data, error: err } = await supabase
      .from('asset_requests')
      .insert([payload])
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function updateRequest(id, payload) {
    const { error: err } = await supabase
      .from('asset_requests')
      .update(payload)
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function deleteRequest(id) {
    const { error: err } = await supabase
      .from('asset_requests')
      .delete()
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  return {
    requests,
    loading,
    error,
    fetchRequests,
    addRequest,
    updateRequest,
    deleteRequest,
  }
})
