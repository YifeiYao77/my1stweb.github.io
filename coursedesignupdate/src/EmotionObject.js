import * as THREE from 'three';
import TextureGenerator from './TextureGenerator.js';

/**
 * 情绪对象基类
 * 定义所有情绪对象的共同属性和方法
 */
export default class EmotionObject {
    constructor(type, value, position, geometry, material) {
        this.type = type; // 情绪类型：emptiness, guilt, anxiety, fragment, collapse
        this.value = value; // 情绪数值
        this.position = new THREE.Vector3(position.x, position.y, position.z);
        this.geometry = geometry;
        this.material = material;
        this.mesh = null;
        this.label = null; // 文字标签
        this.isAbsorbed = false; // 是否已被同化
        this.createMesh();
        this.createLabel();
    }
    
    /**
     * 创建网格对象
     */
    createMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData = { emotionObject: this };
    }
    
    /**
     * 创建文字标签
     */
    createLabel() {
        // 创建canvas用于文字渲染
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // 设置文字样式
        context.font = '24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 绘制文字
        const labelText = this.getLabelText();
        context.fillText(labelText, canvas.width / 2, canvas.height / 2);
        
        // 创建纹理和材质
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        this.label = new THREE.Sprite(spriteMaterial);
        
        // 设置标签位置（物体上方）
        this.label.position.copy(this.position);
        // 使用更简单的方法计算标签位置，避免getBoundingBox可能导致的问题
        this.label.position.y += 5; // 固定在物体上方5个单位
        this.label.scale.set(4, 1, 1);
    }
    
    /**
     * 获取标签文字
     * @returns {string} 标签文字
     */
    getLabelText() {
        switch (this.type) {
            case 'emptiness':
                return `空虚：${this.value}`;
            case 'guilt':
                return `愧疚：${this.value}`;
            case 'anxiety':
                return `焦虑：${this.value}`;
            default:
                return '';
        }
    }
    
    /**
     * 获取边界框
     * @returns {THREE.Box3} 边界框
     */
    getBoundingBox() {
        return new THREE.Box3().setFromObject(this.mesh);
    }
    
    /**
     * 检测与内核的碰撞
     * @param {THREE.Vector3} corePosition - 内核位置
     * @param {number} coreRadius - 内核半径
     * @returns {boolean} 是否碰撞
     */
    checkCollision(corePosition, coreRadius) {
        if (this.isAbsorbed) return false;
        
        const distance = this.position.distanceTo(corePosition);
        const emotionRadius = this.getEmotionRadius();
        
        return distance < (coreRadius + emotionRadius);
    }
    
    /**
     * 获取情绪对象半径
     * @returns {number} 半径
     */
    getEmotionRadius() {
        const box = this.getBoundingBox();
        const size = new THREE.Vector3();
        box.getSize(size);
        return Math.max(size.x, size.y, size.z) / 2;
    }
    
    /**
     * 处理同化效果
     * @param {number} coreValue - 内核当前数值
     * @returns {Object} 同化结果
     */
    handleAbsorption(coreValue) {
        if (this.isAbsorbed) return null;
        
        this.isAbsorbed = true;
        let result = {
            type: this.type,
            value: this.value,
            newValue: coreValue,
            success: true,
            message: ''
        };
        
        switch (this.type) {
            case 'emptiness':
                // 空虚：内核数值>空虚数值时，同化后内核数值+=对应数值，但内核短时间减速
                if (coreValue > this.value) {
                    result.newValue = coreValue + this.value;
                    result.message = `同化空虚+${this.value}`;
                    result.slowdown = true;
                } else {
                    // 内核数值<空虚数值时直接失败
                    result.success = false;
                    result.message = '内核数值不足，同化空虚失败';
                }
                break;
                
            case 'guilt':
                // 愧疚：同化后内核数值-=对应数值
                result.newValue = coreValue - this.value;
                result.message = `同化愧疚-${this.value}`;
                break;
                
            case 'anxiety':
                // 焦虑：同化后内核数值-=对应数值，且5秒内仅可同化"情绪碎片"
                result.newValue = coreValue - this.value;
                result.message = `同化焦虑-${this.value}`;
                result.anxietyEffect = true;
                break;
                
            case 'fragment':
                // 情绪碎片：同化后内核数值+2
                result.newValue = coreValue + 2;
                result.message = '同化情绪碎片+2';
                break;
                
            case 'collapse':
                // 崩溃：碰撞后直接失败
                result.success = false;
                result.message = '碰撞崩溃，游戏失败';
                break;
        }
        
        return result;
    }
    
    /**
     * 从场景中移除对象
     * @param {THREE.Scene} scene - Three.js场景
     */
    removeFromScene(scene) {
        if (this.mesh && scene) {
            scene.remove(this.mesh);
        }
        if (this.label && scene) {
            scene.remove(this.label);
        }
    }
    
    /**
     * 获取网格对象
     * @returns {THREE.Mesh} 网格对象
     */
    getMesh() {
        return this.mesh;
    }
    
    /**
     * 获取标签对象
     * @returns {THREE.Sprite} 标签对象
     */
    getLabel() {
        return this.label;
    }
    
    /**
     * 更新情绪对象状态
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        // 基础更新逻辑：旋转动画
        if (this.mesh && !this.isAbsorbed) {
            // 根据情绪类型设置不同的旋转速度
            let rotationSpeed = 0.5;
            switch (this.type) {
                case 'emptiness':
                    rotationSpeed = 0.3; // 空虚缓慢旋转
                    break;
                case 'guilt':
                    rotationSpeed = 0.2; // 愧疚更慢旋转
                    break;
                case 'anxiety':
                    rotationSpeed = 1.0; // 焦虑快速旋转
                    break;
                case 'fragment':
                    rotationSpeed = 1.5; // 碎片快速旋转
                    break;
                case 'collapse':
                    rotationSpeed = 0.8; // 崩溃中速旋转
                    break;
            }
            
            // 应用旋转，限制最大旋转角度以避免性能问题
            const maxRotation = 0.1; // 限制每帧最大旋转角度
            const actualRotation = Math.min(rotationSpeed * deltaTime, maxRotation);
            this.mesh.rotation.y += actualRotation;
            this.mesh.rotation.x += actualRotation * 0.5;
        }
        
        // 更新标签位置（如果存在）
        if (this.label && this.mesh && !this.isAbsorbed) {
            this.label.position.copy(this.mesh.position);
            this.label.position.y += 5; // 保持标签在物体上方
            // 移除旋转设置，保持文字正向显示
            // this.label.material.rotation = Math.PI; // 注释掉这行，避免文字倒置
        }
    }
}

/**
 * 空虚情绪对象
 */
