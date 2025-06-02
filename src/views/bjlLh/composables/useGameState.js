// src/views/bjlLh/composables/useGameState.js
// 精简版游戏状态管理 - 只保留闪烁+音频+倒计时
// Simplified Game State Management - Only includes flashing + audio + countdown

import { ref } from 'vue'

/**
 * 精简版游戏状态管理
 * Simplified game state management composable
 * 
 * 主要功能 Main Features:
 * - 游戏局数管理 Game round management
 * - 闪烁效果控制 Flashing effect control
 * - 音频播放管理 Audio playback management
 * - 消息处理和路由 Message processing and routing
 */
export function useGameState() {
  // ================================
  // 响应式状态定义 Reactive State Definitions
  // ================================
  
  // 桌台运行信息 Table runtime information
  const tableRunInfo = ref({})  
  // 当前局号 Current bureau/round number
  const bureauNumber = ref('')


  // 闪烁控制相关状态 Flashing control related states
  const flashingAreas = ref([]) // 当前闪烁的区域ID数组 Array of currently flashing area IDs
  const flashTimer = ref(null) // 闪烁定时器引用 Flashing timer reference
  const currentGameFlashed = ref(false) // 当前局是否已经闪烁过的标记 Flag for whether current game has flashed

  // 音频管理器实例 Audio manager instance
  const audioManager = ref(null)

  // ================================
  // 音频管理器注入和安全调用 Audio Manager Injection and Safe Calling
  // ================================
  
  /**
   * 设置音频管理器实例
   * Set audio manager instance
   * @param {Object} audio - 音频管理器实例 Audio manager instance
   */
  const setAudioManager = (audio) => {
    audioManager.value = audio
    console.log('🎵 音频管理器已注入 Audio manager injected')
  }

  /**
   * 安全的音频播放调用，带错误处理
   * Safe audio playback call with error handling
   * @param {Function} audioFunction - 要调用的音频方法 Audio function to call
   * @param {...any} args - 传递给音频方法的参数 Arguments to pass to audio function
   * @returns {boolean} 是否成功播放 Whether playback was successful
   */
  const safePlayAudio = (audioFunction, ...args) => {
    if (audioManager.value && typeof audioFunction === 'function') {
      try {
        return audioFunction.call(audioManager.value, ...args)
      } catch (error) {
        console.warn('⚠️ 音效播放失败 Audio playback failed:', error)
        return false
      }
    }
    return false
  }

  // ================================
  // 闪烁功能 - 修复版 Flashing Functionality - Fixed Version
  // ================================
  
  /**
   * 设置闪烁效果
   * Set flashing effect for winning areas
   * @param {Array} flashIds - 需要闪烁的区域ID数组 Array of area IDs to flash
   * @param {Array} betTargetList - 投注目标列表 Bet target list
   * @returns {boolean} 是否成功设置闪烁 Whether flashing was successfully set
   */
  const setFlashEffect = (flashIds = [], betTargetList = []) => {
    // 检查是否当前局已经闪烁过（同一局内防重复）
    // Check if current game has already flashed (prevent duplicate flashing in same round)
    if (currentGameFlashed.value) {
      console.log('⚠️ 当前局已经闪烁过，跳过重复闪烁 Current round already flashed, skipping duplicate')
      return false
    }

    // 先清除之前的闪烁效果
    // Clear previous flashing effects first
    clearFlashEffect(betTargetList)

    // 验证闪烁区域参数
    // Validate flashing area parameters
    if (!flashIds || flashIds.length === 0) {
      console.log('📝 无闪烁区域 No flashing areas')
      return false
    }

    console.log('✨ 设置闪烁效果 Setting flashing effect:', flashIds, '当前局号 Current round:', bureauNumber.value)

    // 标记当前局已闪烁（防止同一局重复闪烁）
    // Mark current round as flashed (prevent duplicate flashing in same round)
    currentGameFlashed.value = true
    flashingAreas.value = [...flashIds]

    // 设置闪烁样式到对应的投注目标
    // Set flashing styles to corresponding bet targets
    if (betTargetList && betTargetList.length > 0) {
      betTargetList.forEach(item => {
        if (flashIds.includes(item.id)) {
          item.flashClass = 'bet-win-green-bg'
          console.log('🎯 设置闪烁 Setting flash:', item.label, item.id)
        }
      })
    }

    // 5秒后自动清除闪烁效果 - 强制清除
    // Auto clear flashing effect after 5 seconds - forced cleanup
    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }
    
    flashTimer.value = setTimeout(() => {
      console.log('⏰ 5秒到了，开始清除闪烁 5 seconds elapsed, clearing flash - 局号 Round:', bureauNumber.value)
      clearFlashEffect(betTargetList)
    }, 5000)

    return true
  }

  /**
   * 清除闪烁效果
   * Clear flashing effects
   * @param {Array|null} betTargetList - 投注目标列表 Bet target list
   */
  const clearFlashEffect = (betTargetList = null) => {
    console.log('🧹 清除闪烁效果 Clearing flashing effects:', flashingAreas.value)

    // 清除定时器
    // Clear timer
    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }

    // 清除闪烁样式
    // Clear flashing styles
    if (betTargetList && betTargetList.length > 0) {
      flashingAreas.value.forEach(areaId => {
        const item = betTargetList.find(target => target.id === areaId)
        if (item) {
          item.flashClass = ''
          console.log('🧹 清除闪烁 Clearing flash:', item.label, item.id)
        }
      })
    }

    // 清空闪烁区域记录
    // Clear flashing areas record
    flashingAreas.value = []
  }

  // ================================
  // 桌台信息处理 Table Information Processing
  // ================================
  
  /**
   * 处理桌台信息更新
   * Handle table information updates
   * @param {Object} tableInfo - 桌台信息对象 Table information object
   * @returns {Object} 处理结果 Processing result
   */
  const handleTableInfo = (tableInfo) => {
    const newTableInfo = tableInfo.data.table_run_info
    console.log('倒计时 Countdown:', newTableInfo.end_time)

    // 时刻修改全局 运行信息
    tableRunInfo.value = newTableInfo

    return {
      bureauNumber: bureauNumber.value
    }
  }

  // ================================
  // 开牌结果处理 Game Result Processing
  // ================================
  
  /**
   * 处理开牌结果
   * Handle game result processing
   * @param {Object} gameResult - 开牌结果对象 Game result object
   * @param {Array} betTargetList - 投注目标列表 Bet target list
   * @param {string|null} gameType - 游戏类型 Game type
   * @returns {Object|null} 处理结果 Processing result
   */
  const handleGameResult = (gameResult, betTargetList = [], gameType = null) => {
    // 验证开牌结果数据完整性
    // Validate game result data integrity
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      console.warn('⚠️ 开牌结果数据无效 Invalid game result data')
      return null
    }

    const resultData = gameResult.data.result_info
    const flashIds = resultData.pai_flash || []
    const resultBureauNumber = gameResult.data.bureau_number

    console.log('🎯 收到开牌结果 Received game result:', {
      resultBureauNumber,
      currentBureauNumber: bureauNumber.value,
      flashIds,
      currentGameFlashed: currentGameFlashed.value
    })

    // 检查是否是新的一局
    // Check if this is a new round
    const isNewRound = bureauNumber.value !== resultBureauNumber
    
    if (isNewRound) {
      console.log('🆕 新的一局开始 New round started:', resultBureauNumber, '上一局 Previous round:', bureauNumber.value)
      bureauNumber.value = resultBureauNumber
      
      // 新局重置闪烁状态 - 允许新局再次闪烁
      // Reset flashing state for new round - allow new round to flash again
      console.log('🔄 重置闪烁状态，新局可以闪烁 Reset flashing state, new round can flash')
      currentGameFlashed.value = false
      
      // 清理上一局的闪烁效果和定时器
      // Clean up previous round's flashing effects and timers
      if (flashTimer.value) {
        clearTimeout(flashTimer.value)
        flashTimer.value = null
        console.log('🧹 清理上一局的闪烁定时器 Clean up previous round flash timer')
      }
      flashingAreas.value = []
    }

    // 检查是否是当前局的结果
    // Check if this is the result of the current round
    if (resultBureauNumber !== bureauNumber.value) {
      // 换局了，闪烁条件重置
      // Round changed, reset flashing conditions
      currentGameFlashed.value = false
    }

    // 检查当前局是否已经闪烁过
    // Check if current round has already flashed
    if (currentGameFlashed.value) {
      console.log('⚠️ 当前局已经处理过开牌结果，跳过重复处理 Current round already processed game result, skipping duplicate')
      return {
        type: 'game_result',
        processed: false,
        reason: 'already_processed_this_round'
      }
    }

    // 播放开牌音效
    // Play card opening sound effects
    if (audioManager.value) {
      console.log('🎵 播放开牌音效 Playing card opening sound')
      safePlayAudio(audioManager.value.playOpenCardSequence, resultData, gameType, resultBureauNumber)
    }

    // 设置获胜区域闪烁效果
    // Set flashing effect for winning areas
    if (flashIds.length > 0) {
      setFlashEffect(flashIds, betTargetList)
    }

    return {
      type: 'game_result',
      resultInfo: resultData,
      bureauNumber: resultBureauNumber,
      flashIds,
      processed: true
    }
  }

  // ================================
  // 消息处理主入口 Main Message Processing Entry Point
  // ================================
  
  /**
   * 处理游戏消息的主入口函数
   * Main entry function for processing game messages
   * @param {Object|string} messageResult - 消息结果对象 Message result object
   * @param {Array} betTargetList - 投注目标列表 Bet target list
   * @param {string|null} gameType - 游戏类型 Game type
   * @returns {Object} 处理结果 Processing result
   */
  const processGameMessage = (messageResult, betTargetList = [], gameType = null) => {
    // 处理空消息或无效消息
    // Handle empty or invalid messages
    if (!messageResult || (typeof messageResult === 'string' && !messageResult.trim())) {
      return { type: 'empty_message' }
    }

    // 桌台信息更新消息
    // Table information update message
    if (messageResult.data && messageResult.data.table_run_info) {
      return handleTableInfo(messageResult)
    }

    // 开牌结果消息
    // Game result message
    if (messageResult.data && messageResult.data.result_info) {
      return handleGameResult(messageResult, betTargetList, gameType)
    }

    // 其他类型消息
    // Other type messages
    return { type: 'other_message', data: messageResult }
  }

  // ================================
  // 调试和状态检查方法 Debug and State Check Methods
  // ================================
  
  /**
   * 输出当前游戏状态的调试信息
   * Output debug information for current game state
   */
  const debugInfo = () => {
    console.group('=== 精简版游戏状态调试信息 Simplified Game State Debug Info ===')
    console.log('当前局号 Current Bureau Number:', bureauNumber.value)
    console.log('闪烁区域 Flashing Areas:', flashingAreas.value)
    console.log('当前局已闪烁 Current Game Flashed:', currentGameFlashed.value)
    console.log('定时器状态 Timer Status:', flashTimer.value ? '活动 Active' : '空闲 Idle')
    console.log('桌台信息 Table Info:', tableRunInfo.value)
    console.log('音频管理器 Audio Manager:', audioManager.value ? '已连接 Connected' : '未连接 Not Connected')
    console.groupEnd()
  }

  // ================================
  // 返回公共接口 Return Public Interface
  // ================================
  
  return {
    // 响应式数据 Reactive Data
    tableRunInfo, // 桌台运行信息
    bureauNumber, // 当前局号
    flashingAreas, // 闪烁区域列表
    audioManager, // 音频管理器
    
    // 核心功能方法 Core Functionality Methods
    setAudioManager, // 设置音频管理器
    processGameMessage, // 处理游戏消息主入口
    
    // 直接导出的方法（用于手动调用）Direct Export Methods (for manual calling)
    setFlashEffect, // 手动设置闪烁效果
    clearFlashEffect, // 手动清除闪烁效果
    
    // 调试工具 Debug Tools
    debugInfo // 输出调试信息
  }
}