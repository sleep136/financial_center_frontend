<!-- src/components/SharedForm.vue -->
<template>
  <div class="m-4">
    <p>部门编号</p>
    <el-input
        placeholder="部门编号"
        :model-value="department_id"
        @update:model-value="(val) => emit('update:department_id', val)"
    />
  </div>
  <div class="m-4">
    <p>项目编号</p>
    <el-input
        placeholder="项目编号"
        :model-value="program_id"
        @update:model-value="(val) => emit('update:program_id', val)"
    />
  </div>
</template>

<script setup>
// 使用 Composition API
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  department_id: {
    type: String,
    default: ''
  },
  program_id: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:department_id', 'update:program_id'])
</script>

<style scoped>
.m-4 {
  margin: 16px;
}
</style>