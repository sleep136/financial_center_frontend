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
          <el-table-column prop="state" label="状态"  :formatter="statusFormatter"/>
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

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import SharedForm from './SharedForm.vue'

// 导入请求库（根据您实际使用的请求库调整）
// 假设使用 axios
import request from '@/utils/requests.ts' // 请根据您的实际路径调整

const activeTab = ref('报销明细')

// 表单数据
const formData = reactive({
  program_id: '',
  department_id: ''
})

// 加载状态
const loading = reactive({
  reservation: false,
  labor: false
})

// 表格数据
const reservationTableData = ref([])
const laborTableData = ref([])

// 分页配置
const reservationPagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  layout: 'prev, pager, next, jumper'
})

const laborPagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  layout: 'prev, pager, next, jumper'
})



// 报销明细相关方法
async function fetchReservationData() {
  loading.reservation = true
  try {
    const response = await request.get('/program/reimbursement', {
      params: {
        program_id: formData.program_id || '',
        department_id: formData.department_id || '',
        filter_state: formData.filter_state || 1,
      }
    })
    console.info('请求报销明细:', response)
    // 假设接口返回格式为 { data: [], total: 0, ... }
    reservationTableData.value = response
    // reservationPagination.total = response.data.total || 0

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

function handleReservationPageChange(page) {
  reservationPagination.currentPage = page
  fetchReservationData()
}

// 劳务明细相关方法
async function fetchLaborData() {
  loading.labor = true
  try {
    const response = await request.get('/program/labor_cost', { // 请根据实际接口调整
      params: {
        program_id: formData.program_id || '',
        department_id: formData.department_id || '',
        filter_state: formData.filter_state || 1,
      }
    })

    // 假设接口返回格式为 { data: [], total: 0, ... }
    laborTableData.value = response
    laborPagination.total = response.total || 0

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

function handleLaborPageChange(page) {
  laborPagination.currentPage = page
  fetchLaborData()
}


function statusFormatter(row, column, cellValue) {
  const statusMap = {
    1: '进行中',
    2: '已接单',
    3: '已完成',
    4: '被退单',
    5: '待投递',
    7: '审批驳回',
    8: '待审批',
    9: '审批中'
  }
  return statusMap[cellValue] || cellValue
}

function laborCostStatusFormatter(row, column, cellValue) {
  const statusMap = {

    5: '已完成',

  }
  return statusMap[cellValue] || cellValue
}

function laborCostTypeFormatter(row, column, cellValue) {
  const statusMap = {

    1: '校内劳务',
    2: '校外人员劳务',
    3: '学生劳务',

  }
  return statusMap[cellValue] || cellValue
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

// 如果需要从父组件接收初始值
// const props = defineProps({
//   initialProgramId: {
//     type: String,
//     default: ''
//   },
//   initialDepartmentId: {
//     type: String,
//     default: ''
//   }
// })
</script>

<style scoped>
.mt-4 {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>