import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const incidenttitle = defineStore('incident_title', () => {
  const incident_title = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function getIncident() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('incident_title')
      .select(`
        *,
        document_type (
          id,
          document_name
        )
      `)
      .order('created_at', { ascending: false })
    if (!err) incident_title.value = data || []
    else error.value = err.message
    loading.value = false
  }

  async function addIncident(payload) {
    const { data, error: err } = await supabase
      .from('incident_title')
      .insert([payload])
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function updateIncident(id, payload) {
    const { error: err } = await supabase
      .from('incident_title')
      .update(payload)
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function deleteIncident(id) {
    const { error: err } = await supabase
      .from('incident_title')
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
  incident_title, loading, error, 
  getIncident, 
  addIncident,     
  updateIncident,   
  deleteIncident    
}
})