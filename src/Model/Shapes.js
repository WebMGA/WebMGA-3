import {
    BufferGeometry,
    BufferAttribute,
    TriangleFanDrawMode,
    TriangleStripDrawMode,
    SphereBufferGeometry,
    CylinderBufferGeometry,
    TorusBufferGeometry
} from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {Alert} from 'rsuite';

export class Shape {

    //complexity attributes
    levels = 2;
    LOD;
    complexity;

    //shape model attributes
    parameters;

    //graphics components
    stripGeometries = [];
    fanGeometries = [];
    stripGeometry;
    presetGeometry;

    isPreset;

    constructor() {
        this.parameters = arguments[0];
        this.isPreset = false;
        this.LOD = 2;
        this.complexity = [6,10,14,20,26];
    }

    clear(){
        this.presetGeometry = [];
        this.stripGeometries = [];
        this.fanGeometries = [];
    }

    static normalize(vec, scale) {

        if (scale !== undefined) {
            vec[0] /= Math.pow(scale[0], 2.0);
            vec[1] /= Math.pow(scale[1], 2.0);
            vec[2] /= Math.pow(scale[2], 2.0);
        }

        let length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
        vec = vec.map(x => x / length);

        return vec;
    }


    addGeometry(vertices, normals, type) {
        let g = new BufferGeometry();

        g.setAttribute('position', new BufferAttribute(Float32Array.from(vertices), 3));
        g.setAttribute('normal', new BufferAttribute(Float32Array.from(normals), 3));


        if (type.localeCompare('strip') === 0) {
            g = BufferGeometryUtils.toTrianglesDrawMode(g, TriangleStripDrawMode);
            this.stripGeometries.push(g);
        } else {
            g = BufferGeometryUtils.toTrianglesDrawMode(g, TriangleFanDrawMode);
            this.fanGeometries.push(g);
        }

    }

    mergeGeometries() {
        this.stripGeometry = BufferGeometryUtils.mergeBufferGeometries(this.stripGeometries);
    }

}

export class Preset extends Shape {

    constructor(type, parameters) {
        super();
        this.isPreset = true;
        this.type = type;
        this.parameters = parameters;
    }

    generate(){
        this.clear();

        switch (this.type) {
            case 'Sphere':
                this.presetGeometry = new SphereBufferGeometry(this.parameters, this.complexity[this.LOD], this.complexity[this.LOD]);
                break;
            case 'Cylinder':
                this.presetGeometry = new CylinderBufferGeometry(...this.parameters, this.complexity[this.LOD]);
                break;
            case 'Torus':
                this.presetGeometry = new TorusBufferGeometry(...this.parameters, 2*this.complexity[this.LOD]);
                break;
            default:
                Alert.error('Error: Unknown shape identifier');
        }
    }
}

export class Ellipsoid extends Shape {

    constructor() {
        super(arguments);
    }

    generate(){
        this.clear();
        this.genGeometries();
        this.mergeGeometries();
    }

