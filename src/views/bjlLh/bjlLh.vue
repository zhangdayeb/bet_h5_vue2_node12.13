<template>
    <div class="bet">
        <!-- 网络连接状态指示器 -->
        <div class="network-status" :class="connectionStatus" v-if="connectionStatus !== 'connected'">
            <div class="status-content">
                <i class="status-icon" :class="connectionStatus"></i>
                <span class="status-text">{{ connectionStatusText }}</span>
                <!-- 手动重连按钮 -->
                <button 
                    v-if="connectionStatus === 'failed' || connectionStatus === 'disconnected'" 
                    @click="manualReconnect"
                    class="reconnect-btn"
                >
                    重连
                </button>
            </div>
        </div>

        <!-- 主游戏区域 -->
        <section class="bet-wrapper">
            
            <!-- 连接中断时的遮罩层 -->
            <div v-if="!isConnected" class="connection-overlay-content">
                <div class="overlay-icon" :class="connectionStatus"></div>
                <div class="overlay-text">{{ connectionStatusText }}</div>
                <div class="overlay-subtitle">游戏暂时无法进行，请稍候...</div>
            </div>

            <!-- 百家乐投注区域 -->
            <div class="bet-box" v-if="gameType == 3">
                <!-- 第一行：特殊玩法区域 -->
                <div class="bet-row bet-row-special">
                    <div 
                        :class="[target.className, target.flashClass, 'bet-area']" 
                        v-for="(target, targetIndex) in betTargetList.slice(3, 8)"
                        :key="'special-' + targetIndex" 
                        @click="bet(target)"
                    >
                        <!-- 下注区域内容 -->
                        <div class="bet-content">
                            <!-- 名称和赔率 -->
                            <div class="bet-info">
                                <span class="bet-label">{{ target.label }}</span>
                                <span class="bet-ratio">{{ target.ratio }}</span>
                            </div>
                        </div>
                        
                        <!-- 筹码显示区域 - 显示金额 -->
                        <div class="bet-chip-container" v-if="target.betAmount > 0">
                            <div 
                                class="bet-chip-item" 
                                v-for="(chip, chipIndex) in target.showChip" 
                                :key="'chip-' + chipIndex" 
                                :style="{ bottom: chipIndex * 2 + 'px', zIndex: chipIndex + 1 }"
                            >
                                <img :src="chip.betSrc" width="20" height="20" alt="筹码">
                            </div>
                            <!-- 显示总金额 -->
                            <div class="bet-total-amount">{{ target.betAmount }}</div>
                        </div>
                    </div>
                </div>
                
                <!-- 第二行：基础玩法区域 -->
                <div class="bet-row bet-row-basic">
                    <div 
                        :class="[target.className, target.flashClass, 'bet-area']" 
                        v-for="(target, targetIndex) in betTargetList.slice(0, 3)"
                        :key="'basic-' + targetIndex" 
                        @click="bet(target)"
                    >
                        <!-- 下注区域内容 -->
                        <div class="bet-content">
                            <div class="bet-info">
                                <span class="bet-label">{{ target.label }}</span>
                                <span class="bet-ratio">{{ target.ratio }}</span>
                            </div>
                        </div>
                        
                        <!-- 筹码显示 - 显示金额 -->
                        <div class="bet-chip-container" v-if="target.betAmount > 0">
                            <div 
                                class="bet-chip-item" 
                                v-for="(chip, chipIndex) in target.showChip" 
                                :key="'chip-' + chipIndex" 
                                :style="{ bottom: chipIndex * 2 + 'px', zIndex: chipIndex + 1 }"
                            >
                                <img :src="chip.betSrc" width="20" height="20" alt="筹码">
                            </div>
                            <!-- 显示总金额 -->
                            <div class="bet-total-amount">{{ target.betAmount }}</div>
                        </div>
                    </div>
                </div>				
            </div>
            
            <!-- 龙虎投注区域 -->
            <div class="bet-box" v-if="gameType == 2">
                <div class="bet-row-longhu">
                    <div 
                        class="bet-area-longhu" 
                        :class="[target.className, target.flashClass]" 
                        v-for="(target, targetIndex) in betTargetList" 
                        :key="'longhu-' + targetIndex" 
                        @click="bet(target)"
                    >
                        <!-- 龙虎区域内容 -->
                        <div class="bet-content-longhu">
                            <div class="bet-image">
                                <img :src="target.imgUrl" :width="target.imgWidth" alt="龙虎图标">
                            </div>
                            <div class="bet-label-longhu">{{ target.label }}</div>
                        </div>
                        
                        <!-- 筹码显示 - 显示金额 -->
                        <div class="bet-chip-container" v-if="target.betAmount > 0">
                            <div 
                                class="bet-chip-item" 
                                v-for="(chip, chipIndex) in target.showChip" 
                                :key="'chip-' + chipIndex" 
                                :style="{ bottom: chipIndex * 2 + 'px', zIndex: chipIndex + 1 }"
                            >
                                <img :src="chip.betSrc" width="20" height="20" alt="筹码">
                            </div>
                            <!-- 显示总金额 -->
                            <div class="bet-total-amount">{{ target.betAmount }}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 筹码选择和控制区域 - 优化布局 -->
            <div class="bet-control-panel">
                <!-- 筹码选择区域 -->
                <div class="chip-selection-area">
                    <div class="chip-list">
                        <!-- 常用筹码显示 -->
                        <div 
                            class="chip-item" 
                            v-for="chip in choiceChips" 
                            :key="'choice-' + chip.index" 
                            @click="handleCureentChip(chip)"
                            :class="{ 'active': currentChip && currentChip.index === chip.index }"
                        >
                            <img :src="chip.src" width="50" height="50" alt="筹码">
                            <div class="chip-value">{{ chip.text }}</div>
                            <!-- 未选中时的遮罩 -->
                            <div 
                                class="chip-mask" 
                                v-if="!currentChip || currentChip.index !== chip.index"
                            ></div>
                        </div>
                        
                        <!-- 更多筹码选择按钮 -->
                        <div class="chip-item chip-more" @click="setShowChips(true)">
                            <img 
                                class="chip-more-btn" 
                                src="@/assets/imgs/chips/chip.png" 
                                width="50" 
                                height="50" 
                                alt="更多筹码"
                            >
                            <div class="chip-value">更多</div>
                        </div>
                    </div>
                </div>
                
                <!-- 操作按钮区域 -->
                <div class="action-buttons-area">
                    <BetBtnsXc 
                        :showFree="gameType == 3" 
                        :Freebool="Freebool" 
                        @repeatBet="repeatBet()" 
                        @submitBet="betOrder()" 
                        @cancelBet="handleCancel()" 
                        @setFree="setFree()"
                    ></BetBtnsXc>
                </div>
            </div>
            
            <!-- 筹码选择弹窗 -->
            <SelectChip 
                v-if="showChips" 
                :choiceChips="choiceChips" 
                @cancel="setShowChips($event)" 
                @confirm="handleConfirm($event)" 
                @selectChipError="hanldeSelectChipError($event)"
            ></SelectChip>
        </section>
        
        <!-- 欢迎消息弹窗 -->
        <WelcomeMssage 
            v-if="showWelcomeMsg.show" 
            @closeMsg="closeMsg($event)" 
            :msg="welcomeMsg"
        ></WelcomeMssage>
        
        <!-- 🆕 中奖弹窗组件 NEW: Winning popup component -->
        <WinningPopup 
            :show="showWinningPopup"
            :amount="winningAmount"
            :autoClose="true"
            :autoCloseDelay="5000"
            @close="handleWinningPopupClose"
            @playWinSound="handlePlayWinSound"
        ></WinningPopup>
        
        <!-- 错误提示消息弹窗 -->
        <div v-if="showErrorMsg" class="error-message-overlay" @click="hideErrorMessage">
            <div class="error-message-panel" @click.stop>
                <div class="error-message-text">{{ errorMessageText }}</div>
                <button class="error-message-btn" @click="hideErrorMessage">确定</button>
            </div>
        </div>
        
        <!-- 隐藏调试信息面板 -->
        <!-- <div class="debug-panel" v-if="isDevelopment">
            调试信息已隐藏，可在控制台查看
        </div> -->
    </div>
</template>

<!-- 引入 JavaScript 逻辑 -->
<script src='./bjlLh.js'></script>

<!-- 引入样式文件 -->
<style lang="less" src='./bjlLh.less' scoped></style>