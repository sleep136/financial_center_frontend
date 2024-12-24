import { useUserStore } from '../stores'
import axios from 'axios'
import router from '../router'
import { ElMessage } from 'element-plus'

// 设置后端地址
const baseURL = 'http://localhost:8090'

/**
 * @description 创建axios实例
 */
const instance = axios.create({
    baseURL,
    timeout: 60000 // 设置响应时间：1min
})

/**
 * @description 请求拦截器
 */
instance.interceptors.request.use(
    (config) => {
        const userStore = useUserStore()
        // 添加token到http请求头的Authorization
        if (userStore.token) {
            config.headers.Authorization = userStore.token
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
        // 响应成功
        if (res.data.code === 1) {
            return res
        }
        ElMessage({ message: res.data.msg || '服务异常', type: 'error' })
        return Promise.reject(res.data)
    },
    // 失败
    (err) => {
        ElMessage({
            message: err.response.data.msg || '服务异常',
            type: 'error'
        })
        console.log(err)
        // 如果用户未登录，状态码为 401
        if (err.response?.status === 401) {
            router.push('/login')
        }
        return Promise.reject(err)
    }
)

export default instance
export { baseURL }