    genGeometries() {
        let actComplexity = [],
            piece = [],
            scale = this.parameters,
            vertices = [],
            normals = [],
            temp = [];

        //renders ellipsoid body vertices and normals
        for (let currLevel = 0; currLevel < this.levels; ++currLevel) {
            //calculates complexity of current render
            actComplexity.push(this.complexity[this.LOD] + currLevel * (-this.complexity[this.LOD]) / (this.levels - 1.0));
            actComplexity.push(this.complexity[this.LOD] + currLevel * (-this.complexity[this.LOD]) / (this.levels - 1.0));

            piece.push(2 * Math.PI / actComplexity[0]);
            piece.push(Math.PI / ((actComplexity[1] + 1) * 2));

            for (var i = 0; i < actComplexity[1] * 2; ++i) {
                for (var j = 0; j < actComplexity[0] + 1; ++j) {
                    if (j === 0 || j === actComplexity[0]) {
                        temp.push(-scale[0] * Math.sin((i + 1) * piece[1]));
                        temp.push(0.0);
                    }
                    else {
                        temp.push(-Math.cos(j * piece[0]) * scale[0] * Math.sin((i + 1) * piece[1]));
                        temp.push(-Math.sin(j * piece[0]) * scale[1] * Math.sin((i + 1) * piece[1]));
                    }

                    temp.push(Math.cos((i + 1) * piece[1]) * scale[2]);

                    vertices.push(...temp);
                    normals.push(...Shape.normalize(temp, scale))
                    temp = []

                    if (j === 0 || j === actComplexity[0]) {
                        temp.push(-scale[0] * Math.sin((i + 2) * piece[1]));
                        temp.push(0.0);
                    }
                    else {
                        temp.push(-Math.cos(j * piece[0]) * scale[0] * Math.sin((i + 2) * piece[1]));
                        temp.push(-Math.sin(j * piece[0]) * scale[1] * Math.sin((i + 2) * piece[1]));

                    }
                    temp.push(Math.cos((i + 2) * piece[1]) * scale[2]);

                    vertices.push(...temp);
                    normals.push(...Shape.normalize(temp, scale))
                    temp = []

                }

            }

        }
        this.addGeometry(vertices, normals, 'strip');

        vertices = [];
        normals = [];

        // renders ellipsoid top vertices and normals
        temp.push(0.0);
        temp.push(0.0);
        temp.push(scale[2]);

        vertices.push(...temp);
        normals.push(...Shape.normalize(temp, scale));
        temp = [];

        for (j = 0; j < actComplexity[0] + 1; ++j) {
            if (j === 0 || j === actComplexity[0]) {
                temp.push(-scale[0] * Math.sin(piece[1]));
                temp.push(0.0);
            }
            else {
                temp.push(-Math.cos(j * piece[0]) * scale[0] * Math.sin(piece[1]));
                temp.push(-Math.sin(j * piece[0]) * scale[1] * Math.sin(piece[1]));
            }
            temp.push(Math.cos(piece[1]) * scale[2]);

            vertices.push(...temp);
            normals.push(...Shape.normalize(temp, scale))
            temp = []
        }

        this.addGeometry(vertices, normals, 'fan');
        vertices = [];
        normals = []

        // renders ellipsoid bottom vertices and normals
        temp.push(0.0);
        temp.push(0.0);
        temp.push(-scale[2]);

        vertices.push(...temp);
        normals.push(...Shape.normalize(temp, scale))
        temp = []

        for (j = actComplexity[0]; j >= 0; --j) {
            if (j === 0 || j === actComplexity[0]) {
                temp.push(-scale[0] * Math.sin(piece[1]));
                temp.push(0.0);
            }
            else {
                temp.push(-Math.cos(j * piece[0]) * scale[0] * Math.sin(piece[1]));
                temp.push(-Math.sin(j * piece[0]) * scale[1] * Math.sin(piece[1]));
            }
            temp.push(-Math.cos(piece[1]) * scale[2]);

            vertices.push(...temp);
            normals.push(...Shape.normalize(temp, scale))
            temp = []

        }
        this.addGeometry(vertices, normals, 'fan');
    }

}

export class Spherocylinder extends Shape {


    constructor() {
        super(arguments);
    }

    generate(){
        this.clear();
        this.genGeometries();
        this.mergeGeometries();
    }

