<script setup lang="ts">
import {ref, reactive, computed, onMounted} from 'vue'
import {
  ElMessage,
  ElTable,
  ElTableColumn,
  ElButton,
  ElSwitch,
  ElUpload,
  ElDialog,
  ElPagination
} from "element-plus"
import {Search, Refresh, Upload, Download, Plus} from '@element-plus/icons-vue'
import request from "@/utils/requests.ts"
import type {UploadProps, UploadFile} from 'element-plus'


const IMPORT_TYPE = {
  SINGLE: 'single', // 单个文件导入
  COMPARE: 'compare' // 双文件对比导入
} as const

// 类型定义
interface IndicatorItem {
  indicator_code: string
  indicator_name: string
  fiscal_year: string
  fiscal_budget_project_code: string
  economic_classification_of_government_expenditures: string
  economic_classification_of_departmental_expenditures: string
  indicator_number: string
  fund_nature_code: string
  classification_of_expenditure_functions: string
  indicator_type_code: string
  centralized_payment_account_number: string
  fiscal_standard_code: string
  is_enable: string  // 注意：后端返回的是字符串 "1" 或 "0"
  indicator_amount: number
  indicator_balance: number

  [key: string]: any
}

// 分页响应类型
interface PaginationResponse {
  total: number
  total_pages: number
  current_page: number
  page_size: number
  data: IndicatorItem[]
  has_next: boolean
  has_prev: boolean
  next_page: number | null
  prev_page: number | null
}

interface SearchForm {
  budget_year: string
  keyword: string
}

interface UploadDialog {
  visible: boolean
  type: typeof IMPORT_TYPE[keyof typeof IMPORT_TYPE]
  title: string
  templateUrl: string
  loading: boolean
  fileList1: UploadFile[]
  fileList2: UploadFile[]
}

// 搜索表单
const searchForm = reactive<SearchForm>({
  budget_year: new Date().getFullYear().toString(),
  keyword: ''
})

// 表格数据和分页
const indicatorTableData = ref<IndicatorItem[]>([])
const pagination = ref({
  total: 0,
  total_pages: 0,
  current_page: 1,
  page_size: 20,
  has_next: false,
  has_prev: false,
  next_page: null as number | null,
  prev_page: null as number | null
})

// 加载状态
const loading = ref(false)

// 上传对话框状态
const uploadDialog = reactive<UploadDialog>({
  visible: false,
  type: IMPORT_TYPE.SINGLE,
  title: '导入指标',
  templateUrl: '/indicator/template',
  loading: false,
  fileList1: [],
  fileList2: []
})

// 获取当前年份及前后5年作为选项
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = -5; i <= 5; i++) {
    years.push({
      label: `${currentYear + i}年`,
      value: (currentYear + i).toString()
    })
  }
  return years
})

// 计算属性：布尔类型的 is_enabled
const isEnabledBoolean = (isEnable: string): boolean => {
  return isEnable === '1'
}

// 格式化金额
const formatAmount = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return '¥0.00'
  return `¥${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`
}

// 处理错误
const handleError = (error: any, defaultMessage: string): void => {
  console.error(`${defaultMessage}:`, error)
  const errorMsg = error?.response?.data?.detail || error?.message || defaultMessage
  ElMessage.error(`${errorMsg}`)
}

// 查询指标
const searchIndicators = async (page: number = 1): Promise<void> => {
  if (!searchForm.budget_year) {
    ElMessage.warning('请选择预算年度')
    return
  }

  loading.value = true
  try {
    // 注意：使用类型断言告诉 TypeScript 返回的是 PaginationResponse
    const response = await request.get('/indicator/list', {
      params: {
        budget_year: searchForm.budget_year,
        keyword: searchForm.keyword.trim(),
        page: page,
        page_size: pagination.value.page_size
      }
    }) as PaginationResponse  // 这里进行类型断言

    console.log("响应数据:", response)

    // 更新表格数据
    indicatorTableData.value = response.data || []

    // 更新分页信息
    pagination.value = {
      total: response.total || 0,
      total_pages: response.total_pages || 0,
      current_page: response.current_page || 1,
      page_size: response.page_size || pagination.value.page_size,
      has_next: response.has_next || false,
      has_prev: response.has_prev || false,
      next_page: response.next_page,
      prev_page: response.prev_page
    }

    // 显示查询结果信息
    if (indicatorTableData.value.length === 0) {
      ElMessage.info('未查询到相关数据')
    } else {
      ElMessage.success(`查询到 ${response.total} 条记录，当前第 ${response.current_page}/${response.total_pages} 页`)
    }
  } catch (error) {
    handleError(error, '查询失败')
    indicatorTableData.value = []
    pagination.value = {
      total: 0,
      total_pages: 0,
      current_page: 1,
      page_size: pagination.value.page_size,
      has_next: false,
      has_prev: false,
      next_page: null,
      prev_page: null
    }
  } finally {
    loading.value = false
  }
}
// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.value.current_page = page
  searchIndicators(page)
}

