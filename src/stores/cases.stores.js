import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useDisciplineListStore = defineStore('disciplineList', () => {
  const cases = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('discipline_cases')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      cases.value = data || []
      return data
    } catch (err) {
      console.error('Fetch error:', err)
      error.value = err.message
      cases.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  async function deleteCase(id) {
    const { error: deleteError } = await supabase
      .from('discipline_cases')
      .delete()
      .eq('id', id)
    
    if (deleteError) throw deleteError
    cases.value = cases.value.filter(c => c.id !== id)
  }

  async function updateCase(id, payload) {
    const { data, error: updateError } = await supabase
      .from('discipline_cases')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError
    cases.value = cases.value.map(c => c.id === id ? data : c)
    return data
  }

  return { cases, loading, error, fetchAll, deleteCase, updateCase }
})
