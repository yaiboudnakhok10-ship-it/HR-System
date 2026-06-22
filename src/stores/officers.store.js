import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const officcrs = defineStore('officers', () => {
  const officers = ref([])
  const loading  = ref(false)
  const error    = ref(null)

  async function getOfficrs() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('officers')
      .select('*')
      .order('created_at', { ascending: false })

    if (!err) officers.value = data || []
    else      error.value    = err.message
    loading.value = false
  }

  async function addOfficr(payload) {
    const { data, error: err } = await supabase
      .from('officers')
      .insert([payload])
      .select()
      .single()

    if (err) throw new Error(err.message)
    return data
  }

  async function updateOfficr(id, payload) {
    const { error: err } = await supabase
      .from('officers')
      .update(payload)
      .eq('id', id)

    if (err) throw new Error(err.message)
  }

  async function deleteOfficr(id) {
    const { error: err } = await supabase
      .from('officers')
      .delete()
      .eq('id', id)

    if (err) {
      if (err.code === '23503' || err.message?.includes('foreign key')) {
        throw new Error('FK_VIOLATION')
      }
      throw new Error(err.message)
    }
  }

  return { officers, loading, error, getOfficrs, addOfficr, updateOfficr, deleteOfficr }
})