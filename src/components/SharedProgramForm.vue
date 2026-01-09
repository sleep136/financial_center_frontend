<!-- src/components/SharedForm.vue -->
<template>
  <div class="m-4">
    <p>部门编号</p>
    <el-input
        placeholder="部门编号"
        :model-value="department_id"
        @update:model-value="(val: string) => emit('update:department_id', val)"
    />
  </div>
  <div class="m-4">
    <p>项目编号</p>
    <el-input
        placeholder="项目编号"
        :model-value="program_id"
        @update:model-value="(val: string) => emit('update:program_id', val)"
    />
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue'

// 直接解构 props，或者不使用 props 变量
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

const emit = defineEmits<{
  'update:department_id': [value: string]
  'update:program_id': [value: string]
}>()
</script>

<style scoped>
.m-4 {
  margin: 16px;
}
</style>