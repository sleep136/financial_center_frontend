<!-- src/components/SharedForm.vue -->
<template>
  <div class="m-4">
    <p>部门编号</p>
    <el-input
        placeholder="部门编号"
        :model-value="department_id"
        @update:model-value="(val:string) => emit('update:department_id', val)"
    />
  </div>
  <div class="m-4">
    <p>项目编号</p>
    <el-input
        placeholder="项目编号"
        :model-value="program_id"
        @update:model-value="(val:string) => emit('update:program_id', val)"
    />
  </div>
  <div class="m-4">
    <p>是否过滤已完成业务</p>
    <el-select :model-value="filter_state" placeholder="请选择"  @update:model-value="(val:number) => emit('update:filter_state', val)">
      <el-option
          v-for="item in filter_states"
          :key="item.value"
          :label="item.label"
          :value="item.value"
      ></el-option>
    </el-select>
  </div>
</template>

<script setup lang="ts">
// 使用 Composition API
import {defineProps, defineEmits} from 'vue'

 defineProps({
  department_id: {
    type: String,
    default: ''
  },
  program_id: {
    type: String,
    default: ''
  },
  filter_state: {
    type: Number,
    default: 1
  }
})
const filter_states = [
  {
    label: '是', value: 1
  },
  {
    label: '否', value: 2
  }]
const emit = defineEmits(['update:department_id', 'update:program_id','update:filter_state'])
</script>

<style scoped>
.m-4 {
  margin: 16px;
}
</style>