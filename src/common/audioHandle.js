//音乐类型 背景音乐  音效
const MUSIC_TYPE = {
	backgroundMusicState: 'backgroundMusicState',
	musicEffectSate: 'musicEffectSate',
	LivePageState:'LivePageState'
}

//音频
function AudioHandle() {
	this.baseUrl = "https://resourceapi.wuming888.com/resources" // 主网资源地址
	//音频路径
	this.audioPath = ''
	//背景音乐状态 - 🔧 修复：默认设置为 'on'
	this.backgroundMusicState = 'on'
	//音效状态 - 🔧 修复：默认设置为 'on'
	this.musicEffectSate = 'on'

    //检测是否播放
	this.backgroundAudioPlayState = false
	this.backgroundAudio = new Audio()
	// 背景音乐初始化 设置
	
	this.backgroundAudio.src = this.baseUrl + '/backgroundmusic/bg001.mp3'
	this.backgroundAudio.loop = true
	
	this.musicEffecAudio = new Audio()
	this.musicEffecAudio.autoplay = true
	// 音效初始化 设置
	this.musicEffecAudio.src = ''
	
	//启动音效 - 🔧 修复：添加安全检查和错误处理
	this.startSoundEffect = (audioName) => {
        let mark = sessionStorage.getItem('language') || 'ch' // 🔧 提供默认值
        let lanMark = {
            ch: 'Chinese',
            en: 'English',
            jpn: 'Japanese',
            kor: 'Korean',
            tha: 'Thai',
            vnm: 'Vietnamese'
        }
        
        // 🔧 检查必要参数
        if (!this.audioPath) {
            console.warn('⚠️ audioPath 未设置，无法播放音效')
            return false
        }
        
        if (!audioName) {
            console.warn('⚠️ audioName 为空，无法播放音效')
            return false
        }
        
        const audioUrl = `${this.baseUrl}/${this.audioPath}/${lanMark[mark]}/${audioName}`
        console.log('🔊 尝试播放音效:', audioUrl)
        
        this.musicEffecAudio.src = audioUrl
        
        // 🔧 修复：添加调试日志并使用 Promise
        console.log('🎵 音效状态:', this.musicEffectSate)
        
        if(this.musicEffectSate === 'on') {
            this.musicEffecAudio.play().then(() => {
                console.log('✅ 音效播放成功:', audioName)
            }).catch(error => {
                console.error('❌ 音效播放失败:', error)
            })
        } else {
            console.log('🔇 音效已关闭，不播放:', audioName)
            this.musicEffecAudio.pause()
        }
        
        return true
	}
	
	//关闭音效
	this.closeSoundEffect = () => {
		this.musicEffecAudio.pause()
		console.log('🔊 音效已暂停')
	} 
	
	//启动背景音乐 - 🔧 修复：添加调试日志和错误处理
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

	/**
	 * 设置背景播放状态
	 * @param state on 或者 off
	 * **/
	this.setBackgroundMusicState = (state) => {
		console.log('🎵 设置背景音乐状态:', state)
		this.backgroundMusicState = state
	}

	/**
	 * 设置音效播放状态
	 * @param state on 或者 off
	 * **/
	this.setMusicEffectSate = (state) => {
		console.log('🔊 设置音效状态:', state)
		this.musicEffectSate = state
	}
	
	/**
	 * 关闭背景音乐
	 */
	this.closeSoundBackground = () => {
		this.backgroundAudio.pause()
		this.backgroundAudioPlayState = false
		console.log('🎵 背景音乐已暂停')
	}
	
}

export default AudioHandle