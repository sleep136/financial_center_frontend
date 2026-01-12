<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElTable } from 'element-plus'
import type { AxiosResponse } from 'axios'
import request from '@/utils/requests.ts'
interface LaborItem {
  voucher_number: string
  program_id: string
  department_id: string
  abstract: string
  subject_code: string
  amount: number
  // 其他可能字段
}

interface ApiResponse<T> {
  data: T[]
  total: number
  [key: string]: any
}

// 科目字典
const dict_subjects_code = ref({
  "0101": "设备费",
  "0201": "材料费",
  "0301": "测试化验加工费",
  "0401": "燃料动力费",
  "0501": "差旅费/会议费/国际合作与交流费",
  "0601": "出版/文献/信息传播/知识产权事务费/印刷费/宣传费",
  "0701": "劳务费",
  "0801": "专家咨询费",
  "0901": "管理费",
  "1001": "绩效支出",
  "1101": "科研发展基金",
  "1201": "图书资料费",
  "1301": "数据采集费",
  "1401": "办公费",
  "1501": "基础建设费",
  "1601": "外协费",
  "1701": "增值税及附加税费",
  "1801": "横向科研业务费",
  "1901": "学校科研发展基金",
  "2001": "业务活动费"
})

// 响应式数据
const activeTab = ref('科目明细')
const loading = reactive({
  labor: false
})

// 表单数据
const formData = reactive({
  program_id: '',
  department_id: '',
  subject_code: '',
  filter_state: 1
})

// 表格数据
const laborTableData = ref<LaborItem[]>([])

// 分页
const laborPagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 计算属性 - 统计总金额
const totalAmount = computed(() => {
  return laborTableData.value.reduce((sum, item) => {
    return sum + (Number(item.amount) || 0)
  }, 0)
})

// 计算属性 - 按科目统计金额
const amountBySubject = computed(() => {
  const result: Record<string, number> = {}
  laborTableData.value.forEach(item => {
    const subjectName = dict_subjects_code.value[item.subject_code] || item.subject_code
    if (!result[subjectName]) {
      result[subjectName] = 0
    }
    result[subjectName] += Number(item.amount) || 0
  })
  return result
})

// 获取凭证明细数据
async function fetchVocherData() {
  // 表单验证
  if (!formData.program_id) {
    ElMessage.warning('请输入项目编号')
    return
  }

  if (!formData.department_id) {
    ElMessage.warning('请输入部门编号')
    return
  }

  loading.labor = true
  try {
    const params: any = {
      program_id: formData.program_id,
      department_id: formData.department_id,
      filter_state: formData.filter_state
    }

    // 如果选择了科目，则添加到参数中
    if (formData.subject_code) {
      params.subject_code = formData.subject_code
    }

    const response: AxiosResponse<ApiResponse<LaborItem>> = await request.get('/program/economic_classification_cost', {
      params: params
    })

    // 根据实际接口返回结构调整
    if (Array.isArray(response.data)) {
      laborTableData.value = response.data
      laborPagination.total = response.data.length
    } else if (response.data && Array.isArray((response.data as any).data)) {
      laborTableData.value = (response.data as any).data
      laborPagination.total = (response.data as any).total || 0
    } else if (Array.isArray(response)) {
      laborTableData.value = response
      laborPagination.total = response.length
    }

    if (laborTableData.value.length === 0) {
      ElMessage.info('暂无凭证明细数据')
    } else {
      ElMessage.success(`查询成功，共 ${laborTableData.value.length} 条记录`)
    }
  } catch (error) {
    console.error('请求凭证明细失败:', error)
    ElMessage.error('获取凭证明细失败')
    laborTableData.value = []
    laborPagination.total = 0
  } finally {
    loading.labor = false
  }
}

// 重置表单
function resetForm() {
  formData.program_id = ''
  formData.department_id = ''
  formData.subject_code = ''
  laborTableData.value = []
  laborPagination.total = 0
}

// 格式化金额显示
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// 科目选项
const subjectOptions = computed(() => {
  return Object.entries(dict_subjects_code.value).map(([code, name]) => ({
    value: code,
    label: `${code} - ${name}`
  }))
})

// 清空科目选择
function clearSubject() {
  formData.subject_code = ''
}
</script>

