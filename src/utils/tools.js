/**
 * 功能性函数
 * 检测是否是json格式的字符串
 * @param {Object} str
 */
export default {
	isJSON(str) {
		if(typeof(str) == 'string') {
			try{
				var obj = JSON.parse(str);
				if(typeof(obj) === 'object' && obj) {
					return true;
				}
				else {
					return false;
				}
			}catch(e) {
				return false;
			}
		}
	}
}