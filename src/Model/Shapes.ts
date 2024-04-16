import {BufferAttribute, BufferGeometry} from 'three';
import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils';
import * as math from "mathjs";

function linspace(start: number, stop: number, number: number): number[] {
    let increment: number = (stop - start) / (number - 1)
    let values: number[] = []
    for (let i: number = 0; i < number; ++i) {
        values.push(start + i * increment)
    }
    return values
}

function logspace(start: number, stop: number, number: number, base: number): number[] {
    return linspace(start, stop, number).map(value => base ** value)
}

export class Shape {

    //complexity attributes
    LOD;
    static default_lod: number = 5
    static complexity_count: number = 10
    static complexity: number[] = math.multiply(math.round(math.divide(logspace(3, 7, Shape.complexity_count, 2), 2)), 2);

    //shape model attributes
    parameters;

    //graphics components
    stripGeometry?: BufferGeometry;

    constructor() {
        this.parameters = arguments[0];
        this.LOD = Shape.default_lod;
        this.stripGeometry = undefined;
    }

    set_lod(lod: number) {
        this.LOD = lod
    }

    roll_vertices(vertices: number[][][], offset: boolean = false) {
        for (let i = 0; i < vertices.length; ++i) {
            let cut = math.ceil((i + (offset ? 1 : 0)) / 2)
            vertices[i] = this.roll_row(vertices[i], cut)
        }
        return vertices
    }

    roll_row(vertices: number[][], cut: number) {
        return vertices.slice(-cut).concat(vertices.slice(0, -cut))
    }

    reverse_vertices(section: number[][][]): number[][][] {
        return section.map((row, row_index) => row.slice(-row_index).concat(row.slice(0, -row_index)))
    }
}

export class Sphere extends Shape {
    radius: number
    samples: number = Sphere.complexity[this.LOD]
    vertical_samples: number = this.samples
    vertical_sample_scale: number

    constructor(radius: number, vertical_sample_scale: number = 1) {
        super();
        this.radius = radius
        this.vertical_sample_scale = vertical_sample_scale
        this.update_samples()
    }

    update_samples(): void {
        this.samples = Math.max(4, Sphere.complexity[this.LOD])
        this.vertical_samples = Math.max(4, this.samples * this.vertical_sample_scale)
        if (this.vertical_samples % 2 == 1) {
            ++this.vertical_samples
        }
    }

    set_lod(lod: number) {
        super.set_lod(lod);
        this.update_samples();
    }

    generate(): void {
        this.update_samples();
        this.genGeometries();
    }

    sample_sphere(radius: number, theta: number, phi: number): number[] {
        let sin_phi: number = Math.sin(phi);
        return math.multiply(radius, [sin_phi * Math.cos(theta), sin_phi * Math.sin(theta), Math.cos(phi)])
    }

    spherical_vertices(radius: number, thetas: math.MathArray, phis: math.MathArray, samples: number): number[][] {
        let offset_thetas: math.MathType = math.add(thetas, math.divide(Math.PI, samples))
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
        return linspace(0, Math.PI, Math.floor(samples / 2) + 1).slice(0, -1)
    }

    quarter_sphere_vertices(radius: number, samples: number, phi_offset: number, vertical_samples: number = samples): math.MathArray {
        let phis: number[] = linspace(0, Math.PI / 2, Math.floor(vertical_samples / 2) - phi_offset)
        return this.spherical_vertices(radius, this.quarter_thetas(samples), phis, samples)
    }

    build_halves(vertices: number[][][]): math.MathType {
        return math.concat(vertices, this.bottom_half(vertices), 0)
    }

    bottom_half(vertices: math.MathArray): math.MathArray {
        //Initially I used .reverse which broke stuff as it's in-place
        let rolled_vertices = []
        let roll_offset = math.floor(vertices[0].length / 2)
        for (let vertex_row of vertices) {
            rolled_vertices.push(vertex_row.slice(roll_offset).concat(vertex_row.slice(0, roll_offset)))
        }
        return math.multiply(rolled_vertices.toReversed(), -1).slice(1)
    }

