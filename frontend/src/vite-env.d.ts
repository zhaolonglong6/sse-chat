// Vue 组件类型定义文件
// 用于让 TypeScript 识别 .vue 文件

// 声明 .vue 文件模块
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  // 定义 Vue 组件类型
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>

  export default component
}
