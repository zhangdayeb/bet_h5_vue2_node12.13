// src/views/bjlLh/composables/useGameState.js
// 修复版本 - 解决中奖音频冲突问题

import { ref } from 'vue'

/**
 * 修复版游戏状态管理 - 统一中奖音频管理
 */
export function useGameState() {
  // ================================
  // 响应式状态定义
  // ================================
  
  // 桌台运行信息
  const tableRunInfo = ref({})  
  // 当前局号
  const bureauNumber = ref('')

  // 闪烁控制相关状态
  const flashingAreas = ref([])
  const flashTimer = ref(null)
  const currentGameFlashed = ref(false)

  // ================================
  // 🔧 修复：中奖弹窗管理状态
  // ================================
  
  // 中奖弹窗显示状态
  const showWinningPopup = ref(false)
  // 中奖金额
  const winningAmount = ref(0)
  // 🆕 新增：中奖音效播放状态控制
  const winningAudioPlayed = ref(false)

  // 音频管理器实例
  const audioManager = ref(null)
  
  // ================================
  // 音频管理器注入和安全调用
  // ================================
  
  /**
   * 设置音频管理器实例
   */
  const setAudioManager = (audio) => {
    audioManager.value = audio
    console.log('🎵 音频管理器已注入')
  }

  /**
   * 安全的音频播放调用
   */
  const safePlayAudio = (audioFunction, ...args) => {
    if (audioManager.value && typeof audioFunction === 'function') {
      try {
        return audioFunction.call(audioManager.value, ...args)
      } catch (error) {
        console.warn('⚠️ 音效播放失败:', error)
        return false
      }
    }
    return false
  }

  // ================================
  // 🔧 修复：统一的中奖音频播放管理
  // ================================
  
  /**
   * 🔧 修复：播放中奖音效（统一入口，防重复）
   * @param {number} amount - 中奖金额
   * @param {string} roundId - 局号（用于防重复）
   * @returns {boolean} 是否播放成功
   */
  const playWinningAudioSafely = (amount, roundId = '') => {
    // 🔧 关键修复：检查是否已经播放过本局的中奖音效
    const currentRoundKey = `${roundId}_${amount}`
    
    if (winningAudioPlayed.value === currentRoundKey) {
      console.log('🔇 本局中奖音效已播放，防止重复播放')
      return false
    }

    // 🔧 验证音频管理器和金额
    if (!audioManager.value) {
      console.warn('⚠️ 音频管理器未初始化')
      return false
    }

    const winAmount = Number(amount)
    if (!winAmount || winAmount <= 0) {
      console.log('💰 中奖金额无效，不播放中奖音效')
      return false
    }

    console.log('🎉 播放中奖音效序列:', {
      amount: winAmount,
      roundId,
      audioManager: !!audioManager.value
    })

    // 🔧 关键修复：根据金额播放不同的中奖音效
    let audioSuccess = false
    
    try {
      if (audioManager.value.playWinSoundByAmount) {
        // 🔧 使用专用的中奖音效序列（高优先级，不会被打断）
        audioSuccess = audioManager.value.playWinSoundByAmount(winAmount)
        console.log('🎵 中奖音效序列播放结果:', audioSuccess)
      } else if (audioManager.value.playWinningSound) {
        // 🔧 备用：使用单个中奖音效
        audioSuccess = audioManager.value.playWinningSound('betsuccess.mp3')
        console.log('🎵 单个中奖音效播放结果:', audioSuccess)
      } else {
        console.warn('⚠️ 中奖音效播放方法不存在')
        return false
      }

      // 🔧 标记本局中奖音效已播放
      if (audioSuccess) {
        winningAudioPlayed.value = currentRoundKey
        console.log('✅ 中奖音效播放成功，已标记防重复')
      }

      return audioSuccess

    } catch (error) {
      console.error('❌ 中奖音效播放异常:', error)
      return false
    }
  }

  // ================================
  // 🔧 修复：中奖弹窗管理功能
  // ================================
  
  /**
   * 🔧 修复：显示中奖弹窗（不再直接播放音效）
   */
  const showWinningDisplay = (amount, roundId = '') => {
    // 验证中奖金额
    const winAmount = Number(amount)
    if (!winAmount || winAmount <= 0) {
      console.log('💰 中奖金额无效或为0，不显示弹窗:', amount)
      return false
    }

    console.log('🎉 显示中奖弹窗:', {
      amount: winAmount,
      roundId,
      previousAudioStatus: winningAudioPlayed.value
    })

    // 设置中奖数据
    winningAmount.value = winAmount
    showWinningPopup.value = true

    // 🔧 关键修复：使用统一的中奖音效播放入口
    playWinningAudioSafely(winAmount, roundId)

    return true
  }

  /**
   * 关闭中奖弹窗
   */
  const closeWinningDisplay = () => {
    console.log('🎉 关闭中奖弹窗')
    showWinningPopup.value = false
    winningAmount.value = 0
    // 🔧 注意：不重置 winningAudioPlayed，保持防重复状态
  }

  /**
   * 🔧 修复：播放中奖音效（供弹窗组件调用）
   */
  const playWinningSound = () => {
    console.log('🎵 弹窗组件请求播放中奖音效')
    
    // 🔧 关键修复：检查是否已经播放过
    if (winningAudioPlayed.value) {
      console.log('🔇 中奖音效已播放过，弹窗音效请求被忽略')
      return false
    }

    // 🔧 使用备用的单次中奖音效
    return safePlayAudio(audioManager.value?.playWinningSound, 'betsuccess.mp3')
  }

  // ================================
  // 闪烁功能（保持不变）
  // ================================
  
  /**
   * 设置闪烁效果
   */
  const setFlashEffect = (flashIds = [], betTargetList = []) => {
    if (currentGameFlashed.value) {
      console.log('⚠️ 当前局已经闪烁过，跳过重复闪烁')
      return false
    }

    clearFlashEffect(betTargetList)

    if (!flashIds || flashIds.length === 0) {
      console.log('📝 无闪烁区域')
      return false
    }

    console.log('✨ 设置闪烁效果:', flashIds, '当前局号:', bureauNumber.value)

    currentGameFlashed.value = true
    flashingAreas.value = [...flashIds]

    if (betTargetList && betTargetList.length > 0) {
      betTargetList.forEach(item => {
        if (flashIds.includes(item.id)) {
          item.flashClass = 'bet-win-green-bg'
          console.log('🎯 设置闪烁:', item.label, item.id)
        }
      })
    }

    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }
    
    flashTimer.value = setTimeout(() => {
      console.log('⏰ 5秒到了，开始清除闪烁 - 局号:', bureauNumber.value)
      clearFlashEffect(betTargetList)
    }, 5000)

    return true
  }

  /**
   * 清除闪烁效果
   */
  const clearFlashEffect = (betTargetList = null) => {
    console.log('🧹 清除闪烁效果:', flashingAreas.value)

    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }

    if (betTargetList && betTargetList.length > 0) {
      flashingAreas.value.forEach(areaId => {
        const item = betTargetList.find(target => target.id === areaId)
        if (item) {
          item.flashClass = ''
          console.log('🧹 清除闪烁:', item.label, item.id)
        }
      })
    }

    flashingAreas.value = []
  }

  // ================================
  // 桌台信息处理（保持不变）
  // ================================
  
  /**
   * 处理桌台信息更新
   */
  const handleTableInfo = (tableInfo) => {
    const newTableInfo = tableInfo.data.table_run_info
    console.log('倒计时:', newTableInfo.end_time)

    tableRunInfo.value = newTableInfo

    return {
      bureauNumber: bureauNumber.value
    }
  }

  // ================================
  // 🔧 修复：开牌结果处理
  // ================================
  
  /**
   * 🔧 修复：处理开牌结果 - 优化音效播放时机
   */
  const handleGameResult = (gameResult, betTargetList = [], gameType = null) => {
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      console.warn('⚠️ 开牌结果数据无效')
      return null
    }

    const resultData = gameResult.data.result_info
    const flashIds = resultData.pai_flash || []
    const resultBureauNumber = gameResult.data.bureau_number

    console.log('🎯 收到开牌结果:', {
      resultBureauNumber,
      currentBureauNumber: bureauNumber.value,
      flashIds,
      currentGameFlashed: currentGameFlashed.value
    })

    // 检查是否是新的一局
    const isNewRound = bureauNumber.value !== resultBureauNumber
    
    if (isNewRound) {
      console.log('🆕 新的一局开始:', resultBureauNumber, '上一局:', bureauNumber.value)
      bureauNumber.value = resultBureauNumber
      
      // 🔧 新局重置闪烁状态和音效状态
      currentGameFlashed.value = false
      winningAudioPlayed.value = false // 🔧 重置中奖音效状态
      
      if (flashTimer.value) {
        clearTimeout(flashTimer.value)
        flashTimer.value = null
        console.log('🧹 清理上一局的闪烁定时器')
      }
      flashingAreas.value = []
    }

    if (resultBureauNumber !== bureauNumber.value) {
      currentGameFlashed.value = false
      winningAudioPlayed.value = false // 🔧 重置音效状态
    }

    if (currentGameFlashed.value) {
      console.log('⚠️ 当前局已经处理过开牌结果，跳过重复处理')
      return {
        type: 'game_result',
        processed: false,
        reason: 'already_processed_this_round'
      }
    }

    // ================================
    // 清理投注区域筹码显示（保持不变）
    // ================================
    
    console.log('🧹 开牌结果到达，开始清理投注区域筹码显示')
    
    if (betTargetList && Array.isArray(betTargetList) && betTargetList.length > 0) {
      let clearedAreasCount = 0
      let totalClearedAmount = 0
      
      betTargetList.forEach((item, index) => {
        if (item && (item.betAmount > 0 || item.showChip.length > 0)) {
          totalClearedAmount += item.betAmount || 0
          clearedAreasCount++
          
          item.betAmount = 0
          item.showChip = []
        }
      })
      
      console.log(`✅ 筹码清理完成:`, {
        clearedAreas: clearedAreasCount,
        totalClearedAmount: totalClearedAmount,
        totalAreas: betTargetList.length
      })
    } else {
      console.warn('⚠️ 投注区域列表无效，跳过筹码清理')
    }

    // ================================
    // 🔧 修复：播放开牌音效（不包含中奖音效）
    // ================================
    
    if (audioManager.value) {
      console.log('🎵 播放开牌音效序列（不包含中奖音效）')
      
      // 🔧 关键修复：传递 resultData 但指示不播放中奖音效
      // 因为中奖音效由 handleMoneyShow 专门处理
      const audioParams = {
        resultInfo: { ...resultData, money: 0 }, // 🔧 强制设置为0，防止重复播放中奖音效
        gameType,
        bureauNumber: resultBureauNumber
      }
      
      safePlayAudio(audioManager.value.playOpenCardSequence, audioParams.resultInfo, audioParams.gameType, audioParams.bureauNumber)
    }

    // ================================
    // 设置获胜区域闪烁效果（保持不变）
    // ================================
    
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

  /**
   * 🔧 修复：处理中奖金额显示（唯一的中奖音效触发点）
   */
  const handleMoneyShow = (gameResult) => {
    console.log('💰 处理中奖金额显示')
    
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      console.warn('⚠️ 中奖金额数据无效')
      return null
    }

    const resultData = gameResult.data.result_info
    const resultBureauNumber = gameResult.data.bureau_number
    const showMoney = resultData.money

    console.log('💰 检查中奖金额:', {
      amount: showMoney,
      bureauNumber: resultBureauNumber,
      winningAudioPlayed: winningAudioPlayed.value
    })

    // 检查中奖金额
    if (showMoney && showMoney > 0) {
      console.log('🎉 玩家中奖！金额:', showMoney)
      
      // 🔧 关键修复：这是唯一播放中奖音效的地方
      const displaySuccess = showWinningDisplay(showMoney, resultBureauNumber)
      
      if (displaySuccess) {
        console.log('✅ 中奖弹窗和音效处理成功')
      } else {
        console.log('⚠️ 中奖处理失败')
      }
    } else {
      console.log('📝 本局无中奖')
    }

    return {
      type: 'winning_amount',
      amount: showMoney,
      bureauNumber: resultBureauNumber,
      processed: true,
      winningPopupShown: showMoney > 0,
      audioPlayed: winningAudioPlayed.value !== false
    }
  }

  // ================================
  // 消息处理主入口（保持不变）
  // ================================
  
  /**
   * 处理游戏消息的主入口函数
   */
  const processGameMessage = (messageResult, betTargetList = [], gameType = null) => {
    if (!messageResult || (typeof messageResult === 'string' && !messageResult.trim())) {
      return { type: 'empty_message' }
    }

    // 桌台信息更新消息
    if (messageResult.data && messageResult.data.table_run_info) {
      return handleTableInfo(messageResult)
    }

    // 开牌结果消息
    if (messageResult.data && messageResult.data.result_info) {    
      // 🔧 关键修复：先处理中奖金额（播放中奖音效）
      handleMoneyShow(messageResult) 
      // 然后处理开牌结果（闪烁、开牌音效、清理筹码）
      return handleGameResult(messageResult, betTargetList, gameType)
    }

    return { type: 'other_message', data: messageResult }
  }

  // ================================
  // 🔧 修复：资源清理方法
  // ================================
  
  /**
   * 清理所有资源
   */
  const cleanup = () => {
    console.log('🧹 清理游戏状态资源')
    
    clearFlashEffect()
    closeWinningDisplay()
    
    // 🔧 重置所有状态
    currentGameFlashed.value = false
    winningAudioPlayed.value = false
    bureauNumber.value = ''
    tableRunInfo.value = {}
  }

  /**
   * 🔧 修复：新局重置
   */
  const resetForNewRound = () => {
    console.log('🆕 新局重置游戏状态')
    
    currentGameFlashed.value = false
    winningAudioPlayed.value = false // 🔧 重置中奖音效状态
    clearFlashEffect()
  }

  // ================================
  // 🔧 修复：调试方法
  // ================================
  
  /**
   * 调试中奖音效状态
   */
  const debugWinningAudioState = () => {
    console.group('=== 中奖音效状态调试 ===')
    console.log('winningAudioPlayed:', winningAudioPlayed.value)
    console.log('showWinningPopup:', showWinningPopup.value)
    console.log('winningAmount:', winningAmount.value)
    console.log('bureauNumber:', bureauNumber.value)
    console.log('audioManager存在:', !!audioManager.value)
    console.groupEnd()
  }

  // ================================
  // 返回公共接口
  // ================================
  
  return {
    // 响应式数据
    tableRunInfo,
    bureauNumber,
    flashingAreas,
    audioManager,
    
    // 中奖弹窗相关数据
    showWinningPopup,
    winningAmount,
    winningAudioPlayed, // 🆕 新增：音效播放状态
    
    // 核心功能方法
    setAudioManager,
    processGameMessage,
    
    // 🔧 修复：中奖管理方法
    showWinningDisplay,
    closeWinningDisplay,
    playWinningSound,
    playWinningAudioSafely, // 🆕 新增：安全播放中奖音效
    
    // 闪烁管理方法
    setFlashEffect,
    clearFlashEffect,
    
    // 工具方法
    resetForNewRound,
    cleanup,
    debugWinningAudioState // 🆕 新增：调试方法
  }
}