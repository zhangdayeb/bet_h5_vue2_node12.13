import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueI18n from '@/common/locales'


const app = createApp(App)
app.config.globalProperties.$VueI18n = VueI18n

// 获取语言设置 一直获取到 
let getLanguage = ()=>{
    let lan = sessionStorage.getItem('language')
    console.log("lan:",lan)
    if(!lan) {
        setTimeout(() => {
            getLanguage()
        },500)
        return
    }
    app.config.globalProperties.$VueI18n.global.locale = sessionStorage.getItem('language')
    app.use(store).use(router).use(VueI18n).mount('#app')
}
getLanguage()

