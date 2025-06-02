// src/views/bjlLh/composables/useGameState.js
// 完整版游戏状态管理 - 开牌闪烁 + 投注倒计时 + 音效播放

import { ref } from 'vue'

/**
 * 完整版游戏状态管理
 */
export function useGameState() {
  // 桌台运行信息 - 仅用于倒计时
  const tableRunInfo = ref({})
  
  // 局号
  const bureauNumber = ref('')

  // 闪烁效果管理
  const flashingAreas = ref([])           // 当前闪烁的区域ID数组
  const flashTimer = ref(null)            // 闪烁清理定时器

  // 音频管理器引用
  const audioManager = ref(null)

  // ================================
  // 音频管理器注入
  // ================================

  /**
   * 注入音频管理器
   * @param {Object} audio - 音频管理器实例
   */
  const setAudioManager = (audio) => {
    audioManager.value = audio
    console.log('🎵 音频管理器已注入到 GameState')
  }

  /**
   * 安全播放音效
   * @param {Function} audioFunction - 音频函数
   * @param {...any} args - 音频函数参数
   */
  const safePlayAudio = (audioFunction, ...args) => {
    if (audioManager.value && typeof audioFunction === 'function') {
      try {
        return audioFunction.call(audioManager.value, ...args)
      } catch (error) {
        console.warn('⚠️ 音效播放失败:', error)
        return false
      }
    } else {
      console.warn('⚠️ 音频管理器未注入或函数无效')
      return false
    }
  }

  // ================================
  // 功能1: 投注倒计时显示功能
  // ================================

  /**
   * 格式化倒计时时间
   * @param {number} seconds - 秒数
   * @returns {string} 格式化的时间字符串 (MM:SS)
   */
  const formatCountdownTime = (seconds) => {
    if (seconds <= 0) return '00:00'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  /**
   * 获取游戏状态文本
   * @param {number} status - 状态码
   * @returns {string} 带图标的状态文本
   */
  const getGameStatusText = (status) => {
    const statusMap = {
      1: '🟢 下注中',
      2: '🔴 停止下注', 
      3: '🟡 开牌中'
    }
    return statusMap[status] || '⚪ 未知状态'
  }

  /**
   * 显示倒计时信息到控制台
   * @param {number} endTime - 结束时间（秒）
   * @param {number} status - 游戏状态
   * @param {string} bureau - 局号
   */
  const displayCountdownToConsole = (endTime, status, bureau) => {
    const currentTime = endTime || 0
    const formattedTime = formatCountdownTime(currentTime)
    const statusText = getGameStatusText(status)
    const bureauText = bureau || '未知'
    
    if (currentTime > 0) {
      console.log(`⏰ 投注倒计时: ${formattedTime} | 状态: ${statusText} | 局号: ${bureauText}`)
      
      // 特殊时间点提醒 + 音效
      if (currentTime === 30) {
        console.log('📢 投注还有30秒结束')
      } else if (currentTime === 10) {
        console.log('⚠️ 投注即将结束，还有10秒！')
      } else if (currentTime === 5) {
        console.log('🚨 投注即将结束，还有5秒！')
      } else if (currentTime === 3) {
        console.log('🔥 还有3秒！')
      } else if (currentTime === 1) {
        console.log('🔥 最后1秒！')
        // 1秒时播放停止下注音效
        setTimeout(() => {
          safePlayAudio(audioManager.value?.playStopBetSound)
        }, 1000)
      }
      
      // 29秒时播放开始下注音效（欢迎消息显示时间）
      if (currentTime === 29) {
        safePlayAudio(audioManager.value?.playStartBetSound)
      }
    } else {
      console.log(`⏹️ 投注已停止 | 状态: ${statusText} | 局号: ${bureauText}`)
    }
  }

  /**
   * 处理桌台信息更新 - 专注倒计时显示
   * @param {Object} tableInfo - 桌台信息
   */
  const handleTableInfo = (tableInfo) => {
    if (!tableInfo || !tableInfo.table_run_info) {
      return null
    }

    const newTableInfo = tableInfo.table_run_info

    // 检查是否是新的一局
    const isNewRound = bureauNumber.value !== newTableInfo.bureau_number
    if (isNewRound) {
      console.log('🆕 新的一局开始:', newTableInfo.bureau_number)
      bureauNumber.value = newTableInfo.bureau_number
      
      // 新局开始时清除闪烁效果
      clearFlashEffect()
    }

    // 检查倒计时是否发生变化
    const oldEndTime = tableRunInfo.value.end_time || -1
    const newEndTime = newTableInfo.end_time || 0

    // 更新桌台信息
    tableRunInfo.value = { ...newTableInfo }

    // 如果时间发生变化，显示倒计时
    if (oldEndTime !== newEndTime) {
      displayCountdownToConsole(
        newEndTime, 
        newTableInfo.run_status, 
        bureauNumber.value
      )
    }

    return {
      type: isNewRound ? 'new_round' : 'table_update',
      tableInfo: newTableInfo,
      bureauNumber: bureauNumber.value
    }
  }

  // ================================
  // 功能2: 开牌闪烁功能
  // ================================

  /**
   * 设置闪烁效果
   * @param {Array} flashIds - 获胜区域ID数组
   * @param {Array} betTargetList - 投注区域列表
   * @param {number} duration - 闪烁持续时间（毫秒），默认5000
   */
  const setFlashEffect = (flashIds = [], betTargetList = [], duration = 5000) => {
    // 先清除之前的闪烁效果
    clearFlashEffect()

    if (!flashIds || flashIds.length === 0) {
      console.log('📝 无闪烁区域')
      return
    }

    console.log('✨ 设置闪烁效果:', flashIds)

    // 记录当前闪烁的区域
    flashingAreas.value = [...flashIds]

    // 给对应区域设置闪烁样式
    if (betTargetList && betTargetList.length > 0) {
      betTargetList.forEach(item => {
        if (flashIds.includes(item.id)) {
          item.flashClass = 'bet-win-green-bg'
          console.log('🎯 设置闪烁:', item.label, item.id)
        }
      })
    }

    // 设置自动清理定时器
    if (duration > 0) {
      flashTimer.value = setTimeout(() => {
        clearFlashEffect()
        console.log('⏰ 闪烁效果自动清理完成')
      }, duration)
    }
  }

  /**
   * 清除闪烁效果
   * @param {Array} betTargetList - 投注区域列表（可选）
   */
  const clearFlashEffect = (betTargetList = null) => {
    if (flashingAreas.value.length === 0) {
      return // 没有闪烁效果需要清除
    }

    console.log('🧹 清除闪烁效果:', flashingAreas.value)

    // 清除定时器
    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }

    // 清除区域的闪烁样式
    if (betTargetList && betTargetList.length > 0) {
      betTargetList.forEach(item => {
        if (flashingAreas.value.includes(item.id)) {
          item.flashClass = ''
          console.log('🧹 清除闪烁:', item.label, item.id)
        }
      })
    }

    // 清空闪烁区域记录
    flashingAreas.value = []
  }

  /**
   * 检查是否有区域在闪烁
   * @returns {boolean} 是否有闪烁效果
   */
  const hasFlashEffect = () => {
    return flashingAreas.value.length > 0
  }

  /**
   * 获取当前闪烁的区域ID
   * @returns {Array} 闪烁区域ID数组
   */
  const getFlashingAreas = () => {
    return [...flashingAreas.value]
  }

  // ================================
  // 功能3: 开牌结果处理（包含音效）
  // ================================

  /**
   * 处理开牌结果 - 完整处理（闪烁 + 音效）
   * @param {Object} gameResult - 开牌结果数据
   * @param {Array} betTargetList - 投注区域列表
   * @param {number} gameType - 游戏类型
   * @returns {Object|null} 处理结果
   */
  const handleGameResult = (gameResult, betTargetList = [], gameType = null) => {
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      console.warn('⚠️ 开牌结果数据无效')
      return null
    }

    const resultData = gameResult.data.result_info
    const flashIds = resultData.pai_flash || []
    const bureauNumber = gameResult.data.bureau_number

    console.log('🎯 收到开牌结果:', {
      bureauNumber,
      flashIds,
      timestamp: new Date().toLocaleTimeString()
    })

    // 1. 播放开牌音效序列
    if (audioManager.value) {
      console.log('🎵 播放开牌音效序列')
      safePlayAudio(
        audioManager.value.playOpenCardSequence,
        resultData,
        gameType,
        bureauNumber
      )
    }

    // 2. 设置闪烁效果（5秒后自动清除）
    if (flashIds.length > 0) {
      setFlashEffect(flashIds, betTargetList, 5000)
    }

    // 返回处理结果
    return {
      type: 'game_result',
      resultInfo: resultData,
      bureauNumber,
      flashIds,
      processed: true  // 标记已完整处理
    }
  }

  /**
   * 简化的开牌结果处理（仅返回数据，不处理音效和闪烁）
   * @param {Object} gameResult - 开牌结果数据
   * @returns {Object|null} 处理结果
   */
  const handleGameResultSimple = (gameResult) => {
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      console.warn('⚠️ 开牌结果数据无效')
      return null
    }

    const resultData = gameResult.data.result_info

    console.log('🎯 收到开牌结果 (简化处理):', {
      bureauNumber: gameResult.data.bureau_number,
      flashIds: resultData.pai_flash || [],
      timestamp: new Date().toLocaleTimeString()
    })

    // 仅返回处理结果，不做音效和闪烁处理
    return {
      type: 'game_result',
      resultInfo: resultData,
      bureauNumber: gameResult.data.bureau_number,
      flashIds: resultData.pai_flash || [],
      processed: false  // 标记未完整处理
    }
  }

  // ================================
  // 消息路由分发 - 完整处理版本
  // ================================

  /**
   * 处理游戏消息 - 完整版本（包含音效处理）
   * @param {Object} messageResult - 消息结果
   * @param {Array} betTargetList - 投注区域列表
   * @param {number} gameType - 游戏类型
   * @returns {Object|null} 处理结果
   */
  const processGameMessage = (messageResult, betTargetList = [], gameType = null) => {
    // 空数据处理
    if (!messageResult || (typeof messageResult === 'string' && !messageResult.trim())) {
      return { type: 'empty_message' }
    }

    // 桌台信息更新 - 触发倒计时显示
    if (messageResult.data && messageResult.data.table_run_info) {
      return handleTableInfo(messageResult)
    }

    // 开牌结果消息 - 完整处理（音效 + 闪烁）
    if (messageResult.data && messageResult.data.result_info) {
      return handleGameResult(messageResult, betTargetList, gameType)
    }

    // 其他消息直接透传
    return { type: 'other_message', data: messageResult }
  }

  /**
   * 处理游戏消息 - 简化版本（不包含音效处理）
   * @param {Object} messageResult - 消息结果
   * @returns {Object|null} 处理结果
   */
  const processGameMessageSimple = (messageResult) => {
    // 空数据处理
    if (!messageResult || (typeof messageResult === 'string' && !messageResult.trim())) {
      return { type: 'empty_message' }
    }

    // 桌台信息更新 - 触发倒计时显示
    if (messageResult.data && messageResult.data.table_run_info) {
      return handleTableInfo(messageResult)
    }

    // 开牌结果消息 - 简化处理（仅返回数据）
    if (messageResult.data && messageResult.data.result_info) {
      return handleGameResultSimple(messageResult)
    }

    // 其他消息直接透传
    return { type: 'other_message', data: messageResult }
  }

  // ================================
  // 工具方法
  // ================================

  /**
   * 获取当前倒计时信息
   * @returns {Object} 倒计时状态
   */
  const getCurrentCountdownInfo = () => {
    const endTime = tableRunInfo.value.end_time || 0
    const status = tableRunInfo.value.run_status || 0
    
    return {
      endTime,
      status,
      bureauNumber: bureauNumber.value,
      formattedTime: formatCountdownTime(endTime),
      statusText: getGameStatusText(status),
      isActive: endTime > 0
    }
  }

  /**
   * 获取闪烁状态信息
   * @returns {Object} 闪烁状态
   */
  const getFlashStatus = () => {
    return {
      hasFlash: hasFlashEffect(),
      flashingAreas: getFlashingAreas(),
      flashCount: flashingAreas.value.length,
      hasTimer: flashTimer.value !== null
    }
  }

  /**
   * 重置状态 - 仅重置必要数据
   */
  const resetState = () => {
    console.log('🔄 重置游戏状态')
    
    // 重置桌台信息
    tableRunInfo.value = {}
    bureauNumber.value = ''
    
    // 清除闪烁效果
    clearFlashEffect()
  }

  /**
   * 调试信息输出
   */
  const debugInfo = () => {
    console.group('=== 完整版游戏状态调试信息 ===')
    console.log('桌台信息:', tableRunInfo.value)
    console.log('当前局号:', bureauNumber.value)
    console.log('倒计时信息:', getCurrentCountdownInfo())
    console.log('闪烁状态:', getFlashStatus())
    console.log('音频管理器:', audioManager.value ? '已注入' : '未注入')
    console.groupEnd()
  }

  /**
   * 手动触发倒计时显示（测试用）
   * @param {number} endTime - 结束时间
   * @param {number} status - 状态
   * @param {string} bureau - 局号
   */
  const manualTriggerCountdown = (endTime, status = 1, bureau = 'TEST') => {
    displayCountdownToConsole(endTime, status, bureau)
  }

  /**
   * 手动设置闪烁（测试用）
   * @param {Array} flashIds - 闪烁区域ID
   * @param {Array} betTargetList - 投注区域列表
   */
  const manualTriggerFlash = (flashIds, betTargetList) => {
    setFlashEffect(flashIds, betTargetList, 3000) // 3秒测试
  }

  /**
   * 手动播放开牌结果（测试用）
   * @param {Array} flashIds - 闪烁区域ID
   * @param {Array} betTargetList - 投注区域列表
   * @param {number} gameType - 游戏类型
   */
  const manualTriggerGameResult = (flashIds, betTargetList, gameType = 3) => {
    const mockGameResult = {
      data: {
        result_info: {
          pai_flash: flashIds,
          result: { win: 1 }
        },
        bureau_number: 'TEST001'
      }
    }
    
    handleGameResult(mockGameResult, betTargetList, gameType)
  }

  return {
    // 响应式数据
    tableRunInfo,
    bureauNumber,
    flashingAreas,
    audioManager,
    
    // 音频管理器注入
    setAudioManager,
    
    // 消息处理 - 两个版本
    processGameMessage,        // 完整版（推荐）
    processGameMessageSimple,  // 简化版
    
    // 功能1: 倒计时相关
    formatCountdownTime,
    getGameStatusText,
    displayCountdownToConsole,
    getCurrentCountdownInfo,
    handleTableInfo,
    
    // 功能2: 闪烁效果相关
    setFlashEffect,
    clearFlashEffect,
    hasFlashEffect,
    getFlashingAreas,
    getFlashStatus,
    
    // 功能3: 开牌结果处理（两个版本）
    handleGameResult,          // 完整版（推荐）
    handleGameResultSimple,    // 简化版
    
    // 工具方法
    resetState,
    debugInfo,
    
    // 测试方法（开发环境用）
    manualTriggerCountdown,
    manualTriggerFlash,
    manualTriggerGameResult
  }
}