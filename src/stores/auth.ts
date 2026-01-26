// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, getUserInfoApi } from '@/api/auth'

interface UserInfo {
    id: number
    username: string
    groups: number[]
}

// 登录响应接口
interface LoginResponse {
    access_token: string
    user: UserInfo
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)

    // 从localStorage初始化
    const initFromStorage = () => {
        const savedToken = localStorage.getItem('token')
        const savedUserInfo = localStorage.getItem('userInfo')

        if (savedToken && savedUserInfo) {
            token.value = savedToken
            try {
                userInfo.value = JSON.parse(savedUserInfo)
            } catch (e) {
                console.error('解析用户信息失败:', e)
                userInfo.value = null
                localStorage.removeItem('userInfo')
            }
        }
    }

    // 计算属性
    const isAuthenticated = computed(() => !!token.value)

    // 用户组相关
    const isAdmin = computed(() => {
        return userInfo.value?.groups?.includes(1) || false
    })

    const isBackendUser = computed(() => {
        return userInfo.value?.groups?.includes(2) || false
    })

    const isAccountant = computed(() => {
        // group_id=3 或 无group_id
        const groups = userInfo.value?.groups || []
        return groups.includes(3) || groups.length === 0
    })

    const userGroups = computed(() => userInfo.value?.groups || [])

    // 权限检查
    const canAccessPage = (path: string): boolean => {
        if (!isAuthenticated.value) return false

        // 管理员和后台用户可以访问所有页面
        if (isAdmin.value || isBackendUser.value) {
            return true
        }

        // 会计权限配置
        const accountantAllowedPaths = [
            '/indicator',
            // '/program_freeze',
            // '/student',
            // '/authorization',
            // '/invoice',
            // '/voucher',
            // '/approval_workflow'
        ]

        if (isAccountant.value) {
            return accountantAllowedPaths.includes(path)
        }

        return false
    }

    // 登录
    const login = async (username: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await loginApi({ username, password })

            // 访问 response.data 获取实际数据
            const data: LoginResponse = response.data

            token.value = data.access_token
            userInfo.value = data.user

            localStorage.setItem('token', token.value)
            localStorage.setItem('userInfo', JSON.stringify(userInfo.value))

            return data
        } catch (error) {
            console.error('登录失败:', error)
            throw error
        }
    }

    // 获取用户信息
    const fetchUserInfo = async (): Promise<UserInfo> => {
        try {
            const response = await getUserInfoApi()

            // 访问 response.data 获取实际数据
            const data: UserInfo = response.data

            userInfo.value = data
            localStorage.setItem('userInfo', JSON.stringify(userInfo.value))

            return data
        } catch (error) {
            console.error('获取用户信息失败:', error)
            throw error
        }
    }

    // 退出登录
    const logout = () => {
        token.value = ''
        userInfo.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
    }

    // 初始化
    initFromStorage()

    return {
        token,
        userInfo,
        isAuthenticated,
        isAdmin,
        isBackendUser,
        isAccountant,
        userGroups,
        canAccessPage,
        login,
        fetchUserInfo,
        logout
    }
})