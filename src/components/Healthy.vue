<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElTable, ElTableColumn, ElTag } from 'element-plus'
import request from '@/utils/requests.ts'

interface ServiceInfo {
  healthy: string
  response_time_ms: string
  checked_at: string
  resolved_ip: string
  error: string
  name: string
}

interface HealthResponse {
  services: Record<string, ServiceInfo>
}

const serviceList = ref<ServiceInfo[]>([])
const loading = ref(false)

const getHealthList = async () => {
  loading.value = true
  try {
    const res = await request<HealthResponse>({
      url: '/health/all',
      method: 'get'
    })

    // ✅ 终极正确写法（适配 99% 的 axios 封装）
    const result = res.data || res
    const arr = Object.values(result.services || {})
    serviceList.value = arr

    console.log('最终表格数据：', arr) // 看这里！
  } catch (err) {
    ElMessage.error('加载失败')
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
  <div style="padding: 20px">
    <el-table :data="serviceList" :loading="loading" border width="100%">
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