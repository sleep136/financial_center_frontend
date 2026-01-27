import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, getUserInfoApi, type ApiLoginResponse } from '@/api/auth'

interface UserInfo {
    id: number
    username: string
    groups: number[]
}

// 使用 ApiLoginResponse 作为基础，但让 token_type 变为必填
interface LoginResponse extends Omit<ApiLoginResponse, 'token_type'> {
    token_type: string
}

// 或者直接使用 ApiLoginResponse，但处理可能未定义的 token_type
// interface LoginResponse extends ApiLoginResponse {
//     token_type: string  // 覆盖为必填
// }

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

    const login = async (username: string, password: string): Promise<LoginResponse> => {
        try {
            const apiResponse = await loginApi({ username, password })

            // 转换 ApiLoginResponse 为 LoginResponse
            const response: LoginResponse = {
                ...apiResponse,
                token_type: apiResponse.token_type || 'bearer'  // 提供默认值
            }

            console.log('登录返回信息:', response)

            token.value = response.access_token
            userInfo.value = response.user

            localStorage.setItem('token', token.value)
            localStorage.setItem('userInfo', JSON.stringify(userInfo.value))

            return response
        } catch (error) {
            console.error('登录失败:', error)
            throw error
        }
    }

    // 获取用户信息 - 也需要修正
    const fetchUserInfo = async (): Promise<UserInfo> => {
        try {
            // getUserInfoApi 应该返回 UserInfo，不是 response.data
            const data = await getUserInfoApi()

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