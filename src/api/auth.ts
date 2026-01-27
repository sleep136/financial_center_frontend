// api/auth.ts
import request from '@/utils/requests.ts'

// 定义接口返回类型
export interface ApiLoginResponse {
    access_token: string
    user: {
        id: number
        username: string
        groups: number[]
    }
    token_type?: string
}

// 登录接口 - 必须明确定义返回类型
export const loginApi = (data: { username: string; password: string }): Promise<ApiLoginResponse> => {
    return request.post('/login', data) as Promise<ApiLoginResponse>
}

// 获取用户信息接口
export const getUserInfoApi = (): Promise<ApiLoginResponse['user']> => {
    return request.get('/login/me') as Promise<ApiLoginResponse['user']>
}