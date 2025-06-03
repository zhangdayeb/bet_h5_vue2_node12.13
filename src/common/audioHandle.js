// src/common/audioHandle.js - 修复版本
// 解决中奖音效重复请求的问题 - 使用可用音效文件

//音乐类型 背景音乐  音效
const MUSIC_TYPE = {
    backgroundMusicState: 'backgroundMusicState',
    musicEffectSate: 'musicEffectSate',
    LivePageState:'LivePageState'
}

//音频
function AudioHandle() {
    this.baseUrl = "https://resourceapi.wuming888.com/resources" // 主网资源地址
    this.audioPath = ''
    this.backgroundMusicState = 'on'
    this.musicEffectSate = 'on'

    // 🆕 新增：多音频实例管理
    this.backgroundAudioPlayState = false
    this.backgroundAudio = new Audio()
    
    // 🔧 修复：分离音效实例，避免冲突
    this.musicEffecAudio = new Audio()        // 普通音效
    this.winningAudio = new Audio()           // 专用中奖音效
    this.priorityAudio = new Audio()          // 高优先级音效
    
    // 🆕 新增：音频队列管理
    this.audioQueue = []
    this.isPlayingSequence = false
    
    // 🆕 新增：中奖音效保护机制
    this.winningAudioProtected = false
    this.winningAudioTimer = null

    // 🔧 新增：播放状态管理（防重复请求）
    this.isPlayingWinningSound = false  // 中奖音效播放状态
    this.playingAudioUrls = new Set()   // 正在播放的音频URL集合

    // 背景音乐初始化
    this.backgroundAudio.src = this.baseUrl + '/backgroundmusic/bg001.mp3'
    this.backgroundAudio.loop = true
    
    // 普通音效初始化
    this.musicEffecAudio.autoplay = true
    this.musicEffecAudio.src = ''
    
    // 🆕 中奖音效初始化
    this.winningAudio.autoplay = true
    this.winningAudio.src = ''
    
    // 🆕 高优先级音效初始化
    this.priorityAudio.autoplay = true
    this.priorityAudio.src = ''

    // ================================
    // 🔧 修复：防重复请求的中奖音效播放 - 使用可用音效
    // ================================
    
    /**
     * 播放中奖音效（高优先级，防重复请求）
     * @param {string} audioName - 音效文件名
     * @returns {boolean} 是否成功播放
     */
    this.playWinningSound = (audioName = 'betsuccess.mp3') => {  // 🔧 使用可用的音效文件
        console.log('🎉 播放专用中奖音效（高优先级）:', audioName)
        
        // 🔧 防重复播放检查
        if (this.isPlayingWinningSound) {
            console.log('🔇 中奖音效正在播放中，跳过重复请求')
            return false
        }
        
        if (!this.audioPath) {
            console.warn('⚠️ audioPath 未设置，无法播放中奖音效')
            return false
        }
        
        if (this.musicEffectSate !== 'on') {
            console.log('🔇 音效已关闭，不播放中奖音效')
            return false
        }

        let mark = sessionStorage.getItem('language') || 'ch'
        let lanMark = {
            ch: 'Chinese',
            en: 'English',
            jpn: 'Japanese',
            kor: 'Korean',
            tha: 'Thai',
            vnm: 'Vietnamese'
        }
        
        const audioUrl = `${this.baseUrl}/${this.audioPath}/${lanMark[mark]}/${audioName}`
        
        // 🔧 检查是否已经在播放相同的音频
        if (this.playingAudioUrls.has(audioUrl)) {
            console.log('🔇 相同音频已在播放，跳过重复请求:', audioUrl)
            return false
        }
        
        console.log('🎉 中奖音效URL:', audioUrl)
        
        // 🔧 设置播放状态
        this.isPlayingWinningSound = true
        this.playingAudioUrls.add(audioUrl)
        
        // 🔧 使用专用的中奖音频实例
        this.winningAudio.src = audioUrl
        
        // 🆕 设置中奖音效保护期（防止被打断）
        this.winningAudioProtected = true
        
        // 🆕 清除之前的保护定时器
        if (this.winningAudioTimer) {
            clearTimeout(this.winningAudioTimer)
        }
        
        // 🔧 播放成功处理
        this.winningAudio.onended = () => {
            console.log('✅ 中奖音效播放完成:', audioName)
            this.resetWinningAudioState(audioUrl)
        }
        
        // 🔧 播放失败处理
        this.winningAudio.onerror = (error) => {
            console.error('❌ 中奖音效播放失败:', error)
            this.resetWinningAudioState(audioUrl)
        }
        
        // 🔧 开始播放
        this.winningAudio.play().then(() => {
            console.log('✅ 中奖音效开始播放:', audioName)
            
            // 🆕 设置保护期结束定时器（3秒后允许被打断）
            this.winningAudioTimer = setTimeout(() => {
                this.winningAudioProtected = false
                console.log('🔓 中奖音效保护期结束')
            }, 3000)
            
        }).catch(error => {
            console.error('❌ 中奖音效播放启动失败:', error)
            this.resetWinningAudioState(audioUrl)
        })
        
        return true
    }

    /**
     * 🔧 重置中奖音效播放状态
     * @param {string} audioUrl - 音频URL
     */
    this.resetWinningAudioState = (audioUrl) => {
        this.isPlayingWinningSound = false
        this.winningAudioProtected = false
        this.playingAudioUrls.delete(audioUrl)
        
        if (this.winningAudioTimer) {
            clearTimeout(this.winningAudioTimer)
            this.winningAudioTimer = null
        }
        
        console.log('🔄 中奖音效状态已重置')
    }

    /**
     * 播放普通音效（会检查中奖音效保护期）
     * @param {string} audioName - 音效文件名
     * @returns {boolean} 是否成功播放
     */
    this.startSoundEffect = (audioName) => {
        // 🔧 关键修复：检查中奖音效保护期
        if (this.winningAudioProtected) {
            console.log('🛡️ 中奖音效保护期内，延迟播放普通音效:', audioName)
            
            // 🆕 将音效加入队列，等待播放
            this.addToAudioQueue(audioName, 'normal')
            return false
        }

        let mark = sessionStorage.getItem('language') || 'ch'
        let lanMark = {
            ch: 'Chinese',
            en: 'English',
            jpn: 'Japanese',
            kor: 'Korean',
            tha: 'Thai',
            vnm: 'Vietnamese'
        }
        
        if (!this.audioPath) {
            console.warn('⚠️ audioPath 未设置，无法播放音效')
            return false
        }
        
        if (!audioName) {
            console.warn('⚠️ audioName 为空，无法播放音效')
            return false
        }
        
        const audioUrl = `${this.baseUrl}/${this.audioPath}/${lanMark[mark]}/${audioName}`
        console.log('🔊 播放普通音效:', audioUrl)
        
        this.musicEffecAudio.src = audioUrl
        
        if(this.musicEffectSate === 'on') {
            this.musicEffecAudio.play().then(() => {
                console.log('✅ 普通音效播放成功:', audioName)
            }).catch(error => {
                console.error('❌ 普通音效播放失败:', error)
            })
        } else {
            console.log('🔇 音效已关闭，不播放:', audioName)
            this.musicEffecAudio.pause()
        }
        
        return true
    }

    // ================================
    // 🆕 新增：音频队列管理
    // ================================
    
    /**
     * 添加音效到队列
     * @param {string} audioName - 音效文件名
     * @param {string} priority - 优先级 ('high', 'normal', 'low')
     */
    this.addToAudioQueue = (audioName, priority = 'normal') => {
        this.audioQueue.push({
            audioName,
            priority,
            timestamp: Date.now()
        })
        
        console.log('📋 音效已加入队列:', audioName, '优先级:', priority)
        
        // 🆕 如果不在保护期，立即处理队列
        if (!this.winningAudioProtected && !this.isPlayingSequence) {
            this.processAudioQueue()
        }
    }
    
    /**
     * 处理音频队列
     */
    this.processAudioQueue = () => {
        if (this.audioQueue.length === 0 || this.isPlayingSequence) {
            return
        }
        
        // 🆕 检查是否还在中奖音效保护期
        if (this.winningAudioProtected) {
            console.log('🛡️ 仍在中奖音效保护期，延迟处理队列')
            setTimeout(() => this.processAudioQueue(), 500)
            return
        }
        
        this.isPlayingSequence = true
        
        // 🆕 按优先级排序队列
        this.audioQueue.sort((a, b) => {
            const priorityOrder = { high: 3, normal: 2, low: 1 }
            return priorityOrder[b.priority] - priorityOrder[a.priority]
        })
        
        console.log('📋 开始处理音频队列，共', this.audioQueue.length, '个音效')
        
        this.playNextInQueue()
    }
    
    /**
     * 播放队列中的下一个音效
     */
    this.playNextInQueue = () => {
        if (this.audioQueue.length === 0) {
            this.isPlayingSequence = false
            console.log('✅ 音频队列处理完成')
            return
        }
        
        const nextAudio = this.audioQueue.shift()
        console.log('🔊 播放队列音效:', nextAudio.audioName)
        
        // 🆕 使用队列专用的播放方法
        this.playQueuedSound(nextAudio.audioName, () => {
            // 🆕 播放完成后，延迟200ms播放下一个
            setTimeout(() => this.playNextInQueue(), 200)
        })
    }
    
    /**
     * 播放队列中的音效
     * @param {string} audioName - 音效文件名
     * @param {Function} onComplete - 播放完成回调
     */
    this.playQueuedSound = (audioName, onComplete) => {
        let mark = sessionStorage.getItem('language') || 'ch'
        let lanMark = {
            ch: 'Chinese',
            en: 'English',
            jpn: 'Japanese',
            kor: 'Korean',
            tha: 'Thai',
            vnm: 'Vietnamese'
        }
        
        const audioUrl = `${this.baseUrl}/${this.audioPath}/${lanMark[mark]}/${audioName}`
        
        // 🆕 使用优先级音频实例播放队列音效
        this.priorityAudio.src = audioUrl
        
        this.priorityAudio.onended = () => {
            console.log('✅ 队列音效播放完成:', audioName)
            if (onComplete) onComplete()
        }
        
        this.priorityAudio.onerror = (error) => {
            console.error('❌ 队列音效播放失败:', audioName, error)
            if (onComplete) onComplete()
        }
        
        if (this.musicEffectSate === 'on') {
            this.priorityAudio.play().catch(error => {
                console.error('❌ 队列音效播放异常:', error)
                if (onComplete) onComplete()
            })
        } else {
            if (onComplete) onComplete()
        }
    }

    // ================================
    // 🔧 修复：中奖音效序列播放 - 使用可用音效
    // ================================
    
    /**
     * 播放中奖音效序列（根据金额）
     * @param {number} amount - 中奖金额
     */
    this.playWinSoundByAmount = (amount) => {
        console.log('🎵 根据金额播放中奖音效序列:', amount)
        
        // 🆕 设置长时间保护期（防止序列被打断）
        this.winningAudioProtected = true
        
        if (this.winningAudioTimer) {
            clearTimeout(this.winningAudioTimer)
        }
        
        if (amount >= 50000) {
            // 🔧 超级大奖音效序列 - 使用可用音效
            this.playWinningSound('betsuccess.mp3')
            setTimeout(() => this.playWinningSound('betsuccess.mp3'), 1000)
            setTimeout(() => this.playWinningSound('betSound.mp3'), 2000)
            
            // 🆕 超级大奖保护期更长
            this.winningAudioTimer = setTimeout(() => {
                this.winningAudioProtected = false
                this.processAudioQueue() // 处理队列中的音效
                console.log('🔓 超级大奖音效序列保护期结束')
            }, 5000)
            
        } else if (amount >= 10000) {
            // 🔧 大奖音效序列 - 使用可用音效
            this.playWinningSound('betsuccess.mp3')
            setTimeout(() => this.playWinningSound('betSound.mp3'), 800)
            
            this.winningAudioTimer = setTimeout(() => {
                this.winningAudioProtected = false
                this.processAudioQueue()
                console.log('🔓 大奖音效序列保护期结束')
            }, 4000)
            
        } else if (amount >= 1000) {
            // 🔧 中等奖音效序列 - 使用可用音效
            this.playWinningSound('betsuccess.mp3')
            setTimeout(() => this.playWinningSound('betSound.mp3'), 500)
            
            this.winningAudioTimer = setTimeout(() => {
                this.winningAudioProtected = false
                this.processAudioQueue()
                console.log('🔓 中等奖音效序列保护期结束')
            }, 3000)
            
        } else if (amount > 0) {
            // 🔧 小奖音效 - 使用可用音效
            this.playWinningSound('betsuccess.mp3')
            
            this.winningAudioTimer = setTimeout(() => {
                this.winningAudioProtected = false
                this.processAudioQueue()
                console.log('🔓 小奖音效保护期结束')
            }, 2000)
        }
    }

    // ================================
    // 修改原有方法（保持兼容性）
    // ================================
    
    // 关闭音效 - 🔧 修复：不影响中奖音效
    this.closeSoundEffect = () => {
        // 🔧 只暂停普通音效，不影响中奖音效
        this.musicEffecAudio.pause()
        console.log('🔊 普通音效已暂停（中奖音效继续播放）')
    }
    
    // 启动背景音乐
    this.startSoundBackground = () => {
        this.backgroundAudio.src = this.baseUrl + '/backgroundmusic/bg001.mp3'
        
        console.log('🎵 背景音乐状态:', this.backgroundMusicState)
        
        if(this.backgroundMusicState === 'on') {
            this.backgroundAudio.play().then(() => {
                console.log('✅ 背景音乐播放成功')
                this.backgroundAudioPlayState = true
            }).catch(error => {
                console.error('❌ 背景音乐播放失败:', error)
            })
        } else {
            console.log('🔇 背景音乐已关闭，不播放')
            this.backgroundAudio.pause()
            this.backgroundAudioPlayState = false
        }
    }

    this.setBackgroundMusicState = (state) => {
        console.log('🎵 设置背景音乐状态:', state)
        this.backgroundMusicState = state
    }

    this.setMusicEffectSate = (state) => {
        console.log('🔊 设置音效状态:', state)
        this.musicEffectSate = state
    }
    
    this.closeSoundBackground = () => {
        this.backgroundAudio.pause()
        this.backgroundAudioPlayState = false
        console.log('🎵 背景音乐已暂停')
    }

    // ================================
    // 🆕 新增：状态查询方法
    // ================================
    
    /**
     * 获取音频状态
     */
    this.getAudioStatus = () => {
        return {
            backgroundMusicState: this.backgroundMusicState,
            musicEffectSate: this.musicEffectSate,
            winningAudioProtected: this.winningAudioProtected,
            isPlayingWinningSound: this.isPlayingWinningSound,
            audioQueueLength: this.audioQueue.length,
            isPlayingSequence: this.isPlayingSequence,
            playingAudioUrls: Array.from(this.playingAudioUrls)
        }
    }
    
    /**
     * 强制清除中奖音效保护（紧急情况使用）
     */
    this.clearWinningProtection = () => {
        console.log('🚨 强制清除中奖音效保护期')
        this.winningAudioProtected = false
        this.isPlayingWinningSound = false
        this.playingAudioUrls.clear()
        
        if (this.winningAudioTimer) {
            clearTimeout(this.winningAudioTimer)
            this.winningAudioTimer = null
        }
        
        // 🆕 处理积压的音效队列
        this.processAudioQueue()
    }
    
    /**
     * 清空音效队列
     */
    this.clearAudioQueue = () => {
        console.log('🧹 清空音效队列')
        this.audioQueue = []
        this.isPlayingSequence = false
    }

    /**
     * 🔧 强制停止所有中奖音效
     */
    this.stopAllWinningAudio = () => {
        console.log('🔇 强制停止所有中奖音效')
        
        // 停止音频播放
        if (this.winningAudio) {
            this.winningAudio.pause()
            this.winningAudio.currentTime = 0
        }
        
        // 重置所有状态
        this.isPlayingWinningSound = false
        this.winningAudioProtected = false
        this.playingAudioUrls.clear()
        
        // 清除定时器
        if (this.winningAudioTimer) {
            clearTimeout(this.winningAudioTimer)
            this.winningAudioTimer = null
        }
    }
}

export default AudioHandle