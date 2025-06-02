import {http} from '@/utils/request'


export default {
    /**
     * 获取当前下注
     * @param data 后台需要的数据
     * **/
    betCurrentRecord(data) {
        return http.post('/user/current/record', data)
    },

    /**
     * 保存筹码
     * @param data 后台需要的数据
     * **/
    chipUpdate(data) {
        return http.post('/user/chip/update',data)
    },

    /**
     * 获取用户信息
     * @param data 后台需要的数据
     * **/
    userIndex(data) {
        return http.async_post('/user/user/index',data)
    },
    
}