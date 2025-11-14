<template>
  <!-- 聊天容器 -->
  <div class="chat-container">
    <!-- ==================== 头部区域 ==================== -->
    <div class="chat-header">
      <!-- 标题 -->
      <h2>SSE 实时对话</h2>

      <!-- 连接状态指示器 -->
      <div class="status-indicator" :class="statusClass">
        <!-- 状态图标（圆点）-->
        <span class="status-dot"></span>
        <!-- 状态文字 -->
        <span class="status-text">{{ statusText }}</span>
      </div>

      <!-- 控制按钮组 -->
      <div class="header-actions">
        <!-- 连接/断开按钮 -->
        <button
          v-if="!isConnected"
          @click="handleConnect"
          class="btn btn-primary"
        >
          连接
        </button>
        <button v-else @click="handleDisconnect" class="btn btn-danger">
          断开连接
        </button>

        <!-- 清空聊天按钮 -->
        <button @click="handleClearChat" class="btn btn-secondary">
          清空聊天
        </button>
      </div>
    </div>

    <!-- ==================== 消息列表区域 ==================== -->
    <div class="chat-messages" ref="messagesContainer">
      <!-- 如果没有消息，显示欢迎信息 -->
      <div v-if="messages.length === 0" class="empty-state">
        <p>👋 欢迎使用 SSE 实时对话</p>
        <p class="hint">点击上方"连接"按钮开始对话</p>
      </div>

      <!-- 消息列表 -->
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message-item"
        :class="message.role"
      >
        <!-- 消息头像 -->
        <div class="message-avatar">
          {{ message.role === "user" ? "👤" : "🤖" }}
        </div>

        <!-- 消息内容 -->
        <div class="message-content">
          <!-- 消息文本 -->
          <div class="message-text">{{ message.content }}</div>

          <!-- 消息元数据（时间戳）-->
          <div class="message-meta">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
      </div>

      <!-- 加载中指示器（AI 正在回复时显示）-->
      <div v-if="isAITyping" class="message-item assistant typing">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 输入区域 ==================== -->
    <div class="chat-input-area">
      <!-- 输入框 -->
      <textarea
        v-model="inputMessage"
        @keydown.enter.exact.prevent="handleSendMessage"
        placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
        class="chat-input"
        :disabled="!isConnected || isSending"
        rows="3"
      ></textarea>

      <!-- 发送按钮 -->
      <button
        @click="handleSendMessage"
        class="btn btn-send"
        :disabled="!isConnected || isSending || !inputMessage.trim()"
      >
        {{ isSending ? "发送中..." : "发送" }}
      </button>
    </div>

    <!-- ==================== 调试信息区域（可选）==================== -->
    <div v-if="showDebugInfo" class="debug-info">
      <details>
        <summary>调试信息</summary>
        <div class="debug-content">
          <p><strong>客户端 ID:</strong> {{ clientId || "未连接" }}</p>
          <p><strong>连接状态:</strong> {{ connectionState }}</p>
          <p><strong>消息总数:</strong> {{ messages.length }}</p>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { createSSEClient, type SSEClientInstance } from "../utils/SSEClient";

// ==================== 配置常量 ====================

/** SSE 服务器地址 */
const SSE_SERVER_URL = "http://localhost:3000/api/sse/connect";

/** 发送消息 API 地址 */
const SEND_MESSAGE_API = "http://localhost:3000/api/chat/send";

// ==================== 类型定义 ====================

/** 消息接口 */
interface Message {
  /** 消息角色：用户或助手 */
  role: "user" | "assistant";
  /** 消息内容 */
  content: string;
  /** 时间戳 */
  timestamp: number;
}

/** 连接状态类型 */
type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

// ==================== 响应式数据 ====================

/** SSE 客户端实例 */
const sseClient = ref<SSEClientInstance | null>(null);

/** 客户端 ID */
const clientId = ref<string>("");

/** 连接状态 */
const connectionState = ref<ConnectionState>("disconnected");

/** 消息列表 */
const messages = ref<Message[]>([]);

