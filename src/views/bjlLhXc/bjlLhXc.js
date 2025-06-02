import chips from '@/common/allChipList.js'
import SelectChip from '@/components/SelectChip'
import bjlService from '@/service/bjlService'
import userService from '@/service/userService.js'
import {BJL_URL, LH_URL, SocketTask} from '@/utils/socket'
import tools from '@/utils/tools'
import msgCode from '@/utils/msgCode'
import BetBtnsXc from '@/components/BtnsXc'
import AudioHandle from '@/common/audioHandle.js'
import WelcomeMssage from '@/components/Welcome.vue'
import { isReactive } from '@vue/reactivity'


let canvas = null
//所有的筹码
const allChips = chips.allChips
//下注区域的名字
const allowBetName = 'allow-bet'
export default {
    name: 'BetBjlAndLh',
    components: {
        SelectChip,
        BetBtnsXc,
        WelcomeMssage
    },
	data(){
		return {
            //ws任务
            socketTask: null,
            //免佣
            noFree: 1,
            //下注发送到后台状态
            betSendFlag: false, 
            //是否可以下注 有时间状态才能下注
            betState: false,
            //游戏类型
            gameType: '',
            //初始化音频
            audioHandle: new AudioHandle(),
            //游戏桌编号 
            tableId: '',
            //选择的筹码
            choiceChips: [],
            //当前选择筹码
            currentChip: null,
            //打开选择筹码
            showChips: false,
            // 欢迎光临信息
            welcomeMsg:'欢迎光临XXX游戏',							
            betTargetListBjl: [
            // {
            //     id: 3,
            //     label: '幸运6',
            //     value: 'lucky',
            //     className: 'bet-lucky',
            //     imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/lucky.png`),
            //     color:'white',
            //     textShadow: '0 0 blue',
            //     odds: '',
            //     imgWidth: 55,
            //     betAmount: 0,
            //     showChip: [],
            // }, 
            {
			    id: 6,
			    label: this.$t("bjlLhXc.Plyer"),
                ratio: '1:1',
			    value: 'idle',
			    className: 'bet-idle',
			    color:'',
			    odds: '',
			    betAmount: 0,
			    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/xian.png`),
			    showChip: [],
			    imgWidth: 30,
			    total_amount: 0,
			    total_population: 0,
			}, 
			{
			    id: 7,
			    label: this.$t("bjlLhXc.Tie"),
                ratio: '1:8',
			    value: 'peace',
			    className: 'bet-peace',
			    color:'',
			    odds: '',
			    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/he.png`),
			    betAmount: 0,
			    showChip: [],
			    imgWidth: 30,
			    total_amount: 0,
			    total_population: 0,
			},
			{
                id: 8,
                label: this.$t("bjlLhXc.Banker"),
                ratio: '1:0.95',
                value: 'zhuang',
                className: 'bet-zhuang',
                color:'',
                imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/zhuang.png`),
                odds: '',
                betAmount: 0,
                showChip: [],
                imgWidth:30,
                total_amount: 0,
                total_population: 0,
            },
			{
			    id: 2,
			    label: this.$t("bjlLhXc.PPair"),
                ratio: '1:11',
			    value: 'idle-Pair',
			    className: 'bet-idle-Pair',
			    color:'white',
			    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/xian_pair.png`),
			    textShadow: '0 0 blue',
			    odds: '',
			    betAmount: 0,
			    showChip: [],
			    imgWidth: 47,
			    total_amount: 0,
			    total_population: 0,
			},
			{
			    id:4,
			    label: this.$t("bjlLhXc.BPair"),
                ratio: '1:11',
			    value: 'zhuang-Pair',
			    className: 'bet-zhuang-Pair',
			    color:'white',
			    textShadow: '0 0 blue',
			    imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/zhuang_pair.png`),
			    odds: '',
			    betAmount: 0,
			    showChip: [],
			    imgWidth: 47,
			    total_amount: 0,
			    total_population: 0,
			}
			],
            /**
             * 龙虎桌子
            */
            betTargetListLongHu: [
				{
				    id: 20,
				    label: '龙',
				    value: 'zhuang',
				    className: 'bet-idle',
					color:'',
					imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/dragon.png`),
				    odds: '',
				    betAmount: 0,
				    showChip: [],
                    imgWidth: 40,
				    total_amount: 0,
				    total_population: 0,
				},
				{
                    id: 22,
                    label: '和',
                    value: 'peace',
                    className: 'bet-peace',
					color:'',
                    odds: '',
					imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/lh_he.png`),
                    betAmount: 0,
                    showChip: [],
                    imgWidth: 40,
                    total_amount: 0,
                    total_population: 0,
                },
				{
				    id: 21,
				    label: '虎',
				    value: 'idle',
				    className: 'bet-idle',
					color:'',
				    odds: '',
				    betAmount: 0,
					imgUrl: require(`@/assets/imgs/bet/${this.$VueI18n.global.locale}/tigger.png`),
				    showChip: [],
                    imgWidth: 40,
				    total_amount: 0,
				    total_population: 0,
			}],
            //下注列表
            betTargetList : [],
            // 重复数据
            repeatData: [],
            //需要取消的下注数据
            cancelData: [],
            //下注状态  当局投注的状态下注是否成功
            betSuccess: false,
            //游戏运行信息
            tableRunInfo: {},
            //开牌结果 用于闪烁效果
            resultInfo: {},
            //局号
            bureauNumber: '',
            //可点击下注 防止点击过快
            availableClickBet: true,
            //接收到开牌结果
            receiveInfoState: false,
            //欢迎语窗口
            showWelcomeMsg : {
                show: false,
                initShow: false
            },
            //已开局请下注
            startShowWelcomeTime: 29,
            //用户信息
            userInfo: {},
            // //音频是否状态
            // audioState: {
            //     backgroundMusicState: '',
            //     musicEffectSate: ''
            // }
		}
	},
    created() {
        this.tableId = this.$route.query.table_id
        this.gameType = this.$route.query.game_type
        this.betTargetList = this.gameType == 3 ? this.betTargetListBjl : this.betTargetListLongHu
        this.userId = this.$route.query.user_id
        this.getUserChipsInfos()
        this.getBetCurrentRecord()
        this.handleCureentChip(this.choiceChips[0])
        this.initCancelData()
        this.initSocket()

        if(this.gameType == 3){
            this.audioHandle.audioPath = 'bjl'
            this.welcomeMsg = this.$t("bjlAndLh.welcomeBjl")						
        }
        if(this.gameType == 2){
            this.audioHandle.audioPath = 'longhu'
            this.welcomeMsg = this.$t("bjlAndLh.welcomeLh")					
        }
    },
	mounted(){
	},
    destroyed(){
        this.socketTask.close()
    },
	methods: {
        /**
         * 加载音频
         * **/
        loadAudio() {
            this.audioHandle.startSoundEffect('welcome.wav')
            this.audioHandle.startSoundBackground()
        },

        /**
         * 获取用户信息取常用筹码
         * @param type balance 只为获取用户当前余额
         * **/
         getUserChipsInfos(type) {
            userService.userIndex().then((res) => {
                this.userInfo = res
                if(type && type == 'balance') {
                    return
                }
                if(res.user_chip.length > 0) {
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
                this.handleCureentChip(this.choiceChips[0])
            })
        },
        /**
         * 初始化 socket 链接信息
         */
        initSocket(){
            this.socketTask = this.gameType == 3 ? new SocketTask(BJL_URL) : new SocketTask(LH_URL)
            // 监听 socket 连接开始发送信息，{台桌ID 游戏类型 用户ID}
            this.socketTask.open(res => {		
                this.socketTask.send({table_id: this.tableId, game_type: this.gameType, user_id: this.userId+'_'})
            })
            this.receiveMsg()
        },

        /**
         * 关闭提示消息
         */
        closeMsg(){
            this.showWelcomeMsg.show = false
            // 增加 结束
            this.loadAudio()
        },
        /**
         * 接收开牌信息 主要是
         * 注意 音频播放的时候 手机浏览器要慢点，所以时间稍微长一点才可以
         */
        receiveMsg() {
            this.socketTask.receiveMsg(res => {
                // 如果空数据，则不处理 
                if(!tools.isJSON(res.data.trim())) {
                    this.tableRunInfo.end_time = 0
                    return
                }
                let result = JSON.parse(res.data)					
                //倒计时 开牌状态信息
                if( result.data && result.data.table_run_info) {
                    this.tableRunInfo = result.data.table_run_info
                    this.setTableInfo()
                    return
                }
                //设置音频播放状态
                if(result.code == msgCode.code.audioState) {
                    if(result.data.voiceSwitch) {
                        // alert(result.data[0].voiceSwitch)
                    }
                    // this.audioState = result.msg
                    if(this.audioHandle.backgroundMusicState != result.msg.backgroundMusicState) {
                        this.audioHandle.setBackgroundMusicState(result.msg.backgroundMusicState)
                        this.showWelcomeMsg.initShow ? this.audioHandle.startSoundBackground() : ''
                    }
                    if(this.audioHandle.musicEffectSate != result.msg.musicEffectSate) {
                        this.audioHandle.setMusicEffectSate(result.msg.musicEffectSate)
                    }
                    if(!this.showWelcomeMsg.initShow) {
                        this.showWelcomeMsg.show = true
                        this.showWelcomeMsg.initShow = true
                    }
                }
                if(result.code == msgCode.code.outRange || result.code == msgCode.code.success) {
                   this.availableClickBet = true 
                }
                //以下是开牌结果  // 非空信息 即开奖信息
                if(!result.data || !result.data.result_info) {
                    return
                }
                //不是该桌的游戏结果不展示 
                if(result.data.result_info.table_info.game_type != this.gameType || 
                result.data.result_info.table_info.table_id != this.tableId || this.tableRunInfo.end_time > 0) {
                    return
                }
                // 如果正常状态
                if(result.code == 200 && !this.receiveInfoState) {
                    this.receiveInfoState = true						
                    this.resultInfo = result.data.result_info	
                    // 赋值开牌结果过来 自动展示				
                    this.runOpenMusicEffect(result.data.bureau_number)
                    this.setFlash()
                }
            })
        },

        /**
         * 有开牌结果的时候，执行的音乐播放
         * @param {Object} bureau_number
         */
        runOpenMusicEffect(bureau_number){
            // 如果获取的消息是新的 一局 也就是铺号不同
            if(this.bureauNumber != bureau_number) {
                this.bureauNumber = bureau_number		// 更新铺号
                this.audioHandle.startSoundEffect('OPENCARD.mp3')
                let time = 0
				// setTimeout(() => {
    //                 if(this.gameType == 3) {
    //                     this.audioHandle.startSoundEffect(`player${this.resultInfo.result.xian_point}.wav`)
    //                 }else{
    //                     let point = this.resultInfo.result.tigger > 9 ? 0 : this.resultInfo.result.tigger
    //                     this.audioHandle.startSoundEffect(`tiger${point}.wav`)
    //                 }
				// },time)
				// setTimeout(() => {
    //                 if(this.gameType == 3) {
    //                     this.audioHandle.startSoundEffect(`banker${this.resultInfo.result.zhuang_point}.wav`)
    //                 }else{
    //                     let point = this.resultInfo.result.dragon > 9 ? 0 : this.resultInfo.result.dragon
    //                     this.audioHandle.startSoundEffect(`dragon${point}.wav`)
    //                 }
				// },time + 2500)
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
				}, time,this.resultInfo.result.win)
			}
		},
        /**
         * 设置闪烁
         * @param mark 是否闪烁
        */
        setFlash(mark) {
            this.betTargetList.forEach(item =>{
                item.flashClass = ''
            })
            if(mark == 'retry') {
                userService.userIndex().then((res) => {
                    this.userInfo = res
                })
                this.getBetCurrentRecord()
                return
            }
            if(this.resultInfo.pai_flash && this.resultInfo.pai_flash.length > 0){
                this.resultInfo.pai_flash.forEach(el => {
                    this.betTargetList.forEach(item =>{
                        if(el == item.id){
                            item.flashClass = 'bet-win-green-bg'
                        }
                    })
                })
            }
            setTimeout(() => {
                this.resultInfo = {}
                this.setFlash('retry')
                this.receiveInfoState = false
            }, 5000)
        },
        /**
         * 设置游戏桌信息 倒计时
         * @param {table_run_info} 后台返回的结果  
         * **/
        setTableInfo(){
            if(this.bureauNumber != this.tableRunInfo.bureau_number) {
                this.bureauNumber = this.tableRunInfo.bureau_number
                this.getBetCurrentRecord()
            }
            
            // 如果倒计时 结束 ，并且 开牌中，并且二次请求了
            if(this.tableRunInfo.end_time == 0 &&  this.tableRunInfo.run_status == 2 && this.stopMusicHasPlayed == false) {
                // 投注状态重置标记停止下注状态
                this.betState = false								
            }
            
            // 根据时间状态 标记是否可以投注 
            if(this.tableRunInfo.end_time == 0 ) {
                this.betState = false
            }
            if(this.tableRunInfo.end_time == 1) {
                setTimeout(() => {
                    this.audioHandle.startSoundEffect("stop.wav")
                }, 1000)
            }
            // 根据时间状态 标记是否可以投注 
            if(this.tableRunInfo.end_time != 0) {
                this.betState = true
            }
            if(this.tableRunInfo.end_time == this.startShowWelcomeTime) {
                this.audioHandle.startSoundEffect("bet.wav")
            }
        },
        /**
         * 取消下注
         * **/
        handleCancel() {
            this.getBetCurrentRecord()
            // this.betTargetList.forEach((betItem, index) => {
            //     for (const cancelItem of this.cancelData) {
            //         if(betItem.id == cancelItem.id) {
            //             betItem.betAmount -=  cancelItem.betAmount
            //         }
            //     }
            // })
            // this.initCancelData()
        },
        /**
         * 重复
         * **/
        repeatBet(){
            if(this.repeatData.length < 1) return
            this.audioHandle.startSoundEffect("betSound.mp3")
            this.betSuccess = false
            this.betTargetList.forEach((betItem, index) => {
                for (const repeat of this.repeatData) {
                    if(betItem.id == repeat.id) {
                        betItem.betAmount +=  repeat.betAmount
                        this.cancelData[index].betAmount += repeat.betAmount
                    }
                }
            })
            
            // this.socketTask.send({ user_id: this.userId+'_',code: msgCode.code.success, msg: 'betting'})
        },

        /**
         * 设置免佣
        */
        setFree() {
            if(this.betSendFlag) return
            this.noFree = !this.noFree

        },
        /**
         * 确定下注
         */
        betOrder() {
            // 如果已经 成功发送了， 防止手抖不停下注
            if(this.betSuccess) {
                return
            }
            let confirmData = [];
            let total = 0
            // 遍历投注选项数据集 生成发送至后台的数据
            this.betTargetList.forEach(item => {
                if (item.betAmount > 0 && item.id > 0) {
                    total += item.betAmount
                    confirmData.push({
                        money: item.betAmount,
                        rate_id: item.id,
                    })
                }
            })
            //用户真实余额
            let realBalance = Number(this.userInfo.money_balance) + Number(this.userInfo.game_records.bet_money) + Number(this.userInfo.game_records.deposit_money)
            if(realBalance < total) {
                this.socketTask.send({ user_id: this.userId+'_',code: msgCode.code.outRange, msg: this.$t("publicWords.credit")})
                return
            }
            // 免佣状态 获取
            let is_exempt = this.noFree ? 0 : 1;
            let data = {
                'bet': confirmData,			// 投注数据 含钱数 跟 投注的ID
                'game_type': this.gameType,		// 游戏类型 百家乐 默认 3号类型
                'table_id': this.tableId,		// 台桌ID
                'is_exempt':is_exempt		// 是否免佣
            }
            bjlService.betOrder(data).then(res => {
                this.betSuccess = true
                this.betSendFlag = true
                this.repeatData = JSON.parse(JSON.stringify(this.betTargetList))
                this.initCancelData()
                // 增加音效
                this.audioHandle.startSoundEffect("betsuccess.mp3")
                userService.userIndex().then((res) => {
                    this.userInfo = res
                })
            }).catch(err => {
                this.socketTask.send({ user_id: this.userId+'_',code: msgCode.code.outRange, msg: err.message})
                this.handleCancel()
                console.log(err)
            })
            //这里改过的，不用加回去了，第一次无需前端判断余额  第二次改为要求前端判断余额  第三次发现太慢改为无需判断余额，直接后台判断
            
            
        },
        /**
         * 获取下注记录
        */
        getBetCurrentRecord() {
            
            bjlService.getBetCurrentRecord({id: this.tableId, 'game_type': this.gameType,}).then(res => {
                this.betTargetList.forEach((el) => {
                    el.betAmount = 0
                })
                this.noFree = res.is_exempt == 0 ? true : false
                if(res.record_list.length < 1) {
                    this.betSendFlag = false
                    return
                }
                this.betSendFlag = true
                this.betTargetList.forEach((el) => {
                    res.record_list.forEach(record => {
                        if(el.id == record.game_peilv_id) {
                            el.betAmount = Number(record.bet_amt)
                            el.showChip = this.conversionChip(el.betAmount)
                        }
                    })
                })
                this.repeatData = JSON.parse(JSON.stringify(this.betTargetList))
            }).catch(err => {
                console.log(err)
            })
        },
        /**
         * 下注
         * @param target 下注区域
        */
        bet(target){
			if (this.tableRunInfo.is_dianji == 0){
				this.socketTask.send({ user_id: this.userId+'_',code: msgCode.code.outRange, msg: this.$t("publicWords.justDianTou")})
				return
			}
			let t_now = new Date().getTime()
			let t_old = sessionStorage.getItem('last_bet_time_zg')?sessionStorage.getItem('last_bet_time_zg'):0
			let t_wait = 300
			sessionStorage.setItem('last_bet_time_zg',t_now)
			if(t_now - t_wait < t_old){
				return
			}
            this.betSuccess = false
            if(!this.betState){
                this.socketTask.send({ user_id: this.userId+'_',code: msgCode.code.outRange, msg: this.$t("publicWords.NonBettingTime")})
                return
            }
            
            // betTargetList 为投注列表 数据集合  庄对 幸运6 闲对 庄 和 闲
            this.betTargetList.forEach((item,index) => {
                // 增加对 非免佣台的过滤 结论 就是 ： 幸运6 正常的，不能压
                if(item.className == 'bet-lucky' && this.noFree == true){
                    return
                }
                //限制由 后台决定 添加验证，获取用户金额（判断是否小于下注金额）,或者限额的判断
                if (item.value == target.value) {
                    
                    // this.socketTask.send({ user_id: this.userId+'_',code: msgCode.code.success, msg: 'betting'})
                    this.audioHandle.startSoundEffect("betSound.mp3")
                    // 加钱累计 总钱数
                    this.total_money += Number(this.currentChip.val)				
                    // 累计 当前投注的金额
                    item.betAmount += Number(this.currentChip.val)	
                    this.cancelData[index].betAmount += Number(this.currentChip.val) 			
                    // 获取最大的展示 筹码
                    item.showChip = []			
                    // 把钱数 转化为 筹码 数据							
                    item.showChip = this.conversionChip(item.betAmount)		
                }
            })
        },

        /**
         * 初始化取消数据
        */
         initCancelData() {
            this.betTargetList.forEach((bet,index) => {
                this.cancelData[index] = {betAmount: 0, id: bet.id}
            })
        },

        /**
         * 获取每种筹码个数
         * **/ 
        conversionChip(money) {
            let temChips = this.findMaxChip(money)
            return temChips
        },
        
        /**
         * 找出最大筹码
         * 筛选最大筹码：例：[1,2,10,20,50,100]  总金额：60 那么最大金额为 50
         * 1 如果总金额等于最大的筹码 选择最大筹码
         * 2 如果总金额大于最大筹码  总金额-最大的筹码 = 剩余 (用剩余金额 继续第1步）
         * 3 如果剩余金额等于当前选择的筹码 就用当前选择的筹码
         * @param {amount} 总金额
         * @param {tempChips} 选出的筹码列表 
         * **/
        findMaxChip(amount = 0, tempChips = []) {
            if (amount == 0){
                return
            }
            let chip = {}
            let restAmount = 0
            for(let i = 0; i < allChips.length - 1; i++) {
                if(allChips[i].val <=  Number(amount) && allChips[i + 1].val > Number(amount)) {
                    chip = allChips[i]
                    break
                }else{
                    chip = allChips[i + 1]
                }
            }
            restAmount = amount - chip.val
            tempChips.push(chip)
            //如果剩下金额大于最大筹码还得继续找最大筹码
            if(restAmount > 0) {
                this.findMaxChip(restAmount, tempChips)
            }else{
                return tempChips
            }
            return tempChips
        },
        /**
         * 选择使用的筹码
         * **/
         handleCureentChip(chip) {
            this.currentChip = chip
        },

        /**
         * 设置是否打开更多筹码选择
         * @param {b} true false 
         * 
         * 打开更多筹码选择
         * **/
         setShowChips(b) {
            this.showChips = b
        },

        /**
         * 选择筹码的确定
         * @param {data} 已选筹码 
         * 
         * 从那个 选择的状态 选择过来
         * */
         handleConfirm(data) {
            this.choiceChips = data
            this.showChips = false
            let b = false
            this.choiceChips.forEach(chip => {
                if(this.currentChip.index == chip.index) {
                    b = true
                }
            })
            if(!b) {
                this.handleCureentChip(this.choiceChips[0])
            }
        },
        /**
         * 选择错误消息
         * @param {data} 错误信息 
        */
        hanldeSelectChipError(data){
            this.socketTask.send({ user_id: this.userId+'_',code: msgCode.code.outRange, msg: data.msg})
        }
	}
}