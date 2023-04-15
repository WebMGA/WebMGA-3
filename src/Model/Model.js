import {
    Scene,
    WebGLRenderer,
    PerspectiveCamera,
    OrthographicCamera,
    Vector3,
    PlaneHelper,
    Plane,
    MeshLambertMaterial,
    Mesh,
    Quaternion,
    MeshBasicMaterial,
    InstancedMesh,
    BoxGeometry,
    Euler,
    Matrix4,
    Color
  
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Set from './Set.js'
import Light from './Light.js'
import ReferenceTools from './ReferenceTools.js'
import { Alert } from 'rsuite'
import * as SHAPE from './Shapes.js';
import Parameters from './Parameters';
import { forEach } from 'mathjs';



export class Model {
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

    gridEnabled = false;
    axesEnabled = false;
    
    
    sidebarExpanded = false;

    cameraType = 'perspective';
    cameraPosition;

    selectedSet;

    planeConstants;
    clippingPlanes;
    clippingHelpers;
    clipIntersections;
    numOfObject;

    constructor(chronometer, notify) {
        this.scene = new Scene();
        this.chronometer = chronometer;
        this.setDefault();
        this.notify = notify;
       
    }

    /* GENERAL FUNCTIONS */

    setDefault() {
        
        this.renderer = new WebGLRenderer({ antialias: false,powerPreference: "high-performance",preserveDrawingBuffer:true});
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.videoFileloaded =true;
        this.rotating = false;
        this.cameraPostion = null;
        this.lightHelperWarningGiven = false;
        this.selectedSet = 0;
        this.Video_sample_list=[];
        this.clock = null;
        this.initClippers();
        this.lookAt = new Vector3(0, 0, 0);
        this.updateDimensions();
        this.setCamera(this.cameraType,true); 
        this.lighting = [
            new Light('ambient'),
            new Light('directional'),
            new Light('point')];

        this.tools = new ReferenceTools(50, 0xffffff);
        this.bgColour = "#000000";
        this.renderer.setClearColor(this.bgColour);

        for (let l of this.lighting) {
            this.scene.add(l.light);
        }
        this.scene.add(this.camera);
        this.lod = 2;
    }
  
    update() {
        console.log('update called');
        this.renderer.render(this.scene, this.camera);
        if (!this.rotating) {
            this.chronometer.click();
        }
    }
    getRender_Object_number(){
        let num =0;
        this.scene.traverse( function(child) {
             //@ts-ignore
            if ( child.isMesh){
                num = num+1;
            };
        } );
       
        this.numOfObject = (num-6);
        console.log(this.numOfObject)
    }
    occlusionCulling(){
         
    const renderer = new WebGLRenderer();
    const gl = renderer.getContext();
    console.log(gl)
    const scene = new Scene();
    const mesh1 = new Mesh(new BoxGeometry( 1, 1, 1 ), new MeshBasicMaterial( {color: 0x00ff00}));
    const mesh2 = new Mesh(new BoxGeometry( 1, 1, 1 ), new MeshBasicMaterial( {color: 0x00ff00}));
    scene.add(mesh1, mesh2);
    var query = gl.createQuery();
    const camera = this.camera = new PerspectiveCamera(50, this.width / this.height, 0.1, 1000);
      
    camera.position.z = 5;
    for (let l of this.lighting) {
        scene.add(l.light);}
    gl.beginQuery(gl.ANY_SAMPLES_PASSED,query);
    renderer.render(scene, camera);
    gl.endQuery(gl.ANY_SAMPLES_PASSED,query);
    var result = gl.getQueryParameter(query,gl.QUERY_RESULT);
    console.log(Number(result));
    console.log(result)






    
      
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

    static rgbToHex(r, g, b) {
        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    loadDeprecated(data) {
        // placeholder FILE IO used for initial development
        let particleSets = data.split("$");
        let setData, ps;
        for (let particleSet of particleSets) {
            if (particleSet === "") {
                return;
            }
            else {
                setData = particleSet.split("\n");
                ps = new Set(setData[0], setData[1], setData.slice(2), this.clippingPlanes, this.clippingIntersections);
                this.sets.push(ps);
            }
        }
        for (let set of this.sets) {
            for (const m of set.meshes) {
                this.scene.add(m);
            }
        }
    }

    /* UPDATING SETS FUNCTIONS */

    updateSets(id, params, f) {
        for (const m of this.sets[id].meshes) {
            this.scene.remove(m);
            m.geometry.dispose();
            m.material.dispose(); 
            m.dispose();
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
            this.sets[id].genGeometries();
            this.sets[id].setElements();
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
                m.geometry.dispose ();
                m.material.dispose ();
                m.dispose();
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

    getLOD() {
        return this.lod;
    }

    updateLOD(val) {
        this.lod = val;
        for (let i = 0; i < this.sets.length; i++) {
            this.updateSets(i, [i, val], (i, val) => {
                this.sets[i].lod = val;
                this.sets[i].meshes = [];
                this.sets[i].genGeometries();
                this.sets[i].setElements();
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
        if(this.camera){
            this.camera='';
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
            this.camera.left = this.width / - 2;
            this.camera.right = this.width / 2;
            this.camera.top = this.height / 2;
            this.camera.bottom = this.height / - 2;
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

    toggleLight(type, enabled) {
        this.lighting[type].visible = enabled;
    }

    updateLight(type, colour) {
        this.lighting[type].updateColour(Model.rgbToHex(colour.r, colour.g, colour.b), colour.i);
        if (type != 0) {
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

    toggleFoldState(id,toggle){
        if(toggle===true){
            this.updateSets(id, [id], (id) => {
                this.sets[id].elements =[];
                this.sets[id].meshes = [];
                this.sets[id].genFoldedPositionFromUnfold();
                this.sets[id].genElements();
                this.sets[id].setElements();
                this.sets[id].genMeshes();
            });}
        else if(toggle === false){
            this.updateSets(id, [id], (id) => {
                this.sets[id].elements =[];
                this.sets[id].meshes = [];
                this.sets[id].Folded_position =[];
                this.sets[id].genElements();
                this.sets[id].setElements();
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
    //             this.sets[id].setElements();
    //             this.sets[id].genMeshes();
    //         });
    //     }
    //     else if(toggle == false){
    //         this.updateSets(id, [id], (id) => {
    //             this.sets[id].elements =[];
    //             this.sets[id].meshes = [];
    //             this.sets[id].genFoldedPositionFromUnfold();
    //             this.sets[id].genElements();
    //             this.sets[id].setElements();
    //             this.sets[id].genMeshes();
    //         });
    //     }
    //}



    /* REFERENCE TOOLS FUNCTIONS */

    toggleGrid() {
        this.gridEnabled = !this.gridEnabled;

        if (this.gridEnabled) {
            this.scene.add(this.tools.subGrid);
        } else {
            this.scene.remove(this.tools.subGrid);
        }
    }

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

    updateReferenceColour(rgb) {
        let passGrid = false;
        let passAxes = false;
        let passShape = false;
        if (this.gridEnabled) {
            this.toggleGrid();
            passGrid = true;
        }
        if (this.axesEnabled && !this.tools.multicolour) {
            this.toggleAxes();
            passAxes = true;
        }
        if (this.boundingShapeEnabled) {
            this.updateBoundingShape('', false);
            passShape = true;
        }
        this.tools.updateColour(Model.rgbToHex(rgb.r, rgb.g, rgb.b));
        if (passGrid) {
            this.toggleGrid();
        }
        if (passAxes) {
            this.toggleAxes();
        }
        if (passShape) {
            this.updateBoundingShape(this.tools.boundingShapeType, true);
            passShape = true;
        }
    }

    toggleAxesMulticolour() {
        let passAxes = false;
        if (this.axesEnabled) {
            this.toggleAxes();
            passAxes = true;
        }
        this.tools.toggleMulticolour();
        if (passAxes) {
            this.toggleAxes();
        }
    }

    updateGridSize(size) {
        let passGrid = false;
        let passAxes = false;
        if (this.gridEnabled) {
            this.toggleGrid();
            passGrid = true;
        }
        if (this.axesEnabled) {
            this.toggleAxes();
            passAxes = true;
        }

        this.tools.updateSize(size);

        if (passGrid) {
            this.toggleGrid();
        }
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
    enableClipping(toggle,id){
        if (toggle === true){
            this.renderer.localClippingEnabled = true;
            this.updateSets(id, [id], (id) => {
                this.sets[id].elements =[];
                this.sets[id].meshes = [];
                this.sets[id].setBackFace(true);
                this.sets[id].genElements();
                this.sets[id].setElements();
                this.sets[id].genMeshes();
            });
        }
        else{
            this.renderer.localClippingEnabled = false;
            // if (this.sets){
            //     console.log('called')
            //     this.updateSets(id, [id], (id) => {
            //         this.sets[id].elements =[];
            //         this.sets[id].meshes = [];
            //         this.sets[id].setBackFace(false);
            //         this.sets[id].genElements();
            //         this.sets[id].setElements();
            //         this.sets[id].genMeshes();
            //     });
            // }
            
        }
        
      
    }

    // disableClipping(){
    //     this.renderer.localClippingEnabled = false;
    // }

    initClippers() {
        this.clippingIntersections = false;
        
   
        this.clippingPlanes = [
            new Plane(new Vector3(1, 0, 0), 180),
            new Plane(new Vector3(-1, 0, 0), 180),
            new Plane(new Vector3(0, 1, 0), 180),
            new Plane(new Vector3(0, -1, 0), 180),
            new Plane(new Vector3(0, 0, 1), 180),
            new Plane(new Vector3(0, 0, -1), 180)
        ];
       
       this.clippingHelpers = [
        new PlaneHelper(this.clippingPlanes[0], 100, 0xff0000),
        new PlaneHelper(this.clippingPlanes[1], 100, 0xff0000),
        new PlaneHelper(this.clippingPlanes[2], 100, 0x00ff00),
        new PlaneHelper(this.clippingPlanes[3], 100, 0x00ff00),
        new PlaneHelper(this.clippingPlanes[4], 100, 0x0000ff),
        new PlaneHelper(this.clippingPlanes[5], 100, 0x0000ff)];

        for (let helper of this.clippingHelpers) {
            helper.visible = false;
            this.scene.add(helper);
        }

        
    }


    
    // }
    toggleClipIntersection(toggle) {
        for (let set of this.sets) {
            set.toggleClipIntersection(toggle);
        }
    }

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
    setloaded(toggle){
        console.log(toggle);
    }
    uploadConfig() {
        return new Promise(async (resolve, reject) => {
          let fileHandle = [];
          let lst = [];
          try {
            fileHandle = await window.showOpenFilePicker({ multiple: true });
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

    notifyFinishUpload(){
        this.notify('info', `Files loaded successfully`,
            (<div>
            <p style={{ width: 320 }} >
                Now Select Your Video Viewing configuration!
                You can show unit box, apply slicing , periodic boundary conditions etc.
                Please Do not change screen size while generating Video e.g dont click on size bar
            </p>
            </div>
            ));
            }
    

    retrieveVideoSample(){
        return this.Video_sample_list;
    }
   removeVideoSample(){
    delete this.Video_sample_list;
   }
    /* PERFORMANCE TEST SUITE */


    initTesting(step) {
        // set desirable testing view
        this.setCamera('orthographic',false);
        this.updateCameraZoom(8);
        this.updateLightPosition(2, { x: 50, y: 0, z: 50 });

        this.deleteAllMeshes();

        this.testMaterial = new MeshLambertMaterial();
        this.testShape = new SHAPE.Preset('Torus', Parameters.Torus.vals);
        this.testShape.LOD = 2;
        this.testShape.generate();
        this.testTotal = 50000;
        this.testLimit = 1000000;

        this.notify('info', 'Initialising Performance Test',
            (<p style={{ width: 320 }} >
                Test Size: {this.testLimit.toString()} <br />
            Step: {step.toString()} <br />
            Shape: Torus (Default Parameters) <br />
            Level of Detail: {(this.testShape.LOD + 1).toString()} <br />
            Material: MeshPhongMaterial
                <br/> <br/>
            <b>Please do not change any settings while the performance test is running!</b>
            </p>));

        console.log('Material: MeshLambertMaterial')
        console.log('Shape: Ellipsoid (Default Parameters)')
        console.log('LOD: ' + (this.testShape.LOD + 1).toString())
        console.log('Test Size: ' + this.testLimit.toString)
        console.log('Test Step: ' + step.toString());
    }

    deleteAllMeshes() {
        for( const set of this.sets){
            console.log(set)
            for (const m of set.meshes) {
                this.scene.remove(m);
                m.geometry.dispose();
                m.material.dispose(); 
                m.dispose();
            }

        }
       
    }

    addRandomParticles(n) {

        this.testTotal += n;

        if (this.testTotal >= this.testLimit) {
            return true;
        }

        let geoms = [];
        let m;
        

        if (this.testShape.isPreset) {
            geoms.push(this.testShape.presetGeometry.clone());
        }
        else {
            geoms.push(this.testShape.stripGeometry.clone());
            geoms.push(this.testShape.fanGeometries[0].clone());
            geoms.push(this.testShape.fanGeometries[1].clone());
        }

        this.translate([Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50], geoms);
        
        let Intsancemesh1 = new InstancedMesh( geoms[0], this.testMaterial, n);
        for ( let i = 0; i < n; i ++ ) {
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

				quaternion.setFromEuler( rotation );

				scale.x = scale.y = scale.z = Math.random() * 1;

				matrix.compose( position, quaternion, scale );
                Intsancemesh1.setMatrixAt( i, matrix );
                Intsancemesh1.setColorAt( i, color.setHex( 0xffffff * Math.random() ) );
        }
        this.scene.add(Intsancemesh1);
        this.renderer.render(this.scene,this.camera)
        geoms = [];
    


        return false;
    }

    translate(pos, geoms) {
        for (let g of geoms) {
            g.translate(pos[0], pos[1], pos[2]);
        }
    }

}


export default Model;
