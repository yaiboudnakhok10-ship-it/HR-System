import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useVerbalWarningListStore = defineStore('verbalWarningList', () => {
  const cases = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('verbal_warning_cases')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      cases.value = data || []
      return data
    } catch (err) {
      error.value = err.message
      cases.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  async function deleteCase(id) {
    const { error: deleteError } = await supabase
      .from('verbal_warning_cases')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError
    cases.value = cases.value.filter(c => c.id !== id)
  }

  // ✅ updateCase — แก้ไขข้อมูลใน Supabase แล้ว sync กลับใน local state ทันที
  async function updateCase(id, updateData) {
    const { data, error: updateError } = await supabase
      .from('verbal_warning_cases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // อัปเดต local state ทันที ไม่ต้อง fetch ใหม่ทั้งหมด
    const idx = cases.value.findIndex(c => c.id === id)
    if (idx !== -1 && data) {
      cases.value[idx] = { ...cases.value[idx], ...data }
    }

    return data
  }

  return { cases, loading, error, fetchAll, deleteCase, updateCase }
})