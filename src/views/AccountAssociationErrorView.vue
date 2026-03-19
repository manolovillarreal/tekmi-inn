<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-6">
    <div class="w-full max-w-xl rounded-xl border border-red-200 bg-white p-8 shadow-sm">
      <h1 class="text-2xl font-semibold text-gray-900">Usuario sin cuenta asociada</h1>
      <p class="mt-3 text-sm text-gray-600">
        Tu usuario no esta asociado a ninguna cuenta. Contacta al administrador para que te agregue en la seccion de usuarios de la cuenta.
      </p>

      <p v-if="errorMessage" class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ errorMessage }}
      </p>

      <div class="mt-6 flex gap-3">
        <button class="btn-secondary" @click="retry">Reintentar</button>
        <button class="btn-primary" @click="logout">Cerrar sesion</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '../stores/account'
import { supabase } from '../services/supabase'

const router = useRouter()
const accountStore = useAccountStore()

const errorMessage = computed(() => accountStore.loadError)

const retry = async () => {
  const ok = await accountStore.initializeFromSession()
  if (ok) {
    router.push({ name: 'dashboard' })
  }
}

const logout = async () => {
  await supabase.auth.signOut()
  accountStore.clear()
  router.push({ name: 'login' })
}
</script>
