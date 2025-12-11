class Matrix4 {
    constructor() {
        this.values = new Float32Array(16);
    }

    static identity() {
        const m = new Matrix4();
        m.values.set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        return m;
    }

    static translation(x, y, z) {
        const m = new Matrix4();
        m.values.set([
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1
        ]);
        return m;
    }

    static rotationX(angle) {
        const m = new Matrix4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        m.values.set([
            1, 0, 0, 0,
            0, c, -s, 0,
            0, s, c, 0,
            0, 0, 0, 1
        ]);
        return m;
    }

    static rotationY(angle) {
        const m = new Matrix4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        m.values.set([
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1
        ]);
        return m;
    }

    static rotationZ(angle) {
        const m = new Matrix4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        m.values.set([
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        return m;
    }

    static scaling(x, y, z) {
        const m = new Matrix4();
        m.values.set([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ]);
        return m;
    }

    static perspective(fov, aspect, near, far) {
        const m = new Matrix4();
        const f = 1.0 / Math.tan(fov * Math.PI / 360.0);
        const rangeInv = 1.0 / (near - far);
        
        m.values.set([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
        return m;
    }

    static lookAt(eye, center, up) {
        const m = new Matrix4();
        
        const f = Vector3.subtract(center, eye);
        f.normalize();
        
        const s = Vector3.cross(f, up);
        s.normalize();
        
        const u = Vector3.cross(s, f);
        u.normalize();
        
        m.values.set([
            s.x, u.x, -f.x, 0,
            s.y, u.y, -f.y, 0,
            s.z, u.z, -f.z, 0,
            -Vector3.dot(s, eye), -Vector3.dot(u, eye), Vector3.dot(f, eye), 1
        ]);
        
        return m;
    }

    multiply(other) {
        const result = new Matrix4();
        const a = this.values;
        const b = other.values;
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result.values[i * 4 + j] = 
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
        
        return result;
    }

    getValues() {
        return this.values;
    }
}

class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static add(v1, v2) {
        return new Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
    }

    static subtract(v1, v2) {
        return new Vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }

    static multiply(v, scalar) {
        return new Vector3(v.x * scalar, v.y * scalar, v.z * scalar);
    }

    static cross(v1, v2) {
        return new Vector3(
            v1.y * v2.z - v1.z * v2.y,
            v1.z * v2.x - v1.x * v2.z,
            v1.x * v2.y - v1.y * v2.x
        );
    }

    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        const len = this.length();
        if (len > 0) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
}