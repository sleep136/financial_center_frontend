import { createRouter, createWebHistory } from 'vue-router'
import {useUserStore} from "@/stores";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [ // 登录页
        { path: '/login', component: () => import('@/components/Login.vue') },
        // 布局页
        { path: '/', component: () => import('@/components/Index.vue') }
]
})

router.beforeEach((to, from, next) => {
// 获取缓存的数据

    console.log(from)
    const userStore = useUserStore()
    if(!userStore.token&& to.path!=='/login'){//用户没有登录
        next('/login')
    }else{
        next()
    }
})


export default router