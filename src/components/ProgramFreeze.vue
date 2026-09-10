<template>
  <div>
    <shared-program-form
        v-model:department_id="formData.department_id"
        v-model:program_id="formData.program_id"
    />
    <el-button @click="fetchFreezeData" :loading="loading.freeze" type="primary">查询</el-button>

    <!-- 顶部统计卡片 -->
    <div v-if="financialList.length > 0" class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="stats-card">
            <div class="stats-label">财务记录数</div>
            <div class="stats-value">{{ financialList.length }} 条</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stats-card">
            <div class="stats-label">财务净冻结总额</div>
            <div class="stats-value stats-primary">{{ formatMoney(totalFinancialNet) }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stats-card">
            <div class="stats-label">采购净冻结总额</div>
            <div class="stats-value stats-warning">{{ formatMoney(totalPurchaseNet) }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stats-card">
            <div class="stats-label">差额合计</div>
            <div class="stats-value" :class="totalDiff === 0 ? 'stats-success' : 'stats-danger'">
              {{ formatMoney(totalDiff) }}
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 对比统计表格 -->
    <div v-if="comparisonList.length > 0" class="group-stats">
      <h4>财务 vs 采购 冻结金额对比（按业务编号分组）</h4>
      <el-table
          :data="comparisonList"
          border
          stripe
          size="small"
          style="width: 100%; margin-top: 10px;"
          :row-class-name="rowClassName"
      >
        <el-table-column prop="business_order_number" label="业务编号" width="180" />
        <el-table-column label="财务冻结" align="right" width="140">
          <template #default="{ row }">{{ formatMoney(row.financial_freeze) }}</template>
        </el-table-column>
        <el-table-column label="财务解冻" align="right" width="140">
          <template #default="{ row }">{{ formatMoney(row.financial_unfreeze) }}</template>
        </el-table-column>
        <el-table-column label="财务净冻结" align="right" width="150">
          <template #default="{ row }">
            <strong>{{ formatMoney(row.financial_net) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="采购净冻结" align="right" width="150">
          <template #default="{ row }">
            <strong>{{ formatMoney(row.purchase_net) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="差额" align="right" width="150">
          <template #default="{ row }">
            <span :style="{ color: row.diff === 0 ? '#67c23a' : '#f56c6c', fontWeight: 'bold' }">
              {{ formatMoney(row.diff) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag v-if="Math.abs(row.diff) < 0.01" type="success" size="small">一致</el-tag>
            <el-tag v-else type="danger" size="small">不一致</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="记录数" align="center" width="80">
          <template #default="{ row }">{{ row.count }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 财务明细表格 -->
    <div v-if="financialList.length > 0" style="margin-top: 24px;">
      <h4>财务系统冻结明细</h4>
      <el-table
          :data="financialList"
          border
          stripe
          style="width: 100%; margin-top: 10px;"
          max-height="400"
          v-loading="loading.freeze"
          empty-text="暂无数据"
      >
        <el-table-column prop="business_order_number" label="业务编号" width="180" />
        <el-table-column prop="program_id" label="项目编号" width="140" />
        <el-table-column prop="department_id" label="部门编号" width="110" />
        <el-table-column label="冻结金额" align="right" width="140">
          <template #default="{ row }">{{ formatMoney(row.freeze_number) }}</template>
        </el-table-column>
        <el-table-column label="解冻金额" align="right" width="140">
          <template #default="{ row }">{{ formatMoney(row.unfreeze_number) }}</template>
        </el-table-column>
        <el-table-column prop="abstract" label="摘要" min-width="250" show-overflow-tooltip />
        <el-table-column prop="operator" label="经办人" width="100" />
        <el-table-column prop="operate_time" label="操作时间" width="120" />
        <el-table-column prop="is_review" label="是否复核" width="120" />
      </el-table>
    </div>

    <!-- 采购明细表格 -->
    <div v-if="purchaseList.length > 0" style="margin-top: 24px;">
      <h4>采购系统冻结数据</h4>
      <el-table
          :data="purchaseList"
          border
          stripe
          style="width: 100%; margin-top: 10px;"
          max-height="400"
          empty-text="暂无数据"
      >
        <el-table-column prop="planning_no" label="计划单号" width="180" />
        <el-table-column prop="program_id" label="项目编号" width="140" />
        <el-table-column label="冻结金额" align="right" width="150">
          <template #default="{ row }">{{ formatMoney(row.freeze_number) }}</template>
        </el-table-column>
        <el-table-column prop="freeze_id" label="冻结单号" width="140" />
        <el-table-column prop="planning_name" label="计划名称" min-width="300" show-overflow-tooltip />
        <el-table-column label="是否财务" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_financial === 1 ? 'success' : 'info'" size="small">
              {{ row.is_financial === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import SharedProgramForm from './SharedProgramForm.vue'
import request from '@/utils/requests.ts'

interface FinancialRecord {
  hedge_number?: string
  business_order_number: string
  program_id: string
  department_id: string
  freeze_number: number
  unfreeze_number: number
  abstract: string
  operator: string
  operate_time: string
  is_review: boolean | string
}

interface PurchaseRecord {
  program_id: string
  planning_id: number
  is_financial: number
  freeze_number: number
  freeze_id: string
  planning_name: string
  planning_no: string
}

interface ComparisonItem {
  business_order_number: string
  financial_freeze: number
  financial_unfreeze: number
  financial_net: number
  purchase_net: number
  diff: number
  count: number
}

const formData = reactive({
  program_id: '',
  department_id: ''
})

const loading = reactive({
  freeze: false
})

const financialList = ref<FinancialRecord[]>([])
const purchaseList = ref<PurchaseRecord[]>([])

function formatMoney(value: number): string {
  if (value === undefined || value === null) return '0.00'
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 财务净冻结总额
const totalFinancialNet = computed(() => {
  return financialList.value.reduce((sum, item) => {
    return sum + (item.freeze_number - item.unfreeze_number)
  }, 0)
})

// 采购净冻结总额
const totalPurchaseNet = computed(() => {
  return purchaseList.value.reduce((sum, item) => sum + item.freeze_number, 0)
})

// 对比列表
const comparisonList = computed<ComparisonItem[]>(() => {
  // 按业务编号汇总财务数据
  const finMap: Record<string, { freeze: number; unfreeze: number; count: number }> = {}
  financialList.value.forEach(item => {
    const key = item.business_order_number
    if (!finMap[key]) {
      finMap[key] = { freeze: 0, unfreeze: 0, count: 0 }
    }
    finMap[key].freeze += item.freeze_number
    finMap[key].unfreeze += item.unfreeze_number
    finMap[key].count += 1
  })

  // 按计划单号汇总采购数据
  const purMap: Record<string, number> = {}
  purchaseList.value.forEach(item => {
    const key = item.planning_no
    purMap[key] = (purMap[key] || 0) + item.freeze_number
  })

  // 合并所有业务编号
  const allKeys = new Set([...Object.keys(finMap), ...Object.keys(purMap)])

  const result: ComparisonItem[] = []
  allKeys.forEach(key => {
    const fin = finMap[key] || { freeze: 0, unfreeze: 0, count: 0 }
    const pur = purMap[key] || 0
    const financialNet = fin.freeze - fin.unfreeze
    const diff = financialNet - pur
    result.push({
      business_order_number: key,
      financial_freeze: fin.freeze,
      financial_unfreeze: fin.unfreeze,
      financial_net: financialNet,
      purchase_net: pur,
      diff: diff,
      count: fin.count
    })
  })

  // 按差额绝对值降序，差额大的排前面
  return result.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
})

// 总差额
const totalDiff = computed(() => {
  return comparisonList.value.reduce((sum, item) => sum + item.diff, 0)
})

// 不一致的行高亮
function rowClassName({ row }: { row: ComparisonItem }) {
  return row.diff !== 0 ? 'warning-row' : ''
}

async function fetchFreezeData() {
  loading.freeze = true
  try {
    interface FreezeResponse {
      financial_freeze: FinancialRecord[]
      purchase_freeze: PurchaseRecord[]
    }

    const response = await request.get('/program/freeze', {
      params: {
        program_id: formData.program_id || '',
        department_id: formData.department_id || ''
      }
    }) as unknown as FreezeResponse

    if (response && Array.isArray(response.financial_freeze)) {
      financialList.value = response.financial_freeze
      purchaseList.value = Array.isArray(response.purchase_freeze) ? response.purchase_freeze : []
    } else {
      financialList.value = []
      purchaseList.value = []
    }

    if (financialList.value.length === 0 && purchaseList.value.length === 0) {
      ElMessage.info('暂无冻结明细数据')
    }
  } catch (error) {
    console.error('请求冻结明细失败:', error)
    ElMessage.error('获取冻结明细失败')
    financialList.value = []
    purchaseList.value = []
  } finally {
    loading.freeze = false
  }
}
</script>

<style scoped>
.stats-container {
  margin: 16px 0 20px 0;
}

.stats-card {
  text-align: center;
  padding: 4px 0;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stats-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}

.stats-primary {
  color: #409eff;
}

.stats-warning {
  color: #e6a23c;
}

.stats-success {
  color: #67c23a;
}

.stats-danger {
  color: #f56c6c;
}

.group-stats {
  margin-top: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.group-stats h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

:deep(.warning-row) {
  background-color: #fef0f0 !important;
}
</style>