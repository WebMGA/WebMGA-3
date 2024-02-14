import {
    BufferGeometry,
    Color,
    Euler,
    InstancedMesh,
    Line,
    LineBasicMaterial,
    Matrix4,
    MeshPhongMaterial,
    OrthographicCamera,
    PerspectiveCamera,
    Plane,
    PlaneHelper,
    Quaternion,
    Scene,
    Vector3,
    WebGLRenderer
} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import Set from './Set'
import LightNew from './Light'
import ReferenceTools from './ReferenceTools'
import {Alert} from 'rsuite'
import * as SHAPE from './Shapes';


export class Model extends Scene {
    sets = [];

    scene;
    camera;
    lighting;
    bgColour;
    controls;
    lookAt;
    tools;
    renderer;

    height;
    width;
    axesEnabled = false;


    sidebarExpanded = false;

    cameraType = 'perspective';
    cameraPosition;

    selectedSet;
    clippingPlanes;
    clippingHelpers;
    numOfObject;
    axes: Line[] = [];
    axes_enabled: boolean = false;
    colour_axes: boolean = true;
    lod: number = SHAPE.Shape.default_lod;

    constructor(chronometer, notify) {
        super();
        this.scene = this;
        this.chronometer = chronometer;
        this.setDefault();
        this.notify = notify;

    }

    onBeforeRender = () => {
        this.set_axes();
    };

    /* GENERAL FUNCTIONS */

