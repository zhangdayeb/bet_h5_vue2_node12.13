<template>
  	<div class="bet-btns" >
		<button class="bet-btn bet-repeat" @click="repeatBet()" v-html="$t('bjlAndLh.repeatBet')"></button>
        <button class="bet-btn bet-submit" @click="submit()" v-html="$t('bjlAndLh.ok')"></button>
        <button class="bet-btn bet-cancel" @click="handleCancel()" v-html="$t('bjlAndLh.cancel')"></button>
        <button class="bet-btn bet-free"  @click="setFree()" v-if="showFree">
            <span class="bet-free-coin"></span>
            <span v-html="noFree ? $t('bjlAndLh.noFree') : $t('bjlAndLh.free')"></span>
        </button>
  	</div>
</template>

<script >


export default {
    props:['noFree', 'showFree'],
    data() {
        return {
            
        };
    },
    mounted() {
        
    },
    methods: {
        /**
         * 重复下注
        */
        repeatBet() {
            this.$emit("repeatBet",{})
        },

        /**
         * 确定下注
        */
        submit() {
            this.$emit("submitBet",{})
        },

        /**
         * 取消下注
         * **/
        handleCancel() {
            this.$emit("cancelBet",{})
        },

        /**
         * 免俑
        */
        setFree() {
            this.$emit("setFree",{})
        }
    }
}
</script>
<style lang="less" scoped >
    .bet-btns{
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;

        .bet-btn{
            white-space: nowrap;
            cursor: pointer;
            border-radius: 20px;
            color: #fff;
            display: flex;
            align-items: center;
            outline: none;
            border: none;
            justify-content: center;
            padding: 0px 20px 2px 20px;
            height: 24px;
            font-weight: bold;
            -webkit-tap-highlight-color: transparent;
        }
        .bet-repeat{
            border: 1px solid #ebd093;
            color: #ebd093;
            background: #2A2A2A;
        }
        .bet-repeat:active{
            background: #e0d5d5;
            border: 1px solid #2A2A2A;
        }
        .bet-submit{
            margin: 0 13px;
            background-image: linear-gradient(90deg,#3bdf4b,#4dba73);
            color: #fff;
            border: 1px solid #4dba73;
        }
        .bet-submit:active{
            background-image: linear-gradient(90deg,#031f06,#01200b);
            border: 1px solid #01200b;
        }
        .bet-cancel{
            background-image: linear-gradient(90deg,#d54449,#c1655b);
            color: #fff;
            border: 1px solid #c1655b;
        }
        .bet-cancel:active{
            background-image: linear-gradient(90deg,#1d0102,#1d0401);
            border: 1px solid #1b0102;
        }
        .bet-free{
            background-size: 100% 100%;
            width: 80px;
            margin-left: 8px;
            background-color: #6F7975;
            padding: 0px 3px;
            text-align: center;
            line-height: 18px;
            justify-content: space-around;
        }
        .bet-free-bg{
            background-image: url('~@/assets/imgs/bet/free.png');
        }
        .bet-free-coin{
            width: 20px;
            height: 20px;
            border-radius: 10px;
            background-size: 74px 25px;
            background-position: -5px -3px;
            background-repeat: no-repeat;
            float: left;
            background-image: url('~@/assets/imgs/bet/free.png');
        }
    }
</style>