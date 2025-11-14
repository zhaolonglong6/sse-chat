# SSE 实时对话项目

基于 **Server-Sent Events (SSE)** 技术的实时对话应用，实现了前后端完整的流式通信功能。

## 📁 项目结构

```
D:\
├── backend/                    # 后端服务器
│   ├── server.js              # Node.js + Express SSE 服务器（详细注释）
│   └── package.json           # 后端依赖配置
│
└── frontend/                   # 前端应用
    ├── src/
    │   ├── components/
    │   │   └── ChatComponent.vue    # Vue3 聊天组件（详细注释）
    │   ├── utils/
    │   │   └── SSEClient.ts         # SSE 客户端封装类（详细注释）
    │   ├── App.vue                  # 根组件
    │   ├── main.ts                  # 应用入口
    │   ├── style.css                # 全局样式
    │   └── vite-env.d.ts            # TypeScript 类型定义
    ├── index.html                   # HTML 入口文件
    ├── vite.config.ts               # Vite 配置
    ├── tsconfig.json                # TypeScript 配置
    ├── tsconfig.node.json           # Node 环境 TS 配置
    └── package.json                 # 前端依赖配置
```

## ✨ 功能特性

### 后端功能（backend/server.js）

- ✅ **SSE 连接管理**：支持多客户端并发连接
- ✅ **心跳机制**：每 30 秒自动发送心跳，保持连接活跃
- ✅ **流式响应**：模拟 AI 打字效果，逐字符推送消息
- ✅ **连接状态跟踪**：实时追踪所有活跃连接
- ✅ **错误处理**：完善的错误捕获和处理机制
- ✅ **优雅关闭**：服务器关闭时通知所有客户端
- ✅ **详细日志**：每个操作都有日志输出
- ✅ **每行注释**：所有代码都有详细的中文注释

### 前端功能（SSEClient.ts + ChatComponent.vue）

#### SSE 客户端封装类（SSEClient.ts）

- ✅ **完整的 SSE 封装**：基于原生 EventSource 的高级封装
- ✅ **连接管理**：
  - 初始化连接（`connect()`）
  - 断开连接（`disconnect()`）
  - 连接状态跟踪（6 种状态）
- ✅ **自动重连**：
  - 可配置的重连策略
  - 重连间隔和最大次数设置
  - 指数退避算法（可扩展）
- ✅ **事件监听**：
  - 自定义事件监听（`on()`、`off()`）
  - 错误监听（`onError()`、`offError()`）
  - 状态变化监听（`onStateChange()`）
- ✅ **连接超时**：可配置的连接超时检测
- ✅ **TypeScript 支持**：完整的类型定义和类型检查
- ✅ **每行注释**：所有代码都有详细的中文注释

#### Vue3 聊天组件（ChatComponent.vue）

- ✅ **现代化 UI**：
  - 清爽的聊天界面设计
  - 用户/AI 消息区分显示
  - 打字指示器动画
  - 连接状态实时显示
- ✅ **完整的聊天功能**：
  - 消息发送与接收
  - 流式消息显示（逐字符显示）
  - 消息时间戳
  - 自动滚动到底部
- ✅ **SSE 集成**：
  - 连接/断开控制
  - 实时状态显示
  - 错误提示
  - 调试信息面板
- ✅ **响应式设计**：适配不同屏幕尺寸
- ✅ **每行注释**：所有代码都有详细的中文注释

## 🚀 快速开始

### 环境要求

- **Node.js**：>= 16.0.0
- **npm**：>= 8.0.0

### 1️⃣ 安装后端依赖

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install
```

### 2️⃣ 启动后端服务器

```bash
# 在 backend 目录下运行
npm start

# 或使用 nodemon（开发模式，自动重启）
npm run dev
```

服务器启动后，你会看到：

```
==================================================
🚀 SSE 服务器启动成功！
📡 监听端口: 3000
🔗 SSE 连接地址: http://localhost:3000/api/sse/connect
💬 发送消息地址: http://localhost:3000/api/chat/send
📊 在线数量查询: http://localhost:3000/api/clients/count
❤️  健康检查: http://localhost:3000/api/health
==================================================
```

### 3️⃣ 安装前端依赖

```bash
# 打开新的终端窗口
# 进入前端目录
cd frontend

# 安装依赖
npm install
```

### 4️⃣ 启动前端应用

```bash
# 在 frontend 目录下运行
npm run dev
```

前端启动后，会自动打开浏览器访问 `http://localhost:5173`

## 📖 使用说明

### 基本操作

1. **启动应用**：按照上述步骤启动后端和前端
2. **建立连接**：点击页面顶部的"连接"按钮
3. **发送消息**：在输入框中输入消息，按 Enter 键发送
4. **查看回复**：AI 会以流式方式（逐字符）返回回复
5. **断开连接**：点击"断开连接"按钮
6. **清空聊天**：点击"清空聊天"按钮清除所有消息

### 键盘快捷键

- **Enter**：发送消息
- **Shift + Enter**：换行（在输入框中）

## 🔧 配置说明

### 后端配置（backend/server.js）

```javascript
// 服务器端口
const PORT = 3000;

// 心跳间隔（毫秒）
const heartbeatInterval = 30000; // 30 秒

// 流式响应延迟（毫秒）
const typingDelay = 50 + Math.random() * 100; // 50-150ms
```

### 前端 SSE 客户端配置（frontend/src/components/ChatComponent.vue）

```typescript
// SSE 服务器地址
const SSE_SERVER_URL = 'http://localhost:3000/api/sse/connect';

// SSE 客户端配置
const sseClient = new SSEClient({
  url: SSE_SERVER_URL,        // 连接地址
  timeout: 10000,              // 连接超时：10 秒
  autoReconnect: true,         // 自动重连
  reconnectInterval: 3000,     // 重连间隔：3 秒
  maxReconnectAttempts: 5,     // 最大重连次数：5 次
  withCredentials: false       // 是否携带凭证
});
```

