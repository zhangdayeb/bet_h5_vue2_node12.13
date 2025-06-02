import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Cattle from '@/views/cattle/Cattle.vue'
import BjlAndLh from '@/views/bjlAndLh/BjlAndLh.vue'
import bjlLhXc from '@/views/bjlLhXc/bjlLhXc.vue'
import bjlLhV2 from '@/views/bjlLhV2/bjlLhV2.vue'
import SanGong from '@/views/sanGong/SanGong.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/cattle',
        name: 'cattle',
        component: Cattle
    },
    {
        path: '/bjlLh',
        name: 'bjlLh',
        component: BjlAndLh
    },
    {
        path: '/san',
        name: 'san',
        component: SanGong
    },
	{
	    path: '/bjlLh_xc',
	    name: 'bjlLhXc',
	    component: bjlLhXc
	},
	{
	    path: '/bjlLhV2',
	    name: 'bjlLhV2',
	    component: bjlLhV2
	}
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router
