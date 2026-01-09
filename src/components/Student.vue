<script setup lang="ts">
import {ref, reactive, computed, onMounted} from 'vue'
import request from "@/utils/requests.ts"
import {ElMessage, ElTable, type Sort} from "element-plus"
import type {ExpenseRecord, ExpenseResponse} from '../types/types'

// 类型定义
interface SearchForm {
  student_id: string
}

interface PaginationConfig {
  currentPage: number
  pageSize: number
  total: number
  layout: string
}

interface StatusInfo {
  type: 'success' | 'warning' | 'danger' | 'info'
  text: string
}

// 搜索表单
const searchForm = reactive<SearchForm>({
  student_id: ''
})

// 表格数据
const expenseTableData = ref<ExpenseRecord[]>([])
const loading = ref(false)
const isFirstLoad = ref(true)

// 分页配置
const pagination = reactive<PaginationConfig>({
  currentPage: 1,
  pageSize: 10,
  total: 0,
  layout: 'total, sizes, prev, pager, next, jumper'
})

// 常量定义
const MESSAGES = {
  INPUT_STUDENT_ID: '请输入学号',
  NO_DATA_FOUND: '未查询到相关收费记录',
  QUERY_FAILED: '查询失败，请稍后重试',
  NETWORK_ERROR: '网络错误，请检查网络连接'
} as const

const STATUS_TEXTS = {
  PAID: '已缴清',
  PARTIAL: '部分缴纳',
  UNPAID: '未缴纳'
} as const

// 计算属性
const totalPayable = computed(() => {
  return expenseTableData.value.reduce((sum, item) => sum + (item.amount_payable || 0), 0)
})

const totalPaid = computed(() => {
  return expenseTableData.value.reduce((sum, item) => sum + (item.amount_paid_in || 0), 0)
})

const totalRefund = computed(() => {
  return expenseTableData.value.reduce((sum, item) => sum + (item.refund_amount || 0), 0)
})

const totalArrears = computed(() => {
  return totalPayable.value - totalPaid.value - totalRefund.value
})

const hasSearched = computed(() => searchForm.student_id.trim() !== '')

const isEmptyResult = computed(() =>
    hasSearched.value && expenseTableData.value.length === 0 && !loading.value
)

// 状态计算函数
const calculateStatus = (row: ExpenseRecord): StatusInfo => {
  const payable = row.amount_payable || 0
  const paid = row.amount_paid_in || 0
  const refund = row.refund_amount || 0
  const balance = payable - paid - refund

  if (balance <= 0) {
    return {type: 'success', text: STATUS_TEXTS.PAID}
  } else if (paid > 0) {
    return {type: 'warning', text: STATUS_TEXTS.PARTIAL}
  } else {
    return {type: 'danger', text: STATUS_TEXTS.UNPAID}
  }
}

// 数据处理函数
const processResponseData = (data: any): ExpenseRecord[] => {
  if (!data) return []

  // 如果是数组直接返回
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      year: item.year || ''
    }))
  }

  // 如果是对象格式 {年份: []}
  if (typeof data === 'object' && !Array.isArray(data)) {
    const result: ExpenseRecord[] = []
    Object.entries(data).forEach(([year, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          result.push({
            ...item,
            year
          })
        })
      }
    })
    return result
  }

  return []
}

// 搜索查询
const searchQuery = async (): Promise<void> => {
  const studentId = searchForm.student_id.trim()

  if (!studentId) {
    ElMessage.warning(MESSAGES.INPUT_STUDENT_ID)
    return
  }

  loading.value = true
  isFirstLoad.value = false

  try {
    const response = await request.get<ExpenseResponse>('/student/expense', {
      params: {
        student_id: studentId,
        page: pagination.currentPage,
        page_size: pagination.pageSize
      },
      timeout: 10000 // 10秒超时
    })

    await handleResponse(response)
  } catch (error: any) {
    handleError(error)
  } finally {
    loading.value = false
  }
}

