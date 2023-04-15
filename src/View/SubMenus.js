
import { Nav, Divider, Checkbox, FormGroup, RadioGroup, Radio, Grid, Row, Col, Alert, Whisper, Tooltip, Icon,Input } from 'rsuite';
import React from "react";
import { SliceSlider, ParameterInput, ParameterSet, CustomSlider } from './Tools'
import {View} from './View.js'

import ccapture from "ccapture.js-npmfixed";
import { Scrollbars } from 'rc-scrollbars';

const TITLE_LEFT_MARGIN = 30;
const dividerStyle = {
    color: '#A4A9A3'
}

const submenuParameterSetStyling = [
    { width: 130, marginLeft: 10 },
    { marginTop: 10, marginLeft: 30 }
];

export class ModelsOptions extends React.Component {

    constructor(props) {
        super();
        this.state = View.state.model;
        this.model = props.model;
        this.selectShape = this.selectShape.bind(this);
        this.selectSet = this.selectSet.bind(this);
        this.updateParameter = this.updateParameter.bind(this);
        this.toggleWireframe = this.toggleWireframe.bind(this);
        this.toggleColour = this.toggleColour.bind(this);
        this.updateUserColour = this.updateUserColour.bind(this);
    }


    updateUserColour(val, type) {
        let colour = this.state.configurations[this.state.active].colour;

        switch (type) {
            case 'r':
                colour.r = parseInt(val);
                break;
            case 'g':
                colour.g =  parseInt(val);
                break;
            case 'b':
                colour.b =  parseInt(val);
                break;
            default:
                Alert.error('Error: Unexpected RGB Identifier');
        }
        this.model.updateUserColour(this.state.active, colour);
        this.model.update();
        View.state.model.configurations[this.state.active].colour = colour;
    }

    toggleColour() {
        let toggle = !this.state.configurations[this.state.active].colourFromDirector;
        this.setState({
            colourFromDirector: toggle
        });
        View.state.model.configurations[this.state.active].colourFromDirector = toggle;
        this.model.toggleUserColour(this.state.active, toggle);
        this.model.update();
    }

    toggleWireframe() {
        let toggle = !this.state.configurations[this.state.active].displayAsWireframe;
        this.setState({
            displayAsWireframe: toggle
        });
        View.state.model.configurations[this.state.active].displayAsWireframe = toggle;
        this.model.toggleWireframe(this.state.active, toggle);
        this.model.update();
    }

    updateParameter(val, i) {
        if (isNaN(val) ||!val) {
            val =0
        }
        const parameter = parseFloat(val);
        let globalState = View.state.model.configurations[this.state.active];
        globalState.parameters.vals[i] = parameter;

        let configs = this.state.configurations;
        configs[this.state.active].parameters.vals[i] = parameter;

        this.setState({
            configurations: configs
        });

        this.model.updateShape(this.state.active, globalState.shape, globalState.parameters);
        this.model.update();
        this.reset();
    }

    reset() {
        let i;
        if (this.state.reset > 50) {
            i = 0;
        } else {
            i = this.state.reset;
        }
        this.setState(
            {
                reset: ++i
            }
        );
    }

    selectSet(val) {
        for (let i = 0; i < this.state.sets.length; i++) {
            if (this.state.sets[i].localeCompare(val) === 0) {
                this.setState({
                    active: i
                })
                View.state.model.active = i;
                break;
            }
        }
        this.reset();
    }

    selectShape(val) {
        let parameters = this.model.getParameters(val);
        this.setState(
            {
                shape: val,
                parameters: parameters
            }
        );
        this.reset();
        View.state.model.configurations[this.state.active].shape = val;
        View.state.model.configurations[this.state.active].parameters = parameters;
        this.model.updateShape(this.state.active, val, parameters);
        this.model.update();
    }

