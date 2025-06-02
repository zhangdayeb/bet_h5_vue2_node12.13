// import {fabric} from '@/assets/plugins/fabric.min'
import { fabric } from 'fabric'


// fabric 插件对象
const Fabric = fabric;

export class CanvasApi {
    _canvas = null

    constructor(canvas) {
        this._canvas = canvas
    }

    /**
     * 注意了，ios里面fontFamily为空字符串儿时，字体大小不改变
     * 绘制文本
     * @param msg 文字内容
     * @param x x位置
     * @param y y位置
     * @param size 字体大小
     * @param uniqueType uniqueType 唯一标识类型 方便点击时查看点击地某个对象
     * @param color [可选]字体颜色
     * @param fontFamily [可选] 字体样式
     * @param selectable [可选]是否可以移动
     */
    drawText(txt, x, y, size, uniqueType, color,  fontFamily, selectable) {
        color = color || 'rgba(214, 39, 39, .8)'
        const text = new Fabric.Text(txt, {
            left: x,
            top: y,
            fontSize: size,
            fill: color,
            type: uniqueType,
            fontFamily: fontFamily ? fontFamily : 'Helvetica',
            selectable: selectable,
            textAlign: 'center',
            // //禁止左右移动
            lockMovementX: true,
            //禁止上下移动
            lockMovementY: true,
            //禁止出现小方框
            hasControls: false,
            //禁止点击出现边框
            hasBorders: false,
        })
        this._canvas.add(text);
    }

    /**
     * 画图片
     * @param imgUrl 图片地址
     * @param x 画图的横坐标
     * @param y 画图的纵坐标
     * @param uniqueType uniqueType 唯一标识类型 方便点击时查看点击地某个对象
     * @param scaleX 图片宽缩放
     * @param scaleY 图片高缩放
     * @param widthy 画片宽度
     * @param height 画片高度 
    */
    drawImage(imgUrl,x, y, uniqueType, scaleX, scaleY,rectLocation, width, height ) {
        Fabric.Image.fromURL(imgUrl, (oImg) => {
            oImg.left = x;
            oImg.top = y
            oImg.type = uniqueType
            //禁止左右移动
            oImg.lockMovementX = true
            //禁止上下移动
            oImg.lockMovementY = true
            //不显示控制的那9个按钮
            oImg.hasControls = false
            //禁止点击出现边框
            oImg.hasBorders = false
            oImg.scaleX = scaleX / oImg.width
            oImg.scaleY = scaleY / oImg.height
            oImg.width = width ? width : oImg.width
            oImg.height = height ? height : oImg.height
            this._canvas.add(oImg)
        });
    }

    /**
     * 画矩形
     * @param x x轴位置
     * @param y y轴位置
     * @param width 宽度 
     * @param height 高度
     * @param strokeWidth 边框大小
     * @param uniqueType 唯一标识类型 方便点击时查看点击地某个对象
     * @param fillColor 填充颜色 
     * @param stroke 边框颜色
     * @param borderRadiusX x轴圆角
     * @param borderRadiusY y轴圆角
     * 
    */
    drawRect(x, y, width, height, strokeWidth, uniqueType, fillColor, stroke, borderRadiusX, borderRadiusY) {
        let rect = new Fabric.Rect({
            left : x, 
            top : y, 
            width : width, 
            height : height, 
            strokeWidth: strokeWidth,
            type: uniqueType,
            fill : fillColor, 
            stroke: stroke, 
            rx: borderRadiusX, 
            ry: borderRadiusY,
            selectable: false,
            //禁止左右移动
            lockMovementX: true,
            //禁止上下移动
            lockMovementY: true,
            //禁止出现小方框
            hasControls: false,
            //禁止点击出现边框
            hasBorders: false,
        });
        this._canvas.add(rect);
    }

    /**
     * 注意了，ios里面字体大小不能改变，还没研究出来 可以drawTextbox替代
     * 绘制文本
     * @param msg 文字内容
     * @param x x位置
     * @param y y位置
     * @param size 字体大小
     * @param uniqueType uniqueType 唯一标识类型 方便点击时查看点击地某个对象
     * @param color [可选]字体颜色
     * @param fontFamily [可选] 字体样式
     * */
    drawTextbox(text, x, y, size, uniqueType, color,  fontFamily, selectable) {
        let textBox = new fabric.Textbox(text, {
            left: x,
            top: y,
            fontFamily: 'Helvetica',
            fill: color,
            fontWeight: '100',
            fontSize: size,
            type: uniqueType,
            originX: 'center',
            hasRotatingPoint: true,
            centerTransform: true,
            lockMovementX: true,
            //禁止上下移动
            lockMovementY: true,
            //禁止出现小方框
            hasControls: false,
            //禁止点击出现边框
            hasBorders: false,
            fontFamily: fontFamily ? fontFamily : 'Helvetica',
        });

        this._canvas.add(textBox);
    }
    
}