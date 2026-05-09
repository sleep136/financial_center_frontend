<template>
  <div class="stats-container">
    <!-- 顶部操作栏 -->
    <div class="header-box">
      <div class="title">报销统计分析</div>
      <el-button type="primary" @click="runStats" :loading="loading">
        手动执行统计
      </el-button>
    </div>

    <!-- 年度总览卡片 -->
    <div class="card-grid" v-loading="totalLoading">
      <el-card shadow="hover">
        <div class="card-item">
          <div class="label">年度总金额</div>
          <div class="value">¥{{ total?.total_amount || 0 }}</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="card-item">
          <div class="label">年度发票总数</div>
          <div class="value">{{ total?.total_count || 0 }}</div>
        </div>
      </el-card>
    </div>

    <!-- 月度查询 -->
    <el-card shadow="hover" title="月度报销统计" style="margin-top:20px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:15px">
        <el-select v-model="month" style="width:160px">
          <el-option label="1月" value="01" />
          <el-option label="2月" value="02" />
          <el-option label="3月" value="03" />
          <el-option label="4月" value="04" />
          <el-option label="5月" value="05" />
          <el-option label="6月" value="06" />
          <el-option label="7月" value="07" />
          <el-option label="8月" value="08" />
          <el-option label="9月" value="09" />
          <el-option label="10月" value="10" />
          <el-option label="11月" value="11" />
          <el-option label="12月" value="12" />
        </el-select>
        <el-button type="primary" @click="loadMonthStats"> 查询月度统计 </el-button>
        <el-button type="success" @click="getMonthDetail"> 查看{{ curMonthName }}发票明细 </el-button>
      </div>

      <div v-loading="monthLoading" class="month-card-row">
        <div class="month-item">
          <div class="label">{{ curMonthName }}总金额</div>
          <div class="value">¥{{ monthData?.amount || 0 }}</div>
        </div>
        <div class="month-item">
          <div class="label">{{ curMonthName }}发票数</div>
          <div class="value">{{ monthData?.count || 0 }}</div>
        </div>
      </div>
    </el-card>

    <!-- 图表区域 -->
    <div class="chart-row" style="margin-top:20px">
      <el-card shadow="hover" class="chart-card">
        <div class="chart-title">{{ curMonthName }}各学院报销占比</div>
        <div ref="pieChartRef" class="chart-box"></div>
      </el-card>
      <el-card shadow="hover" class="chart-card">
        <div class="chart-title">{{ curMonthName }}学院报销TOP10</div>
        <div ref="collegeBarRef" class="chart-box"></div>
      </el-card>
      <el-card shadow="hover" class="chart-card">
        <div class="chart-title">{{ curMonthName }}经办人报销TOP10</div>
        <div ref="userBarRef" class="chart-box"></div>
      </el-card>
    </div>

    <!-- 年度趋势图 -->
    <el-card shadow="hover" style="margin-top:20px">
      <div class="chart-title">年度报销金额趋势图</div>
      <div ref="lineChartRef" class="chart-box"></div>
    </el-card>

    <!-- 表格TOP10 -->
    <div class="top-row" style="margin-top:20px">
      <el-card shadow="hover" style="width:49%" v-loading="monthLoading">
        <div class="table-title">{{ curMonthName }}学院报销TOP10列表</div>
        <el-table :data="monthTopCollegeList" border size="small">
          <el-table-column prop="name" label="学院" />
          <el-table-column prop="amount" label="报销金额" align="right" />
          <el-table-column prop="count" label="发票数量" align="center" />
        </el-table>
      </el-card>
      <el-card shadow="hover" style="width:49%" v-loading="monthLoading">
        <div class="table-title">{{ curMonthName }}经办人报销TOP10列表</div>
        <el-table :data="monthTopUserList" border size="small">
          <el-table-column prop="name" label="经办人" />
          <el-table-column prop="amount" label="报销金额" align="right" />
          <el-table-column prop="count" label="发票数量" align="center" />
        </el-table>
      </el-card>
    </div>

    <!-- 供应商 & 学院 -->
    <div style="display:flex;gap:20px; margin-top:20px;">
      <el-card shadow="hover" style="width:49%" v-loading="supplierLoading">
        <div class="table-title">年度供应商报销TOP10</div>
        <el-table :data="supplierList" border>
          <el-table-column prop="supplier" label="供应商" />
          <el-table-column prop="amount" label="总金额" />
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button type="text" @click="openSupplierDetail(scope.row.supplier)">查看明细</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="hover" style="width:49%" v-loading="collegeLoading">
        <div class="table-title">年度各学院报销统计</div>
        <el-table :data="collegeList" border>
          <el-table-column prop="name" label="学院" />
          <el-table-column prop="amount" label="总金额" />
          <el-table-column prop="count" label="发票数" />
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button type="text" @click="openCollegeDetail(scope.row.name)">查看明细</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 发票明细弹窗 -->
    <el-dialog v-model="detailVisible" :title="curMonthName + '发票明细'" width="95%" append-to-body>
      <el-table :data="detailItems" border v-loading="detailLoading" height="500">
        <el-table-column prop="FKDWMC" label="付款单位名称" min-width="100" show-overflow-tooltip />
        <el-table-column prop="DZFPH" label="电子发票号" min-width="140" />
        <el-table-column prop="YYDH" label="预约单号" min-width="140" />
        <el-table-column prop="ZJE" label="总金额" min-width="100" align="right" />
        <el-table-column prop="SE" label="发票税额" min-width="100" align="right" />
        <el-table-column prop="KPRQ" label="开票日期" min-width="120" />
        <el-table-column prop="KPDWMC" label="开票单位" min-width="120" />
        <el-table-column prop="FPNR" label="发票内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ygbh" label="录入人工号" min-width="120" />
        <el-table-column prop="ygmc" label="录入人名称" min-width="120" />
        <el-table-column prop="dept_name" label="录入人所属部门" min-width="100" show-overflow-tooltip/>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick, onBeforeUnmount, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/requests.ts'
