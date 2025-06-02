import {http} from '@/utils/request'


export default {
    /**
     * 下注
     * @param data 后台需要的数据
    */
    betOrderService(data) {
       return http.post('/cattle/bet/order', data)
    },

    /**
     * 桌子信息
     * @param data 后台需要的数据
    */
    tableInfo(data) {
        return http.post('/cattle/table/info', data)
    },
    /**
     * 获取当前下注
     * @param data 后台需要的数据
     * **/
     getBetCurrentRecord(data) {
        return http.post('/cattle/current/record', data)
    },
}