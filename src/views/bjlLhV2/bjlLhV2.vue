<template>
  	<div class="bet">
		<section class="bet-wrapper">
            <!-- 投注区域 百家乐 -->
            <div class="bet-box" v-if="gameType == 3">
                <!-- 第一行 -->
                <div class="bet-row">
                    <div :class="[target.className,target.flashClass]" v-for="(target,targetIndex) in betTargetList.slice(5,12)"
                    :key="targetIndex" @click="bet(target)">
                        <div class="bet-adds">
                            <!-- 名称 -->
                            <span>{{target.label}}</span>
                            <!-- 赔率 -->
                            <span style="font-size: 14px;margin-top: 3px">{{target.ratio}}</span>
                            <!-- 显示图片 -->
                            <!-- <img :src="target.imgUrl" :width="target.imgWidth" alt=""> -->
                        </div>
                        <!-- 筹码显示 -->
                        <div class="bet-chip" v-if="target.betAmount">
                            <div class="bet-chip-li" v-for="(chip,chipIndex) in target.showChip" :key="chipIndex" :style="{bottom: chipIndex * 1 + 'px',}">
                                <img :src="chip.betSrc" width='18' alt="">
                            </div>
                            <div class="bet-amount">{{ target.betAmount }}</div>
                        </div>
                    </div>
                </div>
                <!-- 第二行 -->
				<div class="bet-row">
				    <div :class="[target.className,target.flashClass]" v-for="(target,targetIndex) in betTargetList.slice(0,5)"
				    :key="targetIndex" @click="bet(target)">
				        <div class="bet-adds">
                            <!-- 名称 -->
                            <span>{{target.label}}</span>
                            <!-- 赔率 -->
                            <span class="" style="font-size: 14px;margin-top: 3px">{{target.ratio}}</span>
                            <!-- 图形显示 -->
				            <!-- <img :src="target.imgUrl" :class="{'bet-zhuang-adds':targetIndex==0}" :width="target.imgWidth" alt=""> -->
				        </div>
                        <!-- 筹码显示 -->
				        <div class="bet-chip" v-if="target.betAmount">
				            <div class="bet-chip-li" v-for="(chip,chipIndex) in target.showChip" :key="chipIndex" :style="{bottom: chipIndex * 1 + 'px',}">
				                <img :src="chip.betSrc" width='18' alt="">
				            </div>
				            <div class="bet-amount">{{ target.betAmount }}</div>
				        </div>
				    </div>
				</div>				
            </div>
            <!-- 投注区域 龙虎 -->
            <div class="bet-box" v-if="gameType == 2">
                <div class="bet-row-hu">
                    <div class="bet-taiger" :class="[target.className,target.flashClass]" v-for="(target,targetIndex) in betTargetList" :key='targetIndex' @click="bet(target)">
                        <div class="bet-adds">
                            <img :src="target.imgUrl" :width="target.imgWidth" alt="">
                        </div>
                        <div class="bet-chip" v-if="target.betAmount">
                            <div class="bet-chip-li" v-for="(chip,chipIndex) in target.showChip" :key="chipIndex" :style="{bottom: chipIndex * 1 + 'px',}">
                                <img :src="chip.betSrc" width='18' alt="">
                            </div>
                            <div class="bet-amount">{{ target.betAmount }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 筹码选择 进行投注 -->
            <div class="bet-select">
                <div class="bet-select-chips">
                    <!--- 单独筹码 1-5 的显示 -->
                    <div class="bet-chip-item" v-for="chip in choiceChips" :key="chip.index" @click="handleCureentChip(chip)" >
						<img :src="chip.src" width="40" height="40" alt="" srcset="">
						<div class="bet-chip-mask" v-if="currentChip.index != chip.index"></div>
					</div>
                    <!--- 点击设置 常用筹码 -->
					<div class="bet-chip-item" @click="setShowChips(true)" >
						<img class="bet-ship-btn" src="@/assets/imgs/chips/chip.png" width="40" height="40" alt="" srcset="">
					</div>
                </div>
                <!-- 确认 取消 重复 按钮 -->
                <div class="bet-btns-block">
                    <BetBtnsXc 
                        :showFree="true" 
                        :Freebool="Freebool" 
                        @repeatBet="repeatBet()" 
                        @submitBet="betOrder()" 
                        @cancelBet="handleCancel()" 
                        @setFree="setFree()"
                    ></BetBtnsXc>
                </div>
                <div class="bet-remain">                    
                </div>                
            </div>
            <!-- 选择筹码 选择出来最常用的代码 -->
            <SelectChip v-if="showChips" :choiceChips="choiceChips" @cancel="setShowChips($event)" @confirm="handleConfirm($event)" @selectChipError="hanldeSelectChipError($event)" ></SelectChip>
        </section>
        <!-- 欢迎信息 -->
        <WelcomeMssage v-if="showWelcomeMsg.show" @closeMsg="closeMsg($event)" :msg="welcomeMsg"></WelcomeMssage>
  	</div>
</template>
<!-- 引入 js -->
<script src='./bjlLhV2.js'></script>
<!-- 引入 css -->
<style lang="less" src='./bjlLhV2.less' scoped ></style>