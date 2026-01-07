<template>
  <div>
    <shared-program-form
        v-model:department_id="formData.department_id"
        v-model:program_id="formData.program_id"
    />
    <el-button @click="fetchFreezeData" :loading="loading.freeze">查询</el-button>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="冻结明细" name="冻结明细">
        <!-- 添加 el-table 包裹 el-table-column -->

        <el-table :data="reservationTableData" style="width: 100%" v-loading="loading.reservation">
          <el-table-column prop="hedge_number" label="对冲号" width="180"/>
          <el-table-column prop="business_order_number" label="业务编号" width="180"/>
          <el-table-column prop="program_id" label="项目编号"/>
          <el-table-column prop="department_id" label="部门编号"/>
          <el-table-column prop="freeze_number" label="冻结金额"/>
          <el-table-column prop="unfreeze_number" label="解冻金额"/>
          <el-table-column prop="abstract" label="摘要"/>
          <el-table-column prop="operator" label="经办人"/>
          <el-table-column prop="operate_time" label="操作时间"/>
          <el-table-column prop="is_review" label="是否复核"/>
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


    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import SharedProgramForm from './SharedProgramForm.vue'

// 导入请求库（根据您实际使用的请求库调整）
// 假设使用 axios
import request from '@/utils/requests.ts'




// 表单数据
const formData = reactive({
  program_id: '',
  department_id: ''
})

// 加载状态
const loading = reactive({

  freeze: false
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



// 冻结明细相关方法
async function fetchFreezeData() {
  loading.labor = true
  try {
    const response = await request.get('/program/freeze', { // 请根据实际接口调整
      params: {
        program_id: formData.program_id || '',
        department_id: formData.department_id || '',
        page: laborPagination.currentPage,
        page_size: laborPagination.pageSize
      }
    })

    // 假设接口返回格式为 { data: [], total: 0, ... }
    freezeTableData.value = response.data.data || response.data
    freezePagination.total = response.data.total || 0

    if (freezeTableData.value.length === 0) {
      ElMessage.info('暂无冻结明细数据')
    }
  } catch (error) {
    console.error('请求冻结明细失败:', error)
    ElMessage.error('获取冻结明细失败')
    freezeTableData.value = []
    freezeTableData.total = 0
  } finally {
    loading.freeze = false
  }
}



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