// src/views/bjlLh/composables/useBetting.js
// 修复版下注管理 - 简化取消逻辑，分离职责

import { ref, computed } from 'vue'
import bjlService from '@/service/bjlService'

/**
 * 修复版下注管理
 */
export function useBetting() {
  // ================================
  // 1. 核心状态管理
  // ================================
  
  const betSendFlag = ref(false)           // 是否已发送到服务器
  const totalAmount = ref(0)               // 当前总投注金额
  const isSubmitting = ref(false)          // 是否正在提交中
  const lastSubmittedBetData = ref(null)   // 上次成功提交的数据
  const lastSubmittedChipDisplay = ref(null) // 保存提交时的筹码显示状态

  // 防抖控制
  const lastBetClickTime = ref(0)          // 投注区域点击时间
  const lastConfirmClickTime = ref(0)      // 确认按钮点击时间
  
  const BET_CLICK_INTERVAL = 300           // 投注区域间隔300ms
  const CONFIRM_CLICK_INTERVAL = 1000      // 确认按钮间隔1000ms

  // ================================
  // 2. 计算属性
  // ================================

  /**
   * 获取当前投注数据
   */
  const getCurrentBetData = () => {
    return {
      totalAmount: totalAmount.value,
      betDetails: [],
      timestamp: Date.now()
    }
  }

  /**
   * 检查是否有新的投注数据
   */
  const hasNewBetData = computed(() => {
    if (!lastSubmittedBetData.value) {
      return totalAmount.value > 0
    }

    const current = getCurrentBetData()
    const last = lastSubmittedBetData.value
    return current.totalAmount !== last.totalAmount
  })

  /**
   * 是否可以确认
   */
  const canConfirm = computed(() => {
    return !isSubmitting.value && hasNewBetData.value && totalAmount.value > 0
  })

  // ================================
  // 3. 防抖检查函数
  // ================================

  const checkBetClickInterval = () => {
    const now = Date.now()
    if (now - lastBetClickTime.value < BET_CLICK_INTERVAL) {
      console.log('⚠️ 点击过快，请稍候')
      return false
    }
    lastBetClickTime.value = now
    return true
  }

  const checkConfirmClickInterval = () => {
    const now = Date.now()
    if (now - lastConfirmClickTime.value < CONFIRM_CLICK_INTERVAL) {
      console.log('⚠️ 点击过快，请稍候')
      return false
    }
    lastConfirmClickTime.value = now
    return true
  }

  // ================================
  // 4. 下注权限检查
  // ================================

  const canPlaceBet = (tableRunInfo, chips, connection) => {
    const result = {
      canClick: false,
      canConfirm: false,
      reason: ''
    }

    if (!chips.currentChip) {
      result.reason = '请先选择筹码'
      return result
    }

    if (!connection.isConnected) {
      result.reason = '网络连接中断，请稍候重试'
      return result
    }

    if (tableRunInfo.end_time <= 0) {
      result.reason = '非下注时间'
      return result
    }

    result.canClick = true

    if (isSubmitting.value) {
      result.reason = '正在提交中，请稍候'
      result.canConfirm = false
    } else if (hasNewBetData.value) {
      result.canConfirm = true
      result.reason = '可以确认投注'
    } else if (totalAmount.value > 0) {
      result.reason = '投注信息无变化，无需重复提交'
      result.canConfirm = false
    } else {
      result.reason = '请先选择投注区域'
      result.canConfirm = false
    }

    return result
  }

  // ================================
  // 5. 投注区域点击处理
  // ================================

  const executeClickBet = (target, currentChip, betTargetList, conversionChip, playBetSound) => {
    if (!checkBetClickInterval()) {
      return { success: false, error: '点击过快，请稍候' }
    }

    console.log('🎯 执行下注:', {
      target: target.label,
      chip: currentChip.text,
      value: currentChip.val
    })

    let betPlaced = false
    betTargetList.forEach(item => {
      if (item.value === target.value) {
        const betAmount = Number(currentChip.val)
        item.betAmount += betAmount
        totalAmount.value += betAmount
        item.showChip = conversionChip(item.betAmount)
        betPlaced = true
        console.log('💰 投注更新:', {
          area: item.label,
          amount: betAmount,
          total: item.betAmount,
          totalAmount: totalAmount.value
        })
      }
    })

    if (betPlaced) {
      if (playBetSound && typeof playBetSound === 'function') {
        try {
          playBetSound()
          console.log('🔊 播放下注音效')
        } catch (error) {
          console.warn('⚠️ 下注音效播放失败:', error)
        }
      }
      
      return { 
        success: true, 
        amount: currentChip.val,
        totalAmount: totalAmount.value
      }
    } else {
      return { success: false, error: '投注区域未找到' }
    }
  }

  // ================================
  // 6. 确认按钮处理
  // ================================

  const saveSubmittedChipDisplay = (betTargetList) => {
    const chipDisplaySnapshot = []
    
    betTargetList.forEach(item => {
      if (item.betAmount > 0) {
        chipDisplaySnapshot.push({
          areaId: item.id,
          label: item.label,
          betAmount: item.betAmount,
          showChip: [...item.showChip],
          className: item.className,
          flashClass: item.flashClass
        })
      }
    })
    
    lastSubmittedChipDisplay.value = {
      totalAmount: totalAmount.value,
      chipDisplay: chipDisplaySnapshot,
      timestamp: Date.now()
    }
    
    console.log('💾 已保存提交时的筹码显示状态:', {
      areas: chipDisplaySnapshot.length,
      totalAmount: totalAmount.value
    })
  }

  const confirmBet = async (betTargetList, gameParams, isExempt = false, playConfirmSound, playTipSound) => {
    if (!checkConfirmClickInterval()) {
      return { success: false, error: '点击过快，请稍候' }
    }

    if (!hasNewBetData.value) {
      console.log('📢 投注信息无变化，无需重复提交')
      
      if (playTipSound && typeof playTipSound === 'function') {
        try {
          playTipSound()
          console.log('🔊 播放提示音效')
        } catch (error) {
          console.warn('⚠️ 提示音效播放失败:', error)
        }
      }
      
      return { 
        success: false, 
        error: '投注信息无变化，无需重复提交',
        noApiCall: true
      }
    }

    const confirmData = []
    let totalBetAmount = 0

    betTargetList.forEach(item => {
      if (item.betAmount > 0 && item.id > 0) {
        totalBetAmount += item.betAmount
        confirmData.push({
          money: item.betAmount,
          rate_id: item.id
        })
      }
    })

    if (confirmData.length === 0) {
      return { success: false, error: '请先选择投注区域' }
    }

    const requestData = {
      bet: confirmData,
      game_type: gameParams.gameType,
      table_id: gameParams.tableId,
      is_exempt: isExempt ? 1 : 0
    }

    console.log('📤 提交下注到服务器:', {
      betsCount: confirmData.length,
      totalAmount: totalBetAmount,
      isExempt,
      data: requestData
    })

    try {
      isSubmitting.value = true
      const response = await bjlService.betOrder(requestData)
      
      betSendFlag.value = true
      saveSubmittedChipDisplay(betTargetList)
      updateSubmittedData(betTargetList)
      
      console.log('✅ 下注成功:', response)
      
      if (playConfirmSound && typeof playConfirmSound === 'function') {
        try {
          playConfirmSound()
          console.log('🔊 播放确认音效')
        } catch (error) {
          console.warn('⚠️ 确认音效播放失败:', error)
        }
      }
      
      return { 
        success: true, 
        data: response,
        amount: totalBetAmount,
        betsCount: confirmData.length
      }

    } catch (error) {
      console.error('❌ 下注失败:', error)
      return { 
        success: false, 
        error: error.message || '下注失败，请重试'
      }
    } finally {
      isSubmitting.value = false
    }
  }

  // ================================
  // 7. 🔧 修复：简化的取消按钮处理
  // ================================

  /**
   * 🔧 修复：简化的取消逻辑 - 只看 betSendFlag
   */
  const cancelBet = (betTargetList, gameState, playCancelSound, playErrorSound) => {
    console.log('🎯 处理取消操作，当前状态:', {
      betSendFlag: betSendFlag.value,
      totalAmount: totalAmount.value,
      hasSubmittedRecord: !!lastSubmittedChipDisplay.value
    })

    if (betSendFlag.value) {
      // 情况1：有提交 -> 恢复到提交状态
      return handleRestoreToSubmitted(betTargetList, playCancelSound)
    } else {
      // 情况2：没有提交 -> 清空
      return handleClearAll(betTargetList, playCancelSound)
    }
  }

  /**
   * 🔧 提取：恢复到提交状态的逻辑
   */
  const handleRestoreToSubmitted = (betTargetList, playCancelSound) => {
    console.log('🔄 恢复到提交状态')
    
    if (!lastSubmittedChipDisplay.value?.chipDisplay) {
      console.warn('⚠️ 没有找到提交时的筹码显示状态')
      return { success: false, error: '没有找到提交记录' }
    }

    // 先清空所有投注显示
    betTargetList.forEach(item => {
      item.betAmount = 0
      item.showChip = []
      // 不清理 flashClass
    })

    // 恢复到提交时的筹码显示状态
    let restoredAmount = 0
    let restoredAreas = 0
    
    lastSubmittedChipDisplay.value.chipDisplay.forEach(savedState => {
      const targetArea = betTargetList.find(item => item.id === savedState.areaId)
      if (targetArea) {
        targetArea.betAmount = savedState.betAmount
        targetArea.showChip = [...savedState.showChip]
        restoredAmount += savedState.betAmount
        restoredAreas++
        console.log(`🔄 恢复区域 [${targetArea.label}]:`, {
          amount: savedState.betAmount,
          chipCount: savedState.showChip.length
        })
      }
    })

    // 恢复总金额
    totalAmount.value = lastSubmittedChipDisplay.value.totalAmount

    console.log('✅ 已恢复到提交时的筹码显示状态:', {
      restoredAreas,
      restoredAmount,
      totalAmount: totalAmount.value
    })

    if (playCancelSound && typeof playCancelSound === 'function') {
      try {
        playCancelSound()
        console.log('🔊 播放取消音效')
      } catch (error) {
        console.warn('⚠️ 取消音效播放失败:', error)
      }
    }

    return { 
      success: true, 
      message: `已恢复到提交状态，共${restoredAreas}个区域，总金额${restoredAmount}`,
      restoredAreas,
      restoredAmount,
      type: 'restore'
    }
  }

  /**
   * 🔧 提取：清空所有投注的逻辑
   */
  const handleClearAll = (betTargetList, playCancelSound) => {
    console.log('🧹 清空所有投注')

    // 清除所有投注显示
    betTargetList.forEach(item => {
      item.betAmount = 0
      item.showChip = []
      // 不清理 flashClass
    })

    // 重置状态
    resetBettingState()
    
    if (playCancelSound && typeof playCancelSound === 'function') {
      try {
        playCancelSound()
        console.log('🔊 播放取消音效')
      } catch (error) {
        console.warn('⚠️ 取消音效播放失败:', error)
      }
    }

    return { 
      success: true, 
      message: '已清空所有投注',
      type: 'clear'
    }
  }

  // ================================
  // 8. 🆕 新增：专门的游戏结果清理接口
  // ================================

  /**
   * 🆕 专门给游戏结果后清理使用
   */
  const clearAfterGameResult = (betTargetList) => {
    console.log('🎯 游戏结果后自动清理投注数据')
    
    if (betTargetList && Array.isArray(betTargetList)) {
      betTargetList.forEach(item => {
        if (item) {
          item.betAmount = 0
          item.showChip = []
          // 不清理 flashClass，由 useGameState 管理
        }
      })
    }

    // 重置投注状态
    betSendFlag.value = false
    totalAmount.value = 0
    isSubmitting.value = false
    
    // 清空提交历史
    lastSubmittedBetData.value = null
    lastSubmittedChipDisplay.value = null
    
    // 重置防抖时间
    lastBetClickTime.value = 0
    lastConfirmClickTime.value = 0
    
    console.log('✅ 投注数据清理完成')
  }

  // ================================
  // 9. 数据管理函数
  // ================================

  const updateSubmittedData = (betTargetList) => {
    const betDetails = []
    
    betTargetList.forEach(item => {
      if (item.betAmount > 0) {
        betDetails.push({
          areaId: item.id,
          amount: item.betAmount,
          label: item.label
        })
      }
    })

    lastSubmittedBetData.value = {
      totalAmount: totalAmount.value,
      betDetails,
      timestamp: Date.now()
    }

    console.log('💾 更新提交记录:', lastSubmittedBetData.value)
  }

  const getDetailedCurrentBetData = (betTargetList) => {
    const betDetails = []
    
    betTargetList.forEach(item => {
      if (item.betAmount > 0) {
        betDetails.push({
          areaId: item.id,
          amount: item.betAmount,
          label: item.label
        })
      }
    })

    return {
      totalAmount: totalAmount.value,
      betDetails,
      timestamp: Date.now()
    }
  }

  const resetForNewRound = (betTargetList) => {
    console.log('🆕 新局开始，重置下注状态')
    
    // 清空所有投注显示
    betTargetList.forEach(item => {
      item.betAmount = 0
      item.showChip = []
      // 不清理 flashClass
    })

    // 重置所有状态
    resetBettingState()
    
    // 清空提交历史
    lastSubmittedBetData.value = null
    lastSubmittedChipDisplay.value = null
    
    console.log('🧹 筹码显示记录已清空')
  }

  const resetBettingState = () => {
    betSendFlag.value = false
    totalAmount.value = 0
    isSubmitting.value = false
    lastBetClickTime.value = 0
    lastConfirmClickTime.value = 0
    
    console.log('🔄 下注状态已重置')
  }

  const initBetting = () => {
    console.log('🎰 初始化下注系统')
    
    resetBettingState()
    lastSubmittedBetData.value = null
    lastSubmittedChipDisplay.value = null
  }

  // ================================
  // 10. 调试和工具函数
  // ================================

  const getBettingStateSummary = () => {
    return {
      betSendFlag: betSendFlag.value,
      totalAmount: totalAmount.value,
      isSubmitting: isSubmitting.value,
      canConfirm: canConfirm.value,
      hasNewBetData: hasNewBetData.value,
      lastSubmittedData: lastSubmittedBetData.value,
      lastSubmittedChipDisplay: lastSubmittedChipDisplay.value
    }
  }

  const debugBettingInfo = () => {
    console.group('=== 修复版下注管理调试信息 ===')
    console.log('下注状态:', getBettingStateSummary())
    console.log('防抖时间:', {
      lastBetClick: lastBetClickTime.value,
      lastConfirmClick: lastConfirmClickTime.value
    })
    console.log('筹码显示记录:', lastSubmittedChipDisplay.value ? {
      areas: lastSubmittedChipDisplay.value.chipDisplay?.length || 0,
      totalAmount: lastSubmittedChipDisplay.value.totalAmount,
      timestamp: new Date(lastSubmittedChipDisplay.value.timestamp).toLocaleString()
    } : '无记录')
    console.groupEnd()
  }

  return {
    // 状态数据
    betSendFlag,
    totalAmount,
    isSubmitting,
    lastSubmittedChipDisplay,
    
    // 计算属性
    canConfirm,
    hasNewBetData,
    
    // 权限检查
    canPlaceBet,
    
    // 核心操作
    executeClickBet,
    confirmBet,
    cancelBet,  // 🔧 修复后的简化版本
    
    // 防抖检查
    checkBetClickInterval,
    checkConfirmClickInterval,
    
    // 🆕 专门的游戏结果清理接口
    clearAfterGameResult,
    
    // 其他管理
    resetForNewRound,
    updateSubmittedData,
    getDetailedCurrentBetData,
    saveSubmittedChipDisplay,
    
    // 初始化
    initBetting,
    resetBettingState,
    
    // 工具方法
    getBettingStateSummary,
    debugBettingInfo
  }
}