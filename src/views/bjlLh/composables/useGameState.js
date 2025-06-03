// src/views/bjlLh/composables/useGameState.js
// 精简版游戏状态管理 - 增加中奖弹窗管理
// Simplified Game State Management - Added winning popup management

import { ref } from 'vue'

/**
 * 精简版游戏状态管理
 * Simplified game state management composable
 * 
 * 主要功能 Main Features:
 * - 游戏局数管理 Game round management
 * - 闪烁效果控制 Flashing effect control
 * - 音频播放管理 Audio playback management
 * - 中奖弹窗管理 Winning popup management
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

  // ================================
  // 🆕 中奖弹窗管理状态 Winning Popup Management States
  // ================================
  
  // 中奖弹窗显示状态 Winning popup display state
  const showWinningPopup = ref(false)
  // 中奖金额 Winning amount
  const winningAmount = ref(0)
  // 中奖弹窗显示历史（防重复显示）Winning popup display history (prevent duplicate display)
  const winningDisplayHistory = ref(new Set())

  // 音频管理器实例 Audio manager instance
  const audioManager = ref(null)
  const errorHandler = ref(null)
  
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

  const setErrorHandler = (error) => {
    errorHandler.value = error
    console.log('错误管理器已经注入')
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
  // 🆕 中奖弹窗管理功能 Winning Popup Management Functions
  // ================================
  
  /**
   * 显示中奖弹窗
   * Display winning popup
   * @param {number} amount - 中奖金额 Winning amount
   * @param {string} roundId - 局号（防重复显示）Round ID (prevent duplicate display)
   * @returns {boolean} 是否成功显示 Whether successfully displayed
   */
  const showWinningDisplay = (amount, roundId = '') => {
    // 验证中奖金额
    // Validate winning amount
    const winAmount = Number(amount)
    if (!winAmount || winAmount <= 0) {
      console.log('💰 中奖金额无效或为0，不显示弹窗 Invalid or zero winning amount, not showing popup:', amount)
      return false
    }

    // 防重复显示（同一局只显示一次）
    // Prevent duplicate display (only show once per round)
    const displayKey = `${roundId}_${winAmount}`
    if (winningDisplayHistory.value.has(displayKey)) {
      console.log('💰 中奖弹窗已显示过，跳过重复显示 Winning popup already shown, skipping duplicate:', displayKey)
      return false
    }

    console.log('🎉 显示中奖弹窗 Display winning popup:', {
      amount: winAmount,
      roundId,
      displayKey
    })

    // 设置中奖数据
    // Set winning data
    winningAmount.value = winAmount
    showWinningPopup.value = true

    // 记录显示历史
    // Record display history
    winningDisplayHistory.value.add(displayKey)

    // 播放中奖音效
    // Play winning sound effect
    safePlayAudio(audioManager.value?.playWinningSound)

    // 清理历史记录（保留最近10条）
    // Clean up history (keep recent 10 records)
    if (winningDisplayHistory.value.size > 10) {
      const historyArray = Array.from(winningDisplayHistory.value)
      winningDisplayHistory.value = new Set(historyArray.slice(-10))
    }

    return true
  }

  /**
   * 关闭中奖弹窗
   * Close winning popup
   */
  const closeWinningDisplay = () => {
    console.log('🎉 关闭中奖弹窗 Close winning popup')
    showWinningPopup.value = false
    winningAmount.value = 0
  }

  /**
   * 播放中奖音效（供弹窗组件调用）
   * Play winning sound (for popup component to call)
   */
  const playWinningSound = () => {
    console.log('🎵 播放专用中奖音效 Play dedicated winning sound')
    // 可以播放特殊的中奖音效，比如金币声音
    safePlayAudio(audioManager.value?.playSoundEffect, 'win.mp3')
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
   * 处理开牌结果 - 增加筹码清理功能
   * Handle game result processing - Added chip clearing functionality
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

    // ================================
    // 清理投注区域筹码显示
    // Clear betting area chip displays
    // ================================
    
    console.log('🧹 开牌结果到达，开始清理投注区域筹码显示 Game result arrived, clearing betting area chip displays')
    
    if (betTargetList && Array.isArray(betTargetList) && betTargetList.length > 0) {
      let clearedAreasCount = 0
      let totalClearedAmount = 0
      
      betTargetList.forEach((item, index) => {
        if (item && (item.betAmount > 0 || item.showChip.length > 0)) {
          // 记录清理前的状态（用于调试）
          const beforeState = {
            label: item.label,
            betAmount: item.betAmount,
            chipCount: item.showChip.length
          }
          
          // 累计统计
          totalClearedAmount += item.betAmount || 0
          clearedAreasCount++
          
          // 清理投注金额
          item.betAmount = 0
          
          // 清理筹码显示数组
          item.showChip = []
          
          // 注意：不清理 flashClass，因为闪烁效果需要保留
          // Note: Don't clear flashClass as flashing effects should be preserved
          
          console.log(`🧹 清理投注区域 [${index}] Cleared betting area:`, {
            before: beforeState,
            after: {
              label: item.label,
              betAmount: item.betAmount,
              chipCount: item.showChip.length
            }
          })
        }
      })
      
      console.log(`✅ 筹码清理完成 Chip clearing completed:`, {
        clearedAreas: clearedAreasCount,
        totalClearedAmount: totalClearedAmount,
        totalAreas: betTargetList.length
      })
    } else {
      console.warn('⚠️ 投注区域列表无效，跳过筹码清理 Invalid bet target list, skipping chip clearing')
    }

    // ================================
    // 播放开牌音效
    // Play card opening sound effects
    // ================================
    
    if (audioManager.value) {
      console.log('🎵 播放开牌音效 Playing card opening sound')
      safePlayAudio(audioManager.value.playOpenCardSequence, resultData, gameType, resultBureauNumber)
    }

    // ================================
    // 设置获胜区域闪烁效果
    // Set flashing effect for winning areas
    // ================================
    
    if (flashIds.length > 0) {
      setFlashEffect(flashIds, betTargetList)
    }

    // ================================
    // 返回处理结果
    // Return processing result
    // ================================
    
    return {
      type: 'game_result',
      resultInfo: resultData,
      bureauNumber: resultBureauNumber,
      flashIds,
      processed: true,
      // 新增：返回清理统计信息
      // NEW: Return clearing statistics
      clearingStats: {
        clearedAreas: betTargetList ? betTargetList.filter(item => 
          item && (item.betAmount === 0 && item.showChip.length === 0)
        ).length : 0,
        totalAreas: betTargetList ? betTargetList.length : 0,
        clearingTime: Date.now()
      }
    }
  }

  /**
   * 🆕 处理中奖金额显示 - 新的专用函数
   * Handle winning amount display - New dedicated function
   * @param {Object} gameResult - 开牌结果对象 Game result object
   * @returns {Object|null} 处理结果 Processing result
   */
  const handleMoneyShow = (gameResult) => {
    // 验证开牌结果数据完整性
    // Validate game result data integrity
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      console.warn('⚠️ 中奖金额数据无效 Invalid winning amount data')
      return null
    }

    const resultData = gameResult.data.result_info
    const resultBureauNumber = gameResult.data.bureau_number
    const showMoney = resultData.money

    console.log('💰 处理中奖金额 Handle winning amount:', {
      amount: showMoney,
      bureauNumber: resultBureauNumber,
      resultData
    })

    // 检查中奖金额
    // Check winning amount
    if (showMoney && showMoney > 0) {
      console.log('🎉 玩家中奖！Player won!', '金额 Amount:', showMoney)
      
      // 🆕 显示专用中奖弹窗（替代简单消息提示）
      // NEW: Show dedicated winning popup (replace simple message notification)
      const displaySuccess = showWinningDisplay(showMoney, resultBureauNumber)
      
      if (displaySuccess) {
        console.log('✅ 中奖弹窗显示成功 Winning popup displayed successfully')
      } else {
        console.log('⚠️ 中奖弹窗显示失败，使用备用提示 Winning popup display failed, using backup notification')
        // 备用方案：如果弹窗显示失败，仍使用简单提示
        // Backup plan: if popup display fails, still use simple notification
        if (errorHandler.value) {
          errorHandler.value.showSuccessMessage(`恭喜中奖 ${showMoney} 元！`, 3000)
        }
      }
    } else {
      console.log('📝 本局无中奖 No winnings this round')
    }

    // ================================
    // 返回处理结果
    // Return processing result
    // ================================
    
    return {
      type: 'winning_amount',
      amount: showMoney,
      bureauNumber: resultBureauNumber,
      processed: true,
      winningPopupShown: showMoney > 0
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
      // 🆕 先处理中奖金额显示
      // NEW: First handle winning amount display
      handleMoneyShow(messageResult)
      
      // 然后处理开牌结果（闪烁、音效、清理筹码）
      // Then handle game result (flashing, sound effects, chip clearing)
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
    
    // 🆕 中奖弹窗调试信息
    // NEW: Winning popup debug info
    console.log('=== 中奖弹窗状态 Winning Popup Status ===')
    console.log('显示状态 Display Status:', showWinningPopup.value)
    console.log('中奖金额 Winning Amount:', winningAmount.value)
    console.log('显示历史数量 Display History Count:', winningDisplayHistory.value.size)
    console.log('显示历史 Display History:', Array.from(winningDisplayHistory.value))
    
    console.groupEnd()
  }

  // ================================
  // 资源清理方法 Resource Cleanup Methods
  // ================================
  
  /**
   * 清理所有资源
   * Clean up all resources
   */
  const cleanup = () => {
    console.log('🧹 清理游戏状态资源 Cleaning up game state resources')
    
    // 清理闪烁效果
    clearFlashEffect()
    
    // 关闭中奖弹窗
    closeWinningDisplay()
    
    // 清空历史记录
    winningDisplayHistory.value.clear()
    
    // 重置状态
    currentGameFlashed.value = false
    bureauNumber.value = ''
    tableRunInfo.value = {}
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
    
    // 🆕 中奖弹窗相关数据 Winning popup related data
    showWinningPopup, // 中奖弹窗显示状态
    winningAmount, // 中奖金额
    
    // 核心功能方法 Core Functionality Methods
    setAudioManager, // 设置音频管理器
    setErrorHandler,
    processGameMessage, // 处理游戏消息主入口
    
    // 🆕 中奖弹窗管理方法 Winning popup management methods
    showWinningDisplay, // 显示中奖弹窗
    closeWinningDisplay, // 关闭中奖弹窗
    playWinningSound, // 播放中奖音效
    
    // 直接导出的方法（用于手动调用）Direct Export Methods (for manual calling)
    setFlashEffect, // 手动设置闪烁效果
    clearFlashEffect, // 手动清除闪烁效果
    
    // 工具方法 Utility methods
    cleanup, // 资源清理
    debugInfo // 输出调试信息
  }
}