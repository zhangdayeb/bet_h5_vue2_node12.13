// src/views/bjlLh/bjlLh.js
// 修复筹码显示问题的版本

import { ref, computed, onMounted, onBeforeUnmount, provide, nextTick } from 'vue'
import { useRoute } from 'vue-router'

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
    // 路由信息
    const route = useRoute()

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
    // 计算属性
    // ================================

    // 连接状态相关
    const connectionStatus = computed(() => socket.connectionStatus.value)
    const connectionStatusText = computed(() => socket.connectionStatusText.value)
    const isConnected = computed(() => socket.isConnected.value)

    // 开发环境检测
    const isDevelopment = computed(() => {
      try {
        return process.env.NODE_ENV === 'development'
      } catch (e) {
        return false
      }
    })

    // ================================
    // 提供数据给子组件（依赖注入）
    // ================================
    provide('gameParams', {
      gameType: gameConfig.gameType,
      tableId: gameConfig.tableId,
      userId: gameConfig.userId
    })

    provide('socketManager', socket.socketManager)
    provide('audioManager', audio.audioHandle)

    // ================================
    // 生命周期管理
    // ================================

    /**
     * 组件创建时的初始化
     */
    const initializeComponent = async () => {
      console.log('🚀 组件初始化开始')

      try {
        // 1. 获取路由参数
        const tableId = route.query.table_id
        const gameType = route.query.game_type
        const userId = route.query.user_id

        if (!tableId || !gameType || !userId) {
          throw new Error('缺少必要的路由参数')
        }

        console.log('📊 游戏参数:', { tableId, gameType, userId })

        // 2. 初始化游戏配置
        gameConfig.initGameConfig(gameType, tableId, userId)

        // 3. 设置音频路径和欢迎消息
        const audioPath = gameConfig.getAudioPath()
        const welcomeKey = gameConfig.getWelcomeMessageKey()
        
        audio.initAudio(audioPath)
        // 这里需要使用 i18n 来获取翻译后的消息
        // errorHandler.setWelcomeMessage(this.$t(welcomeKey))

        // 4. 初始化免佣设置
        exempt.initExemptSetting(userId, tableId, gameType)

        // 5. 初始化下注数据
        betting.initBettingData(gameConfig.betTargetList.value)

        // 6. 获取用户信息和筹码（关键修复）
        await getUserChipsInfos()

        // 7. 等待一个 tick 确保响应式数据更新
        await nextTick()
        
        // 8. 验证筹码初始化状态
        console.log('🔍 验证筹码初始化状态:', {
          choiceChipsCount: chips.choiceChips.value.length,
          currentChip: chips.currentChip.value?.text,
          allChoiceChips: chips.choiceChips.value.map(c => c.text)
        })

        // 9. 获取当前下注记录
        await getBetCurrentRecord()

        // 10. 初始化 WebSocket 连接
        await initializeSocket(gameType, tableId, userId)

        console.log('✅ 组件初始化完成')

      } catch (error) {
        console.error('❌ 组件初始化失败:', error)
        errorHandler.showServerError('游戏初始化失败，请刷新页面重试')
      }
    }

    /**
     * 初始化 WebSocket 连接
     */
    const initializeSocket = async (gameType, tableId, userId) => {
      try {
        // 设置事件监听器
        setupSocketEventListeners()

        // 建立连接
        await socket.initSocket(gameType, tableId, userId)

      } catch (error) {
        console.error('❌ Socket 初始化失败:', error)
        errorHandler.showConnectionError('网络连接失败，请检查网络设置')
      }
    }

    /**
     * 设置 Socket 事件监听器
     */
    const setupSocketEventListeners = () => {
      // 监听消息
      socket.on('message', handleSocketMessage)

      // 监听连接状态变化
      socket.on('statusChange', handleConnectionStatusChange)

      // 监听连接错误
      socket.on('error', handleSocketError)
    }

    /**
     * 处理 Socket 消息
     */
    const handleSocketMessage = ({ result, originalEvent }) => {
      try {
        const processResult = gameState.processGameMessage(result)
        
        if (!processResult) return

        switch (processResult.type) {
          case 'new_round':
            handleNewRound(processResult)
            break
            
          case 'table_update':
            handleTableUpdate(processResult)
            break
            
          case 'audio_state':
            handleAudioStateUpdate(processResult)
            break
            
          case 'bet_result':
            handleBetResult(processResult)
            break
            
          case 'game_result':
            handleGameResult(processResult)
            break
        }

      } catch (error) {
        console.error('❌ 处理Socket消息失败:', error)
      }
    }

    /**
     * 处理新一局开始
     */
    const handleNewRound = (roundInfo) => {
      console.log('🆕 新一局开始:', roundInfo.bureauNumber)
      
      // 清除上一局的投注显示
      gameConfig.clearAllBetAreas()
      
      // 获取新一局的下注记录
      getBetCurrentRecord()
    }

    /**
     * 处理桌台信息更新
     */
    const handleTableUpdate = (updateInfo) => {
      const { tableInfo } = updateInfo
      
      // 处理音效播放
      if (tableInfo.end_time === 1) {
        setTimeout(() => {
          audio.playStopBetSound()
        }, 1000)
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

      // 首次音频状态更新时显示欢迎消息
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
     * 处理游戏开牌结果
     */
    const handleGameResult = (resultData) => {
      const { resultInfo, bureauNumber, flashIds } = resultData
      
      // 播放开牌音效序列
      audio.playOpenCardSequence(
        resultInfo, 
        gameConfig.gameType.value, 
        bureauNumber
      )
      
      // 设置闪烁效果
      gameConfig.setFlashEffect(flashIds)
      
      // 5秒后清除结果显示
      setTimeout(() => {
        handleResultDisplayEnd()
      }, 5000)
    }

    /**
     * 处理开牌结果显示结束
     */
    const handleResultDisplayEnd = () => {
      console.log('🔄 开牌结果显示结束，清除筹码')
      
      // 清除闪烁效果
      gameConfig.setFlashEffect([])
      
      // 清除所有筹码显示
      gameConfig.clearAllBetAreas()
      
      // 重新获取下注记录
      getBetCurrentRecord()
      
      // 重置接收状态
      gameState.receiveInfoState.value = false
      
      // 更新用户余额
      getUserChipsInfos('balance')
    }

    /**
     * 处理连接状态变化
     */
    const handleConnectionStatusChange = ({ oldStatus, newStatus }) => {
      switch (newStatus) {
        case socket.CONNECTION_STATUS.CONNECTED:
          // 连接成功，可以进行游戏操作
          break
          
        case socket.CONNECTION_STATUS.DISCONNECTED:
          // 连接断开，停止下注
          gameState.betState.value = false
          break
          
        case socket.CONNECTION_STATUS.FAILED:
          errorHandler.showConnectionError('连接失败，请刷新页面重试')
          break
      }
    }

    /**
     * 处理 Socket 错误
     */
    const handleSocketError = (error) => {
      console.error('🔥 Socket错误:', error)
      errorHandler.showNetworkError('网络连接异常')
    }

    // ================================
    // 用户和筹码相关方法（关键修复）
    // ================================

    /**
     * 获取用户信息和筹码配置（修复版本）
     */
    const getUserChipsInfos = async (type) => {
      try {
        console.log('👤 开始获取用户信息，类型:', type)
        const userInfo = await userService.userIndex()
        gameState.setUserInfo(userInfo)

        // 只在非余额更新时处理筹码
        if (type !== 'balance') {
          console.log('🎰 开始初始化筹码，用户筹码数据:', userInfo.user_chip)
          
          // 初始化筹码
          chips.initChips(userInfo.user_chip)
          
          // 强制触发响应式更新
          await nextTick()
          
          // 验证筹码初始化结果
          console.log('🎯 筹码初始化后状态:', {
            choiceChips: chips.choiceChips.value.length,
            currentChip: chips.currentChip.value?.text,
            hasCurrentChip: chips.hasCurrentChip.value
          })
          
          // 如果筹码初始化失败，使用默认筹码
          if (chips.choiceChips.value.length === 0) {
            console.warn('⚠️ 筹码初始化失败，使用默认筹码')
            chips.initChips()
            await nextTick()
          }
        }

        console.log('✅ 用户信息获取成功')

      } catch (error) {
        console.error('❌ 获取用户信息失败:', error)
        errorHandler.handleApiError(error, '获取用户信息失败')
        
        // 失败时使用默认筹码
        if (type !== 'balance') {
          console.log('🎰 使用默认筹码（错误恢复）')
          chips.initChips()
          await nextTick()
          
          console.log('🎯 默认筹码初始化后状态:', {
            choiceChips: chips.choiceChips.value.length,
            currentChip: chips.currentChip.value?.text
          })
        }
      }
    }

    /**
     * 获取当前下注记录
     */
    const getBetCurrentRecord = async () => {
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

    // ================================
    // 游戏操作方法
    // ================================

    /**
     * 执行下注
     */
    const bet = (target) => {
      try {
        // 检查筹码状态
        if (!chips.hasCurrentChip.value) {
          errorHandler.showLocalError('请先选择筹码')
          console.warn('⚠️ 没有选中筹码:', chips.currentChip.value)
          return
        }

        // 检查是否允许点投
        if (gameState.tableRunInfo.value.is_dianji === 0) {
          sendErrorToServer('仅电投')
          return
        }

        // 本地验证
        if (!gameState.betState.value) {
          errorHandler.showLocalError('非下注时间')
          return
        }

        if (!isConnected.value) {
          errorHandler.showLocalError('网络连接中断，请稍候重试')
          return
        }

        // 执行下注
        const result = betting.placeBet(
          target,
          chips.currentChip.value,
          gameConfig.betTargetList.value,
          chips.conversionChip
        )

        if (result.success) {
          // 播放下注音效
          audio.playBetSound()
          
          // 增加总金额
          chips.addTotalMoney(result.amount)
          
          console.log('✅ 下注成功:', result.amount)
        } else {
          errorHandler.showLocalError(result.error)
        }

      } catch (error) {
        console.error('❌ 下注执行失败:', error)
        errorHandler.showLocalError('下注失败，请重试')
      }
    }

    /**
     * 重复下注
     */
    const repeatBet = () => {
      try {
        const result = betting.repeatBet(
          gameConfig.betTargetList.value,
          chips.conversionChip
        )

        if (result.success) {
          audio.playBetSound()
          console.log('✅ 重复下注成功:', result.betsCount, '个投注')
        } else {
          errorHandler.showLocalError(result.error)
        }

      } catch (error) {
        console.error('❌ 重复下注失败:', error)
        errorHandler.showLocalError('重复下注失败')
      }
    }

    /**
     * 确认下注
     */
    const betOrder = async () => {
      try {
        if (betting.betSuccess.value) {
          errorHandler.showLocalError('请勿重复提交')
          return
        }

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
          console.log('✅ 确认下注成功:', result.amount)
          
          // 更新用户余额
          getUserChipsInfos('balance')
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
      const result = betting.cancelBet(gameConfig.betTargetList.value)
      
      if (result.success) {
        // 重新获取下注记录
        getBetCurrentRecord()
        console.log('✅ 取消下注成功')
      }
    }

    /**
     * 设置免佣
     */
    const setFree = () => {
      if (betting.betSendFlag.value) {
        errorHandler.showLocalError('下注期间无法切换免佣状态')
        return
      }

      exempt.toggleExempt()
    }

    // ================================
    // 筹码管理方法（关键修复）
    // ================================

    /**
     * 选择当前筹码
     */
    const handleCureentChip = (chip) => {
      console.log('🎯 选择筹码:', chip?.text)
      chips.handleCurrentChip(chip)
    }

    /**
     * 显示/隐藏筹码选择
     */
    const setShowChips = (show) => {
      chips.setShowChips(show)
    }

    /**
     * 确认筹码选择
     */
    const handleConfirm = (selectedChips) => {
      console.log('✅ 确认筹码选择:', selectedChips.map(c => c.text))
      chips.handleChipConfirm(selectedChips)
    }

    /**
     * 处理筹码选择错误
     */
    const hanldeSelectChipError = (errorData) => {
      errorHandler.showLocalError(errorData.msg)
    }

    // ================================
    // 消息处理方法
    // ================================

    /**
     * 关闭欢迎消息
     */
    const closeMsg = () => {
      errorHandler.handleWelcomeClose()
      audio.playWelcomeAudio()
    }

    /**
     * 发送错误消息到服务器
     */
    const sendErrorToServer = (message) => {
      const data = {
        user_id: gameConfig.userId.value + '_',
        code: msgCode.code.outRange,
        msg: message
      }

      socket.sendMessage(data)
      errorHandler.showLocalError(message)
    }

    /**
     * 手动重连
     */
    const manualReconnect = async () => {
      const success = await socket.manualReconnect()
      
      if (success) {
        errorHandler.showSuccessMessage('重连成功')
      } else {
        errorHandler.showConnectionError('重连失败，请刷新页面')
      }
    }

    // ================================
    // 调试和工具方法
    // ================================

    /**
     * 显示连接统计信息
     */
    const showConnectionStats = () => {
      socket.showConnectionStats()
      
      // 显示其他模块的调试信息
      if (isDevelopment.value) {
        gameState.debugGameState()
        betting.debugBettingInfo()
        chips.debugChipInfo()
        exempt.debugExemptInfo()
        audio.debugAudioInfo()
        errorHandler.debugErrorInfo()
      }
    }

    /**
     * 强制刷新筹码（调试用）
     */
    const forceRefreshChips = async () => {
      console.log('🔄 强制刷新筹码')
      chips.debugChipInfo()
      await getUserChipsInfos()
      await nextTick()
      console.log('🔍 刷新后筹码状态:', {
        choiceChips: chips.choiceChips.value,
        currentChip: chips.currentChip.value
      })
    }

    /**
     * 检查筹码状态（调试用）
     */
    const checkChipStatus = () => {
      console.log('🔍 检查筹码状态:', {
        choiceChips: chips.choiceChips.value,
        currentChip: chips.currentChip.value,
        hasCurrentChip: chips.hasCurrentChip.value,
        choiceChipsCount: chips.choiceChips.value.length
      })
    }

    /**
     * 获取游戏对象列表（兼容原版代码）
     */
    const getObjects = (callback) => {
      return gameConfig.getObjects(callback)
    }

    // ================================
    // 生命周期钩子
    // ================================

    onMounted(async () => {
      console.log('📱 组件挂载完成')
      
      // 初始化组件
      await initializeComponent()
      
      // 确保投注区域显示正确
      gameConfig.clearAllBetAreas()
      
      // 再次验证筹码状态
      await nextTick()
      console.log('🔍 挂载后最终筹码状态:', {
        choiceChips: chips.choiceChips.value.length,
        currentChip: chips.currentChip.value?.text
      })
    })

    onBeforeUnmount(() => {
      console.log('💀 组件即将销毁，清理资源')
      
      // 清理各个模块的资源
      socket.cleanup()
      errorHandler.cleanup()
      
      // 停止音频
      audio.muteAll()
    })

    // ================================
    // 返回给模板的数据和方法
    // ================================
    
    return {
      // ========== 响应式数据 ==========
      
      // 连接状态
      connectionStatus,
      connectionStatusText,
      isConnected,
      
      // 游戏配置
      gameType: gameConfig.gameType,
      tableId: gameConfig.tableId,
      userId: gameConfig.userId,
      betTargetList: gameConfig.betTargetList,
      
      // 游戏状态
      betState: gameState.betState,
      tableRunInfo: gameState.tableRunInfo,
      resultInfo: gameState.resultInfo,
      userInfo: gameState.userInfo,
      
      // 下注状态
      betSendFlag: betting.betSendFlag,
      betSuccess: betting.betSuccess,
      
      // 筹码管理
      choiceChips: chips.choiceChips,
      currentChip: chips.currentChip,
      showChips: chips.showChips,
      
      // 免佣设置
      Freebool: exempt.Freebool,
      
      // 错误和消息处理
      showErrorMsg: errorHandler.showErrorMsg,
      errorMessageText: errorHandler.errorMessageText,
      showWelcomeMsg: errorHandler.showWelcomeMsg,
      welcomeMsg: errorHandler.welcomeMsg,
      
      // 开发环境
      isDevelopment,
      
      // ========== 方法 ==========
      
      // 游戏操作
      bet,
      repeatBet,
      betOrder,
      handleCancel,
      setFree,
      
      // 筹码管理
      handleCureentChip,
      setShowChips,
      handleConfirm,
      hanldeSelectChipError,
      
      // 消息处理
      closeMsg,
      hideErrorMessage: errorHandler.hideErrorMessage,
      
      // 连接管理
      manualReconnect,
      
      // 工具方法
      showConnectionStats,
      getObjects,
      
      // 调试方法（开发环境使用）
      forceRefreshChips,
      checkChipStatus,
      
      // ========== 计算属性和状态 ==========
      
      // 获取游戏状态摘要（用于调试）
      getGameStateSummary: gameState.getGameStateSummary,
      getBettingStateSummary: betting.getBettingStateSummary,
      getAudioStatus: audio.getAudioStatus,
      getErrorStatus: errorHandler.getErrorStatus
    }
  }
}