    render() {
        const configState = this.state.configurations[this.state.active];
        const reset = this.state.reset;
        const title = configState.title;
        const shapes = ["Ellipsoid", "Sphere", "Spherocylinder", "Spheroplatelet", "Cut Sphere", "Cylinder", "Torus"];
        const sets = this.state.sets;

        return (
            <Scrollbars  style={{height:800}}>
            <div key={reset} >
                <Divider><strong style={dividerStyle}> Configuration</strong></Divider>
                <ParameterInput key ={5}f={this.selectSet} selectingSet title="Set" values={sets} active={title} styling={submenuParameterSetStyling} />
                <ParameterInput key ={6}f={this.selectShape} title="Shape" values={shapes} active={configState.shape} styling={submenuParameterSetStyling} />
                <ParameterSet f={this.updateParameter} titles={configState.parameters.names} values={configState.parameters.vals} step={0.1} positive styling={submenuParameterSetStyling} />
                <br />
                <Divider><strong style={dividerStyle}>  Material </strong></Divider>

                <Row className="show-grid">
                    <Col xs={1} />
                    <Col xs={20}>
                        <Checkbox checked={configState.displayAsWireframe} onClick={this.toggleWireframe}> Display as Wireframe </Checkbox>
                        <Checkbox checked={configState.colourFromDirector} onClick={this.toggleColour}> Colour from Director </Checkbox>
                        <br />
                    </Col>
                </Row>

                <p style={{ marginLeft: TITLE_LEFT_MARGIN }}> RGB </p>
                <CustomSlider f={this.updateUserColour} disabled={configState.colourFromDirector} boundaries={[0, 255]} val={configState.colour.r} type={'r'} />
                <CustomSlider f={this.updateUserColour} disabled={configState.colourFromDirector} boundaries={[0, 255]} val={configState.colour.g} type={'g'} />
                <CustomSlider f={this.updateUserColour} disabled={configState.colourFromDirector} boundaries={[0, 255]} val={configState.colour.b} type={'b'} />
            </div>
            </Scrollbars>
        );
    }
}

export class VideoOptions extends React.Component{
    constructor(props){
        super();
        this.model = props.model;
        this.state =View.state.reference;
        this.functions = props.functions;
        this.toggler = props.toggler;
        this.setfps = this.setfps.bind(this);
        this.UploadFiles = this.UploadFiles.bind(this);
        this.RealTimeVideo = this.RealTimeVideo.bind(this);
        this.VideoToggle = this.VideoToggle.bind(this);
        this.setVideoState = this.setVideoState.bind(this);
        this.state.filename = 'WebMGA-Video.webm';
        this.setFileName = this.setFileName.bind(this);

    }
    setFileName (val){
        this.setState({
            filename:val
        })
    }
    setfps(val){
     this.setState({
        fps:val
     })
     View.state.reference.fps = val;
    }
    UploadFiles(){
        let toggle = ! this.state.uploaded;
        this.setState({
            uploaded: toggle
        })
        if (toggle === true){
            async function runAfterUpload(model, functions) {
                const lst = await model.uploadConfig();
                functions[1](lst[0],true,0);
            }
            runAfterUpload(this.model,this.functions).then(()=>{
                this.model.notifyFinishUpload();
            })
        }
        else{
            this.model.Video_sample_list =[];
        }
        
        View.state.reference.uploaded= !View.state.reference.uploaded;
    }
    setVideoState(){
        var data = this.functions[5]();
        this.state.vidstate  = data;
        let toggle = ! this.state.loadVideoState
        this.setState({
            loadVideoState :toggle
        })
        View.state.reference.loadVideoState =!View.state.reference.loadVideoState;  
    }
    VideoToggle(){
        console.log(this.state.video);
        let toggle = !this.state.video;
        this.setState({
            video:toggle
        })
        this.state.video = toggle;
        console.log(toggle)
        if(toggle ===true){
            this.toggler.closeSidemenu();
            const samples = this.model.retrieveVideoSample();
            const max_iter = samples.length;
            var capturer = new ccapture( { format: 'webm',framerate:this.state.fps,quality:100});
            
            this.RealTimeVideo(0,samples,max_iter,capturer,this.state.vidstate ,this.state.filename);
            
           
        }
        View.state.reference.video = !View.state.reference.video
    }
    
