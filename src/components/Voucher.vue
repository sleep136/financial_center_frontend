<script setup lang="ts">

</script>

<template>
  <div class="m-4">
    <p>人员类型</p>
    <el-cascader
        placeholder="人员类型"
        :options="options"
        filterable
    />
  </div>
  <div class="m-4">
    <p>模板类型</p>
    <el-cascader
        placeholder="模板类型"
        :options="options"
        filterable
    />
  </div>

</template>

<style scoped>

</style>