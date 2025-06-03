//所有的筹码
const allChips = [
	// {index: 0,val: 1,text: '1',color: '#f6cb09',bet: true,active:false,src:require('@/assets/imgs/chips/B_01.png')},
	// {index: 0,val: 5,text: '5',color: '#e72d00',bet: true,active:false,src:require('@/assets/imgs/chips/B_05.png')},
	{index: 0,val: 1,text: '1',color: '#f6cb09',bet: true,active:false,src:require('@/assets/imgs/chips/B_01.png'),betSrc: require('@/assets/imgs/chips/S_01.png')},
	{index: 0,val: 1,text: '1',color: '#f6cb09',bet: true,active:false,src:require('@/assets/imgs/chips/B_01.png'),betSrc: require('@/assets/imgs/chips/S_01.png')},
	{index: 0,val: 5,text: '5',color: '#e72d00',bet: true,active:false,src:require('@/assets/imgs/chips/B_05.png'),betSrc: require('@/assets/imgs/chips/S_05.png')},
	{index: 0,val: 10,text: '10',color: '#605925',bet: true,active:false,src:require('@/assets/imgs/chips/B_10.png'),betSrc: require('@/assets/imgs/chips/S_10.png')},
	{index: 0,val: 20,text: '20',color: '#2c96b9',bet: true,active:false,src:require('@/assets/imgs/chips/B_20.png'),betSrc: require('@/assets/imgs/chips/S_20.png')},
	{index: 0,val: 50,text: '50',color: '#c94200',bet: true,active:false,src:require('@/assets/imgs/chips/B_50.png'),betSrc: require('@/assets/imgs/chips/S_50.png')},
	{index: 0,val: 100,text: '100',color: '#c79a0a',bet: true,active:false,src:require('@/assets/imgs/chips/B_100.png'),betSrc: require('@/assets/imgs/chips/S_100.png')},
	{index: 0,val: 500,text: '500',color: '#a82e9b',bet: true,active:false,src:require('@/assets/imgs/chips/B_500.png'),betSrc: require('@/assets/imgs/chips/S_500.png')},
	{index: 0,val: 1000,text: '1k',color: '#d79564',bet: true,active:false,src:require('@/assets/imgs/chips/B_1K.png'),betSrc: require('@/assets/imgs/chips/S_1K.png')},
	{index: 0,val: 5000,text: '5k',color: '#cbc589',bet: true,active:false,src:require('@/assets/imgs/chips/B_5K.png'),betSrc: require('@/assets/imgs/chips/S_5K.png')},
	{index: 0,val: 10000,text: '10k',color: '#f4f0c8',bet: true,active:false,src:require('@/assets/imgs/chips/B_10K.png'),betSrc: require('@/assets/imgs/chips/S_10K.png')},
	{index: 0,val: 20000,text: '20k',color: '#39c311',bet: false,active:false,src:require('@/assets/imgs/chips/B_20K.png'),betSrc: require('@/assets/imgs/chips/S_20K.png')},
	{index: 0,val: 50000,text: '50k',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_50K.png'),betSrc: require('@/assets/imgs/chips/S_50K.png')},
	{index: 0,val: 100000,text: '100k',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_100K.png'),betSrc: require('@/assets/imgs/chips/S_100K.png')},
	// {index: 0,val: 200000,text: '200k',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_200K.png'),betSrc: require('@/assets/imgs/chips/S_200K.png')},
	// {index: 0,val: 1000000,text: '1M',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_1M.png'),betSrc: require('@/assets/imgs/chips/S_1M.png')},
	// {index: 0,val: 5000000,text: '5M',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_5M.png'),betSrc: require('@/assets/imgs/chips/S_5M.png')},
	// {index: 0,val: 10000000,text: '10M',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_10M.png'),betSrc: require('@/assets/imgs/chips/S_10M.png')},
	// {index: 0,val: 20000000,text: '20M',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_20M.png'),betSrc: require('@/assets/imgs/chips/S_20M.png')},
	// {index: 0,val: 50000000,text: '50M',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_50M.png'),betSrc: require('@/assets/imgs/chips/S_50M.png')},
	// {index: 0,val: 100000000,text: '100M',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_100M.png'),betSrc: require('@/assets/imgs/chips/S_100M.png')},
	// {index: 0,val: 200000000,text: '200M',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_200M.png'),betSrc: require('@/assets/imgs/chips/S_200M.png')},
	// {index: 0,val: 500000000,text: '500M',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_500M.png'),betSrc: require('@/assets/imgs/chips/S_500M.png')},
	// {index: 0,val: 1000000000,text: '1000M',color: '#5c8bca',bet: true,active:false,src:require('@/assets/imgs/chips/B_1000M.png'),betSrc: require('@/assets/imgs/chips/S_1000M.png')},
]
for(let i = 0; i < allChips.length; i++) {
	allChips[i].index = i
}
export default {
	allChips
}