// 处理响应数据
const handleResponse = async (response: any): Promise<void> => {
  try {
    if (!response) {
      throw new Error('响应数据为空')
    }

    const processedData = processResponseData(response.data || response)
    expenseTableData.value = processedData
    pagination.total = processedData.length

    if (processedData.length === 0) {
      ElMessage.info(MESSAGES.NO_DATA_FOUND)
    }
  } catch (error) {
    console.error('处理响应数据失败:', error)
    ElMessage.error('数据处理失败')
    expenseTableData.value = []
    pagination.total = 0
  }
}

// 错误处理
const handleError = (error: any): void => {
  console.error('查询收费记录失败:', error)

  let errorMessage: string

  if (error.response) {
    // 服务器响应错误
    const {status, data} = error.response
    switch (status) {
      case 404:
        errorMessage = '接口不存在'
        break
      case 500:
        errorMessage = '服务器内部错误'
        break
      case 401:
        errorMessage = '未授权访问'
        break
      default:
        errorMessage = data?.message || `请求失败 (${status})`
    }
  } else if (error.request) {
    // 请求发送失败
    errorMessage = MESSAGES.NETWORK_ERROR
  } else if (error.message) {
    // 其他错误
    errorMessage = error.message
  } else {
    errorMessage = ''
  }

  ElMessage.error(errorMessage)
  expenseTableData.value = []
  pagination.total = 0
}

// 分页变化处理
const handlePageChange = (page: number): void => {
  pagination.currentPage = page
  searchQuery()
}

// 页大小变化处理
const handleSizeChange = (size: number): void => {
  pagination.pageSize = size
  pagination.currentPage = 1
  searchQuery()
}

// 重置搜索
const resetSearch = (): void => {
  searchForm.student_id = ''
  expenseTableData.value = []
  pagination.currentPage = 1
  pagination.total = 0
  isFirstLoad.value = true
}

// 排序处理
const handleSortChange = ({prop, order}: Sort): void => {
  if (!order || !prop) {
    // 重置为原始顺序
    searchQuery()
    return
  }

  const sortedData = [...expenseTableData.value].sort((a, b) => {
    const aVal = a[prop as keyof ExpenseRecord] || 0
    const bVal = b[prop as keyof ExpenseRecord] || 0

    if (order === 'ascending') {
      return Number(aVal) - Number(bVal)
    } else {
      return Number(bVal) - Number(aVal)
    }
  })

  expenseTableData.value = sortedData
}

// 格式金额显示
const formatAmount = (amount?: number): string => {
  return (amount || 0).toFixed(2)
}

// 计算表格空文本
const tableEmptyText = computed(() => {
  if (loading.value) return ''
  if (isFirstLoad.value) return MESSAGES.INPUT_STUDENT_ID
  if (isEmptyResult.value) return MESSAGES.NO_DATA_FOUND
  return '暂无数据'
})

// 初始化
onMounted(() => {
  // 可以添加一些初始化逻辑
})
</script>

