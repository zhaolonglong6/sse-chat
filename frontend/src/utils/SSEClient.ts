/**
 * SSE 客户端 - 简化版（函数式实现）
 * 提供 SSE 连接管理、事件监听、自动重连等功能
 */

// ==================== 类型定义 ====================

/**
 * SSE 配置选项
 */
export interface SSEOptions {
  /** SSE 服务器连接 URL */
  url: string;
  /** 是否自动重连，默认 true */
  autoReconnect?: boolean;
  /** 重连间隔（毫秒），默认 3000ms */
  reconnectInterval?: number;
  /** 最大重连次数，默认 5 次 */
  maxReconnectAttempts?: number;
}

/**
 * SSE 事件处理函数类型
 */
export type SSEEventHandler = (data: any) => void;

/**
 * SSE 客户端实例类型
 */
export interface SSEClientInstance {
  /** 连接到服务器 */
  connect: () => void;
  /** 断开连接 */
  disconnect: () => void;
  /** 监听事件 */
  on: (eventType: string, handler: SSEEventHandler) => void;
  /** 移除事件监听 */
  off: (eventType: string, handler: SSEEventHandler) => void;
  /** 是否已连接 */
  isConnected: () => boolean;
  /** 获取客户端 ID */
  getClientId: () => string | null;
  /** 设置客户端 ID */
  setClientId: (id: string) => void;
}

// ==================== 创建 SSE 客户端 ====================

/**
 * 创建 SSE 客户端
 * @param options - 配置选项
 * @returns SSE 客户端实例
 */
