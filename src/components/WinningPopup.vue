<template>
  <div v-if="show" class="winning-popup-overlay" @click="handleClose">
    <div class="winning-popup-container" @click.stop>
      <!-- 背景光效 -->
      <div class="winning-background-effect"></div>
      
      <!-- 主要内容区域 -->
      <div class="winning-content">
        <!-- 庆祝标题 -->
        <div class="winning-title">
          <h1 class="winning-text">🎉 恭喜中奖！</h1>
          <div class="winning-subtitle">{{'恭喜您获得奖金' }}</div>
        </div>
        
        <!-- 中奖金额显示 -->
        <div class="winning-amount-section">
          <!-- <div class="winning-amount-label">中奖金额</div>
          <div class="winning-amount-value">
            <span class="currency-symbol">¥</span>
            <span class="amount-number">{{ formattedAmount }}</span>
          </div> -->
        </div>
        
        <!-- 装饰元素 -->
        <div class="winning-decorations">
          <!-- 金币动画 -->
          <div 
            v-for="(coin, index) in coins" 
            :key="`coin-${index}`"
            class="floating-coin"
            :style="coin.style"
          >
            💰
          </div>
          
          <!-- 星星闪烁 -->
          <div 
            v-for="(star, index) in stars" 
            :key="`star-${index}`"
            class="floating-star"
            :style="star.style"
          >
            ⭐
          </div>
        </div>
        
        <!-- 关闭按钮 -->
        <div class="winning-actions">
          <button class="winning-close-btn" @click="handleClose">
            {{ $t('chips.ok') || '确定' }}
          </button>
        </div>
      </div>
      
      <!-- 彩带效果 -->
      <div class="confetti-container">
        <div 
          v-for="(confetti, index) in confettiPieces" 
          :key="`confetti-${index}`"
          class="confetti-piece"
          :style="confetti.style"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WinningPopup',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    amount: {
      type: [Number, String],
      default: 0
    },
    autoClose: {
      type: Boolean,
      default: true
    },
    autoCloseDelay: {
      type: Number,
      default: 5000 // 5秒自动关闭
    }
  },
  data() {
    return {
      coins: [],
      stars: [],
      confettiPieces: [],
      autoCloseTimer: null,
      animationFrame: null
    }
  },
  computed: {
    formattedAmount() {
      const num = Number(this.amount) || 0
      return num.toLocaleString('zh-CN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.startWinningAnimation()
        this.setupAutoClose()
      } else {
        this.cleanup()
      }
    }
  },
  methods: {
    /**
     * 开始中奖动画
     */
    startWinningAnimation() {
      console.log('🎉 开始中奖动画')
      
      // 生成金币
      this.generateCoins()
      
      // 生成星星
      this.generateStars()
      
      // 生成彩带
      this.generateConfetti()
      
      // 播放中奖音效
      this.$emit('playWinSound')
    },
    
    /**
     * 生成金币动画
     */
    generateCoins() {
      this.coins = []
      const coinCount = 8
      
      for (let i = 0; i < coinCount; i++) {
        const coin = {
          style: {
            '--delay': `${i * 0.2}s`,
            '--duration': `${2 + Math.random()}s`,
            '--start-x': `${20 + Math.random() * 60}%`,
            '--end-x': `${10 + Math.random() * 80}%`,
            '--start-y': `${30 + Math.random() * 20}%`,
            '--end-y': `${70 + Math.random() * 20}%`,
            '--rotation': `${Math.random() * 720}deg`
          }
        }
        this.coins.push(coin)
      }
    },
    
    /**
     * 生成星星动画
     */
    generateStars() {
      this.stars = []
      const starCount = 6
      
      for (let i = 0; i < starCount; i++) {
        const star = {
          style: {
            '--delay': `${i * 0.3}s`,
            '--duration': `${1.5 + Math.random() * 0.5}s`,
            '--start-x': `${Math.random() * 100}%`,
            '--start-y': `${Math.random() * 100}%`,
            '--scale': Math.random() * 0.5 + 0.5
          }
        }
        this.stars.push(star)
      }
    },
    
    /**
     * 生成彩带效果
     */
    generateConfetti() {
      this.confettiPieces = []
      const confettiCount = 12
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7']
      
      for (let i = 0; i < confettiCount; i++) {
        const confetti = {
          style: {
            '--delay': `${i * 0.1}s`,
            '--duration': `${3 + Math.random() * 2}s`,
            '--start-x': `${Math.random() * 100}%`,
            '--end-x': `${Math.random() * 100}%`,
            '--rotation': `${Math.random() * 720}deg`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`
          }
        }
        this.confettiPieces.push(confetti)
      }
    },
    
    /**
     * 设置自动关闭
     */
    setupAutoClose() {
      if (this.autoClose && this.autoCloseDelay > 0) {
        this.autoCloseTimer = setTimeout(() => {
          this.handleClose()
        }, this.autoCloseDelay)
      }
    },
    
    /**
     * 处理关闭事件
     */
    handleClose() {
      console.log('🎉 关闭中奖弹窗')
      this.$emit('close')
    },
    
    /**
     * 清理资源
     */
    cleanup() {
      if (this.autoCloseTimer) {
        clearTimeout(this.autoCloseTimer)
        this.autoCloseTimer = null
      }
      
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }
      
      this.coins = []
      this.stars = []
      this.confettiPieces = []
    }
  },
  beforeUnmount() {
    this.cleanup()
  }
}
</script>

<style lang="less" scoped>
/* ================================
   中奖弹窗主容器
   ================================ */
.winning-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
  animation: overlayFadeIn 0.3s ease-out;
}

.winning-popup-container {
  position: relative;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
  border-radius: 20px;
  padding: 40px 30px;
  min-width: 350px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 
    0 20px 60px rgba(255, 215, 0, 0.4),
    0 0 0 3px rgba(255, 255, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  animation: popupSlideIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  overflow: hidden;
}

/* ================================
   背景光效
   ================================ */
.winning-background-effect {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: backgroundPulse 2s ease-in-out infinite;
}

/* ================================
   内容区域
   ================================ */
.winning-content {
  position: relative;
  z-index: 2;
}

.winning-title {
  margin-bottom: 30px;
}

.winning-text {
  font-size: 28px;
  font-weight: bold;
  color: #d4af37;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  margin: 0 0 10px 0;
  animation: titleBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.winning-subtitle {
  font-size: 16px;
  color: #8b7000;
  font-weight: 500;
}

/* ================================
   中奖金额显示
   ================================ */
.winning-amount-section {
  margin: 30px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.winning-amount-label {
  font-size: 14px;
  color: #8b7000;
  margin-bottom: 10px;
  font-weight: 600;
}

.winning-amount-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.currency-symbol {
  font-size: 24px;
  color: #d4af37;
  font-weight: bold;
}

.amount-number {
  font-size: 36px;
  font-weight: bold;
  color: #d4af37;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  animation: amountPulse 1s ease-in-out infinite;
}

/* ================================
   装饰动画元素
   ================================ */
.winning-decorations {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.floating-coin {
  position: absolute;
  font-size: 24px;
  animation: coinFloat var(--duration, 2s) ease-in-out var(--delay, 0s) infinite;
  left: var(--start-x, 50%);
  top: var(--start-y, 50%);
}

.floating-star {
  position: absolute;
  font-size: 20px;
  animation: starTwinkle var(--duration, 1.5s) ease-in-out var(--delay, 0s) infinite;
  left: var(--start-x, 50%);
  top: var(--start-y, 50%);
  transform: scale(var(--scale, 1));
}

/* ================================
   彩带效果
   ================================ */
.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -10px;
  left: var(--start-x, 50%);
  border-radius: 2px;
  animation: confettiFall var(--duration, 3s) ease-in var(--delay, 0s) infinite;
}

/* ================================
   操作按钮
   ================================ */
.winning-actions {
  margin-top: 30px;
}

.winning-close-btn {
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
  border: none;
  color: white;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #b8941f 0%, #9d7d1a 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
  }
}

/* ================================
   动画定义
   ================================ */

/* 弹窗入场动画 */
@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes popupSlideIn {
  from {
    opacity: 0;
    transform: scale(0.5) translateY(-50px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 标题弹跳动画 */
@keyframes titleBounce {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-10deg);
  }
  50% {
    transform: scale(1.1) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* 金额脉搏动画 */
@keyframes amountPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 背景光效脉搏 */
@keyframes backgroundPulse {
  0%, 100% {
    opacity: 0.1;
    transform: scale(1);
  }
  50% {
    opacity: 0.2;
    transform: scale(1.1);
  }
}

/* 金币漂浮动画 */
@keyframes coinFloat {
  0% {
    opacity: 0;
    transform: translateY(0) rotate(0deg) scale(0);
  }
  20% {
    opacity: 1;
    transform: translateY(-20px) rotate(180deg) scale(1);
  }
  80% {
    opacity: 1;
    transform: translateY(-60px) rotate(540deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) rotate(720deg) scale(0);
  }
}

/* 星星闪烁动画 */
@keyframes starTwinkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  25% {
    opacity: 1;
    transform: scale(1) rotate(90deg);
  }
  75% {
    opacity: 1;
    transform: scale(1.2) rotate(270deg);
  }
}

/* 彩带下落动画 */
@keyframes confettiFall {
  0% {
    opacity: 1;
    transform: translateY(-10px) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(400px) rotate(var(--rotation, 720deg));
  }
}

/* ================================
   响应式设计
   ================================ */
@media (max-width: 768px) {
  .winning-popup-container {
    margin: 20px;
    padding: 30px 20px;
    min-width: 300px;
  }
  
  .winning-text {
    font-size: 24px;
  }
  
  .amount-number {
    font-size: 28px;
  }
  
  .currency-symbol {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .winning-popup-container {
    margin: 15px;
    padding: 25px 15px;
    min-width: 280px;
  }
  
  .winning-text {
    font-size: 20px;
  }
  
  .amount-number {
    font-size: 24px;
  }
  
  .floating-coin {
    font-size: 20px;
  }
  
  .floating-star {
    font-size: 16px;
  }
}
</style>