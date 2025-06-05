// src/views/bjlLh/composables/useGameConfig.js
// 精简版游戏配置管理 - 仅保留初始化界面和清除投注区域筹码功能

import { ref, computed } from 'vue'

/**
 * 精简版游戏配置管理
 */
export function useGameConfig() {
  // 游戏类型常量
  const GAME_TYPES = {
    LONGHU: 2,    // 龙虎
    BAIJIALE: 3   // 百家乐
  }

  // 游戏基本信息
  const gameType = ref('')
  const tableId = ref('')
  const userId = ref('')

  // 百家乐投注区域配置
  const betTargetListBjl = ref([
    {
      id: 6, 
      label: '闲', 
      ratio: '1:1', 
      value: 'idle', 
      className: 'bet-idle',
      betAmount: 0, 
      showChip: [], 
      flashClass: ''
    },
    {
      id: 7, 
      label: '和', 
      ratio: '1:8', 
      value: 'peace', 
      className: 'bet-peace',
      betAmount: 0, 
      showChip: [], 
      flashClass: ''
    },
    {
      id: 8, 
      label: '庄', 
      ratio: '1:0.95', 
      value: 'zhuang', 
      className: 'bet-zhuang',
      betAmount: 0, 
      showChip: [], 
      flashClass: ''
    },
    {
      id: 10, 
      label: '熊八', 
      ratio: '1:25', 
      value: 'xiong8', 
      className: 'bet-idle',
      betAmount: 0, 
      showChip: [], 
      flashClass: ''
    },
    {
      id: 2, 
      label: '闲对', 
      ratio: '1:11', 
      value: 'idle-Pair', 
      className: 'bet-idle-Pair',
      betAmount: 0, 
      showChip: [], 
      flashClass: ''
    },
    {
      id: 3, 
      label: '幸运6', 
      ratio: '1:12/20', 
      value: 'lucky', 
      className: 'bet-lucky',
      betAmount: 0, 
      showChip: [], 
      flashClass: ''
    },
    {
      id: 4, 
      label: '庄对', 
      ratio: '1:11', 
      value: 'zhuang-Pair', 
      className: 'bet-zhuang-Pair',
      betAmount: 0, 
      showChip: [], 
      flashClass: ''
    },
    {
      id: 9, 
      label: '龙七', 
      ratio: '1:40', 
      value: 'long7', 
      className: 'bet-zhuang',
      betAmount: 0, 
      showChip: [], 
      flashClass: ''
    }
  ])

  // 龙虎投注区域配置
  const betTargetListLongHu = ref([
    {
      id: 20, 
      label: '龙', 
      ratio: '1:0.97', 
      value: 'zhuang', 
      className: 'bet-zhuang',
      betAmount: 0, 
      showChip: [], 
      flashClass: ''
    },
    {
      id: 22, 
      label: '和', 
      ratio: '1:8', 
      value: 'peace', 
      className: 'bet-peace',
      betAmount: 0, 
      showChip: [], 
      flashClass: ''
    },
    {
      id: 21, 
      label: '虎', 
      ratio: '1:0.97', 
      value: 'idle', 
      className: 'bet-idle',
      betAmount: 0, 
      showChip: [], 
      flashClass: ''
    }
  ])

  // 当前游戏的投注区域
  const betTargetList = computed(() => {
    return gameType.value == GAME_TYPES.BAIJIALE ? betTargetListBjl.value : betTargetListLongHu.value
  })

  // ================================
  // 功能1: 初始化界面功能
  // ================================

  /**
   * 初始化游戏配置
   * @param {string} type - 游戏类型
   * @param {string} table - 桌台ID
   * @param {string} user - 用户ID
   */
  const initGameConfig = (type, table, user) => {
    gameType.value = type
    tableId.value = table
    userId.value = user

    console.log('🎮 游戏配置初始化:', {
      gameType: type,
      tableId: table,
      userId: user
    })

    // 初始化完成后自动清除投注区域
    clearAllBetAreas()
  }

  // ================================
  // 功能2: 清除投注区域筹码功能
  // ================================

  /**
   * 清空所有投注区域的筹码显示
   */
  const clearAllBetAreas = () => {
    console.log('🧹 清空所有投注区域筹码')
    
    betTargetList.value.forEach(item => {
      item.betAmount = 0      // 重置投注金额
      item.showChip = []      // 清空筹码显示
      item.flashClass = ''    // 清空闪烁效果
    })
  }

  /**
   * 重置单个投注区域
   * @param {number} areaId - 投注区域ID
   */
  const clearSingleBetArea = (areaId) => {
    const area = betTargetList.value.find(item => item.id === areaId)
    if (area) {
      area.betAmount = 0
      area.showChip = []
      area.flashClass = ''
      console.log('🧹 清空投注区域:', area.label)
    }
  }

  /**
   * 检查是否有投注筹码
   * @returns {boolean} 是否有筹码
   */
  const hasAnyBets = () => {
    return betTargetList.value.some(item => item.betAmount > 0)
  }

  /**
   * 获取总投注金额
   * @returns {number} 总金额
   */
  const getTotalBetAmount = () => {
    return betTargetList.value.reduce((total, item) => total + (item.betAmount || 0), 0)
  }

  return {
    // 常量
    GAME_TYPES,
    
    // 响应式数据
    gameType,
    tableId,
    userId,
    betTargetList,
    betTargetListBjl,
    betTargetListLongHu,
    
    // 功能1: 初始化
    initGameConfig,
    
    // 功能2: 清除筹码
    clearAllBetAreas,
    clearSingleBetArea,
    
    // 辅助工具
    hasAnyBets,
    getTotalBetAmount
  }
}