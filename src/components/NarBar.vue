<template>
  <el-menu
      default-active="2"
      class="el-menu-vertical"
      :collapse="isCollapse"
      @open="handleOpen"
      @close="handleClose"
  >
    <el-menu-item index="1" class="titleName">
      <el-icon><Management /></el-icon>
      <template #title>财务管理中心</template>
    </el-menu-item>

    <el-sub-menu index="2" class="menu">
      <template #title>
        <el-icon><Management /></el-icon>
        <span>项目查询</span>
      </template>
      <el-menu-item index="1-1" class="menu" @click="$emit('addTab','LibrarySortEnter','报销明细')">报销明细</el-menu-item>
      <el-menu-item index="1-2" class="menu" @click="$emit('addTab','StorePositionEnter','冻结明细')">冻结明细 </el-menu-item>
      <el-menu-item index="1-3" class="menu">收支明细</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="3" class="menu">
      <template #title>
        <el-icon><Management /></el-icon>
        <span>学生费用查询</span>
      </template>
      <el-menu-item index="2-1" class="menu">欠缴费用查询</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="4" class="menu">
      <template #title>
        <el-icon><Management /></el-icon>
        <span>教师经费查询</span>
      </template>
      <el-menu-item index="3-1" class="menu">项目授权情况</el-menu-item>
      <el-menu-item index="3-2" class="menu">借票申请列表</el-menu-item>
    </el-sub-menu>
    <el-sub-menu index="5" class="menu">
      <template #title>
        <el-icon><Management /></el-icon>
        <span>凭证处理</span>
      </template>
      <el-menu-item index="4-1" class="menu">工资凭证处理</el-menu-item>
    </el-sub-menu>
    <el-sub-menu index="6" class="menu">
      <template #title>
        <el-icon><Management /></el-icon>
        <span>管理配置</span>
      </template>
      <el-menu-item index="4-1" class="menu">权限管理</el-menu-item>
    </el-sub-menu>



  </el-menu>
</template>

<script setup>
import { ref,defineExpose } from 'vue'
import { Management } from '@element-plus/icons-vue'

const isCollapse = ref(false)

const handleOpen = (key, keyPath) => {
  console.log(key, keyPath)
}
const handleClose = (key, keyPath) => {
  console.log(key, keyPath);
}

defineExpose({
  isCollapse,
})
</script>

<style scoped>
.el-menu-vertical,.el-menu-vertical:not(.el-menu--collapse){
  height: 100vh;
}
.titleName{
  font-size: 24px;
  font-weight: 600;
}
.menu{
  font-size: 14px;

}
</style>