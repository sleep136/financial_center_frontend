<!-- directives/permission.js -->
import { useAuthStore } from '@/stores/auth'

export const permissionDirective = {
    mounted(el, binding) {
        const authStore = useAuthStore()
        const { value } = binding

        if (value === 'admin' && !authStore.isAdmin) {
            el.parentNode?.removeChild(el)
        } else if (value === 'accountant' && !authStore.isAccountant) {
            el.parentNode?.removeChild(el)
        } else if (typeof value === 'string' && value.startsWith('/')) {
            // 检查路径权限
            if (!authStore.hasPermission(value)) {
                el.parentNode?.removeChild(el)
            }
        } else if (Array.isArray(value)) {
            // 检查组权限
            const [requiredGroup] = value
            if (!authStore.userGroups.includes(requiredGroup)) {
                el.parentNode?.removeChild(el)
            }
        }
    }
}