    half_sphere_vertices(radius: number, samples: number, vertical_samples: number = samples): math.MathType {
        return this.build_quarters(this.quarter_sphere_vertices(radius, samples, 0, vertical_samples))
    }

    generate_vertices(): number[][][][] {
        return [this.roll_vertices(this.build_halves(this.half_sphere_vertices(this.radius, this.samples, this.vertical_samples)))]
    }

    to_triangles(vertices: number[][][]) {
        let positions: number[] = []
        for (let row = 0; row < vertices.length; ++row) {
            for (let row_column = 0; row_column < vertices[row].length; ++row_column) {
                if (row > 0) {
                    positions = positions.concat(vertices[row][row_column])
                    positions = positions.concat(vertices[row][(row_column + 1) % vertices[row].length])
                    positions = positions.concat(vertices[row - 1][(row_column) % vertices[row - 1].length])
                }
                //
                if (row < vertices.length - 1) {
                    positions = positions.concat(vertices[row][row_column])
                    positions = positions.concat(vertices[row + 1][(row_column + 1) % vertices[row + 1].length])
                    positions = positions.concat(vertices[row][(row_column + 1) % vertices[row].length])
                }
            }
        }
        return positions
    }

    geometry_from_vertices(vertices: number[][][], position_components: number): BufferGeometry {
        let positions: number[] = this.to_triangles(vertices)
        let geometry: BufferGeometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), position_components));
        geometry = BufferGeometryUtils.mergeVertices(geometry)
        geometry.computeVertexNormals();
        geometry.normalizeNormals();
        return geometry
    }

    genGeometriesBase(position_components: number): BufferGeometry {
        let sub_geometries = this.generate_vertices().map(sub_vertices => this.geometry_from_vertices(sub_vertices, position_components))
        return BufferGeometryUtils.mergeBufferGeometries(sub_geometries)
    }

    genGeometries(): void {
        const positionNumComponents: number = 3;
        this.stripGeometry = this.genGeometriesBase(positionNumComponents)
    }

    connect_halves(top: number[][], bottom: number[][], radius: number) {
        let offset = Math.acos(bottom[0][0] / radius)
        let new_row = linspace(0 + offset, Math.PI * 2 + offset, top.length + 1).slice(0, -1).map(angle => this.sample_sphere(radius, angle, Math.PI / 2))
        return [bottom, new_row, top]
    }
}

//Spherocylinder mesh generator
export class Spherocylinder extends Sphere {
    //Scaling vector (either side of centre) to stretch sphere into spherocylinder ([0, 0, length / 2])
    length_scaling_vector: number[];

    constructor(radius: number, length: number) {
        //Derive from origin centred sphere of chosen radius
        super(radius);
        this.length_scaling_vector = [0, 0, length / 2];
    }

    // //Samples from spherocylinder instead of sphere
    // sample_sphere(radius: number, theta: number, phi: number): number[] {
    //     let sphere_coordinate: number[] = super.sample_sphere(radius, theta, phi);
    //     //Stretch point in z direction by scale vector, matching stretch direction to sign of original vertex z
    //     return sphere_coordinate[2] >= 0 ? math.add(sphere_coordinate, this.length_scaling_vector) : math.subtract(sphere_coordinate, this.length_scaling_vector);
    // }
    generate_vertices(): number[][][][] {
        let sphere = super.generate_vertices()[0];
        let top = sphere.slice(0, Math.ceil(sphere.length / 2)).map(row => row.map(vertex => math.add(vertex, this.length_scaling_vector)))
        let bottom = sphere.slice(Math.floor(sphere.length / 2)).map(row => row.map(vertex => math.subtract(vertex, this.length_scaling_vector)))
        let connector = this.connect_halves(this.roll_row(bottom[0], bottom[0].length / 2), this.roll_row(top[top.length - 1], top[top.length - 1].length / 2), this.radius)
        return [top, connector, bottom]
    }
}

export class Spheroplatelet extends Sphere {
    circle_radius: number

    constructor(radius: number, circle_radius: number) {
        super(radius);
        this.circle_radius = circle_radius
    }

