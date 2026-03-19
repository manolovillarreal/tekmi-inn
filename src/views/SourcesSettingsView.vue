<template>
  <div v-if="can('settings', 'edit')" class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-gray-900">Canales y origenes</h1>
        <p class="text-sm text-gray-500">Administra tipos de origen y canales por cuenta.</p>
      </div>
      <RouterLink to="/configuracion" class="btn-secondary text-sm">Volver a configuracion</RouterLink>
    </div>

    <div class="card">
      <div class="space-y-6">
        <section class="space-y-3">
          <div>
            <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-700">Tipos de origen</h3>
            <p class="text-sm text-gray-500">El catalogo base no se crea ni elimina. Solo se activa o desactiva por cuenta.</p>
          </div>

          <div v-if="loadingSourceCatalog" class="rounded-md border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            Cargando catalogo de origen...
          </div>

          <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label
              v-for="type in sourceTypesCatalog"
              :key="type.id"
              class="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
            >
              <div>
                <p class="font-medium text-gray-900">{{ type.label_es }}</p>
                <p class="text-xs text-gray-500">{{ type.name }}</p>
              </div>
              <input
                :checked="type.is_active"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                :disabled="savingSourceTypeId === type.id"
                @change="toggleSourceType(type, $event.target.checked)"
              >
            </label>
          </div>
        </section>

        <section class="space-y-4">
          <div>
            <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-700">Canales por tipo</h3>
            <p class="text-sm text-gray-500">Configura comision y descuento sugerido por canal. Solo se puede eliminar un canal sin reservas o consultas asociadas.</p>
          </div>

          <div v-if="!loadingSourceCatalog" class="space-y-4">
            <div v-for="group in groupedSourceDetails" :key="group.type.id" class="rounded-lg border border-gray-200 bg-white">
              <div class="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
                <div>
                  <h4 class="font-medium text-gray-900">{{ group.type.label_es }}</h4>
                  <p class="text-xs text-gray-500">{{ group.type.is_active ? 'Activo' : 'Inactivo' }}</p>
                </div>
                <button type="button" class="btn-secondary text-sm" @click="openCreateSourceDetailModal(group.type)">+ Agregar canal</button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full border-collapse text-left text-sm">
                  <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th class="px-4 py-3">Canal</th>
                      <th class="px-4 py-3">Comision sugerida</th>
                      <th class="px-4 py-3">Descuento sugerido</th>
                      <th class="px-4 py-3">Activo</th>
                      <th class="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-if="group.details.length === 0">
                      <td colspan="5" class="px-4 py-6 text-center text-sm text-gray-500">No hay canales configurados para este tipo.</td>
                    </tr>
                    <tr v-for="detail in group.details" :key="detail.id">
                      <td class="px-4 py-3">
                        <p class="font-medium text-gray-900">{{ detail.label_es }}</p>
                        <p class="text-xs text-gray-500">{{ detail.name }}</p>
                      </td>
                      <td class="px-4 py-3 text-gray-700">{{ Number(detail.suggested_commission_percentage || 0) }}%</td>
                      <td class="px-4 py-3 text-gray-700">{{ Number(detail.suggested_discount_percentage || 0) }}%</td>
                      <td class="px-4 py-3">
                        <input
                          :checked="detail.is_active"
                          type="checkbox"
                          class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                          :disabled="savingSourceDetailId === detail.id"
                          @change="toggleSourceDetail(detail, $event.target.checked)"
                        >
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="flex justify-end gap-3">
                          <button type="button" class="text-sm font-medium text-primary hover:text-primary-dark" @click="openEditSourceDetailModal(detail)">Editar</button>
                          <button
                            type="button"
                            class="text-sm font-medium text-red-600 hover:text-red-800"
                            :disabled="deletingSourceDetailId === detail.id"
                            @click="removeSourceDetail(detail)"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <BaseModal :isOpen="showSourceDetailModal" :title="sourceDetailModalTitle" @close="closeSourceDetailModal">
      <form class="space-y-4" @submit.prevent="submitSourceDetail">
        <div>
          <label class="block text-sm font-medium text-gray-700">Tipo</label>
          <select v-model="sourceDetailForm.source_type_id" class="mt-1 block w-full rounded-md border-gray-300 text-sm" :disabled="sourceDetailModalMode === 'edit'">
            <option value="">Seleccionar tipo</option>
            <option v-for="type in sourceTypesCatalog" :key="type.id" :value="type.id">{{ type.label_es }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Canal</label>
          <input v-model="sourceDetailForm.label_es" type="text" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700">% Comision sugerida</label>
            <input v-model="sourceDetailForm.suggested_commission_percentage" type="number" min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">% Descuento sugerido</label>
            <input v-model="sourceDetailForm.suggested_discount_percentage" type="number" min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
          </div>
        </div>
        <label class="inline-flex items-center gap-2 text-sm text-gray-700">
          <input v-model="sourceDetailForm.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30">
          <span>Canal activo</span>
        </label>

        <div class="flex justify-end gap-2 border-t pt-4">
          <button type="button" class="btn-secondary" @click="closeSourceDetailModal">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="savingSourceDetail">
            {{ savingSourceDetail ? 'Guardando...' : sourceDetailModalMode === 'create' ? 'Crear canal' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>

  <div v-else class="card border-amber-200 bg-amber-50/40">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-amber-900">Sin acceso</h2>
    <p class="mt-2 text-sm text-amber-800">No tienes permisos para editar canales y origenes.</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import BaseModal from '../components/ui/BaseModal.vue'
import { useAccountStore } from '../stores/account'
import { useSourcesStore } from '../stores/sources'
import { usePermissions } from '../composables/usePermissions'
import { useToast } from '../composables/useToast'
import {
  createSourceDetail,
  deleteSourceDetail,
  getSourceDetails,
  getSourceTypes,
  setSourceDetailActive,
  setSourceTypeActive,
  updateSourceDetail,
} from '../services/sourceService'

const accountStore = useAccountStore()
const sourcesStore = useSourcesStore()
const { can } = usePermissions()
const toast = useToast()

const loadingSourceCatalog = ref(false)
const savingSourceTypeId = ref('')
const savingSourceDetailId = ref('')
const deletingSourceDetailId = ref('')
const showSourceDetailModal = ref(false)
const savingSourceDetail = ref(false)
const sourceDetailModalMode = ref('create')
const sourceTypesCatalog = ref([])
const sourceDetailsCatalog = ref([])

const sourceDetailForm = ref({
  id: '',
  source_type_id: '',
  label_es: '',
  suggested_commission_percentage: 0,
  suggested_discount_percentage: 0,
  is_active: true,
})

const groupedSourceDetails = computed(() => {
  return sourceTypesCatalog.value.map((type) => ({
    type,
    details: sourceDetailsCatalog.value.filter((detail) => detail.source_type_id === type.id),
  }))
})

const sourceDetailModalTitle = computed(() => {
  return sourceDetailModalMode.value === 'create' ? 'Agregar canal' : 'Editar canal'
})

const loadSourceCatalog = async () => {
  if (!can('settings', 'edit')) return

  loadingSourceCatalog.value = true
  try {
    const accountId = accountStore.getRequiredAccountId()
    const [types, details] = await Promise.all([
      getSourceTypes(accountId, { includeInactive: true }),
      getSourceDetails(accountId, null, { includeInactive: true }),
    ])

    sourceTypesCatalog.value = types
    sourceDetailsCatalog.value = details
  } catch (err) {
    toast.error(err.message || 'No se pudo cargar el catalogo de origen.')
  } finally {
    loadingSourceCatalog.value = false
  }
}

const syncActiveSourceStore = async () => {
  const accountId = accountStore.currentAccountId
  if (!accountId) return
  await sourcesStore.preload(accountId, { force: true })
}

const resetSourceDetailForm = () => {
  sourceDetailForm.value = {
    id: '',
    source_type_id: '',
    label_es: '',
    suggested_commission_percentage: 0,
    suggested_discount_percentage: 0,
    is_active: true,
  }
}

const openCreateSourceDetailModal = (type) => {
  sourceDetailModalMode.value = 'create'
  resetSourceDetailForm()
  sourceDetailForm.value.source_type_id = type?.id || ''
  showSourceDetailModal.value = true
}

const openEditSourceDetailModal = (detail) => {
  sourceDetailModalMode.value = 'edit'
  sourceDetailForm.value = {
    id: detail.id,
    source_type_id: detail.source_type_id,
    label_es: detail.label_es,
    suggested_commission_percentage: Number(detail.suggested_commission_percentage || 0),
    suggested_discount_percentage: Number(detail.suggested_discount_percentage || 0),
    is_active: Boolean(detail.is_active),
  }
  showSourceDetailModal.value = true
}

const closeSourceDetailModal = () => {
  if (savingSourceDetail.value) return
  showSourceDetailModal.value = false
}

const submitSourceDetail = async () => {
  savingSourceDetail.value = true
  try {
    const accountId = accountStore.getRequiredAccountId()
    if (sourceDetailModalMode.value === 'create') {
      await createSourceDetail(accountId, sourceDetailForm.value)
      toast.success('Canal creado correctamente.')
    } else {
      await updateSourceDetail(accountId, sourceDetailForm.value.id, sourceDetailForm.value)
      toast.success('Canal actualizado correctamente.')
    }

    showSourceDetailModal.value = false
    await Promise.all([loadSourceCatalog(), syncActiveSourceStore()])
  } catch (err) {
    toast.error(err.message || 'No se pudo guardar el canal.')
  } finally {
    savingSourceDetail.value = false
  }
}

const toggleSourceType = async (type, isActive) => {
  savingSourceTypeId.value = type.id
  try {
    await setSourceTypeActive(accountStore.getRequiredAccountId(), type.id, isActive)
    type.is_active = isActive
    toast.success(`Tipo ${isActive ? 'activado' : 'desactivado'} correctamente.`)
    await syncActiveSourceStore()
  } catch (err) {
    toast.error(err.message || 'No se pudo actualizar el tipo.')
  } finally {
    savingSourceTypeId.value = ''
  }
}

const toggleSourceDetail = async (detail, isActive) => {
  savingSourceDetailId.value = detail.id
  try {
    const updated = await setSourceDetailActive(accountStore.getRequiredAccountId(), detail.id, isActive)
    const index = sourceDetailsCatalog.value.findIndex((item) => item.id === detail.id)
    if (index !== -1) {
      sourceDetailsCatalog.value.splice(index, 1, updated)
    }
    toast.success(`Canal ${isActive ? 'activado' : 'desactivado'} correctamente.`)
    await syncActiveSourceStore()
  } catch (err) {
    toast.error(err.message || 'No se pudo actualizar el canal.')
  } finally {
    savingSourceDetailId.value = ''
  }
}

const removeSourceDetail = async (detail) => {
  deletingSourceDetailId.value = detail.id
  try {
    await deleteSourceDetail(accountStore.getRequiredAccountId(), detail.id)
    sourceDetailsCatalog.value = sourceDetailsCatalog.value.filter((item) => item.id !== detail.id)
    toast.success('Canal eliminado correctamente.')
    await syncActiveSourceStore()
  } catch (err) {
    toast.error(err.message || 'No se pudo eliminar el canal.')
  } finally {
    deletingSourceDetailId.value = ''
  }
}

onMounted(loadSourceCatalog)
</script>
