<script setup lang="ts">
import {ref, reactive} from 'vue'
import {ElMessage, ElTable, ElTableColumn, ElButton} from "element-plus";
import {Search, Refresh} from '@element-plus/icons-vue'
import request from "@/utils/requests.ts";

// 定义类型
interface AuthorizationRecord {
  program_name: string
  program_id: string
  department_id: string
  authorized_amount: number
  cancelled_amount: number
  authorized_person: string
  operator: string
  operate_time: string
  is_cancelled: boolean
  abstract: string
}

interface ExpenseResponse {
  data: AuthorizationRecord[]
  total: number

}

// 搜索表单
const searchForm = reactive({
  work_id: '',
  program_id: ''
})

// 表格数据
const authorizationTableData = ref<AuthorizationRecord[]>([])

// 加载状态
const loading = ref(false)


// 处理响应
const handleResponse = (response: any) => {
  console.log('response', response)
  console.log('response data', response.data)
  if (response && Array.isArray(response)) {
    authorizationTableData.value = response


  } else {
    authorizationTableData.value = []

    ElMessage.info('未查询到相关数据')
  }
}

// 处理错误
const handleError = (error: any) => {
  console.error('查询失败:', error)
  ElMessage.error('查询失败，请稍后重试')
  authorizationTableData.value = []

}

// 根据工号查询
const searchByWorkId = async () => {
  if (!searchForm.work_id.trim()) {
    ElMessage.warning('请输入工号')
    return
  }

  loading.value = true
  try {
    const response = await request.get<ExpenseResponse>('/authorization/teacher', {
      params: {
        work_id: searchForm.work_id.trim(),

      }
    })

    handleResponse(response)
  } catch (error) {
    handleError(error)
  } finally {
    loading.value = false
  }
}

// 根据项目号查询
const searchByProgramId = async () => {
  if (!searchForm.program_id.trim()) {
    ElMessage.warning('请输入项目号')
    return
  }

  loading.value = true
  try {
    const response = await request.get<ExpenseResponse>('/authorization/program', {
      params: {
        program_id: searchForm.program_id.trim(),

      }
    })

    handleResponse(response)
  } catch (error) {
    handleError(error)
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.work_id = ''
  searchForm.program_id = ''
  authorizationTableData.value = []

}


</script>

<template>
  <div class="authorization-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <div class="search-group">
        <div class="search-item">
          <span class="search-label">工号查询：</span>
          <el-input
              v-model="searchForm.work_id"
              placeholder="请输入工号"
              clearable
              style="width: 200px; margin-right: 10px;"
              @keyup.enter="searchByWorkId"
          />
          <el-button
              type="primary"
              :icon="Search"
              @click="searchByWorkId"
              :loading="loading"
          >
            查询
          </el-button>
        </div>

        <div class="search-item">
          <span class="search-label">项目号查询：</span>
          <el-input
              v-model="searchForm.program_id"
              placeholder="请输入项目号"
              clearable
              style="width: 200px; margin-right: 10px;"
              @keyup.enter="searchByProgramId"
          />
          <el-button
              type="primary"
              :icon="Search"
              @click="searchByProgramId"
              :loading="loading"
          >
            查询
          </el-button>
        </div>
      </div>

      <div class="search-actions">
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

    <!-- 表格区域 -->
    <div class="table-container">
      <el-table
          :data="authorizationTableData"
          border
          stripe
          style="width: 100%; margin-top: 20px;"
          v-loading="loading"
          empty-text="暂无数据"
      >
        <el-table-column prop="program_name" label="项目名称" width="180"/>
        <el-table-column prop="program_id" label="项目编号" width="120"/>
        <el-table-column prop="department_id" label="部门编号" width="120"/>
        <el-table-column prop="authorized_amount" label="授权金额" width="120">
          <template #default="{ row }">
            ¥{{ row.authorized_amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="cancelled_amount" label="取消金额" width="120">
          <template #default="{ row }">
            ¥{{ row.cancelled_amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="authorized_person" label="被授权人" width="120"/>
        <el-table-column prop="operator" label="授权人" width="120"/>
        <el-table-column prop="operate_time" label="操作时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.operate_time).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="is_cancelled" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_cancelled === 0 ? 'info' : row.is_cancelled === 1 ? 'success' : 'warning'">
              {{ row.is_cancelled === 0 ? '取消授权' : row.is_cancelled === 1 ? '已取消' : '授权' }}


            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="abstract" label="摘要" min-width="200"/>
      </el-table>


    </div>
  </div>
</template>

<style scoped>
.authorization-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.search-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-item {
  display: flex;
  align-items: center;
}

.search-label {
  width: 100px;
  text-align: right;
  font-weight: 500;
  color: #606266;
}

.search-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.table-container {
  margin-top: 20px;
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}


/* 响应式设计 */
@media (max-width: 768px) {
  .authorization-container {
    padding: 10px;
  }

  .search-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .search-label {
    width: auto;
    text-align: left;
  }

  .search-group .el-input {
    width: 100% !important;
  }
}
</style>