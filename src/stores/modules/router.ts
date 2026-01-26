import {defineStore} from 'pinia'
import {ref} from 'vue'

// 用户模块
export const useRouterStore = defineStore('gs-router', () => {
    // 从 localStorage 初始化
    const storedValue = localStorage.getItem('gs-router-currentSelected')
    const currentSelected = ref(storedValue || '')

    const setCurrentSelected = (newCurrentSelected: string) => {
        currentSelected.value = newCurrentSelected
        // 保存到 localStorage
        localStorage.setItem('gs-router-currentSelected', newCurrentSelected)
    }

    // 清除存储
    const clearStorage = () => {
        currentSelected.value = ''
        localStorage.removeItem('gs-router-currentSelected')
    }

    return {
        currentSelected,
        setCurrentSelected,
        clearStorage
    }
})