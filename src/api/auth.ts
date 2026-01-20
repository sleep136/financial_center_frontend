// api/auth.ts
import request from '@/utils/requests.ts'

// 登录接口
export const loginApi = (data: { username: string; password: string }) => {
    return request.post('/login', data)
}

// 获取用户信息接口
export const getUserInfoApi = () => {
    return request.get('/login/me')
}