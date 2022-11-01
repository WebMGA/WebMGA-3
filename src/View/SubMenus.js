
import { Nav, Divider, Checkbox, FormGroup, RadioGroup, Radio, Grid, Row, Col, Alert, Whisper, Tooltip, Icon } from 'rsuite';
import React from "react";
import { SliceSlider, ParameterInput, ParameterSet, CustomSlider } from './Tools'
import View from './View'

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
                colour.r = val;
                break;
            case 'g':
                colour.g = val;
                break;
            case 'b':
                colour.b = val;
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
        let parameter = parseFloat(val);

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
            <div key={reset}>


                <Divider><strong style={dividerStyle}> Configuration</strong></Divider>
                <ParameterInput f={this.selectSet} selectingSet title="Set" values={sets} active={title} styling={submenuParameterSetStyling} />
                <ParameterInput f={this.selectShape} title="Shape" values={shapes} active={configState.shape} styling={submenuParameterSetStyling} />
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
        );
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
        this.model.updateCameraZoom(val);
        this.model.update();
        View.state.camera.zoom = val;
    }

    selectType(val) {
        this.setState({
            type: val
        });
        View.state.camera.type = val;
        this.model.setCamera(val);
        if (val == "orthographic") {
            this.updateZoom(50);

        } else {
            this.updateZoom(1);
        }

    }

    updatePosition(val, type) {
        let position = this.state.position;

        if (val != NaN && val != null) {
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

        if (val != NaN && val != null) {
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
        this.state = View.state.slicing;
        this.model = props.model;

        this.toggleIntersection = this.toggleIntersection.bind(this);
        this.toggleHelperX = this.toggleHelperX.bind(this);
        this.toggleHelperY = this.toggleHelperY.bind(this);
        this.toggleHelperZ = this.toggleHelperZ.bind(this);
        this.updateHelpers = this.updateHelpers.bind(this);
        this.updateSlicer = this.updateSlicer.bind(this);
    }

    toggleIntersection() {
        let toggle = !this.state.clipIntersection;
        this.setState(
            {
                clipIntersection: toggle
            }
        );
        View.state.slicing.clipIntersection = toggle;
        this.model.toggleClipIntersection(toggle);
        this.model.update();
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
                View.state.slicing.x = val;
                break;
            case 1:
                View.state.slicing.y = val;
                break;
            case 2:
                View.state.slicing.z = val;
                break;
            default:
                Alert.error('Error: Unexpected Slicing Identifier');
        }

        this.model.updateSlicer(i, val);
        this.model.update();
    }
    render() {
        const state = this.state;
        return (
            <div>
                <br />
                {/* <Grid fluid>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={20}>
                            <Checkbox disabled={true} checked={state.clipIntersection} onClick={this.toggleIntersection}> Slice Intersection</Checkbox>
                        </Col>
                    </Row>
                </Grid> */}
                {/* TO DO */}
                <SliceSlider title="X : " f={this.updateSlicer} index={0} vals={state.x} />
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
    updateBg(val, i) {
        let colour = this.state.backgroundColour;

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
            default:
                Alert.error('Error: Unexpected RGB Identifier');
        }
        this.model.updateBg(colour);
        this.model.update();
        View.state.ambientLight.backgroundColour = colour;
    }
    render() {
        const ambientLightColour = this.state.ambientLightColour;
        const backgroundColour = this.state.backgroundColour;
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
                <p style={{ marginLeft: TITLE_LEFT_MARGIN }}> RGB </p>
                <CustomSlider disabled={false} boundaries={[0, 255]} val={backgroundColour.r} f={this.updateBg} type={'r'} />
                <CustomSlider disabled={false} boundaries={[0, 255]} val={backgroundColour.g} f={this.updateBg} type={'g'} />
                <CustomSlider disabled={false} boundaries={[0, 255]} val={backgroundColour.b} f={this.updateBg} type={'b'} />
            </div>
        );
    }
}

