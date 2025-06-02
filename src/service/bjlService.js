import {http} from '@/utils/request'


export default {
    /**
     * 获取当前下注
     * @param data 后台需要的数据
     * **/
    getBetCurrentRecord(data) {
        let gameType = {
			'3' : '/bjl',
			'2' : '/tiger',
		}
        return http.post(`${gameType[data.game_type]}/current/record`, data)
    },
    /**
     * 下注
     * @param data 后台需要的数据
    */
    betOrder(data) {
        let gameType = {
			'3' : '/bjl',
			'2' : '/tiger',
		}
        return http.post( `${gameType[data.game_type]}/bet/order`, data)	
    },
    
}