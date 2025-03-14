import {
    Alert,
    Button,
    ButtonToolbar,
    Checkbox,
    ControlLabel,
    Drawer,
    Dropdown,
    Form,
    FormGroup,
    Header,
    Icon,
    Nav,
    Navbar,
    Slider,
    Tooltip,
    Whisper
} from 'rsuite';
import {ParameterSet} from './Tools';
import React from "react";
import {Shape} from "../Model/Shapes";


class ExportDropdown extends React.Component {

    constructor(props) {
        super();
        this.dimensions = [1000, 1000];
        this.resolution = [10];
        this.f = props.f;
        this.setResolution = this.setResolution.bind(this);
        this.setDimensions = this.setDimensions.bind(this);
        this.export = this.export.bind(this);
    }

    setDimensions(val, index) {
        this.dimensions[index] = parseInt(val);
    }

    setResolution(val) {
        this.resolution[0] = parseInt(val);
    }

    export() {
        this.f(...this.dimensions.concat(this.resolution));
    }

    render() {
        return (<Dropdown title="Export" trigger='click' placement="bottomEnd" icon={<Icon icon="export"/>}>

            <ParameterSet f={this.setDimensions} titles={['Height', 'Width']} values={this.dimensions} step={5} positive
                          styling={[{marginRight: 25}, {marginTop: 18, marginLeft: 35}]}/>
            <ParameterSet f={this.setResolution} titles={['Resolution']} values={this.resolution} step={1} positive
                          styling={[{marginRight: 25}, {marginTop: 18, marginLeft: 35}]}/>

            <Button style={{width: 180, marginLeft: 25, marginRight: 25, marginTop: 15, marginBottom: 15}}
                    appearance='primary' onClick={this.export}> Export </Button>
        </Dropdown>);
    }

}

class LibraryDropdown extends React.Component {

    constructor(props) {
        super(props);
        this.model = props.model;
        this.state = {active: 2};
        this.f = props.f;
        this.toggler = props.toggler;
    }

    render() {
        return (<Dropdown
            title="Library"
            trigger='click'
            placement="bottomEnd"
            icon={<Icon icon="database"/>}
            appearance='subtle'
            onSelect={(eventKey) => {
                this.f(eventKey);
            }}>

            <Dropdown.Menu title="Samples">
                <Dropdown.Item eventKey={14}>Single Molecule</Dropdown.Item>
                <Dropdown.Item eventKey={15}>QMGA Geometries</Dropdown.Item>
                <Dropdown.Item eventKey={1}>Unit Vector Orientations</Dropdown.Item>
                <Dropdown.Item eventKey={2}>Quaternion Orientations</Dropdown.Item>
            </Dropdown.Menu>
            <Dropdown.Menu title="Unfolded Samples">
                <Dropdown.Item eventKey={17}>Unfolded SC4 Nematic</Dropdown.Item>
                <Dropdown.Item eventKey={18}>Unfolded E3 Chiral Nematic</Dropdown.Item>
            </Dropdown.Menu>
            <Dropdown.Menu title="Spherocylinders">
                <Dropdown.Item eventKey={3}>SC4 Isotropic</Dropdown.Item>
                <Dropdown.Item eventKey={4}>SC4 Nematic</Dropdown.Item>
                <Dropdown.Item eventKey={5}>SC4 Smectic</Dropdown.Item>
            </Dropdown.Menu>
            <Dropdown.Menu title="Prolate and Oblate Ellipsoids">
                <Dropdown.Item eventKey={12}>E3 Chiral Nematic</Dropdown.Item>
                <Dropdown.Item eventKey={6}>E5 Isotropic</Dropdown.Item>
                <Dropdown.Item eventKey={7}>E5 Nematic</Dropdown.Item>
                <Dropdown.Item eventKey={8}>O5 Isotropic</Dropdown.Item>
                <Dropdown.Item eventKey={9}>O5 Nematic</Dropdown.Item>
            </Dropdown.Menu>
            <Dropdown.Menu title="Dense Packings">
                <Dropdown.Item eventKey={10}>Biaxial Crystal (Small)</Dropdown.Item>
                <Dropdown.Item eventKey={11}>Biaxial Crystal (Large)</Dropdown.Item>
                <Dropdown.Item eventKey={13}>HBC (in Cylinder)</Dropdown.Item>
            </Dropdown.Menu>
            <Dropdown.Item panel style={{width: 120}}></Dropdown.Item>
        </Dropdown>);

    }
}

class PerformanceDropdown extends React.Component {

    constructor(props) {
        super(props);
        this.model = props.model;
        this.state = {val: props.model.lod + 1, variable_lod: props.model.variable_lod};
        this.updateVal = this.updateVal.bind(this);
        this.toggleVariableLod = this.toggleVariableLod.bind(this);
    }

    updateVal(val) {
        this.setState({
            val: val
        });
    }

