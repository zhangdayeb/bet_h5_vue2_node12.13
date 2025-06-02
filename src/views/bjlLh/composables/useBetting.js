// src/views/bjlLh/composables/useBetting.js
// 精简版下注管理 - 支持追加投注，避免无效提交

import { ref, computed } from 'vue'
import bjlService from '@/service/bjlService'

/**
 * 精简版下注管理
 */
export function useBetting() {
  // ================================
  // 1. 核心状态管理
  // ================================
  
  const betSendFlag = ref(false)           // 是否已发送到服务器
  const totalAmount = ref(0)               // 当前总投注金额
  const isSubmitting = ref(false)          // 是否正在提交中
  const lastSubmittedBetData = ref(null)   // 上次成功提交的数据

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
    // 这个函数需要从外部传入betTargetList，暂时返回格式示例
    return {
      totalAmount: totalAmount.value,
      betDetails: [], // 实际使用时需要从betTargetList中提取
      timestamp: Date.now()
    }
  }

  /**
   * 检查是否有新的投注数据
   */
  const hasNewBetData = computed(() => {
    if (!lastSubmittedBetData.value) {
      // 从未提交过，有投注就算新
      return totalAmount.value > 0
    }

    const current = getCurrentBetData()
    const last = lastSubmittedBetData.value

    // 比较总金额
    if (current.totalAmount !== last.totalAmount) {
      return true
    }

    // 这里需要详细比较betDetails，暂时简化
    return false
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

  /**
   * 检查投注点击间隔
   * @returns {boolean} 是否允许点击
   */
  const checkBetClickInterval = () => {
    const now = Date.now()
    if (now - lastBetClickTime.value < BET_CLICK_INTERVAL) {
      console.log('⚠️ 点击过快，请稍候')
      return false
    }
    lastBetClickTime.value = now
    return true
  }

  /**
   * 检查确认点击间隔
   * @returns {boolean} 是否允许点击
   */
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

  /**
   * 检查是否可以下注
   * @param {Object} gameState - 游戏状态
   * @param {Object} chips - 筹码状态
   * @param {Object} connection - 连接状态
   * @returns {Object} 检查结果
   */
  const canPlaceBet = (gameState, chips, connection) => {
    const result = {
      canClick: false,    // 是否可以点击投注区域
      canConfirm: false,  // 是否可以点击确认按钮
      reason: ''
    }

    // 基础检查
    if (!chips.currentChip) {
      result.reason = '请先选择筹码'
      return result
    }

    if (!connection.isConnected) {
      result.reason = '网络连接中断，请稍候重试'
      return result
    }

    if (!gameState.betState) {
      result.reason = '非下注时间'
      return result
    }

    // 可以点击投注区域
    result.canClick = true

    // 检查确认按钮
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

  /**
   * 执行投注区域点击
   * @param {Object} target - 投注区域
   * @param {Object} currentChip - 当前筹码
   * @param {Array} betTargetList - 投注区域列表
   * @param {Function} conversionChip - 筹码转换函数
   * @param {Function} playBetSound - 播放下注音效函数
   * @returns {Object} 下注结果
   */
  const executeClickBet = (target, currentChip, betTargetList, conversionChip, playBetSound) => {
    // 防抖检查
    if (!checkBetClickInterval()) {
      return { success: false, error: '点击过快，请稍候' }
    }

    console.log('🎯 执行下注:', {
      target: target.label,
      chip: currentChip.text,
      value: currentChip.val
    })

    // 查找对应的投注区域并更新
    let betPlaced = false
    betTargetList.forEach(item => {
      if (item.value === target.value) {
        const betAmount = Number(currentChip.val)
        
        // 更新投注金额
        item.betAmount += betAmount
        totalAmount.value += betAmount
        
        // 更新筹码显示
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
      // 播放下注音效
      if (playBetSound) {
        playBetSound()
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

  /**
   * 确认投注（智能判断是否需要调用API）
   * @param {Array} betTargetList - 投注区域列表
   * @param {Object} gameParams - 游戏参数
   * @param {boolean} isExempt - 是否免佣
   * @param {Function} playConfirmSound - 播放确认音效函数
   * @param {Function} playTipSound - 播放提示音效函数
   * @returns {Promise<Object>} 确认结果
   */
  const confirmBet = async (betTargetList, gameParams, isExempt = false, playConfirmSound, playTipSound) => {
    // 防抖检查
    if (!checkConfirmClickInterval()) {
      return { success: false, error: '点击过快，请稍候' }
    }

    // 检查是否有新投注数据
    if (!hasNewBetData.value) {
      console.log('📢 投注信息无变化，无需重复提交')
      
      // 播放提示音效
      if (playTipSound) {
        playTipSound()
      }
      
      return { 
        success: false, 
        error: '投注信息无变化，无需重复提交',
        noApiCall: true  // 标识这不是错误，而是无需调用API
      }
    }

    // 准备下注数据
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

    // 准备请求数据
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
      // 设置提交中状态
      isSubmitting.value = true

      // 发送下注请求
      const response = await bjlService.betOrder(requestData)
      
      // 下注成功
      betSendFlag.value = true
      
      // 更新上次提交的数据
      updateSubmittedData(betTargetList)
      
      console.log('✅ 下注成功:', response)
      
      // 播放确认音效
      if (playConfirmSound) {
        playConfirmSound()
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
      // 清除提交中状态
      isSubmitting.value = false
    }
  }

  // ================================
  // 7. 取消按钮处理
  // ================================

  /**
   * 取消投注（智能判断）
   * @param {Array} betTargetList - 投注区域列表
   * @param {Function} playCancelSound - 播放取消音效函数
   * @param {Function} playErrorSound - 播放错误音效函数
   * @returns {Object} 取消结果
   */
  const cancelBet = (betTargetList, playCancelSound, playErrorSound) => {
    if (betSendFlag.value) {
      // 已发送到后台，无法取消
      console.log('⚠️ 下注已提交到服务器，无法取消')
      
      // 播放错误音效
      if (playErrorSound) {
        playErrorSound()
      }
      
      return { 
        success: false, 
        error: '下注已提交，无法取消' 
      }
    } else {
      // 未发送，可以取消
      console.log('❌ 取消投注')

      // 清除所有投注显示
      betTargetList.forEach(item => {
        item.betAmount = 0
        item.showChip = []
        item.flashClass = ''
      })

      // 重置状态
      resetBettingState()
      
      // 播放取消音效
      if (playCancelSound) {
        playCancelSound()
      }

      return { 
        success: true, 
        message: '已取消所有下注' 
      }
    }
  }

  // ================================
  // 8. 数据管理函数
  // ================================

  /**
   * 更新上次提交的数据
   * @param {Array} betTargetList - 投注区域列表
   */
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

  /**
   * 获取详细的当前投注数据
   * @param {Array} betTargetList - 投注区域列表
   * @returns {Object} 当前投注数据
   */
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

  // ================================
  // 9. 自动清理系统
  // ================================

  /**
   * 开牌结果时清理显示
   * @param {Array} betTargetList - 投注区域列表
   */
  const clearOnGameResult = (betTargetList) => {
    console.log('🎯 开牌结果到达，清空投注显示')
    
    // 清空投注显示，但保持提交状态
    betTargetList.forEach(item => {
      item.betAmount = 0
      item.showChip = []
      item.flashClass = ''
    })

    // 重置总金额，但保持其他状态
    totalAmount.value = 0
  }

  /**
   * 新局重置
   * @param {Array} betTargetList - 投注区域列表
   */
  const resetForNewRound = (betTargetList) => {
    console.log('🆕 新局开始，重置下注状态')
    
    // 清空所有投注显示
    betTargetList.forEach(item => {
      item.betAmount = 0
      item.showChip = []
      item.flashClass = ''
    })

    // 重置所有状态
    resetBettingState()
    
    // 清空提交历史
    lastSubmittedBetData.value = null
  }

  /**
   * 重置下注状态
   */
  const resetBettingState = () => {
    betSendFlag.value = false
    totalAmount.value = 0
    isSubmitting.value = false
    lastBetClickTime.value = 0
    lastConfirmClickTime.value = 0
    
    console.log('🔄 下注状态已重置')
  }

  // ================================
  // 10. 初始化系统
  // ================================

  /**
   * 初始化下注系统
   */
  const initBetting = () => {
    console.log('🎰 初始化下注系统')
    
    resetBettingState()
    lastSubmittedBetData.value = null
  }

  // ================================
  // 11. 调试和工具函数
  // ================================

  /**
   * 获取下注状态摘要
   * @returns {Object} 状态摘要
   */
  const getBettingStateSummary = () => {
    return {
      betSendFlag: betSendFlag.value,
      totalAmount: totalAmount.value,
      isSubmitting: isSubmitting.value,
      canConfirm: canConfirm.value,
      hasNewBetData: hasNewBetData.value,
      lastSubmittedData: lastSubmittedBetData.value
    }
  }

  /**
   * 调试下注信息
   */
  const debugBettingInfo = () => {
    console.group('=== 精简版下注管理调试信息 ===')
    console.log('下注状态:', getBettingStateSummary())
    console.log('防抖时间:', {
      lastBetClick: lastBetClickTime.value,
      lastConfirmClick: lastConfirmClickTime.value
    })
    console.groupEnd()
  }

  return {
    // 状态数据
    betSendFlag,
    totalAmount,
    isSubmitting,
    
    // 计算属性
    canConfirm,
    hasNewBetData,
    
    // 权限检查
    canPlaceBet,
    
    // 核心操作
    executeClickBet,
    confirmBet,
    cancelBet,
    
    // 防抖检查
    checkBetClickInterval,
    checkConfirmClickInterval,
    
    // 自动清理
    clearOnGameResult,
    resetForNewRound,
    
    // 数据管理
    updateSubmittedData,
    getDetailedCurrentBetData,
    
    // 初始化
    initBetting,
    resetBettingState,
    
    // 工具方法
    getBettingStateSummary,
    debugBettingInfo
  }
}