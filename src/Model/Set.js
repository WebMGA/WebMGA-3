import * as THREE from 'three';
import {Color, Euler, MeshPhongMaterial, Quaternion, Vector3} from 'three';
import * as math from 'mathjs';
import * as SHAPE from './Shapes.js';
import Model from './Model';
import Parameters from './Parameters';
import {Alert} from 'rsuite';
import colourMap from './ColourMap.json';
import * as tfjs from '@tensorflow/tfjs'

export class Set {
    name;
    shapeType;
    parameters;
    shape;
    orientationType;
    wireframe;
    userColour;
    colourByDirector;
    lod;
    clippingPlanes;
    clipIntersection;
    unitBox;


    positions = [];
    Folded_position = []
    orientations = [];
    elements = [];
    meshes = [];
// materials =[];
    Element = class Element {
        geometries;
        orientation;
        position;
        colourIndex;
        euler;
        quaternion;

        constructor(p, q) {
            this.position = p;
            this.orientation = this.quaternionToUnitVector(q);
            this.euler = new Euler();
            this.euler.setFromQuaternion(q);
            this.colourIndex = 0;
            this.quaternion = q
        }

        quaternionToUnitVector(q) {
            let a = (2 * (q.w * q.y + q.x * q.z));
            let b = (2 * (-q.w * q.x + q.y * q.z));
            let c = (1 - 2 * (q.x ** 2 + q.y ** 2));
            return [a, b, c];
        }

        setColourIndex(i) {
            this.colourIndex = i;
        }

        setGeometries(geoms) {
            this.geometries = geoms;
        }

    }

    constructor(data, cp, ci) {
        this.name = data.name;
        this.orientationType = data.orientationType;
        this.positions = data.positions;
        this.orientations = data.orientations;
        this.unitBox = data.unitBox;
        this.clippingPlanes = cp;
        this.clipIntersection = ci;
        this.setDefaults();

        if (data.shapeType != null) {
            this.shapeType = data.shapeType;
        }
        if (data.parameters != null) {
            this.shapeType = data.parameters;
        }
        if (this.name === null) {
            this.name = this.shapeType;
        }
        this.genSet();
    }

    static getParameters(val) {
        let parameters;

        switch (val) {
            case 'Ellipsoid':
                parameters = Parameters.Ellipsoid;
                break;
            case 'Spherocylinder':
                parameters = Parameters.Spherocylinder;
                break;
            case 'Spheroplatelet':
                parameters = Parameters.Spheroplatelet;
                break;
            case 'Cut Sphere':
                parameters = Parameters.CutSphere;
                break;
            case 'Sphere':
                parameters = Parameters.Sphere;
                break;
            case 'Cylinder':
                parameters = Parameters.Cylinder;
                break;
            case 'Torus':
                parameters = Parameters.Torus;
                break;
            default:
                Alert.error('Error: Unexpected shape identifier');
        }

        return parameters;
    }

    isFoldedTest() {
        let x = this.unitBox[0] / 2;
        let y = this.unitBox[1] / 2;
        let z = this.unitBox[2] / 2;

        for (let i = 0; i < this.positions.length; i++) {
            let a = this.positions[i][0];
            let b = this.positions[i][1];
            let c = this.positions[i][2];
            if (a >= x || a <= -x) {
                return false
            }
            if (b >= y || b <= -y) {
                return false
            }
            if (c >= z || c <= -z) {
                return false
            }

        }
        return true;
    }

    genSet() {
        this.validateData();
        this.genGeometries();
        this.genElements();
        this.setElements();
        this.genMeshes();
        // this.genListBoundingBox();
    }

    validateData() {
        if (this.positions.length !== this.orientations.length) {
            throw new Error('Error: Position data does not correspond to orientation data. \n Total positions: ' + this.positions.length + '\n Total rotations: ' + this.orientations.length);
        }

        for (let p in this.parameters) {
            if (p < 0) {
                throw new Error('Error: Invalid parameter ' + p.toString() + ' for ' + this.name + '\n Must be positive.');
            }
        }

        let defaultParameters = Set.getParameters(this.shapeType);
        if (this.parameters.length !== defaultParameters.vals.length) {
            throw new Error('Error: Wrong number of parameters specified for ' + this.name + '. \n Required: ' + defaultParameters.names);
        }
    }

    setDefaults() {
        this.userColour = new Color("#FFFFFF");
        this.colourByDirector = true;
        this.wireframe = true;
        this.renderBackFace = false;
        this.lod = 2;
        this.shapeType = 'Ellipsoid';
        this.parameters = Parameters.Ellipsoid.vals;
    }

    updateSlicers(i, vals) {
        this.clippingPlanes[2 * i + 1].constant = vals[1];
        this.clippingPlanes[2 * i].constant = -vals[0];
    }

    genUnitBox() {
        // This is the user input unit box of whole
        return this.unitBox;

    }

