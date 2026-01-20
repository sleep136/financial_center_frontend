<!-- Login.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from "element-plus"
import { useAuthStore } from '@/stores/auth'

const form = ref()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginModel = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }]
}

const handleLogin = async () => {
  try {
    // 验证表单
    await form.value.validate()

    // 登录
    await authStore.login(loginModel.value.username, loginModel.value.password)

    ElMessage.success('登录成功')

    // 跳转
    const redirect = route.query.redirect || '/'
    await router.push(redirect as string)
  } catch (error: any) {
    console.error('登录失败:', error)
    ElMessage.error(error.response?.data?.detail || '登录失败')
  }
}
</script>

<template>
  <div class="container">
    <!-- 原有的HTML结构 -->
    <div class="login-wrapper">
      <div class="header">登录</div>
      <el-form
          class="form-wrapper"
          :model="loginModel"
          :rules="rules"
          ref="form"
      >
        <el-form-item label="账号:" prop="username">
          <el-input
              placeholder="请输入账号"
              v-model="loginModel.username"
          ></el-input>
        </el-form-item>
        <el-form-item label="密码:" class="password" prop="password">
          <el-input
              placeholder="请输入密码"
              type="password"
              v-model="loginModel.password"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button class="btn" @click="handleLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.container {
  background-image: linear-gradient(to right, #fbc2eb, #a6c1ee);
  width: 100%;
  height: 100vh;
}

.login-wrapper {
  background-color: #fff;
  width: 358px;
  height: 588px;
  border-radius: 15px;
  padding: 0 50px;
  position: relative;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.header {
  font-size: 38px;
  font-weight: bold;
  text-align: center;
  line-height: 200px;
}

.password {
  margin-top: 30px;
}

.btn {
  color: #fff;
  font-size: large;
  margin-top: 40px;
  height: 45px;
  width: 100%;
  background-image: linear-gradient(to right, #a6c1ee, #fbc2eb);
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}


</style>