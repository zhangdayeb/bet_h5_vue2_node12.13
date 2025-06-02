// 优化后的WebSocket管理器
import configFile from "./config"

// WebSocket连接状态枚举
const CONNECTION_STATUS = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    FAILED: 'failed'
}

// 消息类型枚举
const MESSAGE_TYPES = {
    HEARTBEAT: 'heartbeat',
    BET: 'bet',
    GAME_STATUS: 'game_status',
    AUDIO_STATE: 'audio_state'
}

class OptimizedSocketManager {
    constructor(url, options = {}) {
        this.url = url
        this.ws = null
        this.status = CONNECTION_STATUS.DISCONNECTED
        
        // 配置选项
        this.options = {
            maxReconnectAttempts: 10,           // 最大重连次数
            reconnectInterval: 1000,            // 重连间隔(ms)
            maxReconnectInterval: 30000,        // 最大重连间隔
            heartbeatInterval: 30000,           // 心跳间隔
            responseTimeout: 10000,             // 响应超时时间
            enableAutoReconnect: true,          // 是否自动重连
            enableHeartbeat: true,              // 是否启用心跳
            enableMessageQueue: true,           // 是否启用消息队列
            maxQueueSize: 100,                  // 最大队列长度
            ...options
        }
        
        // 状态管理
        this.reconnectAttempts = 0
        this.reconnectTimer = null
        this.heartbeatTimer = null
        this.lastHeartbeatTime = 0
        this.isManualClose = false
        
        // 消息队列
        this.messageQueue = []
        this.pendingMessages = new Map() // 等待响应的消息
        
        // 事件监听器
        this.eventListeners = {
            open: [],
            message: [],
            close: [],
            error: [],
            statusChange: []
        }
        
        // 性能监控
        this.stats = {
            connectTime: 0,
            totalMessages: 0,
            errorCount: 0,
            reconnectCount: 0,
            avgLatency: 0,
            latencyHistory: []
        }
    }

