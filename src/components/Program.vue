<template>
  <div>
    <shared-form
        v-model:name="formData.name"
        v-model:email="formData.email"
    />
    <el-tabs v-model="activeTab">
      <el-tab-pane label="报销明细" name="报销明细">
        <!-- 添加 el-table 包裹 el-table-column -->
        <el-table :data="tableData" style="width: 100%">
          <el-table-column prop="date" label="Date" width="180"/>
          <el-table-column prop="name" label="Name" width="180"/>
          <el-table-column prop="address" label="Address"/>
        </el-table>

        <el-pagination
            size="small"
            background
            layout="prev, pager, next"
            :total="50"
            class="mt-4"
        />
      </el-tab-pane>

      <el-tab-pane label="劳务明细" name="劳务明细">
        <!-- 这里也可以添加表格 -->
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import {ref, reactive} from 'vue'
import SharedForm from './SharedForm.vue'

const activeTab = ref('报销明细')
const formData = ref({
  name: '',
  email: ''
})

// 添加表格数据
const tableData = reactive([
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'John',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Morgan',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Jessy',
    address: 'No. 189, Grove St, Los Angeles',
  },
])
</script>

<style scoped>

</style>