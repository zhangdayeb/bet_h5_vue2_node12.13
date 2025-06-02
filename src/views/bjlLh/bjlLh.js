// src/views/bjlLh/bjlLh.js
// 重构版本 - 更简洁的入口文件

import { ref, computed, onMounted, onBeforeUnmount, provide, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

// 组件导入
import SelectChip from '@/components/SelectChip'
import BetBtnsXc from '@/components/BtnsXc'
import WelcomeMssage from '@/components/Welcome.vue'

// 服务导入
import userService from '@/service/userService.js'

// 组合式函数导入
import { useSocket } from './composables/useSocket'
import { useGameConfig } from './composables/useGameConfig'
import { useGameState } from './composables/useGameState'
import { useBetting } from './composables/useBetting'
import { useChips } from './composables/useChips'
import { useExempt } from './composables/useExempt'
import { useAudio } from './composables/useAudio'
import { useErrorHandler } from './composables/useErrorHandler'

// 工具导入
import msgCode from '@/utils/msgCode'

export default {
  name: 'BetBjlAndLh',
  components: {
    SelectChip,
    BetBtnsXc,
    WelcomeMssage
  },

  setup() {
    // ================================
    // 基础设置
    // ================================
    const route = useRoute()
    const { t } = useI18n()
    const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

    // ================================
    // 初始化各个功能模块
    // ================================
    const socket = useSocket()
    const gameConfig = useGameConfig()
    const gameState = useGameState()
    const betting = useBetting()
    const chips = useChips()
    const exempt = useExempt()
    const audio = useAudio()
    const errorHandler = useErrorHandler()

    // ================================
    // 计算属性 - 简化版本
    // ================================
    const connectionStatus = computed(() => socket.connectionStatus.value)
    const connectionStatusText = computed(() => socket.connectionStatusText.value)
    const isConnected = computed(() => socket.isConnected.value)

    // ================================
    // 依赖注入
    // ================================
    provide('gameParams', {
      gameType: gameConfig.gameType,
      tableId: gameConfig.tableId,
      userId: gameConfig.userId
    })
    provide('socketManager', socket.socketManager)
    provide('audioManager', audio.audioHandle)

    // ================================
    // 核心初始化函数
    // ================================
    
    /**
     * 应用初始化
     */
    const initializeApp = async () => {
      console.log('🚀 应用初始化开始')

      try {
        // 1. 解析路由参数
        const { tableId, gameType, userId } = parseRouteParams()
        
        // 2. 初始化游戏配置
        initializeGameConfig(gameType, tableId, userId)
        
        // 3. 初始化音频和消息
        initializeAudioAndMessages()
        
        // 4. 初始化用户相关数据
        await initializeUserData()
        
        // 5. 初始化WebSocket连接
        await initializeConnection(gameType, tableId, userId)
        
        console.log('✅ 应用初始化完成')
        
      } catch (error) {
        console.error('❌ 应用初始化失败:', error)
        errorHandler.showServerError('游戏初始化失败，请刷新页面重试')
      }
    }

    /**
     * 解析路由参数
     */
    const parseRouteParams = () => {
      const tableId = route.query.table_id
      const gameType = route.query.game_type
      const userId = route.query.user_id

      if (!tableId || !gameType || !userId) {
        throw new Error('缺少必要的路由参数')
      }

      console.log('📊 路由参数:', { tableId, gameType, userId })
      return { tableId, gameType, userId }
    }

    /**
     * 初始化游戏配置
     */
    const initializeGameConfig = (gameType, tableId, userId) => {
      console.log('🎮 初始化游戏配置')
      
      // 初始化游戏基础配置
      gameConfig.initGameConfig(gameType, tableId, userId)
      
      // 初始化免佣设置
      exempt.initExemptSetting(userId, tableId, gameType)
      
      // 初始化下注数据
      betting.initBettingData(gameConfig.betTargetList.value)
    }

    /**
     * 初始化音频和消息
     */
    const initializeAudioAndMessages = () => {
      console.log('🎵 初始化音频和消息')
      
      // 初始化音频
      const audioPath = gameConfig.getAudioPath()
      audio.initAudio(audioPath)
      
      // 设置欢迎消息
      const welcomeKey = gameConfig.getWelcomeMessageKey()
      errorHandler.setWelcomeMessage(t(welcomeKey))
    }

    /**
     * 初始化用户数据
     */
    const initializeUserData = async () => {
      console.log('👤 初始化用户数据')
      
      try {
        // 获取用户信息
        const userInfo = await userService.userIndex()
        gameState.setUserInfo(userInfo)
        
        // 初始化筹码
        chips.initChips(userInfo.user_chip)
        await nextTick()
        
        // 验证筹码初始化
        if (chips.choiceChips.value.length === 0) {
          console.warn('⚠️ 使用默认筹码')
          chips.initChips()
        }
        
        // 获取下注记录
        await getCurrentBetRecord()
        
      } catch (error) {
        console.error('❌ 用户数据初始化失败:', error)
        // 使用默认筹码作为fallback
        chips.initChips()
        errorHandler.handleApiError(error, '获取用户信息失败')
      }
    }

    /**
     * 初始化WebSocket连接
     */
    const initializeConnection = async (gameType, tableId, userId) => {
      console.log('🔌 初始化WebSocket连接')
      
      try {
        // 设置Socket事件监听
        setupSocketEventHandlers()
        
        // 建立连接
        await socket.initSocket(gameType, tableId, userId)
        
      } catch (error) {
        console.error('❌ WebSocket连接失败:', error)
        errorHandler.showConnectionError('网络连接失败，请检查网络设置')
      }
    }

    // ================================
    // Socket事件处理
    // ================================
    
    /**
     * 设置Socket事件处理器
     */
    const setupSocketEventHandlers = () => {
      socket.on('message', handleSocketMessage)
      socket.on('statusChange', handleConnectionStatusChange)
      socket.on('error', handleSocketError)
    }

    /**
     * 处理Socket消息
     */
    const handleSocketMessage = ({ result, originalEvent }) => {
      try {
        const processResult = gameState.processGameMessage(result)
        if (!processResult) return

        // 根据消息类型分发处理
        const messageHandlers = {
          'new_round': handleNewRound,
          'table_update': handleTableUpdate,
          'audio_state': handleAudioStateUpdate,
          'bet_result': handleBetResult,
          'game_result': handleGameResult
        }

        const handler = messageHandlers[processResult.type]
        if (handler) {
          handler(processResult)
        }

      } catch (error) {
        console.error('❌ Socket消息处理失败:', error)
      }
    }

    /**
     * 处理新一局开始
     */
    const handleNewRound = (roundInfo) => {
      console.log('🆕 新一局开始:', roundInfo.bureauNumber)
      gameConfig.clearAllBetAreas()
      getCurrentBetRecord()
    }

    /**
     * 处理桌台更新
     */
    const handleTableUpdate = (updateInfo) => {
      const { tableInfo } = updateInfo
      
      // 音效播放逻辑
      if (tableInfo.end_time === 1) {
        setTimeout(() => audio.playStopBetSound(), 1000)
      }
      
      if (tableInfo.end_time === gameState.startShowWelcomeTime.value) {
        audio.playStartBetSound()
      }
    }

    /**
     * 处理音频状态更新
     */
    const handleAudioStateUpdate = (audioData) => {
      const changed = audio.handleAudioState(audioData.data)
      
      if (changed && errorHandler.showWelcomeMsg.value.initShow) {
        audio.startBackgroundMusic()
      }

      if (!errorHandler.showWelcomeMsg.value.initShow) {
        errorHandler.showWelcomeMessage()
      }
    }

    /**
     * 处理下注结果
     */
    const handleBetResult = (betResult) => {
      betting.setAvailableClickBet(true)
      
      if (betResult.code === msgCode.code.success) {
        console.log('✅ 下注成功')
      } else {
        console.log('❌ 下注失败:', betResult.message)
      }
    }

    /**
     * 处理游戏结果
     */
    const handleGameResult = (resultData) => {
      const { resultInfo, bureauNumber, flashIds } = resultData
      
      // 播放开牌音效
      audio.playOpenCardSequence(resultInfo, gameConfig.gameType.value, bureauNumber)
      
      // 设置闪烁效果
      gameConfig.setFlashEffect(flashIds)
      
      // 5秒后清理显示
      setTimeout(() => handleResultDisplayEnd(), 5000)
    }

    /**
     * 处理结果显示结束
     */
    const handleResultDisplayEnd = () => {
      gameConfig.setFlashEffect([])
      gameConfig.clearAllBetAreas()
      getCurrentBetRecord()
      gameState.receiveInfoState.value = false
      updateUserBalance()
    }

    /**
     * 处理连接状态变化
     */
    const handleConnectionStatusChange = ({ oldStatus, newStatus }) => {
      if (newStatus === socket.CONNECTION_STATUS.DISCONNECTED) {
        gameState.betState.value = false
      } else if (newStatus === socket.CONNECTION_STATUS.FAILED) {
        errorHandler.showConnectionError('连接失败，请刷新页面重试')
      }
    }

    /**
     * 处理Socket错误
     */
    const handleSocketError = (error) => {
      console.error('🔥 Socket错误:', error)
      errorHandler.showNetworkError('网络连接异常')
    }

    // ================================
    // 游戏操作方法 - 简化版本
    // ================================

    /**
     * 执行下注
     */
    const bet = (target) => {
      // 基础验证
      if (!chips.hasCurrentChip.value) {
        return errorHandler.showLocalError('请先选择筹码')
      }

      if (gameState.tableRunInfo.value.is_dianji === 0) {
        return sendErrorToServer('仅电投')
      }

      if (!gameState.betState.value) {
        return errorHandler.showLocalError('非下注时间')
      }

      if (!isConnected.value) {
        return errorHandler.showLocalError('网络连接中断，请稍候重试')
      }

      // 执行下注
      const result = betting.placeBet(
        target,
        chips.currentChip.value,
        gameConfig.betTargetList.value,
        chips.conversionChip
      )

      if (result.success) {
        audio.playBetSound()
        chips.addTotalMoney(result.amount)
      } else {
        errorHandler.showLocalError(result.error)
      }
    }

    /**
     * 重复下注
     */
    const repeatBet = () => {
      const result = betting.repeatBet(
        gameConfig.betTargetList.value,
        chips.conversionChip
      )

      if (result.success) {
        audio.playBetSound()
      } else {
        errorHandler.showLocalError(result.error)
      }
    }

    /**
     * 确认下注
     */
    const betOrder = async () => {
      if (betting.betSuccess.value) {
        return errorHandler.showLocalError('请勿重复提交')
      }

      try {
        const gameParams = {
          gameType: gameConfig.gameType.value,
          tableId: gameConfig.tableId.value
        }

        const result = await betting.confirmBet(
          gameConfig.betTargetList.value,
          gameParams,
          gameState.userInfo.value,
          exempt.Freebool.value
        )

        if (result.success) {
          audio.playBetSuccessSound()
          updateUserBalance()
        } else {
          errorHandler.showLocalError(result.error)
          handleCancel()
        }

      } catch (error) {
        console.error('❌ 确认下注失败:', error)
        errorHandler.showLocalError('下注失败，请重试')
        handleCancel()
      }
    }

    /**
     * 取消下注
     */
    const handleCancel = () => {
      betting.cancelBet(gameConfig.betTargetList.value)
      getCurrentBetRecord()
    }

    /**
     * 设置免佣
     */
    const setFree = () => {
      if (betting.betSendFlag.value) {
        return errorHandler.showLocalError('下注期间无法切换免佣状态')
      }
      exempt.toggleExempt()
    }

    // ================================
    // 筹码管理方法 - 简化版本
    // ================================

    const handleCureentChip = (chip) => chips.handleCurrentChip(chip)
    const setShowChips = (show) => chips.setShowChips(show)
    
    const handleConfirm = (selectedChips) => {
      chips.handleChipConfirm(selectedChips)
    }
    
    const hanldeSelectChipError = (errorData) => {
      errorHandler.showLocalError(errorData.msg)
    }

    // ================================
    // 消息处理方法 - 简化版本
    // ================================

    const closeMsg = () => {
      errorHandler.handleWelcomeClose()
      audio.playWelcomeAudio()
    }

    const sendErrorToServer = (message) => {
      const data = {
        user_id: gameConfig.userId.value + '_',
        code: msgCode.code.outRange,
        msg: message
      }
      socket.sendMessage(data)
      errorHandler.showLocalError(message)
    }

    const manualReconnect = async () => {
      const success = await socket.manualReconnect()
      if (success) {
        errorHandler.showSuccessMessage('重连成功')
      } else {
        errorHandler.showConnectionError('重连失败，请刷新页面')
      }
    }

    // ================================
    // 辅助方法
    // ================================

    /**
     * 获取当前下注记录
     */
    const getCurrentBetRecord = async () => {
      const gameParams = {
        tableId: gameConfig.tableId.value,
        gameType: gameConfig.gameType.value
      }

      const result = await betting.getCurrentBetRecord(
        gameParams,
        gameConfig.betTargetList.value,
        chips.conversionChip
      )

      if (!result.success) {
        console.warn('⚠️ 获取下注记录失败:', result.error)
      }
    }

    /**
     * 更新用户余额
     */
    const updateUserBalance = async () => {
      try {
        const userInfo = await userService.userIndex()
        gameState.setUserInfo(userInfo)
      } catch (error) {
        console.error('❌ 更新余额失败:', error)
      }
    }

    /**
     * 兼容性方法 - 获取游戏对象
     */
    const getObjects = (callback) => gameConfig.getObjects(callback)

    /**
     * 调试方法
     */
    const showConnectionStats = () => {
      socket.showConnectionStats()
      if (isDevelopment.value) {
        gameState.debugGameState()
        betting.debugBettingInfo()
        chips.debugChipInfo()
        exempt.debugExemptInfo()
        audio.debugAudioInfo()
        errorHandler.debugErrorInfo()
      }
    }

    // ================================
    // 生命周期钩子
    // ================================

    onMounted(async () => {
      console.log('📱 组件挂载完成')
      await initializeApp()
      gameConfig.clearAllBetAreas()
    })

    onBeforeUnmount(() => {
      console.log('💀 组件销毁，清理资源')
      socket.cleanup()
      errorHandler.cleanup()
      audio.muteAll()
    })

    // ================================
    // 返回给模板的数据和方法
    // ================================
    
    return {
      // 连接状态
      connectionStatus,
      connectionStatusText,
      isConnected,
      
      // 游戏配置 - 直接从模块导出
      gameType: gameConfig.gameType,
      tableId: gameConfig.tableId,
      userId: gameConfig.userId,
      betTargetList: gameConfig.betTargetList,
      
      // 游戏状态 - 直接从模块导出
      betState: gameState.betState,
      tableRunInfo: gameState.tableRunInfo,
      resultInfo: gameState.resultInfo,
      userInfo: gameState.userInfo,
      
      // 下注状态 - 直接从模块导出
      betSendFlag: betting.betSendFlag,
      betSuccess: betting.betSuccess,
      
      // 筹码管理 - 直接从模块导出
      choiceChips: chips.choiceChips,
      currentChip: chips.currentChip,
      showChips: chips.showChips,
      
      // 免佣设置 - 直接从模块导出
      Freebool: exempt.Freebool,
      
      // 错误处理 - 直接从模块导出
      showErrorMsg: errorHandler.showErrorMsg,
      errorMessageText: errorHandler.errorMessageText,
      showWelcomeMsg: errorHandler.showWelcomeMsg,
      welcomeMsg: errorHandler.welcomeMsg,
      
      // 开发环境标志
      isDevelopment,
      
      // 游戏操作方法
      bet,
      repeatBet,
      betOrder,
      handleCancel,
      setFree,
      
      // 筹码管理方法
      handleCureentChip,
      setShowChips,
      handleConfirm,
      hanldeSelectChipError,
      
      // 消息处理方法
      closeMsg,
      hideErrorMessage: errorHandler.hideErrorMessage,
      
      // 连接管理
      manualReconnect,
      
      // 工具方法
      showConnectionStats,
      getObjects
    }
  }
}