## 📡 API 文档

### 后端 API

#### 1. SSE 连接

```
GET /api/sse/connect
```

**功能**：建立 SSE 连接

**响应事件**：
- `connected`：连接成功
- `heartbeat`：心跳包
- `message_start`：消息开始
- `message_chunk`：消息块（流式）
- `message_end`：消息结束
- `error`：错误事件
- `server_shutdown`：服务器关闭

#### 2. 发送消息

```
POST /api/chat/send
Content-Type: application/json
```

**请求体**：
```json
{
  "message": "你好",
  "clientId": "客户端ID"
}
```

**响应**：
```json
{
  "success": true,
  "message": "消息已接收"
}
```

#### 3. 获取在线人数

```
GET /api/clients/count
```

**响应**：
```json
{
  "count": 3,
  "clients": ["client-id-1", "client-id-2", "client-id-3"]
}
```

#### 4. 健康检查

```
GET /api/health
```

**响应**：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "activeConnections": 3
}
```

## 🎨 SSE 客户端 API

### 创建实例

```typescript
import SSEClient, { SSEState } from './utils/SSEClient';

const client = new SSEClient({
  url: 'http://localhost:3000/api/sse/connect',
  timeout: 10000,
  autoReconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5
});
```

### 连接管理

```typescript
// 连接到服务器
await client.connect();

// 断开连接
client.disconnect();

// 检查连接状态
const isConnected = client.isConnected();

// 获取当前状态
const state = client.getState(); // SSEState 枚举
```

### 事件监听

```typescript
// 监听自定义事件
client.on('message_chunk', (data) => {
  console.log('收到消息块:', data);
});

// 监听错误
client.onError((error) => {
  console.error('SSE 错误:', error);
});

// 监听状态变化
client.onStateChange((state) => {
  console.log('状态变化:', state);
});

// 移除事件监听
client.off('message_chunk', handler);
client.offError(errorHandler);
client.offStateChange(stateHandler);
```

### 销毁实例

```typescript
// 销毁客户端，清理所有资源
client.destroy();
```

## 🔍 调试技巧

### 1. 查看服务器日志

后端会输出详细的日志信息：

```
[SSE] 客户端连接: 1234567890-abc123
[消息] 收到来自 1234567890-abc123 的消息: 你好
[消息] 向 1234567890-abc123 发送回复完成
[SSE] 客户端断开: 1234567890-abc123
```

### 2. 前端调试信息

组件底部有调试信息面板，显示：
- 客户端 ID
- 连接状态
- 重连次数
- 消息总数

### 3. 浏览器控制台

前端会输出详细的日志：

```
[SSEClient] 初始化完成
[SSEClient] 开始连接: http://localhost:3000/api/sse/connect
[SSEClient] 连接成功
[ChatComponent] 收到事件 [connected]: {...}
```

## ⚠️ 常见问题

### 1. 端口冲突

如果 3000 或 5173 端口被占用，可以修改：

- **后端**：修改 `backend/server.js` 中的 `PORT` 变量
- **前端**：修改 `frontend/vite.config.ts` 中的 `server.port`

### 2. CORS 错误

如果遇到跨域问题，检查后端的 CORS 配置：

```javascript
// backend/server.js
app.use(cors());
```

### 3. 连接超时

如果网络较慢，可以增加超时时间：

```typescript
// frontend/src/components/ChatComponent.vue
const sseClient = new SSEClient({
  // ...
  timeout: 20000, // 增加到 20 秒
});
```

### 4. 自动重连失败

如果重连一直失败，检查：
1. 后端服务器是否正常运行
2. 网络连接是否正常
3. 防火墙是否阻止连接

## 🛠️ 技术栈

### 后端
- **Node.js**：JavaScript 运行环境
- **Express**：Web 框架
- **CORS**：跨域资源共享中间件
- **body-parser**：请求体解析中间件

### 前端
- **Vue 3**：渐进式 JavaScript 框架
- **TypeScript**：JavaScript 的超集，提供类型安全
- **Vite**：下一代前端构建工具
- **EventSource**：原生 SSE API

## 📝 代码注释说明

所有代码文件都包含**详细的中文注释**，每一行关键代码都有说明：

- ✅ **函数说明**：每个函数都有功能、参数、返回值的完整注释
- ✅ **代码逻辑**：复杂逻辑都有分步骤的注释说明
- ✅ **参数说明**：所有参数都有类型和用途说明
- ✅ **最佳实践**：代码中包含最佳实践的说明

## 📚 学习建议

### 初学者学习路线

1. **理解 SSE 原理**：
   - 阅读 `backend/server.js` 中的注释
   - 了解 SSE 响应头和数据格式

2. **学习客户端封装**：
   - 阅读 `frontend/src/utils/SSEClient.ts`
   - 理解连接管理、事件监听、错误处理

3. **Vue 3 组件**：
   - 阅读 `frontend/src/components/ChatComponent.vue`
   - 学习 Vue 3 Composition API 用法

4. **实践修改**：
   - 尝试修改样式
   - 添加新功能（如表情、图片）
   - 优化用户体验

## 🔗 相关资源

- [MDN - Server-Sent Events](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events)
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/zh/)
- [Express 官方文档](https://expressjs.com/)
- [Vite 官方文档](https://cn.vitejs.dev/)

## 📄 许可证

MIT License

## 👨‍💻 作者

Claude Code 自动生成的完整 SSE 对话项目

---

**祝你学习愉快！** 🎉

如果遇到问题，请仔细阅读代码注释，大部分问题都能在注释中找到答案。
