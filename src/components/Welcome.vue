<template name="welcome">
	<div class="live-welcome">
		<div class="live-wel-panel">
			<div >
				{{msg}}
			</div>
			<div class="live-wel-confirm" @click="handleWelcomeClose()">
				{{$t('chips.ok')}}
			</div>
		</div>
	</div>
</template>

<script>
    export default {
		name:'welcome',
        props:{
			msg: {
        		type: String,//属性类型
        		value: "欢迎光临游戏"
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
			 * 关闭提示，造成造成游戏交互 从而达成音乐播放
			 */
			handleWelcomeClose() {
				this.$emit("closeMsg","") //子传父 
			},
        }
    }
</script>

<style lang="less" scoped>
	.live-welcome{
		height: 100%;
        width: 100%;
        position: absolute;
        display: flex;
        top: 0;
        z-index: 999;
        background-color: rgba(0, 0, 0, 0.5);
        align-items: center;
        color: #d3d4d3;
	}   
    .live-wel-panel{
    	border: 1px solid #72654d;
    	border-radius: 10px;
    	width: 60%;
    	height: 104px;
    	margin: 0 auto;
    	background-color: rgba(0,0,0,1);
    	text-align: center;
    	padding: 10px 20px;
    	font-size: 14px;
        margin-top: -48px;
    }
	.live-wel-confirm{
		color: black;
		background-color: #ecd1a3;
		width: 85px;
		height: 25px;
		line-height: 25px;
		border-radius: 15px;
		margin: 20px auto 2px;
	}
</style>
