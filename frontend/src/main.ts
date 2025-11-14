// 引入 Vue 的 createApp 方法，用于创建 Vue 应用实例
import { createApp } from 'vue'
// 引入主样式文件
import './style.css'
// 引入根组件
import App from './App.vue'

// 创建 Vue 应用实例
const app = createApp(App)

// 挂载应用到 #app 元素
app.mount('#app')

// 打印启动信息
console.log('🚀 Vue 应用已启动')
