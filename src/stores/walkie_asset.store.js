import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useWalkieAssetStore = defineStore('walkie_asset', () => {
  const requests = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchRequests() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('walkie_asset_requests')
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

  async function uploadFile(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `asset_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}` // ✅ บันทึกลงใน root ของ bucket imgwal

    const { error: uploadError } = await supabase.storage
      .from('imgwal')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('imgwal')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function addRequest(payload) {
    const { data, error: err } = await supabase
      .from('walkie_asset_requests')
      .insert([payload])
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function deleteRequest(id) {
    const { error: err } = await supabase
      .from('walkie_asset_requests')
      .delete()
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function updateRequest(id, payload) {
    // ฟังก์ชันสำหรับอัปเดตข้อมูลการขอเบิกทรัพย์สิน
    const { data, error: err } = await supabase
      .from('walkie_asset_requests')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  return {
    requests,
    loading,
    error,
    fetchRequests,
    uploadFile,
    addRequest,
    updateRequest,
    deleteRequest,
  }
})
