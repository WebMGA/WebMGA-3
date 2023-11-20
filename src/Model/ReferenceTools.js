import {Box3, Box3Helper, BufferGeometry, Color, GridHelper, Line, LineBasicMaterial, Vector3} from 'three';
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
    R;
    G;
    B;

    constructor(s, c) {
        this.size = s;
        this.colour = c;

        this.material = new LineBasicMaterial({
            color: this.colour, linewidth: 3
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
        let b = null;
        this.boundingShape = null;

        for (let set of sets) {
            if (b != null) {
                break
            }
            b = set.genUnitBox()

        }

        switch (type) {
            case 'box':
                let box = new Box3();
                box.setFromCenterAndSize(new Vector3(0, 0, 0), new Vector3(b[0], b[1], b[2]));
                this.boundingShape = new Box3Helper(box, this.colour);

                break;
            default:
                Alert.error('Error: Unknown bounding shape identifier');


        }


        return this.boundingShape;

    }


    updateColour(colour, director) {
        this.colour = colour;
        this.material = new LineBasicMaterial({
            color: this.colour, linewidth: 5
        });
        if (!this.multicolour) {
            this.genAxes(director);
        }
        this.genSubgrid();
    }

    genSubgrid() {
        this.subGrid = new GridHelper(this.size, this.size, this.colour, this.colour);
    }

    genAxes(director) {
        this.axes = [];
        let axesSize = this.size / 2;
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(-axesSize, 0, 0), new Vector3(axesSize, 0, 0)]), this.material));
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(0, -axesSize, 0), new Vector3(0, axesSize, 0)]), this.material));
        let director_vector = new Vector3(director[0], director[1], director[2])
        this.axes.push(new Line(new BufferGeometry().setFromPoints([director_vector.clone().multiplyScalar(-axesSize), director_vector.clone().multiplyScalar(axesSize)]), this.material));
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(0, 0, -axesSize), new Vector3(0, 0, axesSize)]), this.material));
    }

    genMulticolourAxes() {
        this.axes = [];
        let axesSize = this.size / 2;
        let mat1, mat2, mat3;
        mat1 = new LineBasicMaterial({
            color: this.R, linewidth: 5
        });
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(-axesSize, 0, 0), new Vector3(axesSize, 0, 0)]), mat1));
        mat2 = this.material = new LineBasicMaterial({
            color: this.G, linewidth: 5
        });
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(0, -axesSize, 0), new Vector3(0, axesSize, 0)]), mat2));
        mat3 = this.material = new LineBasicMaterial({
            color: this.B, linewidth: 5
        });
        this.axes.push(new Line(new BufferGeometry().setFromPoints([new Vector3(0, 0, -axesSize), new Vector3(0, 0, axesSize)]), mat3));
    }

    toggleMulticolour(director) {
        this.multicolour = !this.multicolour;
        if (this.multicolour) {
            this.genMulticolourAxes();
        } else {
            this.updateColour(this.colour, director);
            this.genAxes(director);
        }
    }


}

export default ReferenceTools;