<template>
  	<div class="cattle">
		<div class="cattle-wrapper" id="cattle-wrapper">
			<canvas class="cattle-canvas" id="canvas"></canvas>
            <div class="cattle-react-txt " :class="[item.className]" @click="htmltBet(index)" v-for="(item, index) in betNameList" :key="item.className">
                <div>
                    {{item.name}}
                </div>
                <div>
                   {{item.odds}}
                </div>
            </div>
            <div class="cattle-react-xian " :class="[item.className]"  v-for="(item) in palyerList" :key="item.className">
                <div>
                    {{item.name}}
                </div>
            </div>
		</div>
        <section class="cattle-section">
            <div class="cattle-chips">
                <div class="cattle-chip-item" v-for="chip in choiceChips" :key="chip.index" @click="handleCureentChip(chip)">
                    <img :src="chip.src" width="40" alt="" height="40" srcset="">
                    <div class="chip-mask" v-if="currentChip.index != chip.index"></div>
                </div>
                <div class="cattle-chip-item" @click="showChipList()">
                    <img class="cattle-ship-btn" src="@/assets/imgs/chips/chip.png" width="40" height="40" alt="" srcset="">
                </div>
            </div>
            <div class="cattle-btns-block">
                <BetBtns @repeatBet="handleRepeat()" @submitBet="handleSubmit()" @cancelBet="handleCancel()"></BetBtns>
            </div>
        </section>
        <SelectChip v-if="showChips" :choiceChips="choiceChips" @cancel="setShoeChips($event)" @confirm="handleConfirm($event)" @selectChipError="hanldeSelectChipError($event)"></SelectChip>
        <WelcomeMssage v-if="showWelcomeMsg.show" @closeMsg="closeMsg($event)" :msg="welcomeMsg"></WelcomeMssage>
    </div>
</template>

<script src='./cattle.js'></script>
<style lang="less" src='./cattle.less' scoped ></style>