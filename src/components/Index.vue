<template>


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