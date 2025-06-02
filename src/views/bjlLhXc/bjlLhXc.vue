<template>
  	<div class="bet">
		<section class="bet-wrapper">
            <div class="bet-box" v-if="gameType == 3">
                
                <div class="bet-row">
                    <div :class="[target.className,target.flashClass]" v-for="(target,targetIndex) in betTargetList.slice(3,6)"
                    :key="targetIndex" @click="bet(target)">
                        <div class="bet-adds">
                            <span>{{target.label}}</span>
                            <span style="font-size: 14px;margin-top: 3px">{{target.ratio}}</span>
                            <!-- <img :src="target.imgUrl" :width="target.imgWidth" alt=""> -->
                        </div>
                        <div class="bet-chip" v-if="target.betAmount">
                            <div class="bet-chip-li" v-for="(chip,chipIndex) in target.showChip" :key="chipIndex" :style="{bottom: chipIndex * 1 + 'px',}">
                                <img :src="chip.betSrc" width='18' alt="">
                            </div>
                            <div class="bet-amount">{{ target.betAmount }}</div>
                        </div>
                    </div>
                </div>
				<div class="bet-row">
				    <div :class="[target.className,target.flashClass]" v-for="(target,targetIndex) in betTargetList.slice(0,3)"
				    :key="targetIndex" @click="bet(target)">
				        <div class="bet-adds">
                            <span>{{target.label}}</span>
				            <!-- <img :src="target.imgUrl" :class="{'bet-zhuang-adds':targetIndex==0}" :width="target.imgWidth" alt=""> -->
                            <span class="" style="font-size: 14px;margin-top: 3px">
							    {{target.ratio}}
							</span>
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
            <div class="bet-select">
                <div class="bet-select-chips">
                    <div class="bet-chip-item" v-for="chip in choiceChips" :key="chip.index" @click="handleCureentChip(chip)" >
						<img :src="chip.src" width="40" height="40" alt="" srcset="">
						<div class="bet-chip-mask" v-if="currentChip.index != chip.index"></div>
					</div>
					<div class="bet-chip-item" @click="setShowChips(true)" >
						<img class="bet-ship-btn" src="@/assets/imgs/chips/chip.png" width="40" height="40" alt="" srcset="">
					</div>
                </div>
                <div class="bet-btns-block">
                    <BetBtnsXc :showFree="gameType == 3" :noFree="noFree" @repeatBet="repeatBet()" @submitBet="betOrder()" @cancelBet="handleCancel()" @setFree="setFree()"  ></BetBtnsXc>
                </div>
                <div class="bet-remain">
                    
                </div>
                
            </div>
            <SelectChip v-if="showChips" :choiceChips="choiceChips" @cancel="setShowChips($event)" @confirm="handleConfirm($event)" @selectChipError="hanldeSelectChipError($event)" ></SelectChip>
            
        </section>

        <WelcomeMssage v-if="showWelcomeMsg.show" @closeMsg="closeMsg($event)" :msg="welcomeMsg"></WelcomeMssage>
  	</div>
</template>

<script src='./bjlLhXc.js'></script>
<style lang="less" src='./bjlLhXc.less' scoped ></style>