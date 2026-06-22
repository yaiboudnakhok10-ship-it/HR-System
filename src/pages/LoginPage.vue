<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)

// ถ้า login อยู่แล้ว ให้ไป Dashboard ทันที
if (auth.isLoggedIn) {
  router.push({ name: 'Dashboard' })
}

// โหลด username ที่จำไว้ตอน mount
onMounted(() => {
  const savedUsername = localStorage.getItem('rememberedUsername')
  if (savedUsername) {
    username.value = savedUsername
    rememberMe.value = true
  }
})

watch(() => auth.isLoggedIn, loggedIn => {
  if (loggedIn) router.push({ name: 'Dashboard' })
})

async function handleLogin() {
  if (!username.value.trim()) { auth.error = 'กรุณากรอก Username'; return }
  if (!password.value.trim()) { auth.error = 'กรุณากรอก Password'; return }

  // บันทึกหรือลบ username ตาม checkbox
  if (rememberMe.value) {
    localStorage.setItem('rememberedUsername', username.value)
  } else {
    localStorage.removeItem('rememberedUsername')
  }

  const success = await auth.login(username.value, password.value)
  if (success) {
    router.push({ name: 'Dashboard' })
  }
}
</script>

<template>
  <div class="login-bg">
    <div class="login-card">

      <!-- Logo / Title -->
      <div class="login-header">
        <div class="logo-icon">
          <span class="logo-text">TD</span>
        </div>
        <h1 class="login-title">LOGIN</h1>
        <p class="login-sub">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
      </div>

      <!-- Form -->
      <div class="login-form">

        <div class="field-group">
          <label class="field-label">
            <i class="fa fa-user"></i> Username
          </label>
          <input
            v-model="username"
            class="field-input"
            placeholder="กรอก Username"
            autocomplete="username"
            @keyup.enter="handleLogin"
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="fa fa-lock"></i> Password
          </label>
          <div class="input-wrap">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="field-input"
              style="padding-right: 40px"
              placeholder="กรอกรหัสผ่าน"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
            <button type="button" class="toggle-pw" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
            </button>
          </div>
        </div>

        <!-- Remember Me -->
        <div class="remember-row">
          <label class="remember-label">
            <div class="custom-checkbox" :class="{ checked: rememberMe }" @click="rememberMe = !rememberMe">
              <i class="fa fa-check" v-if="rememberMe"></i>
            </div>
            <span class="remember-text">จำการเข้าสู่ระบบ</span>
          </label>
        </div>

        <!-- Error -->
        <div class="error-msg" v-if="auth.error">
          <i class="fa fa-circle-exclamation"></i> {{ auth.error }}
        </div>

        <button
          class="btn-login"
          @click="handleLogin"
          :disabled="auth.loading"
        >
          <i :class="auth.loading ? 'fa fa-spinner fa-spin' : 'fa fa-right-to-bracket'"></i>
          {{ auth.loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
        </button>

      </div>
    </div>
  </div>
</template>



<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-bg {
  min-height: 100vh;
  width: 100%;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Inter', sans-serif;
}

.login-card {
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 24px;
  padding: 40px;
  border: 1px solid #e5e7eb;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.6s ease-out;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.logo-text {
  font-size: 26px;
  font-weight: 800;
  color: white;
  letter-spacing: 1px;
  font-family: 'Inter', sans-serif;
}

.login-title {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0 0 8px;
  letter-spacing: 4px;
}

.login-sub {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label i {
  font-size: 12px;
  color: #667eea;
}

.input-wrap {
  position: relative;
}

.field-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #1f2937;
  background: #f9fafb;
  outline: none;
  transition: all 0.3s ease;
  font-weight: 500;
}

.field-input:focus {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.field-input::placeholder {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 400;
}

.toggle-pw {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 16px;
  padding: 5px;
  transition: color 0.2s;
  z-index: 2;
}

.toggle-pw:hover {
  color: #667eea;
}

/* Remember Me */
.remember-row {
  display: flex;
  align-items: center;
  margin: -4px 0;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: #f9fafb;
  flex-shrink: 0;
}

.custom-checkbox.checked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.custom-checkbox i {
  font-size: 10px;
  color: white;
}

.custom-checkbox:hover {
  border-color: #667eea;
}

.remember-text {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

/* Error */
.error-msg {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
  border-left: 4px solid #ef4444;
  border-radius: 12px;
  color: #dc2626;
  font-size: 12px;
  font-weight: 500;
  margin: 4px 0;
}

.error-msg i {
  font-size: 16px;
}

.btn-login {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  margin-top: 8px;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(102, 126, 234, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 640px) {
  .login-card {
    padding: 32px 24px;
    border-radius: 20px;
  }

  .login-title {
    font-size: 28px;
    letter-spacing: 3px;
  }

  .logo-icon {
    width: 60px;
    height: 60px;
  }

  .logo-text {
    font-size: 22px;
  }

  .btn-login {
    padding: 12px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .login-bg {
    padding: 15px;
  }
  
  .login-card {
    padding: 28px 20px;
  }

  .login-title {
    font-size: 24px;
    letter-spacing: 2px;
  }
  
  .field-input {
    padding: 10px 40px 10px 14px;
  }
}
</style>