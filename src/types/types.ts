export interface ExpenseRecord {
    id?: string
    student_id: string
    project_name: string
    amount_payable: number
    amount_paid_in: number
    refund_amount: number
    reduction_amount: number
    hedge_number?: string
    create_time?: string
    update_time?: string
}

export interface ExpenseResponse {
    code: number
    message: string
    data: ExpenseRecord[]
    total: number
    page: number
    page_size: number
}

export interface PaginationConfig {
    currentPage: number
    pageSize: number
    total: number
    layout: string
}

export interface SearchParams {
    student_id: string
    page?: number
    page_size?: number
    sort_field?: string
    sort_order?: 'asc' | 'desc'
}