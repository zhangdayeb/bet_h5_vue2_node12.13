<template>
  	<div class="home">
		<div>
			<canvas id="canvas"></canvas>
		</div>
		<button @click="setAnimation()">上移1</button>
		<button @click="setAnimation2()">旋转2图</button>
		<button @click="setAnimation3()">x轴旋转2图</button>
		<div>
			{{obj}}
		</div>
  	</div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
// import {fabric} from '@/assets/plugins/fabric.min'
import {fabric} from 'fabric'
import {CanvasApi} from '@/common/canvasApi'

// fabric 插件对象
const Fabric = fabric
let canvas = null

export default {
    name: 'Home',
    components: {
        // HelloWorld
    },
	data(){
		return {
			canvasApi: null,
			//图片数组对象
			imgArr: [],
			top: 200,
			angle: 120,
			obj: '中华兴隆'
		}
	},
	mounted(){
		this.init()
	},
	methods: {
		init(){
			// var c=document.getElementById("canvas");
			// var ctx=c.getContext("2d");

			// ctx.font="80px Georgia";
			// ctx.fillText("Hello World!",10,50);
			
			// 建立canvas对象
			canvas = new Fabric.Canvas('canvas', {
				width: 0,
				height: 0,
				hoverCursor: 'default'
			})
			
			// 设置canvas宽度
			canvas.setWidth(500)
			// 设置canvas高度
			canvas.setHeight(250)
			this.canvasApi = new CanvasApi(canvas)
			this.drawCanvasBG()
			let f4 = require('@/assets/imgs/poker/f4.png')
			this.canvasApi.drawImage(f4, 0, 200,'f4',)
			this.canvasApi.drawImage(f4, 100, 100,'f4-2')
			this.canvasApi.drawText('超牛',0, 0, 50, `txt-555-0-dssaaa0`, 'red', '', true)

			const objects = canvas.getObjects()
			this.obj = JSON.stringify(objects[0])
			this.$forceUpdate();
			console.log("objects:",JSON.stringify(objects[0]) )
			// var c=document.getElementById("canvas");
			// var ctx=c.getContext("2d");

			// ctx.font="80px Georgia";
			// ctx.fillText("Hello World!",10,50);
		},

		/***
		 * 画背景图片
		*/
		drawCanvasBG(){
			let bg = require('@/assets/imgs/bg1.jpg')
			Fabric.Image.fromURL(bg, (img) => {
				canvas.setBackgroundImage(img)
				canvas.renderAll();
			})
		},

		/**
		 * 设置动画
		*/
		setAnimation() {
			let objList = this.getObjects((object) => {
				return object
			})
			let obj = objList[0]
			this.top -= 20
			obj.animate('top', this.top, {
				onChange: canvas.renderAll.bind(canvas),
				duration: 200,
				// easing: fabric.util.ease.easeOutBounce
			});
			
			console.log('objList:',obj)
		},
		setAnimation2(){
			let objList = this.getObjects((object) => {
				return object
			})
			let obj = objList[1]
			obj.animate('angle',this.angle,{
				onChange: canvas.renderAll.bind(canvas)
			})
			this.angle += 50
		},
		setAnimation3() {
			let objList = this.getObjects((object) => {
				return object
			})
			
			let obj = objList[1]
			console.log(obj)
			// obj.rotate(this.angle)
			// obj.animate('rotateX',this.angle,{
			// 	onChange: canvas.renderAll.bind(canvas)
			// })
			obj.rotate(this.angle)
			canvas.renderAll()
			this.angle += 50
		},
		
	}
}
</script>
<style lang="less" scoped>
.home{
	height: 100%;
	width: 100%;
}
</style>