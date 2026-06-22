import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const document = defineStore('document_type', () => {
  const document_type = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function getDocument() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('document_type')
      .select('*')
      .order('created_at', { ascending: false })
    if (!err) document_type.value = data || []
    else error.value = err.message
    loading.value = false
  }

  async function addDocument(payload) {
    const { data, error: err } = await supabase
      .from('document_type')
      .insert([payload])
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function updateDocument(id, payload) {
    const { error: err } = await supabase
      .from('document_type')
      .update(payload)
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function deleteDocument(id) {
    const { error: err } = await supabase
      .from('document_type')
      .delete()
      .eq('id', id)
    if (err) {
      if (err.code === '23503' || err.message?.includes('foreign key')) {
        throw new Error('FK_VIOLATION')
      }
      throw new Error(err.message)
    }
  }

  return { document_type, loading, error, getDocument, addDocument, updateDocument, deleteDocument }
})