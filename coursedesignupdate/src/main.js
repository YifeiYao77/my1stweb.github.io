import * as THREE from 'three';
import Game from './Game.js';

/**
 * 游戏入口点
 */
async function init() {
    console.log('开始初始化游戏...');
    
    // 创建游戏实例
    const game = new Game();
    
    // 初始化游戏
    try {
        await game.init();
        console.log('游戏初始化成功');
        
        // 开始游戏循环
        game.start();
        console.log('游戏循环已启动');
        
        // 显示欢迎消息
        console.log('情绪控制游戏已启动！');
    } catch (error) {
        console.error('游戏初始化失败:', error);
    }
}

/**
 * 设置预加载页面
 */
function setupPreloader() {
    const preloader = document.getElementById('preloader');
    
    // 添加空格键事件监听
    const handleKeyDown = (event) => {
        if (event.code === 'Space') {
            // 隐藏预加载页面
            preloader.style.display = 'none';
            
            // 移除事件监听
            window.removeEventListener('keydown', handleKeyDown);
            
            // 启动游戏
            init();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
}

// 设置预加载页面
setupPreloader();

// 预加载页面显示时，游戏不会自动启动，需要等待用户按空格键