<script setup lang="ts">

import { ref } from 'vue'

const searchQuery = ref('')
const gridColumns = ['name', 'power']
const gridData = [
  { name: 'Chuck Norris', power: Infinity },
  { name: 'Bruce Lee', power: 9000 },
  { name: 'Jackie Chan', power: 7000 },
  { name: 'Jet Li', power: 8000 }
]
</script>

<template>
  <form id="search">
    学号 <input name="query" v-model="searchQuery">
  </form>
  <el-table
      :data="gridData"
      :columns="gridColumns"
      :filter-key="searchQuery">
  </el-table>
</template>

<style scoped>

</style>