import * as THREE from 'three';
import TextureGenerator from './TextureGenerator.js';
import TWEEN from './TWEEN.js';

/**
 * 场景管理器
 * 负责创建和管理Three.js场景、相机、渲染器和封闭空间
 */
export default class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.container = null;
        this.config = null;
        this.walls = [];
        this.currentLightColor = null;
        this.currentGameStatus = 'normal';
        
        // 缩放相关属性
        this.zoomConfig = {
            minDistance: 15,  // 最小距离
            maxDistance: 60,  // 最大距离
            currentDistance: 30,  // 当前距离
            targetDistance: 30,  // 目标距离
            zoomSpeed: 0.1,  // 缩放速度
            smoothFactor: 0.08  // 平滑因子
        };
    }
    
    /**
     * 初始化场景
     * @param {HTMLElement} container - 游戏容器元素
     */
    async init(container) {
        // 导入配置文件
        const response = await fetch('./src/Config.json');
        this.config = await response.json();
        
        this.container = container;
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLights();
        this.createEnclosedSpace();
        
        // 设置窗口大小变化监听
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // 添加鼠标滚轮事件监听器，用于缩放控制
        this.container.addEventListener('wheel', this.onMouseWheel.bind(this));
    }
    
    /**
     * 创建Three.js场景
     */
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // 使用黑色背景，突出光照效果
        
        // 添加适度的环境光，确保物体基础可见性
        // 调整前：0x404040, 0.5 (灰色环境光，中等强度)
        // 调整后：0x606080, 0.8 (柔和蓝灰色环境光，较高强度，提供更舒适的色温)
        this.scene.ambientLight = new THREE.AmbientLight(0x606080, 0.8); // 柔和蓝灰色环境光，较高强度
        this.scene.add(this.scene.ambientLight);
    }
    
    /**
     * 创建相机
     */
    createCamera() {
        const { camera } = this.config;
        this.camera = new THREE.PerspectiveCamera(
            camera.fov,
            window.innerWidth / window.innerHeight,
            camera.near,
            camera.far
        );
        
        this.camera.position.set(
            camera.position.x,
            camera.position.y,
            camera.position.z
        );
        
        // 确保lookAt使用Vector3
        this.camera.lookAt(new THREE.Vector3(
            camera.lookAt.x,
            camera.lookAt.y,
            camera.lookAt.z
        ));
    }
    
    /**
     * 创建渲染器
     */
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            preserveDrawingBuffer: true, // 保留绘制缓冲区，用于图像导出
            powerPreference: "high-performance" // 优先使用高性能GPU
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比以提高性能
        
        // 阴影设置
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用PCF软阴影
        this.renderer.shadowMap.autoUpdate = true; // 确保阴影自动更新
        
        // 优化阴影设置，减少性能开销
        this.renderer.shadowMap.needsUpdate = false; // 手动控制阴影更新
        this.shadowUpdateCounter = 0; // 阴影更新计数器
        
        // 启用色调映射以获得更好的光照效果
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // 设置输出颜色空间
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // 启用对象级别的渲染优化
        this.renderer.sortObjects = true; // 启用对象排序
        
        this.container.appendChild(this.renderer.domElement);
    }
    
    /**
     * 创建光源
     */
    createLights() {
        const { scene } = this.config;

        // 创建主要点光源，跟随内核物体
        // 调整前：0xffffff, 5.0, 30, 1.0 (纯白色光源，高强度，中等距离，标准衰减)
        // 调整后：0xfff5e6, 3.0, 40, 0.8 (暖白色光源，中等强度，更大距离，较慢衰减)
        this.mainLight = new THREE.PointLight(
            0xfff5e6,  // 暖白色光源，提供更舒适的色温
            3.0,  // 光照强度，适中亮度避免眩光
            40,  // 光照距离，扩大范围确保光线均匀分布
            0.8  // 衰减系数，较慢衰减使光线更均匀
        );
        
        // 初始位置设置于场景平面中心点正上方
        this.mainLight.position.set(
            scene.lightPosition.x,
            scene.lightPosition.y,
            scene.lightPosition.z
        );
        
        // 启用阴影投射
        this.mainLight.castShadow = true;
        
        // 优化阴影设置
        this.mainLight.shadow.mapSize.width = 512; // 进一步降低分辨率以提高性能
        this.mainLight.shadow.mapSize.height = 512;
        
        // 优化阴影相机参数
        this.mainLight.shadow.camera.near = 0.5;
        this.mainLight.shadow.camera.far = 50;
        
        // 阴影偏差设置，防止阴影痤疮
        this.mainLight.shadow.bias = -0.0005;
        
        // 启用软阴影效果
        this.mainLight.shadow.radius = 4;
        
        this.scene.add(this.mainLight);
    }
    
    /**
     * 创建封闭空间（墙体、地板和天花板）
     */
    createEnclosedSpace() {
        const { scene } = this.config;
        const { width, depth } = scene.dimensions;
        const wallTexture = TextureGenerator.generateWallTexture();
        
        // 地板材质 - 使用Phong材质实现标准Phong局部光照模型
        const floorMaterial = new THREE.MeshPhongMaterial({
            map: wallTexture,
            side: THREE.DoubleSide,
            color: 0xffffff,  // 基础颜色为白色，让纹理完全控制颜色
            specular: 0x222222,  // 低强度高光，避免过度反光
            shininess: 10  // 适中的光泽度，确保高光效果可见但不刺眼
        });
        
        // 仅保留地板（物体所在平面）
        const floorGeometry = new THREE.BoxGeometry(width, 0.5, depth);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.set(0, -0.25, 0);
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.walls.push(floor);
    }
    
    /**
     * 更新光源强度
     * @param {number} coreValue - 内核数值
     * @param {string} gameStatus - 游戏状态
     */
    updateLight(coreValue, gameStatus) {
        // 实现亮度与内核数值的动态线性关联机制
        // 调整前：基础亮度1.0，系数0.02，范围1.0-4.0
        // 调整后：基础亮度2.0，系数0.015，范围2.0-5.0，更舒适的亮度范围
        const baseIntensity = 2.0;
        const coefficient = 0.015;
        const intensity = Math.max(2.0, Math.min(5.0, baseIntensity + (coreValue * coefficient)));
        this.mainLight.intensity = intensity;
        
        // 保持光源色温为暖白色，提供更舒适的视觉体验
        this.mainLight.color.setHex(0xfff5e6);
        
        // 更新游戏状态但不改变光源颜色
        this.currentGameStatus = gameStatus;
        this.currentLightColor = 0xfff5e6;
    }
    
    /**
     * 更新光源位置，使其跟随内核物体移动
     * @param {THREE.Vector3} corePosition - 内核物体位置
     */
    updateLightPosition(corePosition) {
        // 保持光源在平面上的投影始终位于内核物体的中心位置
        // y坐标固定为20，保持在平面正上方，模拟聚光灯效果
        this.mainLight.position.set(
            corePosition.x,  // 与内核物体相同的x坐标
            this.config.scene.lightPosition.y,  // 使用配置中的高度
            corePosition.z   // 与内核物体相同的z坐标
        );
    }
    
    /**
     * 更新相机位置，使其跟随内核
     * @param {THREE.Vector3} targetPosition - 目标位置（内核位置）
     */
    updateCamera(targetPosition) {
        // 使用新的缩放功能更新相机
        this.updateCameraZoom(targetPosition);
    }
    
    /**
     * 窗口大小变化处理
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * 鼠标滚轮事件处理
     * @param {WheelEvent} event - 滚轮事件
     */
    onMouseWheel(event) {
        // 阻止默认滚动行为
        event.preventDefault();
        
        // 获取滚动方向和数值
        const delta = event.deltaY;
        
        // 根据滚动方向更新目标距离
        // 向上滚动（delta < 0）= 放大（减少距离）
        // 向下滚动（delta > 0）= 缩小（增加距离）
        const zoomChange = delta * this.zoomConfig.zoomSpeed * 0.1;
        this.zoomConfig.targetDistance = Math.max(
            this.zoomConfig.minDistance,
            Math.min(
                this.zoomConfig.maxDistance,
                this.zoomConfig.targetDistance + zoomChange
            )
        );
    }
    
    /**
     * 更新相机缩放
     * @param {THREE.Vector3} targetPosition - 目标位置（内核位置）
     */
    updateCameraZoom(targetPosition) {
        // 平滑过渡当前距离到目标距离
        this.zoomConfig.currentDistance += (
            this.zoomConfig.targetDistance - this.zoomConfig.currentDistance
        ) * this.zoomConfig.smoothFactor;
        
        // 计算相机相对于目标的位置
        const offsetX = 0;
        const offsetY = 30;
        const offsetZ = this.zoomConfig.currentDistance;
        
        // 平滑过渡相机位置
        const targetCameraPos = new THREE.Vector3(
            targetPosition.x + offsetX,
            targetPosition.y + offsetY,
            targetPosition.z + offsetZ
        );
        
        this.camera.position.lerp(targetCameraPos, 0.1);
        this.camera.lookAt(targetPosition);
    }
    
    /**
     * 渲染场景
     */
    render() {
        // 更新TWEEN动画
        TWEEN.update();
        
        // 控制阴影更新频率，每30帧更新一次以提高性能
        this.shadowUpdateCounter++;
        if (this.shadowUpdateCounter >= 30) {
            this.mainLight.shadow.map.needsUpdate = true;
            this.shadowUpdateCounter = 0;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * 获取渲染器，用于图像导出
     * @returns {THREE.WebGLRenderer} 渲染器实例
     */
    getRenderer() {
        return this.renderer;
    }
    
    /**
     * 获取场景，用于添加游戏对象
     * @returns {THREE.Scene} 场景实例
     */
    getScene() {
        return this.scene;
    }
    
    /**
     * 获取相机，用于射线检测等
     * @returns {THREE.PerspectiveCamera} 相机实例
     */
    getCamera() {
        return this.camera;
    }
}