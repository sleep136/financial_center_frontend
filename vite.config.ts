 import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite';
import {ElementPlusResolver} from "unplugin-vue-components/resolvers";
import Components from 'unplugin-vue-components/vite';
import path from 'path';




export default defineConfig(({ mode }) => {
  // 环境变量
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      vue(),
      AutoImport({
        // 自动导入的组件
        imports: ['vue', 'vue-router'],
        // 解析器：当前使用了ElementPlus的解析器
        resolvers: [ElementPlusResolver()],
        // 开启eslint
        eslintrc: { enabled: true },
      }),
      Components({
        // 解析器：当前使用了ElementPlus的解析器
        resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
        // 以下文件夹中的组件自动导入
        dirs: ['src/components'],
      }),
    ],
    resolve: {
      alias: {
        // 设置路径别名
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // 网络请求代理
      proxy: {
        '/t/': {
          target: env.VITE_SERVER,
          changeOrigin: true,
        },
      },
    },
  };
});
