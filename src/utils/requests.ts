import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import {ElMessage} from 'element-plus'

// 设置后端地址
const baseURL = 'http://172.31.22.3:8000'

// const baseURL= 'http://localhost:8000'
/**
 * @description 创建axios实例
 */
const instance = axios.create({
    baseURL,
    timeout: 60000, // 设置响应时间：1min
    withCredentials: true
})

/**
 * @description 请求拦截器
 */
instance.interceptors.request.use(
    (config) => {
        const userStore = useAuthStore()
        // 添加token到http请求头的Authorization
        if (userStore.token) {
            config.headers.Authorization = `Bearer ${userStore.token}`  // 通常有 Bearer 前缀
        }

        // 对于 GET 请求，确保 params 正确序列化
        if (config.method === 'get' && config.params) {
            // 移除 undefined 或 null 的参数
            config.params = Object.fromEntries(
                Object.entries(config.params).filter(([_, v]) => v != null)
            )
        }
        return config
    },

    (err) => Promise.reject(err)
)

/**
 * @description 响应拦截器
 */
instance.interceptors.response.use(
    (res) => {
        console.log('API Response:', {
            url: res.config.url,
            status: res.status,
            data: res.data,
            headers: res.headers
        })

        // 对于 FastAPI，成功的响应状态码是 200-299
        // FastAPI 通常直接返回数据，没有 code 字段
        if (res.status >= 200 && res.status < 300) {
            // 直接返回 data
            return res.data
        }

        // 如果有自定义的错误格式
        if (res.data && res.data.detail) {
            ElMessage({
                message: res.data.detail || '请求失败',
                type: 'error'
            })
            return Promise.reject(res.data)
        }

        return res
    },
    // 失败处理
    (err) => {
        console.error('API Error:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
            url: err.config?.url
        })

        // FastAPI 的错误响应通常有 detail 字段
        const errorMsg = err.response?.data?.detail ||
            err.response?.data?.msg ||
            err.message ||
            '服务异常'

        ElMessage({
            message: errorMsg,
            type: 'error',
            duration: 3000
        })

        // 如果用户未登录，状态码为 401
        // if (err.response?.status === 401) {
        //     const userStore = useUserStore()
        //
        //     router.push('/login')
        // }

        return Promise.reject(err)
    }
)

export default instance
export { baseURL }