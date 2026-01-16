<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElTable, ElTableColumn, ElButton, ElPopconfirm, ElTag } from "element-plus"
import { Search, Refresh } from '@element-plus/icons-vue'
import request from "@/utils/requests.ts"
import type { ResponseData } from '@/types/request'

// 常量定义
const BINDING_STATUS = {
  ALL: '0',
  BOUND: '1',
  UNBOUND: '2'
} as const

const BINDING_STATUS_OPTIONS = [
  { label: '全部状态', value: BINDING_STATUS.ALL },
  { label: '已绑定', value: BINDING_STATUS.BOUND },
  { label: '未绑定', value: BINDING_STATUS.UNBOUND }
]

const TAG_TYPE = {
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger'
} as const

// 类型定义
interface InvoiceItem {
  invoice_id: string
  business_id: string
  work_id: string
  reservation_number: string
  billing_entity: string
  authorized_amount: number
  invoice_date: string
  is_cancelled: number
  abstract: string
  [key: string]: any
}

interface DisplayInvoiceItem extends InvoiceItem {
  isBound: boolean
  statusText: string
  statusType: string
}

interface SearchForm {
  work_id: string
  binding_status: typeof BINDING_STATUS[keyof typeof BINDING_STATUS]
}

// 搜索表单
const searchForm = reactive<SearchForm>({
  work_id: '',
  binding_status: BINDING_STATUS.ALL
})

// 表格数据
const invoiceTableData = ref<InvoiceItem[]>([])

// 加载状态
const loading = ref(false)

// 工具方法：判断是否绑定
const isBound = (item: InvoiceItem): boolean => {
  return !!(item.business_id && item.business_id !== 'KS')
}

// 工具方法：获取状态文本
const getStatusText = (item: InvoiceItem): string => {
  return isBound(item) ? '已绑定' : '未绑定'
}

// 工具方法：获取状态类型
const getStatusType = (item: InvoiceItem): typeof TAG_TYPE[keyof typeof TAG_TYPE] => {
  return isBound(item) ? TAG_TYPE.SUCCESS : TAG_TYPE.WARNING
}

// 计算属性：过滤后的表格数据
const filteredTableData = computed<InvoiceItem[]>(() => {
  const { binding_status } = searchForm

  if (binding_status === BINDING_STATUS.ALL) {
    return invoiceTableData.value
  }

  return invoiceTableData.value.filter(item => {
    const bound = isBound(item)
    return binding_status === BINDING_STATUS.BOUND ? bound : !bound
  })
})

// 计算属性：表格显示数据
const displayTableData = computed<DisplayInvoiceItem[]>(() => {
  return filteredTableData.value.map(item => ({
    ...item,
    isBound: isBound(item),
    statusText: getStatusText(item),
    statusType: getStatusType(item)
  }))
})

// 工具方法：格式化金额
const formatAmount = (amount: number | undefined): string => {
  return `¥${(amount || 0).toFixed(2)}`
}

// 处理查询响应
const handleQueryResponse = (response: ResponseData<InvoiceItem[]>): void => {


  if (Array.isArray(response)) {
    invoiceTableData.value = response
    if (response.length === 0) {
      ElMessage.info('未查询到相关数据')
    }
  } else {
    invoiceTableData.value = []
    ElMessage.info( '未查询到相关数据')
  }
}

// 处理错误
const handleError = (error: any, defaultMessage: string): void => {
  console.error(`${defaultMessage}:`, error)
  ElMessage.error(`${defaultMessage}，请稍后重试`)
}

// 校验工号
const validateWorkId = (workId: string): boolean => {
  if (!workId.trim()) {
    ElMessage.warning('请输入工号')
    return false
  }
  // 可以添加更多的验证逻辑
  return true
}

// 根据工号查询
const searchByWorkId = async (): Promise<void> => {
  if (!validateWorkId(searchForm.work_id)) return

  loading.value = true
  try {
    const response = await request.get<ResponseData<InvoiceItem[]>>('/invoice/list', {
      params: {
        work_id: searchForm.work_id.trim()
      }
    })
    handleQueryResponse(response)
  } catch (error) {
    handleError(error, '查询失败')
    invoiceTableData.value = []
  } finally {
    loading.value = false
  }
}

// 处理解绑响应
const handleUnbindResponse = (response: any): boolean => {
  if (response === true || response === 'true') {
    ElMessage.success('解绑成功')
    return true
  }

  ElMessage.error(response?.message || '解绑失败')
  return false
}

// 解除绑定
const unbindInvoice = async (row: InvoiceItem): Promise<void> => {
  if (row.is_cancelled === 1) {
    ElMessage.warning('该发票已作废，无法解绑')
    return
  }

  try {
    const response = await request.get('/invoice/unbind', {
      params: {
        invoice_id: row.invoice_id.trim()
      }
    })

    if (handleUnbindResponse(response)) {
      await searchByWorkId()
    }
  } catch (error) {
    handleError(error, '解绑失败')
  }
}