    genUnfoldPosition() {
        // Place holder function to generate Psedo unfolded configuration
        if (this.isFoldedTest() === false) {
            Alert.info('Model is already unfolded');
            return
        }
        let pos = [];
        let x = this.unitBox[0];
        let y = this.unitBox[1];
        let z = this.unitBox[2];

        for (let i = 0; i < this.positions.length; i++) {
            let rnd1 = (Math.random() * (2) - 1)
            let rnd2 = (Math.random() * (2) - 1)
            let rnd3 = (Math.random() * (2) - 1)
            pos.push([this.positions[i][0] + rnd1 * x, this.positions[i][1] + rnd2 * y, this.positions[i][2] + rnd3 * z])
        }
        this.positions = pos;

    }

    genFoldedPositionFromUnfold() {
        if (this.isFoldedTest() === true) {
            Alert.info('Model is already folded');
            return
        }
        let pos = [];
        let lx = this.unitBox[0];
        let ly = this.unitBox[1];
        let lz = this.unitBox[2];

        for (let i = 0; i < this.positions.length; i++) {
            let rx = this.positions[i][0];
            let ry = this.positions[i][1];
            let rz = this.positions[i][2];

            rx = rx - lx * Math.round(rx / lx);
            ry = ry - ly * Math.round(ry / ly);
            rz = rz - lz * Math.round(rz / lz);

            pos.push([rx, ry, rz])
        }
        this.Folded_position = pos;

    }

    setBackFace(bool) {
        this.renderBackFace = bool;
    }

    genMeshes() {
        let num = this.elements.length;

        let c = '#FFFFFF'
        let mat = new MeshPhongMaterial({
            side: THREE.FrontSide, clipShadows: true, clippingPlanes: this.clippingPlanes, wireframe: this.wireframe
        });
        let gut = new THREE.MeshBasicMaterial({
            side: THREE.BackSide, clipShadows: true, clippingPlanes: this.clippingPlanes, wireframe: this.wireframe
        });

        let Intsancemesh1 = new THREE.InstancedMesh(this.elements[0].geometries[0], mat, num);
        let Instancemesh2 = new THREE.InstancedMesh(this.elements[0].geometries[1], mat, num);
        let Instancemesh3 = new THREE.InstancedMesh(this.elements[0].geometries[2], mat, num);
        for (let i = 0; i < num; i++) {
            if (this.colourByDirector) {
                let rgb = colourMap.values[this.elements[i].colourIndex];
                c = new Color(Model.rgbToHex(...rgb));
            } else {
                c = this.userColour;
            }
            let matrix2 = new THREE.Matrix4();
            const position = new THREE.Vector3();
            position.x = this.elements[i].position[0];
            position.y = this.elements[i].position[1];
            position.z = this.elements[i].position[2];
            let ori = this.elements[i].quaternion
            matrix2.compose(position, ori, new THREE.Vector3(0.5, 0.5, 0.5));
            Intsancemesh1.setMatrixAt(i, matrix2);
            Instancemesh2.setMatrixAt(i, matrix2);
            Instancemesh3.setMatrixAt(i, matrix2);
            Intsancemesh1.setColorAt(i, c);
            Instancemesh2.setColorAt(i, c);
            Instancemesh3.setColorAt(i, c);
        }
        this.meshes.push(Intsancemesh1, Instancemesh2, Instancemesh3);
        console.log(Intsancemesh1)
        if (this.renderBackFace) {

            let Intsancemeshback1 = new THREE.InstancedMesh(this.elements[0].geometries[0], gut, num);
            let Instancemeshback2 = new THREE.InstancedMesh(this.elements[0].geometries[1], gut, num);
            let Instancemeshback3 = new THREE.InstancedMesh(this.elements[0].geometries[2], gut, num);
            for (let i = 0; i < num; i++) {
                if (this.colourByDirector) {
                    let rgb = colourMap.values[this.elements[i].colourIndex];
                    c = new Color(Model.rgbToHex(...rgb));
                }
                let matrix2 = new THREE.Matrix4();
                const position = new THREE.Vector3();
                position.x = this.elements[i].position[0];
                position.y = this.elements[i].position[1];
                position.z = this.elements[i].position[2];
                const scale = new THREE.Vector3();
                scale.x = scale.y = scale.z = Math.random();
                let ori = this.elements[i].quaternion;
                matrix2.compose(position, ori, new THREE.Vector3(0.5, 0.5, 0.5));
                Intsancemeshback1.setMatrixAt(i, matrix2);
                Instancemeshback2.setMatrixAt(i, matrix2);
                Instancemeshback3.setMatrixAt(i, matrix2);
                Intsancemeshback1.setColorAt(i, c);
                Instancemeshback2.setColorAt(i, c);
                Instancemeshback3.setColorAt(i, c);
            }
            this.meshes.push(Intsancemeshback1, Instancemeshback2, Instancemeshback3);

        }

    }

