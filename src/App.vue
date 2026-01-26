<template>
  <div class="container">
    <div class="bar" v-if="$route.path != '/login' && isAuthenticated">
      <el-menu
          class="el-menu-vertical"
          :collapse="isCollapse"
          :default-active="currentActive"
          router
      >
        <el-menu-item index="/" class="titleName">
          <el-icon>
            <Management/>
          </el-icon>
          <template #title>财务管理中心</template>
        </el-menu-item>

        <!-- 项目查询模块 -->
        <el-sub-menu
            v-if="canAccess(['/program', '/program_freeze', '/voucher'])"
            index="project"
        >
          <template #title>
            <el-icon><Management/></el-icon>
            <span>项目查询</span>
          </template>

          <el-menu-item
              v-if="canAccess('/program')"
              index="/program"
          >
            报销明细
          </el-menu-item>

          <el-menu-item
              v-if="canAccess('/program_freeze')"
              index="/program_freeze"
          >
            冻结明细
          </el-menu-item>

          <el-menu-item
              v-if="canAccess('/voucher')"
              index="/voucher"
          >
            科研科目汇总
          </el-menu-item>
        </el-sub-menu>

        <!-- 学生费用查询模块 -->
        <el-sub-menu
            v-if="canAccess('/student')"
            index="student"
        >
          <template #title>
            <el-icon><Management/></el-icon>
            <span>学生费用查询</span>
          </template>
          <el-menu-item index="/student">欠缴费用查询</el-menu-item>
        </el-sub-menu>

        <!-- 指标管理模块 -->
        <el-sub-menu
            v-if="canAccess('/indicator')"
            index="indicator"
        >
          <template #title>
            <el-icon><Management/></el-icon>
            <span>指标管理</span>
          </template>
          <el-menu-item index="/indicator">指标管理</el-menu-item>
        </el-sub-menu>

        <!-- 教师经费查询模块 -->
        <el-sub-menu
            v-if="canAccess(['/authorization', '/invoice'])"
            index="teacher"
        >
          <template #title>
            <el-icon><Management/></el-icon>
            <span>教师经费查询</span>
          </template>
          <el-menu-item
              v-if="canAccess('/authorization')"
              index="/authorization"
          >
            项目授权情况
          </el-menu-item>

          <el-menu-item
              v-if="canAccess('/invoice')"
              index="/invoice"
          >
            发票绑定情况
          </el-menu-item>
        </el-sub-menu>

        <!-- 审批流查询模块 -->
        <el-sub-menu
            v-if="canAccess('/approval_workflow')"
            index="approval"
        >
          <template #title>
            <el-icon><Management/></el-icon>
            <span>审批流查询</span>
          </template>
          <el-menu-item index="/approval_workflow">审批详情</el-menu-item>
        </el-sub-menu>

        <!-- 科目汇总模块 -->
        <el-sub-menu
            v-if="canAccess('/method_of_account_title_summary')"
            index="account"
        >
          <template #title>
            <el-icon><Management/></el-icon>
            <span>科目汇总</span>
          </template>
          <el-menu-item index="/method_of_account_title_summary">汇总计算</el-menu-item>
        </el-sub-menu>

        <!-- 管理配置模块 - 只对管理员显示 -->
        <el-sub-menu
            v-if="isAdmin"
            index="admin"
        >
          <template #title>
            <el-icon><Management/></el-icon>
            <span>管理配置</span>
          </template>
          <el-menu-item index="/admin/user">权限管理</el-menu-item>
        </el-sub-menu>
      </el-menu>
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
import { Management } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const isCollapse = ref(false)

// 计算属性
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const currentActive = computed(() => route.path)

// 检查权限的快捷方法
const canAccess = (paths: string | string[]): boolean => {
  if (!authStore.isAuthenticated) return false

  if (Array.isArray(paths)) {
    return paths.some(path => authStore.canAccessPage(path))
  }

  return authStore.canAccessPage(paths)
}
</script>

<style scoped>
/* 样式保持不变 */
.el-menu-vertical, .el-menu-vertical:not(.el-menu--collapse) {
  height: 100vh;
}

.titleName {
  font-size: 24px;
  font-weight: 600;
}

.container {
  display: flex;
  justify-content: space-between;
  height: 100vh;
}

.bar {
  width: 200px;
  background-color: #f5f7fa;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.content {
  width: calc(100vw - 200px);
  overflow-y: auto;
  background-color: #f8f9fa;
}

.content.full-width {
  width: 100vw;
}

.main {
  padding: 20px;
  min-height: calc(100vh - 40px);
}
</style>