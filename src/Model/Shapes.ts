import {
    BufferAttribute,
    BufferGeometry,
    CylinderBufferGeometry,
    SphereBufferGeometry,
    TorusBufferGeometry,
    TriangleFanDrawMode,
    TriangleStripDrawMode
} from 'three';
import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils';
import {Alert} from 'rsuite';
import * as math from "mathjs";

export class Shape {

    //complexity attributes
    levels;
    LOD;
    complexity;

    //shape model attributes
    parameters;

    //graphics components
    stripGeometries: BufferGeometry[];
    fanGeometries: BufferGeometry[];
    stripGeometry?: BufferGeometry;
    presetGeometry?: BufferGeometry;

    isPreset;

    constructor() {
        this.parameters = arguments[0];
        this.isPreset = false;
        this.levels = 2
        this.LOD = 2;
        this.complexity = [6, 10, 14, 20, 26];
        this.stripGeometries = [];
        this.fanGeometries = [];
        this.stripGeometry = undefined;
        this.presetGeometry = undefined;
    }

    clear() {
        this.presetGeometry = undefined;
        this.stripGeometries = [];
        this.fanGeometries = [];
    }

}

export class Preset extends Shape {
    type;

    constructor(type: string, parameters: number[]) {
        super();
        this.isPreset = true;
        this.type = type;
        this.parameters = parameters;
    }

    generate() {
        this.clear();

        switch (this.type) {
            case 'Sphere':
                this.presetGeometry = new SphereBufferGeometry(this.parameters, this.complexity[this.LOD], this.complexity[this.LOD]);
                break;
            case 'Cylinder':
                this.presetGeometry = new CylinderBufferGeometry(...this.parameters, this.complexity[this.LOD]);
                break;
            case 'Torus':
                this.presetGeometry = new TorusBufferGeometry(...this.parameters, 2 * this.complexity[this.LOD]);
                break;
            default:
                Alert.error('Error: Unknown shape identifier');
        }
    }
}

export class Sphere extends Shape {
    radius: number
    samples: number

    constructor(radius: number) {
        super();
        this.radius = radius
        //TODO better complexity
        this.samples = this.complexity[this.LOD]
    }

    generate() {
        this.clear();
        this.generate_normals();
        this.genGeometries();
    }

    linspace(start: number, stop: number, number: number): number[] {
        let increment: number = (stop - start) / (number - 1)
        let values: number[] = []
        for (let i: number = 0; i < number; ++i) {
            values.push(start + i * increment)
        }
        return values
    }

    sample_sphere(radius: number, theta: number, phi: number): math.MathType {
        let sin_phi: number = Math.sin(phi);
        return math.multiply(radius, [sin_phi * Math.cos(theta), sin_phi * Math.sin(theta), Math.cos(phi)])
    }

    spherical_vertices(radius: number, thetas: math.MathArray, phis: math.MathArray, samples: number): number[][] {
        let offset_thetas: math.MathType = math.add(thetas, math.divide(math.pi, samples))
        let result = []
        for (let [phi_index, phi] of phis.entries()) {
            let abc = []
            for (let theta of ((phi_index % 2 == 0) ? thetas : offset_thetas)) {
                abc.push(this.sample_sphere(radius, theta, phi))
            }
            result.push(abc)
        }
        return result
    }

    build_quarters(vertices: number[][][]): math.MathType {
        return math.concat(vertices, vertices.map(vertex_row => vertex_row.map(vertex => [-vertex[0], -vertex[1], vertex[2]])), 1)
    }

    quarter_thetas(samples: number): number[] {
        return this.linspace(0, math.pi, Math.floor(samples / 2) + 1).slice(0, -1)
    }

    quarter_sphere_vertices(radius: number, samples: number, phi_offset: number): math.MathArray {
        let phis: number[] = this.linspace(0, math.pi / 2, Math.floor(samples / 2) - phi_offset)
        return this.spherical_vertices(radius, this.quarter_thetas(samples), phis, samples)
    }

    build_halves(vertices: number[][][]): math.MathType {
        return math.concat(vertices, this.bottom_half(vertices), 0)
    }

    bottom_half(vertices: math.MathArray): math.MathArray {
        //Initially I used .reverse which broke stuff as it's in-place
        let rolled_vertices = []
        let roll_offset = math.floor(vertices[0].length / 2)
        for (let [vertex_row_index, vertex_row] of vertices.entries()) {
            rolled_vertices.push(vertex_row.slice(roll_offset).concat(vertex_row.slice(0, roll_offset)))
        }
        return math.multiply(rolled_vertices.toReversed(), -1).slice(1)
    }

    half_sphere_vertices(radius: number, samples: number): math.MathType {
        return this.build_quarters(this.quarter_sphere_vertices(radius, samples, 0))
    }

    roll_vertices(vertices: number[][][], offset: boolean = false) {
        for (let i = 0; i < vertices.length; ++i) {
            let cut = math.ceil((i + (offset ? 1 : 0)) / 2)
            vertices[i] = vertices[i].slice(-cut).concat(vertices[i].slice(0, -cut))
        }
        return vertices
    }

    generate_vertices(): math.MathType {
        return this.roll_vertices(this.build_halves(this.half_sphere_vertices(this.radius, this.samples)))
    }

    generate_normals(): math.MathType {
        return this.roll_vertices(this.build_halves(this.half_sphere_vertices(1, this.samples)))
    }

