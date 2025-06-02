// src/views/bjlLh/composables/useGameState.js
// 精简版游戏状态管理 - 仅保留开牌闪烁和倒计时显示功能

import { ref } from 'vue'

/**
 * 精简版游戏状态管理
 */
export function useGameState() {
  // 桌台运行信息 - 仅用于倒计时
  const tableRunInfo = ref({})
  
  // 局号
  const bureauNumber = ref('')

  // ================================
  // 功能1: 倒计时显示功能
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
      
      // 特殊时间点提醒
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
   * 处理开牌结果 - 专注闪烁功能
   * @param {Object} gameResult - 开牌结果数据
   * @returns {Object|null} 处理结果
   */
  const handleGameResult = (gameResult) => {
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      console.warn('⚠️ 开牌结果数据无效')
      return null
    }

    const resultData = gameResult.data.result_info

    console.log('🎯 收到开牌结果:', {
      bureauNumber: gameResult.data.bureau_number,
      flashIds: resultData.pai_flash || [],
      timestamp: new Date().toLocaleTimeString()
    })

    // 返回处理结果，用于触发闪烁效果
    return {
      type: 'game_result',
      resultInfo: resultData,
      bureauNumber: gameResult.data.bureau_number,
      flashIds: resultData.pai_flash || []  // 获胜区域ID数组
    }
  }

  // ================================
  // 消息路由分发 - 仅处理两种消息
  // ================================

  /**
   * 处理游戏消息 - 精简版本
   * @param {Object} messageResult - 消息结果
   * @returns {Object|null} 处理结果
   */
  const processGameMessage = (messageResult) => {
    // 空数据处理
    if (!messageResult || (typeof messageResult === 'string' && !messageResult.trim())) {
      return { type: 'empty_message' }
    }

    // 桌台信息更新 - 触发倒计时显示
    if (messageResult.data && messageResult.data.table_run_info) {
      return handleTableInfo(messageResult)
    }

    // 开牌结果消息 - 触发闪烁效果
    if (messageResult.data && messageResult.data.result_info) {
      return handleGameResult(messageResult)
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
   * 重置状态 - 仅重置必要数据
   */
  const resetState = () => {
    console.log('🔄 重置游戏状态')
    tableRunInfo.value = {}
    bureauNumber.value = ''
  }

  /**
   * 调试信息输出
   */
  const debugInfo = () => {
    console.group('=== 精简版游戏状态调试 ===')
    console.log('桌台信息:', tableRunInfo.value)
    console.log('当前局号:', bureauNumber.value)
    console.log('倒计时信息:', getCurrentCountdownInfo())
    console.groupEnd()
  }

  return {
    // 响应式数据
    tableRunInfo,
    bureauNumber,
    
    // 消息处理 - 核心入口
    processGameMessage,
    
    // 功能1: 倒计时相关
    formatCountdownTime,
    getGameStatusText,
    displayCountdownToConsole,
    getCurrentCountdownInfo,
    
    // 功能2: 开牌闪烁相关
    handleGameResult,
    
    // 工具方法
    resetState,
    debugInfo
  }
}