<template>
  <div class="voucher-container">
    <el-tabs v-model="activeTab" class="demo-tabs">
      <el-tab-pane label="科目明细" name="科目明细">
        <!-- 查询表单 -->
        <el-card class="query-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>查询条件</span>
            </div>
          </template>

          <el-form :model="formData" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="项目编号" prop="program_id">
                  <el-input
                      v-model="formData.program_id"
                      placeholder="请输入项目编号"
                      clearable
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="部门编号" prop="department_id">
                  <el-input
                      v-model="formData.department_id"
                      placeholder="请输入部门编号"
                      clearable
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="科目" prop="subject_code">
                  <el-select
                      v-model="formData.subject_code"
                      placeholder="请选择科目（可选）"
                      clearable
                      filterable
                      style="width: 100%"
                  >
                    <el-option label="全部科目" value="" />
                    <el-option
                        v-for="item in subjectOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item>
              <el-button type="primary" @click="fetchVocherData" :loading="loading.labor">
                <el-icon class="el-icon--left"><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 统计信息 -->
        <el-card class="statistics-card" shadow="never" v-if="laborTableData.length > 0">
          <template #header>
            <div class="card-header">
              <span>统计信息</span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">总记录数</div>
                <div class="stat-value">{{ laborTableData.length }} 条</div>
              </div>
            </el-col>

            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">总金额</div>
                <div class="stat-value amount">{{ formatAmount(totalAmount) }} 元</div>
              </div>
            </el-col>

            <el-col :span="12" v-if="Object.keys(amountBySubject).length > 1">
              <div class="stat-item">
                <div class="stat-label">按科目统计</div>
                <div class="subject-stats">
                  <div v-for="(amount, subject) in amountBySubject" :key="subject" class="subject-item">
                    <span class="subject-name">{{ subject }}：</span>
                    <span class="subject-amount">{{ formatAmount(amount) }} 元</span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 数据表格 -->
        <el-card class="table-card" shadow="never" v-if="laborTableData.length > 0">
          <template #header>
            <div class="card-header">
              <span>凭证明细</span>
              <el-button type="success" size="small" @click="exportData" v-if="laborTableData.length > 0">
                <el-icon class="el-icon--left"><Download /></el-icon>
                导出数据
              </el-button>
            </div>
          </template>

          <el-table
              :data="laborTableData"
              style="width: 100%"
              v-loading="loading.labor"
              border
              stripe
              height="500"
          >
            <el-table-column
                prop="voucher_number"
                label="凭证号"
                width="120"
                fixed="left"
            />

            <el-table-column
                prop="program_id"
                label="项目编号"
                width="120"
            />

            <el-table-column
                prop="department_id"
                label="部门编号"
                width="120"
            />

            <el-table-column
                prop="abstract"
                label="摘要"
                min-width="200"
                show-overflow-tooltip
            />

            <el-table-column
                prop="subject_code"
                label="科目编号"
                width="100"
            >
              <template #default="{ row }">
                {{ row.subject_code }}
                <el-tag size="small" type="info" v-if="dict_subjects_code[row.subject_code]">
                  {{ dict_subjects_code[row.subject_code] }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
                prop="amount"
                label="金额"
                width="120"
                align="right"
            >
              <template #default="{ row }">
                {{ formatAmount(row.amount) }}
              </template>
            </el-table-column>


          </el-table>

          <!-- 分页 -->
          <div class="pagination-container" v-if="laborPagination.total > laborPagination.pageSize">
            <el-pagination
                v-model:current-page="laborPagination.currentPage"
                v-model:page-size="laborPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="laborPagination.total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="fetchVocherData"
                @current-change="fetchVocherData"
            />
          </div>
        </el-card>

        <!-- 空状态 -->
        <el-empty
            v-if="!loading.labor && laborTableData.length === 0"
            description="暂无数据，请输入查询条件后点击查询按钮"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.voucher-container {
  padding: 20px;

  .query-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .statistics-card {
    margin-bottom: 20px;

    .stat-item {
      padding: 10px;
      border-left: 3px solid #409EFF;
      background-color: #f5f7fa;
      border-radius: 4px;

      .stat-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 18px;
        font-weight: bold;
        color: #303133;

        &.amount {
          color: #67C23A;
        }
      }

      .subject-stats {
        max-height: 100px;
        overflow-y: auto;

        .subject-item {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 12px;

          .subject-name {
            color: #606266;
          }

          .subject-amount {
            color: #67C23A;
            font-weight: bold;
          }
        }
      }
    }
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .el-table {
      margin-top: 10px;
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .el-tag {
    margin-left: 5px;
  }
}
</style>