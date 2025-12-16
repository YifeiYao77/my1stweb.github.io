import * as THREE from 'three';
import TextureGenerator from './TextureGenerator.js';

export default class Core {
    constructor(config) {
        this.value = config.core.initialValue;
        this.position = new THREE.Vector3(
            config.core.position.x,
            config.core.position.y,
            config.core.position.z
        );
        this.radius = config.core.radius;
        this.baseSpeed = config.core.speed;
        this.currentSpeed = this.baseSpeed;
        this.mesh = null;
        this.light = null; // 添加点光源
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.slowdownTimer = 0; // 减速计时器
        this.anxietyTimer = 0; // 焦虑效果计时器
        this.createMesh();
        this.createLight(); // 创建点光源
    }
    
    /**
     * 创建内核网格对象
     */
    createMesh() {
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        
        // 使用Phong材质实现标准Phong局部光照模型
        const material = new THREE.MeshPhongMaterial({
            map: TextureGenerator.generateCoreTexture(),
            color: 0xffffff,   // 基础颜色为白色，让纹理完全控制颜色
            specular: 0x444444, // 中等强度高光，模拟金属表面
            shininess: 30,     // 高光泽度，模拟金属表面
            emissive: 0xffffcc,
            emissiveIntensity: 0.9 // 增强自发光强度
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData = { isCore: true };
    }
    
    /**
     * 创建内核球体的点光源
     */
    createLight() {
        // 创建点光源，作为内核球体的发光效果
        this.light = new THREE.PointLight(
            0xffffff,  // 纯白色光源
            5.0,  // 光照强度
            30,  // 光照距离
            2.0  // 衰减系数
        );
        
        // 设置光源位置与内核球体相同
        this.light.position.copy(this.position);
        
        // 启用阴影投射
        this.light.castShadow = true;
        
        // 优化阴影设置
        this.light.shadow.mapSize.width = 512;
        this.light.shadow.mapSize.height = 512;
        this.light.shadow.camera.near = 0.1;
        this.light.shadow.camera.far = 20;
        this.light.shadow.bias = -0.001;
        
        // 将光源添加到内核球体，使其跟随移动
        this.mesh.add(this.light);
    }
    
    /**
     * 更新内核位置
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        // 更新位置
        this.position.add(
            this.velocity.clone().multiplyScalar(this.currentSpeed * deltaTime)
        );
        this.mesh.position.copy(this.position);
        
        // 更新减速计时器
        if (this.slowdownTimer > 0) {
            this.slowdownTimer -= deltaTime;
            // 减速效果：速度降低到原来的30%
            this.currentSpeed = this.baseSpeed * 0.3;
        } else {
            this.currentSpeed = this.baseSpeed;
        }
        
        // 更新焦虑计时器
        if (this.anxietyTimer > 0) {
            this.anxietyTimer -= deltaTime;
        }
        
        // 根据数值调整内核发光效果
        const emissiveIntensity = Math.max(0.05, Math.min(0.3, this.value / 100));
        this.mesh.material.emissiveIntensity = emissiveIntensity;
    }
    
    /**
     * 处理键盘输入
     * @param {Object} keys - 按键状态对象
     * @param {number} sceneWidth - 场景宽度
     * @param {number} sceneDepth - 场景深度
     */
    handleInput(keys, sceneWidth, sceneDepth) {
        // 重置速度
        this.velocity.set(0, 0, 0);
        
        // 处理方向键输入
        if (keys.ArrowUp) {
            this.velocity.z = -1;
        }
        if (keys.ArrowDown) {
            this.velocity.z = 1;
        }
        if (keys.ArrowLeft) {
            this.velocity.x = -1;
        }
        if (keys.ArrowRight) {
            this.velocity.x = 1;
        }
        
        // 归一化速度向量，确保斜向移动速度一致
        if (this.velocity.length() > 0) {
            this.velocity.normalize();
        }
        
        // 限制内核在场景边界内
        const halfWidth = sceneWidth / 2 - this.radius;
        const halfDepth = sceneDepth / 2 - this.radius;
        
        this.position.x = Math.max(-halfWidth, Math.min(halfWidth, this.position.x));
        this.position.z = Math.max(-halfDepth, Math.min(halfDepth, this.position.z));
    }
    
    /**
     * 应用减速效果
     * @param {number} duration - 减速持续时间（秒）
     */
    applySlowdown(duration) {
        this.slowdownTimer = duration;
    }
    
    /**
     * 应用焦虑效果
     * @param {number} duration - 焦虑效果持续时间（秒）
     */
    applyAnxietyEffect(duration) {
        this.anxietyTimer = duration;
    }
    
    /**
     * 检查是否处于焦虑状态
     * @returns {boolean} 是否处于焦虑状态
     */
    isAnxietyActive() {
        return this.anxietyTimer > 0;
    }
    
    /**
     * 更新数值
     * @param {number} newValue - 新数值
     */
    updateValue(newValue) {
        this.value = newValue;
    }
    
    /**
     * 获取当前数值
     * @returns {number} 当前数值
     */
    getValue() {
        return this.value;
    }
    
    /**
     * 获取位置
     * @returns {THREE.Vector3} 当前位置
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * 获取半径
     * @returns {number} 半径
     */
    getRadius() {
        return this.radius;
    }
    
    /**
     * 获取网格对象
     * @returns {THREE.Mesh} 网格对象
     */
    getMesh() {
        return this.mesh;
    }
    
    /**
     * 重置内核状态
     */
    reset(config) {
        this.value = config.core.initialValue;
        this.position.set(
            config.core.position.x,
            config.core.position.y,
            config.core.position.z
        );
        this.velocity.set(0, 0, 0);
        this.slowdownTimer = 0;
        this.anxietyTimer = 0;
        this.currentSpeed = this.baseSpeed;
        this.mesh.position.copy(this.position);
    }
}