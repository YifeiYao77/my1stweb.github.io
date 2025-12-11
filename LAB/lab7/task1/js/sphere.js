class RecursiveSphere {
    constructor(recursionDepth = 3) {
        this.recursionDepth = recursionDepth;
        this.vertices = [];
        this.normals = [];
        this.indices = [];
        this.vertexBuffer = null;
        this.normalBuffer = null;
        this.indexBuffer = null;
        this.modelMatrix = Matrix4.identity();
        
        this.createSphere();
    }

    // 创建正四面体作为初始形状
    createTetrahedron() {
        const tetrahedronVertices = [
            new Vector3(1, 1, 1),
            new Vector3(-1, -1, 1),
            new Vector3(-1, 1, -1),
            new Vector3(1, -1, -1)
        ];

        // 将顶点归一化到单位球面
        tetrahedronVertices.forEach(vertex => vertex.normalize());

        // 正四面体的四个三角形面
        const faces = [
            [0, 1, 2],
            [0, 2, 3],
            [0, 3, 1],
            [1, 3, 2]
        ];

        return { vertices: tetrahedronVertices, faces: faces };
    }

    // 递归细分三角形
    subdivide(vertices, faces, depth) {
        if (depth <= 0) {
            return { vertices, faces };
        }

        const newVertices = [...vertices];
        const newFaces = [];
        const edgeMidpoints = new Map();

        // 函数：获取边的中点，如果不存在则创建
        const getMidpoint = (v1, v2) => {
            const edgeKey = `${Math.min(v1, v2)}-${Math.max(v1, v2)}`;
            
            if (edgeMidpoints.has(edgeKey)) {
                return edgeMidpoints.get(edgeKey);
            }

            const midpoint = Vector3.add(vertices[v1], vertices[v2]);
            midpoint.normalize();
            
            const index = newVertices.length;
            newVertices.push(midpoint);
            edgeMidpoints.set(edgeKey, index);
            
            return index;
        };

        // 细分每个三角形
        faces.forEach(face => {
            const [a, b, c] = face;
            
            // 计算边的中点
            const ab = getMidpoint(a, b);
            const bc = getMidpoint(b, c);
            const ca = getMidpoint(c, a);
            
            // 创建四个新的三角形
            newFaces.push([a, ab, ca]);
            newFaces.push([b, bc, ab]);
            newFaces.push([c, ca, bc]);
            newFaces.push([ab, bc, ca]);
        });

        return this.subdivide(newVertices, newFaces, depth - 1);
    }

    // 创建球体
    createSphere() {
        const tetrahedron = this.createTetrahedron();
        const { vertices, faces } = this.subdivide(tetrahedron.vertices, tetrahedron.faces, this.recursionDepth);

        // 转换为扁平化的数组
        vertices.forEach(vertex => {
            this.vertices.push(vertex.x, vertex.y, vertex.z);
            this.normals.push(vertex.x, vertex.y, vertex.z); // 顶点与法向量相同
        });

        // 展平索引数组
        faces.forEach(face => {
            this.indices.push(face[0], face[1], face[2]);
        });
    }

    // 初始化WebGL缓冲区
    initializeBuffers(gl) {
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    // 设置模型矩阵
    setModelMatrix(matrix) {
        this.modelMatrix = matrix;
    }

    // 渲染球体
    render(gl, shaderManager, camera, lights) {
        if (!this.vertexBuffer || !this.normalBuffer || !this.indexBuffer) {
            this.initializeBuffers(gl);
        }

        // 使用着色器程序
        const program = shaderManager.useProgram('phong');
        if (!program) return;

        // 获取属性位置
        const positionAttribLocation = shaderManager.getAttribLocation('phong', 'aPosition');
        const normalAttribLocation = shaderManager.getAttribLocation('phong', 'aNormal');

        // 启用属性
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.enableVertexAttribArray(normalAttribLocation);

        // 绑定顶点缓冲
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 0, 0);

        // 绑定法向量缓冲
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(normalAttribLocation, 3, gl.FLOAT, false, 0, 0);

        // 绑定索引缓冲
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // 设置矩阵
        const modelMatrix = this.modelMatrix;
        const viewMatrix = camera.getViewMatrix();
        const projectionMatrix = camera.getProjectionMatrix();
        const modelViewMatrix = viewMatrix.multiply(modelMatrix);
        const normalMatrix = this.getNormalMatrix(modelViewMatrix);

        // 获取uniform位置
        const modelUniform = shaderManager.getUniformLocation('phong', 'uModelMatrix');
        const viewUniform = shaderManager.getUniformLocation('phong', 'uViewMatrix');
        const projectionUniform = shaderManager.getUniformLocation('phong', 'uProjectionMatrix');
        const normalMatrixUniform = shaderManager.getUniformLocation('phong', 'uNormalMatrix');

        // 设置uniform
        gl.uniformMatrix4fv(modelUniform, false, modelMatrix.getValues());
        gl.uniformMatrix4fv(viewUniform, false, viewMatrix.getValues());
        gl.uniformMatrix4fv(projectionUniform, false, projectionMatrix.getValues());
        gl.uniformMatrix3fv(normalMatrixUniform, false, normalMatrix);

        // 设置光照参数
        this.setupLighting(gl, shaderManager, camera, lights);

        // 绘制
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

        // 禁用属性
        gl.disableVertexAttribArray(positionAttribLocation);
        gl.disableVertexAttribArray(normalAttribLocation);

        // 解绑缓冲
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    // 设置光照
    setupLighting(gl, shaderManager, camera, lights) {
        // 环境光参数
        const ambientColor = [0.1, 0.1, 0.1]; // 环境光颜色
        const ambientIntensity = 0.2; // 环境光强度
        
        // 漫反射参数
        const diffuseColor = [0.8, 0.8, 0.8]; // 漫反射颜色
        const diffuseCoefficient = 0.8; // 漫反射系数
        
        // 高光参数
        const specularColor = [1.0, 1.0, 1.0]; // 高光颜色
        const specularCoefficient = 1.0; // 高光系数
        const shininess = 32.0; // 高光shininess值

        // 获取uniform位置
        const ambientColorUniform = shaderManager.getUniformLocation('phong', 'uAmbientColor');
        const ambientIntensityUniform = shaderManager.getUniformLocation('phong', 'uAmbientIntensity');
        const diffuseColorUniform = shaderManager.getUniformLocation('phong', 'uDiffuseColor');
        const diffuseCoefficientUniform = shaderManager.getUniformLocation('phong', 'uDiffuseCoefficient');
        const specularColorUniform = shaderManager.getUniformLocation('phong', 'uSpecularColor');
        const specularCoefficientUniform = shaderManager.getUniformLocation('phong', 'uSpecularCoefficient');
        const shininessUniform = shaderManager.getUniformLocation('phong', 'uShininess');
        const lightPositionUniform = shaderManager.getUniformLocation('phong', 'uLightPosition');
        const viewPositionUniform = shaderManager.getUniformLocation('phong', 'uViewPosition');

        // 设置uniform
        gl.uniform3fv(ambientColorUniform, ambientColor);
        gl.uniform1f(ambientIntensityUniform, ambientIntensity);
        gl.uniform3fv(diffuseColorUniform, diffuseColor);
        gl.uniform1f(diffuseCoefficientUniform, diffuseCoefficient);
        gl.uniform3fv(specularColorUniform, specularColor);
        gl.uniform1f(specularCoefficientUniform, specularCoefficient);
        gl.uniform1f(shininessUniform, shininess);

        // 设置光源位置（使用第一个光源或默认位置）
        const lightPosition = lights.length > 0 ? lights[0].position : new Vector3(5, 5, 5);
        gl.uniform3fv(lightPositionUniform, [lightPosition.x, lightPosition.y, lightPosition.z]);

        // 设置观察者位置
        gl.uniform3fv(viewPositionUniform, [camera.position.x, camera.position.y, camera.position.z]);
    }

    // 计算法线矩阵
    getNormalMatrix(modelViewMatrix) {
        const m = modelViewMatrix.getValues();
        
        // 计算3x3模型视图矩阵的逆矩阵转置
        const normalMatrix = new Float32Array(9);
        
        // 计算3x3矩阵的行列式
        const det = m[0] * (m[5] * m[10] - m[6] * m[9]) - m[1] * (m[4] * m[10] - m[6] * m[8]) + m[2] * (m[4] * m[9] - m[5] * m[8]);
        
        if (det === 0) return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        
        const invDet = 1.0 / det;
        
        // 计算逆矩阵
        normalMatrix[0] = (m[5] * m[10] - m[6] * m[9]) * invDet;
        normalMatrix[1] = (m[2] * m[9] - m[1] * m[10]) * invDet;
        normalMatrix[2] = (m[1] * m[6] - m[2] * m[5]) * invDet;
        normalMatrix[3] = (m[6] * m[8] - m[4] * m[10]) * invDet;
        normalMatrix[4] = (m[0] * m[10] - m[2] * m[8]) * invDet;
        normalMatrix[5] = (m[2] * m[4] - m[0] * m[6]) * invDet;
        normalMatrix[6] = (m[4] * m[9] - m[5] * m[8]) * invDet;
        normalMatrix[7] = (m[1] * m[8] - m[0] * m[9]) * invDet;
        normalMatrix[8] = (m[0] * m[5] - m[1] * m[4]) * invDet;
        
        return normalMatrix;
    }

    // 旋转球体
    rotate(x, y, z) {
        const rotationX = Matrix4.rotationX(x);
        const rotationY = Matrix4.rotationY(y);
        const rotationZ = Matrix4.rotationZ(z);
        
        this.modelMatrix = this.modelMatrix.multiply(rotationX).multiply(rotationY).multiply(rotationZ);
    }
}