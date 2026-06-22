import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const empSignatures = defineStore('empSignatures', () => {
  const signatures = ref([])
  const loading    = ref(false)
  const error      = ref(null)

  async function getSignatures() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('employee_signatures')
      .select('*')
      .order('created_at', { ascending: false })

    if (!err) signatures.value = data || []
    else      error.value      = err.message
    loading.value = false
  }

  async function addSignature(payload) {
    const { data, error: err } = await supabase
      .from('employee_signatures')
      .insert([payload])
      .select()
      .single()

    if (err) throw new Error(err.message)
    return data
  }

  async function updateSignature(id, payload) {
    const { error: err } = await supabase
      .from('employee_signatures')
      .update(payload)
      .eq('id', id)

    if (err) throw new Error(err.message)
  }

  async function deleteSignature(id) {
    const { error: err } = await supabase
      .from('employee_signatures')
      .delete()
      .eq('id', id)

    if (err) {
      if (err.code === '23503' || err.message?.includes('foreign key')) {
        throw new Error('FK_VIOLATION')
      }
      throw new Error(err.message)
    }
  }

  return { signatures, loading, error, getSignatures, addSignature, updateSignature, deleteSignature }
})