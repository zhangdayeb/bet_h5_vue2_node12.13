// src/views/bjlLhV2/composables/useGameState.js
// 游戏状态管理 - 桌台信息、开牌结果、游戏流程控制

import { ref, computed } from 'vue'
import msgCode from '@/utils/msgCode'

/**
 * 游戏状态管理
 */
export function useGameState() {
  // 桌台运行信息
  const tableRunInfo = ref({})
  
  // 开牌结果信息
  const resultInfo = ref({})
  
  // 游戏状态
  const betState = ref(false)           // 是否可下注
  const bureauNumber = ref('')          // 局号
  const receiveInfoState = ref(false)   // 是否已接收开牌信息
  const stopMusicHasPlayed = ref(false) // 停止音乐是否已播放
  
  // 用户信息
  const userInfo = ref({})
  
  // 游戏配置
  const startShowWelcomeTime = ref(29)  // 显示欢迎消息的倒计时时间

  // 计算属性
  const canBet = computed(() => {
    return betState.value && tableRunInfo.value.end_time > 0
  })

  const timeRemaining = computed(() => {
    return tableRunInfo.value.end_time || 0
  })

  const gameStatus = computed(() => {
    if (!tableRunInfo.value.run_status) return 'unknown'
    
    switch (tableRunInfo.value.run_status) {
      case 1:
        return 'betting'    // 下注中
      case 2:
        return 'stopped'    // 停止下注
      case 3:
        return 'opening'    // 开牌中
      default:
        return 'unknown'
    }
  })

  const isGameResultReceived = computed(() => {
    return receiveInfoState.value && resultInfo.value && Object.keys(resultInfo.value).length > 0
  })

  /**
   * 处理桌台信息更新
   * @param {Object} tableInfo - 桌台信息
   */
  const handleTableInfo = (tableInfo) => {
    if (!tableInfo || !tableInfo.table_run_info) {
      return
    }

    const newTableInfo = tableInfo.table_run_info
    console.log('🎲 更新桌台信息:', newTableInfo)

    // 检查是否是新的一局
    const isNewRound = bureauNumber.value !== newTableInfo.bureau_number
    if (isNewRound) {
      console.log('🆕 新的一局开始:', newTableInfo.bureau_number)
      bureauNumber.value = newTableInfo.bureau_number
      // 新局开始时重置状态
      resetRoundState()
      
      return { type: 'new_round', bureauNumber: newTableInfo.bureau_number }
    }

    // 更新桌台信息
    tableRunInfo.value = { ...newTableInfo }

    // 处理下注状态变化
    handleBetStateChange(newTableInfo)

    return { type: 'table_update', tableInfo: newTableInfo }
  }

  /**
   * 处理下注状态变化
   * @param {Object} tableInfo - 桌台信息
   */
  const handleBetStateChange = (tableInfo) => {
    const oldBetState = betState.value

    // 结束时间为0且运行状态为2时，不可下注
    if (tableInfo.end_time === 0 && tableInfo.run_status === 2 && !stopMusicHasPlayed.value) {
      betState.value = false
      return { type: 'bet_stopped', trigger: 'end_time_0_status_2' }
    }

    // 结束时间为0时，不可下注
    if (tableInfo.end_time === 0) {
      betState.value = false
      return { type: 'bet_stopped', trigger: 'end_time_0' }
    }

    // 结束时间不为0时，可以下注
    if (tableInfo.end_time !== 0) {
      betState.value = true
      return { type: 'bet_started', trigger: 'end_time_not_0' }
    }

    // 记录状态变化
    if (oldBetState !== betState.value) {
      console.log('🎰 下注状态变化:', oldBetState, '->', betState.value)
    }
  }

  /**
   * 处理开牌结果
   * @param {Object} gameResult - 开牌结果数据
   * @returns {Object|null} 处理结果
   */
  const handleGameResult = (gameResult) => {
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      return null
    }

    const resultData = gameResult.data.result_info

    // 验证游戏类型和桌台ID
    if (!isValidGameResult(resultData)) {
      console.warn('⚠️ 开牌结果验证失败:', resultData)
      return null
    }

    // 检查是否已经处理过这个结果
    if (receiveInfoState.value) {
      console.warn('⚠️ 重复的开牌结果，忽略')
      return null
    }

    console.log('🎯 处理开牌结果:', resultData)

    // 更新结果信息
    resultInfo.value = resultData
    receiveInfoState.value = true

    // 返回处理结果，用于触发音效和闪烁
    return {
      type: 'game_result',
      resultInfo: resultData,
      bureauNumber: gameResult.data.bureau_number,
      flashIds: resultData.pai_flash || []
    }
  }

  /**
   * 验证开牌结果的有效性
   * @param {Object} resultData - 结果数据
   * @returns {boolean} 是否有效
   */
  const isValidGameResult = (resultData) => {
    if (!resultData.table_info) {
      return false
    }

    const { table_info } = resultData
    
    // 检查游戏类型和桌台ID（需要从外部传入这些参数）
    // 这里暂时返回 true，实际使用时需要传入 gameType 和 tableId 进行验证
    return true
  }

  /**
   * 重置一局的状态
   */
  const resetRoundState = () => {
    console.log('🔄 重置一局状态')
    receiveInfoState.value = false
    resultInfo.value = {}
    stopMusicHasPlayed.value = false
    
    return { type: 'round_reset' }
  }

  /**
   * 设置用户信息
   * @param {Object} user - 用户信息
   */
  const setUserInfo = (user) => {
    userInfo.value = { ...user }
    console.log('👤 设置用户信息:', user.user_id || user.id)
  }

  /**
   * 更新用户余额
   * @param {Object} balanceData - 余额数据
   */
  const updateUserBalance = (balanceData) => {
    if (userInfo.value && balanceData) {
      userInfo.value = { ...userInfo.value, ...balanceData }
      console.log('💰 更新用户余额:', balanceData)
    }
  }

  /**
   * 计算用户真实余额
   * @returns {number} 真实余额
   */
  const calculateRealBalance = () => {
    if (!userInfo.value) return 0

    const balance = Number(userInfo.value.money_balance) || 0
    const betMoney = Number(userInfo.value.game_records?.bet_money) || 0
    const depositMoney = Number(userInfo.value.game_records?.deposit_money) || 0

    const realBalance = balance + betMoney + depositMoney
    
    console.log('💰 计算真实余额:', {
      balance,
      betMoney,
      depositMoney,
      realBalance
    })

    return realBalance
  }

  /**
   * 检查余额是否足够
   * @param {number} amount - 需要的金额
   * @returns {boolean} 是否足够
   */
  const hasEnoughBalance = (amount) => {
    const realBalance = calculateRealBalance()
    const isEnough = realBalance >= amount
    
    console.log('💰 余额检查:', {
      required: amount,
      available: realBalance,
      isEnough
    })

    return isEnough
  }

  /**
   * 处理游戏消息
   * @param {Object} messageResult - 消息结果
   * @returns {Object|null} 处理结果
   */
  const processGameMessage = (messageResult) => {
    // 空数据处理
    if (!messageResult || (typeof messageResult === 'string' && !messageResult.trim())) {
      tableRunInfo.value.end_time = 0
      return { type: 'empty_message' }
    }

    // 桌台信息更新
    if (messageResult.data && messageResult.data.table_run_info) {
      return handleTableInfo(messageResult)
    }

    // 音频状态消息
    if (messageResult.code === msgCode.code.audioState) {
      return { type: 'audio_state', data: messageResult }
    }

    // 下注结果消息
    if (messageResult.code === msgCode.code.outRange || messageResult.code === msgCode.code.success) {
      return { type: 'bet_result', code: messageResult.code, message: messageResult.message }
    }

    // 开牌结果消息
    if (messageResult.data && messageResult.data.result_info) {
      return handleGameResult(messageResult)
    }

    return null
  }

  /**
   * 设置停止音乐播放标志
   * @param {boolean} played - 是否已播放
   */
  const setStopMusicPlayed = (played = true) => {
    stopMusicHasPlayed.value = played
  }

  /**
   * 获取游戏状态摘要
   * @returns {Object} 状态摘要
   */
  const getGameStateSummary = () => {
    return {
      bureauNumber: bureauNumber.value,
      betState: betState.value,
      gameStatus: gameStatus.value,
      timeRemaining: timeRemaining.value,
      canBet: canBet.value,
      hasResult: isGameResultReceived.value,
      userBalance: calculateRealBalance(),
      tableInfo: { ...tableRunInfo.value }
    }
  }

  /**
   * 重置所有游戏状态
   */
  const resetAllGameState = () => {
    console.log('🔄 重置所有游戏状态')
    
    tableRunInfo.value = {}
    resultInfo.value = {}
    betState.value = false
    bureauNumber.value = ''
    receiveInfoState.value = false
    stopMusicHasPlayed.value = false
    userInfo.value = {}
  }

  /**
   * 调试游戏状态信息
   */
  const debugGameState = () => {
    console.group('=== 游戏状态调试信息 ===')
    console.log('状态摘要:', getGameStateSummary())
    console.log('桌台信息:', tableRunInfo.value)
    console.log('结果信息:', resultInfo.value)
    console.log('用户信息:', userInfo.value)
    console.groupEnd()
  }

  return {
    // 响应式数据
    tableRunInfo,
    resultInfo,
    betState,
    bureauNumber,
    receiveInfoState,
    stopMusicHasPlayed,
    userInfo,
    startShowWelcomeTime,
    
    // 计算属性
    canBet,
    timeRemaining,
    gameStatus,
    isGameResultReceived,
    
    // 消息处理
    processGameMessage,
    handleTableInfo,
    handleGameResult,
    
    // 状态管理
    resetRoundState,
    resetAllGameState,
    setStopMusicPlayed,
    
    // 用户信息
    setUserInfo,
    updateUserBalance,
    calculateRealBalance,
    hasEnoughBalance,
    
    // 查询方法
    getGameStateSummary,
    isValidGameResult,
    
    // 调试工具
    debugGameState
  }
}