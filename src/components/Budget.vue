<script setup lang="ts">
import {computed, reactive, ref} from 'vue'
import {ElMessage} from 'element-plus'
import {Search, UploadFilled, Download, Expand, Fold} from '@element-plus/icons-vue'
import type {AxiosResponse} from 'axios'
import request from '@/utils/requests.ts'
import * as XLSX from 'xlsx'

// ===================== 原有类型定义 =====================
interface LaborItem {
  voucher_date: string
  voucher_number: string
  program_id: string
  department_id: string
  abstract: string
  amount: number
  operator: string
}

interface ApiResponse<T> {
  data: T[]
  total: number
  [key: string]: any
}

// ===================== 批量查询接口类型 =====================
interface BatchBudgetDetail {
  voucher_date: string
  voucher_number: string
  program_id: number
  department_id: number
  abstract: string
  amount: number
  operator: string
}

interface BatchBudgetRow {
  program_id: string
  department_id: string
  total: number
  detail: BatchBudgetDetail[]
}


// 年度选项
const yearOptions = ref([
  {value: '2026', label: '2026年'},
  {value: '2025', label: '2025年'},
  {value: '2024', label: '2024年'}
])

// 月份选项
const monthOptions = ref([
  {value: '1', label: '1月'},
  {value: '2', label: '2月'},
  {value: '3', label: '3月'},
  {value: '4', label: '4月'},
  {value: '5', label: '5月'},
  {value: '6', label: '6月'},
  {value: '7', label: '7月'},
  {value: '8', label: '8月'},
  {value: '9', label: '9月'},
  {value: '10', label: '10月'},
  {value: '11', label: '11月'},
  {value: '12', label: '12月'}
])

// ===================== Tab激活标识 =====================
const activeTab = ref('单个项目预算下发明细')
const loading = reactive({
  labor: false,
  batch: false
})

// 原有表单数据
const formData = reactive({
  year: '2026',
  start_month: '1',
  end_month: '13',
  program_id: '',
  department_id: '',
  subject_code: '',
  filter_state: 1
})

// 原有表格数据
const laborTableData = ref<LaborItem[]>([])
const laborPagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 原有统计总金额
const totalAmount = computed(() => {
  return laborTableData.value.reduce((sum, item) => {
    return sum + (Number(item.amount) || 0)
  }, 0)
})

// ===================== 批量查询响应式变量 =====================
const uploadFile = ref<File | null>(null)
const batchTableData = ref<BatchBudgetRow[]>([])
const batchErrorList = ref<string[]>([])
const expandedRows = ref<Set<string>>(new Set()) // 记录展开的行

const batchTotalBudget = computed(() => {
  return batchTableData.value.reduce((sum, row) => sum + Number(row.total || 0), 0)
})

// ===================== 原有函数 =====================
async function fetchVoucherData() {
  if (!formData.program_id) {
    ElMessage.warning('请输入项目编号')
    return
  }

  if (!formData.department_id) {
    ElMessage.warning('请输入部门编号')
    return
  }

  if (!formData.year) {
    ElMessage.warning('请选择年度')
    return
  }

  loading.labor = true
  try {
    const params: any = {
      year: formData.year,
      program_id: formData.program_id,
      department_id: formData.department_id,
      start_month: formData.start_month,
      end_month: formData.end_month,
      filter_state: formData.filter_state
    }

    const response: AxiosResponse<ApiResponse<LaborItem>> = await request.get('/budget/one_program', {
      params: params
    })

    if (Array.isArray(response.data)) {
      laborTableData.value = response.data
      laborPagination.total = response.data.length
    } else if (response.data && Array.isArray((response.data as any).data)) {
      laborTableData.value = (response.data as any).data
      laborPagination.total = (response.data as any).total || 0
    } else if (Array.isArray(response)) {
      laborTableData.value = response
      laborPagination.total = response.length
    }

    if (laborTableData.value.length === 0) {
      ElMessage.info('暂无凭证明细数据')
    } else {
      ElMessage.success(`查询成功，共 ${laborTableData.value.length} 条记录`)
    }
  } catch (error) {
    console.error('请求凭证明细失败:', error)
    ElMessage.error('获取凭证明细失败')
    laborTableData.value = []
    laborPagination.total = 0
  } finally {
    loading.labor = false
  }
}

