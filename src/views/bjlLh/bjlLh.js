// src/views/bjlLh/bjlLh.js
// 修复版调度员 - 简化取消逻辑，注册清理回调

import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

// 组件导入
import SelectChip from '@/components/SelectChip'
import BetBtnsXc from '@/components/BtnsXc'
import WelcomeMssage from '@/components/Welcome.vue'
import WinningPopup from '@/components/WinningPopup.vue'

// 服务导入
import userService from '@/service/userService.js'

// 组合式函数导入 - 各专业模块
import { useSocket } from './composables/useSocket'
import { useGameConfig } from './composables/useGameConfig'
import { useGameState } from './composables/useGameState'
import { useBetting } from './composables/useBetting'
import { useChips } from './composables/useChips'
import { useExempt } from './composables/useExempt'
import { useAudio } from './composables/useAudio'
import { useErrorHandler } from './composables/useErrorHandler'

export default {
  name: 'BetBjlAndLh',
  components: {
    SelectChip,
    BetBtnsXc,
    WelcomeMssage,
    WinningPopup
  },

  setup() {
    // ================================
    // 基础设置
    // ================================
    const route = useRoute()
    const { t } = useI18n()
    const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

    // ================================
    // 初始化各个专业模块
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
    // 计算属性 - 直接引用模块数据
    // ================================
    const connectionStatus = computed(() => socket.connectionStatus.value)
    const connectionStatusText = computed(() => socket.connectionStatusText.value)
    const isConnected = computed(() => socket.isConnected.value)

    // ================================
    // 功能1: 应用初始化协调（核心职责）
    // ================================
    
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

      console.log('📊 路由参数解析:', { tableId, gameType, userId })
      return { tableId, gameType, userId }
    }

    /**
     * 获取音频路径
     */
    const getAudioPath = (gameType) => {
      return gameType == 3 ? 'bjl' : 'longhu'
    }

    /**
     * 应用初始化协调
     */
    const initializeApp = async () => {
      console.log('🚀 应用初始化开始')

      try {
        // 1. 解析路由参数
        const { tableId, gameType, userId } = parseRouteParams()
        
        // 2. 协调各模块初始化（注意顺序）
        console.log('🎮 初始化游戏配置模块')
        gameConfig.initGameConfig(gameType, tableId, userId)
        
        console.log('🎵 初始化音频模块')
        audio.initAudio(getAudioPath(gameType))
        
        console.log('🎰 初始化下注模块')
        betting.initBetting()
        
        console.log('🔧 初始化免佣设置')
        exempt.initExemptSetting(userId, tableId, gameType)
        
        // 3. 获取用户数据并初始化筹码
        console.log('👤 获取用户数据')
        const userInfo = await userService.userIndex()
        chips.initChips(userInfo.user_chip)
        await nextTick()
        
        // 验证筹码初始化
        if (chips.choiceChips.value.length === 0) {
          console.warn('⚠️ 使用默认筹码')
          chips.initChips()
        }
        
        // 4. 关键依赖注入
        console.log('🔗 注入依赖关系')
        gameState.setAudioManager(audio)
        
        // 🆕 5. 注册开牌后清理回调
        console.log('📋 注册开牌后清理回调')
        gameState.registerCleanupCallback((betTargetList) => {
          console.log('🎯 执行开牌后投注数据清理')
          betting.clearAfterGameResult(betTargetList)
        })
        
        // 6. 建立WebSocket连接
        console.log('🔌 建立WebSocket连接')
        setupSocketEventHandlers()
        await socket.initSocket(gameType, tableId, userId)
        
        // 7. 显示欢迎消息
        showWelcomeMessage()
        
        console.log('✅ 应用初始化完成')

       
      } catch (error) {
        console.error('❌ 应用初始化失败:', error)
        errorHandler.showServerError('游戏初始化失败，请刷新页面重试')
      }
    }

    /**
     * 显示欢迎消息
     */
    const showWelcomeMessage = () => {
      const welcomeKey = gameConfig.gameType.value == 3 ? 'bjlAndLh.welcomeBjl' : 'bjlAndLh.welcomeLh'
      
      console.log('🎉 显示欢迎消息:', {
        gameType: gameConfig.gameType.value,
        welcomeKey,
        message: t(welcomeKey)
      })
      
      errorHandler.setWelcomeMessage(t(welcomeKey))
      errorHandler.showWelcomeMessage()
    }

    // ================================
    // 功能2: WebSocket消息路由（核心职责）
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
     * 处理Socket消息 - 极简路由
     */
    const handleSocketMessage = ({ result, originalEvent }) => {
      try {
        console.log('📨 收到Socket消息:', result)

        if(result.code == 205){
          audio.handleRemoteAudioControl(result)
        }
        
        // 调用 gameState 完整处理消息（包含音效、闪烁、倒计时、中奖弹窗、清理调度）
        const processResult = gameState.processGameMessage(
          result,
          gameConfig,  // 传递游戏配置
          gameConfig.gameType.value
        )
        
        console.log('📋 消息处理结果:', processResult)
        
        if (!processResult) return

        // 根据消息类型做极少的协调工作
        switch (processResult.type) {
          case 'new_round':
            handleNewRound(processResult)
            break
            
          case 'game_result':
            handleGameResult(processResult)
            break
            
          case 'winning_amount':
            handleWinningAmount(processResult)
            break
            
          case 'table_update':
            handleTableUpdate(processResult)
            break
            
          case 'other_message':
            console.log('📝 其他消息:', processResult.data)
            break
            
          case 'empty_message':
            console.log('📭 空消息')
            break
        }

      } catch (error) {
        console.error('❌ Socket消息处理失败:', error)
        errorHandler.showNetworkError('消息处理异常')
      }
    }

    /**
     * 处理新局开始 - 协调清理
     */
    const handleNewRound = (roundInfo) => {
      console.log('🆕 新局开始，协调清理')
      betting.resetForNewRound(gameConfig.betTargetList.value)
    }

    /**
     * 🔧 修复：处理游戏结果 - 简化处理
     */
    const handleGameResult = (resultData) => {
      if (resultData.processed) {
        console.log('✅ 开牌结果已完整处理（音效+闪烁+清理调度）')
        // 🔧 修复：不再手动调用清理，由 gameState 的清理回调自动处理
        console.log('🎯 开牌后清理将由回调自动执行')
      } else {
        console.warn('⚠️ 开牌结果未完整处理')
      }
    }

    /**
     * 处理中奖金额
     */
    const handleWinningAmount = (winningData) => {
      console.log('💰 中奖金额处理结果:', winningData)
      
      if (winningData.winningPopupShown) {
        console.log('🎉 中奖弹窗已显示')
      } else if (winningData.amount > 0) {
        console.log('⚠️ 有中奖但弹窗未显示，可能是重复或其他原因')
      } else {
        console.log('📝 本局无中奖')
      }
    }

    /**
     * 处理桌台更新
     */
    const handleTableUpdate = (updateInfo) => {
      console.log('📊 桌台信息已更新（倒计时+音效已自动处理）')
    }

    /**
     * 处理连接状态变化
     */
    const handleConnectionStatusChange = ({ oldStatus, newStatus }) => {
      console.log(`🔄 连接状态变化: ${oldStatus} -> ${newStatus}`)
      
      if (newStatus === socket.CONNECTION_STATUS.DISCONNECTED) {
        errorHandler.showConnectionError('连接已断开，正在重连...')
      } else if (newStatus === socket.CONNECTION_STATUS.FAILED) {
        errorHandler.showConnectionError('连接失败，请刷新页面重试')
      } else if (newStatus === socket.CONNECTION_STATUS.CONNECTED) {
        errorHandler.showSuccessMessage('连接已恢复')
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
    // 功能3: Vue组件接口层（薄包装）
    // ================================

    /**
     * 投注区域点击
     */
    const bet = (target) => {
      const checkResult = betting.canPlaceBet(
        gameState.tableRunInfo,
        chips, 
        { isConnected: isConnected.value }
      )
      
      if (checkResult.canClick) {
        const result = betting.executeClickBet(
          target,
          chips.currentChip.value,
          gameConfig.betTargetList.value,
          chips.conversionChip,
          audio.playBetSound
        )
        
        if (!result.success) {
          errorHandler.showLocalError(result.error)
        }
      } else {
        errorHandler.showLocalError(checkResult.reason)
      }
    }

    /**
     * 确认按钮
     */
    const betOrder = async () => {
      try {
        const result = await betting.confirmBet(
          gameConfig.betTargetList.value,
          {
            gameType: gameConfig.gameType.value,
            tableId: gameConfig.tableId.value
          },
          exempt.Freebool.value,
          audio.playBetSuccessSound,
          audio.playTipSound
        )
        
        if (result.success) {
          const successMessage = `投注成功！共${result.betsCount}注，总金额 ${result.amount}`
          console.log('✅ 投注成功:', {
            betsCount: result.betsCount,
            amount: result.amount,
            message: successMessage
          })
          
          errorHandler.showSuccessMessage(successMessage, 2000)
          
        } else if (!result.noApiCall) {
          errorHandler.showLocalError(result.error)
        }
        
      } catch (error) {
        console.error('❌ 确认下注失败:', error)
        errorHandler.handleApiError(error, '下注失败，请重试')
      }
    }

    /**
     * 🔧 修复：取消按钮 - 简化调用
     */
    const handleCancel = () => {
      console.log('🎯 用户点击取消按钮')
      
      // 🔧 修复：简化调用，只传递必要参数
      const result = betting.cancelBet(
        gameConfig.betTargetList.value,
        gameState,  // 保留传递，但 betting 内部不用于复杂判断
        audio.playCancelSound,
        audio.playErrorSound
      )
      
      if (result.success) {
        // 根据操作类型显示不同的提示消息
        if (result.type === 'restore') {
          errorHandler.showSuccessMessage('已恢复到提交状态', 2500)
          console.log('✅ 恢复操作成功:', result)
        } else if (result.type === 'clear') {
          errorHandler.showSuccessMessage('已清空所有投注', 2500)
          console.log('✅ 清空操作成功:', result)
        }
      } else {
        errorHandler.showLocalError(result.error)
        console.warn('⚠️ 取消操作失败:', result)
      }
    }

    /**
     * 设置免佣
     */
    const setFree = () => {
      if(gameState.tableRunInfo.end_time > 0){
        errorHandler.showLocalError('下注期间无法切换免佣状态')
        return
      }
      exempt.toggleExempt()
    }

    // ================================
    // 功能4: 筹码管理协调（薄包装）
    // ================================

    const handleCureentChip = (chip) => {
      chips.handleCurrentChip(chip)
    }

    const setShowChips = (show) => {
      chips.setShowChips(show)
    }
    
    const handleConfirm = (selectedChips) => {
      chips.handleChipConfirm(selectedChips)
    }
    
    const hanldeSelectChipError = (errorData) => {
      errorHandler.showLocalError(errorData.msg)
    }

    // ================================
    // 功能5: 欢迎消息协调
    // ================================

    /**
     * 欢迎消息关闭处理 - 关键的用户交互触发点
     */
    const closeMsg = () => {
      console.log('🎉 用户点击欢迎消息确认，触发音频播放')
      
      // 1. 关闭欢迎消息弹窗
      errorHandler.handleWelcomeClose()
      
      // 2. 关键：用户交互后播放欢迎音频（包含背景音乐启动）
      // 这是浏览器音频策略要求的第一次用户交互
      audio.playWelcomeAudio()
    }

    // ================================
    // 功能6: 中奖弹窗事件处理
    // ================================

    /**
     * 处理中奖弹窗关闭事件
     */
    const handleWinningPopupClose = () => {
      console.log('🎉 用户关闭中奖弹窗')
      gameState.closeWinningDisplay()
    }

    /**
     * 处理中奖音效播放请求
     */
    const handlePlayWinSound = () => {
      console.log('🎵 中奖弹窗请求播放音效')
      gameState.playWinningSound()
    }

    // ================================
    // 功能7: 连接管理协调
    // ================================

    const manualReconnect = async () => {
      const success = await socket.manualReconnect()
      if (success) {
        errorHandler.showSuccessMessage('重连成功')
      } else {
        errorHandler.showConnectionError('重连失败，请刷新页面')
      }
    }

    // ================================
    // 生命周期钩子
    // ================================

    onMounted(async () => {
      console.log('📱 组件挂载完成，开始初始化')
      await initializeApp()
      // 确保投注区域干净
      gameConfig.clearAllBetAreas()
    })

    onBeforeUnmount(() => {
      console.log('💀 组件销毁，清理资源')
      socket.cleanup()
      errorHandler.cleanup()
      gameState.cleanup()
      audio.muteAll()
    })

    // ================================
    // 返回给模板的数据和方法
    // ================================
    
    return {
      // 连接状态 - 直接引用模块数据
      connectionStatus,
      connectionStatusText,
      isConnected,
      
      // 游戏配置 - 直接从模块导出
      gameType: gameConfig.gameType,
      tableId: gameConfig.tableId,
      userId: gameConfig.userId,
      betTargetList: gameConfig.betTargetList,
      
      // 游戏状态 - 直接从模块导出
      tableRunInfo: gameState.tableRunInfo,
      bureauNumber: gameState.bureauNumber,
      
      // 中奖弹窗状态 - 直接从模块导出
      showWinningPopup: gameState.showWinningPopup,
      winningAmount: gameState.winningAmount,
      
      // 下注状态 - 直接从模块导出
      betSendFlag: betting.betSendFlag,
      totalAmount: betting.totalAmount,
      isSubmitting: betting.isSubmitting,
      
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
      
      // Vue组件接口 - 薄包装函数
      bet,
      betOrder,
      handleCancel,  // 🔧 修复后的简化版本
      setFree,
      
      // 筹码管理接口
      handleCureentChip,
      setShowChips,
      handleConfirm,
      hanldeSelectChipError,
      
      // 消息处理接口
      closeMsg,
      hideErrorMessage: errorHandler.hideErrorMessage,
      
      // 中奖弹窗接口
      handleWinningPopupClose,
      handlePlayWinSound,
      
      // 连接管理接口
      manualReconnect
    }
  }
}