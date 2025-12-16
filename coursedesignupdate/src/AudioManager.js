/**
 * 音频管理器
 * 负责背景音乐的播放、控制和自动检测
 */
export default class AudioManager {
    constructor() {
        this.audio = null;
        this.musicFiles = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.volume = 0.5; // 默认音量设为50%
        this.musicDirectory = './music/'; // 音乐文件目录
        this.supportedFormats = ['.mp3', '.wav', '.ogg']; // 支持的音频格式
        this.retryCount = 0;
        this.maxRetries = 3;
    }
    
    /**
     * 初始化音频系统
     */
    async init() {
        try {
            // 创建音频对象
            this.audio = new Audio();
            
            // 设置音频属性
            this.audio.loop = false; // 我们手动实现循环播放，以便在曲目结束时切换
            this.audio.volume = this.volume;
            this.audio.preload = 'auto';
            
            // 尝试检测音乐文件
            await this.detectMusicFiles();
            
            // 如果检测到音乐文件，加载第一首
            if (this.musicFiles.length > 0) {
                this.loadTrack(0);
            } else {
                console.warn('未检测到音乐文件，背景音乐将不会播放');
            }
            
            // 添加音频事件监听器
            this.setupEventListeners();
            
            return true;
        } catch (error) {
            console.error('音频系统初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 自动检测音乐文件
     */
    async detectMusicFiles() {
        try {
            // 创建一个包含常见音乐文件名的数组
            const commonMusicNames = [
                'background', 'bgm', 'theme', 'music', 'ambient',
                'soundtrack', 'melody', 'track1', 'track2', 'track3'
            ];
            
            // 为每个常见名称和每种支持格式创建可能的文件路径
            const possibleFiles = [];
            for (const name of commonMusicNames) {
                for (const format of this.supportedFormats) {
                    possibleFiles.push(`${this.musicDirectory}${name}${format}`);
                }
            }
            
            // 尝试检测每个可能的文件
            for (const filePath of possibleFiles) {
                try {
                    const response = await fetch(filePath, { method: 'HEAD' });
                    if (response.ok) {
                        this.musicFiles.push(filePath);
                        console.log(`检测到音乐文件: ${filePath}`);
                    }
                } catch (error) {
                    // 文件不存在，继续尝试下一个
                    continue;
                }
            }
            
            // 如果没有检测到常见名称的文件，尝试直接扫描目录
            if (this.musicFiles.length === 0) {
                console.log('未检测到常见名称的音乐文件，尝试扫描目录...');
                // 注意：由于浏览器安全限制，无法直接扫描目录
                // 这里我们只能尝试一些常见的文件名
                const fallbackFiles = [
                    `${this.musicDirectory}1.mp3`,
                    `${this.musicDirectory}2.mp3`,
                    `${this.musicDirectory}3.mp3`,
                    `${this.musicDirectory}song.mp3`,
                    `${this.musicDirectory}audio.mp3`
                ];
                
                for (const filePath of fallbackFiles) {
                    try {
                        const response = await fetch(filePath, { method: 'HEAD' });
                        if (response.ok) {
                            this.musicFiles.push(filePath);
                            console.log(`检测到音乐文件: ${filePath}`);
                        }
                    } catch (error) {
                        continue;
                    }
                }
            }
            
            console.log(`总共检测到 ${this.musicFiles.length} 个音乐文件`);
        } catch (error) {
            console.error('音乐文件检测失败:', error);
        }
    }
    
    /**
     * 设置音频事件监听器
     */
    setupEventListeners() {
        // 音频结束事件 - 自动播放下一首或循环当前曲目
        this.audio.addEventListener('ended', () => {
            if (this.musicFiles.length > 1) {
                // 如果有多首曲目，播放下一首
                this.nextTrack();
            } else if (this.musicFiles.length === 1) {
                // 如果只有一首曲目，循环播放
                this.play();
            }
        });
        
        // 音频加载错误事件
        this.audio.addEventListener('error', (e) => {
            console.error('音频加载错误:', e);
            this.retryCount++;
            
            if (this.retryCount <= this.maxRetries) {
                console.log(`尝试重新加载音频 (${this.retryCount}/${this.maxRetries})`);
                setTimeout(() => {
                    this.loadTrack(this.currentTrackIndex);
                }, 1000 * this.retryCount); // 递增延迟重试
            } else {
                console.error('音频加载重试次数已达上限，跳过当前曲目');
                this.nextTrack();
            }
        });
        
        // 音频可以播放事件
        this.audio.addEventListener('canplaythrough', () => {
            this.retryCount = 0; // 重置重试计数
        });
    }
    
    /**
     * 加载指定索引的音轨
     * @param {number} index - 音轨索引
     */
    loadTrack(index) {
        if (this.musicFiles.length === 0 || index < 0 || index >= this.musicFiles.length) {
            console.error('无效的音轨索引');
            return;
        }
        
        this.currentTrackIndex = index;
        const trackPath = this.musicFiles[index];
        
        try {
            this.audio.src = trackPath;
            this.audio.load(); // 开始加载音频
            console.log(`加载音轨: ${trackPath}`);
        } catch (error) {
            console.error('音轨加载失败:', error);
        }
    }
    
    /**
     * 播放音乐
     */
    play() {
        if (!this.audio || this.musicFiles.length === 0) {
            console.warn('没有可播放的音乐');
            return;
        }
        
        // 使用用户交互来确保音频可以播放
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                console.log('音乐开始播放');
            }).catch(error => {
                console.error('音乐播放失败:', error);
                // 处理自动播放策略限制
                if (error.name === 'NotAllowedError') {
                    console.warn('浏览器阻止了自动播放，需要用户交互才能播放音乐');
                }
            });
        }
    }
    
