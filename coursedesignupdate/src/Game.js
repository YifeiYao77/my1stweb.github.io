import * as THREE from 'three';
import SceneManager from './SceneManager.js';
import Core from './Core.js';
import {
    EmptinessObject,
    GuiltObject,
    AnxietyObject,
    FragmentObject,
    CollapseObject
} from './EmotionObject.js';
import CollisionDetector from './CollisionDetector.js';
import UI from './UI.js';
import AudioManager from './AudioManager.js';

export default class Game {
    constructor() {
        this.sceneManager = null;
        this.core = null;
        this.emotionObjects = [];
        this.collisionDetector = null;
        this.ui = null;
        this.audioManager = null; // 添加音频管理器
        this.gameStatus = 'playing'; // playing, success, failed
        this.keys = {}; // 键盘状态
        this.lastTime = 0;
        this.container = document.getElementById('game-container');
        this.config = null;
        
        // 场景尺寸
        this.sceneWidth = 50;
        this.sceneDepth = 50;
        
        // 性能优化相关
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS; // 目标帧间隔（毫秒）
        this.then = 0;
    }
    
    /**
     * 初始化游戏
     */
    async init() {
        console.log('Game.init() called');
        
        // 导入配置文件
        const response = await fetch('./src/Config.json');
        this.config = await response.json();
        console.log('Config loaded:', this.config);
        
        // 更新场景尺寸
        this.sceneWidth = this.config.scene.dimensions.width;
        this.sceneDepth = this.config.scene.dimensions.depth;
        
        // 初始化场景管理器
        this.sceneManager = new SceneManager();
        await this.sceneManager.init(this.container);
        console.log('SceneManager initialized');
        
        // 初始化UI
        this.ui = new UI();
        this.ui.updateCoreValue(this.config.core.initialValue);
        this.ui.updateGameStatus('playing');
        console.log('UI initialized');
        
        // 初始化音频管理器
        this.audioManager = new AudioManager();
        const audioInitResult = await this.audioManager.init();
        if (audioInitResult) {
            console.log('AudioManager initialized successfully');
            // 尝试自动播放音乐（可能会被浏览器阻止）
            this.audioManager.play();
        } else {
            console.warn('AudioManager initialization failed');
        }
        
        // 初始化内核
        this.core = new Core(this.config);
        this.sceneManager.getScene().add(this.core.getMesh());
        console.log('Core added to scene:', this.core.getMesh());
        
        // 初始化情绪对象
        this.createEmotionObjects();
        console.log('Emotion objects created:', this.emotionObjects.length);
        
        // 初始化碰撞检测器
        this.collisionDetector = new CollisionDetector();
        console.log('CollisionDetector initialized');
        
        // 设置事件监听
        this.setupEventListeners();
        console.log('Event listeners set up');
        
        // 调试：检查场景中的物体数量
        console.log('Scene objects:', this.sceneManager.getScene().children.length);
        this.sceneManager.getScene().children.forEach((child, index) => {
            console.log(`Object ${index}:`, child.type, child.position);
        });
    }
    
    /**
     * 创建情绪对象
     */
    createEmotionObjects() {
        // 清空现有情绪对象
        this.emotionObjects = [];
        
        // 创建"空虚"对象 - 固定数值：15、25、35
        const emptinessValues = [15, 25, 35];
        for (let i = 0; i < this.config.emotions.emptiness.count; i++) {
            const position = this.getRandomPosition();
            // 创建临时配置，包含固定数值
            const tempConfig = {
                ...this.config.emotions.emptiness,
                fixedValue: emptinessValues[i]
            };
            const emptiness = new EmptinessObject(position, tempConfig);
            this.emotionObjects.push(emptiness);
            this.sceneManager.getScene().add(emptiness.getMesh());
            if (emptiness.getLabel()) {
                this.sceneManager.getScene().add(emptiness.getLabel());
            }
        }
        
        // 创建"内疚"对象 - 固定数值：10、20
        const guiltValues = [10, 20];
        for (let i = 0; i < this.config.emotions.guilt.count; i++) {
            const position = this.getRandomPosition();
            // 创建临时配置，包含固定数值
            const tempConfig = {
                ...this.config.emotions.guilt,
                fixedValue: guiltValues[i]
            };
            const guilt = new GuiltObject(position, tempConfig);
            this.emotionObjects.push(guilt);
            this.sceneManager.getScene().add(guilt.getMesh());
            if (guilt.getLabel()) {
                this.sceneManager.getScene().add(guilt.getLabel());
            }
        }
        
        // 创建"焦虑"对象 - 固定数值：10、20
        const anxietyValues = [10, 20];
        for (let i = 0; i < this.config.emotions.anxiety.count; i++) {
            const position = this.getRandomPosition();
            // 创建临时配置，包含固定数值
            const tempConfig = {
                ...this.config.emotions.anxiety,
                fixedValue: anxietyValues[i]
            };
            const anxiety = new AnxietyObject(position, tempConfig);
            this.emotionObjects.push(anxiety);
            this.sceneManager.getScene().add(anxiety.getMesh());
            if (anxiety.getLabel()) {
                this.sceneManager.getScene().add(anxiety.getLabel());
            }
        }
        
        // 创建"分裂"对象
        for (let i = 0; i < this.config.emotions.fragment.count; i++) {
            const position = this.getRandomPosition();
            const fragment = new FragmentObject(position, this.config.emotions.fragment);
            this.emotionObjects.push(fragment);
            this.sceneManager.getScene().add(fragment.getMesh());
            if (fragment.getLabel()) {
                this.sceneManager.getScene().add(fragment.getLabel());
            }
        }
        
        // 创建"崩溃"对象
        for (let i = 0; i < this.config.emotions.collapse.count; i++) {
            const position = this.getRandomPosition();
            const collapse = new CollapseObject(position, this.config.emotions.collapse);
            this.emotionObjects.push(collapse);
            this.sceneManager.getScene().add(collapse.getMesh());
            if (collapse.getLabel()) {
                this.sceneManager.getScene().add(collapse.getLabel());
            }
        }
    }
    
    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 键盘按下事件
        window.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // P键导出图像
            if (event.code === 'KeyP') {
                this.exportImage();
            }
            
