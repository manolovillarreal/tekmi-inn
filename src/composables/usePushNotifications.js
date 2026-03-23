import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import { useAccountStore } from '../stores/account'

/** Convierte una VAPID public key en base64url a Uint8Array para el browser */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/** Obtiene el service worker registrado (espera a que esté listo) */
async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

export function usePushNotifications() {
  const accountStore = useAccountStore()
  const isSubscribed = ref(false)

  /** El navegador soporta Web Push */
  const isSupported = computed(() =>
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )

  /**
   * Detecta iOS/iPadOS — en estos dispositivos el push solo funciona
   * si la PWA está instalada desde Safari (A2HS).
   * iOS 16.4+ con Safari soporta Web Push; versiones anteriores no.
   */
  const isIOS = computed(() => {
    const ua = navigator.userAgent
    return (
      /ipad|iphone|ipod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    )
  })

  /**
   * Verifica si el dispositivo actual ya tiene una suscripción push activa.
   * Llamar en onMounted de los componentes que muestran el estado push.
   */
  const checkSubscriptionStatus = async () => {
    if (!isSupported.value) return
    try {
      const registration = await getServiceWorkerRegistration()
      if (!registration) return
      const subscription = await registration.pushManager.getSubscription()
      isSubscribed.value = !!subscription
    } catch {
      isSubscribed.value = false
    }
  }

  /**
   * Solicita permiso de notificaciones → suscribe al push manager → guarda
   * la suscripción en push_subscriptions con upsert (evita duplicados).
   * Devuelve true si la suscripción fue exitosa.
   */
  const subscribe = async () => {
    if (!isSupported.value) return false

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return false

      const registration = await getServiceWorkerRegistration()
      if (!registration) return false

      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('[push] VITE_VAPID_PUBLIC_KEY not configured')
        return false
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const { endpoint, keys } = subscription.toJSON()
      const { p256dh, auth } = keys ?? {}

      if (!endpoint || !p256dh || !auth) {
        console.error('[push] Subscription missing required keys')
        return false
      }

      const accountId = accountStore.getRequiredAccountId()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            account_id: accountId,
            user_id: user.id,
            endpoint,
            p256dh,
            auth,
            user_agent: navigator.userAgent.slice(0, 255),
          },
          { onConflict: 'account_id,endpoint' }
        )

      if (error) {
        console.error('[push] Failed to save subscription:', error.message)
        return false
      }

      isSubscribed.value = true
      return true
    } catch (e) {
      console.error('[push] subscribe failed:', e)
      return false
    }
  }

  /**
   * Cancela la suscripción en el browser y elimina la fila
   * correspondiente en push_subscriptions.
   */
  const unsubscribe = async () => {
    try {
      const registration = await getServiceWorkerRegistration()
      if (!registration) return

      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        isSubscribed.value = false
        return
      }

      const endpoint = subscription.endpoint

      await subscription.unsubscribe()

      const accountId = accountStore.getRequiredAccountId()
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('account_id', accountId)
        .eq('endpoint', endpoint)

      isSubscribed.value = false
    } catch (e) {
      console.error('[push] unsubscribe failed:', e)
    }
  }

  return {
    isSupported,
    isSubscribed,
    isIOS,
    subscribe,
    unsubscribe,
    checkSubscriptionStatus,
  }
}
