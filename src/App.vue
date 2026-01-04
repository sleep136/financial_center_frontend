<template>
  <div class="container">
    <div class="bar" v-if="$route.path != '/login'">
      <el-menu
          default-active="2"
          class="el-menu-vertical"
          :collapse="isCollapse"
          :default-active="routerStore.currentSelected"
          @open="handleOpen"
          @close="handleClose"
          router
      >
        <el-menu-item index="1" class="titleName">
          <el-icon>
            <Management/>
          </el-icon>
          <template #title>财务管理中心</template>
        </el-menu-item>

        <el-sub-menu index="2" class="menu">
          <template #title>
            <el-icon>
              <Management/>
            </el-icon>
            <span>项目查询</span>
          </template>

          <el-menu-item index="program" class="menu">报销明细</el-menu-item>
          <el-menu-item index="1-2" class="menu">冻结明细</el-menu-item>
          <el-menu-item index="1-3" class="menu">收支明细</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="3" class="menu">
          <template #title>
            <el-icon>
              <Management/>
            </el-icon>
            <span>学生费用查询</span>
          </template>
          <el-menu-item index="student" class="menu">欠缴费用查询</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="4" class="menu">
          <template #title>
            <el-icon>
              <Management/>
            </el-icon>
            <span>教师经费查询</span>
          </template>
          <el-menu-item index="teacher" class="menu">项目授权情况</el-menu-item>
          <el-menu-item index="3-2" class="menu">借票申请列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="5" class="menu">
          <template #title>
            <el-icon>
              <Management/>
            </el-icon>
            <span>凭证处理</span>
          </template>
          <el-menu-item index="voucher" class="menu">工资凭证处理</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="6" class="menu">
          <template #title>
            <el-icon>
              <Management/>
            </el-icon>
            <span>科目汇总</span>
          </template>
          <el-menu-item index="method_of_account_title_summary" class="menu">汇总计算</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="8" class="menu">
          <template #title>
            <el-icon>
              <Management/>
            </el-icon>
            <span>审批流查询</span>
          </template>
          <el-menu-item index="4-1" class="menu">审批详情</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="8" class="menu">
          <template #title>
            <el-icon>
              <Management/>
            </el-icon>
            <span>学生信息查询</span>
          </template>
          <el-menu-item index="4-1" class="menu">学生信息查询</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="9" class="menu">
          <template #title>
            <el-icon>
              <Management/>
            </el-icon>
            <span>管理配置</span>
          </template>
          <el-menu-item index="4-1" class="menu">权限管理</el-menu-item>
        </el-sub-menu>


      </el-menu>
    </div>
    <div class="content">
      <div class="main">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, defineExpose} from 'vue'
import {Management} from '@element-plus/icons-vue'
import {useRouter} from 'vue-router'

import {useRouterStore} from "@/stores";

const router = useRouter()
const routerStore = useRouterStore()
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

// const addTab = (routePath)=>{

// 点击更换导航栏图片
const NavigationBarChanges = (e) => {
  var domList = e.currentTarget.parentNode.children
  for (let d = 0; d < domList.length; d++) {
    domList[d].className = 'nav-item'
  }
  console.log("点击", e.currentTarget)
  e.currentTarget.className = 'nav-item isclick'

}
window.addEventListener('popstate', () => {
  if (router.currentRoute.value.name) {
    routerStore.setCurrentSelected(router.currentRoute)
  }
})
</script>

<style scoped>
.el-menu-vertical, .el-menu-vertical:not(.el-menu--collapse) {
  height: 100vh;
}

.titleName {
  font-size: 24px;
  font-weight: 600;
}

.menu {
  font-size: 14px;

}
.container{
  display: flex;
  justify-content: space-between;
}
.bar {
  width: 200px;

}
.content {
  width: calc(100vw - 200px);
}
.main{
  padding: 20px;
}
</style>