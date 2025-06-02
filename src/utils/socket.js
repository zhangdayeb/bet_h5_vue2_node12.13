
import configFile from "./config"
//百家乐
const BJL_URL = configFile.BJL_WS_URL
//龙虎
const LH_URL = configFile.LH_WS_URL
//牛牛
const NN_URL = configFile.NN_WS_URL
//三公
const THREE_URL = configFile.THREE_WS_URL
function SocketTask(url) {
    
    //socket连接状态
    let socketOpen = false
    let slefUrl = url ? url : URL
    let ws = new WebSocket(slefUrl);
    /**
     * 打开ws连接
     * 
    */
    this.open = (callback) => {
        ws.onopen = (res) => {
            socketOpen = true
            heartCheck()
            callback(res)
        }
    }

    /**
     * 发送数据
     * **/
    this.send = (data) => {
        ws.send(JSON.stringify(data))
    }
    
    /**
     * 接收数据
     * @param callback callback
     * **/
    this.receiveMsg = (callback) => {
        ws.onmessage =  (e) => {  
            callback(e)
        }
    }
    
    /**
     * 关闭ws
    */
    this.close = () => {
        ws.close();
    }

    /**
     * 收跳
    */
    let heartCheck = () => {
		setTimeout(() => {
			if(socketOpen) {
				ws.send(`{use_target:'heartbeat',post_position:'bet'}`);
			}
			heartCheck()
		}, 30000) 
	}

    /**
     * 监听关闭ws
     * **/
    this.onClose = (callback) => {
        ws.onclose = (res) => {
            //当客户端收到服务端发送的关闭连接请求时，触发onclose事件
            socketOpen = false
            callback(res)
        }
    }
}

export{
	BJL_URL,
    LH_URL,
    NN_URL,
    THREE_URL,
	SocketTask,
}