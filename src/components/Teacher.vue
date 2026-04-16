<template>
  <div>
    <el-card class="query-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
        </div>
      </template>

      <!-- 新增：查询类型选择框 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="查询类型" required>
            <el-select v-model="queryType" placeholder="请选择查询类型" class="w-full">
              <el-option
                  label="经办人办理的报销业务查询"
                  value="operator"
              />
              <el-option
                  label="项目负责人名下的报销业务查询"
                  value="owner"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item label="人员工号" prop="work_id" required>
            <el-input
                v-model="formData.work_id"
                placeholder="请输入人员工号"
                clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="m-4">
        <p>是否过滤已完成业务</p>
        <el-select v-model="formData.filter_state" placeholder="请选择">
          <el-option
              v-for="item in filter_states"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          ></el-option>
        </el-select>
      </div>
    </el-card>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="报销明细" name="报销明细">
        <el-button @click="fetchReservationData" :loading="loading.reservation">查询</el-button>
        <el-table :data="reservationTableData" style="width: 100%" v-loading="loading.reservation">
          <el-table-column prop="reservation_number" label="报销号" width="180"/>
          <el-table-column prop="business_order_number" label="业务编号" width="180"/>
          <el-table-column prop="program_id" label="项目编号"/>
          <el-table-column prop="department_id" label="部门编号"/>
          <el-table-column prop="abstract" label="摘要"/>
          <el-table-column prop="operator" label="经办人"/>
          <el-table-column prop="amount" label="金额"/>
          <el-table-column prop="state" label="状态" :formatter="statusFormatter"/>
        </el-table>

        <el-pagination
            v-if="reservationPagination.total > 0"
            size="small"
            background
            :layout="reservationPagination.layout"
            :total="reservationPagination.total"
            :page-size="reservationPagination.pageSize"
            :current-page="reservationPagination.currentPage"
            @current-change="handleReservationPageChange"
            class="mt-4"
        />
      </el-tab-pane>

      <el-tab-pane label="劳务明细" name="劳务明细">
        <el-button @click="fetchLaborData" :loading="loading.labor">查询</el-button>
        <el-table :data="laborTableData" style="width: 100%" v-loading="loading.labor">
          <el-table-column prop="labor_number" label="劳务申报号" width="180"/>
          <el-table-column prop="business_order_number" label="业务编号" width="180"/>
          <el-table-column prop="program_id" label="项目编号"/>
          <el-table-column prop="department_id" label="部门编号"/>
          <el-table-column prop="abstract" label="摘要"/>
          <el-table-column prop="operator" label="经办人"/>
          <el-table-column prop="state" label="状态" :formatter="laborCostStatusFormatter"/>
          <el-table-column prop="amount" label="金额"/>
          <el-table-column prop="type" label="劳务类型" :formatter="laborCostTypeFormatter"/>
        </el-table>

        <el-pagination
            v-if="laborPagination.total > 0"
            size="small"
            background
            :layout="laborPagination.layout"
            :total="laborPagination.total"
            :page-size="laborPagination.pageSize"
            :current-page="laborPagination.currentPage"
            @current-change="handleLaborPageChange"
            class="mt-4"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/requests.ts'

// 类型定义
interface ReservationItem {
  reservation_number: string
  business_order_number: string
  program_id: string | number
  department_id: string | number
  abstract: string
  operator: string
  amount: number
  state: number
}

interface LaborItem {
  labor_number: string
  business_order_number: string
  program_id: string | number
  department_id: string | number
  abstract: string
  operator: string
  state: number
  amount: number
  type: number
}

interface PaginationData {
  total: number
  pageSize: number
  currentPage: number
  layout: string
}

// 查询类型枚举
type QueryType = 'operator' | 'owner'

// 响应式数据
const activeTab = ref('报销明细')
const queryType = ref<QueryType>('operator') // 默认：经办人查询

// 表单数据
const formData = reactive({
  work_id: '',
  filter_state: 1,
})

// 加载状态
const loading = reactive({
  reservation: false,
  labor: false
})

// 表格数据
const reservationTableData = ref<ReservationItem[]>([])
const laborTableData = ref<LaborItem[]>([])

// 下拉选项
const filter_states = [
  { label: '是', value: 1 },
  { label: '否', value: 2 }
]

// 分页配置
const reservationPagination = reactive<PaginationData>({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  layout: 'prev, pager, next, jumper'
})

const laborPagination = reactive<PaginationData>({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  layout: 'prev, pager, next, jumper'
})

