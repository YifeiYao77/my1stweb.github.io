"use strict";

// 使用glMatrix对象直接访问函数，而不是解构赋值
const glMatrix = window.glMatrix;

var canvas;
var gl;
var fileInput;

var meshdata;
var mesh;

var points = [];
var colors = [];
var acolor = [];
var lineIndex = [];

var color;

var modelViewMatrix = glMatrix.mat4.create();
var projectionMatrix = glMatrix.mat4.create();

var vBuffer = null;
var vPosition = null;
var cBuffer = null;
var vColor = null;
var iBuffer = null;

var lineCnt = 0;

var oleft = -3.0;
var oright = 3.0;
var oytop = 3.0;
var oybottom = -3.0;
var onear = -5;
var ofar = 10;

var oradius = 3.0;
var theta = 0.0;
var phi = 0.0;

var pleft = -10.0;
var pright = 10.0;
var pytop = 10.0;
var pybottom = -10.0;
var pnear = 0.01;
var pfar = 20;
var pradius = 3.0;

var fovy = 45.0 * Math.PI/180.0;
var aspect;

/* dx, dy, dz: the position of object */
var dx = 0;
var dy = 0;
var dz = 0;
var step = 0.1;

var dxt = 0;
var dyt = 0;
var dzt = 0;
var stept = 2;

// scale
var sx = 1;
var sy = 1;
var sz = 1;

/* cx, cy, cz: the position of camera */
var cx = 0.0;
var cy = 0.0;
var cz = 4.0;
var stepc = 0.1;

var cxt = 0;
var cyt = 0;
var czt = 0;
var stepct = 2;

var mvMatrix = glMatrix.mat4.create();
var pMatrix = glMatrix.mat4.create();
var eye = glMatrix.vec3.fromValues(cx, cy, cz);

var at = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);
var up = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);

var rquat = glMatrix.quat.create();

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var currentKey = [];

/* variables for interface control */
var projectionType = 1; // default is Orthographic(1), Perspective(2)
var drawType = 1; // default is WireFrame(1), Solid(2)
var viewType = [0]; // default is orthographic frontview(1), leftView(2), topView(3), isoview(4)
var viewcnt = 0; // view count default = 0, in orthographic or perspective mode

var changePos = 1; // default is Object(1), camera(2)

var currentColor = glMatrix.vec4.create();

// Phong Lighting variables
var materialAmbient = glMatrix.vec3.fromValues(0.2, 0.2, 0.2); // Ka
var materialDiffuse = glMatrix.vec3.fromValues(0.8, 0.8, 0.8); // Kd
var materialSpecular = glMatrix.vec3.fromValues(1.0, 1.0, 1.0); // Ks
var materialShininess = 32.0; // Shininess

var lightPosition = glMatrix.vec3.fromValues(2.0, 2.0, 2.0);
var lightPositionView = glMatrix.vec3.create();
var lightAmbient = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
var lightDiffuse = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
var lightSpecular = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);

var normalMatrix = glMatrix.mat3.create();

var program = null;

