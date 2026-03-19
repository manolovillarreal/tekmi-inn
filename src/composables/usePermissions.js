import { computed } from 'vue'
import { useAccountStore } from '../stores/account'

export const usePermissions = () => {
  const accountStore = useAccountStore()

  const can = (resource, action) => {
    return accountStore.hasPermission(resource, action)
  }

  const role = computed(() => accountStore.currentUserRole)

  return {
    can,
    role
  }
}