const handleSizeChange = (size: number) => {
  pagination.value.page_size = size
  pagination.value.current_page = 1
  searchIndicators(1)
}

// 重置搜索
const resetSearch = (): void => {
  searchForm.keyword = ''
  pagination.value.current_page = 1
  indicatorTableData.value = []
  pagination.value.total = 0
}

// 打开上传对话框
const openUploadDialog = (type: typeof IMPORT_TYPE[keyof typeof IMPORT_TYPE]): void => {
  uploadDialog.visible = true
  uploadDialog.type = type
  uploadDialog.title = type === IMPORT_TYPE.SINGLE ? '导入指标' : '对比生成指标'
  uploadDialog.fileList1 = []
  uploadDialog.fileList2 = []
  uploadDialog.loading = false
}

// 关闭上传对话框
const closeUploadDialog = (): void => {
  uploadDialog.visible = false
  uploadDialog.fileList1 = []
  uploadDialog.fileList2 = []
}

// 文件上传前验证
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')

  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传Excel文件（.xlsx 或 .xls）!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB!')
    return false
  }
  return true
}

const beforeCompareUpload: UploadProps['beforeUpload'] = (file: any, uploadFiles?: any[]): boolean => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')

  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传Excel文件（.xlsx 或 .xls）!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB!')
    return false
  }

  // 检查文件数量
  if (uploadFiles && uploadFiles.length > 2) {
    ElMessage.error('最多只能上传两个文件!')
    return false
  }

  return true
}
// 处理文件变化
const handleFileChange = (_file: UploadFile, fileList: UploadFile[]): void => {
  uploadDialog.fileList1 = fileList
}

// 处理对比文件变化
const handleCompareFileChange = (_file: UploadFile, fileList: UploadFile[]): void => {
  // 分离两个文件列表
  uploadDialog.fileList1 = fileList.filter((_, index) => index % 2 === 0)
  uploadDialog.fileList2 = fileList.filter((_, index) => index % 2 === 1)
}

