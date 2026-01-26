<template>
  <div>
    <shared-form
        v-model:department_id="formData.department_id"
        v-model:program_id="formData.program_id"
        v-model:filter_state="formData.filter_state"
    />
    <el-tabs v-model="activeTab">
      <el-tab-pane label="报销明细" name="报销明细">
        <!-- 添加 el-table 包裹 el-table-column -->
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
        <!-- 这里也可以添加表格 -->
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
import {ref, reactive, watch, onMounted} from 'vue'
import {ElMessage} from 'element-plus'
import type {AxiosResponse} from 'axios'
import SharedForm from './SharedForm.vue'

// 导入请求库
import request from '@/utils/requests.ts' // 请根据您的实际路径调整

// 定义类型
interface ReservationItem {
  reservation_number: string
  business_order_number: string
  program_id: string
  department_id: string
  abstract: string
  operator: string
  amount: number
  state: number
}

interface LaborItem {
  labor_number: string
  business_order_number: string
  program_id: string
  department_id: string
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

interface ApiResponse<T> {
  data: T[]
  total: number
  [key: string]: any
}

const activeTab = ref('报销明细')

// 表单数据
const formData = reactive({
  program_id: '',
  department_id: '',
  filter_state: 1,
})

// 加载状态
const loading = reactive({
  reservation: false,
  labor: false
})

// 表格数据 - 指定具体类型
const reservationTableData = ref<ReservationItem[]>([])
const laborTableData = ref<LaborItem[]>([])

// 分页配置 - 指定具体类型
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

// 报销明细相关方法
async function fetchReservationData() {
  loading.reservation = true
  try {
    const response: AxiosResponse<ApiResponse<ReservationItem>> = await request.get('/program/reimbursement', {
      params: {
        program_id: formData.program_id || '',
        department_id: formData.department_id || '',
        filter_state: formData.filter_state || 1,
      }
    })
    console.info('请求报销明细:', response)

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
    console.error('请求报销明细失败:', error)
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

// 劳务明细相关方法
async function fetchLaborData() {
  loading.labor = true
  try {
    const response: AxiosResponse<ApiResponse<LaborItem>> = await request.get('/program/labor_cost', {
      params: {
        program_id: formData.program_id || '',
        department_id: formData.department_id || '',
        filter_state: formData.filter_state || 1,
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
    console.error('请求劳务明细失败:', error)
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
    9: '审批中'
  }
  console.log('row',row,'column',column)
  return statusMap[cellValue] || cellValue.toString()
}

function laborCostStatusFormatter(row: any, column: any, cellValue: number): string {
  interface StatusMap {
    [key: number]: string
  }
  console.log('row',row,'column',column)
  const statusMap: StatusMap = {
    3: '已提交',
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

// 监听标签页切换
watch(activeTab, (newTab) => {
  if (newTab === '报销明细' && formData.program_id) {
    fetchReservationData()
  } else if (newTab === '劳务明细' && formData.program_id) {
    fetchLaborData()
  }
})

// 组件挂载时初始化
onMounted(() => {
  // 如果有默认值，可以在这里触发查询
  // fetchReservationData()
})
</script>

<style scoped>
.mt-4 {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>