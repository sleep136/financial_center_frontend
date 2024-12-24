import request from '@/utils/requests'
import type { LoginData } from '@/interface/auth/LoginData'

export const loginService = (longData:LoginData): Promise<any> =>{
    return request.post('/auth/login', longData)
}