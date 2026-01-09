// types/workflow.ts
export interface SearchForm {
    work_id: string;
}

export interface ApprovalListItem {
    business_id: string;
    business_type: string;
    applicants_id: string;
    applicants_name: string;
    apply_date: string;
    approval_state: string;
    abstract: string;
}

export interface ApprovalDetailItem {
    business_id: string;
    business_type: string;
    applicants_id: string;
    applicants_name: string;
    apply_date: string;
    approval_state: string;
    abstract: string;
    approval_role: string;
    approver?: string;
    approval_date?: string;
    approval_sort?: number;
}

export interface PaginationConfig {
    total: number;
    pageSize: number;
    currentPage: number;
}

export interface LoadingState {
    list: boolean;
    detail: boolean;
}

export interface ApiResponse<T> {
    data?: T;
    total?: number;
    list?: T[];
}

export interface AbstractData {
    [key: string]: Array<Record<string, any>>;
}

export type ApprovalStatus = '0' | '1' | '2' | '3' | '4';
export type TagType = 'success' | 'warning' | 'danger' | 'primary' | 'info';
export type TimelineType = 'success' | 'danger' | 'primary' | '';