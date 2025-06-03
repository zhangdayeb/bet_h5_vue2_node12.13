// src/views/bjlLh/composables/useChips.js
// 筹码管理 - 筹码选择、显示、转换算法

import { ref, computed } from 'vue'
import chips from '@/common/allChipList.js'

/**
 * 筹码管理
 */
export function useChips() {
  // 所有筹码配置
  const allChips = chips.allChips
  
  // 用户选择的常用筹码（最多5个）
  const choiceChips = ref([])
  
  // 当前选中的筹码
  const currentChip = ref(null)
  
  // 是否显示筹码选择弹窗
  const showChips = ref(false)
  
  // 下注总金额
  const totalMoney = ref(0)

  // 计算属性：是否有选中的筹码
  const hasCurrentChip = computed(() => {
    return currentChip.value !== null
  })

  // 计算属性：当前筹码的面值
  const currentChipValue = computed(() => {
    return currentChip.value ? currentChip.value.val : 0
  })

  /**
   * 初始化筹码管理
   * @param {Array} userChips - 用户的常用筹码数据
   */
  const initChips = (userChips = []) => {
    console.log('🎰 初始化筹码管理:', userChips)
    
    if (userChips && userChips.length > 0) {
      // 使用用户设置的筹码
      choiceChips.value = []
      userChips.forEach(userChip => {
        const chip = allChips.find(c => c.val === userChip.val)
        if (chip) {
          choiceChips.value.push({ ...chip })
        }
      })
    } else {
      // 使用默认筹码（去掉第一个，取前5个）
      choiceChips.value = allChips.slice(3, 8).map(chip => ({ ...chip }))
    }

    // 设置第一个为当前选中筹码
    if (choiceChips.value.length > 0) {
      handleCurrentChip(choiceChips.value[0])
    }

    console.log('✅ 筹码初始化完成:', choiceChips.value.map(c => c.text))
  }

  /**
   * 设置当前选中的筹码
   * @param {Object} chip - 筹码对象
   */
  const handleCurrentChip = (chip) => {
    if (!chip) return
    
    currentChip.value = chip
    console.log('🎯 选中筹码:', chip.text, '面值:', chip.val)
  }

  /**
   * 筹码金额转换为筹码显示数组
   * @param {number} amount - 总金额
   * @returns {Array} 筹码显示数组
   */
  const conversionChip = (amount) => {
    return findMaxChip(amount)
  }

  /**
   * 递归查找最佳筹码组合算法
   * @param {number} amount - 剩余金额
   * @param {Array} tempChips - 临时筹码数组
   * @returns {Array} 筹码组合数组
   */
  const findMaxChip = (amount = 0, tempChips = []) => {
    if (amount === 0) return tempChips

    let chip = {}
    
    // 查找最适合的筹码
    for (let i = 0; i < allChips.length - 1; i++) {
      if (allChips[i].val <= Number(amount) && allChips[i + 1].val > Number(amount)) {
        chip = allChips[i]
        break
      } else {
        chip = allChips[allChips.length - 1]
      }
    }

    const restAmount = amount - chip.val
    tempChips.push({ ...chip })

    if (restAmount > 0) {
      return findMaxChip(restAmount, tempChips)
    }

    return tempChips
  }

  /**
   * 显示筹码选择弹窗
   */
  const setShowChips = (show) => {
    showChips.value = show
    console.log('🎰 筹码选择弹窗:', show ? '显示' : '隐藏')
  }

  /**
   * 处理筹码选择确认
   * @param {Array} selectedChips - 用户选择的筹码数组
   */
  const handleChipConfirm = (selectedChips) => {
    if (!selectedChips || selectedChips.length === 0) {
      console.warn('⚠️ 没有选择筹码')
      return
    }

    choiceChips.value = selectedChips.map(chip => ({ ...chip }))
    showChips.value = false

    // 检查当前选中的筹码是否还在新的选择中
    let currentChipExists = false
    if (currentChip.value) {
      currentChipExists = choiceChips.value.some(chip => chip.index === currentChip.value.index)
    }

    // 如果当前筹码不在新选择中，或者没有当前筹码，选择第一个
    if (!currentChipExists && choiceChips.value.length > 0) {
      handleCurrentChip(choiceChips.value[0])
    }

    console.log('✅ 筹码选择确认:', choiceChips.value.map(c => c.text))
  }

  /**
   * 处理筹码选择错误
   * @param {Object} errorData - 错误信息
   */
  const handleChipSelectError = (errorData) => {
    console.error('❌ 筹码选择错误:', errorData)
    // 这里可以触发错误提示
    return errorData
  }

  /**
   * 增加总金额
   * @param {number} amount - 要增加的金额
   */
  const addTotalMoney = (amount) => {
    totalMoney.value += Number(amount)
    console.log('💰 增加金额:', amount, '总金额:', totalMoney.value)
  }

  /**
   * 重置总金额
   */
  const resetTotalMoney = () => {
    totalMoney.value = 0
    console.log('🔄 重置总金额')
  }

  /**
   * 获取筹码的显示图片
   * @param {Object} chip - 筹码对象
   * @param {boolean} isBet - 是否为下注状态（使用小图）
   * @returns {string} 图片路径
   */
  const getChipImage = (chip, isBet = false) => {
    if (!chip) return ''
    return isBet ? chip.betSrc : chip.src
  }

  /**
   * 根据面值查找筹码
   * @param {number} value - 筹码面值
   * @returns {Object|null} 筹码对象
   */
  const findChipByValue = (value) => {
    return allChips.find(chip => chip.val === value) || null
  }

  /**
   * 根据索引查找筹码
   * @param {number} index - 筹码索引
   * @returns {Object|null} 筹码对象
   */
  const findChipByIndex = (index) => {
    return allChips.find(chip => chip.index === index) || null
  }

  /**
   * 获取筹码显示文本
   * @param {Object} chip - 筹码对象
   * @returns {string} 显示文本
   */
  const getChipDisplayText = (chip) => {
    if (!chip) return ''
    return chip.text || chip.val.toString()
  }

  /**
   * 验证筹码选择
   * @param {Array} chips - 筹码数组
   * @returns {Object} 验证结果
   */
  const validateChipSelection = (chips) => {
    const result = {
      isValid: true,
      errors: []
    }

    if (!chips || !Array.isArray(chips)) {
      result.isValid = false
      result.errors.push('筹码数据无效')
      return result
    }

    if (chips.length === 0) {
      result.isValid = false
      result.errors.push('至少需要选择一个筹码')
      return result
    }

    if (chips.length > 5) {
      result.isValid = false
      result.errors.push('最多只能选择5个筹码')
      return result
    }

    // 检查重复
    const values = chips.map(chip => chip.val)
    const uniqueValues = [...new Set(values)]
    if (values.length !== uniqueValues.length) {
      result.isValid = false
      result.errors.push('不能选择相同面值的筹码')
    }

    return result
  }

  /**
   * 获取推荐筹码组合
   * @param {number} userLevel - 用户等级（可选）
   * @returns {Array} 推荐的筹码组合
   */
  const getRecommendedChips = (userLevel = 1) => {
    // 根据用户等级推荐不同的筹码组合
    const recommendations = {
      1: [10, 20, 50, 100, 500],           // 新手
      2: [50, 100, 500, 1000, 5000],       // 进阶
      3: [100, 500, 1000, 5000, 10000],    // 高级
      4: [500, 1000, 5000, 10000, 50000],  // VIP
      5: [1000, 5000, 10000, 50000, 100000] // 超级VIP
    }

    const values = recommendations[userLevel] || recommendations[1]
    return values.map(val => findChipByValue(val)).filter(chip => chip !== null)
  }

  /**
   * 调试筹码信息
   */
  const debugChipInfo = () => {
    console.group('=== 筹码管理调试信息 ===')
    console.log('所有筹码数量:', allChips.length)
    console.log('常用筹码:', choiceChips.value.map(c => `${c.text}(${c.val})`))
    console.log('当前选中筹码:', currentChip.value ? `${currentChip.value.text}(${currentChip.value.val})` : '无')
    console.log('总金额:', totalMoney.value)
    console.log('是否显示筹码选择:', showChips.value)
    console.groupEnd()
  }

  return {
    // 响应式数据
    choiceChips,
    currentChip,
    showChips,
    totalMoney,
    
    // 计算属性
    hasCurrentChip,
    currentChipValue,
    
    // 初始化
    initChips,
    
    // 筹码选择
    handleCurrentChip,
    setShowChips,
    handleChipConfirm,
    handleChipSelectError,
    
    // 筹码转换和显示
    conversionChip,
    findMaxChip,
    getChipImage,
    getChipDisplayText,
    
    // 金额管理
    addTotalMoney,
    resetTotalMoney,
    
    // 查询工具
    findChipByValue,
    findChipByIndex,
    
    // 验证和推荐
    validateChipSelection,
    getRecommendedChips,
    
    // 常量
    allChips,
    
    // 调试工具
    debugChipInfo
  }
}