function handleKeyDown(event) {
    var key = event.keyCode;
    currentKey[key] = true;
    if( changePos === 1 ){
        switch (key) {
            case 65: //left//a
                dx -= step;
                document.getElementById("xpos").value=dx;
                break;
            case 68: // right//d
                dx += step;
                document.getElementById("xpos").value=dx;
                break;
            case 87: // up//w
                dy += step;
                document.getElementById("ypos").value=dy;
                break;
            case 83: // down//s
                dy -= step;
                document.getElementById("ypos").value=dy;
                break;
            case 90: // a//z
                dz += step;
                document.getElementById("zpos").value=dz;
                break;
            case 88: // d//x
                dz -= step;
                document.getElementById("zpos").value=dz;
                break;
            case 72: // h//ytheta-
                dyt -= stept;
                document.getElementById("yrot").value=dyt;
                break;
            case 75: // k//ytheta+
                dyt += stept;
                document.getElementById("yrot").value = dyt;
                break;
            case 85: // u//xtheta+
                dxt -= stept;
                document.getElementById("xrot").value = dxt;
                break;
            case 74: // j//xtheta-
                dxt += stept;
                document.getElementById("xrot").value = dxt;
                break;
            case 78: // n//ztheta+
                dzt += stept;
                document.getElementById("zrot").value = dzt;
                break;
            case 77: // m//ztheta-
                dzt -= stept;
                document.getElementById("zrot").value = dzt;
                break;
            case 82: // r//reset
                dx = 0;
                dy = 0;
                dz = 0;
                dxt = 0;
                dyt = 0;
                dzt = 0;
                break;
        }
    }
    if( changePos === 2 ){
        switch (key) {
            case 65: //left//a
                cx -= stepc;
                document.getElementById("xpos").value = cx;
                break;
            case 68: // right//d
                cx += stepc;
                document.getElementById("xpos").value = cx;
                break;
            case 87: // up//w
                cy += stepc;
                document.getElementById("ypos").value = cy;
                break;
            case 83: // down//s
                cy -= stepc;
                document.getElementById("ypos").value = cy;
                break;
            case 90: // a//z
                cz += stepc;
                document.getElementById("zpos").value = cz;
                break;
            case 88: // d//x
                cz -= stepc;
                document.getElementById("zpos").value = cz;
                break;
            case 72: // h//ytheta-
                cyt -= stepct;
                document.getElementById("yrot").value = cyt;
                break;
            case 75: // k//ytheta+
                cyt += stepct;
                document.getElementById("yrot").value = cyt;
                break;
            case 85: // u//xtheta+
                cxt -= stepct;
                document.getElementById("xrot").value = cxt;
                break;
            case 74: // j//xtheta-
                cxt += stepct;
                document.getElementById("xrot").value = cxt;
                break;
            case 78: // n//ztheta+
                czt += stepct;
                document.getElementById("zrot").value = czt;
                break;
            case 77: // m//ztheta-
                czt -= stepct;
                document.getElementById("zrot").value = czt;
                break;
            case 82: // r//reset
                cx = 0;
                cy = 0;
                cz = 4;
                cxt = 0;
                cyt = 0;
                czt = 0;
                break;
        }
    }
    buildModelViewProj();
}

function handleKeyUp(event) {
    currentKey[event.keyCode] = false;
}

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown)
        return;

    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = (newX - lastMouseX);
    var d = deltaX;
    theta = theta - parseFloat(d);
    
    var deltaY = (newY - lastMouseY);
    d = deltaY;
    phi = phi - parseFloat(d);

    lastMouseX = newX;
    lastMouseY = newY;
    buildModelViewProj();
}

function checkInput(){
    var ptype = document.getElementById( "ortho" ).checked;
    if( ptype ) {
        projectionType = 1;
    }else{
        if( document.getElementById( "persp" ).checked )
            projectionType = 2;
    }

    var dtype = document.getElementById( "wire" ).checked;
    if( dtype ){
        drawType = 1;
    }else{
        if( document.getElementById( "solid" ).checked )
            drawType = 2;
    }

    var hexcolor = document.getElementById( "objcolor" ).value.substring(1);
    var rgbHex = hexcolor.match(/.{1,2}/g);
    currentColor = glMatrix.vec4.fromValues( 
        parseInt(rgbHex[0], 16)/255.0,
        parseInt(rgbHex[1], 16)/255.0,
        parseInt(rgbHex[2], 16)/255.0,
        1.0
    );
}

function restoreSliderValue(changePos){
    if (changePos === 1) {
        document.getElementById("xpos").value = dx;
        document.getElementById("ypos").value = dy;
        document.getElementById("zpos").value = dz;
        document.getElementById("xrot").value = Math.floor(dxt);
        document.getElementById("yrot").value = Math.floor(dyt);
        document.getElementById("zrot").value = Math.floor(dzt);
    }
    if (changePos === 2) {
        document.getElementById("xpos").value = cx;
        document.getElementById("ypos").value = cy;
        document.getElementById("zpos").value = cz;
        document.getElementById("xrot").value = Math.floor(cxt);
        document.getElementById("yrot").value = Math.floor(cyt);
        document.getElementById("zrot").value = Math.floor(czt);
    }
}