<template>
  <div class="expense-query-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <div class="search-form">
        <div class="form-item">
          <el-input
              v-model="searchForm.student_id"
              :placeholder="MESSAGES.INPUT_STUDENT_ID"
              clearable
              style="width: 240px;"
              @keyup.enter="searchQuery"
              @clear="resetSearch"
              :disabled="loading"
          >
            <template #prepend>
              <el-icon>
                <User/>
              </el-icon>
            </template>
          </el-input>
        </div>

        <div class="form-actions">
          <el-button
              type="primary"
              :loading="loading"
              :disabled="!searchForm.student_id.trim()"
              @click="searchQuery"
          >
            <el-icon>
              <Search/>
            </el-icon>
            查询
          </el-button>

          <el-button @click="resetSearch" :disabled="loading">
            重置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计信息 -->
    <el-card v-if="expenseTableData.length > 0" class="stats-card" shadow="never">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">总应付金额</div>
          <div class="stat-value amount-payable">¥{{ formatAmount(totalPayable) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">总实缴金额</div>
          <div class="stat-value amount-paid">¥{{ formatAmount(totalPaid) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">总退费金额</div>
          <div class="stat-value amount-refund">¥{{ formatAmount(totalRefund) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">总欠费金额</div>
          <div class="stat-value amount-arrears">¥{{ formatAmount(totalArrears) }}</div>
        </div>
      </div>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="never">
      <el-table
          :data="expenseTableData"
          border
          stripe
          style="width: 100%;"
          v-loading="loading"
          :empty-text="tableEmptyText"
          @sort-change="handleSortChange"
          row-key="id"
          highlight-current-row
      >
        <el-table-column
            type="index"
            label="序号"
            width="60"
            align="center"
            fixed
        />

        <el-table-column
            prop="year"
            label="收费年度"
            width="100"
            align="center"
            sortable
        />

        <el-table-column
            prop="project_name"
            label="收费项目名称"
            min-width="180"
            sortable="custom"
            show-overflow-tooltip
        />

        <el-table-column
            prop="amount_payable"
            label="应交金额(元)"
            width="120"
            align="right"
            sortable="custom"
        >
          <template #default="{ row }">
            <span class="amount-cell payable">
              ¥{{ formatAmount(row.amount_payable) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
            prop="amount_paid_in"
            label="实缴金额(元)"
            width="120"
            align="right"
            sortable="custom"
        >
          <template #default="{ row }">
            <span class="amount-cell paid">
              ¥{{ formatAmount(row.amount_paid_in) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
            prop="refund_amount"
            label="退费金额(元)"
            width="120"
            align="right"
            sortable="custom"
        >
          <template #default="{ row }">
            <span class="amount-cell refund">
              ¥{{ formatAmount(row.refund_amount) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
            prop="reduction_amount"
            label="解冻金额(元)"
            width="120"
            align="right"
            sortable="custom"
        >
          <template #default="{ row }">
            <span class="amount-cell reduction">
              ¥{{ formatAmount(row.reduction_amount) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
            label="状态"
            width="100"
            align="center"
            fixed="right"
        >
          <template #default="{ row }">
            <el-tag
                :type="calculateStatus(row).type"
                size="small"
                effect="light"
                round
            >
              {{ calculateStatus(row).text }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
        <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            :layout="pagination.layout"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
            background
            class="pagination-container"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.expense-query-container {
  padding: 20px;
  min-height: calc(100vh - 100px);
}

.search-card {
  margin-bottom: 20px;

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.search-form {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.stats-card {
  margin-bottom: 20px;
  animation: slideDown 0.3s ease;

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 4px solid;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  font-family: 'Roboto Mono', 'Monaco', 'Consolas', monospace;
}

.amount-payable {
  color: #e6a23c;
  border-color: #e6a23c;
}

.amount-paid {
  color: #67c23a;
  border-color: #67c23a;
}

.amount-refund {
  color: #909399;
  border-color: #909399;
}

.amount-arrears {
  color: #f56c6c;
  border-color: #f56c6c;
}

.table-card {
  animation: fadeIn 0.5s ease;

  :deep(.el-card__body) {
    padding: 0;
  }
}

:deep(.el-table) {
  .amount-cell {
    font-family: 'Roboto Mono', 'Monaco', 'Consolas', monospace;
    font-weight: 600;

    &.payable {
      color: #e6a23c;
    }

    &.paid {
      color: #67c23a;
    }

    &.refund {
      color: #909399;
    }

    &.reduction {
      color: #409eff;
    }
  }
}

.pagination-wrapper {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--el-border-color-light);
}

.pagination-container {
  :deep(.el-pagination__total) {
    font-weight: 500;
  }
}

// 动画
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .expense-query-container {
    padding: 12px;
  }

  .search-form {
    flex-direction: column;
    align-items: stretch;
  }

  .form-item {
    width: 100%;

    :deep(.el-input) {
      width: 100%;
    }
  }

  .form-actions {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-item {
    padding: 10px 12px;
  }

  .stat-value {
    font-size: 18px;
  }

  .pagination-container {
    :deep(.el-pagination__jump) {
      display: none;
    }

    :deep(.el-pagination__sizes) {
      display: none;
    }
  }
}

@media (max-width: 480px) {
  .pagination-container {
    :deep(.el-pagination__total) {
      display: none;
    }
  }
}
</style>