import chips from '@/common/allChipList.js'
import SelectChip from '@/components/SelectChip'
import bjlService from '@/service/bjlService'
import userService from '@/service/userService.js'
import tools from '@/utils/tools'
import msgCode from '@/utils/msgCode'
import BetBtnsXc from '@/components/BtnsXc'
import AudioHandle from '@/common/audioHandle.js'
import WelcomeMssage from '@/components/Welcome.vue'
import { isReactive } from '@vue/reactivity'

// WebSocket 相关导入 - 直接使用简化版本避免导入错误
const CONNECTION_STATUS = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected', 
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    FAILED: 'failed'
}

const SOCKET_URLS = {
    BJL: 'wss://wssbjl.wuming888.com',
    LH: 'wss://wsslh.wuming888.com'
}

// 简化版Socket管理器
class SimpleSocketManager {
    constructor(url, options = {}) {
        this.url = url
        this.status = CONNECTION_STATUS.DISCONNECTED
        this.eventListeners = {
            statusChange: [],
            message: [],
            open: [],
            close: [],
            error: []
        }
        this.ws = null
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10
        this.reconnectTimer = null
        this.reconnectInterval = options.reconnectInterval || 2000
        this.heartbeatTimer = null
        this.heartbeatInterval = options.heartbeatInterval || 30000
    }
    
    async connect(initData) {
        return new Promise((resolve, reject) => {
            try {
                this.setStatus(CONNECTION_STATUS.CONNECTING)
                this.ws = new WebSocket(this.url)
                
                this.ws.onopen = (event) => {
                    console.log('WebSocket连接成功')
                    this.setStatus(CONNECTION_STATUS.CONNECTED)
                    this.reconnectAttempts = 0
                    this.emit('open', event)
                    
                    // 启动心跳
                    this.startHeartbeat()
                    
                    if (initData) {
                        this.send(initData)
                    }
                    resolve(event)
                }
                
                this.ws.onmessage = (event) => {
                    this.emit('message', { data: { raw: event.data }, originalEvent: event })
                }
                
                this.ws.onclose = (event) => {
                    console.log('WebSocket连接关闭:', event.code, event.reason)
                    this.setStatus(CONNECTION_STATUS.DISCONNECTED)
                    this.stopHeartbeat()
                    this.emit('close', event)
                    
                    // 自动重连
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect()
                    }
                }
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket连接错误:', error)
                    this.setStatus(CONNECTION_STATUS.FAILED)
                    this.emit('error', error)
                    reject(error)
                }
                
            } catch (error) {
                reject(error)
            }
        })
    }
    
    startHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer)
        }
        
        this.heartbeatTimer = setInterval(() => {
            if (this.status === CONNECTION_STATUS.CONNECTED) {
                this.send({
                    use_target: 'heartbeat',
                    post_position: 'bet'
                })
            }
        }, this.heartbeatInterval)
    }
    
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer)
            this.heartbeatTimer = null
        }
    }
    
    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
        }
        
        this.reconnectAttempts++
        this.setStatus(CONNECTION_STATUS.RECONNECTING)
        
        const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)
        console.log(`计划在 ${delay}ms 后进行第 ${this.reconnectAttempts} 次重连`)
        
        this.reconnectTimer = setTimeout(() => {
            this.connect()
        }, delay)
    }
    
    setStatus(newStatus) {
        const oldStatus = this.status
        this.status = newStatus
        console.log(`WebSocket状态变化: ${oldStatus} -> ${newStatus}`)
        this.emit('statusChange', { oldStatus, newStatus })
    }
    
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data))
            return true
        } else {
            console.warn('WebSocket未连接，无法发送消息:', data)
            return false
        }
    }
    
    close() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        
        this.stopHeartbeat()
        
        if (this.ws) {
            this.ws.close()
        }
    }
    
    on(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback)
        }
    }
    
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error('Event callback error:', error)
                }
            })
        }
    }
    
    getStatus() {
        return this.status
    }
    
    getStats() {
        return {
            totalMessages: 0,
            errorCount: 0,
            reconnectCount: this.reconnectAttempts,
            avgLatency: 0,
            connectionUptime: 0
        }
    }
    
    checkHealth() {
        return {
            status: this.status,
            isHealthy: this.status === CONNECTION_STATUS.CONNECTED,
            issues: []
        }
    }
    
    async reconnect() {
        this.close()
        this.reconnectAttempts = 0
        return this.connect()
    }
}

const OptimizedSocketManager = SimpleSocketManager

let canvas = null
const allChips = chips.allChips
const allowBetName = 'allow-bet'

