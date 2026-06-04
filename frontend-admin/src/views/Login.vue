<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <el-icon size="40" color="#409EFF"><Setting /></el-icon>
        <h2>PDE 引擎管理后台</h2>
        <p>产研一体化引擎平台</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="管理员邮箱"
            size="large"
            :prefix-icon="UserIcon"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="LockIcon"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Setting, User as UserIcon, Lock as LockIcon } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const ok = await userStore.login(form.email, form.password)
    if (ok) {
      router.push('/admin/dashboard')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  width: 420px;
  padding: 50px 40px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  h2 {
    color: #fff;
    font-size: 24px;
    margin: 15px 0 8px;
    font-weight: 500;
  }

  p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }
}

.login-form {
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.15);

    .el-input__inner {
      color: #fff;

      &::placeholder {
        color: rgba(255, 255, 255, 0.35);
      }
    }

    .el-input__icon {
      color: rgba(255, 255, 255, 0.4);
    }
  }

  :deep(.el-input__wrapper.is-focus) {
    border-color: #409EFF;
  }
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}
</style>