// ==================== 核心：根据查询类型获取接口地址 ====================
const getApiUrl = {
  reimbursement: () => queryType.value === 'operator'
      ? '/teacher/reimbursement'
      : '/teacher/own_reimbursement',

  laborCost: () => queryType.value === 'operator'
      ? '/teacher/labor_cost'
      : '/teacher/own_labor_cost'
}

// ==================== 报销明细 ====================
async function fetchReservationData() {
  if (!formData.work_id) {
    ElMessage.warning('请输入人员工号')
    return
  }

  loading.reservation = true
  try {
    // 后端直接返回数组，直接获取 response.data
    const response = await request.get(getApiUrl.reimbursement(), {
      params: {
        work_id: formData.work_id,
        filter_state: formData.filter_state,
      }
    })

    // 根据实际接口返回结构调整
    // 如果 response.data 是数组
    if (Array.isArray(response.data)) {
      reservationTableData.value = response.data
    }
    // 如果 response.data 是对象且包含 data 属性
    else if (response.data && Array.isArray((response.data as any).data)) {
      reservationTableData.value = (response.data as any).data
      reservationPagination.total = (response.data as any).total || 0
    }
    // 如果 response 本身就是数组
    else if (Array.isArray(response)) {
      reservationTableData.value = response
    }

    if (reservationTableData.value.length === 0) {
      ElMessage.info('暂无报销明细数据')
    }
  } catch (error) {
    console.error('报销明细请求失败：', error)
    ElMessage.error('获取报销明细失败')
    reservationTableData.value = []
    reservationPagination.total = 0
  } finally {
    loading.reservation = false
  }
}

function handleReservationPageChange(page: number) {
  reservationPagination.currentPage = page
  fetchReservationData()
}

// ==================== 劳务明细 ====================
async function fetchLaborData() {
  if (!formData.work_id) {
    ElMessage.warning('请输入人员工号')
    return
  }

  loading.labor = true
  try {
    // 后端直接返回数组
    const response = await request.get(getApiUrl.laborCost(), {
      params: {
        work_id: formData.work_id,
        filter_state: formData.filter_state,
      }
    })

    // 根据实际接口返回结构调整
    if (Array.isArray(response.data)) {
      laborTableData.value = response.data
      laborPagination.total = response.data.length
    }
    else if (response.data && Array.isArray((response.data as any).data)) {
      laborTableData.value = (response.data as any).data
      laborPagination.total = (response.data as any).total || 0
    }
    else if (Array.isArray(response)) {
      laborTableData.value = response
      laborPagination.total = response.length
    }

    if (laborTableData.value.length === 0) {
      ElMessage.info('暂无劳务明细数据')
    }
  } catch (error) {
    console.error('劳务明细请求失败：', error)
    ElMessage.error('获取劳务明细失败')
    laborTableData.value = []
    laborPagination.total = 0
  } finally {
    loading.labor = false
  }
}

function handleLaborPageChange(page: number) {
  laborPagination.currentPage = page
  fetchLaborData()
}

// 格式化函数
function statusFormatter(  row: any, column: any, cellValue: number): string {
  interface StatusMap {
    [key: number]: string
  }

  console.log('cellValue',cellValue)
  const statusMap: StatusMap = {
    1: '进行中',
    2: '已接单',
    3: '已完成',
    4: '被退单',
    5: '待投递',
    7: '审批驳回',
    8: '待审批',
    9: '审批中',
    20: '挂起'
  }
  console.log('row',row,'column',column)
  return statusMap[cellValue] || cellValue.toString()
}

// 劳务状态
function laborCostStatusFormatter(row: any, column: any, cellValue: number): string {
  interface StatusMap {
    [key: number]: string
  }
  console.log('row',row,'column',column)
  const statusMap: StatusMap = {
    1: '保存未提交',
    3: '已提交',
    4: '已退单',
    5: '已完成',
  }
  return statusMap[cellValue] || String(cellValue)
}

function laborCostTypeFormatter( row: any, column: any, cellValue: number): string {
  interface StatusMap {
    [key: number]: string
  }
  console.log('row',row,'column',column)
  const statusMap: StatusMap = {
    1: '校内劳务',
    2: '校外人员劳务',
    3: '学生劳务',
  }
  return statusMap[cellValue] || String(cellValue)
}

// ==================== 监听 ====================
// 切换标签页自动加载数据
watch(activeTab, (newTab) => {
  if (!formData.work_id) return
  newTab === '报销明细' ? fetchReservationData() : fetchLaborData()
})

// 切换查询类型时，清空表格数据（提升体验）
watch(queryType, () => {
  reservationTableData.value = []
  laborTableData.value = []
  reservationPagination.total = 0
  laborPagination.total = 0
})
</script>

<style scoped>
.mt-4 {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.w-full {
  width: 100%;
}
</style>