    to_triangles(vertices: number[][][]) {
        let positions: number[] = []
        for (let row = 1; row < vertices.length - 1; ++row) {
            for (let row_column = 0; row_column < vertices[row].length; ++row_column) {
                positions = positions.concat(vertices[row][row_column])
                positions = positions.concat(vertices[row][(row_column + 1) % vertices[row].length])
                positions = positions.concat(vertices[row - 1][(row_column) % vertices[row - 1].length])
                //
                positions = positions.concat(vertices[row][row_column])
                positions = positions.concat(vertices[row + 1][(row_column + 1) % vertices[row + 1].length])
                positions = positions.concat(vertices[row][(row_column + 1) % vertices[row].length])
            }
        }
        return positions
    }

    genGeometries() {
        let positions: number[] = this.to_triangles(this.generate_vertices())
        const normals = this.to_triangles(this.generate_normals())
        const geometry = new BufferGeometry();
        const positionNumComponents = 3;
        const normalNumComponents = 3;
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), positionNumComponents));
        geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), normalNumComponents));
        this.stripGeometry = geometry
        //TODO REMOVE below
        const false_geometry = new BufferGeometry();
        false_geometry.setAttribute('position', new BufferAttribute(new Float32Array([100, 100, 100, 101, 101, 101, 102, 102, 102]), positionNumComponents));
        false_geometry.setAttribute('normal', new BufferAttribute(new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1]), normalNumComponents));
        this.stripGeometries.push(BufferGeometryUtils.toTrianglesDrawMode(false_geometry, TriangleStripDrawMode))
        this.fanGeometries.push(BufferGeometryUtils.toTrianglesDrawMode(false_geometry, TriangleFanDrawMode))
        this.stripGeometries.push(BufferGeometryUtils.toTrianglesDrawMode(false_geometry, TriangleStripDrawMode))
        this.fanGeometries.push(BufferGeometryUtils.toTrianglesDrawMode(false_geometry, TriangleFanDrawMode))
        //
    }
}

export class Spherocylinder extends Sphere {
    length: number

    constructor(radius: number, length: number) {
        super(radius);
        this.length = length
    }

    generate_vertices(): math.MathType {
        let sphere_vertices = super.generate_vertices()
        let centre_row = math.ceil(math.size(sphere_vertices)[0] / 2)
        for (let column = 0; column < math.size(sphere_vertices)[1]; ++column) {
            for (let row = 0; row < centre_row; ++row) {
                sphere_vertices[row][column][2] += this.length / 2
            }
            for (let row = centre_row - 1; row < math.size(sphere_vertices)[0]; ++row) {
                sphere_vertices[row][column][2] -= this.length / 2
            }
        }
        return sphere_vertices
    }

    //TODO normals will probablyhave a missing column
}

export class Spheroplatelet extends Sphere {
    circle_radius: number

    constructor(radius: number, circle_radius: number) {
        super(radius);
        this.circle_radius = circle_radius
    }

    base(vertices: math.MathType) {
        let row_count = math.size(vertices)[0]
        let column_count = math.size(vertices)[1]
        let top = [vertices[0].map(column => column.map(vertex => vertex))]
        let bottom = [vertices[row_count - 1].map(column => column.map(vertex => vertex))]
        let circle_angles = this.linspace(0, 2 * math.pi, column_count + 1)
        for (let row = 0; row < row_count; ++row) {
            for (let column = 0; column < column_count; ++column) {
                let radius_vector = vertices[row][column].slice(0, 2)
                let norm = math.norm(radius_vector)
                if (norm == 0) {
                    //TODO fix other face
                    let x = circle_angles[math.abs((column) % column_count)]
                    radius_vector = [math.cos(x), math.sin(x)]
                    norm = 1
                }
                let normalised_radius_vector = math.multiply(this.circle_radius, math.divide(radius_vector, norm))
                vertices[row][column][0] += normalised_radius_vector[0]
                vertices[row][column][1] += normalised_radius_vector[1]
            }
        }
        return top.concat(vertices).concat(bottom)
    }

    generate_vertices(): math.MathType {
        return this.base(super.generate_vertices())
    }

    generate_normals(): math.MathType {
        return this.base(super.generate_normals())
    }
}

export class Ellipsoid extends Sphere {
    x: number
    y: number
    z: number

    constructor(x: number, y: number, z: number) {
        super(1);
        this.x = x
        this.y = y
        this.z = z
    }

    generate_vertices(): math.MathType {
        let vertices = super.generate_vertices()
        for (let row = 0; row < math.size(vertices)[0]; ++row) {
            for (let column = 0; column < math.size(vertices)[1]; ++column) {
                vertices[row][column][0] *= this.x
                vertices[row][column][1] *= this.y
                vertices[row][column][2] *= this.z
            }
        }
        return vertices
    }
}

export class CutSphere extends Sphere {
    cut_radius: number

    constructor(radius: number, cut_radius: number) {
        super(radius);
        this.cut_radius = cut_radius
    }

    base(radius: number) {
        let phis = this.linspace(math.asin(this.cut_radius / this.radius), math.pi, this.samples - 1)
        let vertices = this.build_quarters(this.spherical_vertices(this.radius, this.quarter_thetas(this.samples), phis, this.samples))
        let xs = vertices[0].map(vertex => vertex[0])
        let ys = vertices[0].map(vertex => vertex[1])
        let zs = vertices[0].map(vertex => vertex[2])
        let top = [new Array(math.size(vertices)[1]).fill([math.mean(xs), math.mean(ys), math.mean(zs)])]
        return this.roll_vertices(top.concat(vertices), true)
    }

    generate_vertices(): math.MathType {
        return this.base(this.radius)
    }

    generate_normals(): math.MathType {
        return this.base(1)
    }
}