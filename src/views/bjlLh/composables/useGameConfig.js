// src/views/bjlLh/composables/useGameConfig.js
// 游戏配置管理 - 投注区域配置、游戏常量等

import { ref, computed } from 'vue'

/**
 * 游戏配置管理
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
      color: '', 
      odds: '', 
      betAmount: 0, 
      showChip: [], 
      imgWidth: 30,
      total_amount: 0, 
      total_population: 0, 
      flashClass: '',
      imgUrl: () => require(`@/assets/imgs/bet/ch/xian.png`)
    }, 
    {
      id: 2, 
      label: '闲对', 
      ratio: '1:11', 
      value: 'idle-Pair', 
      className: 'bet-idle-Pair',
      color: 'white', 
      odds: '', 
      betAmount: 0, 
      showChip: [], 
      imgWidth: 47,
      total_amount: 0, 
      total_population: 0, 
      flashClass: '',
      imgUrl: () => require(`@/assets/imgs/bet/ch/xian_pair.png`),
      textShadow: '0 0 blue'
    },
    {
      id: 7, 
      label: '和', 
      ratio: '1:8', 
      value: 'peace', 
      className: 'bet-peace',
      color: '', 
      odds: '', 
      betAmount: 0, 
      showChip: [], 
      imgWidth: 30,
      total_amount: 0, 
      total_population: 0, 
      flashClass: '',
      imgUrl: () => require(`@/assets/imgs/bet/ch/he.png`)
    },
    {
      id: 4, 
      label: '庄对', 
      ratio: '1:11', 
      value: 'zhuang-Pair', 
      className: 'bet-zhuang-Pair',
      color: 'white', 
      odds: '', 
      betAmount: 0, 
      showChip: [], 
      imgWidth: 47,
      total_amount: 0, 
      total_population: 0, 
      flashClass: '',
      imgUrl: () => require(`@/assets/imgs/bet/ch/zhuang_pair.png`),
      textShadow: '0 0 blue'
    },
    {
      id: 8, 
      label: '庄', 
      ratio: '1:0.95', 
      value: 'zhuang', 
      className: 'bet-zhuang',
      color: '', 
      odds: '', 
      betAmount: 0, 
      showChip: [], 
      imgWidth: 30,
      total_amount: 0, 
      total_population: 0, 
      flashClass: '',
      imgUrl: () => require(`@/assets/imgs/bet/ch/zhuang.png`)
    },
    {
      id: 10, 
      label: '熊八', 
      ratio: '1:25', 
      value: 'xiong8', 
      className: 'bet-idle',
      color: '', 
      odds: '', 
      betAmount: 0, 
      showChip: [], 
      imgWidth: 30,
      total_amount: 0, 
      total_population: 0, 
      flashClass: '',
      imgUrl: () => require(`@/assets/imgs/bet/ch/xiong8.png`)
    },
    {
      id: 3, 
      label: '幸运6', 
      ratio: '1:12/20', 
      value: 'lucky', 
      className: 'bet-lucky',
      color: '', 
      odds: '', 
      betAmount: 0, 
      showChip: [], 
      imgWidth: 30,
      total_amount: 0, 
      total_population: 0, 
      flashClass: '',
      imgUrl: () => require(`@/assets/imgs/bet/ch/lucky.png`)
    },
    {
      id: 9, 
      label: '龙七', 
      ratio: '1:40', 
      value: 'long7', 
      className: 'bet-zhuang',
      color: '', 
      odds: '', 
      betAmount: 0, 
      showChip: [], 
      imgWidth: 30,
      total_amount: 0, 
      total_population: 0, 
      flashClass: '',
      imgUrl: () => require(`@/assets/imgs/bet/ch/long7.png`)
    }
  ])

  // 龙虎投注区域配置
  const betTargetListLongHu = ref([
    {
      id: 20, 
      label: '龙', 
      value: 'zhuang', 
      className: 'bet-idle',
      color: '', 
      odds: '', 
      betAmount: 0, 
      showChip: [], 
      imgWidth: 40,
      total_amount: 0, 
      total_population: 0, 
      flashClass: '',
      imgUrl: () => require(`@/assets/imgs/bet/ch/dragon.png`)
    },
    {
      id: 22, 
      label: '和', 
      value: 'peace', 
      className: 'bet-peace',
      color: '', 
      odds: '', 
      betAmount: 0, 
      showChip: [], 
      imgWidth: 40,
      total_amount: 0, 
      total_population: 0, 
      flashClass: '',
      imgUrl: () => require(`@/assets/imgs/bet/ch/lh_he.png`)
    },
    {
      id: 21, 
      label: '虎', 
      value: 'idle', 
      className: 'bet-idle',
      color: '', 
      odds: '', 
      betAmount: 0, 
      showChip: [], 
      imgWidth: 40,
      total_amount: 0, 
      total_population: 0, 
      flashClass: '',
      imgUrl: () => require(`@/assets/imgs/bet/ch/tigger.png`)
    }
  ])

  // 当前游戏的投注区域
  const betTargetList = computed(() => {
    return gameType.value == GAME_TYPES.BAIJIALE ? betTargetListBjl.value : betTargetListLongHu.value
  })

  // 欢迎消息配置
  const welcomeMessages = {
    [GAME_TYPES.BAIJIALE]: 'bjlAndLh.welcomeBjl',
    [GAME_TYPES.LONGHU]: 'bjlAndLh.welcomeLh'
  }

  // 音频路径配置
  const audioPaths = {
    [GAME_TYPES.BAIJIALE]: 'bjl',
    [GAME_TYPES.LONGHU]: 'longhu'
  }

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

    // 更新投注区域的图片路径（根据语言）
    const locale = sessionStorage.getItem('language') || 'ch'
    updateImagePaths(locale)

    console.log('🎮 游戏配置初始化:', {
      gameType: type,
      tableId: table,
      userId: user,
      locale: locale
    })
  }

  /**
   * 根据语言更新图片路径
   * @param {string} locale - 语言标识
   */
  const updateImagePaths = (locale) => {
    const updateTargetList = (list) => {
      list.forEach(item => {
        if (item.imgUrl && typeof item.imgUrl === 'function') {
          try {
            // 动态更新图片路径
            const imageName = item.imgUrl().split('/').pop()
            item.imgUrl = () => require(`@/assets/imgs/bet/${locale}/${imageName}`)
          } catch (error) {
            console.warn('更新图片路径失败:', item.label, error)
            // 回退到中文路径
            item.imgUrl = () => require(`@/assets/imgs/bet/ch/${item.label.toLowerCase()}.png`)
          }
        }
      })
    }

    updateTargetList(betTargetListBjl.value)
    updateTargetList(betTargetListLongHu.value)
  }

  /**
   * 获取欢迎消息key
   */
  const getWelcomeMessageKey = () => {
    return welcomeMessages[gameType.value] || 'bjlAndLh.welcomeBjl'
  }

  /**
   * 获取音频路径
   */
  const getAudioPath = () => {
    return audioPaths[gameType.value] || 'bjl'
  }

  /**
   * 清空所有投注区域的显示
   */
  const clearAllBetAreas = () => {
    console.log('🧹 清空所有投注区域显示')
    betTargetList.value.forEach(item => {
      item.betAmount = 0
      item.showChip = []
      item.flashClass = ''
    })
  }

  /**
   * 设置投注区域的闪烁效果
   * @param {Array} flashIds - 需要闪烁的投注区域ID数组
   */
  const setFlashEffect = (flashIds = []) => {
    // 清除所有闪烁效果
    betTargetList.value.forEach(item => {
      item.flashClass = ''
    })

    // 设置新的闪烁效果
    if (flashIds.length > 0) {
      flashIds.forEach(id => {
        const target = betTargetList.value.find(item => item.id === id)
        if (target) {
          target.flashClass = 'bet-win-green-bg'
        }
      })
    }
  }

  /**
   * 获取投注区域（兼容原版代码）
   * @param {Function} callback - 过滤函数
   */
  const getObjects = (callback) => {
    if (callback && typeof callback === 'function') {
      return betTargetList.value.filter(callback)
    }
    return betTargetList.value
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
    
    // 方法
    initGameConfig,
    updateImagePaths,
    getWelcomeMessageKey,
    getAudioPath,
    clearAllBetAreas,
    setFlashEffect,
    getObjects
  }
}