import * as echarts from 'echarts'

interface TotalData { total_amount: number; total_count: number }
interface MonthData { amount: number; count: number }
interface TopItem { name: string; amount: number; count: number }
interface SupplierItem { supplier: string; amount: number }
interface CollegeItem { name: string; amount: number; count: number }

const loading = ref(false)
const totalLoading = ref(true)
const supplierLoading = ref(true)
const collegeLoading = ref(true)
const monthLoading = ref(false)
const detailLoading = ref(false)

const total = ref<TotalData>({ total_amount: 0, total_count: 0 })
const month = ref('01')
// 动态月份名称
const curMonthName = computed(() => `${Number(month.value)}月`)

const monthData = ref<MonthData>({ amount: 0, count: 0 })
const monthTopCollegeList = ref<TopItem[]>([])
const monthTopUserList = ref<TopItem[]>([])
const supplierList = ref<SupplierItem[]>([])
const collegeList = ref<CollegeItem[]>([])
const detailVisible = ref(false)
const detailItems = ref<any[]>([])

// 图表
const pieChartRef = ref()
const collegeBarRef = ref()
const userBarRef = ref()
const lineChartRef = ref()

let pieChart: any
let collegeBar: any
let userBar: any
let lineChart: any

const initCharts = () => {
  pieChart = echarts.init(pieChartRef.value)
  collegeBar = echarts.init(collegeBarRef.value)
  userBar = echarts.init(userBarRef.value)
  lineChart = echarts.init(lineChartRef.value)
}

const resizeAllCharts = () => {
  pieChart?.resize()
  collegeBar?.resize()
  userBar?.resize()
  lineChart?.resize()
}

// 饼图
const renderMonthPie = () => {
  const list = monthTopCollegeList.value || []
  const pieData = list.map(item => ({
    name: item.name,
    value: item.amount
  }))
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: pieData,
      label: { formatter: '{b}: {d}%' }
    }]
  })
}

// 学院柱状图
const renderCollegeBar = () => {
  const list = monthTopCollegeList.value || []
  const names = list.map(i => i.name)
  const amounts = list.map(i => i.amount)
  collegeBar.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>金额：¥{c}' },
    grid: { left: '10%', right: '10%', bottom: '20%' },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { rotate: 30, fontSize: 10 }
    },
    yAxis: { type: 'value' },
    series: [{ data: amounts, type: 'bar', itemStyle: { color: '#1677ff' } }]
  })
}

// 经办人柱状图
const renderUserBar = () => {
  const list = monthTopUserList.value || []
  const names = list.map(i => i.name).reverse()
  const amounts = list.map(i => i.amount).reverse()
  userBar.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>金额：¥{c}' },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: names },
    series: [{ data: amounts, type: 'bar', itemStyle: { color: '#36cbcb' } }]
  })
}

