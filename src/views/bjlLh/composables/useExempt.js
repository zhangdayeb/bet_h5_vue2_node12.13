// src/views/bjlLh/composables/useExempt.js
// 免佣设置的本地存储管理

import { ref, computed } from 'vue'

/**
 * 免佣设置管理
 */
export function useExempt() {
  // 免佣状态
  const Freebool = ref(false)
  
  // 游戏参数（用于生成存储键）
  const gameParams = ref({
    userId: '',
    tableId: '',
    gameType: ''
  })

  // 计算存储键
  const storageKey = computed(() => {
    const { userId, tableId, gameType } = gameParams.value
    return `exempt_setting_${userId}_${tableId}_${gameType}`
  })

  /**
   * 初始化免佣设置
   * @param {string} userId - 用户ID
   * @param {string} tableId - 桌台ID
   * @param {string} gameType - 游戏类型
   */
  const initExemptSetting = (userId, tableId, gameType) => {
    // 设置游戏参数
    gameParams.value = { userId, tableId, gameType }
    
    // 从本地存储获取免佣设置
    const storedSetting = getExemptSettingLocal()
    
    if (storedSetting !== null) {
      // 使用本地存储的设置
      Freebool.value = storedSetting
      console.log('🎯 使用本地存储的免佣设置:', Freebool.value)
    } else {
      // 如果本地没有设置，使用默认值 false（免佣关）
      Freebool.value = false
      console.log('🎯 首次进入台桌，使用默认免佣设置:', Freebool.value)
      
      // 将默认设置保存到本地存储
      saveExemptSettingLocal(Freebool.value)
    }

    console.log('🔧 免佣设置初始化完成:', {
      userId,
      tableId, 
      gameType,
      storageKey: storageKey.value,
      exemptStatus: Freebool.value
    })
  }

  /**
   * 切换免佣状态
   */
  const toggleExempt = () => {
    const newFreebool = !Freebool.value
    
    console.log('🔄 切换免佣状态:', Freebool.value, '->', newFreebool)
    
    // 保存新的免佣设置
    saveExemptSettingLocal(newFreebool)
    
    return newFreebool
  }

  /**
   * 本地存储免佣设置
   * @param {boolean} exemptStatus - 免佣状态
   */
  const saveExemptSettingLocal = (exemptStatus) => {
    try {
      const key = storageKey.value
      const value = exemptStatus ? '1' : '0'
      
      localStorage.setItem(key, value)
      Freebool.value = exemptStatus
      
      console.log(`💾 免佣设置已保存: ${key} -> ${exemptStatus}`)
      console.log(`✅ [成功] 免佣已${exemptStatus ? '开启' : '关闭'}`)
      
      return true
    } catch (error) {
      console.error('❌ 本地存储免佣设置失败:', error)
      return false
    }
  }

  /**
   * 从本地存储获取免佣设置
   * @returns {boolean|null} 免佣状态，null表示没有存储过
   */
  const getExemptSettingLocal = () => {
    try {
      const key = storageKey.value
      const stored = localStorage.getItem(key)
      
      if (stored !== null) {
        const exemptStatus = stored === '1'
        console.log(`💾 从本地存储获取免佣设置: ${key} -> ${exemptStatus}`)
        return exemptStatus
      }
      
      console.log(`💾 没有找到本地免佣设置: ${key}`)
      return null
    } catch (error) {
      console.error('❌ 读取本地存储免佣设置失败:', error)
      return null
    }
  }

  /**
   * 清除指定台桌的免佣设置
   */
  const clearExemptSetting = () => {
    try {
      const key = storageKey.value
      localStorage.removeItem(key)
      console.log(`🗑️ 已清除免佣设置: ${key}`)
      
      // 重置为默认值
      Freebool.value = false
      return true
    } catch (error) {
      console.error('❌ 清除本地存储免佣设置失败:', error)
      return false
    }
  }

  /**
   * 获取用户所有台桌的免佣设置（调试用）
   * @returns {Object} 所有免佣设置
   */
  const getAllExemptSettings = () => {
    try {
      const { userId } = gameParams.value
      const userPrefix = `exempt_setting_${userId}_`
      const allSettings = {}
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(userPrefix)) {
          const value = localStorage.getItem(key)
          allSettings[key] = value === '1'
        }
      }
      
      console.log(`📋 用户${userId}的所有免佣设置:`, allSettings)
      return allSettings
    } catch (error) {
      console.error('❌ 获取所有免佣设置失败:', error)
      return {}
    }
  }

  /**
   * 检查免佣设置是否存在
   * @returns {boolean} 是否存在本地设置
   */
  const hasExemptSetting = () => {
    try {
      const key = storageKey.value
      return localStorage.getItem(key) !== null
    } catch (error) {
      console.error('❌ 检查免佣设置存在性失败:', error)
      return false
    }
  }

  /**
   * 设置免佣状态（直接设置，不切换）
   * @param {boolean} status - 免佣状态
   */
  const setExemptStatus = (status) => {
    console.log('🎯 直接设置免佣状态:', status)
    return saveExemptSettingLocal(status)
  }

  /**
   * 获取免佣状态用于下注
   * @returns {number} 1表示免佣开启，0表示免佣关闭
   */
  const getExemptForBetting = () => {
    return Freebool.value ? 1 : 0
  }

  /**
   * 获取免佣状态文本
   * @returns {string} 免佣状态文本
   */
  const getExemptStatusText = () => {
    return Freebool.value ? '免佣开' : '免佣关'
  }

  /**
   * 批量清理用户的免佣设置（可选功能）
   * @param {string} userId - 用户ID
   */
  const clearUserExemptSettings = (userId) => {
    try {
      const userPrefix = `exempt_setting_${userId}_`
      const keysToDelete = []
      
      // 收集需要删除的键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(userPrefix)) {
          keysToDelete.push(key)
        }
      }
      
      // 删除键
      keysToDelete.forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log(`🗑️ 已清理用户${userId}的所有免佣设置，共${keysToDelete.length}个`)
      return keysToDelete.length
    } catch (error) {
      console.error('❌ 批量清理免佣设置失败:', error)
      return 0
    }
  }

  /**
   * 调试信息输出
   */
  const debugExemptInfo = () => {
    console.group('=== 免佣设置调试信息 ===')
    console.log('当前免佣状态:', Freebool.value)
    console.log('存储键:', storageKey.value)
    console.log('游戏参数:', gameParams.value)
    console.log('是否有本地设置:', hasExemptSetting())
    console.log('用于下注的值:', getExemptForBetting())
    console.log('状态文本:', getExemptStatusText())
    console.log('所有免佣设置:', getAllExemptSettings())
    console.groupEnd()
  }

  return {
    // 响应式数据
    Freebool,
    storageKey,
    
    // 初始化
    initExemptSetting,
    
    // 免佣操作
    toggleExempt,
    setExemptStatus,
    
    // 本地存储操作
    saveExemptSettingLocal,
    getExemptSettingLocal,
    clearExemptSetting,
    clearUserExemptSettings,
    
    // 查询方法
    hasExemptSetting,
    getAllExemptSettings,
    getExemptForBetting,
    getExemptStatusText,
    
    // 调试工具
    debugExemptInfo
  }
}