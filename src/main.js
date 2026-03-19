import './index.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useAccountStore } from './stores/account'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const bootstrap = async () => {
	const accountStore = useAccountStore(pinia)
	await accountStore.initializeFromSession()
	app.mount('#app')
}

bootstrap()