    toggleVariableLod(){
        this.model.set_variable_lod(!this.model.variable_lod);
        this.setState({variable_lod: this.model.variable_lod})
    }

    render() {
        const lod = this.state.val;
        const variable_lod = this.state.variable_lod;
        return (<Dropdown title="Level of Detail" trigger='click' placement="bottomEnd" icon={<Icon icon="sliders"/>}>
            <Form style={{marginLeft: 20, marginTop: 20}} layout="inline">
                <FormGroup>
                    <ControlLabel>Adjust LOD</ControlLabel>
                    <Whisper placement="bottom" trigger="hover" speaker={<Tooltip>
                        Decreasing LOD will increase rendering speed.
                    </Tooltip>}>
                        <Icon icon="question-circle" size="lg"/>
                    </Whisper>
                </FormGroup>
            </Form>

            <Slider
                min={1}
                step={1}
                max={Shape.complexity_count}
                value={lod}
                graduated
                progress
                style={{width: 200, marginLeft: 30, marginRight: 30, marginBottom: 20}}
                onChange={(value) => {
                    this.model.updateLOD(value - 1);
                    this.updateVal(value);
                    this.model.update();
                }}

            />
            <Checkbox style={{marginLeft: 12}} checked={variable_lod}
                      onClick={this.toggleVariableLod}> Variable LOD</Checkbox>
            <br/>
        </Dropdown>);
    }

}


class GeneralMenu extends React.Component {

    constructor(props) {
        super(props);
        this.model = props.model;
        this.functions = props.functions;
        this.toggler = props.toggler;
        this.state = {fps: 0, showDrawer: false, rotating: false, numOfRender: this.model.numOfObject};
        this.updateFPS = this.updateFPS.bind(this);
        this.toggleDrawer = this.toggleDrawer.bind(this);
        this.toggleAutorotate = this.toggleAutorotate.bind(this);
        this.runPerformanceTest = this.runPerformanceTest.bind(this);


        this.chronometer = props.chronometer;
        this.chronometer.f = this.updateFPS;


        this.toggler.autorotate = () => {
            this.toggleAutorotate();
        }


    }

    toggleAutorotate() {
        this.setState({
            rotating: !this.state.rotating
        });
        this.model.toggleAutorotate();
        if (this.model.rotating) {
            this.toggler.closeSidemenu();
        }
        this.continuousRender();
    }

    runPerformanceTest() {
        Alert.info("To modify testing parameters, see 'initTesting()' in Model class.");

        this.model.initTesting(this.chronometer.step);

        if (!this.state.rotating) {
            this.toggleAutorotate();
        }

        this.chronometer.testing = true;
    }

    continuousRender = () => {
        this.model.update();
        this.chronometer.click();
        this.model.controls.update();
        if (this.model.rotating) {
            requestAnimationFrame(this.continuousRender);
        }
    }


    toggleDrawer() {
        this.setState({
            showDrawer: !this.state.showDrawer
        });
    }

    updateFPS(fps) {
        this.setState({
            fps: fps.toFixed(2), numOfRender: this.model.numOfObject
        });
    }

