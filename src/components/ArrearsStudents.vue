<template>
  <div class="arrears-container">
    <!-- 收费年度选择：统计与明细接口均按收费年度(SFQJDM)过滤 -->
    <el-card shadow="hover" class="header-card">
      <div class="header-box">
        <div class="title">欠费学生统计</div>
        <div class="year-selector">
          <span>收费年度：</span>
          <el-select
            v-model="feeYear"
            placeholder="选择收费年度"
            style="width: 160px"
            :clearable="false"
            @change="loadAllData"
          >
            <el-option
              v-for="opt in feeYearOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-item">
          <div class="stat-label">按年级统计</div>
          <div class="stat-value">{{ gradeStatistics.length }} 个年级</div>
          <div class="stat-total">总欠费人数：{{ getTotalCount(gradeStatistics) }}</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-item">
          <div class="stat-label">按学院统计</div>
          <div class="stat-value">{{ departmentGroups.length }} 个学院</div>
          <div class="stat-total">总欠费人数：{{ getTotalCount(departmentStatistics) }}</div>
        </div>
      </el-card>
    </div>

    <div class="stats-note">
      统计口径：以上数据均按<strong>收费年度 {{ feeYearLabel }}</strong> 过滤，覆盖该年度全部年级；
      同名学院已合并（一个学院可能对应多个部门代码）。学院明细默认展示<strong>全部年级</strong>，人数与卡片一致，也可在弹窗内切换单个年级。
    </div>

    <!-- 按年级统计 -->
    <el-card shadow="hover" class="content-card" v-loading="gradeLoading">
      <template #header>
        <div class="card-header">
          <span>按年级统计欠费学生人数</span>
        </div>
      </template>
      <el-table :data="gradeStatistics" border style="width: 100%">
        <el-table-column prop="rxnd" label="年级" width="150" />
        <el-table-column prop="student_count" label="欠费人数" width="150" align="center">
          <template #default="scope">
            <el-tag type="danger">{{ scope.row.student_count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewGradeDetail(scope.row.rxnd)">
              查看明细
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 按学院统计 -->
    <el-card shadow="hover" class="content-card" v-loading="departmentLoading">
      <template #header>
        <div class="card-header">
          <span>按学院统计欠费学生人数</span>
        </div>
      </template>
      <el-table :data="departmentGroups" border style="width: 100%">
        <el-table-column prop="bmdm" label="学院代码" width="170" show-overflow-tooltip />
        <el-table-column prop="bmmc" label="学院名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="student_count" label="欠费人数" width="150" align="center">
          <template #default="scope">
            <el-tag type="danger">{{ scope.row.student_count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewDepartmentDetail(scope.row)">
              查看明细并下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 欠费学生明细弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="detailTitle"
      width="90%"
      append-to-body
    >
      <div class="dialog-toolbar">
        <div class="toolbar-left" v-if="detailMode === 'department'">
          <span class="toolbar-label">年级：</span>
          <el-select
            v-model="detailGrade"
            placeholder="选择年级"
            style="width: 150px"
            @change="loadDepartmentDetail"
          >
            <el-option
              v-for="opt in departmentGradeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <el-button type="success" @click="exportDetailExcel" :disabled="!detailStudents.length">
          导出 Excel
        </el-button>
      </div>
      <el-table :data="detailStudents" border v-loading="detailLoading" height="500">
        <el-table-column prop="xh" label="学号" width="140" />
        <el-table-column prop="xm" label="姓名" width="100" />
        <el-table-column prop="rxnd" label="年级" width="90" />
        <el-table-column prop="bmdm" label="学院代码" width="100" />
        <el-table-column prop="bmmc" label="学院名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="bjmc" label="班级" min-width="180" show-overflow-tooltip />
        <el-table-column prop="yjje" label="应缴金额" width="130" align="right">
          <template #default="scope">{{ formatAmount(scope.row.yjje) }}</template>
        </el-table-column>
        <el-table-column prop="sjje" label="实缴金额" width="130" align="right">
          <template #default="scope">{{ formatAmount(scope.row.sjje) }}</template>
        </el-table-column>
        <el-table-column prop="qfje" label="欠费金额" width="130" align="right">
          <template #default="scope">
            <span style="color: #f56c6c; font-weight: bold">{{ formatAmount(scope.row.qfje) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/requests.ts'
import * as XLSX from 'xlsx'

// 类型定义
interface GradeStatistic {
  rxnd: string
  student_count: number
}

interface DepartmentStatistic {
  bmdm: string
  bmmc: string
  student_count: number
}

// 同名学院合并后的展示行：一个学院可能对应多个部门代码
interface DepartmentGroup {
  bmdm: string
  bmmc: string
  codes: string[]
  student_count: number
}

interface StudentDetail {
  xh: string
  xm: string
  rxnd: string
  bmdm: string
  bmmc: string
  bjmc: string
  yjje: string
  sjje: string
  qfje: string
}

// 响应式数据
// feeYear 是收费年度(SF_ZZ.SFQJDM)，与学生的入学年度(rxnd/年级)是两个独立维度
// 值为 'all' 时调用后端 /all 端点，查询所有年度汇总数据
const feeYear = ref<string>(new Date().getFullYear().toString())

const feeYearOptions = computed(() => [
  { label: '所有年度', value: 'all' },
  ...Array.from({ length: 5 }, (_, i) => {
    const year = (new Date().getFullYear() - i).toString()
    return { label: year, value: year }
  })
])
const gradeLoading = ref(false)
const departmentLoading = ref(false)
const detailLoading = ref(false)
const detailVisible = ref(false)
const detailMode = ref<'grade' | 'department'>('grade')
const detailGrade = ref('')
const detailDepartmentCodes = ref<string[]>([])
const detailDepartmentName = ref('')
const gradeStatistics = ref<GradeStatistic[]>([])
const departmentStatistics = ref<DepartmentStatistic[]>([])
const detailStudents = ref<StudentDetail[]>([])

// 学院明细的年级筛选：默认「全部年级」，此时人数与统计卡片一致
const ALL_GRADES = 'all'

const departmentGradeOptions = computed(() => [
  { label: '全部年级', value: ALL_GRADES },
  ...gradeStatistics.value.map(item => ({ label: item.rxnd, value: item.rxnd }))
])

// 按「收费年度 + 年级」缓存明细，切换学院或年级时避免重复拉取同一批数据
const gradeStudentsCache = new Map<string, StudentDetail[]>()

async function fetchGradeStudents(grade: string): Promise<StudentDetail[]> {
  const key = `${feeYear.value}|${grade}`
  const cached = gradeStudentsCache.get(key)
  if (cached) {
    return cached
  }
  const res: any = await request.get(`/arrears-students/details/${grade}/${feeYear.value}`)
  const students: StudentDetail[] = res?.students || []
  gradeStudentsCache.set(key, students)
  return students
}

// 后端同一学院会拆成多个部门代码（如材料科学与工程学院 = 101 + 39907），且名称存在
// 全角/半角括号混用（法律与社会工作学院（知识产权学院） vs 法律与社会工作学院(知识产权学院)），
// 因此必须先归一化名称再按名称合并，否则同名学院会被算成两行
function normalizeDeptName(name: string): string {
  return (name || '').replace(/\s+/g, '').replace(/（/g, '(').replace(/）/g, ')')
}

const departmentGroups = computed<DepartmentGroup[]>(() => {
  const map = new Map<string, DepartmentGroup>()
  for (const item of departmentStatistics.value) {
    const key = normalizeDeptName(item.bmmc)
    const group = map.get(key)
    if (group) {
      group.codes.push(item.bmdm)
      group.student_count += item.student_count
    } else {
      map.set(key, {
        bmdm: item.bmdm,
        bmmc: item.bmmc,
        codes: [item.bmdm],
        student_count: item.student_count
      })
    }
  }
  return [...map.values()]
    .map(group => ({ ...group, bmdm: group.codes.join('、') }))
    .sort((a, b) => b.student_count - a.student_count)
})

const feeYearLabel = computed(() => feeYear.value === 'all' ? '所有年度' : feeYear.value)

const detailTitle = computed(() => {
  if (detailMode.value === 'department') {
    const gradeLabel = detailGrade.value === ALL_GRADES ? '全部年级' : `${detailGrade.value} 年级`
    return `${detailDepartmentName.value}（${feeYearLabel.value} · ${gradeLabel}）欠费学生明细`
  }
  return `${detailGrade.value} 年级（${feeYearLabel.value}）欠费学生明细`
})

// 获取总人数
function getTotalCount(list: any[]): number {
  return list.reduce((sum, item) => sum + (item.student_count || 0), 0)
}

// 金额格式化：后端返回字符串金额，统一按千分位 + 两位小数展示
function formatAmount(value: string | number | null | undefined): string {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return '¥0.00'
  }
  return `¥${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`
}

// 加载统计数据：两个统计接口均按收费年度过滤
function loadAllData() {
  gradeStudentsCache.clear()
  loadGradeStatistics()
  loadDepartmentStatistics()
}

// 加载按年级统计数据
async function loadGradeStatistics() {
  gradeLoading.value = true
  try {
    const path = feeYear.value === 'all'
      ? '/arrears-students/statistics/grade/all'
      : `/arrears-students/statistics/grade/${feeYear.value}`
    const res: any = await request.get(path)
    gradeStatistics.value = res?.statistics || []
  } catch (error: any) {
    console.error('加载年级统计失败:', error)
    ElMessage.error('加载年级统计数据失败')
    gradeStatistics.value = []
  } finally {
    gradeLoading.value = false
  }
}

// 加载按学院统计数据
async function loadDepartmentStatistics() {
  departmentLoading.value = true
  try {
    const path = feeYear.value === 'all'
      ? '/arrears-students/statistics/department/all'
      : `/arrears-students/statistics/department/${feeYear.value}`
    const res: any = await request.get(path)
    const list: DepartmentStatistic[] = res?.statistics || []
    // 后端部分学院名称带有尾部换行符，统一清理后再展示/导出
    departmentStatistics.value = list.map(item => ({
      ...item,
      bmmc: (item.bmmc || '').replace(/\s+$/g, '')
    }))
  } catch (error: any) {
    console.error('加载学院统计失败:', error)
    ElMessage.error('加载学院统计数据失败')
    departmentStatistics.value = []
  } finally {
    departmentLoading.value = false
  }
}

// 查看年级明细：details 接口按「年级 + 收费年度」定位，后端已过滤好
function viewGradeDetail(grade: string) {
  detailMode.value = 'grade'
  detailGrade.value = grade
  detailVisible.value = true
  loadGradeDetail()
}

async function loadGradeDetail() {
  detailLoading.value = true
  try {
    detailStudents.value = await fetchGradeStudents(detailGrade.value)

    if (!detailStudents.value.length) {
      ElMessage.info('该年级暂无欠费学生')
    }
  } catch (error: any) {
    console.error('加载年级明细失败:', error)
    ElMessage.error('加载明细数据失败')
    detailStudents.value = []
  } finally {
    detailLoading.value = false
  }
}

// 查看学院明细：默认全部年级，使人数与统计卡片一致，可在弹窗内切换单个年级
function viewDepartmentDetail(group: DepartmentGroup) {
  detailMode.value = 'department'
  detailDepartmentCodes.value = group.codes
  detailDepartmentName.value = group.bmmc
  detailGrade.value = ALL_GRADES
  detailVisible.value = true
  loadDepartmentDetail()
}

// 学院明细加载：
// - fee_year=all 时使用 /department/all/all/{code} 专用端点，避免拉取全量数据再过滤
// - fee_year 为具体年度时，按年级拉取全量明细后在前端按 bmdm 过滤（各代码间无重复学号）
async function loadDepartmentDetail() {
  detailLoading.value = true
  try {
    const codes = detailDepartmentCodes.value

    if (feeYear.value === 'all') {
      const lists = await Promise.all(
        codes.map(code =>
          request.get(`/arrears-students/department/all/all/${code}`).then((res: any) => res?.students || [])
        )
      )
      detailStudents.value = lists.flat()
    } else {
      const grades = detailGrade.value === ALL_GRADES
        ? gradeStatistics.value.map(item => item.rxnd)
        : [detailGrade.value]

      const lists = await Promise.all(grades.map(grade => fetchGradeStudents(grade)))
      detailStudents.value = lists
        .flat()
        .filter(student => codes.includes(student.bmdm))
    }

    if (!detailStudents.value.length) {
      ElMessage.info('该学院暂无欠费学生')
    }
  } catch (error: any) {
    console.error('加载学院明细失败:', error)
    ElMessage.error('加载明细数据失败')
    detailStudents.value = []
  } finally {
    detailLoading.value = false
  }
}

// 导出明细 Excel
function exportDetailExcel() {
  if (!detailStudents.value.length) {
    ElMessage.warning('无数据可导出')
    return
  }
  
  const exportData = detailStudents.value.map(item => ({
    '学号': item.xh,
    '姓名': item.xm,
    '年级': item.rxnd,
    '学院代码': item.bmdm,
    '学院名称': item.bmmc,
    '班级': item.bjmc,
    '应缴金额': Number(item.yjje) || 0,
    '实缴金额': Number(item.sjje) || 0,
    '欠费金额': Number(item.qfje) || 0
  }))
  
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '欠费学生明细')
  
  const fileName = `${detailTitle.value}_${new Date().getTime()}.xlsx`
  XLSX.writeFile(wb, fileName)
  ElMessage.success('导出成功')
}

// 组件挂载时加载数据
onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
.arrears-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header-card {
  margin-bottom: 20px;
}

.header-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.stats-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-item {
  padding: 10px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1677ff;
  margin-bottom: 8px;
}

.stat-total {
  font-size: 13px;
  color: #999;
}

.stats-note {
  margin: -8px 0 20px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #8a6d3b;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
}

.content-card {
  margin-bottom: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.dialog-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  margin-right: auto;
}

.toolbar-label {
  font-size: 14px;
  color: #606266;
}
</style>
