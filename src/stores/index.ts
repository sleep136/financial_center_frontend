// 从'pinia'库中引入创建Pinia实例的函数
import { createPinia } from 'pinia'
// 从'pinia-plugin-persistedstate'库中导入持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 创建一个Pinia实例，用于状态管理
const pinia = createPinia()
// 使用持久化插件，使状态持久化
// pinia.use(persist)
pinia.use(piniaPluginPersistedstate)
// 导出Pinia实例，供其他模块使用
export default pinia

// 导出user模块中的所有内容，集成用户状态管理模块
export * from './modules/user.ts'