    /**
     * 建立WebSocket连接
     */
    connect(initData = null) {
        if (this.status === CONNECTION_STATUS.CONNECTED || 
            this.status === CONNECTION_STATUS.CONNECTING) {
            console.warn('WebSocket already connected or connecting')
            return Promise.resolve()
        }

        return new Promise((resolve, reject) => {
            try {
                this.setStatus(CONNECTION_STATUS.CONNECTING)
                this.stats.connectTime = Date.now()
                
                this.ws = new WebSocket(this.url)
                
                // 连接成功
                this.ws.onopen = (event) => {
                    console.log('WebSocket connected:', this.url)
                    this.setStatus(CONNECTION_STATUS.CONNECTED)
                    this.reconnectAttempts = 0
                    
                    // 发送初始化数据
                    if (initData) {
                        this.send(initData)
                    }
                    
                    // 启动心跳
                    if (this.options.enableHeartbeat) {
                        this.startHeartbeat()
                    }
                    
                    // 处理队列中的消息
                    this.processMessageQueue()
                    
                    this.emit('open', event)
                    resolve(event)
                }

                // 接收消息
                this.ws.onmessage = (event) => {
                    this.handleMessage(event)
                }

                // 连接关闭
                this.ws.onclose = (event) => {
                    console.log('WebSocket closed:', event.code, event.reason)
                    this.setStatus(CONNECTION_STATUS.DISCONNECTED)
                    this.stopHeartbeat()
                    
                    this.emit('close', event)
                    
                    // 自动重连
                    if (!this.isManualClose && this.options.enableAutoReconnect) {
                        this.scheduleReconnect()
                    }
                }

                // 连接错误
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error)
                    this.stats.errorCount++
                    this.emit('error', error)
                    
                    if (this.status === CONNECTION_STATUS.CONNECTING) {
                        reject(error)
                    }
                }

                // 连接超时处理
                setTimeout(() => {
                    if (this.status === CONNECTION_STATUS.CONNECTING) {
                        this.ws.close()
                        reject(new Error('Connection timeout'))
                    }
                }, this.options.responseTimeout)

            } catch (error) {
                console.error('Failed to create WebSocket:', error)
                this.setStatus(CONNECTION_STATUS.FAILED)
                reject(error)
            }
        })
    }

    /**
     * 发送消息
     */
    send(data, options = {}) {
        const message = {
            id: this.generateMessageId(),
            timestamp: Date.now(),
            data: data,
            ...options
        }

        // 如果连接未就绪，加入队列
        if (this.status !== CONNECTION_STATUS.CONNECTED) {
            if (this.options.enableMessageQueue && 
                this.messageQueue.length < this.options.maxQueueSize) {
                this.messageQueue.push(message)
                console.log('Message queued:', message.id)
            } else {
                console.warn('Message dropped - connection not ready:', data)
            }
            return false
        }

        try {
            const payload = JSON.stringify(message.data)
            this.ws.send(payload)
            
            this.stats.totalMessages++
            
            // 如果需要响应，记录到待响应列表
            if (options.expectResponse) {
                this.pendingMessages.set(message.id, {
                    ...message,
                    sentTime: Date.now(),
                    timeout: setTimeout(() => {
                        this.pendingMessages.delete(message.id)
                        console.warn('Message response timeout:', message.id)
                    }, this.options.responseTimeout)
                })
            }
            
            console.log('Message sent:', message.id, data)
            return true
            
        } catch (error) {
            console.error('Failed to send message:', error, data)
            return false
        }
    }

    /**
     * 处理接收到的消息
     */
    handleMessage(event) {
        try {
            let data
            
            // 尝试解析JSON
            if (typeof event.data === 'string' && event.data.trim()) {
                try {
                    data = JSON.parse(event.data.trim())
                } catch (parseError) {
                    console.warn('Failed to parse message as JSON:', event.data)
                    data = { raw: event.data }
                }
            } else {
                data = { raw: event.data }
            }

            // 处理心跳响应
            if (this.isHeartbeatResponse(data)) {
                this.handleHeartbeatResponse()
                return
            }

            // 处理消息响应
            if (data.messageId && this.pendingMessages.has(data.messageId)) {
                this.handleMessageResponse(data.messageId, data)
            }

            // 触发消息事件
            this.emit('message', { data, originalEvent: event })
            
        } catch (error) {
            console.error('Error handling message:', error, event.data)
            this.stats.errorCount++
        }
    }

    /**
     * 启动心跳
     */
    startHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer)
        }

        this.heartbeatTimer = setInterval(() => {
            if (this.status === CONNECTION_STATUS.CONNECTED) {
                this.sendHeartbeat()
            }
        }, this.options.heartbeatInterval)
    }

    /**
     * 发送心跳
     */
    sendHeartbeat() {
        const heartbeatData = {
            type: MESSAGE_TYPES.HEARTBEAT,
            timestamp: Date.now(),
            use_target: 'heartbeat',
            post_position: 'bet'
        }
        
        this.lastHeartbeatTime = Date.now()
        this.send(heartbeatData, { isHeartbeat: true })
    }

    /**
     * 停止心跳
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer)
            this.heartbeatTimer = null
        }
    }

    /**
     * 处理心跳响应
     */
    handleHeartbeatResponse() {
        if (this.lastHeartbeatTime > 0) {
            const latency = Date.now() - this.lastHeartbeatTime
            this.updateLatencyStats(latency)
        }
    }

    /**
     * 更新延迟统计
     */
    updateLatencyStats(latency) {
        this.stats.latencyHistory.push(latency)
        
        // 只保留最近50次的延迟记录
        if (this.stats.latencyHistory.length > 50) {
            this.stats.latencyHistory.shift()
        }
        
        // 计算平均延迟
        this.stats.avgLatency = this.stats.latencyHistory.reduce((a, b) => a + b, 0) / 
                               this.stats.latencyHistory.length
    }

    /**
     * 安排重连
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached')
            this.setStatus(CONNECTION_STATUS.FAILED)
            return
        }

        this.setStatus(CONNECTION_STATUS.RECONNECTING)
        this.reconnectAttempts++
        this.stats.reconnectCount++

        // 指数退避算法
        const delay = Math.min(
            this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
            this.options.maxReconnectInterval
        )

        console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)

        this.reconnectTimer = setTimeout(() => {
            if (this.status === CONNECTION_STATUS.RECONNECTING) {
                this.connect()
            }
        }, delay)
    }

    /**
     * 处理消息队列
     */
    processMessageQueue() {
        while (this.messageQueue.length > 0 && 
               this.status === CONNECTION_STATUS.CONNECTED) {
            const message = this.messageQueue.shift()
            console.log('Processing queued message:', message.id)
            this.send(message.data, message)
        }
    }

    /**
     * 设置连接状态
     */
    setStatus(status) {
        if (this.status !== status) {
            const oldStatus = this.status
            this.status = status
            console.log(`WebSocket status changed: ${oldStatus} -> ${status}`)
            this.emit('statusChange', { oldStatus, newStatus: status })
        }
    }

    /**
     * 手动关闭连接
     */
    close(code = 1000, reason = 'Manual close') {
        this.isManualClose = true
        
        // 清理定时器
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        
        this.stopHeartbeat()
        
        // 关闭连接
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close(code, reason)
        }
        
        this.setStatus(CONNECTION_STATUS.DISCONNECTED)
    }

    /**
     * 重新连接
     */
    reconnect() {
        this.close()
        this.isManualClose = false
        this.reconnectAttempts = 0
        return this.connect()
    }

    /**
     * 事件监听
     */
    on(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback)
        }
    }

    /**
     * 移除事件监听
     */
    off(event, callback) {
        if (this.eventListeners[event]) {
            const index = this.eventListeners[event].indexOf(callback)
            if (index > -1) {
                this.eventListeners[event].splice(index, 1)
            }
        }
    }

    /**
     * 触发事件
     */
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error('Error in event callback:', error)
                }
            })
        }
    }

    /**
     * 生成消息ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * 判断是否为心跳响应
     */
    isHeartbeatResponse(data) {
        return data && (
            data.type === MESSAGE_TYPES.HEARTBEAT ||
            (typeof data === 'string' && data.includes('heartbeat'))
        )
    }

    /**
     * 处理消息响应
     */
    handleMessageResponse(messageId, data) {
        const pendingMessage = this.pendingMessages.get(messageId)
        if (pendingMessage) {
            clearTimeout(pendingMessage.timeout)
            this.pendingMessages.delete(messageId)
            
            const latency = Date.now() - pendingMessage.sentTime
            this.updateLatencyStats(latency)
            
            console.log(`Message response received: ${messageId}, latency: ${latency}ms`)
        }
    }

    /**
     * 获取连接状态
     */
    getStatus() {
        return this.status
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.stats,
            queueSize: this.messageQueue.length,
            pendingMessages: this.pendingMessages.size,
            connectionUptime: this.status === CONNECTION_STATUS.CONNECTED ? 
                            Date.now() - this.stats.connectTime : 0
        }
    }

    /**
     * 重置统计信息
     */
    resetStats() {
        this.stats = {
            connectTime: 0,
            totalMessages: 0,
            errorCount: 0,
            reconnectCount: 0,
            avgLatency: 0,
            latencyHistory: []
        }
    }

    /**
     * 检查连接健康状态
     */
    checkHealth() {
        const stats = this.getStats()
        const health = {
            status: this.status,
            isHealthy: true,
            issues: []
        }

        // 检查连接状态
        if (this.status !== CONNECTION_STATUS.CONNECTED) {
            health.isHealthy = false
            health.issues.push('Connection not established')
        }

        // 检查错误率
        if (stats.totalMessages > 0) {
            const errorRate = stats.errorCount / stats.totalMessages
            if (errorRate > 0.1) { // 错误率超过10%
                health.isHealthy = false
                health.issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`)
            }
        }

        // 检查延迟
        if (stats.avgLatency > 5000) { // 延迟超过5秒
            health.isHealthy = false
            health.issues.push(`High latency: ${stats.avgLatency}ms`)
        }

        // 检查队列积压
        if (stats.queueSize > this.options.maxQueueSize * 0.8) {
            health.isHealthy = false
            health.issues.push(`Message queue nearly full: ${stats.queueSize}`)
        }

        return health
    }
}

// 导出配置常量
export const SOCKET_URLS = {
    BJL: configFile.BJL_WS_URL,
    LH: configFile.LH_WS_URL,
    NN: configFile.NN_WS_URL,
    THREE: configFile.THREE_WS_URL
}

export { CONNECTION_STATUS, MESSAGE_TYPES, OptimizedSocketManager }