window.onload = function initWindow(){
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.clearColor(0.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    initInterface();

    checkInput();
}

function initBuffers(){
    vBuffer = gl.createBuffer();
    cBuffer = gl.createBuffer();
}

function initOrthoParamsEvents() {
    // 空函数，用于解决浏览器缓存导致的错误
}

function initInterface(){
    fileInput = document.getElementById("fileInput");
    fileInput.addEventListener("change", function (event) {
        var file = fileInput.files[0];
        var reader = new FileReader();

        reader.onload = function (event) {
            meshdata = reader.result;
            initObj();
        }
        reader.readAsText(file);
    });

    var projradios = document.getElementsByName("projtype");
    for (var i = 0; i < projradios.length; i++) {
        projradios[i].addEventListener("click", function (event) {
            var value = this.value;
            if (this.checked) {
                projectionType = parseInt(value);
            }
            buildModelViewProj();
        });
    }

    var drawradios = document.getElementsByName("drawtype");
    for (var i = 0; i < drawradios.length; i++) {
        drawradios[i].onclick = function () {
            var value = this.value;
            if (this.checked) {
                drawType = parseInt(value);
            }
            updateModelData();
        }
    }

    document.getElementById("objcolor").addEventListener("input", function (event) {
        var hexcolor = this.value.substring(1);
        var rgbHex = hexcolor.match(/.{1,2}/g);
        currentColor = glMatrix.vec4.fromValues(
            parseInt(rgbHex[0], 16) * 1.0 / 255.0,
            parseInt(rgbHex[1], 16) * 1.0 / 255.0,
            parseInt(rgbHex[2], 16) * 1.0 / 255.0,
            1.0
        );
        updateColor();
    });

    document.getElementById("xpos").addEventListener("input", function(event){
        if(changePos===1)
            dx = this.value;
        else if(changePos===2)
            cx = this.value;
        buildModelViewProj();
    });
    document.getElementById("ypos").addEventListener("input", function(event){
        if(changePos===1)
            dy = this.value;
        else if(changePos===2)
            cy = this.value;
        buildModelViewProj();
    });
    document.getElementById("zpos").addEventListener("input", function(event){
        if(changePos===1)
            dz = this.value;
        else if(changePos===2)
            cz = this.value;
        buildModelViewProj();
    });

    document.getElementById("xrot").addEventListener("input", function(event){
        if(changePos===1)
            dxt = this.value;
        else if(changePos===2)
            cxt = this.value;
        buildModelViewProj();
    });
    document.getElementById("yrot").addEventListener("input", function(event){
        if(changePos===1)
            dyt = this.value;
        else if(changePos===2)
            cyt = this.value;
        buildModelViewProj();
    });
    document.getElementById("zrot").addEventListener("input",function(event){
        if (changePos === 1)
            dzt = this.value;
        else if (changePos === 2)
            czt = this.value;
        buildModelViewProj();
    });

    var postypeRadio = document.getElementsByName("posgrp");
    for (var i = 0; i < postypeRadio.length; i++) {
        postypeRadio[i].addEventListener("click", function (event) {
            var value = this.value;
            if (this.checked) {
                changePos = parseInt(value);
                restoreSliderValue(changePos);
            }
        });
    }

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    
    // 材质属性调节事件处理
    document.getElementById("ka").addEventListener("input", function(event) {
        materialAmbient = glMatrix.vec3.fromValues(parseFloat(this.value), parseFloat(this.value), parseFloat(this.value));
        document.getElementById("kaValue").textContent = this.value;
        buildModelViewProj();
    });
    
    document.getElementById("kd").addEventListener("input", function(event) {
        materialDiffuse = glMatrix.vec3.fromValues(parseFloat(this.value), parseFloat(this.value), parseFloat(this.value));
        document.getElementById("kdValue").textContent = this.value;
        buildModelViewProj();
    });
    
    document.getElementById("ks").addEventListener("input", function(event) {
        materialSpecular = glMatrix.vec3.fromValues(parseFloat(this.value), parseFloat(this.value), parseFloat(this.value));
        document.getElementById("ksValue").textContent = this.value;
        buildModelViewProj();
    });
    
    document.getElementById("shininess").addEventListener("input", function(event) {
        materialShininess = parseFloat(this.value);
        document.getElementById("shininessValue").textContent = this.value;
        buildModelViewProj();
    });
    
    // 材质颜色配置事件处理
    document.getElementById("matR").addEventListener("input", function(event) {
        currentColor[0] = parseFloat(this.value);
        document.getElementById("matRValue").textContent = this.value;
        updateColor();
        buildModelViewProj();
    });
    
    document.getElementById("matG").addEventListener("input", function(event) {
        currentColor[1] = parseFloat(this.value);
        document.getElementById("matGValue").textContent = this.value;
        updateColor();
        buildModelViewProj();
    });
    
    document.getElementById("matB").addEventListener("input", function(event) {
        currentColor[2] = parseFloat(this.value);
        document.getElementById("matBValue").textContent = this.value;
        updateColor();
        buildModelViewProj();
    });
    
    // 光源位置控制事件处理
    document.getElementById("lightX").addEventListener("input", function(event) {
        lightPosition[0] = parseFloat(this.value);
        document.getElementById("lightXValue").textContent = this.value;
        buildModelViewProj();
    });
    
    document.getElementById("lightY").addEventListener("input", function(event) {
        lightPosition[1] = parseFloat(this.value);
        document.getElementById("lightYValue").textContent = this.value;
        buildModelViewProj();
    });
    
    document.getElementById("lightZ").addEventListener("input", function(event) {
        lightPosition[2] = parseFloat(this.value);
        document.getElementById("lightZValue").textContent = this.value;
        buildModelViewProj();
    });
    
    // 光源颜色配置事件处理
    document.getElementById("lightR").addEventListener("input", function(event) {
        lightDiffuse[0] = parseFloat(this.value);
        lightSpecular[0] = parseFloat(this.value);
        document.getElementById("lightRValue").textContent = this.value;
        buildModelViewProj();
    });
    
    document.getElementById("lightG").addEventListener("input", function(event) {
        lightDiffuse[1] = parseFloat(this.value);
        lightSpecular[1] = parseFloat(this.value);
        document.getElementById("lightGValue").textContent = this.value;
        buildModelViewProj();
    });
    
    document.getElementById("lightB").addEventListener("input", function(event) {
        lightDiffuse[2] = parseFloat(this.value);
        lightSpecular[2] = parseFloat(this.value);
        document.getElementById("lightBValue").textContent = this.value;
        buildModelViewProj();
    });
}

function buildMultiViewProj(type){
    if( type[0] === 0 )
        render();
    else
        rendermultiview();
}

function initObj(){
    mesh = new OBJ.Mesh( meshdata );
    // mesh.normalBuffer, mesh.textureBuffer, mesh.vertexBuffer, mesh.indexBuffer
    OBJ.initMeshBuffers( gl, mesh );

    // Set vertex position
    gl.bindBuffer( gl.ARRAY_BUFFER, mesh.vertexBuffer );
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    // Set vertex color
    var bcolor = [];
    for( var i=0; i<mesh.vertexBuffer.numItems; i++)
        bcolor.push( currentColor[0], currentColor[1], currentColor[2], currentColor[3] );

    if( cBuffer === null) 
        cBuffer = gl.createBuffer();

    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( bcolor ), gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    
    // Set vertex normal
    if (mesh.normalBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
        var vNormal = gl.getAttribLocation(program, "vNormal");
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);
    } else {
        // Generate default normals if not available in mesh
        generateDefaultNormals();
    }

    dx = -1.0 * (parseFloat(mesh.xmax) + parseFloat(mesh.xmin))/2.0;
    dy = -1.0 * (parseFloat(mesh.ymax) + parseFloat(mesh.ymin))/2.0;
    dz = -1.0 * (parseFloat(mesh.zmax) + parseFloat(mesh.zmin))/2.0;

    var maxScale;
    var scalex = Math.abs(parseFloat(mesh.xmax)-parseFloat(mesh.xmin));
    var scaley = Math.abs(parseFloat(mesh.ymax)-parseFloat(mesh.ymin));
    var scalez = Math.abs(parseFloat(mesh.zmax)-parseFloat(mesh.zmin));

    maxScale = Math.max(scalex, scaley, scalez);

    sx = 2.0/maxScale;
    sy = 2.0/maxScale;
    sz = 2.0/maxScale;

    updateModelData();
    buildModelViewProj();
    updateColor();

    render();
}

