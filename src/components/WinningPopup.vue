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
          <div class="winning-amount-label">中奖金额</div>
          <div class="winning-amount-value">
            <span class="currency-symbol">¥</span>
            <span class="amount-number">{{ formattedAmount }}</span>
          </div>
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
   中奖弹窗主容器 - 修复版本
   ================================ */
.winning-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85); /* 更深的背景 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(8px); /* 增强模糊效果 */
  animation: overlayFadeIn 0.3s ease-out;
}

.winning-popup-container {
  position: relative;
  /* 🔧 修复主色调：深金色到亮金色的渐变，增强对比 */
  background: linear-gradient(135deg, #b8860b 0%, #ffd700 30%, #ffed4e 70%, #ffd700 100%);
  border: 3px solid #8b6914; /* 深金色边框增强对比 */
  border-radius: 20px;
  padding: 40px 30px;
  min-width: 350px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 
    0 25px 80px rgba(184, 134, 11, 0.6), /* 深金色阴影 */
    0 0 0 4px rgba(139, 105, 20, 0.3), /* 深金色外边框 */
    inset 0 2px 0 rgba(255, 255, 255, 0.4); /* 内发光 */
  animation: popupSlideIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  overflow: hidden;
}

/* ================================
   背景光效 - 修复版本
   ================================ */
.winning-background-effect {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 237, 78, 0.1) 50%, transparent 70%);
  animation: backgroundPulse 2s ease-in-out infinite;
}

/* ================================
   内容区域 - 修复版本
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
  /* 🔧 修复标题颜色：深棕色增强对比 */
  color: #654321;
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.4),
    0 0 8px rgba(255, 255, 255, 0.3); /* 白色光晕 */
  margin: 0 0 10px 0;
  animation: titleBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.winning-subtitle {
  font-size: 16px;
  /* 🔧 修复副标题颜色：深棕色 */
  color: #8b4513;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

/* ================================
   中奖金额显示 - 修复版本
   ================================ */
.winning-amount-section {
  margin: 30px 0;
  padding: 25px;
  /* 🔧 修复金额区域背景：深色半透明增强对比 */
  background: rgba(139, 69, 19, 0.15); /* 深棕色半透明 */
  border: 2px solid rgba(139, 105, 20, 0.4); /* 深金色边框 */
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
}

.winning-amount-label {
  font-size: 14px;
  /* 🔧 修复标签颜色：深棕色 */
  color: #654321;
  margin-bottom: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.winning-amount-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.currency-symbol {
  font-size: 28px;
  /* 🔧 修复货币符号颜色：深金色 */
  color: #b8860b;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.amount-number {
  font-size: 42px;
  font-weight: bold;
  /* 🔧 修复金额数字颜色：深金色 */
  color: #b8860b;
  text-shadow: 
    3px 3px 6px rgba(0, 0, 0, 0.4),
    0 0 12px rgba(255, 255, 255, 0.2); /* 白色光晕 */
  animation: amountPulse 1.2s ease-in-out infinite;
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
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

.floating-star {
  position: absolute;
  font-size: 20px;
  animation: starTwinkle var(--duration, 1.5s) ease-in-out var(--delay, 0s) infinite;
  left: var(--start-x, 50%);
  top: var(--start-y, 50%);
  transform: scale(var(--scale, 1));
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2));
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
  border-radius: 3px;
  animation: confettiFall var(--duration, 3s) ease-in var(--delay, 0s) infinite;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* ================================
   操作按钮 - 修复版本
   ================================ */
.winning-actions {
  margin-top: 35px;
}

.winning-close-btn {
  /* 🔧 修复按钮颜色：深金色到深棕色渐变 */
  background: linear-gradient(135deg, #b8860b 0%, #8b6914 50%, #654321 100%);
  border: 2px solid #654321; /* 深棕色边框 */
  color: #fff; /* 白色文字确保对比 */
  padding: 14px 35px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 6px 20px rgba(101, 67, 33, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2); /* 内发光 */
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #8b6914 0%, #654321 50%, #4a2c17 100%);
    transform: translateY(-3px);
    box-shadow: 
      0 8px 25px rgba(101, 67, 33, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
  
  &:active {
    transform: translateY(-1px);
    box-shadow: 
      0 4px 15px rgba(101, 67, 33, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
}

/* ================================
   动画定义 - 保持不变
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

/* 金额脉搏动画 - 修复版本 */
@keyframes amountPulse {
  0%, 100% {
    transform: scale(1);
    text-shadow: 
      3px 3px 6px rgba(0, 0, 0, 0.4),
      0 0 12px rgba(255, 255, 255, 0.2);
  }
  50% {
    transform: scale(1.08);
    text-shadow: 
      3px 3px 8px rgba(0, 0, 0, 0.5),
      0 0 16px rgba(255, 255, 255, 0.3);
  }
}

/* 背景光效脉搏 */
@keyframes backgroundPulse {
  0%, 100% {
    opacity: 0.15;
    transform: scale(1);
  }
  50% {
    opacity: 0.25;
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
    font-size: 32px;
  }
  
  .currency-symbol {
    font-size: 24px;
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
    font-size: 28px;
  }
  
  .floating-coin {
    font-size: 20px;
  }
  
  .floating-star {
    font-size: 16px;
  }
  
  .winning-close-btn {
    padding: 12px 28px;
    font-size: 15px;
  }
}

@media (min-width: 1024px) {
  .winning-popup-container {
    min-width: 400px;
    padding: 45px 35px;
  }
  
  .winning-text {
    font-size: 32px;
  }
  
  .amount-number {
    font-size: 48px;
  }
  
  .currency-symbol {
    font-size: 32px;
  }
  
  .winning-close-btn {
    padding: 16px 40px;
    font-size: 17px;
  }
}
</style>