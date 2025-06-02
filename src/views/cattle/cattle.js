// import {fabric} from '@/assets/plugins/fabric.min'
import { fabric } from 'fabric'
import {CanvasApi} from '@/common/canvasApi'
import chips from '@/common/allChipList.js'
import SelectChip from '@/components/SelectChip'
import cattleService from '@/service/cattleService.js'
import userService from '@/service/userService.js'
import {NN_URL, SocketTask} from '@/utils/socket'
import tools from '@/utils/tools'
import msgCode from '@/utils/msgCode'
import AudioHandle from '@/common/audioHandle.js'
import BetBtns from '@/components/Btns'
import WelcomeMssage from '@/components/Welcome.vue'

// fabric 插件对象
const Fabric = fabric;
//画布
let canvas = null
//画布宽度
const CANVAS_WIDTH = window.innerWidth
//所有的筹码
const allChips = chips.allChips
//下注区域的名字
const allowBetName = 'allow-bet'
//下注矩形背景颜色
const blockBackgroundColor = '#00AC72'
export default {
    name: 'Cattle',
    components: {
        SelectChip,
        BetBtns,
        WelcomeMssage
    },
	data(){
		return {
            //ws任务
            socketTask: null,
            //桌号
            tableId: '',
            //是否可以下注 有时间状态才能下注
            betState: false,
            //游戏类型 6是牛牛
            gameType: 6 ,
            welcomeMsg: this.$t('cattle.welcome'),
            //初始化音频
            audioHandle: new AudioHandle(),
            //桌子信息
            tableInfo: {},
            //获取桌子信息的定时器
            tableInfoTimer: null,
			canvasApi: null,
            //选择的筹码
            choiceChips: [],
            //打开选择筹码
            showChips: false,
            //当前选择筹码
            currentChip: null,
            //下注筹码序号
            betChipNumber: 0,
            //鼠标点击下注的区域
            betMark: -1,
            // 下注区域位置
            betLocationList:[
                //x y 下注区域的中心位置 chips: 下注了的筹码 betAmount: 下注总金额, showChip: 展示的下注筹码
                {x: 0,y: 68, chips: [], betAmount: 0, showChips: [], id: 36, onlyType: ''},
                {x: 0, y: 68, chips: [], betAmount: 0, showChips: [], id: 37, onlyType: ''},
                {x: 0, y: 68, chips: [], betAmount: 0, showChips: [], id: 38, onlyType: ''},
                {x: 0, y: 135, chips: [], betAmount: 0, showChips: [], id: 30, onlyType: ''},
                {x: 0, y: 135, chips: [], betAmount: 0, showChips: [], id: 32, onlyType: ''},
                {x: 0, y: 135, chips: [], betAmount: 0, showChips: [], id: 34, onlyType: ''},
                {x: 0, y: 203, chips: [], betAmount: 0, showChips: [], id: 31, onlyType: ''},
                {x: 0, y: 203, chips: [], betAmount: 0, showChips: [], id: 33, onlyType: ''},
                {x: 0, y: 203, chips: [], betAmount: 0, showChips: [], id: 35, onlyType: ''},
            ],
            // 重复项目
            repeatData: [],
            //需要取消的下注数据
            cancelData: [],
            //开牌结果 用于闪烁效果
            resultInfo: {},
            //局号
            bureauNumber: '',
            //下注状态  当局投注的状态下注是否成功
            betSuccess: false,
            //游戏运行信息
            tableRunInfo: {},
            //接收到开牌结果
            receiveInfoState: 0,
            //欢迎语窗口
            showWelcomeMsg : {
                show: false,
                initShow: false
            },
            //画布高度
            canvasHeight: 0,
            //已开局请下注
            startShowWelcomeTime: 35,
            //下注名字
            palyerList: [{
                name: this.$t("cattle.player1"),
                className: 'cattle-react-xian-0'
            },{
                name: this.$t("cattle.player2"),
                className: 'cattle-react-xian-1'
            },{
                name: this.$t("cattle.player3"),
                className: 'cattle-react-xian-2'
            }],
            //下注名字
            betNameList: [{
                name: this.$t("cattle.superCalf"),
                odds: '1:0.95',
                className: 'cattle-react-txt-0'
            },{
                name:  this.$t("cattle.superCalf"),
                odds: '1:0.95',
                className: 'cattle-react-txt-1'
            },{
                name:  this.$t("cattle.superCalf"),
                odds: '1:0.95',
                className: 'cattle-react-txt-2'
            },{
                name: this.$t("cattle.double"),
                odds: '1:0.95',
                className: 'cattle-react-txt-3'
            },{
                name: this.$t("cattle.double"),
                odds: '1:0.95',
                className: 'cattle-react-txt-4'
            },{
                name: this.$t("cattle.double"),
                odds: '1:0.95',
                className: 'cattle-react-txt-5'
            },{
                name: this.$t("cattle.ordinary"),
                odds: '1:1',
                className: 'cattle-react-txt-6'
            },{
                name: this.$t("cattle.ordinary"),
                odds: '1:1',
                className: 'cattle-react-txt-7'
            },{
                name: this.$t("cattle.ordinary"),
                odds: '1:1',
                className: 'cattle-react-txt-8'
            }],
            //用户信息
            userInfo: {},
		}
        
	},
    created() {
        this.tableId = this.$route.query.table_id
        this.userId = this.$route.query.user_id
        this.audioHandle.audioPath = 'niu'
        this.handleCureentChip(this.choiceChips[0])
        this.initCancelData()
        this.getUserChipsInfos()
        this.initSocket()
       
    },
	mounted(){
        this.init()
	},
    destroyed(){
        clearTimeout(this.tableInfoTimer)
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
            this.socketTask =  new SocketTask(NN_URL) 
            // 监听 socket 连接开始发送信息，{台桌ID 游戏类型 用户ID}
            this.socketTask.open(res => {		
                this.socketTask.send({table_id: this.tableId, game_type: this.gameType, user_id: this.userId+'_'})
            })
            this.receiveMsg()
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
                // 非空信息 即开奖信息
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
                //以下是开牌结果 
                if(!result.data || !result.data.result_info) {
                    return
                }
                //不是该桌的游戏结果不展示 
                if(result.data.result_info.table_info.game_type != this.gameType || 
                result.data.result_info.table_info.table_id != this.tableId || this.tableRunInfo.end_time > 0) {
                    return
                }
                // 如果正常状态
                if(result.code == 200 && this.receiveInfoState < 1) {							
                    this.resultInfo = result.data.result_info	
                    this.receiveInfoState = 1
                    this.runOpenMusicEffect(result.data.bureau_number)
                    // 赋值开牌结果过来 自动展示				
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
                let time = 2000
				setTimeout(() => {
                    if(this.resultInfo.result['1'].result < 10 && this.resultInfo.result['1'].result > 0){
                        this.audioHandle.startSoundEffect(`bankerBull${this.resultInfo.result['1'].result}.wav`)
                    }else if(this.resultInfo.result['1'].result == 0){
                        this.audioHandle.startSoundEffect(`bankerNull.wav`)
                    }else{
                        this.audioHandle.startSoundEffect(`bankerBull.wav`)
                    }
				},time)
				setTimeout(() => {
                    if(this.resultInfo.result['2'].result < 10 && this.resultInfo.result['2'].result > 0){
                        this.audioHandle.startSoundEffect(`player1bull${this.resultInfo.result['2'].result}.wav`)
                    }else if(this.resultInfo.result['1'].result == 0){
                        this.audioHandle.startSoundEffect(`player1null.wav`)
                    }else{
                        this.audioHandle.startSoundEffect(`player1bull.wav`)
                    }
				},time + 2000)
                setTimeout(() => {
                    if(this.resultInfo.result['3'].result < 10 && this.resultInfo.result['3'].result > 0){
                        this.audioHandle.startSoundEffect(`player2bull${this.resultInfo.result['3'].result}.wav`)
                    }else if(this.resultInfo.result['3'].result == 0){
                        this.audioHandle.startSoundEffect(`player2null.wav`)
                    }else{
                        this.audioHandle.startSoundEffect(`player2bull.wav`)
                    }
				},time + 4200)
                setTimeout(() => {
                    if(this.resultInfo.result['4'].result < 10 && this.resultInfo.result['4'].result > 0){
                        this.audioHandle.startSoundEffect(`player3bull${this.resultInfo.result['4'].result}.wav`)
                    }else if(this.resultInfo.result['4'].result == 0){
                        this.audioHandle.startSoundEffect(`player3null.wav`)
                    }else{
                        this.audioHandle.startSoundEffect(`player3bull.wav`)
                    }
				},time + 6400)
			}
		},

        init(){
            // document.getElementById("canvas").setAttribute("width","150")
            // document.getElementById("canvas").setAttribute("height","")
			// 建立canvas对象
            let wrapper = document.getElementById("cattle-wrapper");
            this.canvasHeight = wrapper.offsetHeight
			canvas = new Fabric.Canvas('canvas', {
				width: 0,
				height: 0,
				hoverCursor: 'default'
			})
			
			// // 设置canvas宽度
			canvas.setWidth(CANVAS_WIDTH)
			// 设置canvas高度
			canvas.setHeight(this.canvasHeight)
            canvas.selection = false
            canvas.on('mouse:down', this.mouseDown)
			this.canvasApi = new CanvasApi(canvas)
			this.drawCanvasBG()
            this.drawTable()
		},

        /**
         * 设置游戏桌信息 倒计时
         * @param {table_run_info} 后台返回的结果  
         * **/
         setTableInfo(){
            if(this.bureauNumber != this.tableRunInfo.bureau_number) {
                this.bureauNumber = this.tableRunInfo.bureau_number
                this.getCurrentRecord()
            }
            
            // 如果倒计时 结束 ，并且 开牌中，并且二次请求了
            if(this.tableRunInfo.end_time == 0 &&  this.tableRunInfo.run_status == 2) {
                // 投注状态重置标记停止下注状态
                this.betState = false								
            }
            if(this.tableRunInfo.end_time == 1) {
                setTimeout(() => {
                    this.audioHandle.startSoundEffect("stop.wav")
                }, 1000)
            }
            // 根据时间状态 标记是否可以投注 
            if(this.tableRunInfo.end_time == 0 ) {
                this.betState = false
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
         * 桌子闪烁
        */
        setFlash() {
            if(this.receiveInfoState > 5) {
                this.getCurrentRecord()
                userService.userIndex().then((res) => {
                    this.userInfo = res
                })
                this.receiveInfoState = 0
                return
            }
            let tableList = []
            if(this.resultInfo.pai_flash && this.resultInfo.pai_flash.length > 0){
                this.resultInfo.pai_flash.forEach(el => {
                    this.betLocationList.forEach(item =>{
                        if(el == item.id){
                            let table = this.getObjects(object => object.type.includes(item.onlyType))
                            table[0].set({'fill': '#ACE4D1'})
                            canvas.renderAll()
                            tableList.push(table[0])
                        }
                    })
                })
            }
            let time = 700
            setTimeout(() => {
                if(tableList.length > 0) {
                    tableList.forEach(table => {
                        table.set({'fill': blockBackgroundColor})
                        canvas.renderAll()
                    })
                }
            }, time)

            setTimeout(() => {
                this.receiveInfoState ++
                this.setFlash()
            }, time * 2)
        },

        /**
         * 获取桌子信息
         * **/
        getTableInfo() {
            clearTimeout(this.tableInfoTimer)
            cattleService.tableInfo({id: this.tableId}).then(res => {
                this.tableInfo = res
                if(this.tableInfo.end_time < 1) {
                    this.betLocationList.forEach((bet, index) => {
                        bet.betAmount = 0
                        this.betMark = index
                        let beforeBetChips = this.getObjects(object => object.type.includes(`${allowBetName}-${this.betMark}-bet-chip`) || object.type.includes(`txt-${allowBetName}-${this.betMark}-amount`))
                        beforeBetChips.forEach(chip => {
                            canvas.remove(chip)
                        })
                    })
                }
                this.tableInfoTimer = setTimeout(() => {
                    this.getTableInfo()
                }, 1000)
            }).catch(err => {
                console.log(err)
                this.tableInfoTimer = setTimeout(() => {
                    this.getTableInfo()
                }, 1000)
            })
        },

        /**
         * 获取当前下注
        */
        getCurrentRecord(){
            cattleService.getBetCurrentRecord({id: this.tableId}).then(res => {
                let beforeBetChips = this.getObjects(object => object.type.includes(`bet-chip`) || object.type.includes(`amount`))
                beforeBetChips.forEach(chip => {
                    canvas.remove(chip)
                })
                this.betLocationList.forEach(betLocating => {
                    betLocating.betAmount = 0
                })
                this.betLocationList.forEach((el, index) => {
                    res.forEach(record => {
                        if(el.id == record.game_peilv_id) {
                            el.betAmount = Number(record.bet_amt)
                        }
                    })
                    this.betMark = index
                    this.computedBetAmount()
                    this.drawBet()
                })
            }).catch(err => {
                console.log(err)
            })
        },

        /**
         * 确定下注
        */
        handleSubmit(){
            // 免佣状态 获取
            // let is_exempt = this.noFree ? 0 : 1;
            let confirmData = []
            let total = 0
            
            this.betLocationList.forEach(item => {
                if (item.betAmount > 0 ) {
                    total += item.betAmount
                    confirmData.push({
                        money: item.betAmount,
                        rate_id: item.id,
                    })
                }
            })
            let realBalance = Number(this.userInfo.money_balance) + Number(this.userInfo.game_records.bet_money) + Number(this.userInfo.game_records.deposit_money)
            if(realBalance < total) {
                this.socketTask.send({ user_id: this.userId+'_',code: msgCode.code.outRange, msg: this.$t("publicWords.credit")})
                return
            }
            let data = {
                bet : confirmData,			// 投注数据 含钱数 跟 投注的ID
                game_type: this.gameType,	
                table_id: this.tableId,		// 台桌ID
                is_exempt: 0
            }
            //这里改过的，不用加回去了，第一次无需前端判断余额  第二次改为要求前端判断余额  第三次发现太慢改为无需判断余额，直接后台判断
            cattleService.betOrderService(data).then(res => {
                this.initCancelData()
                this.repeatData = JSON.parse(JSON.stringify(confirmData))
                // 增加音效
                this.audioHandle.startSoundEffect("betsuccess.mp3")
                userService.userIndex().then((res) => {
                    this.userInfo = res
                })
                // this.getUserChipsInfos('balance')
            }).catch(err => {
                this.socketTask.send({ user_id: this.userId+'_',code: msgCode.code.outRange, msg: err.message})
                console.log(err)
            })
            
        },

        /**
         * 重复
        */
        handleRepeat(){
            if(this.repeatData.length < 1) {
                return
            }
            this.betLocationList.forEach((betItem, index) => {
                for (const repeat of this.repeatData) {
                    if(betItem.id == repeat.rate_id) {
                        betItem.betAmount +=  repeat.money
                        this.cancelData[index].money += repeat.money
                        this.betMark = index
                        this.computedBetAmount()
                        this.drawBet()
                    }
                }
            })
        },

        /**
         * 取消下注
        */
        handleCancel(){
            this.getCurrentRecord()
            // this.betLocationList.forEach((betItem, index) => {
            //     for (const cancelItem of this.cancelData) {
            //         if(betItem.id == cancelItem.rate_id) {
            //             betItem.betAmount -=  cancelItem.money
            //             this.betMark = index
            //             this.computedBetAmount()
            //             this.drawBet()
            //         }
            //     }
            // })
            // this.initCancelData()
        },

        /**
        * canvas鼠标点击事件
        * @param options
         * **/
        mouseDown(options) {
            if(!options.target || !options.target.type) {
                return
            }
            if(options.target.type.includes(allowBetName)) {
                this.bet(options.target)
            }   
            
        },
        /**
         * 下注
         * @param target 下注的对象区域
         * **/
        bet(target){
            let index = target.type.indexOf(allowBetName) + allowBetName.length + 1
            this.betMark = Number(target.type.substr(index, 1))
            this.publicBet()
        },
        
        /**
         * html元素下注
         * **/
        htmltBet(index){
            this.betMark = index
            this.publicBet()
        },

        /**
         * 元素和canvas点击都可以下注
         * **/
        publicBet(){
            if(!this.betState){
                this.socketTask.send({ user_id: this.userId+'_',code: msgCode.code.outRange, msg: this.$t("publicWords.NonBettingTime")})
                return
            }
            this.betLocationList[this.betMark].chips.push(JSON.parse(JSON.stringify(this.currentChip)) )
            this.betLocationList[this.betMark].betAmount += Number(this.currentChip.val) 
            this.cancelData[this.betMark].money += Number(this.currentChip.val)
            this.computedBetAmount()
            this.drawBet()
        },

        /**
         * 初始化取消数据
        */
        initCancelData() {
            this.betLocationList.forEach((bet,index) => {
                this.cancelData[index] = {money: 0, rate_id: bet.id}
            })
        },
        /**
         * 画下注金额和筹码
        */
        drawBet(){
            if(this.tableInfo.end_time < 1) {
                return
            }
            let beforeBetChips = this.getObjects(object => object.type.includes(`${allowBetName}-${this.betMark}-bet-chip`) || object.type.includes(`txt-${allowBetName}-${this.betMark}-amount`))
            beforeBetChips.forEach(chip => {
                canvas.remove(chip)
            })
            if(!this.betLocationList[this.betMark].showChips) {
                return
            }
            let blockHeight = (this.canvasHeight - 28) / 3
            let y = this.betLocationList[this.betMark].y + (blockHeight / 2)
            //画筹码
            this.betLocationList[this.betMark].showChips.forEach((el,index) => {
                // let y = this.betLocationList[this.betMark].y - 2 * index
                this.canvasApi.drawImage(el.betSrc, this.betLocationList[this.betMark].x, y , `img-${allowBetName}-${this.betMark}-bet-chip${this.betChipNumber}`, 20, 15)
            })
            if(this.betLocationList[this.betMark].betAmount < 1) {
                return
            }
            this.canvasApi.drawText(`${this.betLocationList[this.betMark].betAmount}`, this.betLocationList[this.betMark].x-50, y-20, 26, `txt-${allowBetName}-${this.betMark}-amount${this.betMark}`, 'red','', true)
            this.betChipNumber += 1
            this.audioHandle.startSoundEffect("betSound.mp3")
            // this.socketTask.send({ user_id: this.userId+'_',code: msgCode.code.success, msg: 'betting'})
        },
        /**
         * 计算下注的总数
         * **/
        computedBetAmount(){
            // let amount = 0
            // this.betLocationList[this.betMark].chips.forEach(chip => {
            //     amount += chip.val
            // })
            // this.betLocationList[this.betMark].betAmount = amount
            let amount = this.betLocationList[this.betMark].betAmount
            this.betLocationList[this.betMark].showChips = this.conversionChip(amount)
        },

        /**
         * 获取每种筹码个数
         * @param money 总的下注金额
         * */ 
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
         * 画桌布
        */
        drawTable() {
            //小条之间间隔
            let gap = 2
            //第1行小长条宽度  3:3个小条
            let firstRowRectWidth = (CANVAS_WIDTH - (gap * 2)) / 3
            //字体颜色 
            let color = 'white'
            //小条高度
            let tapeHeight = 20
            //字体大小
            let fontSize = 16
            this.canvasApi.drawRect(0, 0, firstRowRectWidth, tapeHeight, 0, 'rect-xian1', '#30429B')
            //第二个小条x轴坐标
            let secondRectX = firstRowRectWidth + gap
            //闲字y轴坐标
            let xianFontY = tapeHeight / 2 - 9
            //圆角
            let rectRadius = 5
            this.canvasApi.drawRect(secondRectX, 0, firstRowRectWidth, tapeHeight, 0, 'rect-xian2', '#008FEA')
            let thirdRectX = firstRowRectWidth * 2 + gap * 2
            //第一行闲
            this.canvasApi.drawRect(thirdRectX, 0, firstRowRectWidth, tapeHeight, 0, 'rect-xian3', '#00BEC0')
            // this.canvasApi.drawText('闲1',firstRowRectWidth / 2 - 10, xianFontY, fontSize, 'txt-xian1', color, '', true)
            // this.canvasApi.drawText('闲2',secondRectX + firstRowRectWidth / 2 - 10, xianFontY, fontSize, 'txt-xian2', color, '', true)
            // this.canvasApi.drawText('闲3',thirdRectX +  firstRowRectWidth / 2 - 10, xianFontY, fontSize, 'txt-xian2', color, '', true)
            //翻倍矩形y轴坐标
            let row2RectY = 22
            //下注矩形高度
            let blockHeight = (this.canvasHeight - 28) / 3
            //下注矩形边框宽度
            let blockBorder = 0
            
            //下注的筹码宽度
            let betChipWidth = 5
            //第二行 超牛
            const superNiu = 'super-niu'
            this.betLocationList[0].x = firstRowRectWidth / 2 - betChipWidth
            this.betLocationList[0].onlyType = `rect-${allowBetName}-0-${superNiu}0`
            this.betLocationList[0].y = row2RectY
            this.canvasApi.drawRect(0, row2RectY, firstRowRectWidth, blockHeight, blockBorder,this.betLocationList[0].onlyType, blockBackgroundColor, '' , rectRadius, rectRadius)
            

            this.betLocationList[1].x = secondRectX + firstRowRectWidth / 2 - betChipWidth
            this.betLocationList[1].onlyType = `rect-${allowBetName}-1-${superNiu}1`
            this.betLocationList[1].y = row2RectY
            this.canvasApi.drawRect(secondRectX, row2RectY, firstRowRectWidth, blockHeight, blockBorder, this.betLocationList[1].onlyType, blockBackgroundColor,'' ,  rectRadius,  rectRadius)
            

            this.betLocationList[2].x = thirdRectX + firstRowRectWidth / 2 - betChipWidth
            this.betLocationList[2].onlyType = `rect-${allowBetName}-2-${superNiu}2`
            this.betLocationList[2].y = row2RectY
            this.canvasApi.drawRect(thirdRectX, row2RectY, firstRowRectWidth, blockHeight, blockBorder, `rect-${allowBetName}-2-${superNiu}2`, blockBackgroundColor,'' ,  rectRadius,  rectRadius)
            
            //第三行的翻倍矩形y轴坐标
            let row3RectY = blockHeight * 1 + 24
            let doubleName = 'double'
            this.betLocationList[3].x = firstRowRectWidth / 2 - betChipWidth
            this.betLocationList[3].onlyType = `rect-${allowBetName}-3-${doubleName}3`
            this.betLocationList[3].y = row3RectY
            this.canvasApi.drawRect(0, row3RectY, firstRowRectWidth, blockHeight, blockBorder, this.betLocationList[3].onlyType, blockBackgroundColor,'' ,  rectRadius,  rectRadius)
            
            
            this.betLocationList[4].x = secondRectX + firstRowRectWidth / 2 - betChipWidth
            this.betLocationList[4].onlyType = `rect-${allowBetName}-4-${doubleName}4`
            this.betLocationList[4].y = row3RectY
            this.canvasApi.drawRect(secondRectX, row3RectY, firstRowRectWidth, blockHeight, blockBorder, this.betLocationList[4].onlyType, blockBackgroundColor,'' ,  rectRadius,  rectRadius)
            
            this.betLocationList[5].x = thirdRectX + firstRowRectWidth / 2 - betChipWidth
            this.betLocationList[5].onlyType = `rect-${allowBetName}-5-${doubleName}5`
            this.betLocationList[5].y = row3RectY
            this.canvasApi.drawRect(thirdRectX, row3RectY, firstRowRectWidth, blockHeight, blockBorder, this.betLocationList[5].onlyType, blockBackgroundColor,'' ,  rectRadius,  rectRadius)
            //第四行的平倍
            let row4RectY = blockHeight * 2 + 26
            this.betLocationList[6].x = firstRowRectWidth / 2 - betChipWidth
            this.betLocationList[6].onlyType = `rect-${allowBetName}-6-${doubleName}6`
            this.betLocationList[6].y = row4RectY
            this.canvasApi.drawRect(0, row4RectY, firstRowRectWidth, blockHeight, blockBorder, this.betLocationList[6].onlyType, blockBackgroundColor,'' ,  rectRadius,  rectRadius)
           
            this.betLocationList[7].x = secondRectX + firstRowRectWidth / 2 - betChipWidth
            this.betLocationList[7].onlyType = `rect-${allowBetName}-7-${doubleName}7`
            this.betLocationList[7].y = row4RectY
            this.canvasApi.drawRect(secondRectX, row4RectY, firstRowRectWidth, blockHeight, blockBorder, this.betLocationList[7].onlyType, blockBackgroundColor,'' ,  rectRadius,  rectRadius)
            
            this.betLocationList[8].x = thirdRectX + firstRowRectWidth / 2 - betChipWidth
            this.betLocationList[8].onlyType = `rect-${allowBetName}-8-${doubleName}8`
            this.betLocationList[8].y = row4RectY
            this.canvasApi.drawRect(thirdRectX, row4RectY, firstRowRectWidth, blockHeight, blockBorder, this.betLocationList[8].onlyType, blockBackgroundColor,'' ,  rectRadius,  rectRadius)
            //翻倍字体大小
            let doubleFontSize = 18
            // 翻倍字体宽度
            let doubleFontWidth = 13
            // 比率字体宽度
            let ratioFontWidth = 18
            //超牛字体y轴坐标
            let doubleFontY = 30
            /***画文字的，最好不要删除掉，后面找一个为什么fabric为什么在ios中fontsize不起作用，不至于这样啊，好坑***/
            //赔率
            let odds = `1:0.95`
            // this.canvasApi.drawText('超牛',firstRowRectWidth / 2 - doubleFontWidth, doubleFontY, doubleFontSize, `txt-${allowBetName}-0-${superNiu}0`, color, '', true)
            // this.canvasApi.drawText(odds,firstRowRectWidth / 2 - ratioFontWidth, doubleFontY * 2, fontSize, `txt-${allowBetName}-0-ratio0`, color, '', true)
            // this.canvasApi.drawText('超牛',secondRectX + firstRowRectWidth / 2 - doubleFontWidth, doubleFontY, doubleFontSize, `txt-${allowBetName}-1-${superNiu}1`, color, '', true)
            // this.canvasApi.drawText(odds,secondRectX + firstRowRectWidth / 2 - ratioFontWidth, doubleFontY * 2, fontSize, `txt-${allowBetName}-1-ratio1`, color, '', true)
            // this.canvasApi.drawText('超牛',thirdRectX + firstRowRectWidth / 2 - doubleFontWidth, doubleFontY, doubleFontSize, `txt-${allowBetName}-2-${superNiu}2`, color, '', true)
            // this.canvasApi.drawText(odds,thirdRectX + firstRowRectWidth / 2 - ratioFontWidth, doubleFontY * 2, fontSize, `txt-${allowBetName}-2ratio2`, color, '', true)
            //第二行翻倍字体y轴坐标
            let double2FontY = 100
            // this.canvasApi.drawText('翻倍',firstRowRectWidth / 2 - doubleFontWidth, double2FontY, doubleFontSize, `txt-${allowBetName}-3-${doubleName}3`, color, '', true)
            // this.canvasApi.drawText(odds,firstRowRectWidth / 2 - ratioFontWidth, double2FontY + doubleFontY, fontSize, `txt-${allowBetName}-3-ratio3`, color, '', true)
            // this.canvasApi.drawText('翻倍',secondRectX + firstRowRectWidth / 2 - doubleFontWidth, double2FontY, doubleFontSize, `txt-${allowBetName}-4-${doubleName}4`, color, '', true)
            // this.canvasApi.drawText(odds,secondRectX + firstRowRectWidth / 2 - ratioFontWidth, double2FontY + doubleFontY, fontSize, `txt-${allowBetName}-4-ratio4`, color, '', true)
            // this.canvasApi.drawText('翻倍',thirdRectX + firstRowRectWidth / 2 - doubleFontWidth, double2FontY, doubleFontSize, `txt-${allowBetName}-5-${doubleName}5`, color, '', true)
            // this.canvasApi.drawText(odds,thirdRectX + firstRowRectWidth / 2 - ratioFontWidth, double2FontY + doubleFontY, fontSize, `txt-${allowBetName}-5-ratio5`, color, '', true)
            //平倍字体y轴坐标
            let double3FontY = 168
            // this.canvasApi.drawText('平倍',firstRowRectWidth / 2 - doubleFontWidth, double3FontY, doubleFontSize, `txt-${allowBetName}-6-${doubleName}6`, color, '', true)
            // this.canvasApi.drawText('1:1',firstRowRectWidth / 2 - 8, double3FontY + doubleFontY, fontSize, `txt-${allowBetName}-6-ratio6`, color, '', true)
            // this.canvasApi.drawText('平倍',secondRectX + firstRowRectWidth / 2 - doubleFontWidth, double3FontY, doubleFontSize, `txt-${allowBetName}-7-${doubleName}7`, color, '', true)
            // this.canvasApi.drawText('1:1',secondRectX + firstRowRectWidth / 2 - 8, double3FontY + doubleFontY, fontSize, `txt-${allowBetName}-7-ratio7`, color, '', true)
            // this.canvasApi.drawText('平倍',thirdRectX + firstRowRectWidth / 2 - doubleFontWidth, double3FontY, doubleFontSize, `txt-${allowBetName}-8-${doubleName}8`, color, '', true)
            // this.canvasApi.drawText('1:1',thirdRectX + firstRowRectWidth / 2 - 8, double3FontY + doubleFontY, fontSize, `txt-${allowBetName}-8-ratio8`, color, '', true)
        },

        /**
         * 选择使用的筹码
         * **/
        handleCureentChip(chip) {
            this.currentChip = chip
        },

        /**
         * 展示筹码列表
         * 
        */
        showChipList() {
            this.showChips = true
        },

        /***
		 * 画背景
		*/
		drawCanvasBG(){
            canvas.backgroundColor = '#0B8258'
            //用图片做背景
			// let bg = require('@/assets/imgs/bg1.jpg')
			// Fabric.Image.fromURL(bg, (img) => {
			// 	canvas.setBackgroundImage(img)
			// 	canvas.renderAll();
			// })
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
         * 设置是否打开更多筹码选择
         * @param {b} true false 
         * 
         * 打开更多筹码选择
         * **/
        setShoeChips(b) {
            this.showChips = b
        },

        /**
		 * 获取页面元素
		 * @param filter 筛选函数 (object)
		*/
		getObjects(filter) {
			const objects = canvas.getObjects()
			return objects.filter(filter)
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