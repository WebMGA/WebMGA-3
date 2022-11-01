import React from "react";
import GeneralMenu from './GeneralMenu';
import VisualisationMenu from './VisualisationMenu';

export class View {
    header;
    sidebar;
    model;
    expanded;

    static state;

    constructor(m, io, chrono, toggler) {
        View.state = {
        }
        this.expanded = false;
        this.model = m;
        this.header = <GeneralMenu chronometer={chrono} functions={io} model={this.model} toggler ={toggler}/>;
        this.sidebar = <VisualisationMenu model={this.model} sidebarExpanded={this.expanded} toggler={toggler}/>;
    }


    getData() {
        return View.state;
    }

    setState(state) {
        View.state = state;
        this.loadLightingAndCamera(state);
        this.loadReferenceAndSlicing(state);
        this.loadModel(state);
    }

    loadModel(state) {
        let substate;
        for (let i in state.model.configurations) {
            substate = state.model.configurations[i];
            this.model.updateUserColour(i, substate.colour);
            this.model.toggleUserColour(i, substate.colourFromDirector);
            this.model.toggleWireframe(i, substate.displayAsWireframe);
            this.model.updateShape(i, substate.shape, substate.parameters);
        }
    }

    loadState(state){
        this.loadReferenceAndSlicing(state);
        this.loadLightingAndCamera(state);
    }

    loadReferenceAndSlicing(state) {

        if (this.xor(this.model.gridEnabled, state.reference.showGrid)) {
            this.model.toggleGrid();
        }

        if (this.xor(this.model.axesEnabled, state.reference.showAxes)) {
            this.model.toggleAxes();
        }
        this.model.updateReferenceColour(state.reference.gridColour);
        this.model.updateGridSize(state.reference.size);
        this.model.updateBoundingShape(state.reference.activeShape, state.reference.boundingShapeEnabled);
        this.model.toggleClipIntersection(state.slicing.clipIntersection);
        this.model.toggleHelper(0, state.slicing.helpers[0]);
        this.model.toggleHelper(1, state.slicing.helpers[1]);
        this.model.toggleHelper(2, state.slicing.helpers[2]);
        this.model.updateSlicer(0, state.slicing.x);
        this.model.updateSlicer(1, state.slicing.y);
        this.model.updateSlicer(2, state.slicing.z);
    }

    loadLightingAndCamera(state) {
        let directionalLightColour = JSON.parse(JSON.stringify(state.directionalLight.colour));
        let pointLightColour = JSON.parse(JSON.stringify(state.pointLight.colour));

        if (!state.directionalLight.enabled) {
            directionalLightColour.i = 0;
        }
        if (!state.pointLight.enabled) {
            pointLightColour.i = 0;
        }

        this.model.updateBg(state.ambientLight.backgroundColour);
        this.model.updateLight(0, state.ambientLight.ambientLightColour);
        this.model.updateLight(1, directionalLightColour);
        this.model.updateLight(2, pointLightColour);
        this.model.updateLightPosition(1, state.directionalLight.position);
        this.model.updateLightPosition(2, state.pointLight.position);
        this.model.toggleLightHelper(1, state.directionalLight.helper);
        this.model.toggleLightHelper(2, state.pointLight.helper);
        this.model.setCamera(state.camera.type);

        this.model.updateCameraPosition(state.camera.position);
        this.model.updateLookAt(state.camera.lookAt);
        
        this.model.updateCameraZoom(state.camera.zoom);
    }


    setDefaultState(init) {
        View.state = {};
        View.state.reference = this.ReferenceDefaultState;
        View.state.ambientLight = this.AmbientLightDefaultState;
        View.state.pointLight = this.PointLightDefaultState;
        View.state.directionalLight = this.DirectionalLightDefaultState;
        View.state.camera = this.CameraDefaultState;
        View.state.slicing = this.SlicingDefaultState;
        View.state.model = this.ModelDefaultState;
        View.state.model.configurations = [];
        View.state.model.sets = [];


        for (let i in this.model.sets) {
            let set = JSON.parse(JSON.stringify(this.ConfigurationDefaultState));
            set.title = this.model.sets[i].name;
            View.state.model.sets.push(set.title);
            View.state.model.configurations.push(set);
        }

        this.loadState(View.state)

        if (!init) {
            this.loadModel(View.state);
        }
    }

    xor(a, b) {
        return (a && !b) || (!a && b);
    }

    ModelDefaultState = {
        active: 0,
        reset: 0,
        sets: [],
        configurations: []
    }

    SlicingDefaultState = {
        clipIntersection: false,
        helpers: [false, false, false],
        x: [-50, 50],
        y: [-50, 50],
        z: [-50, 50]
    }

    ConfigurationDefaultState = {
        title: '',
        shape: 'Ellipsoid',
        parameters: {
            names: ['X', 'Y', 'Z'],
            vals: [0.2, 0.4, 0.8]
        },
        colour: {
            r: 255,
            g: 255,
            b: 255
        },
        colourFromDirector: true,
        displayAsWireframe: true
    }

    CameraDefaultState = {
        type: 'orthographic',
        lookAt: {
            x: 0,
            y: 0,
            z: 0
        },
        position: {
            x: 0,
            y: 0,
            z: -15
        },
        zoom: 50
    }

    PointLightDefaultState = {
        reset: 0,
        active: 'point',
        enabled: true,
        helper: false,
        colour: {
            r: 255,
            g: 255,
            b: 255,
            i: 60
        },
        position: {
            x: 5,
            y: 0,
            z: 5
        }
    }

    DirectionalLightDefaultState = {
        reset: 0,
        active: 'directional',
        enabled: true,
        helper: false,
        colour: {
            r: 255,
            g: 255,
            b: 255,
            i: 50
        },
        position: {
            x: -5,
            y: 0,
            z: -5
        }

    }

    ReferenceDefaultState = {
        boundingShapeEnabled: false,
        activeShape: 'box',
        showAxes: false,
        showGrid: false,
        multicolour: true,
        gridColour: {
            r: 255,
            g: 255,
            b: 255,
        },
        size: 50,

    }

    AmbientLightDefaultState = {
        ambientLightColour: {
            r: 255,
            g: 255,
            b: 255,
            i: 40
        },
        backgroundColour: {
            r: 0,
            g: 0,
            b: 0
        }
    }

}

export default View;