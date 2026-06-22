import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useDocumentTypeStore = defineStore('documentType', () => {
  const documents = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function getDocuments() {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: err } = await supabase
        .from('document_type')
        .select('id, document_name, detail')
        .order('id')
      
      if (err) throw err
      documents.value = data || []
      
    } catch (err) {
      error.value = err.message
      documents.value = []
    } finally {
      loading.value = false
    }
  }

  return { documents, loading, error, getDocuments }
})