<template>
  <!-- 应用根容器 -->
  <div id="app">
    <!-- 引入聊天组件 -->
    <ChatComponent />
  </div>
</template>

<script setup lang="ts">
// 导入聊天组件
import ChatComponent from './components/ChatComponent.vue'
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 根元素样式 */
#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 设置默认字体 */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
