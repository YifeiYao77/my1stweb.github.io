import * as THREE from 'three';

/**
 * 碰撞检测器
 * 负责检测内核与情绪对象之间的碰撞
 */
export default class CollisionDetector {
    constructor() {
        this.lastCollisionTime = 0;
        this.collisionCooldown = 500; // 碰撞冷却时间（毫秒）
    }
    
    /**
     * 检测内核与情绪对象之间的碰撞
     * @param {Core} core - 内核对象
     * @param {Array} emotionObjects - 情绪对象数组
     * @returns {Object|null} 碰撞结果或null
     */
    checkCollisions(core, emotionObjects) {
        const currentTime = Date.now();
        
        // 检查是否在冷却时间内
        if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
            return null;
        }
        
        const corePosition = core.getPosition();
        const coreRadius = core.getRadius();
        const isAnxietyActive = core.isAnxietyActive();
        
        for (const emotionObject of emotionObjects) {
            // 跳过已被同化的对象
            if (emotionObject.isAbsorbed) {
                continue;
            }
            
            // 检测碰撞
            if (emotionObject.checkCollision(corePosition, coreRadius)) {
                // 如果处于焦虑状态，只能同化情绪碎片
                if (isAnxietyActive && emotionObject.type !== 'fragment') {
                    return {
                        type: 'anxiety_restriction',
                        emotionType: emotionObject.type,
                        message: '焦虑状态下只能同化情绪碎片！',
                        success: false,
                        gameOver: true
                    };
                }
                
                // 处理同化效果
                const result = emotionObject.handleAbsorption(core.getValue());
                
                if (result) {
                    // 更新内核数值
                    core.updateValue(result.newValue);
                    
                    // 应用特殊效果
                    if (result.slowdown) {
                        core.applySlowdown(2); // 减速2秒
                    }
                    
                    if (result.anxietyEffect) {
                        core.applyAnxietyEffect(5); // 焦虑效果5秒
                    }
                    
                    // 更新碰撞时间
                    this.lastCollisionTime = currentTime;
                    
                    // 添加游戏结束标志
                    result.gameOver = !result.success || result.newValue <= 0;
                    
                    return result;
                }
            }
        }
        
        return null;
    }
    
    /**
     * 检查游戏是否胜利
     * @param {Array} emotionObjects - 情绪对象数组
     * @returns {boolean} 是否胜利
     */
    checkVictory(emotionObjects) {
        // 只检查"愧疚"、"空虚"和"焦虑"这三种特定情绪物体是否已被同化
        const requiredEmotionTypes = ['guilt', 'emptiness', 'anxiety'];
        
        // 调试信息：记录每种类型的同化状态
        const debugInfo = {};
        
        const result = requiredEmotionTypes.every(emotionType => {
            // 检查每种必需的情绪类型是否所有实例都已被同化
            const objectsOfType = emotionObjects.filter(obj => obj.type === emotionType);
            const allAbsorbed = objectsOfType.length > 0 && objectsOfType.every(obj => obj.isAbsorbed);
            
            // 记录调试信息
            debugInfo[emotionType] = {
                totalCount: objectsOfType.length,
                absorbedCount: objectsOfType.filter(obj => obj.isAbsorbed).length,
                allAbsorbed: allAbsorbed
            };
            
            return allAbsorbed;
        });
        
        // 输出调试信息
        console.log('胜利判定调试信息:', debugInfo);
        console.log('胜利判定结果:', result);
        
        return result;
    }
    
    /**
     * 检查游戏是否失败
     * @param {Core} core - 内核对象
     * @returns {boolean} 是否失败
     */
    checkDefeat(core) {
        return core.getValue() <= 0;
    }
}