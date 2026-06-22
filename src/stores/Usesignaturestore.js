// stores/useSignatureStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useSignatureStore = defineStore('signatures', () => {
  const signatures = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ดึงข้อมูล signatures ทั้งหมด
  async function getSignatures() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('employee_signatures')
      .select('id, signature_name, signature_image, responsibility')
      .order('id')

    if (!err) signatures.value = data || []
    else error.value = err.message
    loading.value = false
  }

  return { signatures, loading, error, getSignatures }
})