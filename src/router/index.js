import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Cattle from '@/views/cattle/Cattle.vue'
import bjlLh from '@/views/bjlLh/bjlLh.vue'
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
        path: '/san',
        name: 'san',
        component: SanGong
    },
	{
	    path: '/bjlLh',
	    name: 'bjlLh',
	    component: bjlLh
	}
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router
