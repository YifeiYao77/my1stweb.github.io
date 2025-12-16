import * as THREE from 'three';

/**
 * 程序化纹理生成器
 * 使用Three.js内置API生成各种纹理，无需外部图片资源
 */
export default class TextureGenerator {
    /**
     * 生成内核纹理 - 淡黄色底+细微白色噪点
     * @returns {THREE.CanvasTexture} 内核纹理
     */
    static generateCoreTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // 填充淡黄色背景
        context.fillStyle = '#ffffcc';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加细微白色噪点（减少噪点数量以提升性能）
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 1.5 + 0.5;
            const opacity = Math.random() * 0.3 + 0.1;
            
            context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    /**
     * 生成空虚纹理 - 蓝白渐变
     * @returns {THREE.CanvasTexture} 空虚纹理
     */
    static generateEmptinessTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // 创建蓝白渐变
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#4169e1');
        gradient.addColorStop(0.5, '#6495ed');
        gradient.addColorStop(1, '#87ceeb');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        return new THREE.CanvasTexture(canvas);
    }
    
    /**
     * 生成愧疚纹理 - 哑光绿+轻微网格线
     * @returns {THREE.CanvasTexture} 愧疚纹理
     */
    static generateGuiltTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // 填充哑光绿色背景
        context.fillStyle = '#4caf50';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加轻微网格线
        context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        context.lineWidth = 1;
        
        // 垂直线（减少线条密度）
        for (let x = 0; x <= canvas.width; x += 24) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.stroke();
        }
        
        // 水平线（减少线条密度）
        for (let y = 0; y <= canvas.height; y += 24) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.stroke();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    /**
     * 生成焦虑纹理 - 渐变紫+微小圆点噪点
     * @returns {THREE.CanvasTexture} 焦虑纹理
     */
    static generateAnxietyTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // 创建紫色渐变背景
        const gradient = context.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        gradient.addColorStop(0, '#9370db');
        gradient.addColorStop(1, '#8a2be2');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加微小圆点噪点（减少噪点数量）
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 1.5 + 0.5;
            
            context.fillStyle = 'rgba(255, 255, 255, 0.4)';
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    /**
     * 生成情绪碎片纹理 - 深粉色底+明亮珠光白点
     * @returns {THREE.CanvasTexture} 情绪碎片纹理
     */
    static generateFragmentTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // 填充深粉色背景（红色调）
        context.fillStyle = '#ff1493'; // 深粉色
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加明亮珠光白点，增加视觉对比度
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2 + 1;
            
            context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    /**
     * 生成崩溃纹理 - 纯黑底+零星红色像素点
     * @returns {THREE.CanvasTexture} 崩溃纹理
     */
    static generateCollapseTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // 填充纯黑背景
        context.fillStyle = '#000000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加零星红色像素点，占比<1%
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 1.5 + 0.5;
            
            context.fillStyle = '#ff0000';
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    /**
     * 生成墙体纹理 - 浅灰色底+噪点
     * @returns {THREE.CanvasTexture} 墙体纹理
     */
    static generateWallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // 填充浅灰色背景
        context.fillStyle = '#cccccc';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加噪点纹理
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 1.5 + 0.5;
            const brightness = Math.random() * 40 - 20; // -20 到 20 的亮度变化
            
            const gray = Math.floor(204 + brightness); // 204 是 #cccccc 的灰度值
            context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
}