import { defineStore } from 'pinia'
import { ref } from 'vue'

// 用户模块
export const useRouterStore = defineStore(
    'gs-router',
    () => {
        const currentSelected = ref('') // 定义 token
        const setCurrentSelected = (newCurrentSelected:string) => {currentSelected.value = newCurrentSelected} // 设置 token

        return { currentSelected, setCurrentSelected }
    },
    {
        persist: true // 持久化
    }
)