<template>
  <div v-if="show" class="winning-popup-overlay" @click="handleClose">
    <div class="winning-popup-container" @click="handleClose">
      <!-- 背景光效 -->
      <div class="winning-background-effect"></div>
      
      <!-- 主要内容区域 -->
      <div class="winning-content">
        <!-- 庆祝标题 -->
        <div class="winning-title">
          <h1 class="winning-text">🎉 恭喜中奖！</h1>
          <div class="winning-subtitle">恭喜您获得奖金</div>
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
     * 生成金币动画 - 🔧 减少数量
     */
    generateCoins() {
      this.coins = []
      const coinCount = 5 // 🔧 从8减少到5
      
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
     * 生成星星动画 - 🔧 减少数量
     */
    generateStars() {
      this.stars = []
      const starCount = 4 // 🔧 从6减少到4
      
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
     * 生成彩带效果 - 🔧 减少数量
     */
    generateConfetti() {
      this.confettiPieces = []
      const confettiCount = 8 // 🔧 从12减少到8
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
   中奖弹窗主容器 - 🔧 高度压缩版 + 去掉按钮
   ================================ */
.winning-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
  animation: overlayFadeIn 0.3s ease-out;
}

.winning-popup-container {
  position: relative;
  background: linear-gradient(135deg, #b8860b 0%, #ffd700 30%, #ffed4e 70%, #ffd700 100%);
  border: 3px solid #8b6914;
  border-radius: 10px;
  padding: 10px 20px; /* 🔧 根据你的调整：减少padding */
  min-width: 320px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 
    0 12px 40px rgba(184, 134, 11, 0.6),
    0 0 0 4px rgba(139, 105, 20, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.4);
  animation: popupSlideIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  /* 🔧 根据你的优化：增加max-height */
  max-height: 160px; /* 🔧 从140px调整为120px，比100px大一些 */
}

/* ================================
   背景光效 - 保持不变
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
   内容区域 - 🔧 压缩间距
   ================================ */
.winning-content {
  position: relative;
  z-index: 2;
}

.winning-title {
  margin-bottom: 8px; /* 🔧 从10px压缩到8px */
}

.winning-text {
  font-size: 20px; /* 🔧 从22px压缩到20px */
  font-weight: bold;
  color: #654321;
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.4),
    0 0 8px rgba(255, 255, 255, 0.3);
  margin: 0 0 3px 0; /* 🔧 从4px压缩到3px */
  animation: titleBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.winning-subtitle {
  font-size: 13px; /* 🔧 从14px压缩到13px */
  color: #8b4513;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

/* ================================
   中奖金额显示 - 🔧 大幅压缩
   ================================ */
.winning-amount-section {
  margin: 8px 15px; /* 🔧 左右增加边距：从8px 0改为8px 15px */
  padding: 10px; /* 🔧 从12px压缩到10px */
  background: rgba(139, 69, 19, 0.15);
  border: 2px solid rgba(139, 105, 20, 0.4);
  border-radius: 8px; /* 🔧 从10px压缩到8px */
  backdrop-filter: blur(10px);
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
}

.winning-amount-label {
  font-size: 11px; /* 🔧 从12px压缩到11px */
  color: #654321;
  margin-bottom: 3px; /* 🔧 从4px压缩到3px */
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.winning-amount-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px; /* 🔧 从6px压缩到5px */
}

.currency-symbol {
  font-size: 20px; /* 🔧 从22px压缩到20px */
  color: #b8860b;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.amount-number {
  font-size: 30px; /* 🔧 从32px压缩到30px */
  font-weight: bold;
  color: #b8860b;
  text-shadow: 
    3px 3px 6px rgba(0, 0, 0, 0.4),
    0 0 12px rgba(255, 255, 255, 0.2);
  animation: amountPulse 1.2s ease-in-out infinite;
}

/* ================================
   装饰动画元素 - 保持不变
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
  font-size: 20px; /* 🔧 从24px压缩到20px */
  animation: coinFloat var(--duration, 2s) ease-in-out var(--delay, 0s) infinite;
  left: var(--start-x, 50%);
  top: var(--start-y, 50%);
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

.floating-star {
  position: absolute;
  font-size: 16px; /* 🔧 从20px压缩到16px */
  animation: starTwinkle var(--duration, 1.5s) ease-in-out var(--delay, 0s) infinite;
  left: var(--start-x, 50%);
  top: var(--start-y, 50%);
  transform: scale(var(--scale, 1));
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2));
}

/* ================================
   彩带效果 - 保持不变
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
   🆕 添加点击提示效果 (替代按钮功能)
   ================================ */
.winning-popup-container:hover {
  transform: scale(1.02);
  box-shadow: 
    0 15px 50px rgba(184, 134, 11, 0.7),
    0 0 0 4px rgba(139, 105, 20, 0.4),
    inset 0 2px 0 rgba(255, 255, 255, 0.5);
}

.winning-popup-container:active {
  transform: scale(0.98);
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

/* 金额脉搏动画 */
@keyframes amountPulse {
  0%, 100% {
    transform: scale(1);
    text-shadow: 
      3px 3px 6px rgba(0, 0, 0, 0.4),
      0 0 12px rgba(255, 255, 255, 0.2);
  }
  50% {
    transform: scale(1.06); /* 🔧 从1.08减少到1.06 */
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
   响应式设计 - 🔧 高度优化版，去掉按钮
   ================================ */
@media (max-width: 768px) {
  .winning-popup-container {
    margin: 10px;
    padding: 8px 20px; /* 🔧 根据你的调整：进一步减少padding */
    min-width: 300px;
    max-height: 160px; /* 🔧 从120px调整为110px */
  }
  
  .winning-text {
    font-size: 20px;
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
    margin: 8px;
    padding: 8px 15px; /* 🔧 根据你的调整：统一使用8px */
    min-width: 280px;
    max-height: 160px; /* 🔧 小屏幕保持100px */
  }
  
  .winning-title {
    margin-bottom: 6px; /* 🔧 进一步压缩 */
  }
  
  .winning-text {
    font-size: 18px;
    margin: 0 0 2px 0; /* 🔧 进一步压缩 */
  }
  
  .winning-subtitle {
    font-size: 12px;
  }
  
  .winning-amount-section {
    margin: 6px 12px; /* 🔧 移动端也增加左右边距 */
    padding: 8px; /* 🔧 进一步压缩 */
  }
  
  .amount-number {
    font-size: 24px;
  }
  
  .currency-symbol {
    font-size: 18px;
  }
  
  .floating-coin {
    font-size: 16px;
  }
  
  .floating-star {
    font-size: 14px;
  }
}

/* 🔧 新增：极低高度屏幕的特殊处理 */
@media (max-height: 400px) {
  .winning-popup-container {
    padding: 8px 20px; /* 🔧 根据你的调整：使用8px */
    min-width: 280px;
    max-height: 160px; /* 🔧 从100px调整为90px，避免过小 */
    border-radius: 8px;
  }
  
  .winning-title {
    margin-bottom: 5px; /* 🔧 极度压缩 */
  }
  
  .winning-text {
    font-size: 16px; /* 🔧 极度压缩 */
    margin: 0 0 2px 0;
  }
  
  .winning-subtitle {
    font-size: 11px;
  }
  
  .winning-amount-section {
    margin: 5px 10px; /* 🔧 极低屏幕也保持左右边距 */
    padding: 6px; /* 🔧 极度压缩 */
  }
  
  .winning-amount-label {
    font-size: 10px;
    margin-bottom: 2px;
  }
  
  .amount-number {
    font-size: 20px; /* 🔧 极度压缩 */
  }
  
  .currency-symbol {
    font-size: 16px;
  }
}

@media (min-width: 1024px) {
  .winning-popup-container {
    min-width: 350px;
    padding: 12px 25px; /* 🔧 根据你的调整：大屏幕适度放宽 */
    max-height: 160px; /* 🔧 大屏幕稍微增加高度 */
  }
  
  .winning-text {
    font-size: 24px; /* 🔧 适中放大 */
  }
  
  .amount-number {
    font-size: 34px; /* 🔧 适中放大 */
  }
  
  .currency-symbol {
    font-size: 24px; /* 🔧 适中放大 */
  }
}
</style>