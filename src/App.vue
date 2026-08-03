<script setup>
import { useAuthStore } from '@/stores/auth.store'
import UserLayout from './layouts/UserLayout.vue'
import LoginPage from './pages/LoginPage.vue'

const auth = useAuthStore()
</script>

<template>
  <router-view />
</template>