function generateDefaultNormals() {
    // Get vertex data
    var vertices = new Float32Array(mesh.vertexBuffer.numItems * 3);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, vertices);
    
    // Get indices data
    var indices = new Uint16Array(mesh.indexBuffer.numItems);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.getBufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, indices);
    
    // Initialize normals to zero
    var normals = new Float32Array(mesh.vertexBuffer.numItems * 3);
    
    // Calculate normals for each face
    for (var i = 0; i < indices.length; i += 3) {
        var i0 = indices[i] * 3;
        var i1 = indices[i+1] * 3;
        var i2 = indices[i+2] * 3;
        
        // Get vertices of the face
        var v0 = [vertices[i0], vertices[i0+1], vertices[i0+2]];
        var v1 = [vertices[i1], vertices[i1+1], vertices[i1+2]];
        var v2 = [vertices[i2], vertices[i2+1], vertices[i2+2]];
        
        // Calculate edges
        var e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        var e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
        
        // Calculate normal using cross product
        var normal = [
            e1[1] * e2[2] - e1[2] * e2[1],
            e1[2] * e2[0] - e1[0] * e2[2],
            e1[0] * e2[1] - e1[1] * e2[0]
        ];
        
        // Normalize the normal
        var length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
        if (length > 0) {
            normal[0] /= length;
            normal[1] /= length;
            normal[2] /= length;
        }
        
        // Add normal to each vertex of the face
        for (var j = 0; j < 3; j++) {
            normals[i0 + j] += normal[j];
            normals[i1 + j] += normal[j];
            normals[i2 + j] += normal[j];
        }
    }
    
    // Normalize all normals
    for (var i = 0; i < normals.length; i += 3) {
        var length = Math.sqrt(normals[i] * normals[i] + normals[i+1] * normals[i+1] + normals[i+2] * normals[i+2]);
        if (length > 0) {
            normals[i] /= length;
            normals[i+1] /= length;
            normals[i+2] /= length;
        }
    }
    
    // Create normal buffer
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    
    // Set normal attribute
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    // Store the normal buffer in the mesh object
    mesh.normalBuffer = normalBuffer;
}

