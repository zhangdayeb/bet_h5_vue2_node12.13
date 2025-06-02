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
	//背景音乐状态
	this.backgroundMusicState = ''
	//音效状态
	this.musicEffectSate = ''

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
	//启动音效
	this.startSoundEffect = (audioName) => {
        let mark = sessionStorage.getItem('language')
        let lanMark = {
            ch: 'Chinese',
            en: 'English',
            jpn: 'Japanese',
            kor: 'Korean',
            tha: 'Thai',
            vnm: 'Vietnamese'
        }
        this.musicEffecAudio.src = `${this.baseUrl}/${this.audioPath}/${lanMark[mark]}/${audioName}`
        
		if(this.musicEffectSate == 'on') {
			this.musicEffecAudio.play()
		}else{
			this.musicEffecAudio.pause()
		}
		
		// this.musicEffecAudio.addEventListener("canplay", () => {
		// 	this.musicEffecAudio.play()
		// });
	}
	//关闭音效
	this.closeSoundEffect = () => {
		this.musicEffecAudio.pause()
	} 
	
	//启动背景音乐
	this.startSoundBackground = () => {
		this.backgroundAudio.src = this.baseUrl + '/backgroundmusic/bg001.mp3'
		if(this.backgroundMusicState == 'on') {
			this.backgroundAudio.play()
		}else{
			this.backgroundAudio.pause()
		}
		
		// this.backgroundAudio.addEventListener("canplay", () => {
		// 	this.backgroundAudio.play()
		// });
		
	}

	/**
	 * 设置背景播放状态
	 * @param state on 或者 off
	 * **/
	this.setBackgroundMusicState = (state) => {
		this.backgroundMusicState = state
	}

	/**
	 * 设置音效播放状态
	 * @param state on 或者 off
	 * **/
	this.setMusicEffectSate = (state) => {
		this.musicEffectSate = state
	}
	/**
	 * 关闭背景音乐
	 */
	this.closeSoundBackground = () => {
		this.backgroundAudio.pause()
	}
	
}

export default AudioHandle