    static rgbToHex(r, g, b) {
        function componentToHex(c) {
            let hex = c.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }

        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    setDefault() {

        this.renderer = new WebGLRenderer({
            antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.rotating = false;
        this.lightHelperWarningGiven = false;
        this.selectedSet = 0;
        this.Video_sample_list = [];
        this.initClippers();
        this.lookAt = new Vector3(0, 0, 0);
        this.updateDimensions();
        this.setCamera(this.cameraType, true);
        this.lighting = [new LightNew(LightNew.light_types.AMBIENT), new LightNew(LightNew.light_types.DIRECTIONAL), new LightNew(LightNew.light_types.POINT)];

        this.tools = new ReferenceTools(50, 0xffffff);
        this.bgColour = "#000000";
        this.renderer.setClearColor(this.bgColour);

        for (let l of this.lighting) {
            this.scene.add(l.light);
        }
        this.scene.add(this.camera);
        this.lod = SHAPE.Shape.default_lod;
    }

    set_axes(enabled: boolean = this.axes_enabled, scale: number = 200, camera: PerspectiveCamera | OrthographicCamera = this.camera, sets: Set[] = this.sets, axes_origin: Vector3 = new Vector3(450, -250, 0), scene: Scene = this.scene, colour_axes: boolean = this.colour_axes): void {
        console.assert(scale > 0)
        console.log(camera.zoom)
        //Remove existing lines from scene
        if (typeof this.axes !== typeof undefined) {
            for (let axis of this.axes) {
                scene.remove(axis);
            }
        }
        if (!enabled) {
            return;
        }
        scale /= camera.zoom;
        axes_origin.divideScalar(camera.zoom);
        //Construct line parameters
        let world_axes_origin: Vector3 = camera.localToWorld(axes_origin);
        let axis_line_ends: Vector3[] = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
        let director_line_ends: Vector3[] = sets.map(set => set.director).map(director => new Vector3(director[0], director[1], -director[2]));
        let line_ends: Vector3[] = axis_line_ends.concat(director_line_ends);
        //Build line materials
        let line_materials: LineBasicMaterial[] = line_ends.map(line_end => new LineBasicMaterial({color: this.colour_from_director(line_end, colour_axes)}));
        //Build line geometries
        let line_geometries: BufferGeometry[] = line_ends.map(line_end => new BufferGeometry().setFromPoints([world_axes_origin, world_axes_origin.clone().add(line_end.multiplyScalar(scale))]));
        //Build line objects
        let axes: Line[] = line_geometries.map((line_geometry, i) => new Line(line_geometry, line_materials[i]));
        //Add lines to scene
        for (let axis of axes) {
            scene.add(axis);
        }
        //Store lines
        this.axes = axes;
    }

    colour_from_director(vector: Vector3, enable_colour: boolean = true, palette_start: number = 4 * Math.PI / 3, palette_range: number = -2 / 3, sets: Set[] = this.sets): Color {
        console.assert(0 <= palette_start && palette_start < 2 * Math.PI);
        console.assert(-1 <= palette_range && palette_range <= 1);
        console.assert(sets.length > 0);
        let hue: number = 0;
        let lightness: number = 1;
        //Update hue if director present
        if (enable_colour && sets.length > 0) {
            //TODO handle multiple directors and director should be stored as vec3 in first place
            let director: number[] = sets[0].director;
            let director_vector: Vector3 = new Vector3(director[0], director[1], -director[2]);
            //Set hue based on angle between director and vector
            //TODO properly check rather than min
            let angle: number = Math.acos(Math.min(director_vector.dot(vector.normalize()), 1));
            console.assert(0 <= angle && angle <= Math.PI);
            if (angle > Math.PI / 2) {
                angle = Math.PI - angle;
            }
            console.assert(0 <= angle && angle <= Math.PI / 2);
            hue = (palette_start + (angle * 4) * palette_range) % (2 * Math.PI) / (2 * Math.PI);
            lightness = 0.5;
        }
        console.assert(0 <= hue && hue <= 1);
        console.assert(0 <= lightness && lightness <= 1);
        return new Color().setHSL(hue, 1, lightness);
    }

    update() {
        console.log('update called');
        this.renderer.render(this.scene, this.camera);
        if (!this.rotating) {
            this.chronometer.click();
        }

    }

    // occlusionCulling(){

    // const renderer = new WebGLRenderer();
    // const gl = renderer.getContext();
    // console.log(gl)
    // const scene = new Scene();
    // const mesh1 = new Mesh(new BoxGeometry( 1, 1, 1 ), new MeshBasicMaterial( {color: 0x00ff00}));
    // const mesh2 = new Mesh(new BoxGeometry( 1, 1, 1 ), new MeshBasicMaterial( {color: 0x00ff00}));
    // scene.add(mesh1, mesh2);
    // var query = gl.createQuery();
    // const camera = this.camera = new PerspectiveCamera(50, this.width / this.height, 0.1, 1000);

    // camera.position.z = 5;
    // for (let l of this.lighting) {
    //     scene.add(l.light);}
    // gl.beginQuery(gl.ANY_SAMPLES_PASSED,query);
    // renderer.render(scene, camera);
    // gl.endQuery(gl.ANY_SAMPLES_PASSED,query);
    // var result = gl.getQueryParameter(query,gl.QUERY_RESULT);
    // console.log(Number(result));
    // console.log(result)

    getRender_Object_number() {
        let num = 0;
        this.scene.traverse(function (child) {
            //@ts-ignore
            if (child.isMesh) {
                num = num + 1;
            }

        });

        this.numOfObject = (num - 6);
        console.log(this.numOfObject)
    }

    getData() {
        // To save config to download
        let model = {};
        let temp = {};
        model.sets = [];
        for (let set of this.sets) {
            temp.name = set.name;
            temp.orientationType = set.orientationType;
            temp.positions = set.positions;
            temp.orientations = set.orientations;
            temp.unitBox = set.unitBox;
            model.sets.push(temp);
            temp = {};
        }
        return model;
    }

    toggleSidebar() {
        this.sidebarExpanded = !this.sidebarExpanded;
        this.updateDimensions();
        this.updateCamera();
        console.log(this.sidebarExpanded)
    }

    toggleAutorotate() {
        this.controls.autoRotate = !this.controls.autoRotate;
        this.rotating = !this.rotating;
    }

    getParameters(val) {
        return Set.getParameters(val);
    }

    /* UPDATING SETS FUNCTIONS */

    updateSets(id, params, f) {
        for (const m of this.sets[id].meshes) {
            this.scene.remove(m);
            // m.geometry.dispose();
            // m.material.dispose();
            // m.dispose();
        }
        f(...params);
        for (const m of this.sets[id].meshes) {
            this.scene.add(m);
        }
        // let mesh = this.occlusionCulling();
        // this.scene.add(mesh);
    }

    updateUserColour(id, colour) {
        this.updateSets(id, [id, colour], (id, colour) => {
            this.sets[id].meshes = [];
            this.sets[id].setUserColour(Model.rgbToHex(colour.r, colour.g, colour.b));
            this.sets[id].genMeshes();
        });
    }

    updateShape(id, shape, parameters) {
        this.updateSets(id, [id, shape, parameters], (id, shape, parameters) => {
            this.sets[id].meshes = [];
            this.sets[id].shapeType = shape;
            this.sets[id].parameters = parameters.vals;
            this.sets[id].genMeshes();
        });
    }

    toggleWireframe(id, toggle) {
        this.updateSets(id, [id, toggle], (id, toggle) => {
            this.sets[id].meshes = [];
            this.sets[id].wireframe = toggle;
            this.sets[id].genMeshes();
        });
    }

    toggleUserColour(id, toggle) {
        this.updateSets(id, [id, toggle], (id, toggle) => {
            this.sets[id].meshes = [];
            this.sets[id].colourByDirector = toggle;
            this.sets[id].genMeshes();
        });
    }

    genSets(sets) {
        for (let set of this.sets) {
            for (const m of set.meshes) {
                this.scene.remove(m);
                // m.geometry.dispose();
                // m.material.dispose();
                // m.dispose();
            }
        }
        this.sets = [];
        for (let setData of sets) {
            this.sets.push(new Set(setData, this.clippingPlanes, this.clippingIntersections));
        }
        for (let set of this.sets) {
            for (const m of set.meshes) {
                this.scene.add(m);
            }
        }
        this.getRender_Object_number();

    }

    /* LOD FUNCTIONS */
    updateLOD(val) {
        this.lod = val;
        for (let i = 0; i < this.sets.length; i++) {
            this.updateSets(i, [i, val], (i, val) => {
                this.sets[i].lod = val;
                this.sets[i].meshes = [];
                this.sets[i].genMeshes();
            });
        }
    }


    /* CAMERA AND PROJECTION FUNCTIONS */

    updateDimensions() {

        this.height = (window.innerHeight - 56);

        if (this.sidebarExpanded) {
            this.width = window.innerWidth - 356;
            console.log('sidebar')
        } else {
            this.width = window.innerWidth - 56;
        }
        this.renderer.setSize(this.width, this.height);
    }

    setCamera(type) {
        console.log('set camera called')
        if (this.camera) {
            this.camera = '';
        }
        this.cameraType = type;
        if (type === 'perspective') {
            this.camera = new PerspectiveCamera(50, this.width / this.height, 0.1, 1000);
        } else {
            this.camera = new OrthographicCamera(this.width / -2, this.width / 2, this.height / 2, this.height / -2, -100, 5000);
        }

        if (this.cameraPosition != null) {
            this.camera.position.set(...this.cameraPosition);
        }
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target = this.lookAt;
        // this.update();


    }

    updateCamera() {
        if (this.cameraType === 'perspective') {
            this.camera.aspect = this.width / this.height;
        } else {
            this.camera.left = this.width / -2;
            this.camera.right = this.width / 2;
            this.camera.top = this.height / 2;
            this.camera.bottom = this.height / -2;
        }
        this.camera.updateProjectionMatrix();
        this.update();
    }

    updateCameraZoom(val) {
        this.camera.zoom = val;
        this.camera.updateProjectionMatrix();
    }

    updateCameraPosition(p) {
        this.cameraPosition = [p.x, p.y, p.z];
        this.camera.position.set(p.x, p.y, p.z);
        this.controls.update();
    }

    updateLookAt(l) {
        this.lookAt = new Vector3(l.x, l.y, l.z);
        this.controls.target = this.lookAt;
        this.controls.update();

    }

    /* AMBIENT AND LIGHT FUNCTIONS */

    updateBg(colour) {
        this.bgColour = colour;
        this.renderer.setClearColor(this.bgColour);
    }

    updateLight(type, colour) {
        this.lighting[type].updateColour(Model.rgbToHex(colour.r, colour.g, colour.b), colour.i);
        if (type !== 0) {
            this.lighting[type].helper.update();
        }
    }

    toggleLightHelper(type, toggle) {
        if (toggle) {
            if (this.bgColour === '#ffffff' && !this.lightHelperWarningGiven) {
                Alert.warning('If the background colour and light colour are the same, the light helper may not be visible.');
                this.lightHelperWarningGiven = true;
            }
            this.lighting[type].helper.update();
            this.scene.add(this.lighting[type].helper);
        } else {
            this.scene.remove(this.lighting[type].helper);
        }
    }

    updateLightPosition(type, pos) {
        this.lighting[type].updatePosition(pos.x, pos.y, pos.z);
        this.lighting[type].helper.update();
    }

    /* PERIODIC BOUNDING TOOL FUNCTIONS */

    toggleFoldState(id, toggle) {
        if (toggle === true) {
            this.updateSets(id, [id], (id) => {
                this.sets[id].elements = [];
                this.sets[id].meshes = [];
                this.sets[id].genFoldedPositionFromUnfold();
                this.sets[id].genElements();
                this.sets[id].genMeshes();
            });
        } else if (toggle === false) {
            this.updateSets(id, [id], (id) => {
                this.sets[id].elements = [];
                this.sets[id].meshes = [];
                this.sets[id].Folded_position = [];
                this.sets[id].genElements();
                this.sets[id].genMeshes();
            });
        }
    }

    // toggleUnfoldState(id,toggle){
    //     if(toggle){
    //         this.updateSets(id, [id], (id) => {
    //             this.sets[id].elements =[];
    //             this.sets[id].meshes = [];
    //             this.sets[id].genUnfoldPosition();
    //             this.sets[id].genElements();
    //             this.sets[id].genMeshes();
    //         });
    //     }
    //     else if(toggle == false){
    //         this.updateSets(id, [id], (id) => {
    //             this.sets[id].elements =[];
    //             this.sets[id].meshes = [];
    //             this.sets[id].genFoldedPositionFromUnfold();
    //             this.sets[id].genElements();
    //             this.sets[id].genMeshes();
    //         });
    //     }
    //}


    /* REFERENCE TOOLS FUNCTIONS */
    toggleAxes() {
        this.axesEnabled = !this.axesEnabled;

        if (this.axesEnabled) {
            for (let a of this.tools.axes) {
                this.scene.add(a);
            }
        } else {
            for (let a of this.tools.axes) {
                this.scene.remove(a);
            }
        }


    }

    toggle_axes_enabled() {
        this.axes_enabled = !this.axes_enabled;
        this.update();
    }

    toggle_axes_colour() {
        this.colour_axes = !this.colour_axes;
        this.update();
    }

    toggleAxesMulticolour() {
        let passAxes = false;
        if (this.axesEnabled) {
            this.toggleAxes();
            passAxes = true;
        }
        this.tools.toggleMulticolour(this.sets[0].director);
        if (passAxes) {
            this.toggleAxes();
        }
    }

    updateBoundingShape(type, enabled) {
        this.boundingShapeEnabled = enabled;
        this.scene.remove(this.tools.boundingShape);
        if (enabled) {
            this.scene.add(this.tools.genBoundingShape(type, this.sets));
        }
    }


    /* SLICING FUNCTIONS */
    enableClipping(toggle, id) {
        if (toggle === true) {
            this.renderer.localClippingEnabled = true;
            for (let x = 0; x < this.sets.length; x++) {
                this.updateSets(x, [x], (x) => {
                    this.sets[x].elements = [];
                    this.sets[x].meshes = [];
                    this.sets[x].setBackFace(true);
                    this.sets[x].genElements();
                    this.sets[x].genMeshes();
                });
            }

        } else {
            this.renderer.localClippingEnabled = false;

        }


    }

    // disableClipping(){
    //     this.renderer.localClippingEnabled = false;
    // }

    initClippers() {
        this.clippingIntersections = false;


        this.clippingPlanes = [new Plane(new Vector3(1, 0, 0), 180), new Plane(new Vector3(-1, 0, 0), 180), new Plane(new Vector3(0, 1, 0), 180), new Plane(new Vector3(0, -1, 0), 180), new Plane(new Vector3(0, 0, 1), 180), new Plane(new Vector3(0, 0, -1), 180)];

        this.clippingHelpers = [new PlaneHelper(this.clippingPlanes[0], 100, 0xff0000), new PlaneHelper(this.clippingPlanes[1], 100, 0xff0000), new PlaneHelper(this.clippingPlanes[2], 100, 0x00ff00), new PlaneHelper(this.clippingPlanes[3], 100, 0x00ff00), new PlaneHelper(this.clippingPlanes[4], 100, 0x0000ff), new PlaneHelper(this.clippingPlanes[5], 100, 0x0000ff)];

        for (let helper of this.clippingHelpers) {
            helper.visible = false;
            this.scene.add(helper);
        }


    }


    // }
    toggleHelper(i, toggle) {
        this.clippingHelpers[2 * i].visible = toggle;
        this.clippingHelpers[2 * i + 1].visible = toggle;
    }

    updateSlicer(i, vals) {
        for (let set of this.sets) {
            set.updateSlicers(i, vals);
        }
    }

    /* Video SUITE */
    uploadConfig() {
        return new Promise(async (resolve, reject) => {
            let fileHandle = [];
            let lst = [];
            try {
                fileHandle = await window.showOpenFilePicker({multiple: true});
                for (let i = 0; i < fileHandle.length; i++) {
                    const file = await fileHandle[i].getFile();
                    lst.push(file);
                }
                this.Video_sample_list = lst;
                resolve(lst);
            } catch (error) {
                reject(error);
            }
        });
    }

    notifyFinishUpload() {
        this.notify('info', `Files loaded successfully`, (<div>
            <p style={{width: 320}}>
                Now Select Your Video Viewing configuration!
                You can show unit box, apply slicing , periodic boundary conditions etc.
                Please Do not change screen size while generating Video e.g dont click on size bar
            </p>
        </div>));
    }


    retrieveVideoSample() {
        return this.Video_sample_list;
    }

    /* PERFORMANCE TEST SUITE */


    initTesting(step) {
        // set desirable testing view
        this.setCamera('orthographic', false);
        this.updateCameraZoom(8);
        this.updateLightPosition(2, {x: 50, y: 0, z: 50});
        this.deleteAllMeshes();
        this.testMaterial = new MeshPhongMaterial({wireframe: false});
        // this.testShape = new SHAPE.Preset('Sphere', ...Parameters.Sphere.vals);
        this.testShape = new SHAPE.Spheroplatelet(0.3, 0.2);
        console.log('this.genshape');
        this.testShape.LOD = 2;
        this.testShape.generate();
        this.testTotal = 0;
        this.testLimit = 140001;

        let geoms = [];
        geoms.push(this.testShape.stripGeometry.clone());
        this.testGeo = geoms;

        this.translate([Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50], geoms);

        this.notify('info', 'Initialising Performance Test', (<p style={{width: 320}}>
            Test Size: {this.testLimit.toString()} <br/>
            Step: {step.toString()} <br/>
            Shape: Spheroplatelet(0.3,0.2) <br/>
            Level of Detail: {(this.testShape.LOD + 1).toString()} <br/>
            Material: MeshPhongMaterial
            <br/> <br/>
            <b>Please do not change any settings while the performance test is running!</b>
        </p>));

        console.log('Material: MeshLambertMaterial')
        console.log('Shape: Spheroplatelet (Default Parameters)')
        console.log('LOD: ' + (this.testShape.LOD + 1).toString())
        console.log('Test Size: ' + this.testLimit.toString())
        console.log('Test Step: ' + step.toString());
    }

    deleteAllMeshes() {
        for (const set of this.sets) {
            console.log(set)
            for (const m of set.meshes) {
                this.scene.remove(m);
                // m.geometry.dispose();
                // m.material.dispose();
                // m.dispose();
            }

        }

    }

    addRandomParticles(n) {
        this.deleteAllMeshes();
        console.log('add called')
        this.testTotal += n;

        if (this.testTotal >= this.testLimit) {
            return true;
        }
        // let m;
        // for (let i = 0; i < n; i++) {
        //     for (let g of this.testGeo) {
        //          m = new Mesh(g, this.testMaterial);
        //         this.scene.add(m);
        //     }}

        let InstancedMesh1 = new InstancedMesh(this.testGeo[0], this.testMaterial, n);
        let InstancedMesh2 = new InstancedMesh(this.testGeo[1], this.testMaterial, n);
        let InstancedMesh3 = new InstancedMesh(this.testGeo[2], this.testMaterial, n);
        console.log(InstancedMesh1);
        for (let i = 0; i < n; i++) {
            console.log('called')
            const matrix = new Matrix4();
            const position = new Vector3();
            const rotation = new Euler();
            const quaternion = new Quaternion();
            const scale = new Vector3();
            const color = new Color();
            position.x = Math.random() * 40 - 20;
            position.y = Math.random() * 40 - 20;
            position.z = Math.random() * 40 - 20;

            rotation.x = Math.random() * 2 * Math.PI;
            rotation.y = Math.random() * 2 * Math.PI;
            rotation.z = Math.random() * 2 * Math.PI;

            quaternion.setFromEuler(rotation);

            scale.x = scale.y = scale.z = Math.random();

            matrix.compose(position, quaternion, scale);
            InstancedMesh1.setMatrixAt(i, matrix);
            InstancedMesh2.setMatrixAt(i, matrix);
            InstancedMesh3.setMatrixAt(i, matrix);
            InstancedMesh1.setColorAt(i, color.setHex(0xffffff * Math.random()));
            InstancedMesh2.setColorAt(i, color.setHex(0xffffff * Math.random()));
            InstancedMesh3.setColorAt(i, color.setHex(0xffffff * Math.random()));
        }
        this.scene.add(InstancedMesh1, InstancedMesh2, InstancedMesh3);
        this.update();
        return false;
    }

    translate(pos, geoms) {
        for (let g of geoms) {
            g.translate(pos[0], pos[1], pos[2]);
        }
    }

}


export default Model;