// 处理单个文件上传
const handleSingleUpload = async (): Promise<void> => {
  if (uploadDialog.fileList1.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  uploadDialog.loading = true
  try {
    const formData = new FormData()
    formData.append('file', uploadDialog.fileList1[0].raw as File)

    await request.post('/indicator/process-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    ElMessage.success('文件上传成功，正在处理...')
    closeUploadDialog()
    // 刷新列表，回到第一页
    pagination.value.current_page = 1
    await searchIndicators(1)
  } catch (error) {
    handleError(error, '文件上传失败')
  } finally {
    uploadDialog.loading = false
  }
}

// 处理对比文件上传
const handleCompareUpload = async (): Promise<void> => {
  if (uploadDialog.fileList1.length === 0 || uploadDialog.fileList2.length === 0) {
    ElMessage.warning('请选择两个文件进行对比')
    return
  }

  uploadDialog.loading = true
  try {
    const formData = new FormData()
    formData.append('file1', uploadDialog.fileList1[0].raw as File)
    formData.append('file2', uploadDialog.fileList2[0].raw as File)

    await request.post('/indicator/process-compare', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    ElMessage.success('文件上传成功，正在处理对比数据...')
    closeUploadDialog()
    // 刷新列表，回到第一页
    pagination.value.current_page = 1
    await searchIndicators(1)
  } catch (error) {
    handleError(error, '文件对比上传失败')
  } finally {
    uploadDialog.loading = false
  }
}

// 处理上传
const handleUpload = (): void => {
  if (uploadDialog.type === IMPORT_TYPE.SINGLE) {
    handleSingleUpload()
  } else {
    handleCompareUpload()
  }
}

// 下载模板
const downloadTemplate = async (): Promise<void> => {
  try {
    const response = await request.get(uploadDialog.templateUrl, {
      responseType: 'blob'
    })

    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `指标导入模板_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('模板下载成功')
  } catch (error) {
    handleError(error, '模板下载失败')
  }
}

// 初始化
onMounted(() => {
  // 可以在这里添加一些初始化逻辑
  // 例如：自动查询当前年度的指标
  // searchIndicators()
})
</script>

<template>
  <div class="indicator-container">
    <!-- 操作按钮区域 -->
    <div class="action-container">
      <el-button
          type="primary"
          :icon="Plus"
          @click="openUploadDialog(IMPORT_TYPE.SINGLE)"
          :disabled="loading"
      >
        导入指标
      </el-button>
      <el-button
          type="success"
          :icon="Upload"
          @click="openUploadDialog(IMPORT_TYPE.COMPARE)"
          :disabled="loading"
      >
        对比生成指标
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <div class="search-group">
        <div class="search-item">
          <span class="search-label">预算年度：</span>
          <el-select
              v-model="searchForm.budget_year"
              placeholder="请选择预算年度"
              style="width: 200px; margin-right: 20px;"
              :disabled="loading"
              clearable
          >
            <el-option
                v-for="year in yearOptions"
                :key="year.value"
                :label="year.label"
                :value="year.value"
            />
          </el-select>
        </div>

        <div class="search-item">
          <span class="search-label">关键字：</span>
          <el-input
              v-model="searchForm.keyword"
              placeholder="请输入指标代码"
              clearable
              :maxlength="50"
              style="width: 300px; margin-right: 20px;"
              @keyup.enter="() => searchIndicators(1)"
              :disabled="loading"
          />
        </div>

        <div class="search-actions">
          <el-button
              type="primary"
              :icon="Search"
              @click="() => searchIndicators(1)"
              :loading="loading"
              :disabled="!searchForm.budget_year"
          >
            查询
          </el-button>
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
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <div class="table-info">
        共 {{ pagination.total }} 条记录，第 {{ pagination.current_page }}/{{ pagination.total_pages }} 页
        <span v-if="indicatorTableData.length > 0" class="table-stats">
          显示 {{ indicatorTableData.length }} 条
        </span>
      </div>

      <el-table
          :data="indicatorTableData"
          border
          stripe
          style="width: 100%; margin-top: 10px;"
          v-loading="loading"
          empty-text="暂无数据"
          :max-height="600"
          highlight-current-row
          size="small"
      >
        <el-table-column
            prop="indicator_code"
            label="预算指标代码"
            width="180"
            sortable
            fixed
            show-overflow-tooltip
        />
        <el-table-column
            prop="indicator_name"
            label="预算指标名称"
            width="200"
            show-overflow-tooltip
        />
        <el-table-column
            prop="fiscal_year"
            label="预算年度"
            width="100"
            align="center"
        />
        <el-table-column
            prop="fiscal_budget_project_code"
            label="财政预算项目代码"
            width="180"
            show-overflow-tooltip
        />
        <el-table-column
            prop="economic_classification_of_government_expenditures"
            label="政府支出经济分类"
            width="150"
            show-overflow-tooltip
        />
        <el-table-column
            prop="economic_classification_of_departmental_expenditures"
            label="部门支出经济分类"
            width="150"
            show-overflow-tooltip
        />
        <el-table-column
            prop="indicator_number"
            label="本级指标文号"
            width="150"
            show-overflow-tooltip
        />
        <el-table-column
            prop="fund_nature_code"
            label="资金性质代码"
            width="120"
        />
        <el-table-column
            prop="classification_of_expenditure_functions"
            label="支出功能分类"
            width="150"
            show-overflow-tooltip
        />
        <el-table-column
            prop="indicator_type_code"
            label="指标类型代码"
            width="120"
        />
        <el-table-column
            prop="centralized_payment_account_number"
            label="集中支付科目编号"
            width="150"
            show-overflow-tooltip
        />
        <el-table-column
            prop="fiscal_standard_code"
            label="财政标准代码"
            width="150"
            show-overflow-tooltip
        />
        <el-table-column
            label="是否启用"
            width="100"
            align="center"
        >
          <template #default="{ row }">
            <el-switch
                :model-value="isEnabledBoolean(row.is_enable)"
                :disabled="true"
                :active-value="true"
                :inactive-value="false"
            />
            <span class="enable-text" :class="{ 'enabled': isEnabledBoolean(row.is_enable) }">
              {{ isEnabledBoolean(row.is_enable) ? '已启用' : '已禁用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
            prop="indicator_amount"
            label="指标金额"
            width="150"
            align="right"
            sortable
        >
          <template #default="{ row }">
            {{ formatAmount(row.indicator_amount) }}
          </template>
        </el-table-column>
        <el-table-column
            prop="indicator_balance"
            label="指标余额"
            width="150"
            align="right"
            sortable
        >
          <template #default="{ row }">
            <span :class="{ 'balance-warning': row.indicator_balance <= 0 }">
              {{ formatAmount(row.indicator_balance) }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-container" v-if="pagination.total > 0">
        <el-pagination
            v-model:current-page="pagination.current_page"
            v-model:page-size="pagination.page_size"
            :page-sizes="[10, 20, 50, 100]"
            :small="false"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
        v-model="uploadDialog.visible"
        :title="uploadDialog.title"
        width="600px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
    >
      <div class="upload-container">
        <!-- 模板下载 -->
        <div class="template-section" v-if="uploadDialog.type === IMPORT_TYPE.SINGLE">
          <div class="section-title">
            <span>下载模板</span>
            <el-button
                type="primary"
                :icon="Download"
                @click="downloadTemplate"
                size="small"
                :disabled="uploadDialog.loading"
            >
              下载Excel模板
            </el-button>
          </div>
          <div class="section-description">
            模板包含字段：指标ID、指标名称、预算年度、预算项目代码、功能分类、指标文号、资金性质编码、指标类型编码、零余额科目
          </div>
        </div>

        <!-- 单文件上传 -->
        <div class="upload-section" v-if="uploadDialog.type === IMPORT_TYPE.SINGLE">
          <div class="section-title">上传Excel文件</div>
          <el-upload
              class="upload-demo"
              :before-upload="beforeUpload"
              :on-change="handleFileChange"
              :file-list="uploadDialog.fileList1"
              :limit="1"
              :auto-upload="false"
              accept=".xlsx,.xls"
              drag
          >
            <el-icon class="el-icon--upload">
              <upload/>
            </el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                请上传Excel文件（.xlsx 或 .xls），且不超过10MB
              </div>
            </template>
          </el-upload>
        </div>

        <!-- 双文件对比上传 -->
        <div class="compare-upload-section" v-else>
          <div class="section-title">对比文件说明</div>
          <div class="compare-description">
            <p>请上传两个Excel文件进行对比生成指标：</p>
            <div class="file-description">
              <div class="file-item">
                <strong>文件1：</strong>
                <span>入账通知书单号、指标ID、指标文号、预算单位编码、预算单位、部门编码、部门、业务处室编码、业务处室、资金性质编码、资金性质、功能分类编码、功能分类、金额、月份、付款账户号、付款账户名称、付款账户开户行、是否已打印、创建日期、用途、操作</span>
              </div>
              <div class="file-item">
                <strong>文件2：</strong>
                <span>是否"超长期特别国债"及省级配套资金、资金来源编码、资金来源、指标额度ID、债券名称、指标说明（摘要）、指标类型编码、指标类型、三保目录编码、三保目录、是否三保专户管理资金、是否"百千万工程"重点任务保障专项资金、已批复计划金额、可用金额、调减金额、科目调账金额、已支出金额、在途支付金额、是否债券、是否基建、基建合同、基建合同编码、计划额度编号、一级项目编码、一级项目名称、预算单位编码、预算单位、预算级次编码、预算级次、预算项目代码、预算项目名称、功能分类编码、功能分类、项目类别编码、项目类别、资金性质编码、资金性质、指标来源编码、指标来源、直达资金编码、直达资金、业务处室编码、业务处室、业务归口科室编码、业务归口科室、资金归口科室编码、资金归口科室、币种编码、币种、指标文号、是否政府采购、承接主体、支付方式编码、支付方式、数据状态、凭证单号、部门编码、部门、政府经济分类编码、政府经济分类、付款账户号、付款账户名称、付款账户开户行、收款账户号、清算账户户名、清算账户户名、清算账户开户行、汇总清算通知单单号、签收状态、创建日期、终审日期、来源标识、是否有政府购买服务、政府购买服务目录编码、政府购买服务目录</span>
              </div>
            </div>
          </div>

          <div class="section-title">上传文件</div>
          <el-upload
              class="upload-demo"
              :before-upload="beforeCompareUpload"
              :on-change="handleCompareFileChange"
              :file-list="[...uploadDialog.fileList1, ...uploadDialog.fileList2]"
              :limit="2"
              :auto-upload="false"
              accept=".xlsx,.xls"
              multiple
          >
            <el-icon class="el-icon--upload">
              <upload/>
            </el-icon>
            <div class="el-upload__text">
              将两个文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                请上传两个Excel文件，每个文件不超过10MB
              </div>
            </template>
          </el-upload>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeUploadDialog" :disabled="uploadDialog.loading">取消</el-button>
          <el-button
              type="primary"
              @click="handleUpload"
              :loading="uploadDialog.loading"
              :disabled="uploadDialog.type === IMPORT_TYPE.SINGLE ? uploadDialog.fileList1.length === 0 : uploadDialog.fileList1.length === 0 || uploadDialog.fileList2.length === 0"
          >
            确认上传
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.indicator-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 40px);
}

.action-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
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
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.search-item {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.search-label {
  width: auto;
  text-align: right;
  font-weight: 500;
  color: #606266;
  flex-shrink: 0;
  font-size: 14px;
  white-space: nowrap;
}

.search-actions {
  margin-left: auto;
  display: flex;
  gap: 12px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-stats {
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
}

.enable-text {
  margin-left: 8px;
  font-size: 12px;

  &.enabled {
    color: #67c23a;
  }

  &:not(.enabled) {
    color: #f56c6c;
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.balance-warning {
  color: #f56c6c;
  font-weight: 500;
}

.upload-container {
  .template-section,
  .upload-section,
  .compare-upload-section {
    margin-bottom: 24px;
  }

  .section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }

  .section-description {
    font-size: 14px;
    color: #606266;
    line-height: 1.5;
    margin-bottom: 16px;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border-left: 4px solid #409eff;
  }

  .compare-description {
    p {
      margin-bottom: 12px;
      color: #303133;
      font-weight: 500;
    }
  }

  .file-description {
    .file-item {
      margin-bottom: 12px;

      strong {
        display: block;
        margin-bottom: 4px;
        color: #409eff;
      }

      span {
        font-size: 13px;
        color: #606266;
        line-height: 1.4;
        display: inline-block;
        padding: 8px 12px;
        background-color: #f8f9fa;
        border-radius: 4px;
        width: 100%;
      }
    }
  }
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .search-group {
    flex-direction: column;
    align-items: stretch;
  }

  .search-item {
    flex-wrap: wrap;

    .search-label {
      width: 100px;
      margin-bottom: 8px;
    }
  }

  .search-actions {
    margin-left: 0;
    margin-top: 16px;
  }
}

@media (max-width: 768px) {
  .indicator-container {
    padding: 12px;
  }

  .action-container,
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

  .table-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  :deep(.el-table) {
    font-size: 13px;

    .el-table__cell {
      padding: 6px 0;
    }
  }
}

@media (max-width: 576px) {
  .indicator-container {
    padding: 8px;
  }

  .action-container,
  .search-container,
  .table-container {
    padding: 12px;
  }

  :deep(.el-table) {
    font-size: 12px;
  }
}
</style>