export class ReferenceOptions extends React.Component {
    constructor(props) {
        super();
        this.state = View.state.reference;

        this.model = props.model;
        this.toggleBoundingShapeEnabled = this.toggleBoundingShapeEnabled.bind(this);
        this.selectShape = this.selectShape.bind(this);
        this.toggleAxes = this.toggleAxes.bind(this);
        this.toggleGrid = this.toggleGrid.bind(this);
        this.updateColour = this.updateColour.bind(this);
        this.updateGridSize = this.updateGridSize.bind(this);
        this.toggleMulticolour = this.toggleMulticolour.bind(this);

    }
    updateColour(val, type) {
        let rgb = this.state.gridColour;

        switch (type) {
            case 'r':
                rgb.r = val;
                break;
            case 'g':
                rgb.g = val;
                break;
            case 'b':
                rgb.b = val;
                break;
            default:
                Alert.error('Error: Unexpected RGB Identifier');
        }
        this.model.updateReferenceColour(rgb);
        this.model.update();
        View.state.reference.gridColour = rgb;
    }
    updateGridSize(val) {
        this.model.updateGridSize(val);
        this.model.update();
        View.state.reference.size = val;
    }
    toggleBoundingShapeEnabled() {
        let toggle = !View.state.reference.boundingShapeEnabled;
        this.setState({
            boundingShapeEnabled: toggle
        });
        View.state.reference.boundingShapeEnabled = toggle;
        this.model.updateBoundingShape(this.state.activeShape, toggle);
        this.model.update();
    }
    selectShape(val) {
        this.setState({
            activeShape: val
        });
        View.state.reference.activeShape = val;
        this.model.updateBoundingShape(val, this.state.boundingShapeEnabled);
        this.model.update();
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
    toggleGrid() {
        this.setState({
            showGrid: !this.state.showGrid
        });
        this.model.toggleGrid();
        this.model.update();
        View.state.reference.showGrid = !View.state.reference.showGrid;
    }

    render() {
        const enabled = this.state.boundingShapeEnabled;
        const activeShape = this.state.activeShape;
        const showAxes = this.state.showAxes;
        const showGrid = this.state.showGrid;
        const colour = this.state.gridColour;
        const size = this.state.size;
        const multicolour = this.state.multicolour;
        return (
            <div>

                <Grid fluid>
                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Bounding Shape </b></p>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox style={{ marginLeft: 12 }} checked={enabled} onClick={this.toggleBoundingShapeEnabled}>  Show </Checkbox>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={3} />
                        <Col xs={12}>
                            <FormGroup controlId="radioList">
                                <RadioGroup name="radioList" value={activeShape} onChange={this.selectShape}>
                                    <Radio disabled={!enabled} value="box"  >Box </Radio>
                                    {/* <Radio disabled={true} value="sphere" >Sphere </Radio>
                                    <Radio disabled={true} value="cylinder" >Cylinder </Radio> */}

                                </RadioGroup>
                            </FormGroup>
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




                    <Row className="show-grid">
                        <Col xs={2} />
                        <Col xs={12}>
                            <br />
                            <p><b> Grid </b></p>
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col xs={1} />
                        <Col xs={12}>
                            <Checkbox style={{ marginLeft: 12 }} checked={showGrid} onClick={this.toggleGrid}> Show</Checkbox>
                        </Col>
                    </Row>
                </Grid>
                <br />

                <p style={{ marginLeft: TITLE_LEFT_MARGIN }}> Size </p>
                <CustomSlider disabled={false} boundaries={[0, 100]} val={size} f={this.updateGridSize} />
                <p style={{ marginLeft: TITLE_LEFT_MARGIN }}> RGB </p>
                <CustomSlider disabled={false} boundaries={[0, 255]} val={colour.r} f={this.updateColour} type={'r'} />
                <CustomSlider disabled={false} boundaries={[0, 255]} val={colour.g} f={this.updateColour} type={'g'} />
                <CustomSlider disabled={false} boundaries={[0, 255]} val={colour.b} f={this.updateColour} type={'b'} />


                <br />
            </div>
        );
    }
}