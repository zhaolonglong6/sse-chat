// 引入 Express 框架，用于创建 Web 服务器
const express = require('express');
// 引入 CORS 中间件，用于处理跨域请求
const cors = require('cors');
// 引入 body-parser 中间件，用于解析请求体
const bodyParser = require('body-parser');

// 创建 Express 应用实例
const app = express();
// 设置服务器监听的端口号
const PORT = 3000;

// ==================== 中间件配置 ====================

// 启用 CORS，允许前端跨域访问
app.use(cors());
// 解析 JSON 格式的请求体
app.use(bodyParser.json());
// 解析 URL 编码的请求体
app.use(bodyParser.urlencoded({ extended: true }));

// ==================== 存储活跃连接 ====================

// 用于存储所有活跃的 SSE 连接
// 键是客户端 ID，值是 response 对象
const clients = new Map();

// ==================== SSE 连接端点 ====================

/**
 * SSE 连接端点
 * 客户端通过 GET 请求此端点来建立 SSE 连接
 */
app.get('/api/sse/connect', (req, res) => {
  // 生成唯一的客户端 ID
  const clientId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  console.log(`[SSE] 客户端连接: ${clientId}`);

  // ========== 设置 SSE 必需的响应头 ==========

  // 设置内容类型为 text/event-stream，这是 SSE 的标准内容类型
  res.setHeader('Content-Type', 'text/event-stream');
  // 设置编码为 UTF-8
  res.setHeader('Cache-Control', 'no-cache');
  // 禁用缓存，确保数据实时传输
  res.setHeader('Connection', 'keep-alive');
  // 保持连接活跃
  res.setHeader('X-Accel-Buffering', 'no');
  // 禁用 Nginx 缓冲（如果使用 Nginx 作为反向代理）

  // ========== 发送连接成功消息 ==========

  // 向客户端发送初始连接成功消息
  // SSE 数据格式：event: 事件类型\ndata: 数据内容\n\n
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({
    clientId,
    message: '连接成功',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // ========== 保存客户端连接 ==========

  // 将当前客户端连接保存到 Map 中
  clients.set(clientId, {
    id: clientId,
    res: res, // response 对象，用于后续发送消息
    connectedAt: new Date()
  });

  // ========== 定期发送心跳包 ==========

  // 每 30 秒发送一次心跳，保持连接活跃
  const heartbeatInterval = setInterval(() => {
    // 检查客户端是否还在连接中
    if (clients.has(clientId)) {
      try {
        // 发送心跳事件
        res.write(`event: heartbeat\n`);
        res.write(`data: ${JSON.stringify({
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (error) {
        // 如果发送失败，清理连接
        console.error(`[SSE] 心跳发送失败: ${clientId}`, error);
        clearInterval(heartbeatInterval);
        clients.delete(clientId);
      }
    } else {
      // 如果客户端已断开，清除心跳定时器
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // ========== 处理客户端断开连接 ==========

  // 监听客户端关闭连接事件
  req.on('close', () => {
    console.log(`[SSE] 客户端断开: ${clientId}`);
    // 清除心跳定时器
    clearInterval(heartbeatInterval);
    // 从连接列表中移除该客户端
    clients.delete(clientId);
    // 结束响应
    res.end();
  });

  // 监听连接错误事件
  req.on('error', (error) => {
    console.error(`[SSE] 连接错误: ${clientId}`, error);
    // 清除心跳定时器
    clearInterval(heartbeatInterval);
    // 从连接列表中移除该客户端
    clients.delete(clientId);
  });
});

// ==================== 发送消息端点 ====================

/**
 * 发送消息端点
 * 接收客户端发送的消息，并通过 SSE 返回响应
 */
app.post('/api/chat/send', async (req, res) => {
  // 从请求体中获取消息内容和客户端 ID
  const { message, clientId } = req.body;

  console.log(`[消息] 收到来自 ${clientId} 的消息: ${message}`);

  // ========== 参数验证 ==========

  // 检查消息是否为空
  if (!message || message.trim() === '') {
    return res.status(400).json({
      error: '消息内容不能为空'
    });
  }

  // 检查客户端 ID 是否存在
  if (!clientId) {
    return res.status(400).json({
      error: '缺少客户端 ID'
    });
  }

  // 检查客户端是否已连接
  const client = clients.get(clientId);
  if (!client) {
    return res.status(404).json({
      error: '客户端连接不存在，请重新连接'
    });
  }

  // ========== 立即响应 HTTP 请求 ==========

  // 快速响应 POST 请求，告知消息已接收
  res.json({
    success: true,
    message: '消息已接收'
  });

  // ========== 模拟 AI 回复（流式响应）==========

  try {
    // 模拟 AI 思考延迟
    await sleep(500);

    // 发送"开始回复"事件
    client.res.write(`event: message_start\n`);
    client.res.write(`data: ${JSON.stringify({
      type: 'start',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 模拟的 AI 回复内容
    const aiResponse = `你好！我收到了你的消息："${message}"。这是一个 SSE 流式响应示例。`;

    // ========== 流式发送回复内容 ==========

    // 将回复内容按字符逐个发送，模拟打字效果
    for (let i = 0; i < aiResponse.length; i++) {
      // 每次发送一个字符
      const char = aiResponse[i];

      // 发送消息块事件
      client.res.write(`event: message_chunk\n`);
      client.res.write(`data: ${JSON.stringify({
        type: 'chunk',
        content: char,
        index: i,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // 模拟打字延迟（50-150毫秒）
      await sleep(50 + Math.random() * 100);
    }

    // ========== 发送完成事件 ==========

    // 延迟一小段时间
    await sleep(200);

    // 发送"回复完成"事件
    client.res.write(`event: message_end\n`);
    client.res.write(`data: ${JSON.stringify({
      type: 'end',
      fullMessage: aiResponse,
      timestamp: new Date().toISOString()
    })}\n\n`);

    console.log(`[消息] 向 ${clientId} 发送回复完成`);

  } catch (error) {
    // ========== 错误处理 ==========

    console.error(`[错误] 发送消息失败: ${clientId}`, error);

    // 尝试发送错误事件给客户端
    try {
      client.res.write(`event: error\n`);
      client.res.write(`data: ${JSON.stringify({
        type: 'error',
        message: '消息发送失败',
        error: error.message,
        timestamp: new Date().toISOString()
      })}\n\n`);
    } catch (sendError) {
      // 如果连接已断开，从客户端列表中移除
      console.error(`[错误] 无法发送错误消息: ${clientId}`, sendError);
      clients.delete(clientId);
    }
  }
});

// ==================== 获取在线客户端数量 ====================

/**
 * 获取当前在线的客户端数量
 * 用于监控和调试
 */
app.get('/api/clients/count', (req, res) => {
  // 返回当前活跃连接数
  res.json({
    count: clients.size,
    clients: Array.from(clients.keys())
  });
});

// ==================== 健康检查端点 ====================

/**
 * 健康检查端点
 * 用于检查服务器是否正常运行
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeConnections: clients.size
  });
});

// ==================== 工具函数 ====================

/**
 * 延迟函数
 * @param {number} ms - 延迟的毫秒数
 * @returns {Promise} Promise 对象
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 启动服务器 ====================

// 启动 Express 服务器，监听指定端口
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 SSE 服务器启动成功！`);
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`🔗 SSE 连接地址: http://localhost:${PORT}/api/sse/connect`);
  console.log(`💬 发送消息地址: http://localhost:${PORT}/api/chat/send`);
  console.log(`📊 在线数量查询: http://localhost:${PORT}/api/clients/count`);
  console.log(`❤️  健康检查: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
});

// ==================== 优雅关闭 ====================

// 监听进程终止信号，优雅关闭服务器
process.on('SIGINT', () => {
  console.log('\n[服务器] 正在关闭...');

  // 关闭所有 SSE 连接
  clients.forEach((client, clientId) => {
    console.log(`[服务器] 断开客户端: ${clientId}`);
    try {
      // 发送服务器关闭通知
      client.res.write(`event: server_shutdown\n`);
      client.res.write(`data: ${JSON.stringify({
        message: '服务器正在关闭'
      })}\n\n`);
      // 结束连接
      client.res.end();
    } catch (error) {
      console.error(`[服务器] 断开客户端失败: ${clientId}`, error);
    }
  });

  // 清空客户端列表
  clients.clear();

  // 退出进程
  console.log('[服务器] 已关闭');
  process.exit(0);
});