/** 输入框内容 */
const inputMessage = ref<string>("");

/** 是否正在发送消息 */
const isSending = ref<boolean>(false);

/** AI 是否正在输入（流式响应中）*/
const isAITyping = ref<boolean>(false);

/** 当前 AI 回复的内容（流式接收中）*/
const currentAIMessage = ref<string>("");

/** 是否显示调试信息 */
const showDebugInfo = ref<boolean>(true);

/** 消息容器 DOM 引用 */
const messagesContainer = ref<HTMLElement | null>(null);

// ==================== 计算属性 ====================

/** 是否已连接 */
const isConnected = computed(() => connectionState.value === "connected");

/** 状态文本 */
const statusText = computed(() => {
  switch (connectionState.value) {
    case "connected":
      return "已连接";
    case "connecting":
      return "连接中...";
    case "disconnected":
      return "未连接";
    case "error":
      return "连接错误";
    default:
      return "未知状态";
  }
});

/** 状态样式类名 */
const statusClass = computed(() => {
  switch (connectionState.value) {
    case "connected":
      return "status-connected";
    case "connecting":
      return "status-connecting";
    case "error":
      return "status-error";
    default:
      return "status-disconnected";
  }
});

// ==================== 生命周期钩子 ====================

/**
 * 组件挂载时初始化 SSE 客户端
 */
onMounted(() => {
  console.log("[ChatComponent] 组件已挂载");
  // 初始化 SSE 客户端
  initSSEClient();
});

/**
 * 组件卸载前清理资源
 */
onBeforeUnmount(() => {
  console.log("[ChatComponent] 组件即将卸载");
  // 断开 SSE 连接
  if (sseClient.value) {
    sseClient.value.disconnect();
  }
});

// ==================== SSE 初始化与事件处理 ====================

/**
 * 初始化 SSE 客户端
 * 创建客户端实例并注册所有事件监听器
 */
function initSSEClient() {
  console.log("[ChatComponent] 初始化 SSE 客户端");

  // 创建 SSE 客户端实例（函数式）
  sseClient.value = createSSEClient({
    url: SSE_SERVER_URL, // SSE 连接地址
    autoReconnect: true, // 启用自动重连
    reconnectInterval: 3000, // 重连间隔 3 秒
    maxReconnectAttempts: 5, // 最多重连 5 次
  });

  // ---------- 注册自定义事件监听器 ----------

  // 监听连接成功事件
  sseClient.value.on("connected", (data) => {
    console.log("[ChatComponent] 连接成功:", data);

    // 保存客户端 ID
    clientId.value = data.clientId;
    sseClient.value?.setClientId(data.clientId);

    // 更新连接状态
    connectionState.value = "connected";

    // 添加系统消息
    addSystemMessage(`✅ ${data.message}`);
  });

  // 监听心跳事件
  sseClient.value.on("heartbeat", (data) => {
    console.log("[ChatComponent] 收到心跳:", data);
    // 心跳事件不显示在界面上
  });

  // 监听消息开始事件
  sseClient.value.on("message_start", (data) => {
    console.log("[ChatComponent] AI 开始回复:", data);

    // 显示 AI 正在输入
    isAITyping.value = true;

    // 清空当前 AI 消息缓存
    currentAIMessage.value = "";
  });

  // 监听消息块事件（流式接收）
  sseClient.value.on("message_chunk", (data) => {
    // console.log('[ChatComponent] 收到消息块:', data);

    // 将新字符追加到当前 AI 消息
    currentAIMessage.value += data.content;

    // 如果消息列表中还没有这条 AI 消息，添加一个占位
    if (isAITyping.value && !hasActiveAIMessage()) {
      messages.value.push({
        role: "assistant",
        content: currentAIMessage.value,
        timestamp: Date.now(),
      });
    } else {
      // 否则更新最后一条 AI 消息的内容
      updateLastAIMessage(currentAIMessage.value);
    }
    console.log(messages.value, "?????????????????????????????");

    // 滚动到底部
    scrollToBottom();
  });

  // 监听消息结束事件
  sseClient.value.on("message_end", (data) => {
    console.log("[ChatComponent] AI 回复完成:", data);

    // 隐藏 AI 正在输入
    isAITyping.value = false;

    // 更新最后一条消息为完整内容
    updateLastAIMessage(data.fullMessage);

    // 清空当前 AI 消息缓存
    currentAIMessage.value = "";

    // 滚动到底部
    scrollToBottom();
  });

  // 监听错误事件
  sseClient.value.on("error", (error) => {
    console.error("[ChatComponent] SSE 错误:", error);

    // 更新连接状态
    connectionState.value = "error";

    // 显示错误提示
    addSystemMessage("❌ 连接错误，正在尝试重连...");
  });

  // 监听服务器关闭事件
  sseClient.value.on("server_shutdown", (data) => {
    console.warn("[ChatComponent] 服务器关闭:", data);

    // 添加系统消息
    addSystemMessage(`⚠️ ${data.message}`);

    // 断开连接
    handleDisconnect();
  });
}