    genGeometries() {
        let actComplexity = [],
            piece = [],
            radius = this.parameters[0],
            length = this.parameters[1],
            vertices,
            normals,
            temp = [];

        for (let currLevel = 0; currLevel < this.levels; ++currLevel) {
            //calculates complexity of current render
            actComplexity.push(this.complexity[this.LOD] + currLevel * (- this.complexity[this.LOD]) / (this.levels - 1.0));
            actComplexity.push(actComplexity[0] / 4);

            piece.push(2 * Math.PI / actComplexity[0]);
            piece.push(2 * Math.PI / (actComplexity[1] * 4));

            for (let y = 0; y < (actComplexity[1] - 1); ++y) {

                vertices = [];
                normals = [];

                for (let x = 0; x <= actComplexity[0]; ++x) {
                    if (x === 0 || x === actComplexity[0]) {
                        temp.push(-Math.sin((y + 1) * piece[1]) * radius);
                        temp.push(0);
                    }
                    else {
                        temp.push(-Math.cos(x * piece[0]) * Math.sin((y + 1) * piece[1]) * radius);
                        temp.push(-Math.sin(x * piece[0]) * Math.sin((y + 1) * piece[1]) * radius);
                    }
                    temp.push(Math.cos((y + 1) * piece[1]) * radius);

                    normals.push(...Shape.normalize(temp))
                    temp[2] += length / 2;
                    vertices.push(...temp);
                    temp = [];

                    if (x === 0 || x === actComplexity[0]) {
                        temp.push(-Math.sin((y + 2) * piece[1]) * radius);
                        temp.push(0);
                    }
                    else {
                        temp.push(-Math.cos(x * piece[0]) * Math.sin((y + 2) * piece[1]) * radius);
                        temp.push(-Math.sin(x * piece[0]) * Math.sin((y + 2) * piece[1]) * radius);
                    }
                    temp.push(Math.cos((y + 2) * piece[1]) * radius);

                    normals.push(...Shape.normalize(temp))
                    temp[2] += length / 2;
                    vertices.push(...temp);
                    temp = [];
                }

                this.addGeometry(vertices, normals, 'strip');
            }

            for (let y = actComplexity[1] - 1; y < 2 * (actComplexity[1] - 1); ++y) {

                vertices = [];
                normals = [];

                for (let x = 0; x <= actComplexity[0]; ++x) {
                    if (x === 0 || x === actComplexity[0]) {
                        temp.push(-Math.sin((y + 1) * piece[1]) * radius);
                        temp.push(0);
                    }
                    else {
                        temp.push(-Math.cos(x * piece[0]) * Math.sin((y + 1) * piece[1]) * radius);
                        temp.push(-Math.sin(x * piece[0]) * Math.sin((y + 1) * piece[1]) * radius);
                    }
                    temp.push(Math.cos((y + 1) * piece[1]) * radius);

                    normals.push(...Shape.normalize(temp))
                    temp[2] -= length / 2;
                    vertices.push(...temp);
                    temp = [];

                    if (x === 0 || x === actComplexity[0]) {
                        temp.push(-1 * Math.sin((y + 2) * piece[1]) * radius);
                        temp.push(0);
                    }
                    else {
                        temp.push(-Math.cos(x * piece[0]) * Math.sin((y + 2) * piece[1]) * radius);
                        temp.push(-Math.sin(x * piece[0]) * Math.sin((y + 2) * piece[1]) * radius);
                    }
                    temp.push(Math.cos((y + 2) * piece[1]) * radius);

                    normals.push(...Shape.normalize(temp))
                    temp[2] -= length / 2;
                    vertices.push(...temp);
                    temp = [];
                }

                this.addGeometry(vertices, normals, 'strip');
            }

            normals = [];
            vertices = [];

            for (let x = 0; x <= actComplexity[0]; ++x) {

                if (x === 0 || x === actComplexity[0]) {
                    temp.push(-radius);
                    temp.push(0);
                }
                else {
                    temp.push(-Math.cos(x * piece[0]) * radius);
                    temp.push(-Math.sin(x * piece[0]) * radius);
                }
                temp.push(0);

                normals.push(...Shape.normalize(temp))
                temp[2] += length / 2;
                vertices.push(...temp);
                temp[2] = 0;
                normals.push(...Shape.normalize(temp))
                temp[2] -= length / 2;
                vertices.push(...temp);
                temp = [];

            }

            this.addGeometry(vertices, normals, 'strip');

            normals = [];
            vertices = [];
            temp[0] = 0;
            temp[1] = 0;
            temp[2] = radius;

            normals.push(...Shape.normalize(temp))
            temp[2] += length / 2;
            vertices.push(...temp);
            temp = [];

            for (let j = 0; j <= actComplexity[0]; ++j) {
                if (j === 0 || j === actComplexity[0]) {
                    temp.push(-Math.sin(piece[1]) * radius);
                    temp.push(0);
                }
                else {
                    temp.push(-Math.cos(j * piece[0]) * Math.sin(piece[1]) * radius);
                    temp.push(-Math.sin(j * piece[0]) * Math.sin(piece[1]) * radius);
                }
                temp.push(Math.cos(piece[1]) * radius);

                normals.push(...Shape.normalize(temp))
                temp[2] += length / 2;
                vertices.push(...temp);
                temp = [];
            }

            this.addGeometry(vertices, normals, 'fan');

            normals = [];
            vertices = [];
            temp[0] = 0;
            temp[1] = 0;
            temp[2] = -radius;

            normals.push(...Shape.normalize(temp))
            temp[2] -= length / 2;
            vertices.push(...temp);
            temp = [];

            for (let j = actComplexity[0]; j >= 0; --j) {
                if (j === 0 || j === actComplexity[0]) {
                    temp.push(-Math.sin(piece[1]) * radius);
                    temp.push(0);
                }
                else {
                    temp.push(-Math.cos(j * piece[0]) * Math.sin(piece[1]) * radius);
                    temp.push(-Math.sin(j * piece[0]) * Math.sin(piece[1]) * radius);
                }
                temp.push(-Math.cos(piece[1]) * radius);

                normals.push(...Shape.normalize(temp))
                temp[2] -= length / 2;
                vertices.push(...temp);
                temp = [];
            }

            this.addGeometry(vertices, normals, 'fan');

        }

    }
}

