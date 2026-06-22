import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const penalty = defineStore('penalty_type', () => {
  const penalty_type = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function getPenalty() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('penalty_type')
      .select('*')
      .order('created_at', { ascending: false })
    if (!err) penalty_type.value = data || []
    else error.value = err.message
    loading.value = false
  }

  async function addPenalty(payload) {
    const { data, error: err } = await supabase
      .from('penalty_type')
      .insert([payload])
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function updatePenalty(id, payload) {
    const { error: err } = await supabase
      .from('penalty_type')
      .update(payload)
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function deletePenalty(id) {
    const { error: err } = await supabase
      .from('penalty_type')
      .delete()
      .eq('id', id)
    if (err) {
      if (err.code === '23503' || err.message?.includes('foreign key')) {
        throw new Error('FK_VIOLATION')
      }
      throw new Error(err.message)
    }
  }

 return { penalty_type, loading, error, getPenalty, addPenalty, updatePenalty, deletePenalty }
})