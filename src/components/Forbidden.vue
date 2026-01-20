<!-- components/Forbidden.vue -->
<template>
  <div class="forbidden-container">
    <div class="forbidden-content">
      <el-result
          icon="warning"
          title="403 Forbidden"
          sub-title="抱歉，您没有权限访问此页面"
      >
        <template #extra>
          <el-button type="primary" @click="goBack">返回上一页</el-button>
          <el-button @click="goHome">返回首页</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.forbidden-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.forbidden-content {
  text-align: center;
}
</style>