export class Spheroplatelet extends Shape {

    constructor() {
        super(arguments);
    }

    generate(){
        this.clear();
        this.genGeometries();
        this.mergeGeometries();
    }

    genGeometries() {
        let radSphere = this.parameters[0],
            radCircle = this.parameters[1],
            plusZ = [0, 0, 1],
            minusZ = [0, 0, -1],
            projectionUp = 0,
            projectionDown = 0,
            actComplexity = [],
            piece = [],
            vertices = [],
            normals = [],
            temp = [];

        for (let currLevel = 0; currLevel < this.levels; ++currLevel) {
            //calculates complexity of current render
            actComplexity.push(this.complexity[this.LOD] + currLevel * (-this.complexity[this.LOD]) / (this.levels - 1.0));
            actComplexity.push(this.complexity[this.LOD] + currLevel * (-this.complexity[this.LOD]) / (this.levels - 1.0));

            piece.push(2 * Math.PI / actComplexity[0]);
            piece.push(Math.PI / (actComplexity[1] * 2));

            for (let i = 0; i < actComplexity[1] * 2; ++i) {
                projectionUp = radSphere * Math.sin(i * piece[1]);
                projectionDown = radSphere * Math.sin((i + 1) * piece[1]);

                for (let j = 0; j < actComplexity[0] + 1; ++j) {
                    // Upper part of triangle strip
                    if (j === 0 || j === actComplexity[0]) {
                        temp.push(-projectionUp);
                        temp.push(0);
                    }
                    else {
                        temp.push(-projectionUp * Math.cos(j * piece[0]));
                        temp.push(-projectionUp * Math.sin(j * piece[0]));
                    }
                    temp.push(Math.cos(i * piece[1]) * radSphere);

                    normals.push(...Shape.normalize(temp));

                    if (j === 0 || j === actComplexity[0]) {
                        temp[0] -= radCircle;
                    }
                    else {
                        temp[0] -= radCircle * Math.cos(j * piece[0]);
                        temp[1] -= radCircle * Math.sin(j * piece[0]);
                    }

                    vertices.push(...temp);
                    temp = [];

                    // Lower part of triangle strip
                    if (j === 0 || j === actComplexity[0]) {
                        temp.push(-projectionDown);
                        temp.push(0);
                    }
                    else {
                        temp.push(-projectionDown * Math.cos(j * piece[0]));
                        temp.push(-projectionDown * Math.sin(j * piece[0]));
                    }
                    temp.push(Math.cos((i + 1) * piece[1]) * radSphere);

                    normals.push(...Shape.normalize(temp));

                    if (j === 0 || j === actComplexity[0]) {
                        temp[0] -= radCircle;
                    }
                    else {
                        temp[0] -= radCircle * Math.cos(j * piece[0]);
                        temp[1] -= radCircle * Math.sin(j * piece[0]);
                    }

                    vertices.push(...temp);
                    temp = [];
                }
            }


            this.addGeometry(vertices, normals, 'strip');
            vertices = [];
            normals = [];


            // upper plane
            temp.push(0);
            temp.push(0);
            temp.push(radSphere);

            normals.push(...Shape.normalize(temp));
            vertices.push(...temp);

            temp = [];

            for (let j = 0; j < actComplexity[0] + 1; ++j) {
                if (j === 0 || j === actComplexity[0]) {
                    temp.push(-radCircle);
                    temp.push(0);
                }
                else {
                    temp.push(-Math.cos(j * piece[0]) * radCircle);
                    temp.push(-Math.sin(j * piece[0]) * radCircle);
                }

                temp.push(radSphere);
                normals.push(...plusZ);
                vertices.push(...temp);
                temp = [];
            }

            this.addGeometry(vertices, normals, 'fan');
            vertices = [];
            normals = [];

            // lower plane
            temp.push(0);
            temp.push(0);
            temp.push(-radSphere);

            normals.push(...Shape.normalize(temp));
            vertices.push(...temp);
            temp = [];

            for (let j = actComplexity[0]; j >= 0; --j) {
                if (j === 0 || j === actComplexity[0]) {
                    temp.push(-radCircle);
                    temp.push(0);
                }
                else {
                    temp.push(-Math.cos(j * piece[0]) * radCircle);
                    temp.push(-Math.sin(j * piece[0]) * radCircle);
                }

                temp.push(-radSphere);
                normals.push(...minusZ);
                vertices.push(...temp);
                temp = [];
            }

            this.addGeometry(vertices, normals, 'fan');

        }

    }

}

