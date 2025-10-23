// 所有变换控制实时生效，无需切换
let gl;
let program;
// 变换状态变量（存储当前参数）
let transformState = {
    translate: { x: 0, y: 0 },
    rotateZ: 0, // 弧度
    scale: { x: 1, y: 1 }
};

function main() {
    // 初始化WebGL
    const canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert('WebGL不可用'); }

    // 初始化着色器
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.clearColor(0.9, 0.9, 0.9, 1.0); // 浅灰背景

    const vertices = new Float32Array([
        // 1. 左上小正方形（红色）
        // 位置              颜色(R,G,B,A)
        -0.2,  0.2,    1.0,0.7,0.7, 1.0,  // 左上顶点
        -0.2,  0.0,    1.0,0.7,0.7, 1.0,  // 左下顶点
         0.0,  0.2,    1.0,0.7,0.7, 1.0,  // 右上顶点
         0.0,  0.2,    1.0,0.7,0.7, 1.0,  // 右上顶点（重复用于第二个三角形）
        -0.2,  0.0,    1.0,0.7,0.7, 1.0,  // 左下顶点
         0.0,  0.0,    1.0,0.0,0.0, 1.0,  // 右下顶点

        // 2. 右上小正方形（绿色）
        0.0,  0.2,     0.6,0.9,0.8, 1.0,
        0.0,  0.0,     0.6,0.9,0.8, 1.0,
        0.2,  0.2,     0.2,0.9,0.8, 1.0,
        0.2,  0.2,     0.2,0.9,0.8, 1.0,
        0.0,  0.0,     0.6,0.9,0.8, 1.0,
        0.2,  0.0,     0.6,0.9,0.8, 1.0,

        // 3. 左下小正方形（蓝色）
        -0.2,  0.0,    0.0, 0.0, 1.0, 1.0,
        -0.2, -0.2,    0.0, 0.0, 1.0, 1.0,
         0.0,  0.0,    0.0, 0.0, 1.0, 1.0,
         0.0,  0.0,    0.0, 0.0, 1.0, 1.0,
        -0.2, -0.2,    0.0, 0.0, 1.0, 1.0,
         0.0, -0.2,    0.0, 0.0, 1.0, 1.0,

        // 4. 右下小正方形（黄色）
        0.0,   0.0,    1.0, 1.0, 0.0, 1.0,
        0.0,  -0.2,    1.0, 1.0, 0.0, 1.0,
        0.2,   0.0,    1.0, 1.0, 0.0, 1.0,
        0.2,   0.0,    1.0, 1.0, 0.0, 1.0,
        0.0,  -0.2,    1.0, 1.0, 0.0, 1.0,
        0.2,  -0.2,    1.0, 1.0, 0.0, 1.0
    ]);
    // 创建缓冲区并传入数据
    const bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // 绑定顶点位置和颜色属性
    // --------------------------
    const FSIZE = vertices.BYTES_PER_ELEMENT; // 每个元素占4字节
    // 1. 绑定位置属性（a_Position）
    const a_Position = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);
    // 2. 绑定颜色属性（a_Color）
    const a_Color = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * 6, FSIZE * 2);
    gl.enableVertexAttribArray(a_Color);

    // 获取着色器中变换参数的uniform地址
    const u_Translate = gl.getUniformLocation(program, "u_Translate");
    const u_RotateZ = gl.getUniformLocation(program, "u_RotateZ");
    const u_Scale = gl.getUniformLocation(program, "u_Scale");

    // --------------------------
    // 平移控制逻辑（直接生效）
    // --------------------------
    const txSlider = document.getElementById('tx');
    const tySlider = document.getElementById('ty');
    txSlider.oninput = function() {
        transformState.translate.x = parseFloat(this.value);
        document.getElementById('txValue').textContent = this.value;
    };
    tySlider.oninput = function() {
        transformState.translate.y = parseFloat(this.value);
        document.getElementById('tyValue').textContent = this.value;
    };

    // --------------------------
    // 旋转控制逻辑（直接生效）
    // --------------------------
    const rotateSlider = document.getElementById('rotateZ');
    rotateSlider.oninput = function() {
        const degrees = parseFloat(this.value);
        transformState.rotateZ = degrees * Math.PI / 180; // 转为弧度
        document.getElementById('rotateValue').textContent = degrees + '°';
    };

    // --------------------------
    // 缩放控制逻辑（直接生效）
    // --------------------------
    const scaleAxis = document.getElementById('scaleAxis');
    const scaleSlider = document.getElementById('scaleValue');
    scaleSlider.oninput = function() {
        const value = parseFloat(this.value);
        document.getElementById('scaleNum').textContent = value;
        // 根据选择的轴更新缩放值
        switch(scaleAxis.value) {
            case 'all': transformState.scale = { x: value, y: value }; break;
            case 'x': transformState.scale.x = value; break;
            case 'y': transformState.scale.y = value; break;
        }
    };
    // 轴切换时同步更新
    scaleAxis.onchange = function() {
        scaleSlider.oninput();
    };

     // 绘制时修改顶点数量（24个顶点）
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        // 传递变换参数（原有代码不变）
        gl.uniform2f(u_Translate, transformState.translate.x, transformState.translate.y);
        gl.uniform1f(u_RotateZ, transformState.rotateZ);
        gl.uniform2f(u_Scale, transformState.scale.x, transformState.scale.y);
        // 绘制24个顶点（4个小正方形，每个6个顶点）
        gl.drawArrays(gl.TRIANGLES, 0, 24); 
        requestAnimFrame(render);
    }
    render();
}

// 页面加载后初始化
window.onload = main;