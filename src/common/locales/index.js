import { createI18n } from 'vue-i18n'	
import userService from '@/service/userService.js'
//语言数据
const languageData = [{
    className: 'login-flag-zh',
    title: '简体中文',
    type: 'ch',
    //服务器返回的字段值
    serviceValue: 'zh-cn'
},{
    className: 'login-flag-en',
    title: 'English',
    type: 'en',
    //服务器返回的字段值
    serviceValue: 'en-us'
},{
    className: 'login-flag-jp',
    title: '日本語',
    type: 'jpn',
    serviceValue: 'jpn'
},{
    className: 'login-flag-kor',
    title: '한글',
    type: 'kor',
    serviceValue: 'kor'
},{
    className: 'login-flag-tha',
    title: 'ภาษาไทย',
    type: 'tha',
    serviceValue: 'tha'
},{
    className: 'login-flag-vnm',
    title: 'ViệtName',
    type: 'vnm',
    serviceValue: 'vnm'
}]
let lan = 'ch'
/**
 * 获取url参数
 * **/
 let getUrlParam = (name) => {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
	var r = window.location.search.substr(1).match(reg);
	if(r != null){
		return decodeURI(r[2]);
	} 
	return "";
};
/**
 * 获取用户选择的语言
 * **/
 let getLocale = () => {
    let token = getUrlParam('token')
    sessionStorage.setItem('token', token)
    userService.userIndex().then((res) => {
        for(let lanObj of languageData) {
            if(res.language == lanObj.serviceValue) {
                sessionStorage.setItem('language', lanObj.type)
            }
        }
    })
}
getLocale()

 //注册i8n实例并引入语言文件
const i18n = createI18n({
    locale: lan,
    messages: {
        ch:require('./ch.js'),	//引入语言文件
        en:require('./en.js'),
        jpn:require('./jpn.js'),
        kor:require('./kor.js'),
        tha:require('./tha.js'),
        vnm:require('./vnm.js'),
    }
})

export default i18n; 