    generate_vertices(): math.MathType {
        let vertices = super.generate_vertices()[0]
        let row_count = math.size(vertices)[0]
        let column_count = math.size(vertices)[1]
        let top = [vertices[0].map(column => column.map(vertex => vertex))]
        let bottom = [vertices[row_count - 1].map(column => column.map(vertex => vertex))]
        let circle_angles = linspace(0, 2 * Math.PI, column_count + 1).slice(0, -1)
        for (let row = 0; row < row_count; ++row) {
            for (let column = 0; column < column_count; ++column) {
                let radius_vector = vertices[row][column].slice(0, 2)
                let norm = math.norm(radius_vector)
                if (row == 0 || row == row_count - 1) {
                    let face_circle_angles = circle_angles
                    if (row == row_count - 1) {
                        let offset = math.floor(row / 2) + 2
                        face_circle_angles = circle_angles.slice(offset).concat(circle_angles.slice(0, offset))
                    }
                    let x = face_circle_angles[column]
                    radius_vector = [math.cos(x), math.sin(x)]
                    norm = 1
                }
                let normalised_radius_vector = math.multiply(this.circle_radius, math.divide(radius_vector, norm))
                vertices[row][column][0] += normalised_radius_vector[0]
                vertices[row][column][1] += normalised_radius_vector[1]
            }
        }
        return [top.concat(vertices.slice(0, 1)), vertices, vertices.slice(-1).concat(bottom)]
    }
}

//Ellipsoid mesh generator
export class Ellipsoid extends Sphere {
    //Scale factor in [x, y, z] directions
    scale: number[];

    constructor(x: number, y: number, z: number) {
        //Derive from origin centred sphere of radius 1
        super(1);
        this.scale = [x, y, z];
    }

    //Samples from ellipsoid instead of sphere
    sample_sphere(radius: number, theta: number, phi: number): number[] {
        //Multiply origin centred sphere coordinates by scale vector
        return math.dotMultiply(super.sample_sphere(radius, theta, phi), this.scale);
    }
}

export class CapCutSphereBase extends Sphere {
    cut_radius: number

    constructor(radius: number, cut_radius: number, vertical_sample_scale: number = 1, z_cut: boolean = true) {
        super(radius, vertical_sample_scale);
        this.cut_radius = z_cut ? math.sqrt(math.square(radius) - math.square(cut_radius)) : cut_radius
    }

    base(phis: number[], flat_top: boolean) {
        let vertices = this.roll_vertices(this.build_quarters(this.spherical_vertices(this.radius, this.quarter_thetas(this.samples), phis, this.samples)))
        let end_source_index = flat_top ? 0 : vertices.length - 1
        let xs = vertices[end_source_index].map(vertex => vertex[0])
        let ys = vertices[end_source_index].map(vertex => vertex[1])
        let zs = vertices[end_source_index].map(vertex => vertex[2])
        let end = [new Array(math.size(vertices)[1]).fill([math.mean(xs), math.mean(ys), math.mean(zs)])]
        return [vertices, flat_top ? end.concat(vertices.slice(0, 1)) : vertices.slice(-1).concat(end)]
    }
}

export class CutSphere extends CapCutSphereBase {
    generate_vertices() {
        let phis = linspace(math.asin(this.cut_radius / this.radius), Math.PI, this.vertical_samples - 1)
        return super.base(phis, true)
    }
}

export class DoubleCutSphere extends CapCutSphereBase {
    generate_vertices() {
        let angle_cut = math.asin(this.cut_radius / this.radius)
        let phis = linspace(angle_cut, Math.PI - angle_cut, this.vertical_samples - 2)
        let partial_vertices = super.base(phis, true)
        let index = partial_vertices[0].length - 1
        let xs = partial_vertices[0][index].map(vertex => vertex[0])
        let ys = partial_vertices[0][index].map(vertex => vertex[1])
        let zs = partial_vertices[0][index].map(vertex => vertex[2])
        let end = [new Array(math.size(partial_vertices[0])[1]).fill([math.mean(xs), math.mean(ys), math.mean(zs)])]
        partial_vertices.push(end.concat([partial_vertices[0][index].toReversed()]))
        return partial_vertices
    }
}