export default {
    name: 'BetBjlAndLh',
    components: {
        SelectChip,
        BetBtnsXc,
        WelcomeMssage
    },
    
    data() {
        return {
            // WebSocket 管理器
            socketManager: null,
            connectionStatus: CONNECTION_STATUS.DISCONNECTED,
            
            // 游戏基本信息
            gameType: '',
            tableId: '',
            userId: '',
            
            // 下注相关
            Freebool: false, // 默认为 false，等待从本地存储获取
            betSendFlag: false, 
            betState: false,
            betSuccess: false,
            availableClickBet: true,
            
            // 音频处理
            audioHandle: new AudioHandle(),
            
            // 筹码相关
            choiceChips: [],
            currentChip: null,
            showChips: false,
            total_money: 0,
            
            // 消息和界面
            welcomeMsg: '欢迎光临XXX游戏',
            showWelcomeMsg: {
                show: false,
                initShow: false
            },
            
            // 错误提示消息
            showErrorMsg: false,
            errorMessageText: '',
            errorMessageTimer: null,
            
            // 百家乐下注区域
            betTargetListBjl: [
                {
                    id: 6, label: '闲', ratio: '1:1', value: 'idle', className: 'bet-idle',
                    color: '', odds: '', betAmount: 0, showChip: [], imgWidth: 30,
                    total_amount: 0, total_population: 0, flashClass: '',
                    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/xian.png`)
                }, 
                {
                    id: 2, label: '闲对', ratio: '1:11', value: 'idle-Pair', className: 'bet-idle-Pair',
                    color: 'white', odds: '', betAmount: 0, showChip: [], imgWidth: 47,
                    total_amount: 0, total_population: 0, flashClass: '',
                    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/xian_pair.png`),
                    textShadow: '0 0 blue'
                },
                {
                    id: 7, label: '和', ratio: '1:8', value: 'peace', className: 'bet-peace',
                    color: '', odds: '', betAmount: 0, showChip: [], imgWidth: 30,
                    total_amount: 0, total_population: 0, flashClass: '',
                    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/he.png`)
                },
                {
                    id: 4, label: '庄对', ratio: '1:11', value: 'zhuang-Pair', className: 'bet-zhuang-Pair',
                    color: 'white', odds: '', betAmount: 0, showChip: [], imgWidth: 47,
                    total_amount: 0, total_population: 0, flashClass: '',
                    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/zhuang_pair.png`),
                    textShadow: '0 0 blue'
                },
                {
                    id: 8, label: '庄', ratio: '1:0.95', value: 'zhuang', className: 'bet-zhuang',
                    color: '', odds: '', betAmount: 0, showChip: [], imgWidth: 30,
                    total_amount: 0, total_population: 0, flashClass: '',
                    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/zhuang.png`)
                },
                {
                    id: 10, label: '熊八', ratio: '1:25', value: 'xiong8', className: 'bet-idle',
                    color: '', odds: '', betAmount: 0, showChip: [], imgWidth: 30,
                    total_amount: 0, total_population: 0, flashClass: '',
                    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/xiong8.png`)
                },
                {
                    id: 3, label: '幸运6', ratio: '1:12/20', value: 'lucky', className: 'bet-lucky',
                    color: '', odds: '', betAmount: 0, showChip: [], imgWidth: 30,
                    total_amount: 0, total_population: 0, flashClass: '',
                    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/lucky.png`)
                },
                {
                    id: 9, label: '龙七', ratio: '1:40', value: 'long7', className: 'bet-zhuang',
                    color: '', odds: '', betAmount: 0, showChip: [], imgWidth: 30,
                    total_amount: 0, total_population: 0, flashClass: '',
                    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/long7.png`)
                }
            ],
            
            // 龙虎下注区域
            betTargetListLongHu: [
                {
                    id: 20, label: '龙', value: 'zhuang', className: 'bet-idle',
                    color: '', odds: '', betAmount: 0, showChip: [], imgWidth: 40,
                    total_amount: 0, total_population: 0, flashClass: '',
                    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/dragon.png`)
                },
                {
                    id: 22, label: '和', value: 'peace', className: 'bet-peace',
                    color: '', odds: '', betAmount: 0, showChip: [], imgWidth: 40,
                    total_amount: 0, total_population: 0, flashClass: '',
                    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/lh_he.png`)
                },
                {
                    id: 21, label: '虎', value: 'idle', className: 'bet-idle',
                    color: '', odds: '', betAmount: 0, showChip: [], imgWidth: 40,
                    total_amount: 0, total_population: 0, flashClass: '',
                    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/tigger.png`)
                }
            ],
            
            // 游戏数据
            betTargetList: [],
            repeatData: [],
            cancelData: [],
            tableRunInfo: {},
            resultInfo: {},
            bureauNumber: '',
            receiveInfoState: false,
            startShowWelcomeTime: 29,
            userInfo: {},
            stopMusicHasPlayed: false
        }
    },

    computed: {
        /**
         * 连接状态文本
         */
        connectionStatusText() {
            switch (this.connectionStatus) {
                case 'connected':
                    return '已连接'
                case 'connecting':
                    return '连接中...'
                case 'reconnecting':
                    return '重连中...'
                case 'disconnected':
                    return '已断开'
                case 'failed':
                    return '连接失败'
                default:
                    return '未知状态'
            }
        },

        /**
         * 是否已连接
         */
        isConnected() {
            return this.connectionStatus === 'connected'
        },

        /**
         * 是否为开发环境
         */
        isDevelopment() {
            try {
                return process.env.NODE_ENV === 'development'
            } catch (e) {
                return false
            }
        }
    },

    created() {
        console.log('组件创建开始')
        
        // 初始化基本参数
        this.tableId = this.$route.query.table_id
        this.gameType = this.$route.query.game_type
        this.userId = this.$route.query.user_id
        
        console.log('游戏参数:', { tableId: this.tableId, gameType: this.gameType, userId: this.userId })
        
        // 设置下注区域列表
        this.betTargetList = this.gameType == 3 ? this.betTargetListBjl : this.betTargetListLongHu
        
        // 🔧 初始化时确保所有投注区域都是清空状态
        this.clearAllBetDisplay()
        
        // 设置音频路径和欢迎消息
        if(this.gameType == 3) {
            this.audioHandle.audioPath = 'bjl'
            this.welcomeMsg = this.$t("bjlAndLh.welcomeBjl")						
        }
        if(this.gameType == 2) {
            this.audioHandle.audioPath = 'longhu'
            this.welcomeMsg = this.$t("bjlAndLh.welcomeLh")					
        }
        
        // 初始化数据
        this.initCancelData()
        
        // 1. 首先获取用户信息（包括免佣设置）
        this.getUserChipsInfos()
        
        // 2. 然后获取下注记录（这里会根据实际情况显示或清空）
        this.getBetCurrentRecord()
        
        // 3. 最后初始化Socket连接
        this.initSocket()
        
        console.log('组件创建完成，初始免佣状态:', this.Freebool)
    },

    mounted() {
        console.log('组件挂载完成')
        // 🔧 挂载后再次确保所有投注区域都是清空状态
        this.$nextTick(() => {
            this.clearAllBetDisplay()
            this.$forceUpdate()
        })
    },

    beforeUnmount() {
        console.log('组件销毁，清理资源')
        this.cleanup()
    },

    methods: {
        /**
         * 初始化WebSocket连接
         */
        initSocket() {
            console.log('初始化Socket连接')
            
            // 根据游戏类型选择WebSocket URL
            const socketUrl = this.gameType == 3 ? SOCKET_URLS.BJL : SOCKET_URLS.LH
            console.log('Socket URL:', socketUrl)
            
            // 创建Socket管理器实例
            this.socketManager = new OptimizedSocketManager(socketUrl, {
                maxReconnectAttempts: 15,
                reconnectInterval: 2000,
                heartbeatInterval: 25000,
                enableMessageQueue: true,
                maxQueueSize: 50
            })

            // 监听连接状态变化
            this.socketManager.on('statusChange', this.handleStatusChange)
            this.socketManager.on('message', this.handleMessage)
            this.socketManager.on('open', this.handleOpen)
            this.socketManager.on('close', this.handleClose)
            this.socketManager.on('error', this.handleError)

            // 建立连接
            this.connect()
        },

        /**
         * 建立连接
         */
        async connect() {
            try {
                const initData = {
                    table_id: this.tableId,
                    game_type: this.gameType,
                    user_id: this.userId + '_'
                }
                
                console.log('开始连接WebSocket，初始数据:', initData)
                await this.socketManager.connect(initData)
                console.log('Socket连接成功')
                
            } catch (error) {
                console.error('Socket连接失败:', error)
                this.displayErrorMessage('连接失败，请检查网络连接')
            }
        },

        /**
         * 处理连接状态变化
         */
        handleStatusChange({ oldStatus, newStatus }) {
            console.log(`WebSocket状态变化: ${oldStatus} -> ${newStatus}`)
            this.connectionStatus = newStatus
            
            switch (newStatus) {
                case 'connected':
                    console.log('✅ [成功] 连接已建立')
                    break
                case 'reconnecting':
                    console.log('⚠️ [警告] 正在重新连接...')
                    break
                case 'disconnected':
                    console.log('⚠️ [警告] 连接已断开')
                    break
                case 'failed':
                    console.log('❌ [错误] 连接失败，请刷新页面重试')
                    break
            }
        },

        /**
         * 处理连接打开
         */
        handleOpen(event) {
            console.log('WebSocket连接打开')
        },

        /**
         * 处理连接关闭
         */
        handleClose(event) {
            console.log('WebSocket连接关闭', event)
            this.betState = false
        },

        /**
         * 处理连接错误
         */
        handleError(error) {
            console.error('WebSocket错误:', error)
        },

        /**
         * 处理接收到的消息
         */
        handleMessage({ data, originalEvent }) {
            try {
                // 空数据处理
                if (!data || (data.raw && !data.raw.trim())) {
                    this.tableRunInfo.end_time = 0
                    return
                }

                // 如果是原始数据，尝试解析
                let result = data
                if (data.raw) {
                    try {
                        result = JSON.parse(data.raw.trim())
                    } catch (e) {
                        console.warn('解析原始数据失败:', data.raw)
                        return
                    }
                }

                // 处理不同类型的消息
                this.processGameMessage(result)
                
            } catch (error) {
                console.error('处理消息错误:', error, data)
            }
        },

        /**
         * 处理游戏消息
         */
        processGameMessage(result) {
            // 倒计时和游戏状态信息
            if (result.data && result.data.table_run_info) {
                this.tableRunInfo = result.data.table_run_info
                this.setTableInfo()
                return
            }

            // 音频状态设置
            if (result.code == msgCode.code.audioState) {
                this.handleAudioState(result)
                return
            }

            // 下注结果处理
            if (result.code == msgCode.code.outRange || result.code == msgCode.code.success) {
                this.availableClickBet = true
                return
            }

            // 开牌结果处理
            if (result.data && result.data.result_info) {
                this.handleGameResult(result)
            }
        },

        /**
         * 处理音频状态
         */
        handleAudioState(result) {
            if (result.data && result.data.voiceSwitch) {
                // 处理语音开关
            }

            if (result.msg) {
                if (this.audioHandle.backgroundMusicState != result.msg.backgroundMusicState) {
                    this.audioHandle.setBackgroundMusicState(result.msg.backgroundMusicState)
                    if (this.showWelcomeMsg.initShow) {
                        this.audioHandle.startSoundBackground()
                    }
                }

                if (this.audioHandle.musicEffectSate != result.msg.musicEffectSate) {
                    this.audioHandle.setMusicEffectSate(result.msg.musicEffectSate)
                }
            }

            if (!this.showWelcomeMsg.initShow) {
                this.showWelcomeMsg.show = true
                this.showWelcomeMsg.initShow = true
            }
        },

        /**
         * 处理开牌结果
         */
        handleGameResult(result) {
            if (result.data.result_info.table_info.game_type != this.gameType || 
                result.data.result_info.table_info.table_id != this.tableId || 
                this.tableRunInfo.end_time > 0) {
                return
            }

            if (result.code == 200 && !this.receiveInfoState) {
                this.receiveInfoState = true
                this.resultInfo = result.data.result_info
                this.runOpenMusicEffect(result.data.bureau_number)
                this.setFlash()
            }
        },

        /**
         * 发送消息
         */
        sendMessage(data, options = {}) {
            if (!this.socketManager) {
                console.error('Socket管理器未初始化')
                return false
            }

            return this.socketManager.send(data, {
                expectResponse: options.expectResponse || false,
                timeout: options.timeout || 5000,
                ...options
            })
        },

        /**
         * 发送错误消息
         */
        sendErrorMessage(message, sendToServer = false) {
            // 显示UI提示
            this.displayErrorMessage(message)
            
            // 只有在明确指定需要发送到服务器时才发送
            if (sendToServer && this.isConnected) {
                return this.sendMessage({
                    user_id: this.userId + '_',
                    code: msgCode.code.outRange,
                    msg: message
                })
            }
            
            return false
        },

        /**
         * 显示本地错误消息（不发送给服务器）
         */
        showLocalError(message) {
            this.displayErrorMessage(message)
        },

        /**
         * 手动重连
         */
        async manualReconnect() {
            if (!this.socketManager) return
            
            try {
                await this.socketManager.reconnect()
                console.log('✅ [成功] 重连成功')
            } catch (error) {
                console.error('手动重连失败:', error)
                this.displayErrorMessage('重连失败')
            }
        },

        /**
         * 清理资源
         */
        cleanup() {
            if (this.socketManager) {
                this.socketManager.close()
                this.socketManager = null
            }
            
            // 清理错误消息定时器
            if (this.errorMessageTimer) {
                clearTimeout(this.errorMessageTimer)
                this.errorMessageTimer = null
            }
        },

        /**
         * 显示错误提示弹窗
         */
        displayErrorMessage(message) {
            this.errorMessageText = message
            this.showErrorMsg = true
            
            // 清除之前的定时器
            if (this.errorMessageTimer) {
                clearTimeout(this.errorMessageTimer)
            }
            
            // 3秒后自动隐藏
            this.errorMessageTimer = setTimeout(() => {
                this.hideErrorMessage()
            }, 3000)
        },
        
        /**
         * 隐藏错误提示弹窗
         */
        hideErrorMessage() {
            this.showErrorMsg = false
            this.errorMessageText = ''
            
            if (this.errorMessageTimer) {
                clearTimeout(this.errorMessageTimer)
                this.errorMessageTimer = null
            }
        },

        /**
         * 显示连接统计信息（控制台输出）
         */
        showConnectionStats() {
            if (this.socketManager) {
                const stats = this.socketManager.getStats()
                const health = this.socketManager.checkHealth()
                console.group('=== WebSocket连接统计 ===')
                console.log('连接状态:', this.connectionStatus)
                console.log('连接URL:', this.socketManager.url)
                console.log('统计信息:', stats)
                console.log('健康状态:', health)
                console.log('游戏信息:', {
                    tableId: this.tableId,
                    gameType: this.gameType,
                    userId: this.userId,
                    betState: this.betState ? '可下注' : '不可下注',
                    freebool: this.Freebool ? '免佣开' : '免佣关'
                })
                console.log('免佣设置详情:', this.getAllExemptSettings())
                console.groupEnd()
            } else {
                console.log('❌ Socket管理器未初始化')
            }
        },

        // ===== 本地存储免佣设置相关方法 =====

        /**
         * 设置免佣
         */
        setFree() {
            if(this.betSendFlag) return
            
            // 切换免佣状态
            const newFreebool = !this.Freebool
            
            console.log('🔄 切换免佣状态:', this.Freebool, '->', newFreebool)
            
            // 使用本地存储保存免佣设置
            this.saveExemptSettingLocal(newFreebool)
        },

        /**
         * 本地存储免佣设置
         */
        saveExemptSettingLocal(exemptStatus) {
            try {
                // 存储键格式：user_台桌_游戏类型
                const storageKey = `exempt_setting_${this.userId}_${this.tableId}_${this.gameType}`
                localStorage.setItem(storageKey, exemptStatus ? '1' : '0')
                
                this.Freebool = exemptStatus
                console.log(`💾 免佣设置已保存: 用户${this.userId} 台桌${this.tableId} 游戏${this.gameType} -> ${exemptStatus}`)
                console.log(`✅ [成功] 免佣已${exemptStatus ? '开启' : '关闭'}`)
                
            } catch (error) {
                console.error('❌ 本地存储失败:', error)
                this.displayErrorMessage('免佣设置保存失败')
            }
        },

        /**
         * 从本地存储获取免佣设置
         */
        getExemptSettingLocal() {
            try {
                const storageKey = `exempt_setting_${this.userId}_${this.tableId}_${this.gameType}`
                const stored = localStorage.getItem(storageKey)
                
                if (stored !== null) {
                    const exemptStatus = stored === '1'
                    console.log(`💾 从本地存储获取免佣设置: 用户${this.userId} 台桌${this.tableId} 游戏${this.gameType} -> ${exemptStatus}`)
                    return exemptStatus
                }
                
                console.log(`💾 没有找到本地免佣设置: 用户${this.userId} 台桌${this.tableId} 游戏${this.gameType}`)
                return null
            } catch (error) {
                console.error('❌ 读取本地存储失败:', error)
                return null
            }
        },

        /**
         * 清除指定台桌的免佣设置（可选功能）
         */
        clearExemptSetting() {
            try {
                const storageKey = `exempt_setting_${this.userId}_${this.tableId}_${this.gameType}`
                localStorage.removeItem(storageKey)
                console.log(`🗑️ 已清除免佣设置: ${storageKey}`)
            } catch (error) {
                console.error('❌ 清除本地存储失败:', error)
            }
        },

        /**
         * 获取用户所有台桌的免佣设置（调试用）
         */
        getAllExemptSettings() {
            try {
                const userPrefix = `exempt_setting_${this.userId}_`
                const allSettings = {}
                
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key && key.startsWith(userPrefix)) {
                        const value = localStorage.getItem(key)
                        allSettings[key] = value === '1'
                    }
                }
                
                console.log(`📋 用户${this.userId}的所有免佣设置:`, allSettings)
                return allSettings
            } catch (error) {
                console.error('❌ 获取所有免佣设置失败:', error)
                return {}
            }
        },

        // ===== 游戏业务逻辑方法 =====
        
        /**
         * 加载音频
         */
        loadAudio() {
            this.audioHandle.startSoundEffect('welcome.wav')
            this.audioHandle.startSoundBackground()
        },

        /**
         * 获取用户信息和常用筹码
         */
        getUserChipsInfos(type) {
            userService.userIndex().then((res) => {
                this.userInfo = res
                
                // 🔧 只从本地存储获取免佣设置，不依赖后端接口
                const localExemptSetting = this.getExemptSettingLocal()
                if (localExemptSetting !== null) {
                    // 使用本地存储的设置
                    this.Freebool = localExemptSetting
                    console.log('🎯 使用本地存储的免佣设置:', this.Freebool)
                } else {
                    // 如果本地没有设置，使用默认值 false（免佣关）
                    this.Freebool = false
                    console.log('🎯 首次进入台桌，使用默认免佣设置:', this.Freebool)
                    
                    // 将默认设置保存到本地存储
                    this.saveExemptSettingLocal(this.Freebool)
                }
                
                if(type && type == 'balance') {
                    return
                }
                
                if(res.user_chip && res.user_chip.length > 0) {
                    this.choiceChips = []
                    res.user_chip.forEach(el => {
                        allChips.forEach(chip => {
                            if(el.val == chip.val) {
                                this.choiceChips.push(chip)
                            }
                        })
                    })
                }else{
                    this.choiceChips = allChips.slice(1,6)
                }
                
                if (this.choiceChips.length > 0) {
                    this.handleCureentChip(this.choiceChips[0])
                }
            }).catch(err => {
                console.error('获取用户信息失败:', err)
                
                // 失败时从本地存储获取免佣设置
                const localExemptSetting = this.getExemptSettingLocal()
                if (localExemptSetting !== null) {
                    this.Freebool = localExemptSetting
                    console.log('⚠️ 用户信息获取失败，使用本地存储的免佣设置:', this.Freebool)
                } else {
                    // 如果本地也没有，使用默认值 false
                    this.Freebool = false
                    console.log('⚠️ 用户信息获取失败，使用默认免佣设置:', this.Freebool)
                    // 保存默认设置
                    this.saveExemptSettingLocal(this.Freebool)
                }
                
                // 失败时使用默认筹码
                this.choiceChips = allChips.slice(1,6)
                if (this.choiceChips.length > 0) {
                    this.handleCureentChip(this.choiceChips[0])
                }
            })
        },

        /**
         * 关闭欢迎消息
         */
        closeMsg(){
            this.showWelcomeMsg.show = false
            this.loadAudio()
        },

        /**
         * 设置游戏桌信息
         */
        setTableInfo(){
            if(this.bureauNumber != this.tableRunInfo.bureau_number) {
                this.bureauNumber = this.tableRunInfo.bureau_number
                // 新局开始时清除上一局的投注显示
                this.clearAllBetDisplay()
                this.getBetCurrentRecord()
            }
            
            if(this.tableRunInfo.end_time == 0 &&  this.tableRunInfo.run_status == 2 && this.stopMusicHasPlayed == false) {
                this.betState = false								
            }
            
            if(this.tableRunInfo.end_time == 0 ) {
                this.betState = false
            }
            
            if(this.tableRunInfo.end_time == 1) {
                setTimeout(() => {
                    this.audioHandle.startSoundEffect("stop.wav")
                }, 1000)
            }
            
            if(this.tableRunInfo.end_time != 0) {
                this.betState = true
            }
            
            if(this.tableRunInfo.end_time == this.startShowWelcomeTime) {
                this.audioHandle.startSoundEffect("bet.wav")
            }
        },

        /**
         * 开牌音效
         */
        runOpenMusicEffect(bureau_number) {
            if(this.bureauNumber != bureau_number) {
                this.bureauNumber = bureau_number
                this.audioHandle.startSoundEffect('OPENCARD.mp3')
                
                let time = 0
                setTimeout((win=0) => {
                    //主结果 =1 庄赢  =2 闲赢 =3 和牌 
                    switch(win) {
                        case 1:
                            if(this.gameType == 3) {
                                this.audioHandle.startSoundEffect(`bankerWin.wav`)
                            }else{
                                this.audioHandle.startSoundEffect(`dragonWin.wav`)
                            }
                        break
                        case 2:
                            if(this.gameType == 3) {
                                this.audioHandle.startSoundEffect(`playerWin.wav`)
                            }else{
                                this.audioHandle.startSoundEffect(`tigerWin.wav`)
                            }
                        break
                        case 3:
                            this.audioHandle.startSoundEffect(`tie.wav`)
                        break
                    }
                }, time, this.resultInfo.result ? this.resultInfo.result.win : 0)
            }
        },
        
        /**
         * 设置闪烁效果
         */
        setFlash(mark) {
            this.betTargetList.forEach(item => {
                item.flashClass = ''
            })
            
            if(mark == 'retry') {
                this.getUserChipsInfos('balance')
                this.getBetCurrentRecord()
                return
            }
            
            if(this.resultInfo.pai_flash && this.resultInfo.pai_flash.length > 0) {
                this.resultInfo.pai_flash.forEach(el => {
                    this.betTargetList.forEach(item => {
                        if(el == item.id) {
                            item.flashClass = 'bet-win-green-bg'
                        }
                    })
                })
            }
            
            setTimeout(() => {
                this.resultInfo = {}
                // 🔧 开牌5秒后立即清除所有筹码显示
                console.log('开牌结果显示结束，清除所有筹码')
                this.clearAllBetDisplay()
                // 重新获取下注记录（通常开牌后应该没有记录了）
                this.getBetCurrentRecord()
                this.receiveInfoState = false
            }, 5000)
        },

        /**
         * 清除所有投注区域的筹码显示和金额
         */
        clearAllBetDisplay() {
            console.log('🧹 清除所有投注区域显示')
            this.betTargetList.forEach(item => {
                item.betAmount = 0
                item.showChip = []
                item.flashClass = ''
            })
            // 重置下注状态
            this.betSendFlag = false
            this.betSuccess = false
            // 清空取消数据
            this.initCancelData()
            // 清空重复数据
            this.repeatData = []
            // 重置总金额
            this.total_money = 0
        },
        
        /**
         * 取消下注
         */
        handleCancel() {
            // 清除所有筹码显示
            this.clearAllBetDisplay()
            // 重新获取当前下注记录
            this.getBetCurrentRecord()
        },
        
        /**
         * 重复下注
         */
        repeatBet() {
            if(this.repeatData.length < 1) return
            
            this.audioHandle.startSoundEffect("betSound.mp3")
            this.betSuccess = false
            
            this.betTargetList.forEach((betItem, index) => {
                for (const repeat of this.repeatData) {
                    if(betItem.id == repeat.id) {
                        betItem.betAmount += repeat.betAmount
                        this.cancelData[index].betAmount += repeat.betAmount
                    }
                }
            })
        },
        
        /**
         * 确认下注
         */
        betOrder() {
            if(this.betSuccess) return
            
            let confirmData = []
            let total = 0
            
            this.betTargetList.forEach(item => {
                if (item.betAmount > 0 && item.id > 0) {
                    total += item.betAmount
                    confirmData.push({
                        money: item.betAmount,
                        rate_id: item.id,
                    })
                }
            })
            
            let realBalance = Number(this.userInfo.money_balance) + 
                             Number(this.userInfo.game_records?.bet_money || 0) + 
                             Number(this.userInfo.game_records?.deposit_money || 0)
            
            if(realBalance < total) {
                this.showLocalError(this.$t("publicWords.credit"))
                return
            }
            
            let data = {
                'bet': confirmData,
                'game_type': this.gameType,
                'table_id': this.tableId,
                'is_exempt': this.Freebool ? 1 : 0
            }
            
            bjlService.betOrder(data).then(res => {
                this.betSuccess = true
                this.betSendFlag = true
                this.repeatData = JSON.parse(JSON.stringify(this.betTargetList))
                this.initCancelData()
                this.audioHandle.startSoundEffect("betsuccess.mp3")
                this.getUserChipsInfos('balance')
            }).catch(err => {
                this.showLocalError(err.message || '下注失败')
                this.handleCancel()
            })
        },
        
        /**
         * 获取当前下注记录
         */
        getBetCurrentRecord() {
            bjlService.getBetCurrentRecord({
                id: this.tableId, 
                'game_type': this.gameType
            }).then(res => {
                // 先清空所有投注显示
                this.betTargetList.forEach((el) => {
                    el.betAmount = 0
                    el.showChip = []
                })
                
                // 检查是否有有效的下注记录
                const hasValidRecords = res.record_list && res.record_list.length > 0
                
                if (hasValidRecords) {
                    console.log('🎯 有下注记录，恢复投注显示')
                    this.betSendFlag = true
                    
                    // 恢复投注显示
                    this.betTargetList.forEach((el) => {
                        res.record_list.forEach(record => {
                            if(el.id == record.game_peilv_id) {
                                el.betAmount = Number(record.bet_amt)
                                el.showChip = this.conversionChip(el.betAmount)
                            }
                        })
                    })
                    this.repeatData = JSON.parse(JSON.stringify(this.betTargetList))
                } else {
                    console.log('🎯 没有下注记录，保持清空状态')
                    this.betSendFlag = false
                    this.repeatData = []
                    // 确保清空所有状态（初次进入或新局开始）
                    this.clearAllBetDisplay()
                }
            }).catch(err => {
                console.log('获取下注记录失败:', err)
                // 获取失败时也清空显示
                this.clearAllBetDisplay()
            })
        },
        
        /**
         * 执行下注
         */
        bet(target) {
            // 检查是否允许点投 - 这个需要发送到服务器
            if (this.tableRunInfo.is_dianji == 0) {
                this.sendErrorMessage(this.$t("publicWords.justDianTou"), true)
                return
            }
            
            // 检查点击间隔（防止过快点击）
            let t_now = new Date().getTime()
            let t_old = sessionStorage.getItem('last_bet_time_zg') ? sessionStorage.getItem('last_bet_time_zg') : 0
            let t_wait = 300
            sessionStorage.setItem('last_bet_time_zg', t_now)
            if (t_now - t_wait < t_old) {
                return
            }
            
            // 重置下注成功状态
            this.betSuccess = false
            
            // 检查是否在投注时间内 - 只显示本地提示，不发送给服务器
            if (!this.betState) {
                this.showLocalError(this.$t("publicWords.NonBettingTime"))
                return
            }
            
            // 检查是否选择了筹码 - 只显示本地提示
            if (!this.currentChip) {
                this.showLocalError('请先选择筹码')
                return
            }
            
            // 检查连接状态 - 只显示本地提示
            if (!this.isConnected) {
                this.showLocalError('网络连接中断，请稍候重试')
                return
            }
            
            // 执行投注逻辑
            this.betTargetList.forEach((item, index) => {
                if (item.value == target.value) {
                    this.audioHandle.startSoundEffect("betSound.mp3")
                    this.total_money += Number(this.currentChip.val)
                    item.betAmount += Number(this.currentChip.val)	
                    this.cancelData[index].betAmount += Number(this.currentChip.val)
                    item.showChip = this.conversionChip(item.betAmount)
                }
            })
        },
        
        /**
         * 初始化取消数据
         */
        initCancelData() {
            this.betTargetList.forEach((bet, index) => {
                this.cancelData[index] = {betAmount: 0, id: bet.id}
            })
        },
        
        /**
         * 转换筹码显示
         */
        conversionChip(money) {
            return this.findMaxChip(money)
        },
        
        /**
         * 查找最大筹码组合
         */
        findMaxChip(amount = 0, tempChips = []) {
            if (amount == 0) return tempChips
            
            let chip = {}
            for(let i = 0; i < allChips.length - 1; i++) {
                if(allChips[i].val <= Number(amount) && allChips[i + 1].val > Number(amount)) {
                    chip = allChips[i]
                    break
                } else {
                    chip = allChips[allChips.length - 1]
                }
            }
            
            let restAmount = amount - chip.val
            tempChips.push(chip)
            
            if(restAmount > 0) {
                return this.findMaxChip(restAmount, tempChips)
            }
            
            return tempChips
        },
        
        /**
         * 处理当前筹码选择
         */
        handleCureentChip(chip) {
            this.currentChip = chip
        },
        
        /**
         * 设置显示筹码选择
         */
        setShowChips(b) {
            this.showChips = b
        },
        
        /**
         * 处理筹码选择确认
         */
        handleConfirm(data) {
            this.choiceChips = data
            this.showChips = false
            
            let b = false
            this.choiceChips.forEach(chip => {
                if(this.currentChip && this.currentChip.index == chip.index) {
                    b = true
                }
            })
            
            if(!b && this.choiceChips.length > 0) {
                this.handleCureentChip(this.choiceChips[0])
            }
        },
        
        /**
         * 处理筹码选择错误
         */
        hanldeSelectChipError(data) {
            this.showLocalError(data.msg)
        },

        /**
         * 获取游戏对象列表 (兼容原版代码)
         */
        getObjects(callback) {
            if (callback && typeof callback === 'function') {
                return this.betTargetList.filter(callback)
            }
            return this.betTargetList
        }
    }
}