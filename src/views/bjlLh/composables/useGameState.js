// src/views/bjlLh/composables/useGameState.js
// 精简版游戏状态管理 - 中奖弹窗管理

import { ref } from 'vue'

/**
 * 精简版游戏状态管理
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
  // 中奖弹窗管理功能
  // ================================
  
  /**
   * 显示中奖弹窗
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
      roundId
    })

    // 设置中奖数据
    winningAmount.value = winAmount
    showWinningPopup.value = true

    // 播放中奖音效
    if (audioManager.value && audioManager.value.playWinningSound) {
      audioManager.value.startSoundEffect('betSound.mp3')
    }

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
    console.log('🎵 播放专用中奖音效')
    safePlayAudio(audioManager.value?.playSoundEffect, 'betSound.mp3')
  }

  // ================================
  // 闪烁功能
  // ================================
  
  /**
   * 设置闪烁效果
   */
  const setFlashEffect = (flashIds = [], betTargetList = []) => {
    // 检查是否当前局已经闪烁过（同一局内防重复）
    if (currentGameFlashed.value) {
      console.log('⚠️ 当前局已经闪烁过，跳过重复闪烁')
      return false
    }

    // 先清除之前的闪烁效果
    clearFlashEffect(betTargetList)

    // 验证闪烁区域参数
    if (!flashIds || flashIds.length === 0) {
      console.log('📝 无闪烁区域')
      return false
    }

    console.log('✨ 设置闪烁效果:', flashIds, '当前局号:', bureauNumber.value)

    // 标记当前局已闪烁（防止同一局重复闪烁）
    currentGameFlashed.value = true
    flashingAreas.value = [...flashIds]

    // 设置闪烁样式到对应的投注目标
    if (betTargetList && betTargetList.length > 0) {
      betTargetList.forEach(item => {
        if (flashIds.includes(item.id)) {
          item.flashClass = 'bet-win-green-bg'
          console.log('🎯 设置闪烁:', item.label, item.id)
        }
      })
    }

    // 5秒后自动清除闪烁效果
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

    // 清除定时器
    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }

    // 清除闪烁样式
    if (betTargetList && betTargetList.length > 0) {
      flashingAreas.value.forEach(areaId => {
        const item = betTargetList.find(target => target.id === areaId)
        if (item) {
          item.flashClass = ''
          console.log('🧹 清除闪烁:', item.label, item.id)
        }
      })
    }

    // 清空闪烁区域记录
    flashingAreas.value = []
  }

  // ================================
  // 桌台信息处理
  // ================================
  
  /**
   * 处理桌台信息更新
   */
  const handleTableInfo = (tableInfo) => {
    const newTableInfo = tableInfo.data.table_run_info
    console.log('倒计时:', newTableInfo.end_time)

    // 更新全局运行信息
    tableRunInfo.value = newTableInfo

    return {
      bureauNumber: bureauNumber.value
    }
  }

  // ================================
  // 开牌结果处理
  // ================================
  
  /**
   * 处理开牌结果 - 增加筹码清理功能
   */
  const handleGameResult = (gameResult, betTargetList = [], gameType = null) => {
    // 验证开牌结果数据完整性
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
      
      // 新局重置闪烁状态
      console.log('🔄 重置闪烁状态，新局可以闪烁')
      currentGameFlashed.value = false
      
      // 清理上一局的闪烁效果和定时器
      if (flashTimer.value) {
        clearTimeout(flashTimer.value)
        flashTimer.value = null
        console.log('🧹 清理上一局的闪烁定时器')
      }
      flashingAreas.value = []
    }

    // 检查是否是当前局的结果
    if (resultBureauNumber !== bureauNumber.value) {
      // 换局了，闪烁条件重置
      currentGameFlashed.value = false
    }

    // 检查当前局是否已经闪烁过
    if (currentGameFlashed.value) {
      console.log('⚠️ 当前局已经处理过开牌结果，跳过重复处理')
      return {
        type: 'game_result',
        processed: false,
        reason: 'already_processed_this_round'
      }
    }

    // ================================
    // 清理投注区域筹码显示
    // ================================
    
    console.log('🧹 开牌结果到达，开始清理投注区域筹码显示')
    
    if (betTargetList && Array.isArray(betTargetList) && betTargetList.length > 0) {
      let clearedAreasCount = 0
      let totalClearedAmount = 0
      
      betTargetList.forEach((item, index) => {
        if (item && (item.betAmount > 0 || item.showChip.length > 0)) {
          // 累计统计
          totalClearedAmount += item.betAmount || 0
          clearedAreasCount++
          
          // 清理投注金额
          item.betAmount = 0
          
          // 清理筹码显示数组
          item.showChip = []
          
          // 注意：不清理 flashClass，因为闪烁效果需要保留
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
    // 播放开牌音效
    // ================================
    
    if (audioManager.value) {
      console.log('🎵 播放开牌音效')
      safePlayAudio(audioManager.value.playOpenCardSequence, resultData, gameType, resultBureauNumber)
    }

    // ================================
    // 设置获胜区域闪烁效果
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
   * 处理中奖金额显示
   */
  const handleMoneyShow = (gameResult) => {
    console.log('===================================================== 处理中奖金额=========================================')
    // 验证开牌结果数据完整性
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      console.warn('⚠️ 中奖金额数据无效')
      return null
    }

    const resultData = gameResult.data.result_info
    const resultBureauNumber = gameResult.data.bureau_number
    const showMoney = resultData.money

    console.log('💰 处理中奖金额:', {
      amount: showMoney,
      bureauNumber: resultBureauNumber,
      resultData
    })

    // 检查中奖金额
    if (showMoney && showMoney > 0) {
      console.log('🎉 玩家中奖！金额:', showMoney)
      
      // 显示专用中奖弹窗
      const displaySuccess = showWinningDisplay(showMoney, resultBureauNumber)
      
      if (displaySuccess) {
        console.log('✅ 中奖弹窗显示成功')
      } else {
        console.log('⚠️ 中奖弹窗显示失败')
      }
    } else {
      console.log('📝 本局无中奖')
    }

    return {
      type: 'winning_amount',
      amount: showMoney,
      bureauNumber: resultBureauNumber,
      processed: true,
      winningPopupShown: showMoney > 0
    }
  }

  // ================================
  // 消息处理主入口
  // ================================
  
  /**
   * 处理游戏消息的主入口函数
   */
  const processGameMessage = (messageResult, betTargetList = [], gameType = null) => {
    // 处理空消息或无效消息
    if (!messageResult || (typeof messageResult === 'string' && !messageResult.trim())) {
      return { type: 'empty_message' }
    }

    // 桌台信息更新消息
    if (messageResult.data && messageResult.data.table_run_info) {
      return handleTableInfo(messageResult)
    }

    // 开牌结果消息
    if (messageResult.data && messageResult.data.result_info) {    
      // 处理中奖金额显示
      handleMoneyShow(messageResult) 
      // 然后处理开牌结果（闪烁、音效、清理筹码）
      return handleGameResult(messageResult, betTargetList, gameType)
    }

    // 其他类型消息
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
    
    // 清理闪烁效果
    clearFlashEffect()
    
    // 关闭中奖弹窗
    closeWinningDisplay()
    
    // 重置状态
    currentGameFlashed.value = false
    bureauNumber.value = ''
    tableRunInfo.value = {}
  }

  // ================================
  // 新局重置（供外部调用）
  // ================================
  
  /**
   * 新局重置
   */
  const resetForNewRound = () => {
    console.log('🆕 新局重置游戏状态')
    
    // 重置闪烁状态
    currentGameFlashed.value = false
    clearFlashEffect()
  }

  // ================================
  // 返回公共接口
  // ================================
  
  return {
    // 响应式数据
    tableRunInfo, // 桌台运行信息
    bureauNumber, // 当前局号
    flashingAreas, // 闪烁区域列表
    audioManager, // 音频管理器
    
    // 中奖弹窗相关数据
    showWinningPopup, // 中奖弹窗显示状态
    winningAmount, // 中奖金额
    
    // 核心功能方法
    setAudioManager, // 设置音频管理器
    processGameMessage, // 处理游戏消息主入口
    
    // 中奖弹窗管理方法
    showWinningDisplay, // 显示中奖弹窗
    closeWinningDisplay, // 关闭中奖弹窗
    playWinningSound, // 播放中奖音效
    
    // 直接导出的方法（用于手动调用）
    setFlashEffect, // 手动设置闪烁效果
    clearFlashEffect, // 手动清除闪烁效果
    
    // 工具方法
    resetForNewRound, // 新局重置
    cleanup // 资源清理
  }
}