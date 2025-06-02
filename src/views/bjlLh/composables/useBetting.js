// src/views/bjlLh/composables/useBetting.js
// 下注逻辑管理 - 下注、取消、重复下注、下注记录

import { ref, computed } from 'vue'
import bjlService from '@/service/bjlService'

/**
 * 下注逻辑管理
 */
export function useBetting() {
  // 下注状态
  const betSendFlag = ref(false)        // 下注发送标志
  const betSuccess = ref(false)         // 下注成功标志
  const availableClickBet = ref(true)   // 是否允许点击下注
  
  // 下注数据
  const repeatData = ref([])            // 重复下注数据
  const cancelData = ref([])            // 取消下注数据
  const totalMoney = ref(0)             // 下注总金额
  
  // 点击防抖控制
  const lastBetTime = ref(0)
  const betClickInterval = 300         // 下注点击间隔（毫秒）

  // 计算属性
  const hasBetData = computed(() => {
    return repeatData.value.length > 0
  })

  const hasActiveBets = computed(() => {
    return betSendFlag.value && betSuccess.value
  })

  const canPlaceBet = computed(() => {
    return availableClickBet.value && !betSendFlag.value
  })

  /**
   * 初始化下注数据
   * @param {Array} betTargetList - 投注区域列表
   */
  const initBettingData = (betTargetList) => {
    if (!betTargetList || !Array.isArray(betTargetList)) {
      console.warn('⚠️ 投注区域列表无效')
      return
    }

    console.log('🎰 初始化下注数据')
    
    // 初始化取消数据
    cancelData.value = betTargetList.map((bet) => ({
      betAmount: 0,
      id: bet.id
    }))

    // 重置其他状态
    resetBettingState()
  }

  /**
   * 重置下注状态
   */
  const resetBettingState = () => {
    betSendFlag.value = false
    betSuccess.value = false
    availableClickBet.value = true
    totalMoney.value = 0
    repeatData.value = []
    
    console.log('🔄 下注状态已重置')
  }

  /**
   * 执行下注
   * @param {Object} target - 投注目标
   * @param {Object} currentChip - 当前筹码
   * @param {Array} betTargetList - 投注区域列表
   * @param {Function} conversionChip - 筹码转换函数
   * @returns {Object|null} 下注结果
   */
  const placeBet = (target, currentChip, betTargetList, conversionChip) => {
    // 基础验证
    if (!target || !currentChip || !betTargetList) {
      console.warn('⚠️ 下注参数不完整')
      return { success: false, error: '下注参数不完整' }
    }

    // 检查点击间隔（防抖）
    const now = Date.now()
    if (now - lastBetTime.value < betClickInterval) {
      return { success: false, error: '点击过快，请稍候' }
    }
    lastBetTime.value = now
    sessionStorage.setItem('last_bet_time_zg', now.toString())

    // 重置下注成功状态
    betSuccess.value = false

    console.log('🎯 执行下注:', {
      target: target.label,
      chip: currentChip.text,
      value: currentChip.val
    })

    // 查找对应的投注区域并更新
    let betPlaced = false
    betTargetList.forEach((item, index) => {
      if (item.value === target.value) {
        const betAmount = Number(currentChip.val)
        
        // 更新投注金额
        item.betAmount += betAmount
        totalMoney.value += betAmount
        
        // 更新取消数据
        if (cancelData.value[index]) {
          cancelData.value[index].betAmount += betAmount
        }
        
        // 更新筹码显示
        item.showChip = conversionChip(item.betAmount)
        
        betPlaced = true
        console.log('💰 投注更新:', {
          area: item.label,
          amount: betAmount,
          total: item.betAmount
        })
      }
    })

    if (betPlaced) {
      return { 
        success: true, 
        amount: currentChip.val,
        totalAmount: totalMoney.value
      }
    } else {
      return { success: false, error: '投注区域未找到' }
    }
  }

  /**
   * 重复下注
   * @param {Array} betTargetList - 投注区域列表
   * @param {Function} conversionChip - 筹码转换函数
   * @returns {Object} 下注结果
   */
  const repeatBet = (betTargetList, conversionChip) => {
    if (repeatData.value.length < 1) {
      console.warn('⚠️ 没有可重复的下注记录')
      return { success: false, error: '没有可重复的下注记录' }
    }

    console.log('🔄 重复下注:', repeatData.value.length, '个记录')

    betSuccess.value = false
    let totalBetAmount = 0

    // 应用重复下注数据
    betTargetList.forEach((betItem, index) => {
      for (const repeat of repeatData.value) {
        if (betItem.id === repeat.id && repeat.betAmount > 0) {
          betItem.betAmount += repeat.betAmount
          totalBetAmount += repeat.betAmount
          
          if (cancelData.value[index]) {
            cancelData.value[index].betAmount += repeat.betAmount
          }
        }
      }
      
      // 更新筹码显示
      if (betItem.betAmount > 0) {
        betItem.showChip = conversionChip(betItem.betAmount)
      }
    })

    totalMoney.value += totalBetAmount

    console.log('✅ 重复下注完成，总金额:', totalBetAmount)
    
    return { 
      success: true, 
      amount: totalBetAmount,
      betsCount: repeatData.value.filter(r => r.betAmount > 0).length
    }
  }

  /**
   * 取消下注
   * @param {Array} betTargetList - 投注区域列表
   */
  const cancelBet = (betTargetList) => {
    console.log('❌ 取消下注')

    // 清除所有投注显示
    betTargetList.forEach(item => {
      item.betAmount = 0
      item.showChip = []
      item.flashClass = ''
    })

    // 重置状态
    resetBettingState()
    
    // 重新初始化取消数据
    initBettingData(betTargetList)

    return { success: true, message: '已取消所有下注' }
  }

  /**
   * 确认下注（提交到服务器）
   * @param {Array} betTargetList - 投注区域列表
   * @param {Object} gameParams - 游戏参数
   * @param {Object} userInfo - 用户信息
   * @param {boolean} isExempt - 是否免佣
   * @returns {Promise<Object>} 下注结果
   */
  const confirmBet = async (betTargetList, gameParams, userInfo, isExempt = false) => {
    if (betSuccess.value) {
      console.warn('⚠️ 重复提交下注')
      return { success: false, error: '请勿重复提交' }
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

    // 检查余额
    const realBalance = calculateUserBalance(userInfo)
    if (realBalance < totalBetAmount) {
      console.warn('💰 余额不足:', {
        required: totalBetAmount,
        available: realBalance
      })
      return { success: false, error: '余额不足' }
    }

    // 准备请求数据
    const requestData = {
      bet: confirmData,
      game_type: gameParams.gameType,
      table_id: gameParams.tableId,
      is_exempt: isExempt ? 1 : 0
    }

    console.log('📤 提交下注:', {
      betsCount: confirmData.length,
      totalAmount: totalBetAmount,
      isExempt,
      data: requestData
    })

    try {
      // 发送下注请求
      const response = await bjlService.betOrder(requestData)
      
      // 下注成功
      betSuccess.value = true
      betSendFlag.value = true
      
      // 保存重复下注数据
      repeatData.value = betTargetList.map(item => ({
        id: item.id,
        betAmount: item.betAmount,
        label: item.label
      }))
      
      // 重新初始化取消数据
      initBettingData(betTargetList)

      console.log('✅ 下注成功:', response)
      
      return { 
        success: true, 
        data: response,
        amount: totalBetAmount,
        betsCount: confirmData.length
      }

    } catch (error) {
      console.error('❌ 下注失败:', error)
      
      // 下注失败时清理状态
      resetBettingState()
      
      return { 
        success: false, 
        error: error.message || '下注失败，请重试'
      }
    }
  }

  /**
   * 获取当前下注记录
   * @param {Object} gameParams - 游戏参数
   * @param {Array} betTargetList - 投注区域列表
   * @param {Function} conversionChip - 筹码转换函数
   * @returns {Promise<Object>} 获取结果
   */
  const getCurrentBetRecord = async (gameParams, betTargetList, conversionChip) => {
    const requestData = {
      id: gameParams.tableId,
      game_type: gameParams.gameType
    }

    console.log('📥 获取当前下注记录:', requestData)

    try {
      const response = await bjlService.getBetCurrentRecord(requestData)
      
      // 先清空所有投注显示
      betTargetList.forEach(item => {
        item.betAmount = 0
        item.showChip = []
      })

      // 检查是否有有效的下注记录
      const hasValidRecords = response.record_list && response.record_list.length > 0

      if (hasValidRecords) {
        console.log('🎯 恢复下注记录:', response.record_list.length, '条')
        
        betSendFlag.value = true

        // 恢复投注显示
        betTargetList.forEach(item => {
          response.record_list.forEach(record => {
            if (item.id === record.game_peilv_id) {
              item.betAmount = Number(record.bet_amt)
              item.showChip = conversionChip(item.betAmount)
            }
          })
        })

        // 保存为重复下注数据
        repeatData.value = betTargetList.map(item => ({
          id: item.id,
          betAmount: item.betAmount,
          label: item.label
        }))

        return { 
          success: true, 
          hasRecords: true,
          recordsCount: response.record_list.length
        }
      } else {
        console.log('🎯 没有下注记录')
        
        betSendFlag.value = false
        repeatData.value = []
        resetBettingState()

        return { 
          success: true, 
          hasRecords: false 
        }
      }

    } catch (error) {
      console.error('❌ 获取下注记录失败:', error)
      
      // 获取失败时清空显示
      resetBettingState()
      betTargetList.forEach(item => {
        item.betAmount = 0
        item.showChip = []
      })

      return { 
        success: false, 
        error: error.message || '获取下注记录失败'
      }
    }
  }

  /**
   * 计算用户余额
   * @param {Object} userInfo - 用户信息
   * @returns {number} 真实余额
   */
  const calculateUserBalance = (userInfo) => {
    if (!userInfo) return 0

    const balance = Number(userInfo.money_balance) || 0
    const betMoney = Number(userInfo.game_records?.bet_money) || 0
    const depositMoney = Number(userInfo.game_records?.deposit_money) || 0

    return balance + betMoney + depositMoney
  }

  /**
   * 设置下注可用状态
   * @param {boolean} available - 是否可用
   */
  const setAvailableClickBet = (available) => {
    availableClickBet.value = available
    console.log('🎯 下注点击状态:', available ? '可用' : '不可用')
  }

  /**
   * 清除所有下注显示
   * @param {Array} betTargetList - 投注区域列表
   */
  const clearAllBetDisplay = (betTargetList) => {
    console.log('🧹 清除所有下注显示')
    
    betTargetList.forEach(item => {
      item.betAmount = 0
      item.showChip = []
      item.flashClass = ''
    })

    resetBettingState()
    initBettingData(betTargetList)
  }

  /**
   * 获取下注状态摘要
   * @returns {Object} 状态摘要
   */
  const getBettingStateSummary = () => {
    return {
      betSendFlag: betSendFlag.value,
      betSuccess: betSuccess.value,
      availableClickBet: availableClickBet.value,
      totalMoney: totalMoney.value,
      hasBetData: hasBetData.value,
      hasActiveBets: hasActiveBets.value,
      canPlaceBet: canPlaceBet.value,
      repeatDataCount: repeatData.value.length,
      cancelDataCount: cancelData.value.length
    }
  }

  /**
   * 调试下注信息
   */
  const debugBettingInfo = () => {
    console.group('=== 下注管理调试信息 ===')
    console.log('下注状态:', getBettingStateSummary())
    console.log('重复数据:', repeatData.value)
    console.log('取消数据:', cancelData.value)
    console.groupEnd()
  }

  return {
    // 响应式数据
    betSendFlag,
    betSuccess,
    availableClickBet,
    totalMoney,
    repeatData,
    cancelData,
    
    // 计算属性
    hasBetData,
    hasActiveBets,
    canPlaceBet,
    
    // 初始化
    initBettingData,
    resetBettingState,
    
    // 下注操作
    placeBet,
    repeatBet,
    cancelBet,
    confirmBet,
    getCurrentBetRecord,
    
    // 状态管理
    setAvailableClickBet,
    clearAllBetDisplay,
    
    // 工具方法
    calculateUserBalance,
    getBettingStateSummary,
    debugBettingInfo
  }
}