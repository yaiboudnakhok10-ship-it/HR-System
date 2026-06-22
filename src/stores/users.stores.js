import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useSers = defineStore('system_users', () => {
  const system_users = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function getUsers() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('system_users')
      .select('*')
      .order('id', { ascending: true })

    if (!err) system_users.value = data
    else error.value = err.message
    loading.value = false
  }

  async function addUsers(payload) {
    error.value = null
    const { error: err } = await supabase
      .from('system_users')
      .insert(payload)

    if (!err) await getUsers()
    else error.value = err.message
  }

  async function updateUser(id, payload) {
    error.value = null
    const { error: err } = await supabase
      .from('system_users')
      .update(payload)
      .eq('id', Number(id))   // ← cast เป็น number เพราะ column เป็น int8

    if (!err) await getUsers()
    else error.value = err.message
  }

  async function deleteUser(id) {
    error.value = null
    const { error: err } = await supabase
      .from('system_users')
      .delete()
      .eq('id', Number(id))   // ← cast เป็น number เพราะ column เป็น int8

    if (!err) await getUsers()
    else error.value = err.message
  }

  return { system_users, loading, error, getUsers, addUsers, updateUser, deleteUser }
})