// 年度趋势
const renderYearLine = async () => {
  try {
    const raw = await request.get('/stats/month')
    const data: any = raw || {}
    const months = []
    const amounts = []
    for (let m = 1; m <= 12; m++) {
      const key = m + '月'
      months.push(key)
      let total = 0
      for (let sup in data) {
        if (data[sup]?.[key]) total += data[sup][key].amount || 0
      }
      amounts.push(total)
    }
    lineChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { data: months },
      yAxis: { type: 'value' },
      series: [{ data: amounts, type: 'line', smooth: true }]
    })
  } catch (e) {}
}

const renderAllCharts = () => {
  nextTick(() => {
    renderMonthPie()
    renderCollegeBar()
    renderUserBar()
  })
}

// 执行统计
const runStats = async () => {
  loading.value = true
  try {
    await request.get('/stats/trigger')
    ElMessage.success('统计成功')
    loadAllData()
  } catch (e: any) {
    ElMessage.error('失败：' + e.message)
  } finally { loading.value = false }
}

const loadAllData = () => {
  loadTotal()
  loadSupplier()
  loadCollege()
  loadMonthStats()
  renderYearLine()
}

// 年度总览
const loadTotal = async () => {
  totalLoading.value = true
  try {
    const res: any = await request.get('/stats/total')
    total.value = res || { total_amount: 0, total_count: 0 }
  } catch (e) {
    total.value = { total_amount: 0, total_count: 0 }
  }
  totalLoading.value = false
}

// 月度统计
const loadMonthStats = async () => {
  if (!month.value) return ElMessage.warning('请选择月份')
  monthLoading.value = true
  try {
    const totalRes: any = await request.get('/stats/month/total', { params: { month: month.value } })
    monthData.value = totalRes || { amount: 0, count: 0 }

    const collegeRes: any = await request.get('/stats/month/top/college', { params: { month: month.value } })
    monthTopCollegeList.value = collegeRes || []

    const userRes: any = await request.get('/stats/month/top/user', { params: { month: month.value } })
    monthTopUserList.value = userRes || []

    renderAllCharts()
  } catch (e) {
    monthData.value = { amount: 0, count: 0 }
    monthTopCollegeList.value = []
    monthTopUserList.value = []
  } finally {
    monthLoading.value = false
  }
}

// 供应商
const loadSupplier = async () => {
  supplierLoading.value = true
  try {
    const res: any = await request.get('/stats/supplier')
    supplierList.value = (res || []).sort((a: any, b: any) => b.amount - a.amount)
  } catch (e) {
    supplierList.value = []
  }
  supplierLoading.value = false
}

// 学院
const loadCollege = async () => {
  collegeLoading.value = true
  try {
    const data: any = await request.get('/stats/college')
    const arr: CollegeItem[] = []
    for (const name in data) {
      arr.push({
        name,
        amount: data[name].总金额 || 0,
        count: data[name].总次数 || 0
      })
    }
    collegeList.value = arr.sort((a, b) => b.amount - a.amount)
  } catch (e) {
    collegeList.value = []
  }
  collegeLoading.value = false
}

// 明细
const getMonthDetail = async () => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res: any = await request.get('/stats/detail/month', { params: { month: month.value } })
    detailItems.value = res?.items || []
  } catch (e) {
    detailItems.value = []
  }
  detailLoading.value = false
}

const openSupplierDetail = async (supplier: string) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res: any = await request.get('/stats/detail/supplier', { params: { supplier } })
    detailItems.value = res?.items || []
  } catch (e) {
    detailItems.value = []
  }
  detailLoading.value = false
}

const openCollegeDetail = async (college: string) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res: any = await request.get('/stats/detail/college', { params: { college } })
    detailItems.value = res?.items || []
  } catch (e) {
    detailItems.value = []
  }
  detailLoading.value = false
}

onMounted(() => {
  initCharts()
  loadAllData()
  window.addEventListener('resize', resizeAllCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAllCharts)
})
</script>

<style scoped>
.stats-container { padding: 20px; background: #f5f7fa; min-height: 100vh }
.header-box { display: flex; justify-content: space-between; margin-bottom: 20px }
.title { font-size: 20px; font-weight: bold }
.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px }
.card-item, .month-item { text-align: center }
.label { color: #666 }
.value { font-size: 22px; font-weight: bold; color: #1677ff; margin-top: 6px }
.month-card-row { display: flex; gap: 20px; justify-content: center; padding: 10px 0 }
.month-item { flex: 1; padding: 10px; background: #f9fafb; border-radius: 8px }
.chart-row { display: flex; gap: 20px; width: 100%; }
.chart-card { flex: 1; }
.chart-box { width: 100%; height: 300px; }
.top-row { display: flex; justify-content: space-between }

.chart-title {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 10px;
  color: #333;
}
.table-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
  padding-left: 5px;
}
</style>