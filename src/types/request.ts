// src/types/request.ts

// 通用的 API 响应类型
export interface ResponseData<T = any> {
    code: number
    message: string
    data: T
    [key: string]: any
}

// 分页响应类型
export interface PaginatedResponse<T = any> {
    code: number
    message: string
    data: {
        list: T[]
        total: number
        page: number
        pageSize: number
        [key: string]: any
    }
}

// 错误响应类型
export interface ErrorResponse {
    code: number
    message: string
    error?: string
    timestamp?: string
}