export class CutSphere extends Shape {

    constructor() {
        super(arguments);
    }

    generate(){
        this.clear();
        this.genGeometries();
        this.mergeGeometries();
    }

    genGeometries() {
        let radius = this.parameters[0],
            zCut = this.parameters[1],
            plusZ = [0, 0, 1],
            minusZ = [0, 0, -1],
            angle = Math.acos(zCut / radius),
            radiusFan = radius * Math.sin(angle),
            actComplexity = [],
            piece = [],
            vertices = [],
            normals = [],
            temp = [];

        for (let currLevel = 0; currLevel < this.levels; ++currLevel) {
            //calculates complexity of current render
            actComplexity.push(this.complexity[this.LOD] + currLevel * (-this.complexity[this.LOD]) / (this.levels - 1.0));
            actComplexity.push(this.complexity[this.LOD] + currLevel * (-this.complexity[this.LOD]) / (this.levels - 1.0));

            piece.push(2 * Math.PI / actComplexity[0]);
            piece.push((Math.PI - 2 * angle) / (actComplexity[1] * 2));

            for (let i = 0; i < actComplexity[1] * 2; ++i) {
                for (let j = 0; j < actComplexity[0] + 1; ++j) {
                    // Upper part of triangle strip
                    if (j === 0 || j === actComplexity[0]) {
                        temp.push(-radius * Math.sin(angle + i * piece[1]));
                        temp.push(0);
                    }
                    else {
                        temp.push(-Math.cos(j * piece[0]) * radius * Math.sin(angle + i * piece[1]));
                        temp.push(-Math.sin(j * piece[0]) * radius * Math.sin(angle + i * piece[1]));
                    }
                    temp.push(Math.cos(angle + i * piece[1]) * radius);

                    normals.push(...Shape.normalize(temp));
                    vertices.push(...temp);
                    temp = [];

                    // Lower part of triangle strip
                    if (j === 0 || j === actComplexity[0]) {
                        temp.push(-radius * Math.sin(angle + (i + 1) * piece[1]));
                        temp.push(0);
                    }
                    else {
                        temp.push(-Math.cos(j * piece[0]) * radius * Math.sin(angle + (i + 1) * piece[1]));
                        temp.push(-Math.sin(j * piece[0]) * radius * Math.sin(angle + (i + 1) * piece[1]));
                    }
                    temp.push(Math.cos(angle + (i + 1) * piece[1]) * radius);

                    normals.push(...Shape.normalize(temp));
                    vertices.push(...temp);
                    temp = [];
                }
            }


            this.addGeometry(vertices, normals, 'strip');
            vertices = [];
            normals = [];


            // upper plane
            temp.push(0);
            temp.push(0);
            temp.push(zCut);

            normals.push(...Shape.normalize(temp));
            vertices.push(...temp);
            temp = [];

            for (let j = 0; j < actComplexity[0] + 1; ++j) {
                if (j === 0 || j === actComplexity[0]) {
                    temp.push(-radiusFan);
                    temp.push(0);
                }
                else {
                    temp.push(-Math.cos(j * piece[0]) * radiusFan);
                    temp.push(-Math.sin(j * piece[0]) * radiusFan);
                }

                temp.push(zCut);
                normals.push(...plusZ);
                vertices.push(...temp);
                temp = [];
            }

            this.addGeometry(vertices, normals, 'fan');
            vertices = [];
            normals = [];



            // lower plane
            temp.push(0);
            temp.push(0);
            temp.push(-zCut);

            normals.push(...Shape.normalize(temp));
            vertices.push(...temp);
            temp = [];

            for (let j = actComplexity[0]; j >= 0; --j) {
                if (j === 0 || j === actComplexity[0]) {
                    temp.push(-radiusFan);
                    temp.push(0);
                }
                else {
                    temp.push(-Math.cos(j * piece[0]) * radiusFan);
                    temp.push(-Math.sin(j * piece[0]) * radiusFan);
                }

                temp.push(-zCut);
                normals.push(...minusZ);
                vertices.push(...temp);
                temp = [];
            }

            this.addGeometry(vertices, normals, 'fan');

        }

    }


}