// ==================== 用户操作处理 ====================

/**
 * 处理连接按钮点击
 * 连接到 SSE 服务器
 */
function handleConnect() {
  console.log("[ChatComponent] 尝试连接...");

  if (!sseClient.value) {
    console.error("[ChatComponent] SSE 客户端未初始化");
    return;
  }

  // 更新连接状态
  connectionState.value = "connecting";

  // 调用 SSE 客户端的连接方法
  sseClient.value.connect();
}

/**
 * 处理断开连接按钮点击
 * 断开 SSE 连接
 */
function handleDisconnect() {
  console.log("[ChatComponent] 断开连接");

  if (!sseClient.value) {
    return;
  }

  // 调用 SSE 客户端的断开方法
  sseClient.value.disconnect();

  // 清空客户端 ID
  clientId.value = "";

  // 更新连接状态
  connectionState.value = "disconnected";

  // 添加系统消息
  addSystemMessage("🔌 已断开连接");
}

/**
 * 处理发送消息按钮点击
 * 发送用户消息到服务器
 */
async function handleSendMessage() {
  // 去除首尾空格
  const message = inputMessage.value.trim();

  // 如果消息为空，不发送
  if (!message) {
    return;
  }

  // 如果未连接，不发送
  if (!isConnected.value) {
    console.warn("[ChatComponent] 未连接，无法发送消息");
    return;
  }

  // 如果正在发送，不重复发送
  if (isSending.value) {
    console.warn("[ChatComponent] 正在发送消息，请稍候");
    return;
  }

  console.log("[ChatComponent] 发送消息:", message);

  // 添加用户消息到消息列表
  addMessage("user", message);

  // 清空输入框
  inputMessage.value = "";

  // 设置发送状态
  isSending.value = true;

  try {
    // 调用发送消息 API
    const response = await fetch(SEND_MESSAGE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        clientId: clientId.value,
      }),
    });

    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 解析响应
    const result = await response.json();
    console.log("[ChatComponent] 消息发送成功:", result);
  } catch (error) {
    console.error("[ChatComponent] 发送消息失败:", error);

    // 显示错误消息
    const errorMessage = error instanceof Error ? error.message : "发送失败";
    addSystemMessage(`❌ 发送失败: ${errorMessage}`);
  } finally {
    // 重置发送状态
    isSending.value = false;
  }
}

/**
 * 处理清空聊天按钮点击
 * 清空所有消息
 */
function handleClearChat() {
  console.log("[ChatComponent] 清空聊天记录");

  // 清空消息列表
  messages.value = [];

  // 重置相关状态
  isAITyping.value = false;
  currentAIMessage.value = "";
}

// ==================== 辅助函数 ====================

/**
 * 添加消息到消息列表
 * @param role - 消息角色（user 或 assistant）
 * @param content - 消息内容
 */
function addMessage(role: "user" | "assistant", content: string) {
  messages.value.push({
    role,
    content,
    timestamp: Date.now(),
  });

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
}

/**
 * 添加系统消息
 * @param content - 消息内容
 */
