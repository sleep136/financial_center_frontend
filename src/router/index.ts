// router/index.ts - 合并后的版本
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/components/Login.vue'),
        meta: { keepAlive: false }
    },
    {
        path: '/forbidden',
        name: 'Forbidden',
        component: () => import('@/components/Forbidden.vue'),
        meta: { keepAlive: false }
    },
    {
        path: '/',
        name: 'Home',
        component: () => import('@/components/Index.vue'),
        meta: { keepAlive: true, requiresAuth: true }
    },
    {
        path: '/program',
        name: 'Program',
        component: () => import('@/components/Program.vue'),
        meta: { keepAlive: true, requiresAuth: true }
    },
    {
        path: '/program_freeze',
        name: 'ProgramFreeze',
        component: () => import('@/components/ProgramFreeze.vue'),
        meta: { keepAlive: true, requiresAuth: true }
    },
    {
        path: '/authorization',
        name: 'Authorization',
        component: () => import('@/components/Authorization.vue'),
        meta: { keepAlive: true, requiresAuth: true }
    },
    {
        path: '/student',
        name: 'Student',
        component: () => import('@/components/Student.vue'),
        meta: { keepAlive: true, requiresAuth: true }
    },
    {
        path: '/invoice',
        name: 'Invoice',
        component: () => import('@/components/Invoice.vue'),
        meta: { keepAlive: true, requiresAuth: true }
    },
    {
        path: '/teacher',
        name: 'Teacher',
        component: () => import('@/components/Teacher.vue'),
        meta: { keepAlive: true, requiresAuth: true }
    },
    {
        path: '/indicator',
        name: 'Indicator',
        component: () => import('@/components/Indicator.vue'),
        meta: { keepAlive: true, requiresAuth: true }
    },
    {
        path: '/voucher',
        name: 'Voucher',
        component: () => import('@/components/SummaryOfResearchSubjects.vue'),
        meta: { keepAlive: true, requiresAuth: true }
    },
    {
        path: '/approval_workflow',
        name: 'ApprovalWorkflow',
        component: () => import('@/components/ApprovalWorkflow.vue'),
        meta: { keepAlive: true, requiresAuth: true }
    },
    {
        path: '/method_of_account_title_summary',
        name: 'MethodOfAccountTitleSummary',
        component: () => import('@/components/AccountTitleSummary.vue'),
        meta: { keepAlive: true, requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
    console.log('路由跳转:', from.path, '->', to.path)

    // 公开页面
    if (to.path === '/login' || to.path === '/forbidden') {
        next()
        return
    }

    // 需要认证的页面
    if (to.meta.requiresAuth) {
        // 动态导入，避免循环依赖
        const { useAuthStore } = await import('@/stores/auth')
        const authStore = useAuthStore()

        // 检查是否登录
        if (!authStore.isAuthenticated) {
            console.log('未登录，跳转到登录页')
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            })
            return
        }

        // 检查页面权限
        if (!authStore.canAccessPage(to.path)) {
            console.log('无权限访问:', to.path)
            next('/forbidden')
            return
        }
    }

    next()
})

export default router