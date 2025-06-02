<template>
  	<div class="bet">
		<section class="bet-wrapper">
            <div class="bet-box" v-if="gameType == 3">
                <div class="bet-row">
                    <div :class="[target.className,target.flashClass]" v-for="(target,targetIndex) in betTargetList.slice(0,3)"
                    :key="targetIndex" @click="bet(target)">
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
                <div class="bet-row">
                    <div :class="[target.className,target.flashClass]" v-for="(target,targetIndex) in betTargetList.slice(3,6)"
                    :key="targetIndex" @click="bet(target)">
                        <div class="bet-adds">
                            <img :src="target.imgUrl" :class="{'bet-zhuang-adds':targetIndex==2}" :width="target.imgWidth" alt="">
                            <span class="" v-if="targetIndex==2 && noFree">
                                1:0.95
                            </span>
                            <span class="" v-if="targetIndex==2 && !noFree">
                                1:1
                            </span>
                        </div>
                        <div class="bet-zhuang-six" v-if="targetIndex == 2 && !noFree">
                            <div>{{$t("bjlAndLh.zhuangWins")}}</div>
                            <div>1:0.5</div>
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
					<div class="bet-chip-item" @click="setShoeChips(true)" >
						<img class="bet-ship-btn" src="@/assets/imgs/chips/chip.png" width="40" height="40" alt="" srcset="">
					</div>
                </div>
                <div class="bet-btns-block">
                    <BetBtns :showFree="gameType == 3" :noFree="noFree" @repeatBet="repeatBet()" @submitBet="betOrder()" @cancelBet="handleCancel()" @setFree="setFree()"  ></BetBtns>
                </div>
                <div class="bet-remain">
                    
                </div>
                
            </div>
            <SelectChip v-if="showChips" :choiceChips="choiceChips" @cancel="setShoeChips($event)" @confirm="handleConfirm($event)" @selectChipError="hanldeSelectChipError($event)" ></SelectChip>
            
        </section>

        <WelcomeMssage v-if="showWelcomeMsg.show" @closeMsg="closeMsg($event)" :msg="welcomeMsg"></WelcomeMssage>
  	</div>
</template>

<script src='./bjlAndLh.js'></script>
<style lang="less" src='./bjlAndLh.less' scoped ></style>