function addSystemMessage(content: string) {
  messages.value.push({
    role: "assistant",
    content,
    timestamp: Date.now(),
  });

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
}

/**
 * 检查是否有活跃的 AI 消息（正在接收中）
 * @returns 是否有活跃的 AI 消息
 */
function hasActiveAIMessage(): boolean {
  if (messages.value.length === 0) {
    return false;
  }
  const lastMessage = messages.value[messages.value.length - 1];
  return lastMessage.role === "assistant";
}

/**
 * 更新最后一条 AI 消息的内容
 * @param content - 新内容
 */
function updateLastAIMessage(content: string) {
  if (messages.value.length === 0) {
    return;
  }

  const lastMessage = messages.value[messages.value.length - 1];
  if (lastMessage.role === "assistant") {
    lastMessage.content = content;
  }
}

/**
 * 滚动消息列表到底部
 */
function scrollToBottom() {
  if (messagesContainer.value) {
    // 使用 smooth 滚动
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: "smooth",
    });
  }
}

/**
 * 格式化时间戳
 * @param timestamp - 时间戳（毫秒）
 * @returns 格式化后的时间字符串
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
</script>

<style scoped>
/* ==================== 聊天容器 ==================== */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, sans-serif;
}

/* ==================== 头部区域 ==================== */
.chat-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chat-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* ---------- 状态指示器 ---------- */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* 已连接状态 */
.status-connected {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-connected .status-dot {
  background: #4caf50;
}

/* 连接中状态 */
.status-connecting {
  background: #fff3e0;
  color: #e65100;
}

.status-connecting .status-dot {
  background: #ff9800;
}

/* 错误状态 */
.status-error {
  background: #ffebee;
  color: #c62828;
}

.status-error .status-dot {
  background: #f44336;
}

/* 未连接状态 */
.status-disconnected {
  background: #f5f5f5;
  color: #757575;
}

.status-disconnected .status-dot {
  background: #9e9e9e;
}

/* 脉动动画 */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ---------- 头部操作按钮 ---------- */
.header-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* ==================== 按钮样式 ==================== */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c62828;
}

.btn-secondary {
  background: #757575;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #616161;
}

.btn-send {
  background: #1976d2;
  color: white;
  padding: 12px 24px;
}

.btn-send:hover:not(:disabled) {
  background: #1565c0;
}

/* ==================== 消息列表区域 ==================== */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #fafafa;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #757575;
  text-align: center;
}

.empty-state p {
  margin: 8px 0;
  font-size: 16px;
}

.empty-state .hint {
  font-size: 14px;
  color: #9e9e9e;
}

/* ---------- 消息项 ---------- */
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  animation: fadeIn 0.3s;
}

/* 用户消息靠右 */
.message-item.user {
  flex-direction: row-reverse;
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---------- 消息头像 ---------- */
.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* ---------- 消息内容 ---------- */
.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;
}

/* 用户消息样式 */
.message-item.user .message-text {
  background: #1976d2;
  color: white;
  border-bottom-right-radius: 4px;
}

/* AI 消息样式 */
.message-item.assistant .message-text {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* ---------- 消息元数据 ---------- */
.message-meta {
  font-size: 11px;
  color: #9e9e9e;
  padding: 0 4px;
}

.message-item.user .message-meta {
  text-align: right;
}

/* ---------- 打字指示器 ---------- */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #bdbdbd;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

/* 打字动画 */
@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

/* ==================== 输入区域 ==================== */
.chat-input-area {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: #1976d2;
}

.chat-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

/* ==================== 调试信息区域 ==================== */
.debug-info {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e0e0e0;
  font-size: 13px;
}

.debug-info summary {
  cursor: pointer;
  font-weight: 500;
  color: #757575;
  user-select: none;
}

.debug-content {
  margin-top: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-family: "Courier New", monospace;
}

.debug-content p {
  margin: 4px 0;
  color: #424242;
}

.debug-content strong {
  color: #1976d2;
}

/* ==================== 滚动条样式 ==================== */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #bdbdbd;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9e9e9e;
}
</style>
