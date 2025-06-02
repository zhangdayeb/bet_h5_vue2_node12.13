<template>
  	<div class="bet-btns" >
		<!-- <button class="bet-btn bet-repeat" @click="repeatBet()" v-html="$t('bjlAndLh.repeatBet')"></button> -->
        <button class="bet-btn bet-submit" @click="submit()" v-html="$t('bjlAndLh.ok')"></button>
        <button class="bet-btn bet-cancel" @click="handleCancel()" v-html="$t('bjlAndLh.cancel')"></button>
        <!-- 免佣按钮 - 只在showFree为true时显示 -->
        <button 
            v-if="showFree" 
            class="bet-btn bet-free" 
            :class="{'bet-free-active': Freebool, 'bet-free-inactive': !Freebool}" 
            @click="setFree()"
        >
            <span v-html="$t('bjlAndLh.mianyong')"></span>
            <div class="bet-free-status">{{ Freebool ? '开' : '关' }}</div>
        </button>
  	</div>
</template>

<script>
export default {
    props: {
        Freebool: {
            type: Boolean,
            default: false
        },
        showFree: {
            type: Boolean,
            default: true
        }
    },
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
            this.$emit("repeatBet", {})
        },

        /**
         * 确定下注
        */
        submit() {
            this.$emit("submitBet", {})
        },

        /**
         * 取消下注
         * **/
        handleCancel() {
            this.$emit("cancelBet", {})
        },

        /**
         * 免佣切换
        */
        setFree() {
            this.$emit("setFree", {})
        }
    }
}
</script>

<style lang="less" scoped>
    .bet-btns{
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;

        .bet-btn{
            white-space: nowrap;
            cursor: pointer;
            border-radius: 5px;
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
            width: 80px;
            margin-left: 8px;
            padding: 0px 8px;
            text-align: center;
            line-height: 18px;
            justify-content: center;
            font-size: 12px;
            position: relative;
            border: 1px solid #777;
            transition: all 0.3s ease;
        }
        
        // 免佣开启状态
        .bet-free-active{
            background-image: linear-gradient(90deg, #4CAF50, #45a049);
            border-color: #4CAF50;
            color: #fff;
        }
        .bet-free-active:active{
            background-image: linear-gradient(90deg, #2e7d32, #1b5e20);
        }
        
        // 免佣关闭状态
        .bet-free-inactive{
            background-color: #6F7975;
            border-color: #777;
            color: #ccc;
        }
        .bet-free-inactive:active{
            background-color: #555;
        }
        
        .bet-free-status {
            font-size: 10px;
            margin-top: 2px;
            font-weight: normal;
        }
    }
</style>