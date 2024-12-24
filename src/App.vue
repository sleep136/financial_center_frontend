<script setup lang="ts">


import { ref } from 'vue';
const narbar = ref(null);

const updateNarBar = () => {
  narbar.value.isCollapse = !narbar.value.isCollapse;
}
</script>

<template>
  <div class="common-layout">
    <el-container>


        <el-main>
          <!-- 内容 -->
          <router-view />
        </el-main>

    </el-container>
  </div>
  </template>

<style scoped>

* {
  padding: 0%;
  margin: 0%;
}
</style>
