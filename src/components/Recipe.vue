<template>
  <div>
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="借票" name="借票明细">
        <!-- 搜索条件区域 -->
        <div class="search-box" style="margin-bottom: 16px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
          <el-input
              v-model="searchForm.user_name"
              placeholder="申请人名称"
              style="width: 180px"
              clearable
          />
          <el-input
              v-model="searchForm.work_id"
              placeholder="申请人工号"
              style="width: 180px"
              clearable
          />
          <el-input
              v-model="searchForm.company_name"
              placeholder="公司/对方单位名称"
              style="width: 220px"
              clearable
          />

          <el-button type="primary" @click="fetchReservationData" :loading="loading.reservation">
            查询
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>

        <!-- 表格 -->
        <el-table
            :data="reservationTableData"
            style="width: 100%"
            v-loading="loading.reservation"
            border
        >
          <el-table-column prop="serial_num" label="流水号" width="180" />
          <el-table-column prop="operator_id" label="项目负责人工号" width="180" />
          <el-table-column prop="operator_name" label="项目负责人姓名" />
          <el-table-column prop="department_id" label="部门编号" />
          <el-table-column prop="company_name" label="对方单位名称" />
          <el-table-column prop="contract_num" label="合同编号" />
          <el-table-column prop="program_name" label="项目名称" />
          <el-table-column prop="amount" label="开票金额" />
          <el-table-column prop="recipe_type" label="票据类型" />
          <el-table-column
              prop="approval_state"
              label="审核状态"
              :formatter="statusFormatter"
          />
          <el-table-column prop="reason" label="原因" min-width="150" />
          <el-table-column prop="system_msg" label="系统提示" min-width="150" />

          <!-- 获取票据 操作列 -->
          <el-table-column label="操作" width="120" align="center">
            <template #default="scope">
              <el-button
                  type="success"
                  size="small"
                  v-if="scope.row.approval_state === '22'"
                  @click="getReceiptUrl(scope.row.serial_num)"
              >
                获取票据
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/requests.ts'

// 定义类型
interface ReservationItem {
  serial_num: string
  operator_id: string
  operator_name: string
  department_id: string
  company_name: string
  create_time?: string
  contract_num: string
  program_name: string
  amount: string | number
  recipe_type: string
  approval_state: number | string
  reason: string
  system_msg: string
}

// 激活标签
const activeTab = ref('借票明细')

// 搜索条件
const searchForm = reactive({
  user_name: '',
  work_id: '',
  company_name: '',
})

// 加载状态
const loading = reactive({
  reservation: false,
  labor: false
})

// 表格数据
const reservationTableData = ref<ReservationItem[]>([])

// ============== 核心方法 ==============
async function fetchReservationData() {
  loading.reservation = true
  try {
    const params = {
      user_name: searchForm.user_name.trim(),
      work_id: searchForm.work_id.trim(),
      company_name: searchForm.company_name.trim(),
    }

    const response = await request.get('/receipe/get_receipes', { params })
    console.log("真实返回数据：", response)

    // ✅ 修复 TS 类型 + 数据赋值
    reservationTableData.value = (response as unknown as ReservationItem[]) || []

    if (reservationTableData.value.length === 0) {
      ElMessage.info('暂无数据')
    }
  } catch (error) {
    console.error('获取借票明细失败：', error)
    ElMessage.error('获取数据失败')
    reservationTableData.value = []
  } finally {
    loading.reservation = false
  }
}

// 重置搜索
function resetSearch() {
  searchForm.user_name = ''
  searchForm.work_id = ''
  searchForm.company_name = ''
  fetchReservationData()
}

// 获取发票链接
async function getReceiptUrl(serial_num: string) {
  try {
    await ElMessageBox.confirm('确认获取该票据链接？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    })

    const res = await request.get('/receipe/get_receipe_url', {
      params: { serial_num }
    })

    // ✅ 修复 url 获取方式
    const url = res?.data || res
    if (!url) {
      ElMessage.warning('未获取到票据链接')
      return
    }

    window.open(url as string, '_blank')
    ElMessage.success('票据链接已打开')
  } catch (error) {
    ElMessage.error('获取票据链接失败')
    console.error(error)
  }
}

// 状态格式化 ✅ 修复未使用参数报错
function statusFormatter(_row: any, _column: any, cellValue: number | string): string {
  const statusMap: Record<number | string, string> = {
    1: '进行中',
    2: '已接单',
    3: '已完成',
    4: '被退单',
    5: '待投递',
    7: '审批驳回',
    8: '待审批',
    9: '已通过',
    20: '审批完成',
    21: '审批退回',
    22:'已开票',
    25: '已退票',
    0: '初始状态'
  }
  return statusMap[cellValue] || String(cellValue)
}

// 初始化 ✅ 自动加载数据
onMounted(() => {
  fetchReservationData()
})
</script>

<style scoped>
</style>