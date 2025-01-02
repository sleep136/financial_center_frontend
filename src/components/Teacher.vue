<script setup lang="ts">

</script>

<template>
  <form id="search">
    工号 <input name="query" v-model="searchQuery">
    <el-button type="primary" :icon="Search">查询</el-button>
  </form>

  <el-table
      :data="gridData"
      :columns="gridColumns"
      :filter-key="searchQuery">
  </el-table>
</template>

<style scoped>

</style>