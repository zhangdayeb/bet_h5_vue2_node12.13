// src/views/bjlLh/composables/useAudio.js
// 独立音频管理 - 使用修复后的AudioHandle - 完整实现（包含中奖音效）

import { ref } from 'vue'
import AudioHandle from '@/common/audioHandle.js'
import userService from '@/service/userService.js'

/**
 * 独立音频管理
 */
export function useAudio() {
  // 音频处理实例
  const audioHandle = ref(new AudioHandle())
  
  // 音频状态
  const backgroundMusicState = ref('on')   // 背景音乐状态
  const musicEffectState = ref('on')       // 音效状态
  const audioInitialized = ref(false)     // 音频是否已初始化
  const userSettingsLoaded = ref(false)   // 用户设置是否已加载

  // ================================
  // 功能1: 自动读取用户音效配置
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

      // 🔧 方案A: 如果API返回audio_settings对象
      if (userInfo.beijing_open !== undefined || 
               userInfo.yixiao_open !== undefined) {
        
        backgroundMusicState.value = userInfo.beijing_open ? 'on' : 'off'
        musicEffectState.value = userInfo.yixiao_open ? 'on' : 'off'
        
        console.log('🎵 从单独字段加载:', {
          backgroundMusic: backgroundMusicState.value,
          soundEffect: musicEffectState.value
        })
      }
      // 🔧 方案C: API中没有音频设置，使用默认值
      else {
        console.log('🎵 API中无音频设置，使用默认配置')
        setDefaultAudioSettings()
      }

      // 应用设置到AudioHandle
      audioHandle.value.setBackgroundMusicState(backgroundMusicState.value)
      audioHandle.value.setMusicEffectSate(musicEffectState.value)
      
      userSettingsLoaded.value = true
      console.log('✅ 用户音效配置加载完成')

    } catch (error) {
      console.error('❌ 加载用户音效配置失败:', error)
      setDefaultAudioSettings()
    }
  }

  /**
   * 设置默认音效配置
   */
  const setDefaultAudioSettings = () => {
    console.log('🎵 设置默认音效配置')
    
    backgroundMusicState.value = 'on'
    musicEffectState.value = 'on'
    
    audioHandle.value.setBackgroundMusicState('on')
    audioHandle.value.setMusicEffectSate('on')
    
    userSettingsLoaded.value = true
  }

  // ================================
  // 功能2: WebSocket 远程控制
  // ================================

  /**
   * 处理 WebSocket 远程音频控制
   * @param {Object} audioMessage - 音频控制消息
   * @returns {boolean} 是否有状态变化
   */
  const handleRemoteAudioControl = (audioMessage) => {
    console.log('🎵 [远程控制] 收到音频指令:', audioMessage)
    
    if (!audioMessage || !audioMessage.msg) {
      console.warn('⚠️ 远程音频消息格式无效')
      return false
    }

    const { msg } = audioMessage
    let hasChanges = false

    // 处理背景音乐远程控制
    if (msg.backgroundMusicState && backgroundMusicState.value !== msg.backgroundMusicState) {
      console.log(`🎵 [远程] 背景音乐: ${backgroundMusicState.value} → ${msg.backgroundMusicState}`)
      
      backgroundMusicState.value = msg.backgroundMusicState
      audioHandle.value.setBackgroundMusicState(msg.backgroundMusicState)
      
      // 立即执行音乐控制
      if (msg.backgroundMusicState === 'on') {
        startBackgroundMusic()
      } else {
        stopBackgroundMusic()
      }
      
      hasChanges = true
    }

    // 处理音效远程控制
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

  /**
   * 检查是否为远程音频控制消息
   * @param {Object} message - WebSocket消息
   * @returns {boolean} 是否为音频控制消息
   */
  const isRemoteAudioMessage = (message) => {
    return message && message.code === 205 // msgCode.code.audioState
  }

  // ================================
  // 初始化方法（整合版）
  // ================================

  /**
   * 完整的音频初始化
   * @param {string} audioPath - 音频路径（bjl/longhu）
   */
  const initAudio = async (audioPath) => {
    try {
      console.log('🎵 开始音频系统完整初始化...')

      if (!audioPath) {
        console.warn('⚠️ 音频路径未设置')
        return false
      }

      // 1. 设置音频路径
      audioHandle.value.audioPath = audioPath
      console.log('🎵 音频路径设置:', audioPath)

      // 2. 自动加载用户音效配置
      await loadUserAudioSettings()

      // 3. 标记初始化完成
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
      
      // 初始化失败时使用默认设置
      setDefaultAudioSettings()
      audioInitialized.value = true
      
      return false
    }
  }

  // ================================
  // 音频播放方法
  // ================================

  /**
   * 通用音效播放函数
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

    console.log('🔊 播放音效:', soundName)
    return audioHandle.value.startSoundEffect(soundName)
  }

  // 预定义音效函数
  const playBetSound = () => playSoundEffect('betSound.mp3')
  const playBetSuccessSound = () => playSoundEffect('betsuccess.mp3')
  const playCancelSound = () => playSoundEffect('cancel.wav')
  const playTipSound = () => playSoundEffect('tip.wav')
  const playErrorSound = () => playSoundEffect('error.wav')
  const playStopBetSound = () => playSoundEffect('stop.wav')
  const playStartBetSound = () => playSoundEffect('bet.wav')
  const playOpenCardSound = () => playSoundEffect('OPENCARD.mp3')
  const playWelcomeSound = () => playSoundEffect('welcome.wav')

  // 🆕 新增中奖相关音效 NEW: Winning related sound effects
  const playWinningSound = () => playSoundEffect('win.wav')           // 中奖音效
  const playBigWinSound = () => playSoundEffect('bigwin.wav')         // 大奖音效
  const playCoinSound = () => playSoundEffect('coin.wav')             // 金币音效
  const playCelebrationSound = () => playSoundEffect('celebration.wav') // 庆祝音效
  const playJackpotSound = () => playSoundEffect('jackpot.wav')        // 累积奖音效

  /**
   * 🆕 根据中奖金额播放不同的音效
   * Play different sound effects based on winning amount
   * @param {number} amount - 中奖金额 Winning amount
   */
  const playWinSoundByAmount = (amount) => {
    console.log('🎵 根据金额播放中奖音效 Play win sound by amount:', amount)
    
    if (amount >= 50000) {
      // 超级大奖音效 (金额 >= 50000)
      playJackpotSound()
      setTimeout(() => playCelebrationSound(), 800) // 延迟播放庆祝音效
      setTimeout(() => playCoinSound(), 1500) // 再延迟播放金币音效
    } else if (amount >= 10000) {
      // 大奖音效 (金额 >= 10000)
      playBigWinSound()
      setTimeout(() => playCelebrationSound(), 500) // 延迟播放庆祝音效
    } else if (amount >= 1000) {
      // 中等奖音效 (金额 >= 1000)
      playWinningSound()
      setTimeout(() => playCoinSound(), 300) // 延迟播放金币音效
    } else if (amount > 0) {
      // 小奖音效 (金额 > 0)
      playCoinSound()
    }
  }

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
   * 播放开牌音效序列
   */
  const playOpenCardSequence = (resultInfo, gameType, bureauNumber) => {
    console.log('🎵 播放开牌音效序列')
    playOpenCardSound()
    
    setTimeout(() => {
      if (resultInfo.result && resultInfo.result.win) {
        playResultSound(resultInfo.result.win, gameType)
      }
    }, 1000)
  }

  // ================================
  // 背景音乐控制
  // ================================

  /**
   * 启动背景音乐
   */
  const startBackgroundMusic = () => {
    if (!audioInitialized.value) {
      console.warn('⚠️ 音频系统未初始化，无法播放背景音乐')
      return false
    }
    console.log('🎵 启动背景音乐')
    audioHandle.value.startSoundBackground()
    return true
  }

  /**
   * 停止背景音乐
   */
  const stopBackgroundMusic = () => {
    console.log('🎵 停止背景音乐')
    audioHandle.value.closeSoundBackground()
  }

  /**
   * 停止音效
   */
  const stopSoundEffect = () => {
    console.log('🔊 停止音效')
    audioHandle.value.closeSoundEffect()
  }

  /**
   * 播放欢迎音频和背景音乐
   */
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
  // 音频设置控制
  // ================================

  /**
   * 设置背景音乐状态
   * @param {string} state - 音乐状态（'on'/'off'）
   */
  const setBackgroundMusicState = (state) => {
    backgroundMusicState.value = state
    audioHandle.value.setBackgroundMusicState(state)
    console.log('🎵 设置背景音乐状态:', state)
  }

  /**
   * 设置音效状态
   * @param {string} state - 音效状态（'on'/'off'）
   */
  const setMusicEffectState = (state) => {
    musicEffectState.value = state
    audioHandle.value.setMusicEffectSate(state)
    console.log('🔊 设置音效状态:', state)
  }

  /**
   * 切换背景音乐状态
   */
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

  /**
   * 切换音效状态
   */
  const toggleSoundEffect = () => {
    const newState = musicEffectState.value === 'on' ? 'off' : 'on'
    setMusicEffectState(newState)
    return newState
  }

  // ================================
  // 音频查询和工具函数
  // ================================

  /**
   * 获取当前音频状态
   */
  const getAudioStatus = () => {
    return {
      initialized: audioInitialized.value,
      userSettingsLoaded: userSettingsLoaded.value,
      audioPath: audioHandle.value.audioPath,
      backgroundMusic: backgroundMusicState.value,
      soundEffect: musicEffectState.value,
      audioHandle: {
        backgroundMusicState: audioHandle.value.backgroundMusicState,
        musicEffectSate: audioHandle.value.musicEffectSate
      }
    }
  }

  /**
   * 检查音频是否可用
   */
  const isAudioAvailable = () => {
    return audioInitialized.value && audioHandle.value
  }

  /**
   * 静音所有音频
   */
  const muteAll = () => {
    console.log('🔇 静音所有音频')
    stopBackgroundMusic()
    stopSoundEffect()
  }

  /**
   * 恢复所有音频
   */
  const unmuteAll = () => {
    console.log('🔊 恢复所有音频')
    if (backgroundMusicState.value === 'on') {
      startBackgroundMusic()
    }
  }

  /**
   * 重新加载用户音效设置
   */
  const reloadUserSettings = async () => {
    console.log('🔄 重新加载用户音效设置')
    userSettingsLoaded.value = false
    await loadUserAudioSettings()
  }

  /**
   * 获取支持的音频格式
   */
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
  // 组合音效序列
  // ================================

  /**
   * 播放特定的游戏音效序列
   * @param {string} sequence - 音效序列名称
   * @param {Object} params - 参数
   */
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
        playOpenCardSequence(params.resultInfo, params.gameType, params.bureauNumber)
        break
        
      case 'welcome_sequence':
        playWelcomeAudio()
        break
        
      // 🆕 新增中奖序列 NEW: Winning sequences
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
        playWinSoundByAmount(params.amount || 0)
        break
        
      default:
        console.warn('⚠️ 未知的音效序列:', sequence)
    }
  }

  // ================================
  // 调试和维护功能
  // ================================

  /**
   * 调试音频信息
   */
  const debugAudioInfo = () => {
    console.group('=== 独立音频管理调试信息 ===')
    console.log('完整状态:', getAudioStatus())
    console.log('用户设置已加载:', userSettingsLoaded.value)
    console.log('支持的格式:', getSupportedFormats())
    console.log('AudioHandle实例:', audioHandle.value)
    console.groupEnd()
  }

  /**
   * 重置音频系统
   */
  const resetAudio = () => {
    console.log('🔄 重置音频系统')
    
    muteAll()
    backgroundMusicState.value = 'on'
    musicEffectState.value = 'on'
    audioInitialized.value = false
    userSettingsLoaded.value = false
    
    // 重新创建 AudioHandle 实例
    audioHandle.value = new AudioHandle()
  }

  /**
   * 资源清理
   */
  const cleanup = () => {
    console.log('🧹 清理音频资源')
    muteAll()
    resetAudio()
  }

  /**
   * 测试所有音效（开发环境用）
   */
  const testAllSounds = () => {
    console.log('🎵 测试所有音效')
    const sounds = [
      'playBetSound',
      'playBetSuccessSound', 
      'playCancelSound',
      'playTipSound',
      'playErrorSound',
      'playOpenCardSound',
      'playWelcomeSound',
      // 🆕 测试中奖音效
      'playWinningSound',
      'playBigWinSound',
      'playCoinSound',
      'playCelebrationSound',
      'playJackpotSound'
    ]
    
    sounds.forEach((soundName, index) => {
      setTimeout(() => {
        console.log('🔊 测试:', soundName)
        eval(soundName + '()')
      }, index * 1000)
    })
  }

  /**
   * 🆕 测试中奖音效按金额
   * Test winning sounds by amount
   */
  const testWinningSoundsByAmount = () => {
    console.log('🎵 测试不同金额的中奖音效')
    const amounts = [100, 1500, 12000, 55000]
    
    amounts.forEach((amount, index) => {
      setTimeout(() => {
        console.log(`🔊 测试金额 ${amount} 的中奖音效`)
        playWinSoundByAmount(amount)
      }, index * 4000) // 每4秒测试一个
    })
  }

  return {
    // 响应式数据
    audioHandle,
    backgroundMusicState,
    musicEffectState,
    audioInitialized,
    userSettingsLoaded,
    
    // 🆕 核心功能：独立初始化（包含用户设置加载）
    initAudio,
    loadUserAudioSettings,
    reloadUserSettings,
    setDefaultAudioSettings,
    
    // 🆕 核心功能：WebSocket远程控制
    handleRemoteAudioControl,
    isRemoteAudioMessage,
    
    // 音频状态处理
    setBackgroundMusicState,
    setMusicEffectState,
    
    // 通用音效播放
    playSoundEffect,
    
    // 预定义音效
    playBetSound,
    playBetSuccessSound,
    playCancelSound,
    playTipSound,
    playErrorSound,
    playStopBetSound,
    playStartBetSound,
    playOpenCardSound,
    playWelcomeSound,
    
    // 🆕 中奖音效 NEW: Winning sound effects
    playWinningSound,
    playBigWinSound,
    playCoinSound,
    playCelebrationSound,
    playJackpotSound,
    playWinSoundByAmount,
    
    // 游戏结果音效
    playResultSound,
    playOpenCardSequence,
    
    // 背景音乐控制
    startBackgroundMusic,
    stopBackgroundMusic,
    stopSoundEffect,
    playWelcomeAudio,
    
    // 音频设置控制
    toggleBackgroundMusic,
    toggleSoundEffect,
    
    // 查询方法
    getAudioStatus,
    isAudioAvailable,
    getSupportedFormats,
    
    // 音频控制
    muteAll,
    unmuteAll,
    
    // 组合音效
    playGameSequence,
    
    // 工具方法
    resetAudio,
    cleanup,
    debugAudioInfo,
    testAllSounds,
    testWinningSoundsByAmount // 🆕 新增测试方法
  }
}