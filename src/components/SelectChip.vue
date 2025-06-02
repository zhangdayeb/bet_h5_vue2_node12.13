<template>
  	<div class="chip-s" style="z-index: 25;">
		<div class="chip-s-panel">
            <header class="chip-s-title">
				{{$t('chips.useChips')}}
			</header>
            <section class="chip-s-section">
                <div class="chip-s-block">
                    <div class="chip-s-item" v-for="(chip,index) in chipList" :key="index" @click="handleChooice(index)">
                        <img class="chip-s-img" :src="chip.src" width="50" height="50" alt="" srcset="">
                        <div class="chip-s-mask" v-if="!chip.active"></div>
                    </div>
                </div>
            </section>
            <footer class="chip-s-btn-block">
                <button class="chip-s-btn" @click="handleSubmit()">{{$t('chips.ok')}}</button>
                <button class="chip-s-btn" @click="handleCancel()">{{$t("bjlAndLh.cancel")}}</button>
            </footer>
        </div>
  	</div>
</template>

<script >
import allChips from '@/common/allChipList.js'
import userService from '@/service/userService'

export default {
    props:['choiceChips'],
    data() {
        return {
            //已选筹码
            selectChips: [],
            //筹码列表
            chipList: JSON.parse(JSON.stringify(allChips.allChips)) ,
        };
    },
    mounted() {
        this.selectChips = JSON.parse(JSON.stringify(this.choiceChips))
        this.selectChips.forEach(el => {
            this.chipList[el.index].active = true
        })
        this.chipList.shift()
    },
    methods: {
        /**
         * 选择筹码
        */
        handleChooice(index) {
            this.chipList[index].active = !this.chipList[index].active
            if(!this.chipList[index].active) {
                for(let i=0; i< this.selectChips.length; i++) {
                    if(this.selectChips[i].index == this.chipList[index].index) {
                        this.selectChips.splice(i, 1)
                    }
                }
            }
            if(this.selectChips.length >= 5) {
                let deleteChip = this.selectChips.pop()
                for(let i=0; i<this.chipList.length; i++) {
                    if(this.chipList[i].index == deleteChip.index && this.chipList[index].active) {
                        this.chipList[i].active = false
                        break
                    }
                }
            }
            if(this.chipList[index].active) {
                this.selectChips.unshift(this.chipList[index])
            }
        },
        
        /**
         * 确定
         * */
        handleSubmit() {
            if(this.selectChips.length < 5) {
                this.$emit('selectChipError',{msg: this.$t('chips.selectChips')})
                return
            }
            this.selectChips.sort((x, y) => {
                if(x.index > y.index){
                    return 1;
                }else if(x.index < y.index){
                    return -1;
                }else{
                    return 0;
                }
            })
            let data = {chip: this.selectChips}
            userService.chipUpdate(data).then(res => {

            }).catch(err => {
                console.log(err)
            })
            this.$emit('confirm', this.selectChips)
        },

        /**
         * 取消
         * */
        handleCancel() {
            this.$emit('cancel',false)
        }
    }
}
</script>
<style lang="less" scoped >
    .chip-s{
        position: absolute;
		height: 100%;
		width: 100%;
        top:0;
		position: absolute;
		background-color: rgba(0,0,0,.5);
		display: flex;
		align-items: center;

        .chip-s-panel{
            border: 1px solid #72654d;
			border-radius: 10px;
			width: 85%;
			height: 210px;
			margin: 0 auto;
			background-color: rgba(0,0,0,1);
        }
        .chip-s-title{
			color: white;
			text-align: center;
			margin-top: 4px;
			font-size: 15px;
		}
        .chip-s-block{
			height: 250px;
			margin: 10px 0;
			display: flex;
			flex-wrap: wrap;
			justify-content: space-between;
			padding: 0 5px;
		}
        .chip-s-item{
		    width: 50px;
		    height: 50px;
		    text-align: center;
		    border-radius: 50%;
		    position: relative;
			margin: 2px 7px;
			font-size: 13px;
		}
        .chip-s-section{
            height: 150px;
            overflow-y: auto;
        }
        .chip-s-mask{
			width: 50px;
			height: 50px;
			border-radius: 50%;
			position: absolute;
			top: 0px;
			left: 0px;
			background-color: rgba(0,0,0,.5);
		}
        .chip-s-btn-block{
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: space-evenly;
        }
        .chip-s-btn{
            white-space: nowrap;
            cursor: pointer;
            background: linear-gradient(to bottom,#3BE8BC,#6EB2D1);
            border-radius: 20px;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 15px;
            outline: none;
            border: none;
            justify-content: center;
            padding: 2px 23px;
            font-weight: bold;
            -webkit-tap-highlight-color:transparent;
            -ms-tap-highlight-color:transparent;
        }
    }
</style>