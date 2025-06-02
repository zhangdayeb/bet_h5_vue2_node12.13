// src/views/bjlLh/composables/useGameState.js
// 精简版游戏状态管理 - 只保留闪烁+音频+倒计时

import { ref } from 'vue'

/**
 * 精简版游戏状态管理
 */
export function useGameState() {
  // 桌台运行信息
  const tableRunInfo = ref({})
  const bureauNumber = ref('')

  // 闪烁控制
  const flashingAreas = ref([])
  const flashTimer = ref(null)
  const currentGameFlashed = ref(false)

  // 音频管理器
  const audioManager = ref(null)

  // ================================
  // 音频管理器注入
  // ================================
  const setAudioManager = (audio) => {
    audioManager.value = audio
    console.log('🎵 音频管理器已注入')
  }

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
  // 倒计时功能
  // ================================
  const formatCountdownTime = (seconds) => {
    if (seconds <= 0) return '00:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getGameStatusText = (status) => {
    const statusMap = {
      1: '🟢 下注中',
      2: '🔴 停止下注', 
      3: '🟡 开牌中'
    }
    return statusMap[status] || '⚪ 未知状态'
  }

  const displayCountdownToConsole = (endTime, status, bureau) => {
    const currentTime = endTime || 0
    const formattedTime = formatCountdownTime(currentTime)
    const statusText = getGameStatusText(status)
    const bureauText = bureau || '未知'
    
    if (currentTime > 0) {
      console.log(`⏰ 投注倒计时: ${formattedTime} | 状态: ${statusText} | 局号: ${bureauText}`)
      
      if (currentTime === 29) {
        safePlayAudio(audioManager.value?.playStartBetSound)
      } else if (currentTime === 1) {
        setTimeout(() => {
          safePlayAudio(audioManager.value?.playStopBetSound)
        }, 1000)
      }
    } else {
      console.log(`⏹️ 投注已停止 | 状态: ${statusText} | 局号: ${bureauText}`)
    }
  }

  // ================================
  // 闪烁功能 - 修复版
  // ================================
  const setFlashEffect = (flashIds = [], betTargetList = []) => {
    // 检查是否当前局已经闪烁过
    if (currentGameFlashed.value) {
      console.log('⚠️ 当前局已经闪烁过，跳过')
      return false
    }

    // 先清除之前的闪烁
    clearFlashEffect(betTargetList)

    if (!flashIds || flashIds.length === 0) {
      console.log('📝 无闪烁区域')
      return false
    }

    console.log('✨ 设置闪烁效果:', flashIds)

    // 标记当前局已闪烁
    currentGameFlashed.value = true
    flashingAreas.value = [...flashIds]

    // 设置闪烁样式
    if (betTargetList && betTargetList.length > 0) {
      betTargetList.forEach(item => {
        if (flashIds.includes(item.id)) {
          item.flashClass = 'bet-win-green-bg'
          console.log('🎯 设置闪烁:', item.label, item.id)
        }
      })
    }

    // 5秒后自动清除 - 强制清除
    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }
    
    flashTimer.value = setTimeout(() => {
      console.log('⏰ 5秒到了，开始清除闪烁')
      clearFlashEffect(betTargetList)
    }, 5000)

    return true
  }

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

    // 清空记录
    flashingAreas.value = []
  }

  // ================================
  // 桌台信息处理
  // ================================
  const handleTableInfo = (tableInfo) => {
    if (!tableInfo || !tableInfo.table_run_info) {
      return null
    }

    const newTableInfo = tableInfo.table_run_info
    const isNewRound = bureauNumber.value !== newTableInfo.bureau_number
    
    if (isNewRound) {
      console.log('🆕 新的一局开始:', newTableInfo.bureau_number)
      bureauNumber.value = newTableInfo.bureau_number
      
      // 新局重置闪烁状态
      currentGameFlashed.value = false
      if (flashTimer.value) {
        clearTimeout(flashTimer.value)
        flashTimer.value = null
      }
      flashingAreas.value = []
    }

    const oldEndTime = tableRunInfo.value.end_time || -1
    const newEndTime = newTableInfo.end_time || 0
    tableRunInfo.value = { ...newTableInfo }

    if (oldEndTime !== newEndTime) {
      displayCountdownToConsole(newEndTime, newTableInfo.run_status, bureauNumber.value)
    }

    return {
      type: isNewRound ? 'new_round' : 'table_update',
      tableInfo: newTableInfo,
      bureauNumber: bureauNumber.value
    }
  }

  // ================================
  // 开牌结果处理
  // ================================
  const handleGameResult = (gameResult, betTargetList = [], gameType = null) => {
    if (!gameResult || !gameResult.data || !gameResult.data.result_info) {
      console.warn('⚠️ 开牌结果数据无效')
      return null
    }

    const resultData = gameResult.data.result_info
    const flashIds = resultData.pai_flash || []
    const bureauNumber = gameResult.data.bureau_number

    console.log('🎯 收到开牌结果:', {
      bureauNumber,
      flashIds,
      currentGameFlashed: currentGameFlashed.value
    })

    // 检查是否已处理
    if (currentGameFlashed.value) {
      console.log('⚠️ 当前局已经处理过开牌结果')
      return {
        type: 'game_result',
        processed: false,
        reason: 'already_processed'
      }
    }

    // 播放音效
    if (audioManager.value) {
      console.log('🎵 播放开牌音效')
      safePlayAudio(audioManager.value.playOpenCardSequence, resultData, gameType, bureauNumber)
    }

    // 设置闪烁
    if (flashIds.length > 0) {
      setFlashEffect(flashIds, betTargetList)
    }

    return {
      type: 'game_result',
      resultInfo: resultData,
      bureauNumber,
      flashIds,
      processed: true
    }
  }

  // ================================
  // 消息处理主入口
  // ================================
  const processGameMessage = (messageResult, betTargetList = [], gameType = null) => {
    if (!messageResult || (typeof messageResult === 'string' && !messageResult.trim())) {
      return { type: 'empty_message' }
    }

    // 桌台信息更新
    if (messageResult.data && messageResult.data.table_run_info) {
      return handleTableInfo(messageResult)
    }

    // 开牌结果
    if (messageResult.data && messageResult.data.result_info) {
      return handleGameResult(messageResult, betTargetList, gameType)
    }

    return { type: 'other_message', data: messageResult }
  }

  // ================================
  // 调试方法
  // ================================
  const debugInfo = () => {
    console.group('=== 精简版游戏状态调试信息 ===')
    console.log('当前局号:', bureauNumber.value)
    console.log('闪烁区域:', flashingAreas.value)
    console.log('当前局已闪烁:', currentGameFlashed.value)
    console.log('定时器状态:', flashTimer.value ? '活动' : '空闲')
    console.log('桌台信息:', tableRunInfo.value)
    console.groupEnd()
  }

  return {
    // 响应式数据
    tableRunInfo,
    bureauNumber,
    flashingAreas,
    audioManager,
    
    // 核心功能
    setAudioManager,
    processGameMessage,
    
    // 直接导出的方法（用于手动调用）
    setFlashEffect,
    clearFlashEffect,
    
    // 调试
    debugInfo
  }
}