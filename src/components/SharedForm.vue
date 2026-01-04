<!-- src/components/SharedForm.vue -->
<template>
    <div class="m-4">
      <p>部门编号</p>
      <el-cascader
          placeholder="部门编号"
          :options="options"
          filterable
      />
    </div>
    <div class="m-4">
      <p>项目编号</p>
      <el-cascader
          placeholder="项目编号"
          :options="options"
          :props="props"
          filterable
      />
    </div>
</template>

<script>
export default {
  name: 'SharedForm',
  props: {
    name: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    }
  },

}
</script>