document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('solarSystem');
    if (!canvas) {
        console.error('未找到canvas元素');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('无法获取2D上下文');
        return;
    }

    // 画布尺寸
    canvas.width = 800;
    canvas.height = 800;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 动画控制变量
    let animationId = null;
    let isPaused = false;
    let time = 0;

    // 太阳系数据
    const solarSystemData = {
        sun: {
            radius: 30,
            color: '#ffcc00',
            rotationSpeed: 0.005
        },
        planets: [
            {
                name: '水星',
                radius: 4,
                color: '#a6a6a6',
                distance: 70,
                speed: 0.012,
                rotation: 0.008,
                moons: []
            },
            {
                name: '金星',
                radius: 7,
                color: '#ffaa88',
                distance: 105,
                speed: 0.009,
                rotation: -0.003,
                moons: []
            },
            {
                name: '地球',
                radius: 8,
                color: '#3366ff',
                distance: 147,
                speed: 0.008,
                rotation: 0.02,
                moons: [
                    {
                        radius: 2,
                        color: '#cccccc',
                        distance: 15,
                        speed: 0.04
                    }
                ]
            },
            {
                name: '火星',
                radius: 6,
                color: '#cc3333',
                distance: 189,
                speed: 0.007,
                rotation: 0.019,
                moons: [
                    { radius: 1.2, color: '#aaaaaa', distance: 10, speed: 0.05 },
                    { radius: 1, color: '#999999', distance: 14, speed: 0.03 }
                ]
            },
            {
                name: '木星',
                radius: 15,
                color: '#ffcc99',
                distance: 266,
                speed: 0.004,
                rotation: 0.04,
                moons: [
                    { radius: 3, color: '#dddddd', distance: 25, speed: 0.03 },
                    { radius: 2.5, color: '#eeeeee', distance: 35, speed: 0.02 },
                    { radius: 2, color: '#dddddd', distance: 45, speed: 0.015 }
                ]
            },
            {
                name: '土星',
                radius: 13,
                color: '#ffddaa',
                distance: 350,
                speed: 0.003,
                rotation: 0.038,
                moons: []
            },
            {
                name: '天王星',
                radius: 10,
                color: '#99ccff',
                distance: 420,
                speed: 0.002,
                rotation: 0.03,
                moons: []
            },
            {
                name: '海王星',
                radius: 9,
                color: '#3366cc',
                distance: 476,
                speed: 0.0015,
                rotation: 0.032,
                moons: []
            }
        ]
    };

    // 绘制天体函数
    function drawCelestialBody(x, y, radius, color) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    // 绘制轨道函数 - 纯白色轨道
    function drawOrbit(radius) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    // 绘制行星标签
    function drawPlanetLabel(name, x, y) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(name, x, y);
    }

    // 绘制太阳
    function drawSun() {
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // 太阳自身旋转
        ctx.rotate(solarSystemData.sun.rotationSpeed * time);
        
        // 绘制太阳
        drawCelestialBody(0, 0, solarSystemData.sun.radius, solarSystemData.sun.color);
        
        // 太阳光芒效果
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            ctx.moveTo(0, -solarSystemData.sun.radius);
            ctx.lineTo(0, -solarSystemData.sun.radius - 10);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    // 绘制行星及其卫星
    function drawPlanets() {
        // 先绘制所有轨道
        solarSystemData.planets.forEach(planet => {
            drawOrbit(planet.distance);
        });
        
        // 再绘制行星
        solarSystemData.planets.forEach(planet => {
            // 计算行星角度
            const angle = planet.speed * time;
            
            // 计算行星位置
            const planetX = centerX + Math.cos(angle) * planet.distance;
            const planetY = centerY + Math.sin(angle) * planet.distance;
            
            // 绘制行星
            ctx.save();
            ctx.translate(planetX, planetY);
            ctx.rotate(planet.rotation * time); // 行星自身旋转
            drawCelestialBody(0, 0, planet.radius, planet.color);
            ctx.restore();
            
            // 关键修改：计算标签位置，始终显示在行星的"右侧"（相对于行星自身前进方向）
            // 使用行星公转角度计算右侧方向
            const labelAngle = angle; // 标签在行星的正右方
            const labelDistance = planet.radius + 5; // 距离行星边缘5px
            
            // 计算标签坐标
            const textX = planetX + Math.cos(labelAngle) * labelDistance;
            const textY = planetY + Math.sin(labelAngle) * labelDistance + 4; // +4是为了文字垂直居中
            
            // 绘制标签
            drawPlanetLabel(planet.name, textX, textY);
            
            // 绘制卫星
            planet.moons.forEach(moon => {
                const moonAngle = moon.speed * time;
                const moonX = planetX + Math.cos(angle + moonAngle) * moon.distance;
                const moonY = planetY + Math.sin(angle + moonAngle) * moon.distance;
                drawCelestialBody(moonX, moonY, moon.radius, moon.color);
            });
        });
    }

    // 动画循环
    function animate() {
        if (!isPaused) {
            time += 1;
        }
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制太阳
        drawSun();
        
        // 绘制行星和轨道
        drawPlanets();
        
        // 继续动画循环
        animationId = requestAnimationFrame(animate);
    }

    // 点击画布暂停/继续动画
    canvas.addEventListener('click', () => {
        isPaused = !isPaused;
    });

    // 开始动画
    animate();
});