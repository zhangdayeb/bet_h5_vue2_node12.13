// src/views/bjlLh/composables/useAudio.js - 终极修复版本
// 彻底解决中奖音效冲突问题

import { ref } from 'vue'
import AudioHandle from '@/common/audioHandle.js'
import userService from '@/service/userService.js'

/**
 * 终极修复版音频管理 - 彻底解决中奖音效冲突
 */
export function useAudio() {
  // 音频处理实例
  const audioHandle = ref(new AudioHandle())
  
  // 音频状态
  const backgroundMusicState = ref('on')
  const musicEffectState = ref('on')
  const audioInitialized = ref(false)
  const userSettingsLoaded = ref(false)

  // ================================
  // 🔧 关键修复：中奖音效专用方法（高优先级）
  // ================================

  /**
   * 🔧 播放中奖音效（不会被打断）
   * @param {string} soundName - 音效文件名
   * @returns {boolean} 是否成功播放
   */
  const playWinningSound = (soundName = 'betsuccess.mp3') => {
    if (!audioInitialized.value) {
      console.warn('⚠️ 音频系统未初始化，无法播放中奖音效')
      return false
    }

    console.log('🎉 播放专用中奖音效（高优先级）:', soundName)
    return audioHandle.value.playWinningSound(soundName)
  }

  /**
   * 🔧 根据中奖金额播放不同的音效序列（不会被打断）
   * @param {number} amount - 中奖金额
   */
  const playWinSoundByAmount = (amount) => {
    if (!audioInitialized.value) {
      console.warn('⚠️ 音频系统未初始化，无法播放中奖音效序列')
      return false
    }

    console.log('🎵 播放中奖音效序列，金额:', amount)
    return audioHandle.value.playWinSoundByAmount(amount)
  }

  // ================================
  // 🔧 修复：普通音效方法（会被中奖音效打断）
  // ================================

  /**
   * 通用音效播放函数（可能被中奖音效打断）
   * @param {string} soundName - 音效文件名
   */
  const playSoundEffect = (soundName) => {
    if (!audioInitialized.value) {
      console.warn('⚠️ 音频系统未初始化，无法播放音效:', soundName)
      return false
    }

    if (!soundName) {
      console.warn('⚠️ 音效文件名为空')
      return false
    }

    console.log('🔊 播放普通音效（可被中奖音效打断）:', soundName)
    return audioHandle.value.startSoundEffect(soundName)
  }

  // ================================
  // 预定义音效函数（保持兼容性）
  // ================================

  const playBetSound = () => playSoundEffect('betSound.mp3')
  const playBetSuccessSound = () => playSoundEffect('betsuccess.mp3')
  const playCancelSound = () => playSoundEffect('cancel.wav')
  const playTipSound = () => playSoundEffect('tip.wav')
  const playErrorSound = () => playSoundEffect('error.wav')
  const playStopBetSound = () => playSoundEffect('stop.wav')
  const playStartBetSound = () => playSoundEffect('bet.wav')
  const playOpenCardSound = () => playSoundEffect('OPENCARD.mp3')
  const playWelcomeSound = () => playSoundEffect('welcome.wav')

  // 🔧 中奖相关音效（高优先级，不会被打断）
  const playBigWinSound = () => playWinningSound('bigwin.wav')
  const playCoinSound = () => playWinningSound('coin.wav')
  const playCelebrationSound = () => playWinningSound('celebration.wav')
  const playJackpotSound = () => playWinningSound('jackpot.wav')

  // ================================
  // 🔧 关键修复：游戏音效序列处理
  // ================================

  /**
   * 播放结果音效
   * @param {number} result - 游戏结果
   * @param {number} gameType - 游戏类型
   */
  const playResultSound = (result, gameType) => {
    let soundFile = ''
    switch (result) {
      case 1: // 庄赢/龙赢
        soundFile = gameType == 3 ? 'bankerWin.wav' : 'dragonWin.wav'
        break
      case 2: // 闲赢/虎赢  
        soundFile = gameType == 3 ? 'playerWin.wav' : 'tigerWin.wav'
        break
      case 3: // 和牌
        soundFile = 'tie.wav'
        break
      default:
        console.warn('⚠️ 未知的游戏结果:', result)
        return false
    }
    return playSoundEffect(soundFile)
  }

  /**
   * 🔧 关键修复：播放开牌音效序列（彻底避免与中奖音效冲突）
   */
  const playOpenCardSequence = (resultInfo, gameType, bureauNumber) => {
    console.log('🎵 播放开牌音效序列')
    
    // 🔧 关键修复：先播放开牌音效
    playOpenCardSound()
    
    // 🔧 关键修复：检查是否有中奖金额
    const hasWinning = resultInfo && resultInfo.money && resultInfo.money > 0
    
    if (hasWinning) {
      console.log('🎉 检测到中奖金额，开牌音效序列将不播放结果音效')
      console.log('💰 中奖音效将由 useGameState 统一管理')
      
      // 🔧 关键修复：不再播放中奖音效，交给 useGameState 处理
      // 这里只播放开牌音效，不播放任何中奖相关音效
      
    } else {
      // 🔧 无中奖时延迟播放结果音效
      setTimeout(() => {
        if (resultInfo.result && resultInfo.result.win) {
          console.log('📝 无中奖，播放普通结果音效')
          playResultSound(resultInfo.result.win, gameType)
        }
      }, 1000)
    }
  }

  // ================================
  // 🔧 修复：音频状态管理和查询
  // ================================

  /**
   * 获取音频状态（包含中奖音效保护状态）
   */
  const getAudioStatus = () => {
    const baseStatus = {
      initialized: audioInitialized.value,
      userSettingsLoaded: userSettingsLoaded.value,
      audioPath: audioHandle.value.audioPath,
      backgroundMusic: backgroundMusicState.value,
      soundEffect: musicEffectState.value
    }

    // 🔧 添加中奖音效保护状态
    if (audioHandle.value.getAudioStatus) {
      const extendedStatus = audioHandle.value.getAudioStatus()
      return { ...baseStatus, ...extendedStatus }
    }

    return baseStatus
  }

  /**
   * 🔧 检查中奖音效是否受保护
   */
  const isWinningAudioProtected = () => {
    if (audioHandle.value.getAudioStatus) {
      return audioHandle.value.getAudioStatus().winningAudioProtected
    }
    return false
  }

  /**
   * 🔧 强制清除中奖音效保护（紧急情况使用）
   */
  const clearWinningProtection = () => {
    if (audioHandle.value.clearWinningProtection) {
      console.log('🚨 强制清除中奖音效保护期')
      audioHandle.value.clearWinningProtection()
    }
  }

  /**
   * 🔧 清空音效队列
   */
  const clearAudioQueue = () => {
    if (audioHandle.value.clearAudioQueue) {
      console.log('🧹 清空音效队列')
      audioHandle.value.clearAudioQueue()
    }
  }

  // ================================
  // 保持原有功能（用户设置加载等）
  // ================================

  /**
   * 自动加载用户音效配置
   */
  const loadUserAudioSettings = async () => {
    try {
      console.log('🎵 开始加载用户音效配置...')
      
      const userInfo = await userService.userIndex()
      
      if (!userInfo) {
        console.warn('⚠️ 获取用户信息失败，使用默认音效设置')
        setDefaultAudioSettings()
        return
      }

      console.log('👤 用户信息获取成功:', userInfo)

      if (userInfo.beijing_open !== undefined || 
               userInfo.yixiao_open !== undefined) {
        
        backgroundMusicState.value = userInfo.beijing_open ? 'on' : 'off'
        musicEffectState.value = userInfo.yixiao_open ? 'on' : 'off'
        
        console.log('🎵 从单独字段加载:', {
          backgroundMusic: backgroundMusicState.value,
          soundEffect: musicEffectState.value
        })
      } else {
        console.log('🎵 API中无音频设置，使用默认配置')
        setDefaultAudioSettings()
      }

      audioHandle.value.setBackgroundMusicState(backgroundMusicState.value)
      audioHandle.value.setMusicEffectSate(musicEffectState.value)
      
      userSettingsLoaded.value = true
      console.log('✅ 用户音效配置加载完成')

    } catch (error) {
      console.error('❌ 加载用户音效配置失败:', error)
      setDefaultAudioSettings()
    }
  }

  const setDefaultAudioSettings = () => {
    console.log('🎵 设置默认音效配置')
    
    backgroundMusicState.value = 'on'
    musicEffectState.value = 'on'
    
    audioHandle.value.setBackgroundMusicState('on')
    audioHandle.value.setMusicEffectSate('on')
    
    userSettingsLoaded.value = true
  }

  // ================================
  // WebSocket远程控制（保持不变）
  // ================================

  const handleRemoteAudioControl = (audioMessage) => {
    console.log('🎵 [远程控制] 收到音频指令:', audioMessage)
    
    if (!audioMessage || !audioMessage.msg) {
      console.warn('⚠️ 远程音频消息格式无效')
      return false
    }

    const { msg } = audioMessage
    let hasChanges = false

    if (msg.backgroundMusicState && backgroundMusicState.value !== msg.backgroundMusicState) {
      console.log(`🎵 [远程] 背景音乐: ${backgroundMusicState.value} → ${msg.backgroundMusicState}`)
      
      backgroundMusicState.value = msg.backgroundMusicState
      audioHandle.value.setBackgroundMusicState(msg.backgroundMusicState)
      
      if (msg.backgroundMusicState === 'on') {
        startBackgroundMusic()
      } else {
        stopBackgroundMusic()
      }
      
      hasChanges = true
    }

    if (msg.musicEffectSate && musicEffectState.value !== msg.musicEffectSate) {
      console.log(`🔊 [远程] 音效: ${musicEffectState.value} → ${msg.musicEffectSate}`)
      
      musicEffectState.value = msg.musicEffectSate
      audioHandle.value.setMusicEffectSate(msg.musicEffectSate)
      
      hasChanges = true
    }

    if (hasChanges) {
      console.log('✅ [远程控制] 音频状态已更新')
    }

    return hasChanges
  }

  const isRemoteAudioMessage = (message) => {
    return message && message.code === 205
  }

  // ================================
  // 初始化方法（保持不变）
  // ================================

  const initAudio = async (audioPath) => {
    try {
      console.log('🎵 开始音频系统完整初始化...')

      if (!audioPath) {
        console.warn('⚠️ 音频路径未设置')
        return false
      }

      audioHandle.value.audioPath = audioPath
      console.log('🎵 音频路径设置:', audioPath)

      await loadUserAudioSettings()

      audioInitialized.value = true

      console.log('✅ 音频系统初始化完成:', {
        audioPath,
        backgroundMusic: backgroundMusicState.value,
        soundEffect: musicEffectState.value,
        userSettingsLoaded: userSettingsLoaded.value
      })

      return true

    } catch (error) {
      console.error('❌ 音频系统初始化失败:', error)
      setDefaultAudioSettings()
      audioInitialized.value = true
      return false
    }
  }

  // ================================
  // 背景音乐控制（保持不变）
  // ================================

  const startBackgroundMusic = () => {
    if (!audioInitialized.value) {
      console.warn('⚠️ 音频系统未初始化，无法播放背景音乐')
      return false
    }
    console.log('🎵 启动背景音乐')
    audioHandle.value.startSoundBackground()
    return true
  }

  const stopBackgroundMusic = () => {
    console.log('🎵 停止背景音乐')
    audioHandle.value.closeSoundBackground()
  }

  const stopSoundEffect = () => {
    console.log('🔊 停止普通音效（不影响中奖音效）')
    audioHandle.value.closeSoundEffect()
  }

  const playWelcomeAudio = () => {
    if (!audioInitialized.value) {
      console.warn('⚠️ 音频系统未初始化')
      return
    }
    console.log('🎵 播放欢迎音频')
    playWelcomeSound()
    startBackgroundMusic()
  }

  // ================================
  // 设置控制（保持不变）
  // ================================

  const setBackgroundMusicState = (state) => {
    backgroundMusicState.value = state
    audioHandle.value.setBackgroundMusicState(state)
    console.log('🎵 设置背景音乐状态:', state)
  }

  const setMusicEffectState = (state) => {
    musicEffectState.value = state
    audioHandle.value.setMusicEffectSate(state)
    console.log('🔊 设置音效状态:', state)
  }

  const toggleBackgroundMusic = () => {
    const newState = backgroundMusicState.value === 'on' ? 'off' : 'on'
    setBackgroundMusicState(newState)
    
    if (newState === 'on') {
      startBackgroundMusic()
    } else {
      stopBackgroundMusic()
    }
    
    return newState
  }

  const toggleSoundEffect = () => {
    const newState = musicEffectState.value === 'on' ? 'off' : 'on'
    setMusicEffectState(newState)
    return newState
  }

  // ================================
  // 工具方法（保持不变）
  // ================================

  const isAudioAvailable = () => {
    return audioInitialized.value && audioHandle.value
  }

  const muteAll = () => {
    console.log('🔇 静音所有音频（包括中奖音效）')
    stopBackgroundMusic()
    stopSoundEffect()
    clearWinningProtection()
  }

  const unmuteAll = () => {
    console.log('🔊 恢复所有音频')
    if (backgroundMusicState.value === 'on') {
      startBackgroundMusic()
    }
  }

  const reloadUserSettings = async () => {
    console.log('🔄 重新加载用户音效设置')
    userSettingsLoaded.value = false
    await loadUserAudioSettings()
  }

  const getSupportedFormats = () => {
    const audio = new Audio()
    const formats = {
      mp3: !!audio.canPlayType('audio/mpeg'),
      wav: !!audio.canPlayType('audio/wav'),
      ogg: !!audio.canPlayType('audio/ogg'),
      aac: !!audio.canPlayType('audio/aac')
    }
    
    console.log('🎵 支持的音频格式:', formats)
    return formats
  }

  // ================================
  // 🔧 修复：组合音效序列
  // ================================

  const playGameSequence = (sequence, params = {}) => {
    switch (sequence) {
      case 'bet_placed':
        playBetSound()
        break
        
      case 'bet_success':
        playBetSuccessSound()
        break
        
      case 'bet_period_start':
        playStartBetSound()
        break
        
      case 'bet_period_end':
        setTimeout(() => {
          playStopBetSound()
        }, 1000)
        break
        
      case 'card_opening':
        // 🔧 关键修复：使用修复后的开牌音效序列
        playOpenCardSequence(params.resultInfo, params.gameType, params.bureauNumber)
        break
        
      case 'welcome_sequence':
        playWelcomeAudio()
        break
        
      // 🔧 中奖音效序列（高优先级）- 仅供外部直接调用
      case 'winning_small':
        playCoinSound()
        break
        
      case 'winning_medium':
        playWinningSound()
        setTimeout(() => playCoinSound(), 300)
        break
        
      case 'winning_big':
        playBigWinSound()
        setTimeout(() => playCelebrationSound(), 500)
        break
        
      case 'winning_jackpot':
        playJackpotSound()
        setTimeout(() => playCelebrationSound(), 800)
        setTimeout(() => playCoinSound(), 1500)
        break
        
      case 'winning_by_amount':
        // 🔧 关键修复：这个序列仅供 useGameState 调用
        console.log('🎵 执行中奖音效序列（仅限 useGameState 调用）')
        playWinSoundByAmount(params.amount || 0)
        break
        
      default:
        console.warn('⚠️ 未知的音效序列:', sequence)
    }
  }

  // ================================
  // 调试和维护（保持不变）
  // ================================

  const debugAudioInfo = () => {
    console.group('=== 修复版音频管理调试信息 ===')
    console.log('完整状态:', getAudioStatus())
    console.log('中奖音效保护状态:', isWinningAudioProtected())
    console.log('用户设置已加载:', userSettingsLoaded.value)
    console.log('支持的格式:', getSupportedFormats())
    console.log('AudioHandle实例:', audioHandle.value)
    console.groupEnd()
  }

  const resetAudio = () => {
    console.log('🔄 重置音频系统')
    
    muteAll()
    clearAudioQueue()
    backgroundMusicState.value = 'on'
    musicEffectState.value = 'on'
    audioInitialized.value = false
    userSettingsLoaded.value = false
    
    audioHandle.value = new AudioHandle()
  }

  const cleanup = () => {
    console.log('🧹 清理音频资源')
    muteAll()
    clearAudioQueue()
    resetAudio()
  }

  // 🔧 测试中奖音效
  const testWinningSoundsByAmount = () => {
    console.log('🎵 测试不同金额的中奖音效')
    const amounts = [100, 1500, 12000, 55000]
    
    amounts.forEach((amount, index) => {
      setTimeout(() => {
        console.log(`🔊 测试金额 ${amount} 的中奖音效`)
        playWinSoundByAmount(amount)
      }, index * 6000)
    })
  }

  return {
    // 响应式数据
    audioHandle,
    backgroundMusicState,
    musicEffectState,
    audioInitialized,
    userSettingsLoaded,
    
    // 核心功能
    initAudio,
    loadUserAudioSettings,
    reloadUserSettings,
    setDefaultAudioSettings,
    
    // WebSocket远程控制
    handleRemoteAudioControl,
    isRemoteAudioMessage,
    
    // 音频状态处理
    setBackgroundMusicState,
    setMusicEffectState,
    
    // 🔧 中奖音效（高优先级，不会被打断）
    playWinningSound,
    playWinSoundByAmount,
    playBigWinSound,
    playCoinSound,
    playCelebrationSound,
    playJackpotSound,
    
    // 普通音效（可能被中奖音效打断）
    playSoundEffect,
    playBetSound,
    playBetSuccessSound,
    playCancelSound,
    playTipSound,
    playErrorSound,
    playStopBetSound,
    playStartBetSound,
    playOpenCardSound,
    playWelcomeSound,
    
    // 🔧 修复：游戏结果音效
    playResultSound,
    playOpenCardSequence, // 🔧 已修复，不再包含中奖音效
    
    // 背景音乐控制
    startBackgroundMusic,
    stopBackgroundMusic,
    stopSoundEffect,
    playWelcomeAudio,
    
    // 音频设置控制
    toggleBackgroundMusic,
    toggleSoundEffect,
    
    // 🔧 状态查询和管理
    getAudioStatus,
    isAudioAvailable,
    getSupportedFormats,
    isWinningAudioProtected,
    clearWinningProtection,
    clearAudioQueue,
    
    // 音频控制
    muteAll,
    unmuteAll,
    
    // 🔧 修复：组合音效
    playGameSequence,
    
    // 工具方法
    resetAudio,
    cleanup,
    debugAudioInfo,
    testWinningSoundsByAmount
  }
}