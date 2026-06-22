import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useRegulationTypeStore = defineStore('regulation_type', () => {
  const regulation_types = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function getRegulationTypes() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('regulation_types')
      .select('*')
      .order('created_at', { ascending: false })
    if (!err) regulation_types.value = data || []
    else error.value = err.message
    loading.value = false
  }

  async function addRegulationType(payload) {
    const { data, error: err } = await supabase
      .from('regulation_types')
      .insert([payload])
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function updateRegulationType(id, payload) {
    const { error: err } = await supabase
      .from('regulation_types')
      .update(payload)
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function deleteRegulationType(id) {
    const { error: err } = await supabase
      .from('regulation_types')
      .delete()
      .eq('id', id)
    if (err) {
      if (err.code === '23503' || err.message?.includes('foreign key')) {
        throw new Error('FK_VIOLATION')
      }
      throw new Error(err.message)
    }
  }

  return {
    regulation_types,
    loading,
    error,
    getRegulationTypes,
    addRegulationType,
    updateRegulationType,
    deleteRegulationType,
  }
})