// 重置搜索
const resetSearch = (): void => {
  searchForm.work_id = ''
  searchForm.binding_status = BINDING_STATUS.ALL
  invoiceTableData.value = []
}

// 处理键盘事件
const handleKeyUp = (event: KeyboardEvent): void => {
  if (event.key === 'Enter') {
    searchByWorkId()
  }
}

// 可选：添加一些初始数据或逻辑
onMounted(() => {
  // 可以在这里添加一些初始化逻辑
})
</script>

<template>
  <div class="authorization-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <div class="search-group">
        <div class="search-item">
          <span class="search-label">工号查询：</span>
          <el-input
              v-model="searchForm.work_id"
              placeholder="请输入工号"
              clearable
              :maxlength="20"
              style="width: 200px; margin-right: 10px;"
              @keyup="handleKeyUp"
              :disabled="loading"
          />
          <el-button
              type="primary"
              :icon="Search"
              @click="searchByWorkId"
              :loading="loading"
              :disabled="!searchForm.work_id.trim()"
          >
            查询
          </el-button>
        </div>

        <div class="search-item">
          <span class="search-label">绑定状态：</span>
          <el-select
              v-model="searchForm.binding_status"
              placeholder="请选择绑定状态"
              style="width: 200px;"
              :disabled="loading"
          >
            <el-option
                v-for="option in BINDING_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
            />
          </el-select>
        </div>
      </div>

      <div class="search-actions">
        <el-button
            type="info"
            :icon="Refresh"
            @click="resetSearch"
            :disabled="loading"
        >
          重置
        </el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <div class="table-info">
        共 {{ filteredTableData.length }} 条记录
        <template v-if="searchForm.binding_status !== BINDING_STATUS.ALL">
          （{{ searchForm.binding_status === BINDING_STATUS.BOUND ? '已绑定' : '未绑定' }}）
        </template>
      </div>

      <el-table
          :data="displayTableData"
          border
          stripe
          style="width: 100%; margin-top: 10px;"
          v-loading="loading"
          empty-text="暂无数据"
          :max-height="600"
          highlight-current-row
      >
        <el-table-column
            prop="invoice_id"
            label="发票号"
            width="180"
            sortable
        />
        <el-table-column
            prop="business_id"
            label="业务编号"
            width="120"
        />
        <el-table-column
            prop="work_id"
            label="经办人工号"
            width="120"
        />
        <el-table-column
            prop="reservation_number"
            label="预约单号"
            width="120"
        />
        <el-table-column
            prop="billing_entity"
            label="开票单位"
            width="150"
            show-overflow-tooltip
        />
        <el-table-column
            prop="abstract"
            label="开票内容"
            width="150"
            show-overflow-tooltip
        />
        <el-table-column
            prop="amount"
            label="金额"
            width="120"
            sortable
        >
          <template #default="{ row }">
            {{ formatAmount(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column
            prop="invoice_date"
            label="开票日期"
            width="150"
            sortable
        />

        <el-table-column
            label="绑定状态"
            width="100"
            align="center"
        >
          <template #default="{ row }">
            <el-tag
                :type="row.statusType"
                size="small"
                effect="light"
            >
              {{ row.statusText }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
            label="操作"
            width="120"
            fixed="right"
            align="center"
        >
          <template #default="{ row }">
            <el-popconfirm
                v-if="row.isBound && row.is_cancelled !== 1"
                title="确定要解除绑定吗？"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="unbindInvoice(row)"
            >
              <template #reference>
                <el-button
                    type="danger"
                    size="small"
                    :disabled="loading"
                >
                  解绑
                </el-button>
              </template>
            </el-popconfirm>
            <span
                v-else-if="row.is_cancelled === 1"
                class="disabled-text"
            >
              已作废
            </span>
            <span
                v-else
                class="disabled-text"
            >
              -
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.authorization-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 40px);
}

.search-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.search-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  &:first-child {
    margin-bottom: 10px;
  }
}

.search-label {
  width: 80px;
  text-align: right;
  font-weight: 500;
  color: #606266;
  flex-shrink: 0;
  font-size: 14px;
}

.search-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
}

.table-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.table-info {
  font-size: 14px;
  color: #909399;
  margin-bottom: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.disabled-text {
  color: #c0c4cc;
  font-size: 12px;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .authorization-container {
    padding: 12px;
  }

  .search-container,
  .table-container {
    padding: 16px;
    border-radius: 6px;
  }

  .search-item {
    flex-direction: column;
    align-items: stretch;
  }

  .search-label {
    width: auto;
    text-align: left;
    margin-bottom: 6px;
  }

  .search-group .el-input,
  .search-group .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }

  :deep(.el-table) {
    font-size: 13px;

    .el-table__cell {
      padding: 6px 0;
    }
  }
}

@media (max-width: 576px) {
  .authorization-container {
    padding: 8px;
  }

  .search-container,
  .table-container {
    padding: 12px;
  }

  :deep(.el-table) {
    font-size: 12px;
  }
}
</style>