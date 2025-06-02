<template>
  	<div class="san">
		<div class="san-wrapper" id="san-wrapper">
			<canvas class="san-canvas" id="canvas"></canvas>
		</div>
        <section class="san-section">
            <div class="san-chips">
                <div class="san-chip-item" v-for="chip in choiceChips" :key="chip.index" @click="handleCureentChip(chip)">
                    <img :src="chip.src" width="40" alt="" height="40" srcset="">
                    <div class="chip-mask" v-if="currentChip.index != chip.index"></div>
                </div>
                <div class="san-chip-item" @click="showChipList()">
                    <img class="san-ship-btn" src="@/assets/imgs/chips/chip.png" width="40" height="40" alt="" srcset="">
                </div>
            </div>
            <div class="san-btns-block">
                <BetBtns @repeatBet="handleRepeat()" @submitBet="handleSubmit()" @cancelBet="handleCancel()"></BetBtns>
            </div>
        </section>
        <SelectChip v-if="showChips" :choiceChips="choiceChips" @cancel="setShoeChips($event)" @confirm="handleConfirm($event)" @selectChipError="hanldeSelectChipError($event)"></SelectChip>
        <WelcomeMssage v-if="showWelcomeMsg.show" @closeMsg="closeMsg($event)" :msg="welcomeMsg"></WelcomeMssage>
    </div>
</template>

<script src='./sanGong.js'></script>
<style lang="less" src='./sanGong.less' scoped ></style>