class ShaderManager {
    constructor(gl) {
        this.gl = gl;
        this.programs = {};
    }

    createProgram(programName, vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program:', this.gl.getProgramInfoLog(program));
            return null;
        }

        this.programs[programName] = program;
        return program;
    }

    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    useProgram(programName) {
        const program = this.programs[programName];
        if (program) {
            this.gl.useProgram(program);
            return program;
        }
        console.error(`Program ${programName} not found`);
        return null;
    }

    getUniformLocation(programName, uniformName) {
        const program = this.programs[programName];
        if (program) {
            return this.gl.getUniformLocation(program, uniformName);
        }
        console.error(`Program ${programName} not found`);
        return null;
    }

    getAttribLocation(programName, attribName) {
        const program = this.programs[programName];
        if (program) {
            return this.gl.getAttribLocation(program, attribName);
        }
        console.error(`Program ${programName} not found`);
        return -1;
    }
}