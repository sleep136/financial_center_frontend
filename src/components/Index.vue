<template>


</template>

<script setup lang="ts">
import {ref, defineExpose} from 'vue'

import {useRouter} from 'vue-router'

import {useRouterStore} from "@/stores";

const router = useRouter()
const routerStore = useRouterStore()
const isCollapse = ref(false)


defineExpose({
  isCollapse,
})

// const addTab = (routePath)=>{


window.addEventListener('popstate', () => {
  if (router.currentRoute.value.name) {
    routerStore.setCurrentSelected(router.currentRoute.value.toString())
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