            // M键切换音乐播放/暂停
            if (event.code === 'KeyM' && this.audioManager) {
                this.audioManager.togglePlayPause();
            }
            
            // D键调试情绪对象状态
            if (event.code === 'KeyD') {
                this.debugEmotionObjectsStatus();
            }
            
            // V键测试胜利条件（设置所有必需情绪对象为已同化）
            if (event.code === 'KeyV') {
                this.testVictoryCondition();
            }
        });
        
        // 键盘释放事件
        window.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // 鼠标点击事件 - 用于启用音频播放
        window.addEventListener('click', () => {
            // 如果音频管理器存在但未播放，尝试播放音乐
            if (this.audioManager && !this.audioManager.isPlayingMusic()) {
                this.audioManager.play();
            }
        }, { once: false });
        
        // 游戏重新开始事件
        document.addEventListener('restartGame', () => {
            this.restart();
        });
    }
    
    /**
     * 游戏主循环
     * @param {number} currentTime - 当前时间戳
     */
    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));
        
        // 帧率限制
        const now = currentTime * 0.001; // 转换为秒
        const delta = now - this.then;
        
        if (delta > this.frameInterval * 0.001) { // 转换为秒进行比较
            this.then = now - (delta % this.frameInterval * 0.001);
            
            // 计算时间增量
            const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // 限制最大时间增量为0.1秒
            this.lastTime = currentTime;
            
            // 更新FPS计数
            this.frameCount++;
            if (currentTime - this.fpsUpdateTime > 1000) { // 每秒更新一次FPS
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.fpsUpdateTime = currentTime;
                
                // 在控制台输出FPS，用于性能监控
                if (this.fps < 30) { // 降低警告阈值，从50改为30
                    console.warn(`性能警告: FPS = ${this.fps}`);
                }
            }
            
            // 如果游戏未结束，更新游戏状态
            if (this.gameStatus === 'playing') {
                // 处理输入
                this.core.handleInput(this.keys, this.sceneWidth, this.sceneDepth);
                
                // 更新内核
                this.core.update(deltaTime);
                
                // 更新所有情绪对象，使用隔帧更新以提高性能
                const shouldUpdateEmotions = this.frameCount % 3 === 0; // 每3帧更新一次情绪对象
                if (shouldUpdateEmotions) {
                    this.emotionObjects.forEach(emotion => {
                        if (!emotion.isAbsorbed) {
                            emotion.update(deltaTime * 3); // 补偿时间增量
                        }
                    });
                }
                
                // 更新相机位置
                this.sceneManager.updateCamera(this.core.getPosition());
                
                // 更新光源位置，使其跟随内核物体移动
                this.sceneManager.updateLightPosition(this.core.getPosition());
                
                // 检测碰撞
                const collisionResult = this.collisionDetector.checkCollisions(
                    this.core,
                    this.emotionObjects
                );
                
                if (collisionResult) {
                    this.handleCollision(collisionResult);
                }
                
                // 检查游戏状态
                this.checkGameStatus();
                
                // 更新光照
                this.sceneManager.updateLight(this.core.getValue(), this.gameStatus);
                
                // 更新UI
                this.ui.updateCoreValue(this.core.getValue());
                this.ui.updateSpecialStatus(
                    this.core.slowdownTimer > 0,
                    this.core.isAnxietyActive()
                );
            }
        }
        
        // 渲染场景（始终渲染，不受帧率限制影响）
        this.sceneManager.render();
    }
    
    /**
     * 处理碰撞结果
     * @param {Object} result - 碰撞结果
     */
    handleCollision(result) {
        // 显示消息
        this.ui.showMessage(result.message);
        
        // 如果游戏结束，更新游戏状态
        if (result.gameOver) {
            this.gameStatus = 'failed';
            this.ui.updateGameStatus('failed');
            this.ui.showGameResult('failed', result.message);
            return;
        }
        
        // 移除已被同化的对象
        const absorbedObject = this.emotionObjects.find(obj => obj.isAbsorbed && !obj.removed);
        if (absorbedObject) {
            absorbedObject.removeFromScene(this.sceneManager.getScene());
            absorbedObject.removed = true;
        }
        
        // 在处理同化后立即检查游戏状态
        this.checkGameStatus();
    }
    
    /**
     * 启动游戏循环
     */
    start() {
        this.animate();
    }
    
    /**
     * 检查游戏状态
     */
    checkGameStatus() {
        // 如果游戏已经结束，不再检查
        if (this.gameStatus !== 'playing') {
            console.log('游戏已结束，当前状态:', this.gameStatus);
            return;
        }
        
        // 检查是否失败
        if (this.collisionDetector.checkDefeat(this.core)) {
            console.log('游戏失败：内核数值耗尽');
            this.gameStatus = 'failed';
            this.ui.updateGameStatus('failed');
            this.ui.showGameResult('failed', '内核数值耗尽，游戏失败！');
            return;
        }
        
        // 检查是否胜利
        const victoryResult = this.collisionDetector.checkVictory(this.emotionObjects);
        console.log('胜利判定结果:', victoryResult);
        
        if (victoryResult) {
            console.log('游戏胜利：所有必需情绪对象已同化');
            this.gameStatus = 'success';
            this.ui.updateGameStatus('success');
            this.ui.showGameResult('success', '恭喜！你已同化所有情绪对象！');
        }
    }
    
    /**
     * 调试方法：检查情绪对象状态
     */
    debugEmotionObjectsStatus() {
        const status = {
            total: this.emotionObjects.length,
            absorbed: this.emotionObjects.filter(obj => obj.isAbsorbed).length,
            byType: {}
        };
        
        // 按类型统计
        for (const obj of this.emotionObjects) {
            if (!status.byType[obj.type]) {
                status.byType[obj.type] = {
                    total: 0,
                    absorbed: 0
                };
            }
            status.byType[obj.type].total++;
            if (obj.isAbsorbed) {
                status.byType[obj.type].absorbed++;
            }
        }
        
        console.log('情绪对象状态:', status);
        console.log('胜利判定结果:', this.collisionDetector.checkVictory(this.emotionObjects));
        
        return status;
    }
    
    /**
     * 测试胜利条件（设置所有必需情绪对象为已同化）
     */
    testVictoryCondition() {
        console.log('测试胜利条件：设置所有必需情绪对象为已同化');
        
        // 只设置"愧疚"、"空虚"和"焦虑"对象为已同化
        const requiredTypes = ['guilt', 'emptiness', 'anxiety'];
        
        for (const obj of this.emotionObjects) {
            if (requiredTypes.includes(obj.type)) {
                obj.isAbsorbed = true;
                // 从场景中移除
                if (!obj.removed) {
                    obj.removeFromScene(this.sceneManager.getScene());
                    obj.removed = true;
                }
            }
        }
        
        // 检查状态
        this.debugEmotionObjectsStatus();
        
        // 检查游戏状态
        this.checkGameStatus();
    }
    
    /**
     * 导出当前场景为PNG图像
     */
    exportImage() {
        const renderer = this.sceneManager.getRenderer();
        const dataURL = renderer.domElement.toDataURL('image/png');
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `emotion-control-${Date.now()}.png`;
        link.click();
        
        // 显示导出成功消息
        this.ui.showMessage('图像已导出！');
    }
    
    /**
     * 获取随机位置（用于生成情绪对象）
     * @returns {Object} 随机位置对象
     */
    getRandomPosition() {
        const maxObjectSize = 3; // 最大情绪对象尺寸（空虚对象最大为3）
        const safeMargin = maxObjectSize * 2; // 安全边距
        
        // 在场景范围内生成随机位置，确保物体完全在场景内
        const x = (Math.random() - 0.5) * (this.sceneWidth - safeMargin);
        const z = (Math.random() - 0.5) * (this.sceneDepth - safeMargin);
        const y = 1.0; // 固定y坐标，确保物体在地板上且不浮动过高
        
        return { x, y, z };
    }
    
    /**
     * 重新开始游戏
     */
    restart() {
        // 重置游戏状态
        this.gameStatus = 'playing';
        this.ui.updateGameStatus('playing');
        
        // 重置内核
        this.core.reset(this.config);
        this.ui.updateCoreValue(this.config.core.initialValue);
        
        // 清除旧的情绪对象
        const scene = this.sceneManager.getScene();
        this.emotionObjects.forEach(obj => {
            obj.removeFromScene(scene);
        });
        this.emotionObjects = [];
        
        // 创建新的情绪对象
        this.createEmotionObjects();
        
        // 重置光照
        this.sceneManager.updateLight(this.core.getValue(), this.gameStatus);
        
        // 显示重新开始消息
        this.ui.showMessage('游戏已重新开始！');
    }
}