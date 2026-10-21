import { useAuthStore } from '@/stores/auth'
import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

// 配置项
const config = {
    // 开发环境使用本地地址，生产环境使用远程地址
    baseURL: import.meta.env.DEV ? 'http://localhost:8000' : 'http://172.31.22.3:8000',
    timeout: 60000,
    withCredentials: true,
    // 是否开启调试日志
    enableDebug: import.meta.env.DEV
}

/**
 * @description 创建axios实例
 */
const instance: AxiosInstance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    withCredentials: config.withCredentials
})

/**
 * @description 请求拦截器
 */
instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const userStore = useAuthStore()
        
        // 添加token到http请求头的Authorization
        if (userStore.token) {
            config.headers.Authorization = `Bearer ${userStore.token}`
        }

        // 对于 GET 请求，清理空值参数
        if (config.method === 'get' && config.params) {
            config.params = Object.fromEntries(
                Object.entries(config.params).filter(([, v]) => v != null)
            )
        }
        
        return config
    },
    (error) => Promise.reject(error)
)

/**
 * @description 响应拦截器
 */
instance.interceptors.response.use(
    (response: AxiosResponse) => {
        // 开发环境打印请求日志
        if (config.enableDebug) {
            console.log('API Response:', {
                url: response.config.url,
                status: response.status,
                data: response.data
            })
        }

        // 成功响应（状态码 200-299）
        if (response.status >= 200 && response.status < 300) {
            return response.data
        }

        // 自定义错误处理
        if (response.data?.detail) {
            ElMessage({
                message: response.data.detail,
                type: 'error'
            })
            return Promise.reject(response.data)
        }

        return response
    },
    (error) => {
        // 开发环境打印错误日志
        if (config.enableDebug) {
            console.error('API Error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            })
        }

        // 提取错误信息
        const errorMessage = error.response?.data?.detail ||
            error.response?.data?.msg ||
            error.message ||
            '服务异常'

        ElMessage({
            message: errorMessage,
            type: 'error',
            duration: 3000
        })

        return Promise.reject(error)
    }
)

export default instance
export { config }