export function createSSEClient(options: SSEOptions): SSEClientInstance {

  // ---------- 配置参数（使用默认值）----------

  const config = {
    url: options.url,
    autoReconnect: options.autoReconnect ?? true,
    reconnectInterval: options.reconnectInterval ?? 3000,
    maxReconnectAttempts: options.maxReconnectAttempts ?? 5
  };

  // ---------- 内部状态变量 ----------

  let eventSource: EventSource | null = null;        // EventSource 实例
  let clientId: string | null = null;                // 客户端 ID
  let isConnectedState = false;                      // 连接状态
  let reconnectAttempts = 0;                         // 当前重连次数
  let reconnectTimer: number | null = null;          // 重连定时器
  let manualClose = false;                           // 是否手动关闭

  // 事件监听器映射表：{ 事件类型: [处理函数1, 处理函数2, ...] }
  const eventListeners = new Map<string, Set<SSEEventHandler>>();

  // ---------- 内部辅助函数 ----------

  /**
   * 解析 SSE 数据（尝试 JSON 解析）
   */
  function parseData(data: string): any {
    try {
      return JSON.parse(data);
    } catch {
      return data; // 解析失败返回原始字符串
    }
  }

  /**
   * 触发事件监听器
   */
  function triggerEvent(eventType: string, data: any): void {
    const listeners = eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[SSE] 事件处理器错误 [${eventType}]:`, error);
        }
      });
    }
  }

  /**
   * 清理资源
   */
  function cleanup(): void {
    // 清除重连定时器
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // 关闭 EventSource
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    // 更新连接状态
    isConnectedState = false;
  }

  /**
   * 尝试重连
   */
  function attemptReconnect(): void {
    // 如果不允许自动重连或手动关闭，直接返回
    if (!config.autoReconnect || manualClose) {
      console.log('[SSE] 自动重连已禁用或手动关闭');
      return;
    }

    // 检查是否超过最大重连次数
    if (reconnectAttempts >= config.maxReconnectAttempts) {
      console.error('[SSE] 已达到最大重连次数');
      return;
    }

    // 增加重连次数
    reconnectAttempts++;

    console.log(`[SSE] 准备重连 (${reconnectAttempts}/${config.maxReconnectAttempts})，${config.reconnectInterval}ms 后重试`);

    // 设置重连定时器
    reconnectTimer = window.setTimeout(() => {
      console.log('[SSE] 开始重连...');
      connect();
    }, config.reconnectInterval);
  }

  // ==================== 公共 API ====================

  /**
   * 连接到 SSE 服务器
   */
  function connect(): void {
    // 如果已经连接，不重复连接
    if (isConnectedState) {
      console.warn('[SSE] 已经连接');
      return;
    }

    // 重置手动关闭标志
    manualClose = false;

    console.log('[SSE] 开始连接:', config.url);

    try {
      // 创建 EventSource 实例
      eventSource = new EventSource(config.url);

      // ========== 监听打开事件（连接成功）==========

      eventSource.onopen = () => {
        console.log('[SSE] 连接成功');
        isConnectedState = true;
        reconnectAttempts = 0; // 重置重连次数
      };

      // ========== 监听错误事件 ==========

      eventSource.onerror = (error) => {
        console.error('[SSE] 连接错误:', error);

        // 触发错误事件
        triggerEvent('error', error);

        // 关闭当前连接
        cleanup();

        // 如果不是手动关闭，尝试重连
        if (!manualClose) {
          attemptReconnect();
        }
      };

      // ========== 监听默认消息事件 ==========

      eventSource.onmessage = (event) => {
        console.log('[SSE] 收到消息:', event.data);
        triggerEvent('message', parseData(event.data));
      };

      // ========== 注册所有已添加的自定义事件监听器 ==========

      // 遍历所有已注册的事件类型，为它们添加监听
      eventListeners.forEach((handlers, eventType) => {
        if (eventSource && eventType !== 'message' && eventType !== 'error') {
          eventSource.addEventListener(eventType, (event: MessageEvent) => {
            console.log(`[SSE] 收到事件 [${eventType}]:`, event.data);
            triggerEvent(eventType, parseData(event.data));
          });
        }
      });

    } catch (error) {
      console.error('[SSE] 创建连接失败:', error);
      cleanup();
    }
  }

  /**
   * 断开连接
   */
  function disconnect(): void {
    console.log('[SSE] 断开连接');

    // 设置手动关闭标志
    manualClose = true;

    // 清理资源
    cleanup();

    // 清空客户端 ID
    clientId = null;
  }

  /**
   * 监听事件
   * @param eventType - 事件类型（如 'connected', 'message_chunk' 等）
   * @param handler - 事件处理函数
   */
  function on(eventType: string, handler: SSEEventHandler): void {
    // 如果该事件类型还没有监听器集合，创建一个
    if (!eventListeners.has(eventType)) {
      eventListeners.set(eventType, new Set());
    }

    // 添加处理函数到集合
    eventListeners.get(eventType)!.add(handler);

    // 如果 EventSource 已创建且不是内置事件，注册监听器
    if (eventSource && eventType !== 'message' && eventType !== 'error') {
      eventSource.addEventListener(eventType, (event: MessageEvent) => {
        console.log(`[SSE] 收到事件 [${eventType}]:`, event.data);
        triggerEvent(eventType, parseData(event.data));
      });
    }

    console.log(`[SSE] 添加事件监听: ${eventType}`);
  }

  /**
   * 移除事件监听
   * @param eventType - 事件类型
   * @param handler - 事件处理函数
   */
  function off(eventType: string, handler: SSEEventHandler): void {
    const listeners = eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(handler);
      console.log(`[SSE] 移除事件监听: ${eventType}`);

      // 如果该事件没有监听器了，删除整个集合
      if (listeners.size === 0) {
        eventListeners.delete(eventType);
      }
    }
  }

  /**
   * 检查是否已连接
   */
  function isConnected(): boolean {
    return isConnectedState;
  }

  /**
   * 获取客户端 ID
   */
  function getClientId(): string | null {
    return clientId;
  }

  /**
   * 设置客户端 ID
   */
  function setClientId(id: string): void {
    clientId = id;
    console.log(`[SSE] 设置客户端 ID: ${id}`);
  }

  // ==================== 返回客户端实例 ====================

  return {
    connect,
    disconnect,
    on,
    off,
    isConnected,
    getClientId,
    setClientId
  };
}

// ==================== 默认导出 ====================

export default createSSEClient;