export class EmptinessObject extends EmotionObject {
    constructor(position, config) {
        // 使用固定数值，如果没有提供则使用默认值
        const value = config.fixedValue !== undefined ? config.fixedValue : 25;
        // 根据数值计算尺寸
        const size = 1 + (value / 35) * 2; // 基础大小1，最大3
        const geometry = new THREE.TetrahedronGeometry(size, 0);
        const material = new THREE.MeshPhongMaterial({
            map: TextureGenerator.generateEmptinessTexture(),
            color: 0xffffff,   // 基础颜色为白色，让纹理完全控制颜色
            specular: 0x333333, // 中低强度高光
            shininess: 15      // 适中的光泽度
        });
        
        super('emptiness', value, position, geometry, material);
    }
}

/**
 * 愧疚情绪对象
 */
export class GuiltObject extends EmotionObject {
    constructor(position, config) {
        // 使用固定数值，如果没有提供则使用默认值
        const value = config.fixedValue !== undefined ? config.fixedValue : 15;
        // 根据数值计算尺寸
        const size = 1 + (value / 20) * 1; // 基础大小1，最大2
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshPhongMaterial({
            map: TextureGenerator.generateGuiltTexture(),
            color: 0xffffff,   // 基础颜色为白色，让纹理完全控制颜色
            specular: 0x222222, // 低强度高光
            shininess: 10      // 低光泽度
        });
        
        super('guilt', value, position, geometry, material);
    }
}

/**
 * 焦虑情绪对象
 */
export class AnxietyObject extends EmotionObject {
    constructor(position, config) {
        // 使用固定数值，如果没有提供则使用默认值
        const value = config.fixedValue !== undefined ? config.fixedValue : 15;
        // 根据数值计算尺寸
        const size = 1 + (value / 20) * 1; // 基础大小1，最大2
        const geometry = new THREE.ConeGeometry(size, size * 2, 8);
        // 使用Phong材质实现标准Phong局部光照模型
        const material = new THREE.MeshPhongMaterial({
            map: TextureGenerator.generateAnxietyTexture(),
            color: 0xffffff,   // 基础颜色为白色，让纹理完全控制颜色
            specular: 0x555555, // 中等强度高光，模拟焦虑情绪的不稳定性
            shininess: 25      // 较高光泽度，表现焦虑情绪的尖锐特性
        });
        
        super('anxiety', value, position, geometry, material);
    }
}

/**
 * 情绪碎片对象
 */
export class FragmentObject extends EmotionObject {
    constructor(position, config) {
        const geometry = new THREE.SphereGeometry(config.radius, 16, 16);
        // 使用Phong材质实现标准Phong局部光照模型
        const material = new THREE.MeshPhongMaterial({
            map: TextureGenerator.generateFragmentTexture(),
            color: 0xffffff,   // 基础颜色为白色，让纹理完全控制颜色
            specular: 0x666666, // 中高强度高光，模拟碎片的多面反射
            shininess: 40      // 高光泽度，表现碎片锋利的边缘
        });
        
        super('fragment', config.value, position, geometry, material);
    }
}

/**
 * 崩溃情绪对象
 */
export class CollapseObject extends EmotionObject {
    constructor(position, config) {
        const geometry = new THREE.SphereGeometry(config.radius, 16, 16);
        // 使用Phong材质实现标准Phong局部光照模型
        const material = new THREE.MeshPhongMaterial({
            map: TextureGenerator.generateCollapseTexture(),
            color: 0xffffff,   // 基础颜色为白色，让纹理完全控制颜色
            specular: 0x777777, // 高强度高光，模拟崩溃物体的反射特性
            shininess: 50      // 很高的光泽度，表现崩溃情绪的强烈特性
        });
        
        super('collapse', 0, position, geometry, material);
    }
    
    // 崩溃对象不需要标签
    createLabel() {
        // 不创建标签
    }
}