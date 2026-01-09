<template>
  <div class="approval-workflow-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <div class="form-item">
        <el-input
            v-model="searchForm.work_id"
            placeholder="请输入工号"
            clearable
            style="width: 200px;"
            @keyup.enter="searchQuery"
        >
          <template #prepend>工号</template>
        </el-input>
      </div>
      <el-button @click="searchQuery" :loading="loading.list">查询</el-button>
    </div>

    <!-- 表格区域 -->
    <div class="table-area">
      <el-table
          :data="applyTableData"
          border
          stripe
          style="width: 100%; margin-top: 20px;"
          v-loading="loading.list"
          empty-text="暂无数据"
      >
        <el-table-column prop="business_id" label="业务编号" width="180">
          <template #default="scope">
            <el-link type="primary" @click="getApprovalDetail(scope.row.business_id)">
              {{ scope.row.business_id }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="business_type" label="业务类型" />
        <el-table-column prop="applicants_id" label="申请人工号" />
        <el-table-column prop="applicants_name" label="申请人姓名" />
        <el-table-column prop="apply_date" label="申请日期" />
        <el-table-column prop="approval_state" label="审批状态">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.approval_state)" size="small">
              {{ getStatusText(scope.row.approval_state) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="abstract" label="摘要" />
      </el-table>
    </div>

    <!-- 分页组件 -->
    <div class="pagination-area mt-4" v-if="applyTableData.length > 0">
      <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
      />
    </div>

    <!-- 审批详情弹窗 -->
    <el-dialog
        v-model="detailDialogVisible"
        :title="`审批详情 - ${currentBusinessId}`"
        width="70%"
        :before-close="handleCloseDialog"
    >
      <div v-loading="loading.detail">
        <!-- 基本信息 -->
        <div v-if="approvalDetail.length > 0" class="detail-container">
          <el-descriptions :column="3" border style="margin-bottom: 20px;">
            <el-descriptions-item label="业务编号">{{ approvalDetail[0].business_id }}</el-descriptions-item>
            <el-descriptions-item label="业务类型">{{ approvalDetail[0].business_type }}</el-descriptions-item>
            <el-descriptions-item label="申请人工号">{{ approvalDetail[0].applicants_id }}</el-descriptions-item>
            <el-descriptions-item label="申请人姓名">{{ approvalDetail[0].applicants_name }}</el-descriptions-item>
            <el-descriptions-item label="申请日期">{{ formatDate(approvalDetail[0].apply_date) }}</el-descriptions-item>
            <el-descriptions-item label="审批状态">
              <el-tag :type="getStatusType(approvalDetail[0].approval_state)">
                {{ getStatusText(approvalDetail[0].approval_state) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <!-- 单据信息 -->
          <div v-if="approvalDetail[0].abstract" class="abstract-info">
            <el-descriptions title="单据信息" :column="2" border>
              <template v-for="(item, index) in parsedAbstract(approvalDetail[0].abstract)['单据信息']" :key="index">
                <el-descriptions-item
                    v-for="(value, key) in item"
                    :key="key"
                    :label="key"
                >
                  {{ value }}
                </el-descriptions-item>
              </template>
            </el-descriptions>
          </div>

          <!-- 审批流程时间线 -->
          <div class="approval-timeline">
            <h3 style="margin: 20px 0 10px 0;">审批流程</h3>
            <el-timeline v-if="sortedApprovalSteps.length > 0">
              <el-timeline-item
                  v-for="(step, index) in sortedApprovalSteps"
                  :key="index"
                  :timestamp="formatTimestamp(step)"
                  :type="getTimelineType(step.approval_state)"
                  :hollow="step.approval_state === '0'"
                  placement="top"
              >
                <el-card shadow="hover" style="margin: 5px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong>{{ step.approval_role }}</strong>
                      <div style="margin-top: 5px; color: #666;">
                        <span>审批人：{{ step.approver || '未指定' }}</span>
                        <span v-if="step.approval_date" style="margin-left: 20px;">
                          审批时间：{{ formatDateTime(step.approval_date) }}
                        </span>
                      </div>
                    </div>
                    <div>
                      <el-tag :type="getStatusType(step.approval_state)" size="small">
                        {{ getStatusText(step.approval_state) }}
                      </el-tag>
                      <div v-if="step.approval_sort" style="margin-top: 5px; text-align: center;">
                        <el-tag type="info" size="small">第{{ step.approval_sort }}步</el-tag>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <div v-else style="text-align: center; color: #999; padding: 20px;">
              暂无审批步骤信息
            </div>
          </div>
        </div>

        <div v-else-if="!loading.detail" style="text-align: center; padding: 40px; color: #999;">
          暂无审批详情数据
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import request from '@/utils/requests.ts'
import { ElMessage } from 'element-plus'
import type {
  SearchForm,
  ApprovalListItem,
  ApprovalDetailItem,
  PaginationConfig,
  LoadingState,
  AbstractData,
  TagType,
  TimelineType,
  ApprovalStatus
} from '@/types/workflow'

// 搜索表单
const searchForm = reactive<SearchForm>({
  work_id: ''
})

// 加载状态
const loading = reactive<LoadingState>({
  list: false,
  detail: false
})

// 表格数据
const applyTableData = ref<ApprovalListItem[]>([])

// 分页配置
const pagination = reactive<PaginationConfig>({
  total: 0,
  pageSize: 10,
  currentPage: 1
})

// 审批详情相关
const detailDialogVisible = ref<boolean>(false)
const approvalDetail = ref<ApprovalDetailItem[]>([])
const currentBusinessId = ref<string>('')

// 计算属性：按审批步骤排序
const sortedApprovalSteps = computed<ApprovalDetailItem[]>(() => {
  if (approvalDetail.value.length === 0) {
    return []
  }

  return [...approvalDetail.value].sort((a, b) => {
    return (a.approval_sort || 0) - (b.approval_sort || 0)
  })
})

// 查询审批流列表
const searchQuery = async (): Promise<void> => {
  const workId = searchForm.work_id.trim()
  if (!workId) {
    ElMessage.warning('请输入工号')
    return
  }

  loading.list = true
  try {
    const response = await request.get('/workflows/teacher', {
      params: {
        work_id: workId,
        page: pagination.currentPage,
        page_size: pagination.pageSize
      }
    })

    if (response?.data) {
      const { data } = response
      applyTableData.value = data.list || data
      pagination.total = data.total || data.length || 0
    } else if (Array.isArray(response)) {
      applyTableData.value = response
      pagination.total = response.length
    } else {
      applyTableData.value = []
      pagination.total = 0
    }

    if (applyTableData.value.length === 0) {
      ElMessage.info('暂无审批流数据')
    }
  } catch (error) {
    console.error('查询审批流失败:', error)
    ElMessage.error('查询审批流失败')
    applyTableData.value = []
    pagination.total = 0
  } finally {
    loading.list = false
  }
}

// 获取审批详情
const getApprovalDetail = async (businessId: string): Promise<void> => {
  if (!businessId) {
    ElMessage.warning('业务编号无效')
    return
  }

  loading.detail = true
  detailDialogVisible.value = true
  approvalDetail.value = []
  currentBusinessId.value = businessId

  try {
    const response = await request.get('/workflows/program', {
      params: { business_id: businessId }
    })

    // 正确处理响应数据
    if (Array.isArray(response)) {
      approvalDetail.value = response
    } else if (response?.data) {
      approvalDetail.value = Array.isArray(response.data) ? response.data : [response.data]
    } else {
      ElMessage.warning('未找到审批详情')
      approvalDetail.value = []
    }

    console.log('审批详情数据:', approvalDetail.value)
  } catch (error) {
    console.error('获取审批详情失败:', error)
    ElMessage.error('获取审批详情失败')
    approvalDetail.value = []
  } finally {
    loading.detail = false
  }
}

// 解析 abstract 字段
const parsedAbstract = (abstractStr: string | object): AbstractData => {
  if (!abstractStr) {
    return { '单据信息': [] }
  }

  try {
    if (typeof abstractStr === 'object') {
      return abstractStr as AbstractData
    }

    const parsed = JSON.parse(abstractStr as string)
    return parsed || { '单据信息': [] }
  } catch (error) {
    console.error('解析 abstract 失败:', error)
    return { '单据信息': [] }
  }
}

// 格式化时间戳
const formatTimestamp = (step: ApprovalDetailItem): string => {
  if (step.approval_date) {
    return formatDateTime(step.approval_date)
  }
  return '待审批'
}

// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return ''

  const trimmed = dateStr.trim()
  if (trimmed.length === 8) {
    return `${trimmed.substring(0, 4)}-${trimmed.substring(4, 6)}-${trimmed.substring(6, 8)}`
  }
  return trimmed
}

// 格式化日期
const formatDate = (dateStr: string): string => {
  return formatDateTime(dateStr)
}

// 获取状态类型
const getStatusType = (state: string | ApprovalStatus): TagType => {
  switch (String(state)) {
    case '0':
      return 'warning'
    case '1':
      return 'success'
    case '2':
      return 'danger'
    case '3':
      return 'primary'
    case '4':
      return 'success'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (state: string | ApprovalStatus): string => {
  switch (String(state)) {
    case '0':
      return '待审批'
    case '1':
      return '已批准'
    case '2':
      return '已拒绝'
    case '3':
      return '进行中'
    case '4':
      return '已完成'
    default:
      return '未知状态'
  }
}

// 获取时间线类型
const getTimelineType = (state: string | ApprovalStatus): TimelineType => {
  switch (String(state)) {
    case '1':
      return 'success'
    case '2':
      return 'danger'
    case '3':
      return 'primary'
    case '0':
      return ''
    default:
      return ''
  }
}

// 分页处理
const handleSizeChange = (size: number): void => {
  pagination.pageSize = size
  pagination.currentPage = 1
  searchQuery()
}

const handlePageChange = (page: number): void => {
  pagination.currentPage = page
  searchQuery()
}

// 关闭弹窗处理
const handleCloseDialog = (done: () => void): void => {
  approvalDetail.value = []
  currentBusinessId.value = ''
  done()
}
</script>

<style scoped>
.approval-workflow-container {
  padding: 20px;
}

.search-area {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.form-item {
  margin-right: 10px;
}

.pagination-area {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.el-link {
  cursor: pointer;
}

.detail-container {
  max-height: 70vh;
  overflow-y: auto;
}

</style>