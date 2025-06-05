// src/views/bjlLh/composables/useGameState.js
// 禁用清理功能版本 - 找出是谁在清理闪烁

import { ref } from 'vue'

/**
 * 禁用清理功能版本 - 调试闪烁被清除问题
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
    // 关键修复：检查是否已经播放过本局的中奖音效
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

    // 关键修复：根据金额播放不同的中奖音效
    let audioSuccess = false
    
    try {
      if (audioManager.value.playWinSoundByAmount) {
        // 使用专用的中奖音效序列（高优先级，不会被打断）
        audioSuccess = audioManager.value.playWinSoundByAmount(winAmount)
        console.log('🎵 中奖音效序列播放结果:', audioSuccess)
      } else if (audioManager.value.playWinningSound) {
        // 备用：使用单个中奖音效
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
   * 显示中奖弹窗（不再直接播放音效）
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

    // 关键修复：使用统一的中奖音效播放入口
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
    // 注意：不重置 winningAudioPlayed，保持防重复状态
  }

  /**
   * 播放中奖音效（供弹窗组件调用）
   */
  const playWinningSound = () => {
    console.log('🎵 弹窗组件请求播放中奖音效')
    
    // 关键修复：检查是否已经播放过
    if (winningAudioPlayed.value) {
      console.log('🔇 中奖音效已播放过，弹窗音效请求被忽略')
      return false
    }

    // 使用备用的单次中奖音效
    return safePlayAudio(audioManager.value?.playWinningSound, 'betsuccess.mp3')
  }

  // ================================
  // 🔧 关键修复：闪烁效果管理 - 禁用清理功能
  // ================================
  
  /**
   * 设置闪烁效果 - 完整调试版本 + 禁用定时器
   */
  const setFlashEffect = (flashIds = [], gameConfig = null) => {
    console.log('🔍 setFlashEffect 精准调试开始')
    
    // 🔍 详细解析 flashIds
    console.log('🔍 flashIds 详细分析:')
    console.log('  - flashIds 原始值:', flashIds)
    console.log('  - flashIds 类型:', typeof flashIds)
    console.log('  - flashIds 长度:', flashIds?.length)
    console.log('  - flashIds JSON:', JSON.stringify(flashIds))
    
    if (Array.isArray(flashIds)) {
      console.log('  - flashIds 是数组')
      flashIds.forEach((id, index) => {
        console.log(`    [${index}]: ${id} (类型: ${typeof id})`)
      })
    } else {
      console.log('  - flashIds 不是数组!')
    }

    if (!flashIds || flashIds.length === 0) {
      console.log('📝 无闪烁区域')
      return false
    }

    if (!gameConfig) {
      console.warn('⚠️ gameConfig未传入，无法设置闪烁')
      return false
    }

    console.log('✨ 设置闪烁效果:', flashIds, '当前局号:', bureauNumber.value)

    currentGameFlashed.value = true
    flashingAreas.value = [...flashIds]

    // 关键修复：根据游戏类型获取正确的响应式数组
    const targetList = gameConfig.gameType.value == 3 
      ? gameConfig.betTargetListBjl.value 
      : gameConfig.betTargetListLongHu.value

    console.log('🔍 目标列表调试:', {
      gameType: gameConfig.gameType.value,
      targetListExists: !!targetList,
      targetListLength: targetList?.length,
      targetListIds: targetList?.map(item => ({ id: item.id, label: item.label }))
    })

    if (targetList && targetList.length > 0) {
      console.log('📋 开始详细匹配检查:')
      
      let matchedCount = 0
      let processedCount = 0
      
      targetList.forEach((item, index) => {
        processedCount++
        
        // 🔍 详细检查每个匹配过程
        const includesResult = flashIds.includes(item.id)
        console.log(`🔍 区域 ${index} 匹配检查:`)
        console.log(`  - 区域ID: ${item.id} (类型: ${typeof item.id})`)
        console.log(`  - 区域标签: ${item.label}`)
        console.log(`  - flashIds.includes(${item.id}): ${includesResult}`)
        
        // 🔍 手动检查每个 flashIds 元素
        if (Array.isArray(flashIds)) {
          flashIds.forEach((flashId, flashIndex) => {
            const strictEqual = flashId === item.id
            const looseEqual = flashId == item.id
            console.log(`    flashIds[${flashIndex}](${flashId}) === ${item.id}: ${strictEqual}`)
            console.log(`    flashIds[${flashIndex}](${flashId}) == ${item.id}: ${looseEqual}`)
          })
        }
        
        if (includesResult) {
          matchedCount++
          console.log('✅ 匹配成功！设置闪烁')
          console.log('🎯 设置前 flashClass:', item.flashClass)
          
          // 关键修复：直接修改响应式对象的属性
          item.flashClass = 'bet-win-green-bg'
          
          console.log('🎯 设置后 flashClass:', item.flashClass)
          
          // 🔍 关键调试：监控 flashClass 是否被意外清除
          setTimeout(() => {
            console.log('🔍 500ms后验证:', item.label, 'flashClass:', item.flashClass)
            if (item.flashClass !== 'bet-win-green-bg') {
              console.error('❌ 闪烁被意外清除！500ms前设置的闪烁已丢失')
            }
          }, 500)
          
          setTimeout(() => {
            console.log('🔍 1秒后验证:', item.label, 'flashClass:', item.flashClass)
            if (item.flashClass !== 'bet-win-green-bg') {
              console.error('❌ 闪烁被意外清除！1秒前设置的闪烁已丢失')
            }
          }, 1000)
          
          setTimeout(() => {
            console.log('🔍 2秒后验证:', item.label, 'flashClass:', item.flashClass)
            if (item.flashClass !== 'bet-win-green-bg') {
              console.error('❌ 闪烁被意外清除！2秒前设置的闪烁已丢失')
            }
          }, 2000)
          
          setTimeout(() => {
            console.log('🔍 5秒后验证:', item.label, 'flashClass:', item.flashClass)
            if (item.flashClass !== 'bet-win-green-bg') {
              console.error('❌ 闪烁被意外清除！5秒前设置的闪烁已丢失')
            } else {
              console.log('✅ 5秒后闪烁仍然存在')
            }
          }, 5000)
          
        } else {
          console.log('❌ 不匹配，跳过')
        }
      })
      
      console.log('🔍 闪烁设置统计:', {
        总区域数: processedCount,
        匹配的区域数: matchedCount,
        期待闪烁的ID: flashIds,
        实际处理的区域: targetList.map(item => ({ 
          id: item.id, 
          label: item.label, 
          flashClass: item.flashClass 
        }))
      })
      
      if (matchedCount === 0) {
        console.error('❌ 没有任何区域匹配到闪烁ID！')
        console.error('❌ flashIds:', flashIds)
        console.error('❌ 可用的区域ID:', targetList.map(item => item.id))
      }
      
    } else {
      console.warn('⚠️ 目标列表为空或无效')
    }

    // 🚫 临时禁用定时器，防止自动清理
    console.log('🚫 定时器已禁用，闪烁将持续到手动清除')
    
    /*
    // 设置清理定时器 - 5秒后清除
    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
      console.log('🧹 清理之前的闪烁定时器')
    }
    
    console.log('⏰ 设置闪烁定时器：5秒后清除')
    
    flashTimer.value = setTimeout(() => {
      console.log('⏰ 5秒到了，开始清除闪烁和投注区域')
      clearFlashAndBets(gameConfig)
    }, 5000)  // 5秒定时器
    */

    return true
  }

  /**
   * 🚫 临时禁用：专门的定时清理函数
   */
  const clearFlashAndBets = (gameConfig = null) => {
    console.log('🚫 clearFlashAndBets 被调用但已禁用')
    console.log('🚫 调用时间:', new Date().toLocaleTimeString())
    console.log('🚫 调用堆栈:', new Error().stack)
    
    // 🚫 暂时注释掉所有清理逻辑，防止干扰
    /*
    if (!gameConfig) {
      console.warn('⚠️ gameConfig未传入清除函数')
      return
    }

    // 标记本局已清理
    if (currentRoundProcessed.value.bureauNumber === bureauNumber.value) {
      currentRoundProcessed.value.cleared = true
      console.log('📝 标记本局已清理')
    }

    // 执行清理
    const targetList = gameConfig.gameType.value == 3 
      ? gameConfig.betTargetListBjl.value 
      : gameConfig.betTargetListLongHu.value

    if (targetList && targetList.length > 0) {
      let clearedFlashCount = 0
      let clearedBetCount = 0
      let totalClearedAmount = 0

      targetList.forEach((item) => {
        // 清除闪烁效果
        if (flashingAreas.value.includes(item.id) && item.flashClass) {
          item.flashClass = ''
          clearedFlashCount++
          console.log('🧹 清除闪烁:', item.label, item.id)
        }

        // 清除投注区域筹码显示
        if (item.betAmount > 0 || item.showChip.length > 0) {
          totalClearedAmount += item.betAmount || 0
          clearedBetCount++
          
          item.betAmount = 0
          item.showChip = []
          
          console.log('💰 清除投注:', item.label, item.id)
        }
      })

      console.log('✅ 定时清理完成:', {
        clearedFlash: clearedFlashCount,
        clearedBets: clearedBetCount,
        totalClearedAmount,
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
    */
    
    return false // 禁用状态返回false
  }

  /**
   * 🚫 临时禁用：清除闪烁效果
   */
  const clearFlashEffect = (gameConfig = null) => {
    console.log('🚫 clearFlashEffect 被调用但已禁用')
    console.log('🚫 调用时间:', new Date().toLocaleTimeString())
    console.log('🚫 调用堆栈:', new Error().stack)
    
    // 🚫 暂时禁用
    // clearFlashAndBets(gameConfig)
    return false
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

    tableRunInfo.value = newTableInfo

    return {
      type: 'table_update',
      bureauNumber: bureauNumber.value
    }
  }

  // ================================
  // 开牌结果处理 - 使用 gameConfig 参数
  // ================================
  
  /**
   * 处理开牌结果 - 多消息协调处理
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
      winningAmount,
      messageSequence: Date.now() % 10000, // 简单的消息序号
      currentProcessed: currentRoundProcessed.value
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

    // 关键修正：只在第一次收到本局消息时设置闪烁
    if (!currentRoundProcessed.value.flashSet && flashIds.length > 0) {
      console.log('✨ 第一次处理本局，设置闪烁效果')
      setFlashEffect(flashIds, gameConfig)
      currentRoundProcessed.value.flashSet = true
    } else if (currentRoundProcessed.value.flashSet && flashIds.length > 0) {
      console.log('⚠️ 本局闪烁已设置，跳过重复设置')
    }

    // 关键修正：每次都检查中奖信息（因为不知道哪次消息包含）
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
    // 这个方法现在主要用于兼容性，实际处理在 handleGameResult 中
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
  // 消息处理主入口 - 使用 gameConfig 参数
  // ================================
  
  /**
   * 处理游戏消息的主入口函数 - 多消息协调处理
   */
  const processGameMessage = (messageResult, gameConfig = null, gameType = null) => {
    if (!messageResult || (typeof messageResult === 'string' && !messageResult.trim())) {
      return { type: 'empty_message' }
    }

    // 桌台信息更新消息
    if (messageResult.data && messageResult.data.table_run_info) {
      return handleTableInfo(messageResult)
    }

    // 开牌结果消息 - 统一在 handleGameResult 中处理闪烁和中奖
    if (messageResult.data && messageResult.data.result_info) {    
      console.log('📨 处理开牌结果消息，时间戳:', Date.now() % 100000)
      
      // 关键修正：在 handleGameResult 中统一处理闪烁和中奖
      const gameResultInfo = handleGameResult(messageResult, gameConfig, gameType)
      
      // 保留 handleMoneyShow 调用以确保兼容性，但实际处理已在上面完成
      handleMoneyShow(messageResult)
      
      return gameResultInfo
    }

    return { type: 'other_message', data: messageResult }
  }

  // ================================
  // 资源清理方法 - 大部分禁用
  // ================================
  
  /**
   * 🚫 部分禁用：清理所有资源
   */
  const cleanup = () => {
    console.log('🧹 清理游戏状态资源（部分禁用）')
    
    if (flashTimer.value) {
      clearTimeout(flashTimer.value)
      flashTimer.value = null
    }
    
    closeWinningDisplay()
    
    // 🚫 不重置闪烁相关状态，保持闪烁效果
    /*
    currentGameFlashed.value = false
    flashingAreas.value = []
    */
    
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
  }

  /**
   * 🚫 部分禁用：新局重置
   */
  const resetForNewRound = () => {
    console.log('🆕 新局重置游戏状态（部分禁用）')
    
    // 🚫 不重置闪烁状态，保持闪烁效果
    /*
    currentGameFlashed.value = false
    flashingAreas.value = []
    */
    
    winningAudioPlayed.value = false // 重置中奖音效状态
    
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
  // 🆕 新增：手动清理方法（用于测试）
  // ================================

  /**
   * 🆕 手动清理闪烁（仅用于测试）
   */
  const manualClearFlash = (gameConfig = null) => {
    console.log('🧪 手动清理闪烁（测试用）')
    
    if (!gameConfig) {
      console.warn('⚠️ gameConfig未传入手动清理')
      return false
    }

    const targetList = gameConfig.gameType.value == 3 
      ? gameConfig.betTargetListBjl.value 
      : gameConfig.betTargetListLongHu.value

    if (targetList && targetList.length > 0) {
      targetList.forEach((item) => {
        if (item.flashClass === 'bet-win-green-bg') {
          console.log('🧪 手动清理:', item.label, item.id)
          item.flashClass = ''
        }
      })
    }

    flashingAreas.value = []
    return true
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
    currentGameFlashed,  // 暴露闪烁状态用于调试
    audioManager,
    
    // 中奖弹窗相关数据
    showWinningPopup,
    winningAmount,
    winningAudioPlayed, // 音效播放状态
    
    // 多消息处理状态
    currentRoundProcessed,
    
    // 核心功能方法
    setAudioManager,
    processGameMessage,
    
    // 中奖管理方法
    showWinningDisplay,
    closeWinningDisplay,
    playWinningSound,
    playWinningAudioSafely, // 安全播放中奖音效
    
    // 🚫 禁用的闪烁管理方法
    setFlashEffect,
    clearFlashEffect,      // 已禁用
    clearFlashAndBets,     // 已禁用
    
    // 🆕 新增手动清理方法
    manualClearFlash,
    
    // 🚫 部分禁用的工具方法
    resetForNewRound,
    cleanup,
    debugWinningAudioState // 调试方法
  }
}