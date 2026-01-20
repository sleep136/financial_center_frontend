<!-- Index.vue -->
<template>
  <div class="container">
    <!-- 原有模板代码 -->
    <div class="bar" v-if="$route.path != '/login' && isAuthenticated">
      <!-- 菜单代码 -->
    </div>

    <div class="content" :class="{ 'full-width': !isAuthenticated || $route.path === '/login' }">
      <div class="main">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const isCollapse = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentActive = computed(() => route.path)

// 检查权限
const canAccess = (paths: string | string[]): boolean => {
  if (!authStore.isAuthenticated) return false

  if (Array.isArray(paths)) {
    return paths.some(path => authStore.canAccessPage(path))
  }

  return authStore.canAccessPage(paths)
}

// 路由变化监听
window.addEventListener('popstate', () => {
  if (route.name) {
    console.log('路由变化:', route.path)
  }
})
</script>

<style scoped>
/* 样式代码 */
</style>