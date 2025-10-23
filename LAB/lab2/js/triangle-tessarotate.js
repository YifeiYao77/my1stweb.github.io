"use strict";

const { vec3 } = glMatrix;

var canvas;
var gl;

var points = [];

/** Parameters */
var numTimesToSubdivide = 3;
var theta = 0;
var twist = false;
var radius = 1.0;

// 页面加载后绑定事件
window.addEventListener("load", function(){
    initTriangles();                          
    document.getElementById("drawBtn").onclick = redraw;
    document.getElementById("levelInput").addEventListener("keyup", function(e){
        if(e.key === "Enter") redraw();       
    });
    document.getElementById("thetaInput").addEventListener("keyup", function(e){
        if(e.key === "Enter") redraw();       // 回车也触发角度刷新
    });
});

function redraw(){
    // 从输入框读取数值
    numTimesToSubdivide = parseInt(document.getElementById("levelInput").value);
    theta = parseFloat(document.getElementById("thetaInput").value);

    // 防错处理
    if(isNaN(numTimesToSubdivide)) numTimesToSubdivide = 0;
    if(isNaN(theta)) theta = 0;
    numTimesToSubdivide = Math.max(0, Math.min(7, numTimesToSubdivide));

    //  每次重绘前清空旧数据
    points = [];
    initTriangles();
}

// === 初始化绘制 ===
function initTriangles() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL 2.0 isn't available");
        return;
    }

    points = [];

    // 三角形三个顶点
    var vertices = [
        radius * Math.cos(90 * Math.PI / 180.0), radius * Math.sin(90 * Math.PI / 180.0),  0,
        radius * Math.cos(210 * Math.PI / 180.0), radius * Math.sin(210 * Math.PI / 180.0),  0,
        radius * Math.cos(-30 * Math.PI / 180.0), radius * Math.sin(-30 * Math.PI / 180.0),  0
    ];

    var u = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
    var v = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
    var w = vec3.fromValues(vertices[6], vertices[7], vertices[8]);

    divideTriangle(u, v, w, numTimesToSubdivide);

    // WebGL 配置
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // 将顶点数据传入 GPU
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    renderTriangles();
};

// === 核心：旋转部分 ===
function tessellaTriangle(a, b, c) {
    // 注意：正角为顺时针 → 加负号
    var radian = -theta * Math.PI / 180.0;

    function rotateZ(p) {
        return vec3.fromValues(
            p[0] * Math.cos(radian) - p[1] * Math.sin(radian),
            p[0] * Math.sin(radian) + p[1] * Math.cos(radian),
            0
        );
    }

    var a_new = rotateZ(a);
    var b_new = rotateZ(b);
    var c_new = rotateZ(c);

    // 绘制三角形边线
    points.push(a_new[0], a_new[1], a_new[2]);
    points.push(b_new[0], b_new[1], b_new[2]);

    points.push(b_new[0], b_new[1], b_new[2]);
    points.push(c_new[0], c_new[1], c_new[2]);

    points.push(c_new[0], c_new[1], c_new[2]);
    points.push(a_new[0], a_new[1], a_new[2]);
}

function divideTriangle(a, b, c, count){
	if(count == 0){
		tessellaTriangle(a, b, c);
	}else{
		var ab = vec3.create();
		vec3.lerp(ab, a, b, 0.5);
		var bc = vec3.create();
		vec3.lerp(bc, b, c, 0.5);
		var ca = vec3.create();
		vec3.lerp(ca, c, a, 0.5);

		divideTriangle(a, ab, ca, count-1);
		divideTriangle(ab, b, bc, count-1);
        divideTriangle(ca, bc, c, count-1);
        divideTriangle(ab, bc, ca, count-1);
	}
}

function renderTriangles(){
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.LINES, 0, points.length / 3);
}
