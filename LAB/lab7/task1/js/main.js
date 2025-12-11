class Main {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.shaderManager = null;
        this.sphere = null;
        this.angle = 0;
    }

    // 初始化
    init() {
        this.canvas = document.getElementById('webgl-canvas');
        this.renderer = new Renderer(this.canvas);

        // 创建着色器管理器
        this.shaderManager = new ShaderManager(this.renderer.gl);
        this.renderer.setShaderManager(this.shaderManager);

        // 创建着色器程序
        this.createShaders();

        // 设置相机
        this.setupCamera();

        // 创建球体
        this.createSphere();

        // 设置灯光
        this.setupLights();

        // 开始渲染
        this.renderer.start();

        // 添加旋转动画
        this.animate();
    }

    // 创建着色器
    createShaders() {
        // 顶点着色器
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            
            uniform mat4 uModelMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat3 uNormalMatrix;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vec4 modelPosition = uModelMatrix * vec4(aPosition, 1.0);
                vec4 viewPosition = uViewMatrix * modelPosition;
                
                vNormal = uNormalMatrix * aNormal;
                vPosition = vec3(modelPosition);
                
                gl_Position = uProjectionMatrix * viewPosition;
            }
        `;

        // 片元着色器（Phong光照模型）
        const fragmentShaderSource = `
            precision mediump float;
            
            uniform vec3 uAmbientColor;
            uniform float uAmbientIntensity;
            uniform vec3 uDiffuseColor;
            uniform float uDiffuseCoefficient;
            uniform vec3 uSpecularColor;
            uniform float uSpecularCoefficient;
            uniform float uShininess;
            uniform vec3 uLightPosition;
            uniform vec3 uViewPosition;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                // 归一化法线
                vec3 normal = normalize(vNormal);
                
                // 计算光照方向
                vec3 lightDir = normalize(uLightPosition - vPosition);
                
                // 环境光分量
                vec3 ambient = uAmbientColor * uAmbientIntensity;
                
                // 漫反射分量
                float diff = max(dot(normal, lightDir), 0.0);
                vec3 diffuse = uDiffuseColor * uDiffuseCoefficient * diff;
                
                // 高光分量
                vec3 viewDir = normalize(uViewPosition - vPosition);
                vec3 reflectDir = reflect(-lightDir, normal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
                vec3 specular = uSpecularColor * uSpecularCoefficient * spec;
                
                // 最终颜色
                vec3 finalColor = ambient + diffuse + specular;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        // 创建着色器程序
        this.shaderManager.createProgram('phong', vertexShaderSource, fragmentShaderSource);
    }

    // 设置相机
    setupCamera() {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        const camera = new Camera(
            45, // 视野角度
            aspect, // 宽高比
            0.1, // 近平面
            100.0, // 远平面
            new Vector3(3, 3, 3), // 相机位置
            new Vector3(0, 0, 0), // 观察点
            new Vector3(0, 1, 0) // 上方向
        );
        this.renderer.setCamera(camera);
    }

    // 创建球体
    createSphere() {
        // 设置递归深度，控制球体的细分程度
        // 深度值越大，球体越光滑，但性能开销也越大
        // 建议值：2-5
        const recursionDepth = 3;
        
        this.sphere = new RecursiveSphere(recursionDepth);
        this.renderer.addObject(this.sphere);
    }

    // 设置灯光
    setupLights() {
        // 创建点光源
        const light = new Light(
            'point', // 光源类型
            new Vector3(5, 5, 5), // 光源位置
            new Vector3(1, 1, 1), // 光源颜色
            1.0 // 光源强度
        );
        this.renderer.addLight(light);
    }

    // 动画循环
    animate() {
        const animate = () => {
            // 旋转球体
            this.angle += 0.005;
            this.sphere.rotate(0, this.angle, 0);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    const main = new Main();
    main.init();
});