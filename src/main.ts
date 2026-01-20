// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'

// 创建 Vue 应用
const app = createApp(App)

// 1. 先创建 Pinia 实例
const pinia = createPinia()

// 2. 使用 Pinia（必须在使用 router 之前）
app.use(pinia)

// 3. 使用 router
app.use(router)

// 4. 使用 ElementPlus
app.use(ElementPlus)

// 挂载应用
app.mount('#app')