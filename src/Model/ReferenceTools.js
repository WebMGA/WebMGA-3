import {
    GridHelper,
    LineBasicMaterial,
    Vector3,
    Color,
    BufferGeometry,
    Line,
    Box3Helper,
    Box3,
    SphereBufferGeometry,
    MeshBasicMaterial,
    Mesh
} from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {Alert} from 'rsuite';

export class ReferenceTools {
    subGrid;
    axes = [];
    // boundingShape;
    // boundingShapeType;
    setsGeometry;
    size;
    colour;
    material;
    R;G;B;

    constructor(s, c) {
        this.size = s;
        this.colour = c;

        this.material = new LineBasicMaterial({
            color: this.colour,
            linewidth: 3
        });

        this.multicolour = true;
        this.genMulticolourAxes();
        this.genSubgrid();

        this.R = new Color("rgb(255, 0, 0)");
        this.G = new Color("rgb(0, 255, 0)");
        this.B = new Color("rgb(0, 0, 255)");

        this.boundingShapeType = 'box';
        this.setsGeometry = null;
        
    }

    genBoundingShape(type, sets) {
        this.boundingShapeType = type;
        let b;
        this.boundingShape = null;
        b =sets.genUnitBox()
        switch (type) {
            case 'box':
                    let box = new Box3();
                    box.setFromCenterAndSize(new Vector3(0,0,0),new Vector3(10,10,10));
                    this.boundingShape = new Box3Helper(box, this.colour);
                    
                break;
            default:
            Alert.error('Error: Unknown bounding shape identifier');
        }

        return this.boundingShape;

    }

   
    updateColour(colour) {
        this.colour = colour;
        this.material = new LineBasicMaterial({
            color: this.colour,
            linewidth: 5
        });
        if(!this.multicolour){
            this.genAxes();
        }
        this.genSubgrid();
    }

    updateSize(size) {
        this.size = size;
        if(this.multicolour){
            this.genMulticolourAxes();
        }else{
            this.genAxes();
        }
        this.genSubgrid();
    }

    genSubgrid() {
        this.subGrid = new GridHelper(this.size, this.size, this.colour, this.colour);
    }

    genAxes() {
        this.axes = [];
        let axesSize = this.size / 2;
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(-axesSize, 0, 0), new Vector3(axesSize, 0, 0)]), this.material));
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(0, -axesSize, 0), new Vector3(0, axesSize, 0)]), this.material));
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(0, 0, -axesSize), new Vector3(0, 0, axesSize)]), this.material));
    }

    genMulticolourAxes(){
        this.axes = [];
        let axesSize = this.size / 2;
        let mat1, mat2, mat3;
        mat1 = new LineBasicMaterial({
            color: this.R,
            linewidth: 5
        });
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(-axesSize, 0, 0), new Vector3(axesSize, 0, 0)]), mat1));
        mat2 = this.material = new LineBasicMaterial({
            color: this.G,
            linewidth: 5
        });
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(0, -axesSize, 0), new Vector3(0, axesSize, 0)]), mat2));
        mat3 = this.material = new LineBasicMaterial({
            color: this.B,
            linewidth: 5
        });
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(0, 0, -axesSize), new Vector3(0, 0, axesSize)]), mat3));
    }

    toggleMulticolour(){
        this.multicolour = !this.multicolour;
        if(this.multicolour){
            this.genMulticolourAxes();
        }else{
            this.updateColour(this.colour);
            this.genAxes();
        }
    }
   

}

export default ReferenceTools;