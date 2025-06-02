// src/views/bjlLh/composables/useErrorHandler.js
// 错误处理和消息显示管理

import { ref, computed } from 'vue'

/**
 * 错误处理管理
 */
export function useErrorHandler() {
  // 错误消息状态
  const showErrorMsg = ref(false)
  const errorMessageText = ref('')
  const errorMessageTimer = ref(null)
  
  // 欢迎消息状态
  const showWelcomeMsg = ref({
    show: false,
    initShow: false
  })
  const welcomeMsg = ref('欢迎光临游戏')

  // 消息队列
  const messageQueue = ref([])
  const isProcessingQueue = ref(false)

  // 消息类型枚举
  const MESSAGE_TYPES = {
    ERROR: 'error',
    WARNING: 'warning',
    SUCCESS: 'success',
    INFO: 'info',
    NETWORK: 'network',
    SERVER: 'server',
    BETTING: 'betting',
    CONNECTION: 'connection'
  }

  // 计算属性：是否有活动的错误消息
  const hasActiveError = computed(() => {
    return showErrorMsg.value && errorMessageText.value
  })

  // 计算属性：是否有消息队列
  const hasMessageQueue = computed(() => {
    return messageQueue.value.length > 0
  })

  /**
   * 显示错误提示弹窗
   * @param {string} message - 错误消息
   * @param {number} duration - 显示时长（毫秒），默认3000
   * @param {boolean} autoHide - 是否自动隐藏，默认true
   * @param {string} type - 消息类型
   */
  const displayErrorMessage = (message, duration = 3000, autoHide = true, type = MESSAGE_TYPES.ERROR) => {
    if (!message) {
      console.warn('⚠️ 错误消息内容为空')
      return
    }

    console.log(`${getMessageIcon(type)} 显示${getMessageTypeName(type)}消息:`, message)
    
    // 清除之前的定时器
    clearErrorTimer()
    
    // 设置错误消息
    errorMessageText.value = message
    showErrorMsg.value = true
    
    // 自动隐藏
    if (autoHide && duration > 0) {
      errorMessageTimer.value = setTimeout(() => {
        hideErrorMessage()
      }, duration)
    }

    // 记录消息历史（调试用）
    recordMessageHistory(message, type)
  }

  /**
   * 隐藏错误提示弹窗
   */
  const hideErrorMessage = () => {
    showErrorMsg.value = false
    errorMessageText.value = ''
    clearErrorTimer()
    console.log('✅ 错误消息已隐藏')

    // 处理队列中的下一条消息
    processNextQueueMessage()
  }

  /**
   * 清除错误消息定时器
   */
  const clearErrorTimer = () => {
    if (errorMessageTimer.value) {
      clearTimeout(errorMessageTimer.value)
      errorMessageTimer.value = null
    }
  }

  /**
   * 显示本地错误消息（不发送给服务器）
   * @param {string} message - 错误消息
   * @param {number} duration - 显示时长
   */
  const showLocalError = (message, duration = 3000) => {
    displayErrorMessage(message, duration, true, MESSAGE_TYPES.ERROR)
  }

  /**
   * 显示网络错误消息
   * @param {string} message - 错误消息
   */
  const showNetworkError = (message = '网络连接异常，请检查网络设置') => {
    displayErrorMessage(message, 5000, true, MESSAGE_TYPES.NETWORK)
  }

  /**
   * 显示服务器错误消息
   * @param {string} message - 错误消息
   */
  const showServerError = (message = '服务器响应异常，请稍后重试') => {
    displayErrorMessage(message, 4000, true, MESSAGE_TYPES.SERVER)
  }

  /**
   * 显示下注错误消息
   * @param {string} message - 错误消息
   */
  const showBettingError = (message) => {
    displayErrorMessage(message, 3000, true, MESSAGE_TYPES.BETTING)
  }

  /**
   * 显示连接错误消息
   * @param {string} message - 错误消息
   */
  const showConnectionError = (message = '连接中断，正在重新连接...') => {
    displayErrorMessage(message, 5000, true, MESSAGE_TYPES.CONNECTION)
  }

  /**
   * 显示成功消息
   * @param {string} message - 成功消息
   * @param {number} duration - 显示时长
   */
  const showSuccessMessage = (message, duration = 2000) => {
    displayErrorMessage(message, duration, true, MESSAGE_TYPES.SUCCESS)
  }

  /**
   * 显示警告消息
   * @param {string} message - 警告消息
   * @param {number} duration - 显示时长
   */
  const showWarningMessage = (message, duration = 3000) => {
    displayErrorMessage(message, duration, true, MESSAGE_TYPES.WARNING)
  }

  /**
   * 显示信息消息
   * @param {string} message - 信息消息
   * @param {number} duration - 显示时长
   */
  const showInfoMessage = (message, duration = 2500) => {
    displayErrorMessage(message, duration, true, MESSAGE_TYPES.INFO)
  }

  /**
   * 设置欢迎消息
   * @param {string} message - 欢迎消息
   */
  const setWelcomeMessage = (message) => {
    welcomeMsg.value = message
    console.log('🎉 设置欢迎消息:', message)
  }

  /**
   * 显示欢迎消息
   */
  const showWelcomeMessage = () => {
    showWelcomeMsg.value.show = true
    showWelcomeMsg.value.initShow = true
    console.log('🎉 显示欢迎消息')
  }

  /**
   * 隐藏欢迎消息
   */
  const hideWelcomeMessage = () => {
    showWelcomeMsg.value.show = false
    console.log('✅ 欢迎消息已隐藏')
  }

  /**
   * 处理欢迎消息关闭事件
   */
  const handleWelcomeClose = () => {
    hideWelcomeMessage()
    // 返回关闭事件，用于触发音频播放等后续操作
    return { type: 'welcome_closed', timestamp: Date.now() }
  }

  /**
   * 批量显示错误消息（队列模式）
   * @param {Array} messages - 错误消息数组
   * @param {number} interval - 消息间隔时间（毫秒）
   */
  const showErrorQueue = (messages = [], interval = 3500) => {
    if (!Array.isArray(messages) || messages.length === 0) {
      console.warn('⚠️ 错误消息队列为空')
      return
    }

    console.log('📋 添加错误消息到队列:', messages.length, '条')
    
    // 添加到队列
    messages.forEach(message => {
      messageQueue.value.push({
        message,
        type: MESSAGE_TYPES.ERROR,
        duration: 3000,
        timestamp: Date.now()
      })
    })

    // 开始处理队列
    if (!isProcessingQueue.value) {
      processMessageQueue(interval)
    }
  }

  /**
   * 处理消息队列
   * @param {number} interval - 消息间隔时间
   */
  const processMessageQueue = (interval = 3500) => {
    if (isProcessingQueue.value || messageQueue.value.length === 0) {
      return
    }

    isProcessingQueue.value = true
    console.log('📋 开始处理消息队列')

    const processNext = () => {
      if (messageQueue.value.length === 0) {
        isProcessingQueue.value = false
        console.log('✅ 消息队列处理完成')
        return
      }

      const nextMessage = messageQueue.value.shift()
      displayErrorMessage(
        nextMessage.message,
        nextMessage.duration,
        true,
        nextMessage.type
      )

      // 设置下一条消息的处理时间
      setTimeout(processNext, interval)
    }

    processNext()
  }

  /**
   * 处理队列中的下一条消息
   */
  const processNextQueueMessage = () => {
    if (messageQueue.value.length > 0 && !showErrorMsg.value) {
      const nextMessage = messageQueue.value.shift()
      setTimeout(() => {
        displayErrorMessage(
          nextMessage.message,
          nextMessage.duration,
          true,
          nextMessage.type
        )
      }, 500) // 短暂延迟后显示下一条消息
    }
  }

  /**
   * 处理API错误
   * @param {Object} error - 错误对象
   * @param {string} defaultMessage - 默认错误消息
   */
  const handleApiError = (error, defaultMessage = '操作失败，请重试') => {
    let message = defaultMessage

    if (error && error.message) {
      message = error.message
    } else if (error && error.msg) {
      message = error.msg
    } else if (typeof error === 'string') {
      message = error
    } else if (error && error.response && error.response.data) {
      // 处理HTTP响应错误
      const responseData = error.response.data
      if (responseData.message) {
        message = responseData.message
      } else if (responseData.msg) {
        message = responseData.msg
      }
    }

    console.error('🔥 API错误:', error)
    showServerError(message)
  }

  /**
   * 处理网络错误
   * @param {Object} error - 网络错误对象
   */
  const handleNetworkError = (error) => {
    console.error('🌐 网络错误:', error)
    
    let message = '网络连接异常'
    
    if (error && error.code) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          message = '网络连接失败，请检查网络设置'
          break
        case 'TIMEOUT':
          message = '网络请求超时，请重试'
          break
        case 'ABORT':
          message = '请求被取消'
          break
        case 'ECONNREFUSED':
          message = '服务器拒绝连接'
          break
        case 'ENOTFOUND':
          message = '服务器地址无法解析'
          break
        default:
          message = `网络错误 (${error.code})`
      }
    } else if (error && error.type) {
      switch (error.type) {
        case 'cors':
          message = '跨域请求被阻止'
          break
        case 'opaque':
          message = '网络请求被阻止'
          break
        default:
          message = `网络错误 (${error.type})`
      }
    }
    
    showNetworkError(message)
  }

  /**
   * 处理验证错误
   * @param {Object} validationResult - 验证结果
   */
  const handleValidationError = (validationResult) => {
    if (!validationResult || validationResult.isValid) {
      return
    }

    const errors = validationResult.errors || ['数据验证失败']
    
    if (errors.length === 1) {
      showLocalError(errors[0])
    } else {
      // 多个错误时可以选择合并显示或队列显示
      const combinedMessage = errors.join('；')
      if (combinedMessage.length > 50) {
        // 如果消息太长，使用队列模式
        showErrorQueue(errors.map(err => ({ message: err, type: MESSAGE_TYPES.ERROR })))
      } else {
        showLocalError(combinedMessage, 4000)
      }
    }
  }

  /**
   * 获取消息类型图标
   * @param {string} type - 消息类型
   * @returns {string} 图标
   */
  const getMessageIcon = (type) => {
    const icons = {
      [MESSAGE_TYPES.ERROR]: '❌',
      [MESSAGE_TYPES.WARNING]: '⚠️',
      [MESSAGE_TYPES.SUCCESS]: '✅',
      [MESSAGE_TYPES.INFO]: 'ℹ️',
      [MESSAGE_TYPES.NETWORK]: '🌐',
      [MESSAGE_TYPES.SERVER]: '🔥',
      [MESSAGE_TYPES.BETTING]: '🎯',
      [MESSAGE_TYPES.CONNECTION]: '🔌'
    }
    return icons[type] || '📢'
  }

  /**
   * 获取消息类型名称
   * @param {string} type - 消息类型
   * @returns {string} 类型名称
   */
  const getMessageTypeName = (type) => {
    const names = {
      [MESSAGE_TYPES.ERROR]: '错误',
      [MESSAGE_TYPES.WARNING]: '警告',
      [MESSAGE_TYPES.SUCCESS]: '成功',
      [MESSAGE_TYPES.INFO]: '信息',
      [MESSAGE_TYPES.NETWORK]: '网络',
      [MESSAGE_TYPES.SERVER]: '服务器',
      [MESSAGE_TYPES.BETTING]: '下注',
      [MESSAGE_TYPES.CONNECTION]: '连接'
    }
    return names[type] || '消息'
  }

  /**
   * 记录消息历史（调试用）
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   */
  const recordMessageHistory = (message, type) => {
    const historyKey = 'error_message_history'
    try {
      const history = JSON.parse(sessionStorage.getItem(historyKey) || '[]')
      history.push({
        message,
        type,
        timestamp: new Date().toISOString()
      })
      
      // 只保留最近20条记录
      if (history.length > 20) {
        history.shift()
      }
      
      sessionStorage.setItem(historyKey, JSON.stringify(history))
    } catch (error) {
      console.warn('⚠️ 记录消息历史失败:', error)
    }
  }

  /**
   * 获取消息历史
   * @returns {Array} 消息历史数组
   */
  const getMessageHistory = () => {
    try {
      return JSON.parse(sessionStorage.getItem('error_message_history') || '[]')
    } catch (error) {
      console.warn('⚠️ 获取消息历史失败:', error)
      return []
    }
  }

  /**
   * 清除消息历史
   */
  const clearMessageHistory = () => {
    try {
      sessionStorage.removeItem('error_message_history')
      console.log('🧹 消息历史已清除')
    } catch (error) {
      console.warn('⚠️ 清除消息历史失败:', error)
    }
  }

  /**
   * 清除所有消息
   */
  const clearAllMessages = () => {
    hideErrorMessage()
    hideWelcomeMessage()
    messageQueue.value = []
    isProcessingQueue.value = false
    console.log('🧹 清除所有消息')
  }

  /**
   * 获取错误状态
   */
  const getErrorStatus = () => {
    return {
      hasError: showErrorMsg.value,
      errorMessage: errorMessageText.value,
      hasWelcome: showWelcomeMsg.value.show,
      welcomeMessage: welcomeMsg.value,
      welcomeInitialized: showWelcomeMsg.value.initShow,
      queueLength: messageQueue.value.length,
      isProcessingQueue: isProcessingQueue.value,
      messageHistory: getMessageHistory()
    }
  }

  /**
   * 强制隐藏所有消息（紧急情况使用）
   */
  const forceHideAll = () => {
    console.log('🚨 强制隐藏所有消息')
    clearAllMessages()
    clearErrorTimer()
  }

  /**
   * 资源清理
   */
  const cleanup = () => {
    console.log('🧹 清理错误处理器资源')
    clearErrorTimer()
    clearAllMessages()
    clearMessageHistory()
  }

  /**
   * 调试错误处理信息
   */
  const debugErrorInfo = () => {
    console.group('=== 错误处理调试信息 ===')
    console.log('错误状态:', getErrorStatus())
    console.log('定时器状态:', errorMessageTimer.value ? '活动' : '空闲')
    console.log('消息队列:', messageQueue.value)
    console.log('消息历史:', getMessageHistory())
    console.groupEnd()
  }

  return {
    // 响应式数据
    showErrorMsg,
    errorMessageText,
    showWelcomeMsg,
    welcomeMsg,
    messageQueue,
    isProcessingQueue,
    
    // 计算属性
    hasActiveError,
    hasMessageQueue,
    
    // 常量
    MESSAGE_TYPES,
    
    // 错误消息管理
    displayErrorMessage,
    hideErrorMessage,
    showLocalError,
    showNetworkError,
    showServerError,
    showBettingError,
    showConnectionError,
    
    // 其他消息类型
    showSuccessMessage,
    showWarningMessage,
    showInfoMessage,
    
    // 欢迎消息管理
    setWelcomeMessage,
    showWelcomeMessage,
    hideWelcomeMessage,
    handleWelcomeClose,
    
    // 高级功能
    showErrorQueue,
    processMessageQueue,
    handleApiError,
    handleNetworkError,
    handleValidationError,
    
    // 消息历史
    getMessageHistory,
    clearMessageHistory,
    
    // 工具方法
    clearAllMessages,
    forceHideAll,
    getErrorStatus,
    cleanup,
    debugErrorInfo
  }
}