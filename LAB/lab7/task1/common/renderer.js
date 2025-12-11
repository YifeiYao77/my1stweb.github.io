class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = this.initializeWebGL();
        this.shaderManager = null;
        this.animationId = null;
        this.scene = {
            objects: [],
            lights: []
        };
        this.camera = null;
    }

    initializeWebGL() {
        const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!gl) {
            console.error('WebGL not supported');
            return null;
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        return gl;
    }

    resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    setShaderManager(shaderManager) {
        this.shaderManager = shaderManager;
    }

    setCamera(camera) {
        this.camera = camera;
    }

    addObject(object) {
        this.scene.objects.push(object);
    }

    addLight(light) {
        this.scene.lights.push(light);
    }

    createBuffer(data, target, usage) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(target, buffer);
        this.gl.bufferData(target, new Float32Array(data), usage || this.gl.STATIC_DRAW);
        this.gl.bindBuffer(target, null);
        return buffer;
    }

    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        if (!this.camera || !this.shaderManager) {
            return;
        }

        this.scene.objects.forEach(object => {
            object.render(this.gl, this.shaderManager, this.camera, this.scene.lights);
        });

        this.animationId = requestAnimationFrame(() => this.render());
    }

    start() {
        this.render();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    cleanup() {
        this.stop();
        if (this.gl) {
            // Clean up WebGL resources if needed
        }
    }
}

class Camera {
    constructor(fov, aspect, near, far, position, target, up) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.position = position;
        this.target = target;
        this.up = up;
        
        this.projectionMatrix = Matrix4.perspective(fov, aspect, near, far);
        this.viewMatrix = Matrix4.lookAt(position, target, up);
    }

    updateAspectRatio(aspect) {
        this.aspect = aspect;
        this.projectionMatrix = Matrix4.perspective(this.fov, this.aspect, this.near, this.far);
    }

    updateViewMatrix() {
        this.viewMatrix = Matrix4.lookAt(this.position, this.target, this.up);
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    getViewMatrix() {
        return this.viewMatrix;
    }
}

class Light {
    constructor(type, position, color, intensity) {
        this.type = type;
        this.position = position;
        this.color = color;
        this.intensity = intensity;
    }
}

class Material {
    constructor(ambient, diffuse, specular, shininess) {
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.shininess = shininess;
    }
}