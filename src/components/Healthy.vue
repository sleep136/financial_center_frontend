<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElTable, ElTableColumn, ElTag } from 'element-plus'
import request from '@/utils/requests.ts'

// 1. 定义后端返回的数据结构（TS 核心）
interface ServiceInfo {
  healthy: string
  response_time_ms: string
  checked_at: string
  resolved_ip: string
  error: string
  name: string
}

// 2. 定义整个接口返回类型
interface HealthResponse {
  services: Record<string, ServiceInfo>
}

// 3. 声明响应式数据（类型明确）
const serviceList = ref<ServiceInfo[]>([])
const loading = ref(false)

// 获取健康检查数据
const getHealthList = async () => {
  loading.value = true
  try {
    // 4. 给接口返回值指定类型（核心修复）
    const data = await request<HealthResponse>({
      url: '/health/all',
      method: 'get'
    })

    // 5. 安全赋值 + 类型保证
    const arr = Object.values(data || {})
    serviceList.value = arr as ServiceInfo[]

    ElMessage.success('服务状态加载成功')
  } catch (err) {
    ElMessage.error('服务状态加载失败')
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getHealthList()
})
</script>

<template>
  <div class="health-container" style="padding: 20px">
    <el-table :data="serviceList" :loading="loading" border style="width: 100%">
      <el-table-column label="服务名称" prop="name" align="center" />
      <el-table-column label="健康状态" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.healthy === '1' ? 'success' : 'danger'">
            {{ scope.row.healthy === '1' ? '健康' : '不健康' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="响应时间(ms)" prop="response_time_ms" align="center" />
      <el-table-column label="检查时间" prop="checked_at" align="center" />
      <el-table-column label="服务地址" prop="resolved_ip" align="center" />
    </el-table>
  </div>
</template>

<style scoped>
</style>