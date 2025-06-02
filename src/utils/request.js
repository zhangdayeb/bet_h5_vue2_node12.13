import axios from 'axios';
import configFile from "./config"


//服务器url名字
const serviceName = {
	TIGER_URL: '/tiger',
	BJL_URL: '/bjl',
	CATTLE_URL: '/cattle',
	USER_URL: '/user',
    THREE_URL: '/three'
}
axios.defaults.timeout = 5000;
//填写域名
axios.defaults.baseURL = `${configFile.USER_URL}`  

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';

axios.interceptors.request.use(
    config => {
        //设置请求地址
        for(let k in serviceName){
            if(config.url.includes(serviceName[k])) {
                config.baseURL = configFile[k]
                break
            }
        }
        let token = sessionStorage.getItem('token') || '';
        if(token){
    //    config.headers.Authorization = 'x-csrf-token';
            config.headers['x-csrf-token'] = token
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

//响应拦截器即异常处理
axios.interceptors.response.use(response => {
    if (response.status !== 200) {
        return Promise.reject(response.data)
    }
    return Promise.resolve(response.data)
}, err => {
    return Promise.reject(err.response)
})

const http = {
    // async get (url, data) {
    //     try {
    //         let res = await axios.get(url, data)
    //         res = res.data
    //         return new Promise((resolve,reject) => {
    //             if (res.code === 0) {
    //                 resolve(res)
    //             } else {
    //                 reject(res)
    //             }
    //         })
    //     } catch (err) {
    //         // console.log(err)
    //     }
    // },
    /**
     * post 请求
    */
    post (url, data) {
        return new Promise((resolve, reject) => {
            axios.post(url, data).then(res => {
                if(res.code == 200) {
                    resolve(res.data)
                }else{
                    reject(res)
                }
            }).catch(err => {
                reject(err)
            })
        })
    },
	async_post (url, data) {
	    return new Promise(async (resolve, reject) => {
			try {
			    let res = await axios.post(url, data)
			    if(res.code == 200) {
			        resolve(res.data)
			    }else{
			        reject(res)
			    }
			} catch (err) {
			    reject(err)
			}
	    })
	}
}

export { http }