    render() {
        const num = this.state.numOfRender;
        const fps = this.state.fps;
        const showDrawer = this.state.showDrawer;
        const rotating = this.state.rotating;
        return (<div>
            <Header style={{height: 56}}>
                <Navbar>
                    <Navbar.Body>
                        <Nav pullRight>
                            <ButtonToolbar>

                                <Nav.Item active>fps: {fps}</Nav.Item>
                                <Nav.Item active>Draw calls made: {num}</Nav.Item>
                                <Nav.Item onClick={this.runPerformanceTest} appearance="active"
                                          icon={<Icon icon="dashboard"/>}>Run Performance Test</Nav.Item>

                                <Nav.Item active={rotating} onClick={this.toggleAutorotate} appearance="subtle"
                                          icon={<Icon icon="refresh" spin={rotating}/>}>Autorotate</Nav.Item>


                                <PerformanceDropdown model={this.model}/>
                                <LibraryDropdown f={this.functions[3]}/>
                                <Nav.Item onClick={this.toggleDrawer} appearance="subtle"
                                          icon={<Icon icon="info"/>}>About</Nav.Item>
                                <ExportDropdown f={this.functions[2]}/>
                                <Nav.Item appearance="subtle" icon={<Icon icon="file-download"/>}
                                          onSelect={this.functions[0]}>Save</Nav.Item>
                                <input type="file"
                                       id="upload-btn"
                                       style={{display: 'none'}}
                                       className='input-file'
                                       accept='.json,.webmga'
                                       onChange={e => this.functions[1](e.target.files[0])}/>
                                <label htmlFor="upload-btn">
                                    <Nav.Item icon={<Icon icon="file-upload"/>}>Upload</Nav.Item>
                                </label>

                            </ButtonToolbar>

                        </Nav>
                        <Nav>
                            <h6 style={{padding: 20}}> WebMGA</h6>
                        </Nav>
                    </Navbar.Body>
                </Navbar>
            </Header>
            <Drawer
                size={'sm'}
                placement={'right'}
                show={showDrawer}
                onHide={this.toggleDrawer}
                backdrop={false}
            >
                <Drawer.Header>
                    <Drawer.Title>About</Drawer.Title>
                    <br/>
                    <ButtonToolbar>
                        <Button key="man" color="cyan"
                                href="files/manual.txt" target="_blank"
                                rel="noopener noreferrer">
                            <Icon icon="info-circle"/> User Manual
                        </Button>
                        <Button color="cyan" href="http://students.cs.ucl.ac.uk/2019/group3/WebMGA/notes.pdf"
                                target="_blank" rel="noopener noreferrer">
                            <Icon icon="mortar-board"/> Liquid Crystals
                        </Button>
                        <Button color="cyan" href="https://github.com/WebMGA/WebMGA-3" target="_blank"
                                rel="noopener noreferrer">
                            <Icon icon="github"/> Github
                        </Button>
                        <Button color="cyan" href="https://joe-down.github.io/Final-Year-Project-Dissertation/main.pdf"
                                target="_blank" rel="noopener noreferrer">
                            <Icon icon="book"/> Joe Down, MSc Thesis, UCL 2024
                        </Button>
                        <Button color="cyan" href="dissertations/2023.pdf"
                                target="_blank" rel="noopener noreferrer">
                            <Icon icon="book"/> Yue He, MSc Thesis, UCL, 2023
                        </Button>
                        <Button color="cyan" href="dissertations/2021.pdf"
                                target="_blank" rel="noopener noreferrer">
                            <Icon icon="book"/> Eduardo Battistini Parra, MSc Thesis, UCL, 2021
                        </Button>
                    </ButtonToolbar>
                    <br/>
                    <p><i>See 'Liquid Crystals' for a scientific explanation of the liquid crystal configurations
                        included in the library.</i></p>

                    <p><i>For information on how to upload a custom configuration or how to cite WebMGA in a
                        scientific publication, see 'User Manual'.</i></p>

                </Drawer.Header>

                <div style={{margin: 25}}>
                    <h2>WebMGA </h2>
                    <br/>
                    <h3>About</h3>
                    WebMGA was developed by Eduardo Battistini in 2020-21 for his final project within the BSc
                    Computer Science at University College London, supervised by Guido Germano, Michael P. Allen,
                    and Tobias Ritschel.
                    <br/><br/>
                    The WebGL Molecular Graphics Application, or WebMGA, is a web-based visualisation tool for
                    coarse-grained molecular models that utilises prolated and elongated convex bodies as the
                    elementary units of simulation.
                    <br/><br/>
                    Given the prevalence of said geometries in the modelling of liquid crystal systems and the lack
                    of available visualisation platforms suitable for this niche, WebMGA provides a unique,
                    out-of-the-box solution for researchers and educators to generate, stylise, and interact with
                    three-dimensional renders of molecular simulations.
                    <br/><br/>
                    WebMGA is written in Javascript, and implements the graphics library <a
                    href="https://threejs.org/" target="_blank" rel="noopener noreferrer">Threejs</a> for rendering
                    images and the <a href="https://rsuitejs.com/" target="_blank"
                                      rel="noopener noreferrer">rSuite</a> library to provide a sleek user interface
                    that is intuitively compartmentalised and easy to learn.
                    <br/><br/>
                    WebMGA is an evolution of <a href="http://qmga.sourceforge.net/" target="_blank"
                                                 rel="noopener noreferrer">QMGA</a>, an OpenGL and Qt3 based
                    application written in C++ that filled this gap in molecular graphics in 2008.
                    <br/><br/>
                    <h3>Citation</h3>
                    If you like WebMGA and use pictures generated with it in a scientific publication, please cite it this way:
                    <br/><br/>
                    The pictures were produced with WebMGA 3.0 [1], an evolution of QMGA [2] based on WebGL.
                    <br/><br/>
                    [1] Joe Down, Yue He, Eduardo Battistini Parra, Guido Germano, “WebMGA 3.0, a WebGL molecular graphics application for the interactive rendering of coarse-grained liquid crystal models”, UCL, 2024, <a href="https://webmga.github.io/WebMGA-3">https://webmga.github.io/WebMGA-3</a>.
                    <br/><br/>
                    [2] Adrian T. Gabriel, Timm Meyer, Guido Germano, “Molecular graphics of convex-body fluids", Journal of Chemical Theory and Computation 4, 468-476, 2008, DOI 10.1021/ct700192z, <a href="http://qmga.sourceforge.net">http://qmga.sourceforge.net</a>.
                </div>
            </Drawer>
        </div>);
    }
}

export default GeneralMenu;