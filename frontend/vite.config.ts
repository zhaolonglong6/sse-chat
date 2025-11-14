import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 配置
// https://vitejs.dev/config/
export default defineConfig({
  // 使用 Vue 插件
  plugins: [vue()],

  // 开发服务器配置
  server: {
    port: 5173, // 开发服务器端口
    open: true, // 启动时自动打开浏览器
    // CORS 配置（允许跨域请求）
    cors: true
  },

  // 构建配置
  build: {
    // 输出目录
    outDir: 'dist',
    // 是否生成 source map
    sourcemap: false,
    // 代码分割策略
    rollupOptions: {
      output: {
        // 手动配置代码分割
        manualChunks: {
          'vue-vendor': ['vue']
        }
      }
    }
  }
})
