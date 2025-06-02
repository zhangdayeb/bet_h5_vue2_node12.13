// src/views/bjlLh/composables/useAudio.js
// 音频管理 - 音效播放、背景音乐、音频状态处理

import { ref } from 'vue'
import AudioHandle from '@/common/audioHandle.js'

/**
 * 音频管理
 */
export function useAudio() {
  // 音频处理实例
  const audioHandle = ref(new AudioHandle())
  
  // 音频状态
  const backgroundMusicState = ref('off') // 背景音乐状态
  const musicEffectState = ref('off')     // 音效状态
  const audioInitialized = ref(false)    // 音频是否已初始化

  /**
   * 初始化音频系统
   * @param {string} audioPath - 音频路径（bjl/longhu）
   */
  const initAudio = (audioPath) => {
    if (!audioPath) {
      console.warn('⚠️ 音频路径未设置')
      return
    }

    audioHandle.value.audioPath = audioPath
    console.log('🎵 音频系统初始化，路径:', audioPath)
    
    // 设置初始音频状态
    audioHandle.value.setBackgroundMusicState(backgroundMusicState.value)
    audioHandle.value.setMusicEffectSate(musicEffectState.value)
    
    audioInitialized.value = true
  }

  /**
   * 处理服务器下发的音频状态
   * @param {Object} audioStateData - 音频状态数据
   */
  const handleAudioState = (audioStateData) => {
    console.log('🎵 处理音频状态:', audioStateData)
    
    if (!audioStateData || !audioStateData.msg) {
      return false
    }

    const { msg } = audioStateData
    let audioChanged = false

    // 处理背景音乐状态变化
    if (msg.backgroundMusicState && backgroundMusicState.value !== msg.backgroundMusicState) {
      backgroundMusicState.value = msg.backgroundMusicState
      audioHandle.value.setBackgroundMusicState(msg.backgroundMusicState)
      audioChanged = true
      console.log('🎵 背景音乐状态更新:', msg.backgroundMusicState)
    }

    // 处理音效状态变化
    if (msg.musicEffectSate && musicEffectState.value !== msg.musicEffectSate) {
      musicEffectState.value = msg.musicEffectSate
      audioHandle.value.setMusicEffectSate(msg.musicEffectSate)
      audioChanged = true
      console.log('🔊 音效状态更新:', msg.musicEffectSate)
    }

    return audioChanged
  }

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
    audioHandle.value.startSoundEffect(soundName)
    return true
  }

  // ================================
  // 预定义音效函数 - 常用音效
  // ================================

  /**
   * 播放下注音效
   */
  const playBetSound = () => {
    return playSoundEffect('betSound.mp3')
  }

  /**
   * 播放下注成功音效
   */
  const playBetSuccessSound = () => {
    return playSoundEffect('betsuccess.mp3')
  }

  /**
   * 播放取消音效
   */
  const playCancelSound = () => {
    return playSoundEffect('cancel.wav')
  }

  /**
   * 播放提示音效（无变化重复点击）
   */
  const playTipSound = () => {
    return playSoundEffect('tip.wav')
  }

  /**
   * 播放错误音效
   */
  const playErrorSound = () => {
    return playSoundEffect('error.wav')
  }

  /**
   * 播放停止下注音效
   */
  const playStopBetSound = () => {
    return playSoundEffect('stop.wav')
  }

  /**
   * 播放开始下注音效
   */
  const playStartBetSound = () => {
    return playSoundEffect('bet.wav')
  }

  /**
   * 播放开牌音效
   */
  const playOpenCardSound = () => {
    return playSoundEffect('OPENCARD.mp3')
  }

  /**
   * 播放欢迎音效
   */
  const playWelcomeSound = () => {
    return playSoundEffect('welcome.wav')
  }

  // ================================
  // 游戏结果音效 - 需要参数的音效
  // ================================

  /**
   * 播放结果音效
   * @param {number} result - 游戏结果（1=庄赢，2=闲赢，3=和牌）
   * @param {number} gameType - 游戏类型（2=龙虎，3=百家乐）
   */
  const playResultSound = (result, gameType) => {
    if (!result || !gameType) {
      console.warn('⚠️ 结果音效参数不完整:', { result, gameType })
      return false
    }

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

    console.log('🎵 播放结果音效:', soundFile, '结果:', result, '游戏类型:', gameType)
    return playSoundEffect(soundFile)
  }

  /**
   * 播放开牌流程音效序列
   * @param {Object} resultInfo - 开牌结果信息
   * @param {number} gameType - 游戏类型
   * @param {string} bureauNumber - 局号
   */
  const playOpenCardSequence = (resultInfo, gameType, bureauNumber) => {
    console.log('🎵 开始播放开牌音效序列')
    
    // 播放开牌音效
    playOpenCardSound()
    
    // 延时播放结果音效
    setTimeout(() => {
      if (resultInfo.result && resultInfo.result.win) {
        playResultSound(resultInfo.result.win, gameType)
      }
    }, 1000) // 1秒后播放结果音效
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
    
    // 播放欢迎音效
    playWelcomeSound()
    
    // 启动背景音乐
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
      backgroundMusic: backgroundMusicState.value,
      soundEffect: musicEffectState.value,
      initialized: audioInitialized.value,
      audioPath: audioHandle.value.audioPath
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
  // 组合音效序列 - 复杂场景
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
    console.group('=== 音频系统调试信息 ===')
    console.log('音频状态:', getAudioStatus())
    console.log('音频是否可用:', isAudioAvailable())
    console.log('支持的格式:', getSupportedFormats())
    console.log('AudioHandle 实例:', audioHandle.value)
    console.groupEnd()
  }

  /**
   * 重置音频系统
   */
  const resetAudio = () => {
    console.log('🔄 重置音频系统')
    
    muteAll()
    backgroundMusicState.value = 'off'
    musicEffectState.value = 'off'
    audioInitialized.value = false
    
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
      'playWelcomeSound'
    ]
    
    sounds.forEach((soundName, index) => {
      setTimeout(() => {
        console.log('🔊 测试:', soundName)
        eval(soundName + '()')
      }, index * 1000)
    })
  }

  return {
    // 响应式数据
    audioHandle,
    backgroundMusicState,
    musicEffectState,
    audioInitialized,
    
    // 初始化
    initAudio,
    
    // 音频状态处理
    handleAudioState,
    setBackgroundMusicState,
    setMusicEffectState,
    
    // 通用音效播放
    playSoundEffect,
    
    // 预定义音效 - 常用音效
    playBetSound,
    playBetSuccessSound,
    playCancelSound,
    playTipSound,
    playErrorSound,
    playStopBetSound,
    playStartBetSound,
    playOpenCardSound,
    playWelcomeSound,
    
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
    testAllSounds
  }
}