    setElements() {
        let geoms = [];

        for (let elem of this.elements) {
            if (this.shape.isPreset) {
                geoms.push(this.shape.presetGeometry.clone());
            } else {
                geoms.push(this.shape.stripGeometry.clone());
                geoms.push(this.shape.fanGeometries[0].clone());
                geoms.push(this.shape.fanGeometries[1].clone());
            }
            // this.(elem.euler, geoms);
            // this.translate(elem.position, geoms);
            elem.setGeometries(geoms);
            geoms = [];
        }
    }

    genElements() {
        let pos = this.positions
        if (this.Folded_position.length > 0) {
            pos = this.Folded_position;
        }
        for (let i = 0; i < pos.length; i++) {
            this.elements.push(new this.Element(pos[i], this.getRotations(this.orientationType, this.orientations[i])));
        }
        this.director = this.calculateDirector();
        for (let elem of this.elements) {
            elem.setColourIndex(this.calculateColourIndex(elem));
        }
    }

    genGeometries() {
        switch (this.shapeType) {
            case 'Ellipsoid':
                this.shape = new SHAPE.Ellipsoid(...this.parameters);
                console.log(this.parameters)
                break;
            case 'Spherocylinder':
                this.shape = new SHAPE.Spherocylinder(...this.parameters);
                break;
            case 'Spheroplatelet':
                this.shape = new SHAPE.Spheroplatelet(...this.parameters);
                break;
            case 'Cut Sphere':
                this.shape = new SHAPE.CutSphere(...this.parameters);
                break;
            case 'Sphere':
                this.shape = new SHAPE.Preset('Sphere', this.parameters);
                break;
            case 'Cylinder':
                this.shape = new SHAPE.Preset('Cylinder', this.parameters);
                break;
            case 'Torus':
                this.shape = new SHAPE.Preset('Torus', this.parameters);
                break;
            default:
                throw new Error('Error: unexpected shape identifier. \n Found: ' + this.shapeType);
        }

        this.shape.LOD = this.lod;
        this.shape.generate();

    }

    translate(pos, geoms) {
        for (let g of geoms) {
            g.translate(2 * pos[0], 2 * pos[1], 2 * pos[2]);
        }
    }

    getRotations(type, rot) {
        let q = new Quaternion();
        switch (type) {
            case 'v':
                let orientationVector = new Vector3(rot[0], rot[1], rot[2])
                orientationVector.normalize();
                q.setFromUnitVectors(new Vector3(0, 0, 1), orientationVector);
                break;
            case 'q':
                q.set(rot[1], rot[2], rot[3], rot[0]);
                break;
            case 'a':
                q.setFromAxisAngle(new Vector3(rot[0], rot[1], rot[2]), rot[3]);
                break;
            case 'e':
                let e = new Euler();
                e.fromArray(rot);
                q.setFromEuler(e)
                break;
            default:
                throw new Error('Error: Unexpected rotation type value. \n Found: ' + type + '\n Expected: v | q | a | e');
        }

        q.normalize();

        return q;

    }

    calculateDirector() {
        if (this.elements.length === 0) {
            Alert.error('Error: No elements in set, director calculation failed.');
            return;
        }
        //TODO sort out libraries?
        let summed_products = tfjs.zeros([3, 3]);
        for (let molecule_orientation of this.elements.map(molecule => tfjs.tensor1d(molecule.orientation))) {
            summed_products = summed_products.add(tfjs.outerProduct(molecule_orientation, molecule_orientation));
        }
        let half_identity = tfjs.eye(3).div(2);
        let order_tensor = summed_products.mul(3 / (2 * this.elements.length)).sub(half_identity);
        // let sums = math.zeros([3, 3])
        // for (let molecule_orientation of this.elements.map(molecule => math.reshape(math.matrix(molecule.orientation), [3, 1]))) {
        //     sums = math.add(sums, math.multiply(molecule_orientation, math.transpose(molecule_orientation)))
        // }
        // const half_identity = math.divide(math.identity(3), 2)
        // let order_tensor = math.subtract(math.multiply(sums, 3 / (2 * this.elements.length)), half_identity)
        let eigen = math.eigs(order_tensor.arraySync());
        let un_normalised_director = tfjs.tensor(eigen.vectors[tfjs.argMax(eigen.values).dataSync()]);
        return un_normalised_director.div(un_normalised_director.norm())
    }

    calculateColourIndex(element) {
        // TODO I DO NOT LIKE THIS BIT but inherited from older code
        let temp_orientation = element.orientation;
        if (this.orientationType === 'v') {
            let temp = temp_orientation[0];
            temp_orientation[0] = temp_orientation[1];
            temp_orientation[1] = temp;
        }

        let orientation = tfjs.tensor1d(temp_orientation)
        orientation = orientation.div(orientation.norm())
        let scalar_product = tfjs.dot(orientation, this.director).abs()

        let n = colourMap.values.length - 1;
        return Math.round(scalar_product.acos().mul(2 * n / Math.PI).dataSync());

    }

    setUserColour(hex) {
        this.userColour = new Color(hex);
    }
}

export default Set;