function resetForm() {
  formData.year = '2026'
  formData.program_id = ''
  formData.department_id = ''
  formData.subject_code = ''
  laborTableData.value = []
  laborPagination.total = 0
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

function handleYearChange() {
  if (laborTableData.value.length > 0) {
    laborTableData.value = []
    laborPagination.total = 0
  }
}

// ===================== 批量查询函数 =====================
function handleFileUpload(uploadRaw: any) {
  const realFile = uploadRaw.raw as File
  uploadFile.value = realFile
  ElMessage.success(`已选择文件：${realFile.name}`)
  batchTableData.value = []
  batchErrorList.value = []
  expandedRows.value = new Set()
  return false
}

async function fetchBatchBudget() {
  if (!uploadFile.value) {
    ElMessage.warning('请先上传包含项目、部门编号的Excel文件')
    return
  }

  loading.batch = true
  const formData = new FormData()
  formData.append('file', uploadFile.value)

  try {
    const res: AxiosResponse<any> = await request.post('/budget/programs', formData)
    console.log('完整axios响应：', res)

    let result = res.data

    if (!result && res && 'data_list' in res) {
      result = res as any
    }

    console.log('处理后的数据：', result)

    if (result && typeof result === 'object' && 'detail' in result) {
      const errMsg = result.detail?.[0]?.msg || '文件解析失败，请检查Excel格式'
      ElMessage.error(`上传校验失败：${errMsg}`)
      batchTableData.value = []
      batchErrorList.value = []
      expandedRows.value = new Set()
      return
    }

    if (result && typeof result === 'object' && 'data_list' in result) {
      if (Array.isArray(result.data_list)) {
        batchTableData.value = result.data_list
        batchErrorList.value = Array.isArray(result.error_list) ? result.error_list : []
        expandedRows.value = new Set() // 重置展开状态
        ElMessage.success(`批量查询完成，成功${batchTableData.value.length}条，异常${batchErrorList.value.length}条`)
        return
      }
    }

    if (Array.isArray(result)) {
      batchTableData.value = result
      batchErrorList.value = []
      expandedRows.value = new Set()
      ElMessage.success(`批量查询完成，成功${batchTableData.value.length}条`)
      return
    }

    console.error('数据格式异常，result:', result)
    ElMessage.warning('接口返回数据格式异常，后端无有效数据返回')
    batchTableData.value = []
    batchErrorList.value = []
    expandedRows.value = new Set()
  } catch (err) {
    console.error('批量查询异常：', err)
    ElMessage.error('批量查询接口请求失败，请检查服务或文件格式')
    batchTableData.value = []
    batchErrorList.value = []
    expandedRows.value = new Set()
  } finally {
    loading.batch = false
  }
}

function resetBatch() {
  uploadFile.value = null
  batchTableData.value = []
  batchErrorList.value = []
  expandedRows.value = new Set()
}

function toggleExpand(row: BatchBudgetRow) {
  const key = `${row.program_id}_${row.department_id}`
  if (expandedRows.value.has(key)) {
    expandedRows.value.delete(key)
  } else {
    expandedRows.value.add(key)
  }
}

function isRowExpanded(row: BatchBudgetRow): boolean {
  const key = `${row.program_id}_${row.department_id}`
  return expandedRows.value.has(key)
}

function exportBatchExcel() {
  if (!batchTableData.value.length) {
    ElMessage.warning('没有数据可导出')
    return
  }

  // 准备导出数据（包含明细）
  const exportData: any[] = []
  batchTableData.value.forEach(item => {
    if (item.detail && item.detail.length > 0) {
      item.detail.forEach(detail => {
        exportData.push({
          '项目编号': item.program_id,
          '部门编号': item.department_id,
          '凭证日期': detail.voucher_date,
          '凭证号': detail.voucher_number,
          '摘要': detail.abstract,
          '金额': detail.amount,
          '操作者': detail.operator
        })
      })
    } else {
      exportData.push({
        '项目编号': item.program_id,
        '部门编号': item.department_id,
        '凭证日期': '',
        '凭证号': '',
        '摘要': '',
        '金额': item.total,
        '操作者': ''
      })
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)
  XLSX.utils.book_append_sheet(wb, ws, '批量预算明细')
  XLSX.writeFile(wb, `批量预算明细_${new Date().toLocaleDateString()}.xlsx`)
  ElMessage.success('导出成功')
}
</script>

<template>
  <div class="voucher-container">
    <el-tabs v-model="activeTab" class="demo-tabs">
      <!-- 单个项目预算下发明细 -->
      <el-tab-pane label="单个项目预算下发明细" name="单个项目预算下发明细">
        <!-- 查询表单 -->
        <el-card class="query-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>查询条件</span>
            </div>
          </template>

          <el-form :model="formData" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="年度" prop="year" required>
                  <el-select
                      v-model="formData.year"
                      placeholder="请选择年度"
                      style="width: 100%"
                      @change="handleYearChange"
                  >
                    <el-option
                        v-for="item in yearOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="起始月" prop="start_month" required>
                  <el-select
                      v-model="formData.start_month"
                      placeholder="请选择月份"
                      style="width: 100%"
                  >
                    <el-option
                        v-for="item in monthOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="结束月" prop="end_month" required>
                  <el-select
                      v-model="formData.end_month"
                      placeholder="请选择月份"
                      style="width: 100%"
                  >
                    <el-option
                        v-for="item in monthOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="项目编号" prop="program_id" required>
                  <el-input
                      v-model="formData.program_id"
                      placeholder="请输入项目编号"
                      clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="部门编号" prop="department_id" required>
                  <el-input
                      v-model="formData.department_id"
                      placeholder="请输入部门编号"
                      clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item>
              <el-button type="primary" @click="fetchVoucherData" :loading="loading.labor">
                <el-icon class="el-icon--left">
                  <Search/>
                </el-icon>
                查询
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 统计信息 -->
        <el-card class="statistics-card" shadow="never" v-if="laborTableData.length > 0">
          <template #header>
            <div class="card-header">
              <span>统计信息 ({{ formData.year }}年)</span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">总记录数</div>
                <div class="stat-value">{{ laborTableData.length }} 条</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">总金额</div>
                <div class="stat-value amount">{{ formatAmount(totalAmount) }} 元</div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 数据表格 -->
        <el-card class="table-card" shadow="never" v-if="laborTableData.length > 0">
          <template #header>
            <div class="card-header">
              <span>凭证明细 ({{ formData.year }}年)</span>
            </div>
          </template>

          <el-table
              :data="laborTableData"
              style="width: 100%"
              v-loading="loading.labor"
              border
              stripe
              height="500"
          >
            <el-table-column
                prop="voucher_date"
                label="凭证日期"
                width="120"
                fixed="left"
            />
            <el-table-column
                prop="voucher_number"
                label="凭证号"
                width="120"
                fixed="left"
            />
            <el-table-column
                prop="program_id"
                label="项目编号"
                width="120"
            />
            <el-table-column
                prop="department_id"
                label="部门编号"
                width="120"
            />
            <el-table-column
                prop="abstract"
                label="摘要"
                min-width="200"
                show-overflow-tooltip
            />
            <el-table-column
                prop="amount"
                label="金额"
                width="120"
                align="right"
            >
              <template #default="{ row }">
                {{ formatAmount(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column
                prop="operator"
                label="操作者"
                min-width="200"
            />
          </el-table>

          <div class="pagination-container" v-if="laborPagination.total > laborPagination.pageSize">
            <el-pagination
                v-model:current-page="laborPagination.currentPage"
                v-model:page-size="laborPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="laborPagination.total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="fetchVoucherData"
                @current-change="fetchVoucherData"
            />
          </div>
        </el-card>

        <!-- 空状态 -->
        <el-empty
            v-if="!loading.labor && laborTableData.length === 0"
            description="暂无数据，请输入查询条件后点击查询按钮"
        />
      </el-tab-pane>

      <!-- 批量项目预算查询 -->
      <el-tab-pane label="批量项目预算查询" name="批量项目预算查询">
        <el-card class="query-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>批量文件上传</span>
            </div>
          </template>
          <div class="batch-upload-area">
            <el-upload
                :on-change="handleFileUpload"
                :auto-upload="false"
                accept=".xlsx,.xls"
                drag
                style="width: 400px"
            >
              <el-icon size="40"><UploadFilled /></el-icon>
              <div class="el-upload__text">将Excel文件拖到此处，或<em>点击上传</em></div>
              <template #tip>仅支持 xlsx/xls，文件内需包含项目编号、部门编号列</template>
            </el-upload>
            <div class="batch-btn-group" style="margin-top:16px;">
              <el-button type="primary" :loading="loading.batch" @click="fetchBatchBudget">
                <el-icon class="el-icon--left"><Search /></el-icon>批量查询
              </el-button>
              <el-button type="success" @click="exportBatchExcel" v-if="batchTableData.length">
                <el-icon class="el-icon--left"><Download /></el-icon>导出Excel
              </el-button>
              <el-button @click="resetBatch">重置</el-button>
            </div>
          </div>
        </el-card>

        <!-- 批量统计卡片 -->
        <el-card class="statistics-card" shadow="never" v-if="batchTableData.length">
          <template #header><span>批量查询统计</span></template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">有效数据行数</div>
                <div class="stat-value">{{ batchTableData.length }} 条</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">异常数据行数</div>
                <div class="stat-value">{{ batchErrorList.length }} 条</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">合计已下发预算</div>
                <div class="stat-value amount">{{ formatAmount(batchTotalBudget) }} 元</div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 异常信息卡片 -->
        <el-card shadow="never" class="error-card" v-if="batchErrorList.length">
          <template #header><span>数据异常列表</span></template>
          <ul class="error-list">
            <li v-for="(err, idx) in batchErrorList" :key="idx" style="color:#F56C6C;line-height:2;">{{ err }}</li>
          </ul>
        </el-card>

        <!-- 批量数据表格 - 支持展开显示明细 -->
        <el-card class="table-card" shadow="never" v-if="batchTableData.length">
          <template #header><span>批量预算下发结果</span></template>
          <el-table
              :data="batchTableData"
              border
              stripe
              height="500"
              v-loading="loading.batch"
              style="width:100%;margin-top:10px"
              row-key="program_id"
          >
            <!-- 展开按钮列 -->
            <el-table-column width="60" align="center">
              <template #default="{ row }">
                <el-button
                    :type="isRowExpanded(row) ? 'primary' : 'default'"
                    size="small"
                    text
                    @click="toggleExpand(row)"
                >
                  <el-icon>
                    <Expand v-if="!isRowExpanded(row)" />
                    <Fold v-else />
                  </el-icon>
                </el-button>
              </template>
            </el-table-column>

            <el-table-column label="项目编号" prop="program_id" width="180"/>
            <el-table-column label="部门编号" prop="department_id" width="180"/>
            <el-table-column label="已下发预算(元)" prop="total" align="right" min-width="200">
              <template #default="{row}">
                {{ formatAmount(Number(row.total || 0)) }}
              </template>
            </el-table-column>
            <el-table-column label="明细条数" prop="detail" align="center" width="120">
              <template #default="{row}">
                <el-tag size="small" :type="row.detail?.length ? 'success' : 'info'">
                  {{ row.detail?.length || 0 }} 条
                </el-tag>
              </template>
            </el-table-column>

            <!-- 展开行 - 显示明细 -->
            <el-table-column type="expand">
              <template #default="{ row }">
                <div v-if="row.detail && row.detail.length > 0" class="detail-table-container">
                  <el-table
                      :data="row.detail"
                      border
                      size="small"
                      style="width: 100%"
                  >
                    <el-table-column prop="voucher_date" label="凭证日期" width="120" />
                    <el-table-column prop="voucher_number" label="凭证号" width="120" />
                    <el-table-column prop="program_id" label="项目编号" width="120" />
                    <el-table-column prop="department_id" label="部门编号" width="120" />
                    <el-table-column prop="abstract" label="摘要" min-width="200" show-overflow-tooltip />
                    <el-table-column prop="amount" label="金额" width="120" align="right">
                      <template #default="{ row: detailRow }">
                        {{ formatAmount(detailRow.amount) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="operator" label="操作者" width="120" />
                  </el-table>
                  <div class="detail-summary">
                    小计：<span class="amount">{{ formatAmount(row.total) }}</span> 元
                  </div>
                </div>
                <div v-else class="no-detail">
                  <el-empty description="暂无明细数据" :image-size="60" />
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 批量空状态 -->
        <el-empty v-if="!loading.batch && !batchTableData.length" description="上传Excel文件后执行批量查询"/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.voucher-container {
  padding: 20px;

  .query-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .statistics-card {
    margin-bottom: 20px;

    .stat-item {
      padding: 10px;
      border-left: 3px solid #409EFF;
      background-color: #f5f7fa;
      border-radius: 4px;

      .stat-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 18px;
        font-weight: bold;
        color: #303133;

        &.amount {
          color: #67C23A;
        }
      }
    }
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .el-table {
      margin-top: 10px;
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .error-card {
    margin-bottom: 20px;

    .error-list {
      padding-left: 12px;
    }
  }

  .batch-upload-area {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-table-container {
    padding: 20px;
    background-color: #f5f7fa;

    .detail-summary {
      margin-top: 12px;
      text-align: right;
      font-weight: bold;
      font-size: 14px;

      .amount {
        color: #67C23A;
        font-size: 16px;
      }
    }
  }

  .no-detail {
    padding: 20px;
    background-color: #f5f7fa;
    text-align: center;
  }
}
</style>