export class Cap extends CapCutSphereBase {
    generate_vertices() {
        let phis = linspace(0, math.asin(this.cut_radius / this.radius), this.vertical_samples - 1)
        return super.base(phis, false)
    }
}

export class BaseLens extends Sphere {
    radius_2: number
    angle: number
    cut_radius: number

    constructor(radius: number, radius_2: number, angle: number) {
        super(radius);
        this.radius_2 = radius_2
        this.angle = Math.PI - angle
        this.cut_radius = this.radius * Math.sin(this.angle)
    }

    generate_vertices(): math.MathType {
        if (this.angle == 0) {
            return super.generate_vertices()
        }
        let cut_radius = this.cut_radius
        let top_proportion = 0.5
        let bottom_proportion = 0.5
        let top_shape = new Cap(this.radius_2, cut_radius, top_proportion, false)
        let bottom_cap = this.angle > Math.PI / 2
        let bottom_shape = bottom_cap ? new Cap(this.radius, cut_radius, bottom_proportion, false) : new CutSphere(this.radius, cut_radius, bottom_proportion, false)
        top_shape.set_lod(this.LOD)
        bottom_shape.set_lod(this.LOD)
        let top = math.multiply(top_shape.generate_vertices()[0], -1)
        let bottom = bottom_shape.generate_vertices()[0]
        if (bottom_cap) {
            bottom.reverse()
            for (let row = 0; row < math.size(bottom)[0]; ++row) {
                bottom[row].reverse()
                for (let column = 0; column < math.size(bottom)[1]; ++column) {
                    bottom[row][column][1] *= -1
                    bottom[row][column][2] *= -1
                }
            }
        }
        let pole_offset = bottom[bottom.length - 1][0][2]
        bottom = this.reverse_vertices(bottom.map(row => row.map(vertex => math.multiply(math.subtract(vertex, [0, 0, pole_offset]), -1))).reverse())
        let distance = bottom[bottom.length - 1][0][2] + top[top.length - 1][0][2]
        top = this.reverse_vertices(top.map(row => row.map(vertex => math.add(math.multiply(vertex, -1), [0, 0, distance]))).reverse())
        return [top, bottom]
    }
}

export class ThickLens extends BaseLens {
    constructor(radius: number, thickness: number, angle: number) {
        let cos_theta = Math.cos(Math.PI - angle)
        let radius_2 = (2 * radius ** 2 * cos_theta + 2 * radius ** 2 - 2 * radius * thickness * cos_theta - 2 * radius * thickness + thickness ** 2) / (2 * (radius * cos_theta + radius - thickness))
        super(radius, radius_2, angle);
    }
}

export class Lens extends BaseLens {
    constructor(radius: number, angle: number) {
        super(radius, radius, angle);
    }
}

export class RadiusOnlyLens extends BaseLens {
    constructor(radius: number) {
        let angle = Math.acos(1 - 1 / (2 * Math.PI * radius ** 2));
        super(radius / 2, radius / 2, angle);
    }
}

export class BiconvexLens extends BaseLens {
    constructor(radius: number, angle: number, separation: number) {
        super(radius, -radius, angle);
        this.separation = separation;
    }

    generate_vertices(): math.MathType {
        let shape_halves = super.generate_vertices();
        let offset = -(shape_halves[0][shape_halves[0].length - 1][0][2] + shape_halves[1][0][0][2]) / 2;
        shape_halves = shape_halves.map(part => part.map(row => row.map(item => math.add(item, [0, 0, offset]))));
        shape_halves[0] = shape_halves[0].map(row => row.map(item => math.subtract(item, [0, 0, this.separation / 2])));
        shape_halves[1] = shape_halves[1].map(row => row.map(item => math.add(item, [0, 0, this.separation / 2])));
        let side_top_row = this.roll_row(shape_halves[0][0], shape_halves[0][0].length / 2 - 1);
        let side_bottom_row = shape_halves[1][shape_halves[1].length - 1];
        shape_halves.push(this.connect_halves(side_top_row, side_bottom_row, this.cut_radius))
        return shape_halves;
    }
}