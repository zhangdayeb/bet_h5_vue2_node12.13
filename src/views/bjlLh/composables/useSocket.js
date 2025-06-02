// src/views/bjlLh/composables/useSocket.js
// WebSocket 连接管理 - 基于 optimizedSocket.js

import { ref, computed } from 'vue'
import { OptimizedSocketManager, SOCKET_URLS, CONNECTION_STATUS } from '@/utils/optimizedSocket'

/**
 * WebSocket 连接管理
 */
export function useSocket() {
  // Socket 管理器实例
  const socketManager = ref(null)
  
  // 连接状态
  const connectionStatus = ref(CONNECTION_STATUS.DISCONNECTED)
  
  // 事件监听器
  const eventListeners = ref({
    message: [],
    statusChange: [],
    open: [],
    close: [],
    error: []
  })

  // 计算属性
  const connectionStatusText = computed(() => {
    switch (connectionStatus.value) {
      case CONNECTION_STATUS.CONNECTED:
        return '已连接'
      case CONNECTION_STATUS.CONNECTING:
        return '连接中...'
      case CONNECTION_STATUS.RECONNECTING:
        return '重连中...'
      case CONNECTION_STATUS.DISCONNECTED:
        return '已断开'
      case CONNECTION_STATUS.FAILED:
        return '连接失败'
      default:
        return '未知状态'
    }
  })

  const isConnected = computed(() => {
    return connectionStatus.value === CONNECTION_STATUS.CONNECTED
  })

  /**
   * 初始化 WebSocket 连接
   * @param {number} gameType - 游戏类型（2=龙虎，3=百家乐）
   * @param {string} tableId - 桌台ID
   * @param {string} userId - 用户ID
   */
  const initSocket = async (gameType, tableId, userId) => {
    try {
      // 根据游戏类型选择 WebSocket URL
      const socketUrl = gameType == 3 ? SOCKET_URLS.BJL : SOCKET_URLS.LH
      console.log('🔌 初始化Socket连接:', { gameType, tableId, userId, socketUrl })
      
      // 创建 Socket 管理器实例
      socketManager.value = new OptimizedSocketManager(socketUrl, {
        maxReconnectAttempts: 15,
        reconnectInterval: 2000,
        maxReconnectInterval: 30000,
        heartbeatInterval: 25000,
        enableAutoReconnect: true,
        enableHeartbeat: true,
        enableMessageQueue: true,
        maxQueueSize: 50
      })

      // 绑定事件监听器
      setupEventListeners()

      // 准备初始化数据
      const initData = {
        table_id: tableId,
        game_type: gameType,
        user_id: userId + '_'
      }

      // 建立连接
      await socketManager.value.connect(initData)
      console.log('✅ Socket 连接成功')
      
      return true
    } catch (error) {
      console.error('❌ Socket 连接失败:', error)
      throw error
    }
  }

  /**
   * 设置事件监听器
   */
  const setupEventListeners = () => {
    if (!socketManager.value) return

    // 连接状态变化
    socketManager.value.on('statusChange', ({ oldStatus, newStatus }) => {
      console.log(`🔄 WebSocket状态变化: ${oldStatus} -> ${newStatus}`)
      connectionStatus.value = newStatus
      
      // 触发自定义事件
      emit('statusChange', { oldStatus, newStatus })
      
      // 根据状态执行相应操作
      handleStatusChange(newStatus)
    })

    // 消息接收
    socketManager.value.on('message', (messageData) => {
      handleMessage(messageData)
    })

    // 连接打开
    socketManager.value.on('open', (event) => {
      console.log('🟢 WebSocket 连接已打开')
      emit('open', event)
    })

    // 连接关闭
    socketManager.value.on('close', (event) => {
      console.log('🔴 WebSocket 连接已关闭')
      emit('close', event)
    })

    // 连接错误
    socketManager.value.on('error', (error) => {
      console.error('💥 WebSocket 连接错误:', error)
      emit('error', error)
    })
  }

  /**
   * 处理连接状态变化
   * @param {string} status - 新的连接状态
   */
  const handleStatusChange = (status) => {
    switch (status) {
      case CONNECTION_STATUS.CONNECTED:
        console.log('✅ [成功] 连接已建立')
        break
      case CONNECTION_STATUS.RECONNECTING:
        console.log('⚠️ [警告] 正在重新连接...')
        break
      case CONNECTION_STATUS.DISCONNECTED:
        console.log('⚠️ [警告] 连接已断开')
        break
      case CONNECTION_STATUS.FAILED:
        console.log('❌ [错误] 连接失败，请刷新页面重试')
        break
    }
  }

  /**
   * 处理接收到的消息
   * @param {Object} messageData - 消息数据
   */
  const handleMessage = (messageData) => {
    try {
      const { data, originalEvent } = messageData
      
      // 空数据处理
      if (!data || (data.raw && !data.raw.trim())) {
        return
      }

      // 解析消息数据
      let result = data
      if (data.raw) {
        try {
          result = JSON.parse(data.raw.trim())
        } catch (e) {
          console.warn('⚠️ 解析原始数据失败:', data.raw)
          result = { raw: data.raw }
        }
      }

      // 触发消息事件
      emit('message', { result, originalEvent })
      
    } catch (error) {
      console.error('❌ 处理消息错误:', error, messageData)
    }
  }

  /**
   * 发送消息
   * @param {Object} data - 要发送的数据
   * @param {Object} options - 发送选项
   */
  const sendMessage = (data, options = {}) => {
    if (!socketManager.value) {
      console.error('❌ Socket管理器未初始化')
      return false
    }

    if (!isConnected.value) {
      console.warn('⚠️ 连接未就绪，消息将被队列处理:', data)
    }

    return socketManager.value.send(data, {
      expectResponse: options.expectResponse || false,
      timeout: options.timeout || 5000,
      ...options
    })
  }

  /**
   * 手动重连
   */
  const manualReconnect = async () => {
    if (!socketManager.value) {
      console.error('❌ Socket管理器未初始化，无法重连')
      return false
    }
    
    try {
      console.log('🔄 开始手动重连...')
      await socketManager.value.reconnect()
      console.log('✅ 手动重连成功')
      return true
    } catch (error) {
      console.error('❌ 手动重连失败:', error)
      return false
    }
  }

  /**
   * 关闭连接
   * @param {number} code - 关闭代码
   * @param {string} reason - 关闭原因
   */
  const closeConnection = (code = 1000, reason = '手动关闭') => {
    if (socketManager.value) {
      console.log('🔴 关闭WebSocket连接:', reason)
      socketManager.value.close(code, reason)
    }
  }

  /**
   * 获取连接统计信息
   */
  const getConnectionStats = () => {
    if (socketManager.value) {
      return socketManager.value.getStats()
    }
    return null
  }

  /**
   * 检查连接健康状态
   */
  const checkConnectionHealth = () => {
    if (socketManager.value) {
      return socketManager.value.checkHealth()
    }
    return {
      status: CONNECTION_STATUS.DISCONNECTED,
      isHealthy: false,
      issues: ['Socket管理器未初始化']
    }
  }

  /**
   * 显示连接统计信息（调试用）
   */
  const showConnectionStats = () => {
    const stats = getConnectionStats()
    const health = checkConnectionHealth()
    
    console.group('=== WebSocket连接统计 ===')
    console.log('连接状态:', connectionStatusText.value)
    console.log('连接URL:', socketManager.value?.url)
    console.log('统计信息:', stats)
    console.log('健康状态:', health)
    console.groupEnd()
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  const on = (event, callback) => {
    if (eventListeners.value[event]) {
      eventListeners.value[event].push(callback)
    }
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  const off = (event, callback) => {
    if (eventListeners.value[event]) {
      const index = eventListeners.value[event].indexOf(callback)
      if (index > -1) {
        eventListeners.value[event].splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  const emit = (event, data) => {
    if (eventListeners.value[event]) {
      eventListeners.value[event].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('❌ 事件回调执行错误:', error)
        }
      })
    }
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    console.log('🧹 清理WebSocket资源')
    
    // 清空事件监听器
    Object.keys(eventListeners.value).forEach(key => {
      eventListeners.value[key] = []
    })
    
    // 关闭连接
    closeConnection(1000, '组件销毁')
    
    // 清空引用
    socketManager.value = null
    connectionStatus.value = CONNECTION_STATUS.DISCONNECTED
  }

  return {
    // 响应式数据
    connectionStatus,
    connectionStatusText,
    isConnected,
    socketManager,
    
    // 连接管理
    initSocket,
    manualReconnect,
    closeConnection,
    cleanup,
    
    // 消息通信
    sendMessage,
    
    // 事件系统
    on,
    off,
    emit,
    
    // 统计和调试
    getConnectionStats,
    checkConnectionHealth,
    showConnectionStats,
    
    // 常量
    CONNECTION_STATUS
  }
}