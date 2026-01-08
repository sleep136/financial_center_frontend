<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import request from "@/utils/requests.ts"
import { ElMessage, ElTable, ElTableColumn, ElPagination, ElButton, ElInput } from "element-plus"
import type { ExpenseRecord, ExpenseResponse, PaginationConfig } from '../types/types' // 建议定义类型文件

// 类型定义（如果没单独的类型文件）
interface ExpenseRecord {
  project_name: string
  amount_payable: number
  amount_paid_in: number
  refund_amount: number
  reduction_amount: number
  hedge_number?: string
}

interface ExpenseResponse {
  data: ExpenseRecord[]
  total: number
  [key: string]: any
}

// 搜索表单
const searchForm = reactive({
  student_id: ''
})

// 表格数据
const expenseTableData = ref<ExpenseRecord[]>([])
const loading = ref(false)

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
  layout: 'total, sizes, prev, pager, next, jumper'
})

// 搜索查询
const searchQuery = async () => {
  if (!searchForm.student_id.trim()) {
    ElMessage.warning('请输入学号')
    return
  }

  loading.value = true
  try {
    const response = await request.get<ExpenseResponse>('/student/expense', {
      params: {
        student_id: searchForm.student_id.trim(),
        page: pagination.currentPage,
        page_size: pagination.pageSize
      }
    })

    handleResponse(response)
  } catch (error) {
    handleError(error)
  } finally {
    loading.value = false
  }
}

// 处理响应数据
const handleResponse = (response: any) => {
  if (!response) {
    expenseTableData.value = []
    pagination.total = 0
    return
  }
  console.info('response.data 数据类型:', typeof response)
  // 根据不同的响应格式处理数据
  if (response && Array.isArray(response)) {
    expenseTableData.value = response
    pagination.total = response.length
  } else if (Array.isArray(response)) {
    expenseTableData.value = response
    pagination.total = response.length
  } else if (response && typeof response === 'object') {
    expenseTableData.value = [];

    for (const year in response) {
      if (response.hasOwnProperty(year)) {
        const items = response[year];
        const yearItems = items.map(item => ({
          ...item,
          year: year
        }));
        expenseTableData.value.push(...yearItems);
      }
    }
  }else {
    expenseTableData.value = []
    pagination.total = 0
  }

  // 显示提示信息
  if (expenseTableData.value.length === 0) {
    ElMessage.info('未查询到相关收费记录')
  }
}

// 错误处理
const handleError = (error: any) => {
  console.error('查询收费记录失败:', error)
  ElMessage.error('查询失败，请稍后重试')
  expenseTableData.value = []
  pagination.total = 0
}

// 分页变化处理
const handlePageChange = (page: number) => {
  pagination.currentPage = page
  searchQuery()
}

// 页大小变化处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  searchQuery()
}

// 重置搜索
const resetSearch = () => {
  searchForm.student_id = ''
  expenseTableData.value = []
  pagination.currentPage = 1
  pagination.total = 0
}

// 计算属性：总应付金额
const totalPayable = computed(() => {
  return expenseTableData.value.reduce((sum, item) => sum + (item.amount_payable || 0), 0)
})

// 计算属性：总实缴金额
const totalPaid = computed(() => {
  return expenseTableData.value.reduce((sum, item) => sum + (item.amount_paid_in || 0), 0)
})

// 计算属性：总欠费金额
const totalArrears = computed(() => {
  return expenseTableData.value.reduce((sum, item) => {
    const payable = item.amount_payable || 0
    const paid = item.amount_paid_in || 0
    const refund = item.refund_amount || 0
    return sum + (payable - paid - refund)
  }, 0)
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
              placeholder="请输入学号"
              clearable
              style="width: 200px;"
              @keyup.enter="searchQuery"
          >
            <template #prepend>学号</template>
          </el-input>
        </div>

        <div class="form-actions">
          <el-button
              type="primary"
              :loading="loading"
              @click="searchQuery"
          >
            <el-icon><Search /></el-icon>
            查询
          </el-button>

          <el-button @click="resetSearch">
            重置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计信息 -->
    <el-card v-if="expenseTableData.length > 0" class="stats-card" shadow="never">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">总应付金额：</span>
          <span class="stat-value amount-payable">{{ totalPayable.toFixed(2) }} 元</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总实缴金额：</span>
          <span class="stat-value amount-paid">{{ totalPaid.toFixed(2) }} 元</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总欠费金额：</span>
          <span class="stat-value amount-arrears">{{ totalArrears.toFixed(2) }} 元</span>
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
          :empty-text="searchForm.student_id ? '未查询到相关记录' : '请输入学号查询'"
          @sort-change="handleSortChange"
      >
        <el-table-column
            type="index"
            label="序号"
            width="60"
            align="center"
        />
        <el-table-column
            prop="year"
            label="收费年度"
            width="60"
            align="center"
        />

        <el-table-column
            prop="project_name"
            label="收费项目名称"
            min-width="180"
            sortable="custom"
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
              {{ row.amount_payable?.toFixed(2) || '0.00' }}
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
              {{ row.amount_paid_in?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
            prop="refund_amount"
            label="退费金额(元)"
            width="120"
            align="right"
        >
          <template #default="{ row }">
            <span class="amount-cell refund">
              {{ row.refund_amount?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
            prop="reduction_amount"
            label="解冻金额(元)"
            width="120"
            align="right"
        >
          <template #default="{ row }">
            <span class="amount-cell reduction">
              {{ row.reduction_amount?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
            label="状态"
            width="100"
            align="center"
        >
          <template #default="{ row }">
            <el-tag
                :type="getStatusType(row)"
                size="small"
            >
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
          v-if="pagination.total > 0"
          :current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          :layout="pagination.layout"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          class="pagination-container"
      />
    </el-card>
  </div>
</template>

<style scoped>
.expense-query-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
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
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.amount-payable {
  color: #e6a23c;
}

.amount-paid {
  color: #67c23a;
}

.amount-arrears {
  color: #f56c6c;
}

.table-card {
  margin-top: 20px;
}

.amount-cell {
  font-family: 'Monaco', 'Consolas', monospace;
}

.amount-cell.payable {
  color: #e6a23c;
}

.amount-cell.paid {
  color: #67c23a;
}

.amount-cell.refund {
  color: #909399;
}

.amount-cell.reduction {
  color: #409eff;
}

.pagination-container {
  margin-top: 20px;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }

  .form-item {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<script lang="ts">
// 辅助函数定义
export default {
  methods: {
    getStatusType(row: any) {
      const payable = row.amount_payable || 0
      const paid = row.amount_paid_in || 0
      const refund = row.refund_amount || 0
      const balance = payable - paid - refund

      if (balance <= 0) {
        return 'success' // 已缴清
      } else if (paid > 0) {
        return 'warning' // 部分缴纳
      } else {
        return 'danger' // 未缴纳
      }
    },

    getStatusText(row: any) {
      const payable = row.amount_payable || 0
      const paid = row.amount_paid_in || 0
      const refund = row.refund_amount || 0
      const balance = payable - paid - refund

      if (balance <= 0) {
        return '已缴清'
      } else if (paid > 0) {
        return '部分缴纳'
      } else {
        return '未缴纳'
      }
    },

    handleSortChange({ prop, order }: { prop: string, order: string }) {
      // 实现排序逻辑
      if (order) {
        const sortedData = [...expenseTableData.value].sort((a, b) => {
          const aVal = a[prop] || 0
          const bVal = b[prop] || 0
          return order === 'ascending' ? aVal - bVal : bVal - aVal
        })
        expenseTableData.value = sortedData
      }
    }
  }
}
</script>