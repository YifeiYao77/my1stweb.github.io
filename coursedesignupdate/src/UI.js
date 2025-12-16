/**
 * UI管理器
 * 负责更新游戏界面显示和状态
 */
export default class UI {
    constructor() {
        this.coreValueElement = document.getElementById('core-value');
        this.gameStatusElement = document.getElementById('game-status');
        this.lastMessage = '';
        this.messageTimer = 0;
        this.messageDuration = 300; // 消息显示时间（毫秒）
    }
    
    /**
     * 更新内核数值显示
     * @param {number} value - 内核数值
     */
    updateCoreValue(value) {
        this.coreValueElement.textContent = `内核数值: ${value}`;
        
        // 根据数值改变颜色
        if (value <= 0) {
            this.coreValueElement.style.color = '#f44336'; // 红色
        } else if (value < 20) {
            this.coreValueElement.style.color = '#ff9800'; // 橙色
        } else if (value < 50) {
            this.coreValueElement.style.color = '#ffeb3b'; // 黄色
        } else {
            this.coreValueElement.style.color = '#4caf50'; // 绿色
        }
    }
    
    /**
     * 更新游戏状态显示
     * @param {string} status - 游戏状态
     */
    updateGameStatus(status) {
        this.gameStatusElement.textContent = this.getStatusText(status);
        
        // 移除所有状态类
        this.gameStatusElement.classList.remove('status-playing', 'status-success', 'status-failed');
        
        // 添加对应的状态类
        switch (status) {
            case 'playing':
                this.gameStatusElement.classList.add('status-playing');
                break;
            case 'success':
                this.gameStatusElement.classList.add('status-success');
                break;
            case 'failed':
                this.gameStatusElement.classList.add('status-failed');
                break;
        }
    }
    
    /**
     * 获取状态文本
     * @param {string} status - 游戏状态
     * @returns {string} 状态文本
     */
    getStatusText(status) {
        switch (status) {
            case 'playing':
                return '游戏进行中';
            case 'success':
                return '游戏成功';
            case 'failed':
                return '游戏失败';
            default:
                return '未知状态';
        }
    }
    
    /**
     * 显示临时消息
     * @param {string} message - 消息内容
     * @param {number} duration - 显示持续时间（毫秒）
     */
    showMessage(message, duration = this.messageDuration) {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.position = 'absolute';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        messageElement.style.color = 'white';
        messageElement.style.padding = '20px';
        messageElement.style.borderRadius = '10px';
        messageElement.style.fontSize = '24px';
        messageElement.style.zIndex = '1000';
        messageElement.style.transition = 'opacity 0.3s';
        
        // 添加到页面
        document.body.appendChild(messageElement);
        
        // 设置定时器移除消息
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * 显示游戏结果
     * @param {string} result - 游戏结果
     * @param {string} message - 结果消息
     */
    showGameResult(result, message) {
        // 创建结果弹窗
        const resultElement = document.createElement('div');
        resultElement.style.position = 'absolute';
        resultElement.style.top = '50%';
        resultElement.style.left = '50%';
        resultElement.style.transform = 'translate(-50%, -50%)';
        resultElement.style.backgroundColor = result === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)';
        resultElement.style.color = 'white';
        resultElement.style.padding = '30px';
        resultElement.style.borderRadius = '15px';
        resultElement.style.fontSize = '28px';
        resultElement.style.textAlign = 'center';
        resultElement.style.zIndex = '1000';
        resultElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        
        // 添加标题
        const titleElement = document.createElement('h2');
        titleElement.textContent = result === 'success' ? '游戏成功！' : '游戏失败！';
        titleElement.style.margin = '0 0 15px 0';
        resultElement.appendChild(titleElement);
        
        // 添加消息
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.style.margin = '0 0 20px 0';
        resultElement.appendChild(messageElement);
        
        // 添加重新开始按钮
        const restartButton = document.createElement('button');
        restartButton.textContent = '重新开始';
        restartButton.style.backgroundColor = 'white';
        restartButton.style.color = result === 'success' ? '#4caf50' : '#f44336';
        restartButton.style.border = 'none';
        restartButton.style.padding = '10px 20px';
        restartButton.style.borderRadius = '5px';
        restartButton.style.fontSize = '18px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.transition = 'background-color 0.3s';
        
        // 添加按钮悬停效果
        restartButton.addEventListener('mouseenter', () => {
            restartButton.style.backgroundColor = '#f0f0f0';
        });
        
        restartButton.addEventListener('mouseleave', () => {
            restartButton.style.backgroundColor = 'white';
        });
        
        // 添加按钮点击事件
        restartButton.addEventListener('click', () => {
            // 触发自定义事件，通知游戏重新开始
            const event = new CustomEvent('restartGame');
            document.dispatchEvent(event);
            
            // 移除结果弹窗
            if (resultElement.parentNode) {
                resultElement.parentNode.removeChild(resultElement);
            }
        });
        
        resultElement.appendChild(restartButton);
        
        // 添加到页面
        document.body.appendChild(resultElement);
    }
    
    /**
     * 更新特殊状态显示
     * @param {boolean} isSlowdown - 是否处于减速状态
     * @param {boolean} isAnxiety - 是否处于焦虑状态
     */
    updateSpecialStatus(isSlowdown, isAnxiety) {
        // 移除旧的状态指示器
        const oldIndicators = document.querySelectorAll('.status-indicator');
        oldIndicators.forEach(indicator => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        });
        
        // 创建新的状态指示器
        if (isSlowdown || isAnxiety) {
            const statusContainer = document.createElement('div');
            statusContainer.className = 'status-indicator';
            statusContainer.style.position = 'absolute';
            statusContainer.style.top = '120px';
            statusContainer.style.right = '20px';
            statusContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            statusContainer.style.color = 'white';
            statusContainer.style.padding = '10px';
            statusContainer.style.borderRadius = '5px';
            statusContainer.style.fontSize = '14px';
            statusContainer.style.zIndex = '100';
            
            if (isSlowdown) {
                const slowdownText = document.createElement('div');
                slowdownText.textContent = '减速状态';
                slowdownText.style.color = '#ff9800';
                slowdownText.style.marginBottom = '5px';
                statusContainer.appendChild(slowdownText);
            }
            
            if (isAnxiety) {
                const anxietyText = document.createElement('div');
                anxietyText.textContent = '焦虑状态（仅可同化碎片）';
                anxietyText.style.color = '#9c27b0';
                statusContainer.appendChild(anxietyText);
            }
            
            document.body.appendChild(statusContainer);
        }
    }
}