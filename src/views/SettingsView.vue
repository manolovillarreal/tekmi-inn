<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-semibold tracking-tight text-gray-900">Configuracion</h1>
    </div>

    <div class="card">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-900">Cuenta activa</h2>
      <div class="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
        <p><span class="font-medium text-gray-700">Cuenta:</span> {{ accountStore.currentAccountName || '-' }}</p>
        <p><span class="font-medium text-gray-700">Rol:</span> {{ accountStore.currentUserRole || '-' }}</p>
        <p><span class="font-medium text-gray-700">Account ID:</span> {{ accountStore.currentAccountId || '-' }}</p>
      </div>
    </div>

    <div v-if="can('users', 'invite')" class="card">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Usuarios</h2>
          <p class="text-sm text-gray-500">Gestiona roles y asociaciones de usuarios en esta cuenta.</p>
        </div>
      </div>

      <p class="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
        La creacion de usuarios se realiza en Supabase. Aqui solo gestionas la asociacion y rol dentro de la cuenta.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th class="px-4 py-3">Usuario</th>
              <th class="px-4 py-3">Email</th>
              <th class="px-4 py-3">Rol</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="4" class="px-4 py-8 text-center text-gray-400">Cargando usuarios...</td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="4" class="px-4 py-8 text-center text-gray-500">No hay usuarios asociados a esta cuenta.</td>
            </tr>
            <tr v-for="item in users" :key="item.id">
              <td class="px-4 py-3 text-gray-900">{{ item.user_id }}</td>
              <td class="px-4 py-3 text-gray-700">{{ item.user_email || '-' }}</td>
              <td class="px-4 py-3">
                <select
                  :disabled="!can('users', 'edit_role') || savingRoleId === item.id"
                  :value="item.role"
                  class="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  @change="updateRole(item, $event.target.value)"
                >
                  <option value="admin">admin</option>
                  <option value="manager">manager</option>
                  <option value="staff">staff</option>
                </select>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  v-if="can('users', 'remove')"
                  class="text-sm font-medium text-red-600 hover:text-red-800"
                  :disabled="removingId === item.id"
                  @click="removeUser(item)"
                >
                  Quitar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="feedback" class="mt-4 rounded-md border px-3 py-2 text-sm" :class="feedbackType === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'">
        {{ feedback }}
      </p>
    </div>

    <div v-else class="card border-amber-200 bg-amber-50/40">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-amber-900">Sin acceso</h2>
      <p class="mt-2 text-sm text-amber-800">No tienes permisos para gestionar usuarios.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '../services/supabase'
import { useAccountStore } from '../stores/account'
import { usePermissions } from '../composables/usePermissions'

const accountStore = useAccountStore()
const { can } = usePermissions()

const users = ref([])
const loading = ref(false)
const savingRoleId = ref('')
const removingId = ref('')
const feedback = ref('')
const feedbackType = ref('success')

const setFeedback = (type, message) => {
  feedbackType.value = type
  feedback.value = message
}

const fetchUsers = async () => {
  if (!can('users', 'invite')) return

  loading.value = true
  feedback.value = ''
  try {
    const accountId = accountStore.getRequiredAccountId()

    const { data, error } = await supabase
      .from('account_users')
      .select('id, account_id, user_id, role')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true })

    if (error) throw error

    users.value = (data || []).map(item => ({
      ...item,
      user_email: ''
    }))
  } catch (err) {
    setFeedback('error', err.message)
  } finally {
    loading.value = false
  }
}

const updateRole = async (item, role) => {
  if (!can('users', 'edit_role') || item.role === role) return

  savingRoleId.value = item.id
  feedback.value = ''
  try {
    const { error } = await supabase
      .from('account_users')
      .update({ role })
      .eq('id', item.id)

    if (error) throw error

    item.role = role
    setFeedback('success', 'Rol actualizado correctamente.')
  } catch (err) {
    setFeedback('error', err.message)
  } finally {
    savingRoleId.value = ''
  }
}

const removeUser = async (item) => {
  if (!can('users', 'remove')) return

  removingId.value = item.id
  feedback.value = ''
  try {
    const { error } = await supabase
      .from('account_users')
      .delete()
      .eq('id', item.id)

    if (error) throw error

    users.value = users.value.filter(user => user.id !== item.id)
    setFeedback('success', 'Usuario removido de la cuenta.')
  } catch (err) {
    setFeedback('error', err.message)
  } finally {
    removingId.value = ''
  }
}

onMounted(fetchUsers)
</script>