    /**
     * 暂停音乐
     */
    pause() {
        if (!this.audio) return;
        
        this.audio.pause();
        this.isPlaying = false;
        console.log('音乐已暂停');
    }
    
    /**
     * 停止音乐
     */
    stop() {
        if (!this.audio) return;
        
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        console.log('音乐已停止');
    }
    
    /**
     * 播放下一首音轨
     */
    nextTrack() {
        if (this.musicFiles.length <= 1) return;
        
        const nextIndex = (this.currentTrackIndex + 1) % this.musicFiles.length;
        this.loadTrack(nextIndex);
        
        // 如果当前正在播放，加载后自动播放新音轨
        if (this.isPlaying) {
            this.play();
        }
    }
    
    /**
     * 播放上一首音轨
     */
    previousTrack() {
        if (this.musicFiles.length <= 1) return;
        
        const prevIndex = (this.currentTrackIndex - 1 + this.musicFiles.length) % this.musicFiles.length;
        this.loadTrack(prevIndex);
        
        // 如果当前正在播放，加载后自动播放新音轨
        if (this.isPlaying) {
            this.play();
        }
    }
    
    /**
     * 设置音量
     * @param {number} volume - 音量值 (0.0 - 1.0)
     */
    setVolume(volume) {
        if (volume < 0) volume = 0;
        if (volume > 1) volume = 1;
        
        this.volume = volume;
        if (this.audio) {
            this.audio.volume = volume;
        }
    }
    
    /**
     * 获取当前音量
     * @returns {number} 当前音量值
     */
    getVolume() {
        return this.volume;
    }
    
    /**
     * 切换播放/暂停状态
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    /**
     * 获取当前播放状态
     * @returns {boolean} 是否正在播放
     */
    isPlayingMusic() {
        return this.isPlaying;
    }
    
    /**
     * 获取当前音轨信息
     * @returns {Object} 包含音轨索引和路径的对象
     */
    getCurrentTrackInfo() {
        return {
            index: this.currentTrackIndex,
            path: this.musicFiles.length > 0 ? this.musicFiles[this.currentTrackIndex] : null,
            totalTracks: this.musicFiles.length
        };
    }
    
    /**
     * 获取所有音乐文件列表
     * @returns {Array} 音乐文件路径数组
     */
    getMusicFiles() {
        return [...this.musicFiles];
    }
}