function updateModelData(){
    if( vBuffer === null)
        vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vBuffer );
    lineIndex = [];
    for( var i = 0; i < mesh.indices.length; i+=3 ){
        lineIndex.push(mesh.indices[i], mesh.indices[i+1]);
        lineIndex.push(mesh.indices[i+1], mesh.indices[i + 2]);
        lineIndex.push(mesh.indices[i+2], mesh.indices[i]);
    }
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndex), gl.STATIC_DRAW );
}

function updateColor(){
    var bcolor = [];
    for (var i = 0; i < mesh.vertexBuffer.numItems; i++)
        //bcolor.push(Math.random(), Math.random(), Math.random(), 1.0);
        bcolor.push(currentColor[0], currentColor[1], currentColor[2], currentColor[3]);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bcolor), gl.STATIC_DRAW);

    vColor = gl.getAttribLocation(program, "vColor",);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    //gl.uniform4fv(gl.getUniformLocation(program, "fColor"), new Float32Array(bcolor));
}

function buildModelViewProj(){
    /* ModelViewMatrix & ProjectionMatrix */
    var localRadius;

    if( projectionType == 1 ){
        glMatrix.mat4.ortho( pMatrix, oleft, oright, oybottom, oytop, onear, ofar );
        localRadius = oradius;
    }else{
        aspect = canvas.width / canvas.height;
        glMatrix.mat4.perspective(pMatrix, fovy, aspect, pnear, pfar);
        localRadius = pradius;
    }
    
    // 使用相机位置参数
    glMatrix.vec3.set(eye, cx, cy, cz); 

    // 创建相机旋转矩阵
    var cameraRotationMatrix = glMatrix.mat4.create();
    glMatrix.mat4.rotateX(cameraRotationMatrix, cameraRotationMatrix, cxt * Math.PI / 180.0);
    glMatrix.mat4.rotateY(cameraRotationMatrix, cameraRotationMatrix, cyt * Math.PI / 180.0);
    glMatrix.mat4.rotateZ(cameraRotationMatrix, cameraRotationMatrix, czt * Math.PI / 180.0);

    // 计算相机指向
    var cameraDirection = glMatrix.vec3.create();
    glMatrix.vec3.set(cameraDirection, 0, 0, -1); // 默认向前
    glMatrix.vec3.transformMat4(cameraDirection, cameraDirection, cameraRotationMatrix);
    glMatrix.vec3.normalize(cameraDirection, cameraDirection);

    // 计算相机目标点
    var cameraTarget = glMatrix.vec3.create();
    glMatrix.vec3.scaleAndAdd(cameraTarget, eye, cameraDirection, localRadius);

    // 计算相机上方向
    var cameraUp = glMatrix.vec3.create();
    glMatrix.vec3.set(cameraUp, 0, 1, 0); // 默认向上
    glMatrix.vec3.transformMat4(cameraUp, cameraUp, cameraRotationMatrix);

    // 创建视图矩阵
    glMatrix.mat4.lookAt(mvMatrix, eye, cameraTarget, cameraUp);
	
	// 应用物体平移和旋转
	glMatrix.mat4.translate(mvMatrix, mvMatrix, glMatrix.vec3.fromValues(dx, dy, dz));
    glMatrix.vec3.transformMat4(lightPositionView, lightPosition, mvMatrix);
    glMatrix.mat4.rotateX(mvMatrix, mvMatrix, dxt * Math.PI / 180.0);
    glMatrix.mat4.rotateY(mvMatrix, mvMatrix, dyt * Math.PI / 180.0);
    glMatrix.mat4.rotateZ(mvMatrix, mvMatrix, dzt * Math.PI / 180.0);
    
    // 应用缩放
    glMatrix.mat4.scale(mvMatrix, mvMatrix, glMatrix.vec3.fromValues(sx, sy, sz));

    // Calculate normal matrix
    glMatrix.mat3.normalFromMat4(normalMatrix, mvMatrix);

    // Set matrices
    modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrix, false, new Float32Array(mvMatrix));
    projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrix, false, new Float32Array(pMatrix));
    var normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    gl.uniformMatrix3fv(normalMatrixLoc, false, new Float32Array(normalMatrix));
    
    // Set lighting parameters
    var lightPositionLoc = gl.getUniformLocation(program, "lightPosition");
    gl.uniform3fv(lightPositionLoc, new Float32Array(lightPosition));
    
    var lightAmbientLoc = gl.getUniformLocation(program, "lightAmbient");
    gl.uniform3fv(lightAmbientLoc, new Float32Array(lightAmbient));
    
    var lightDiffuseLoc = gl.getUniformLocation(program, "lightDiffuse");
    gl.uniform3fv(lightDiffuseLoc, new Float32Array(lightDiffuse));
    
    var lightSpecularLoc = gl.getUniformLocation(program, "lightSpecular");
    gl.uniform3fv(lightSpecularLoc, new Float32Array(lightSpecular));
    
    // Set material parameters
    var materialAmbientLoc = gl.getUniformLocation(program, "materialAmbient");
    gl.uniform3fv(materialAmbientLoc, new Float32Array(materialAmbient));
    
    var materialDiffuseLoc = gl.getUniformLocation(program, "materialDiffuse");
    gl.uniform3fv(materialDiffuseLoc, new Float32Array(materialDiffuse));
    
    var materialSpecularLoc = gl.getUniformLocation(program, "materialSpecular");
    gl.uniform3fv(materialSpecularLoc, new Float32Array(materialSpecular));
    
    var materialShininessLoc = gl.getUniformLocation(program, "materialShininess");
    gl.uniform1f(materialShininessLoc, materialShininess);
}

var interval = setInterval(timerFunc, 30);

function timerFunc() {
    render();
}

function render(){
    gl.viewport( 0, 0, canvas.width, canvas.height );
    aspect = canvas.width / canvas.height;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderType( drawType );
}

function renderType(type){
    if (type == 1) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vBuffer);
        gl.drawElements(gl.LINES, lineIndex.length, gl.UNSIGNED_SHORT, 0);
    } else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
}