    RealTimeVideo(i,samples,max_iter,capturer,vidState,filename){
        if(i ===0){
            console.log('does this work?')
            capturer.start();
            capturer.capture(this.model.renderer.domElement);
        }
        if(i<max_iter){
            console.log('start render')
            this.functions[1].bind(this)(samples[i],i,vidState);
            capturer.capture( this.model.renderer.domElement )
            
            console.log('running animation',i)
            if(this.state.video === true ){
                requestAnimationFrame( ()=> this.RealTimeVideo(i+1,samples,max_iter,capturer,vidState,filename));
                console.log('sending request',i+1)
            };
        }
        if (i === max_iter){
                console.log('max')
                capturer.stop();
                capturer.save(function( blob ) {
                    console.log(blob);
                    var url = URL.createObjectURL(blob);
                    var link = document.createElement('a');
                    link.href = url;
                    console.log(filename)
                    link.download = filename + '.webm';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
                View.state.reference.video =false;
                View.state.reference.setVideoState = false;
                
        }}


    render(){
        const video = this.state.video;
        const upload = this.state.uploaded;
        const setVideoState = this.state.loadVideoState;
        const fps = this.state.fps;
        return(
            <div>
                <Grid fluid>
                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Load Configurations </b></p>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox checked={upload} onClick={this.UploadFiles} > Load </Checkbox>
                        </Col>
                    </Row>
    
                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Set Frame Rate</b></p>
                        </Col>
                    </Row>
                    <CustomSlider boundaries={[1,60]} val={fps} f={this.setfps}type={'fps'} />
                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Enviroment set up  </b></p>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox onClick={this.setVideoState} checked={setVideoState}>Apply </Checkbox>
                        </Col>
                        <Col xs={1}>
                            <Whisper placement="bottom" trigger="hover" speaker={
                                <Tooltip>
                                    Modify enviromental set ups such as show unit box at other menus.
                                    Toggle Apply to apply settings to Video.
                            </Tooltip>
                            }>
                                <Icon style={{ marginTop: 8 }} icon="question-circle" size="lg" />
                            </Whisper>
                        </Col>
                    </Row>
                   
                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Create Video </b></p>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                        <p>Input File name:</p>
                        <Input style={{ width:150,height:30,marginLeft: 20 }} placeholder="New_Video" 
                            onChange={(filename) => this.setFileName(filename)}/>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox onClick={this.VideoToggle} checked={video} disabled={!upload||!setVideoState}> Create </Checkbox>
                        </Col>
                   </Row>
                   
                </Grid>
                <br />
                <br />
            </div>

        )
    }
}



export class CameraOptions extends React.Component {

    constructor(props) {
        super();
        this.state = View.state.camera;
        this.model = props.model;
        this.toggler = props.toggler;
        this.selectType = this.selectType.bind(this);
        this.updateLookat = this.updateLookat.bind(this);
        this.updatePosition = this.updatePosition.bind(this);
        this.updateZoom = this.updateZoom.bind(this);
        this.updateState = this.updateState.bind(this);
        
        this.toggler.updateCamera = () => {
            this.updateState()
        }
    }

    updateState(){
        this.setState(View.state.camera);
    }

    updateZoom(val) {
        this.setState({
            zoom: val
        });
        this.model.updateCameraZoom(parseInt(val));
        this.model.update();
        View.state.camera.zoom = val;
    }

    selectType(val) {
        this.setState({
            type: val
        });
        View.state.camera.type = val;
        this.model.setCamera(val,false);
        if (val === "orthographic") {
            this.updateZoom(50);
        } else {
            this.updateZoom(1);
        }

    }

    updatePosition(val, type) {
        let position = this.state.position;
        if (val != isNaN && val != null) {
            switch (type) {
                case 'x':
                    position.x = parseInt(val);
                    break;
                case 'y':
                    position.y = parseInt(val);
                    break;
                case 'z':
                    position.z = parseInt(val);
                    break;
                default:
                    Alert.error('Error: Unexpected Camera Position Input');
                    return;
            }
        }

        this.model.updateCameraPosition(position);
        this.model.update();
        View.state.camera.position = position;
    }

    updateLookat(val, type) {
        let lookAt = this.state.lookAt;

        if (isNaN(val) ||!val) {
            val =0
        }
        switch (type) {
            case 0:
                lookAt.x = parseFloat(val);
                break;
            case 1:
                lookAt.y = parseFloat(val);
                break;
            case 2:
                lookAt.z = parseFloat(val);
                break;
            default:
                Alert.error('Error: Unexpected Look At Input');
                return;
        }

        this.model.updateLookAt(lookAt);
        this.model.update();
        View.state.camera.lookAt = lookAt;
    }


    render() {
        const cameraType = this.state.type;
        const zoom = this.state.zoom;
        const lookAt = [this.state.lookAt.x, this.state.lookAt.y, this.state.lookAt.z];
        const cameraPosition = this.state.position;


        return (
            <div key={JSON.stringify(this.state)}>
                <br />
                <Row className="show-grid">
                    <Col xs={2} />
                    <Col xs={12}>

                        <FormGroup controlId="radioList">
                            <RadioGroup name="radioList" value={cameraType} onChange={this.selectType}>
                                <p><b>Type</b></p>
                                <Radio value="perspective">Perspective </Radio>
                                <Radio value="orthographic">Orthographic </Radio>
                            </RadioGroup>
                        </FormGroup>

                    </Col>
                </Row>

                <Grid fluid>

                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Position</b></p>
                        </Col>
                    </Row>

                    <CustomSlider boundaries={[-50, 50]} val={cameraPosition.x} f={this.updatePosition} type={'x'} />
                    <CustomSlider boundaries={[-50, 50]} val={cameraPosition.y} f={this.updatePosition} type={'y'} />
                    <CustomSlider boundaries={[-50, 50]} val={cameraPosition.z} f={this.updatePosition} type={'z'} />
                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Zoom </b></p>
                        </Col>
                    </Row>
                    <CustomSlider key={cameraType} boundaries={[1, 100]} val={zoom} f={this.updateZoom} />
                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Look at</b></p>
                        </Col>
                    </Row>
                    <ParameterSet titles={["x", "y", "z"]} values={lookAt} f={this.updateLookat} step={0.5} styling={submenuParameterSetStyling} />

                </Grid>
                <br />



            </div>);
    }
}

export class SlicingOptions extends React.Component {

    constructor(props) {
        super();
        this.state = View.state.slicing
        this.model = props.model;
        this.toggleSlicer = this.toggleSlicer.bind(this);
        this.toggleHelperX = this.toggleHelperX.bind(this);
        this.toggleHelperY = this.toggleHelperY.bind(this);
        this.toggleHelperZ = this.toggleHelperZ.bind(this);
        this.updateHelpers = this.updateHelpers.bind(this);
        this.updateSlicer = this.updateSlicer.bind(this);
        console.log(this.state,View.state.slicing);
    }

    toggleSlicer(){
        let toggle = !this.state.slicing_enabled;
        this.model.enableClipping(toggle,View.state.model.active);
        this.setState({
            slicing_enabled :toggle
        })
        View.state.slicing.slicing_enabled = toggle
        console.log(this.state,View.state.slicing);
    }

    updateHelpers(helpers) {
        this.setState(
            {
                helpers: helpers
            }
        );
        View.state.slicing.helpers = helpers;
    }

    toggleHelperX() {
        let helpers = this.state.helpers;
        let toggle = !helpers[0];
        helpers[0] = toggle;
        this.updateHelpers(helpers);
        this.model.toggleHelper(0, toggle);
        this.model.update();
    }

    toggleHelperY() {
        let helpers = this.state.helpers;
        let toggle = !helpers[1];
        helpers[1] = toggle;
        this.updateHelpers(helpers);
        this.model.toggleHelper(1, toggle);
        this.model.update();
    }

    toggleHelperZ() {
        let helpers = this.state.helpers;
        let toggle = !helpers[2];
        helpers[2] = toggle;
        this.updateHelpers(helpers);
        this.model.toggleHelper(2, toggle);
        this.model.update();
    }

    updateSlicer(i, val) {
    
        switch (i) {
            case 0:
                this.setState(
                    {
                        x:val
                    }
                );
                // this.state.x = val;
                break;
            case 1:
                this.setState(
                    {
                        y:val
                    }
                );
                // this.state.y = val;
                break;
            case 2:
                this.setState(
                    {
                        z:val
                    }
                );
                // this.state.z = val;
                break;
            default:
                Alert.error('Error: Unexpected Slicing Identifier');
        }
        
        

        this.model.updateSlicer(i, val);
        this.model.update();
    }
    render() {
        const state = this.state;
        const slicing_enabled = this.state.slicing_enabled;
        return (
            <div>
                <br />
                <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Enable Slicing</b></p>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox style={{ marginLeft: 12 }} checked={slicing_enabled}onClick={this.toggleSlicer}> enable </Checkbox>
                        </Col>
                    </Row>
                <SliceSlider title="X : " f={this.updateSlicer} index={0} vals={state.x} disabled={!slicing_enabled}/>
                <br />
                <Grid fluid>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox checked={state.helpers[0]} onClick={this.toggleHelperX}> Show Helper</Checkbox>
                        </Col>
                    </Row>
                </Grid>
                <SliceSlider title="Y : " f={this.updateSlicer} index={1} vals={state.y} />
                <br />
                <Grid fluid>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox checked={state.helpers[1]} onClick={this.toggleHelperY}> Show Helper</Checkbox>
                        </Col>
                    </Row>
                </Grid>
                <SliceSlider title="Z : " f={this.updateSlicer} index={2} vals={state.z} />
                <br />
                <Grid fluid>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox checked={state.helpers[2]} onClick={this.toggleHelperZ}> Show Helper</Checkbox>
                        </Col>
                    </Row>
                </Grid>
            </div>
        );
    }

}


      


export const AdditionalLightsNav = ({ active, onSelect }) => {
    return (
        <Nav activeKey={active} onSelect={onSelect} style={{ margin: 10, width: 280 }} justified appearance="tabs">
            <Nav.Item eventKey="point">Point</Nav.Item>
            <Nav.Item eventKey="directional">Directional</Nav.Item>
        </Nav>
    );
};

export class AdditionalLightOptions extends React.Component {

    constructor(props) {
        super();
        this.state = View.state.pointLight;
        this.model = props.model;
        this.reset = 0;
        this.handleSelect = this.handleSelect.bind(this);
        this.updateColour = this.updateColour.bind(this);
        this.updatePosition = this.updatePosition.bind(this);
        this.toggleLightEnabled = this.toggleLightEnabled.bind(this);
        this.toggleHelper = this.toggleHelper.bind(this);

    }
    handleSelect() {
        if (this.state.active.localeCompare('point') === 0) {
            this.setState(View.state.directionalLight);
        } else {
            this.setState(View.state.pointLight);
        }
        if (this.reset > 5) {
            this.reset = 0;
        }

        this.setState({ reset: ++this.reset });
    }

    toggleHelper() {
        let helper = !this.state.helper;
        this.setState({
            helper: helper
        });

        if (this.state.active.localeCompare('point') === 0) {
            View.state.pointLight.helper = helper;
            this.model.toggleLightHelper(2, helper);
            this.model.update();
        } else {
            View.state.directionalLight.helper = helper;
            this.model.toggleLightHelper(1, helper);
            this.model.update();
        }
    }

    toggleLightEnabled() {
        let enabled = !this.state.enabled;
        this.setState({
            enabled: enabled
        });
        let intensity;
        if (this.state.active.localeCompare('point') === 0) {
            View.state.pointLight.enabled = enabled;
            intensity = View.state.pointLight.colour.i;
        } else {
            View.state.directionalLight.enabled = enabled;
            intensity = View.state.directionalLight.colour.i;
        }

        if (enabled) {
            this.updateColour(intensity, 'i');
        } else {
            this.updateColour(0, 'i');
        }
        this.setState({ reset: ++this.reset });

        if (this.state.active.localeCompare('point') === 0) {
            View.state.pointLight.colour.i = intensity;
        } else {
            View.state.directionalLight.colour.i = intensity;
        }
    }

    updateColour(val, type) {
        let colour = this.state.colour;

        switch (type) {
            case 'r':
                colour.r = val;
                break;
            case 'g':
                colour.g = val;
                break;
            case 'b':
                colour.b = val;
                break;
            case 'i':
                colour.i = val;
                break;
            default:
                Alert.error('Error: Unexpected RGB Identifier');
        }

        if (this.state.active.localeCompare('point') === 0) {
            this.model.updateLight(2, colour);
            View.state.pointLight.colour = colour;
        } else {
            this.model.updateLight(1, colour);
            View.state.directionalLight.colour = colour;
        }
        this.model.update();
    }
    updatePosition(val, type) {
        let position = this.state.position;

        switch (type) {
            case 'x':
                position.x = val;
                break;
            case 'y':
                position.y = val;
                break;
            case 'z':
                position.z = val;
                break;
            default:
                Alert.error('Error: Unexpected Position Identifier');
        }

        if (this.state.active.localeCompare('point') === 0) {
            this.model.updateLightPosition(2, position);
            View.state.pointLight.position = position;
        } else {
            this.model.updateLightPosition(1, position);
            View.state.directionalLight.position = position;
        }
        this.model.update();
    }

    render() {
        const active = this.state.active;
        const lightState = this.state;
        return (
            <div key={lightState.reset}>
                <br />
                <AdditionalLightsNav active={active} onSelect={this.handleSelect} />
                <br />
                <Grid fluid>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox checked={lightState.enabled} onClick={this.toggleLightEnabled}> <strong>Enabled </strong> </Checkbox>
                            <Checkbox checked={lightState.helper} onClick={this.toggleHelper}> <strong>Show Helper </strong> </Checkbox>
                            <br />
                        </Col>
                    </Row>
                </Grid>
                <p style={{ marginLeft: TITLE_LEFT_MARGIN }}> RGB </p>
                <CustomSlider disabled={!lightState.enabled} boundaries={[0, 255]} val={lightState.colour.r} f={this.updateColour} type={'r'} />
                <CustomSlider disabled={!lightState.enabled} boundaries={[0, 255]} val={lightState.colour.g} f={this.updateColour} type={'g'} />
                <CustomSlider disabled={!lightState.enabled} boundaries={[0, 255]} val={lightState.colour.b} f={this.updateColour} type={'b'} />
                <p style={{ marginLeft: TITLE_LEFT_MARGIN }}> Intensity </p>
                <CustomSlider disabled={!lightState.enabled} boundaries={[0, 100]} val={lightState.colour.i} f={this.updateColour} type={'i'} />
                <p style={{ marginLeft: TITLE_LEFT_MARGIN }}> Position XYZ </p>
                <CustomSlider disabled={!lightState.enabled} boundaries={[-50, 50]} val={lightState.position.x} f={this.updatePosition} type={'x'} />
                <CustomSlider disabled={!lightState.enabled} boundaries={[-50, 50]} val={lightState.position.y} f={this.updatePosition} type={'y'} />
                <CustomSlider disabled={!lightState.enabled} boundaries={[-50, 50]} val={lightState.position.z} f={this.updatePosition} type={'z'} />
            </div>
        );
    }
}

export class AmbientLightOptions extends React.Component {
    constructor(props) {
        super();

        this.state = View.state.ambientLight;

        this.model = props.model;

        this.updateColour = this.updateColour.bind(this);
        this.updateBg = this.updateBg.bind(this);
    }
    updateColour(val, i) {
        let colour = this.state.ambientLightColour;

        switch (i) {
            case 'r':
                colour.r = val;
                break;
            case 'g':
                colour.g = val;
                break;
            case 'b':
                colour.b = val;
                break;
            case 'i':
                colour.i = val;
                break;
            default:
                Alert.error('Error: Unexpected RGB Identifier');
        }
        this.model.updateLight(0, colour);
        this.model.update();
        View.state.ambientLight.ambientLightColour = colour;
    }
    updateBg() {
        console.log(this.state.darkBackGround)
        let toggle = !this.state.darkBackGround;
        this.setState({
            darkBackGround:toggle
        })
        console.log(this.state.darkBackGround)
        if (toggle === true){
            this.model.updateBg("#000000");
        }
        else{
            this.model.updateBg('#FFFFFF');
        }
        this.model.update();
        View.state.ambientLight.darkBackGround = !View.state.ambientLight.darkBackGround;
       
    }
    render() {
        const ambientLightColour = this.state.ambientLightColour;
        const backgroundColour = this.state.darkBackGround;
        return (
            <div>
                <Divider><strong style={dividerStyle}> Ambient Light </strong></Divider>
                <p style={{ marginLeft: TITLE_LEFT_MARGIN }}> RGB </p>
                <CustomSlider disabled={false} boundaries={[0, 255]} val={ambientLightColour.r} f={this.updateColour} type={'r'} />
                <CustomSlider disabled={false} boundaries={[0, 255]} val={ambientLightColour.g} f={this.updateColour} type={'g'} />
                <CustomSlider disabled={false} boundaries={[0, 255]} val={ambientLightColour.b} f={this.updateColour} type={'b'} />
                <p style={{ marginLeft: TITLE_LEFT_MARGIN }}> Intensity </p>
                <CustomSlider disabled={false} boundaries={[0, 100]} val={ambientLightColour.i} f={this.updateColour} type={'i'} />
                <Divider><strong style={dividerStyle}> Background Colour</strong></Divider>
                <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox style={{ marginLeft: 12 }} checked ={backgroundColour} onClick={this.updateBg}> Dark Mode</Checkbox>
                        </Col>
                </Row>
            </div>
        );
    }
}
   
export class ReferenceOptions extends React.Component {
    constructor(props) {
        super();
        this.state = View.state.reference;
        this.state.model = View.state.model;
        this.model = props.model;
        this.toggleFold = this.toggleFold.bind(this);
        this.toggleBoundingShapeEnabled= this.toggleBoundingShapeEnabled.bind(this);
        this.toggleAxes = this.toggleAxes.bind(this);

        this.toggleMulticolour = this.toggleMulticolour.bind(this);

    }
   
    toggleFold() {
        let toggle = !this.state.model.configurations[this.state.model.active].displayFoldState;
        this.setState({
            displayFoldState: toggle
        });
        console.log(this.state.model);
        View.state.model.configurations[this.state.model.active].displayFoldState = toggle;
        this.model.toggleFoldState(this.state.model.active,toggle);
        this.model.update();
    }

    toggleBoundingShapeEnabled() {
        let toggle = !this.state.boundingShapeEnabled;
        this.setState({
            boundingShapeEnabled: toggle
        });
        this.model.updateBoundingShape(View.state.reference.activeShape, toggle);
        this.model.update();
        View.state.reference.boundingShapeEnabled = ! View.state.reference.boundingShapeEnabled;
    }
    

    toggleMulticolour() {
        this.setState({
            multicolour: !this.state.multicolour
        });
        this.model.toggleAxesMulticolour();
        this.model.update();
        View.state.reference.multicolour = !View.state.reference.multicolour;
    }
    toggleAxes() {
        this.setState({
            showAxes: !this.state.showAxes
        });
        this.model.toggleAxes();
        this.model.update();
        
        View.state.reference.showAxes = !View.state.reference.showAxes;
    }


    render() {
        const configState = this.state.model.configurations[this.state.model.active];
        const enabled = this.state.boundingShapeEnabled;
        const showAxes = this.state.showAxes;
        const multicolour = this.state.multicolour;
        return (
            <div>

                <Grid fluid>
                <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Unit Box </b></p>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox style={{ marginLeft: 12 }} checked={enabled}onClick={this.toggleBoundingShapeEnabled}>  Show </Checkbox>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Periodic Boundary Conditions  </b></p>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox style={{ marginLeft: 12 }} checked={configState.displayFoldState} onClick={this.toggleFold}> Fold</Checkbox>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Axes </b></p>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox style={{ marginLeft: 12 }} checked={showAxes} onClick={this.toggleAxes}> Show</Checkbox>

                        </Col>
                    </Row>

                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>

                            <Checkbox style={{ marginLeft: 12 }} checked={multicolour} onClick={this.toggleMulticolour}> Multi-Colour</Checkbox>

                        </Col>
                        <Col xs={4}>
                            <Whisper placement="bottom" trigger="hover" speaker={
                                <Tooltip>
                                    X : RED <br /> Y : GREEN <br /> Z : BLUE
                            </Tooltip>
                            }>
                                <Icon style={{ marginTop: 8 }} icon="question-circle" size="lg" />
                            </Whisper>
                        </Col>
                    </Row>
                    


                </Grid>
               
            </div>
        );
    }
}
