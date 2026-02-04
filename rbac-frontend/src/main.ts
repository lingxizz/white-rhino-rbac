import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import * as ArcoIcons from '@arco-design/web-vue/es/icon'
import { MotionPlugin } from '@vueuse/motion'
import './styles/mobile-fix.css'

import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ArcoVue)
app.use(MotionPlugin)

// Register all Arco icons
for (const [key, component] of Object.entries(ArcoIcons)) {
  app.component(key, component)
}

app.mount('#app')
