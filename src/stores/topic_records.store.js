import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useTopicRecordsStore = defineStore('topic_records', () => {
  const topic_records = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function getTopicRecords() {
    loading.value = true
    const { data, error: err } = await supabase
      .from('topic_records')
      .select('*')
      .order('recorded_at', { ascending: false })
    if (!err) topic_records.value = data || []
    else error.value = err.message
    loading.value = false
  }

  async function addTopicRecord(payload) {
    const { data, error: err } = await supabase
      .from('topic_records')
      .insert([payload])
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function updateTopicRecord(id, payload) {
    const { error: err } = await supabase
      .from('topic_records')
      .update(payload)
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function deleteTopicRecord(id) {
    const { error: err } = await supabase
      .from('topic_records')
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
    topic_records,
    loading,
    error,
    getTopicRecords,
    addTopicRecord,
    updateTopicRecord,
    deleteTopicRecord,
  }
})
