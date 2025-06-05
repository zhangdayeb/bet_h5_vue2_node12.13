// src/views/bjlLh/composables/useGameState.js
// 修复版游戏状态管理 - 负责开牌清场，分离职责

import { ref } from 'vue'

/**
 * 修复版游戏状态管理
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
  // 中奖弹窗管理状态
  // ================================
  
  // 中奖弹窗显示状态
  const showWinningPopup = ref(false)
  // 中奖金额
  const winningAmount = ref(0)
  // 中奖音效播放状态控制
  const winningAudioPlayed = ref(false)

  // 音频管理器实例
  const audioManager = ref(null)

  // ================================
  // 多消息处理状态
  // ================================
  
  // 记录本局已处理的操作
  const currentRoundProcessed = ref({
    bureauNumber: '',     // 当前处理的局号
    flashSet: false,      // 是否已设置闪烁
    winningShown: false,  // 是否已显示中奖
    cleared: false        // 是否已清理
  })

  // ================================
  // 🆕 新增：清理回调管理
  // ================================
  
  // 清理回调函数列表
  const cleanupCallbacks = ref([])

  /**
   * 🆕 注册清理回调函数
   * @param {Function} callback - 清理回调函数
   */
  const registerCleanupCallback = (callback) => {
    if (typeof callback === 'function') {
      cleanupCallbacks.value.push(callback)
      console.log('📋 已注册清理回调函数，当前回调数量:', cleanupCallbacks.value.length)
    } else {
      console.warn('⚠️ 注册的回调不是函数类型')
    }
  }

  /**
   * 🆕 执行所有清理回调
   * @param {Array} betTargetList - 投注区域列表
   */
  const executeCleanupCallbacks = (betTargetList) => {
    console.log('🎯 执行清理回调，回调数量:', cleanupCallbacks.value.length)
    
    cleanupCallbacks.value.forEach((callback, index) => {
      try {
        callback(betTargetList)
        console.log(`✅ 清理回调 ${index + 1} 执行成功`)
      } catch (error) {
        console.error(`❌ 清理回调 ${index + 1} 执行失败:`, error)
      }
    })
  }

  /**
   * 🆕 调度开牌结果后的清理工作
   * @param {Object} gameConfig - 游戏配置
   */
  const scheduleResultCleanup = (gameConfig) => {
    if (!gameConfig) {
      console.warn('⚠️ gameConfig未传入，无法调度清理')
      return
    }
    
    console.log('⏰ 调度开牌结果后清理：5秒后执行')
    
    setTimeout(() => {
      console.log('🎯 执行开牌结果后自动清理')
      executeCleanupCallbacks(gameConfig.betTargetList.value)
      
      // 标记本局已清理
      if (currentRoundProcessed.value.bureauNumber === bureauNumber.value) {
        currentRoundProcessed.value.cleared = true
        console.log('📝 标记本局已清理')
      }
      
    }, 5000) // 5秒后清理，给用户足够时间看结果
  }
  
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
  // 统一的中奖音频播放管理
  // ================================
  
  /**
   * 播放中奖音效（统一入口，防重复）
   * @param {number} amount - 中奖金额
   * @param {string} roundId - 局号（用于防重复）
   * @returns {boolean} 是否播放成功
   */
  const playWinningAudioSafely = (amount, roundId = '') => {
    console.log('🎯 播放中奖音效')
    // 检查是否已经播放过本局的中奖音效
    const currentRoundKey = `${roundId}_${amount}`
    
    if (winningAudioPlayed.value === currentRoundKey) {
      console.log('🔇 本局中奖音效已播放，防止重复播放')
      return false
    }

    // 验证音频管理器和金额
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

    // 根据金额播放不同的中奖音效
    let audioSuccess = false
    
    try {
      if (audioManager.value.playWinSoundByAmount) {
        audioSuccess = audioManager.value.playWinSoundByAmount(winAmount)
        console.log('🎵 中奖音效序列播放结果:', audioSuccess)
      } else if (audioManager.value.playWinningSound) {
        audioSuccess = audioManager.value.playWinningSound('betsuccess.mp3')
        console.log('🎵 单个中奖音效播放结果:', audioSuccess)
      } else {
        console.warn('⚠️ 中奖音效播放方法不存在')
        return false
      }

      // 标记本局中奖音效已播放
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
  // 中奖弹窗管理功能
  // ================================
  
  /**
   * 显示中奖弹窗
   */
  const showWinningDisplay = (amount, roundId = '') => {
    console.log('🎯 显示中奖弹窗')
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

    // 使用统一的中奖音效播放入口
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
  }

  /**
   * 播放中奖音效（供弹窗组件调用）
   */
  const playWinningSound = () => {
    console.log('🎵 弹窗组件请求播放中奖音效')
    
    // 检查是否已经播放过
    if (winningAudioPlayed.value) {
      console.log('🔇 中奖音效已播放过，弹窗音效请求被忽略')
      return false
    }

    // 使用备用的单次中奖音效
    return safePlayAudio(audioManager.value?.playWinningSound, 'betsuccess.mp3')
  }

  // ================================
  // 闪烁效果管理
  // ================================
  
  /**
   * 设置闪烁效果
   */
  const setFlashEffect = (flashIds = [], gameConfig = null) => {
    console.log('✨ 设置闪烁效果:', flashIds, '当前局号:', bureauNumber.value)
    
    if (!flashIds || flashIds.length === 0) {
      console.log('📝 无闪烁区域')
      return false
    }

    if (!gameConfig) {
      console.warn('⚠️ gameConfig未传入，无法设置闪烁')
      return false
    }

    currentGameFlashed.value = true
    flashingAreas.value = [...flashIds]

    // 根据游戏类型获取正确的响应式数组
    const targetList = gameConfig.gameType.value == 3 
      ? gameConfig.betTargetListBjl.value 
      : gameConfig.betTargetListLongHu.value

    if (targetList && targetList.length > 0) {
      let matchedCount = 0
      
      targetList.forEach((item) => {
        if (flashIds.includes(item.id)) {
          matchedCount++
          item.flashClass = 'bet-win-green-bg'
          console.log('✅ 设置闪烁:', item.label, item.id)
        }
      })
      
      console.log(`✨ 闪烁设置完成，匹配 ${matchedCount} 个区域`)
      
      if (matchedCount === 0) {
        console.error('❌ 没有任何区域匹配到闪烁ID!')
      }
    } else {
      console.warn('⚠️ 目标列表为空或无效')
    }

    // 设置清理定时器 - 5秒后清除闪烁
    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }
    
    console.log('⏰ 设置闪烁定时器：5秒后清除')
    
    flashTimer.value = setTimeout(() => {
      console.log('⏰ 5秒到了，开始清除闪烁效果')
      clearFlashEffect(gameConfig)
    }, 5000)

    return true
  }

  /**
   * 清除闪烁效果
   */
  const clearFlashEffect = (gameConfig = null) => {
    console.log('🧹 清除闪烁效果')
    
    if (!gameConfig) {
      console.warn('⚠️ gameConfig未传入清除函数')
      return
    }

    // 执行清理
    const targetList = gameConfig.gameType.value == 3 
      ? gameConfig.betTargetListBjl.value 
      : gameConfig.betTargetListLongHu.value

    if (targetList && targetList.length > 0) {
      let clearedFlashCount = 0

      targetList.forEach((item) => {
        // 只清除闪烁效果，不清除投注数据
        if (flashingAreas.value.includes(item.id) && item.flashClass) {
          item.flashClass = ''
          clearedFlashCount++
          console.log('🧹 清除闪烁:', item.label, item.id)
        }
      })

      console.log('✅ 闪烁清理完成:', {
        clearedFlash: clearedFlashCount,
        bureauNumber: bureauNumber.value
      })
    }

    // 清空记录
    flashingAreas.value = []
    
    // 清理定时器
    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }
  }

  // ================================
  // 桌台信息处理
  // ================================
  
  /**
   * 处理桌台信息更新
   */
  const handleTableInfo = (tableInfo) => {
    const newTableInfo = tableInfo.data.table_run_info
    console.log('📊 桌台信息更新，倒计时:', newTableInfo.end_time)

    tableRunInfo.value = newTableInfo

    return {
      type: 'table_update',
      bureauNumber: bureauNumber.value
    }
  }

  // ================================
  // 🔧 修复：开牌结果处理 - 负责调度清理
  // ================================
  
  /**
   * 🔧 修复：处理开牌结果 - 增加清理调度
   */
  const handleGameResult = (gameResult, gameConfig = null, gameType = null) => {
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      console.warn('⚠️ 开牌结果数据无效')
      return null
    }

    const resultData = gameResult.data.result_info
    const flashIds = resultData.pai_flash || []
    const resultBureauNumber = gameResult.data.bureau_number
    const winningAmount = resultData.money || 0

    console.log('🎯 收到开牌结果消息:', {
      bureauNumber: resultBureauNumber,
      currentBureau: bureauNumber.value,
      flashIds,
      winningAmount
    })

    // 检查是否是新的一局
    const isNewRound = bureauNumber.value !== resultBureauNumber
    
    if (isNewRound) {
      console.log('🆕 新的一局开始:', resultBureauNumber)
      
      // 重置局状态
      bureauNumber.value = resultBureauNumber
      currentGameFlashed.value = false
      winningAudioPlayed.value = false
      
      // 重置本局处理状态
      currentRoundProcessed.value = {
        bureauNumber: resultBureauNumber,
        flashSet: false,
        winningShown: false,
        cleared: false
      }
      
      console.log('🔄 重置本局处理状态')
    }

    // 只在第一次收到本局消息时设置闪烁
    if (!currentRoundProcessed.value.flashSet && flashIds.length > 0) {
      console.log('✨ 第一次处理本局，设置闪烁效果')
      setFlashEffect(flashIds, gameConfig)
      currentRoundProcessed.value.flashSet = true
    } else if (currentRoundProcessed.value.flashSet && flashIds.length > 0) {
      console.log('⚠️ 本局闪烁已设置，跳过重复设置')
    }

    // 每次都检查中奖信息
    if (winningAmount > 0 && !currentRoundProcessed.value.winningShown) {
      console.log('🎉 发现中奖信息！金额:', winningAmount)
      
      const displaySuccess = showWinningDisplay(winningAmount, resultBureauNumber)
      
      if (displaySuccess) {
        currentRoundProcessed.value.winningShown = true
        console.log('✅ 中奖弹窗和音效处理成功，标记已处理')
      }
    } else if (winningAmount > 0 && currentRoundProcessed.value.winningShown) {
      console.log('⚠️ 本局中奖已处理，跳过重复显示')
    } else if (winningAmount <= 0) {
      console.log('📝 本次消息无中奖信息')
    }

    // 🆕 关键修复：调度开牌结果后的清理工作
    if (flashIds.length > 0 && !currentRoundProcessed.value.cleared) {
      console.log('🎯 调度开牌结果后的清理工作')
      scheduleResultCleanup(gameConfig)
    }

    return {
      type: 'game_result',
      resultInfo: resultData,
      bureauNumber: resultBureauNumber,
      flashIds,
      winningAmount,
      processed: true,
      isNewRound,
      isRepeatMessage: !isNewRound && currentRoundProcessed.value.flashSet
    }
  }

  /**
   * 处理中奖金额显示（兼容性保留）
   */
  const handleMoneyShow = (gameResult) => {
    console.log('🎯 handleMoneyShow 被调用（兼容性保留）')
    
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      return
    }

    const resultData = gameResult.data.result_info
    const showMoney = resultData.money

    if (showMoney && showMoney > 0) {
      console.log('💰 handleMoneyShow 检测到中奖:', showMoney, '但处理已在 handleGameResult 中完成')
    }
  }

  // ================================
  // 消息处理主入口
  // ================================
  
  /**
   * 处理游戏消息的主入口函数
   */
  const processGameMessage = (messageResult, gameConfig = null, gameType = null) => {
    if (!messageResult || (typeof messageResult === 'string' && !messageResult.trim())) {
      return { type: 'empty_message' }
    }

    // 桌台信息更新消息
    if (messageResult.data && messageResult.data.table_run_info) {
      return handleTableInfo(messageResult)
    }

    // 开牌结果消息 - 统一处理闪烁、中奖和清理调度
    if (messageResult.data && messageResult.data.result_info) {    
      console.log('📨 处理开牌结果消息')
      
      // 🔧 修复：在 handleGameResult 中统一处理闪烁、中奖和清理调度
      const gameResultInfo = handleGameResult(messageResult, gameConfig, gameType)
      
      // 保留 handleMoneyShow 调用以确保兼容性
      handleMoneyShow(messageResult)
      
      return gameResultInfo
    }

    return { type: 'other_message', data: messageResult }
  }

  // ================================
  // 资源清理方法
  // ================================
  
  /**
   * 清理所有资源
   */
  const cleanup = () => {
    console.log('🧹 清理游戏状态资源')
    
    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }
    
    closeWinningDisplay()
    currentGameFlashed.value = false
    flashingAreas.value = []
    winningAudioPlayed.value = false
    bureauNumber.value = ''
    tableRunInfo.value = {}
    
    // 重置多消息处理状态
    currentRoundProcessed.value = {
      bureauNumber: '',
      flashSet: false,
      winningShown: false,
      cleared: false
    }

    // 清空清理回调
    cleanupCallbacks.value = []
  }

  /**
   * 新局重置
   */
  const resetForNewRound = () => {
    console.log('🆕 新局重置游戏状态')
    
    currentGameFlashed.value = false
    flashingAreas.value = []
    winningAudioPlayed.value = false
    
    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }
    
    // 重置多消息处理状态
    currentRoundProcessed.value = {
      bureauNumber: '',
      flashSet: false,
      winningShown: false,
      cleared: false
    }
  }

  // ================================
  // 调试方法
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
    console.log('currentRoundProcessed:', currentRoundProcessed.value)
    console.log('cleanupCallbacks数量:', cleanupCallbacks.value.length)
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
    currentGameFlashed,
    audioManager,
    
    // 中奖弹窗相关数据
    showWinningPopup,
    winningAmount,
    winningAudioPlayed,
    
    // 多消息处理状态
    currentRoundProcessed,
    
    // 核心功能方法
    setAudioManager,
    processGameMessage,
    
    // 🆕 清理回调管理
    registerCleanupCallback,
    
    // 中奖管理方法
    showWinningDisplay,
    closeWinningDisplay,
    playWinningSound,
    playWinningAudioSafely,
    
    // 闪烁管理方法
    setFlashEffect,
    clearFlashEffect,
    
    // 工具方法
    resetForNewRound,
    cleanup,
    debugWinningAudioState
  }
}