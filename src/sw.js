// Service Worker — TekMi Inn PWA
// Generado con vite-plugin-pwa (injectManifest strategy).
// Este archivo reemplaza el SW auto-generado por generateSW.
// La línea precacheAndRoute(self.__WB_MANIFEST) es inyectada
// por vite-plugin-pwa en build con la lista de assets cacheables.
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// Inyectado por vite-plugin-pwa en tiempo de build:
// contiene el listado completo de assets para soporte offline.
precacheAndRoute(self.__WB_MANIFEST)

// Limpiar caches de versiones anteriores del SW
cleanupOutdatedCaches()

// ============================================================
// Push Notifications
// ============================================================

self.addEventListener('push', (event) => {
  let data = {}

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { title: event.data.text(), body: '' }
    }
  }

  const title   = data.title   ?? 'TekMi Inn'
  const body    = data.body    ?? ''
  const icon    = data.icon    ?? '/icons/pwa-192.png'
  const badge   = data.badge   ?? '/icons/pwa-192.png'
  const related_type = data.data?.related_type ?? null
  const related_id   = data.data?.related_id   ?? null

  const notificationOptions = {
    body,
    icon,
    badge,
    data: { related_type, related_id },
    // Evitar acumular notificaciones redundantes del mismo tipo
    tag: related_type && related_id ? `${related_type}-${related_id}` : 'tekmi-inn',
  }

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  )
})

// ============================================================
// Notification click — abrir/enfocar la app y navegar
// ============================================================

/** Mapea related_type + related_id a una ruta de la app */
function buildNavigationUrl(related_type, related_id) {
  if (!related_type || !related_id) return '/'
  const map = {
    reservation: `/reservas/${related_id}`,
    inquiry:     `/consultas/${related_id}`,
    guest:       `/huespedes/${related_id}`,
  }
  return map[related_type] ?? '/'
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const { related_type, related_id } = event.notification.data ?? {}
  const targetPath = buildNavigationUrl(related_type, related_id)
  const targetUrl  = new URL(targetPath, self.location.origin).href

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Si ya hay una ventana de la app abierta, enfocarla y navegar
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.focus()
            if ('navigate' in client) {
              return client.navigate(targetUrl)
            }
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})
