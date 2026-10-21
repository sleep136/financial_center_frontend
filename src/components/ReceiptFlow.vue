<template>
  <div>
    <el-card class="query-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>报销流程查询</span>
          <el-button v-if="showBackButton" @click="goBack" class="back-button">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="报销号" required>
            <el-input
                v-model="ywlsh"
                placeholder="请输入报销号（业务流水号）"
                clearable
                @keyup.enter="fetchFlowData"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="部门编号">
            <el-input
                v-model="departmentId"
                placeholder="部门编号"
                readonly
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="项目编号">
            <el-input
                v-model="programId"
                placeholder="项目编号"
                readonly
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="4">
          <el-button type="primary" @click="fetchFlowData" :loading="loading">
            查询
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 查询结果 -->
    <el-card v-if="flowData" class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>报销号: {{ flowData.ywlsh }}</span>
        </div>
      </template>

      <el-table :data="flowData.flow_status" style="width: 100%" border>
        <el-table-column prop="sequence" label="序号" width="80" align="center" />
        <el-table-column prop="source" label="流程来源" width="150" />
        <el-table-column prop="handler" label="处理人" width="120" />
        <el-table-column prop="process_time" label="处理时间" width="180" />
        <el-table-column prop="status" label="处理状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-card>

    <!-- 空状态 -->
    <el-empty v-else-if="!loading && hasQueried" description="未找到该报销号的流程记录" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/requests.ts'

// 定义类型
interface FlowStatus {
  sequence: number
  source: string
  handler: string
  remark: string
  process_time: string
  status: string
}

interface FlowData {
  ywlsh: string
  flow_status: FlowStatus[]
}

// 路由参数
const route = useRoute()
const router = useRouter()

// 响应式数据
const ywlsh = ref<string>('')
const departmentId = ref<string>('')
const programId = ref<string>('')
const workId = ref<string>('')
const loading = ref(false)
const flowData = ref<FlowData | null>(null)
const hasQueried = ref(false)
const showBackButton = ref(false)

// 获取流程数据
async function fetchFlowData() {
  if (!ywlsh.value.trim()) {
    ElMessage.warning('请输入报销号')
    return
  }

  loading.value = true
  hasQueried.value = true
  try {
    const response = await request.get(`/receipt-flow/${ywlsh.value.trim()}`)
    console.log('报销流程查询结果:', response)
    
    // 根据后端返回结构调整
    // 如果 response 是对象且包含 ywlsh 属性
    if (response && typeof response === 'object' && 'ywlsh' in response) {
      flowData.value = response as unknown as FlowData
    }
    // 如果 response.data 存在
    else if ((response as any)?.data) {
      flowData.value = (response as any).data
    }

    if (!flowData.value || !flowData.value.flow_status || flowData.value.flow_status.length === 0) {
      ElMessage.info('未找到该报销号的流程记录')
      flowData.value = null
    }
  } catch (error: any) {
    console.error('查询报销流程失败:', error)
    const errorMessage = error?.response?.data?.detail || error?.message || '查询失败'
    ElMessage.error(errorMessage)
    flowData.value = null
  } finally {
    loading.value = false
  }
}

// 根据状态返回不同的标签类型
function getStatusType(status: string): 'success' | 'warning' | 'danger' | 'info' | '' {
  if (status.includes('完成') || status.includes('通过') || status.includes('已开票')) {
    return 'success'
  } else if (status.includes('进行') || status.includes('待') || status.includes('中')) {
    return 'warning'
  } else if (status.includes('驳回') || status.includes('退回') || status.includes('退单')) {
    return 'danger'
  } else {
    return 'info'
  }
}

// 返回上一页
function goBack() {
  const from = route.query.from as string
  if (from) {
    // 根据来源页面智能返回参数
    const query: any = {}
    
    // 如果是从报销明细页面（Program.vue）返回，带上部门编号和项目编号
    if (from === '/program') {
      if (departmentId.value) query.department_id = departmentId.value
      if (programId.value) query.program_id = programId.value
    }
    // 如果是从报销记录页面（Teacher.vue）返回，带上工号
    else if (from === '/recipe') {
      if (workId.value) query.work_id = workId.value
    }
    
    router.push({
      path: from,
      query
    })
  } else {
    router.back()
  }
}

// 组件挂载时检查路由参数
onMounted(() => {
  // 检查是否从其他页面跳转过来
  if (route.query.from) {
    showBackButton.value = true
  }

  // 接收部门编号和项目编号参数
  if (route.query.department_id) {
    departmentId.value = route.query.department_id as string
  }
  if (route.query.program_id) {
    programId.value = route.query.program_id as string
  }
  // 接收工号参数
  if (route.query.work_id) {
    workId.value = route.query.work_id as string
  }

  // 如果有报销号参数，自动查询
  if (route.query.ywlsh) {
    ywlsh.value = route.query.ywlsh as string
    fetchFlowData()
  }
})
</script>

<style scoped>
.query-card {
  margin-bottom: 20px;
}

.result-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.back-button {
  margin-left: auto;
}
</style>
