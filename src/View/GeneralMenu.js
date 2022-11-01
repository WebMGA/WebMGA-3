
import { Header, Dropdown, FormGroup, Drawer, Nav, Navbar, Icon, Button, ButtonToolbar, Slider, Form, ControlLabel, Whisper, Tooltip, Divider, Alert } from 'rsuite';
import { ParameterSet } from './Tools';
import React from "react";

class ExportDropdown extends React.Component {

    constructor(props) {
        super();
        this.dimensions = [1000, 1000];
        this.f = props.f;
        this.setDimensions = this.setDimensions.bind(this);
        this.export = this.export.bind(this);
    }

    setDimensions(val, index) {
        this.dimensions[index] = parseInt(val);
    }

    export() {
        this.f(...this.dimensions);
    }

    render() {
        return (
            <Dropdown title="Export" trigger='click' placement="bottomEnd" icon={<Icon icon="export" />} >

                <ParameterSet f={this.setDimensions} titles={['Height', 'Width']} values={this.dimensions} step={5} positive
                    styling={[
                        { marginRight: 25 },
                        { marginTop: 18, marginLeft: 35 }
                    ]} />

                <Button style={{ width: 180, marginLeft: 25, marginRight: 25, marginTop: 15, marginBottom: 15 }} appearance='primary' onClick={this.export}> Export </Button>
            </Dropdown>);
    }

};

class LibraryDropdown extends React.Component {

    constructor(props) {
        super(props);
        this.model = props.model;
        this.state = { active: 2 };
        this.f = props.f;

        this.updateKey = this.updateKey.bind(this);
    }

    updateKey(key) {
        this.setState({
            active: key
        });
    }

    render() {
        const state = this.state;
        return (
            <Dropdown
                title="Library"
                trigger='click'
                placement="bottomEnd"
                icon={<Icon icon="database" />}
                appearance='subtle'
                onSelect={(eventKey) => {
                    this.f(eventKey);

                }}>

                <Dropdown.Menu title="Samples">
                    <Dropdown.Item eventKey={14}>Single Molecule</Dropdown.Item>
                    <Dropdown.Item eventKey={15}>QMGA Geometries</Dropdown.Item>
                    <Dropdown.Item eventKey={16}>Threejs Geometries</Dropdown.Item>
                    <Dropdown.Item eventKey={1}>Unit Vector Orientations</Dropdown.Item>
                    <Dropdown.Item eventKey={2}>Quaternion Orientations</Dropdown.Item>
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
                <Dropdown.Item panel style={{ width: 120 }}></Dropdown.Item>
            </Dropdown>
        );

    }
}

class PerformanceDropdown extends React.Component {

    constructor(props) {
        super(props);
        this.model = props.model;
        this.state = { val: props.model.lod + 1 };

        this.updateVal = this.updateVal.bind(this);
    }

    updateVal(val) {
        this.setState({
            val: val
        });
    }

    render() {
        const lod = this.state.val;
        return (
            <Dropdown title="Level of Detail" trigger='click' placement="bottomEnd" icon={<Icon icon="sliders" />}>
                <Form style={{ marginLeft: 20, marginTop: 20 }} layout="inline">
                    <FormGroup>
                        <ControlLabel>Adjust LOD</ControlLabel>
                        <Whisper placement="bottom" trigger="hover" speaker={
                            <Tooltip>
                                Decreasing LOD will increase rendering speed.
                            </Tooltip>
                        }>
                            <Icon icon="question-circle" size="lg" />
                        </Whisper>
                    </FormGroup>
                </Form>

                <Slider
                    min={1}
                    step={1}
                    max={5}
                    value={lod}
                    graduated
                    progress
                    style={{ width: 200, marginLeft: 30, marginRight: 30, marginBottom: 20 }}
                    onChange={(value) => {
                        this.model.updateLOD(value - 1);
                        this.updateVal(value);
                        this.model.update();
                    }}

                />
                <br />
            </Dropdown>
        );
    }

}


class GeneralMenu extends React.Component {

    constructor(props) {
        super(props);
        this.model = props.model;
        this.functions = props.functions;
        this.toggler = props.toggler;
        this.state = { fps: 0, showDrawer: false, rotating: false };

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
            fps: fps.toFixed(2)
        });
    }

    render() {
        const fps = this.state.fps;
        const showDrawer = this.state.showDrawer;
        const rotating = this.state.rotating;
        return (
            <div>
                <Header style={{ height: 56 }}>
                    <Navbar>
                        <Navbar.Body>
                            <Nav pullRight >
                                <ButtonToolbar>
                                
                                    <Nav.Item active>fps: {fps}</Nav.Item>
                                    <Nav.Item onClick={this.runPerformanceTest} appearance="active" icon={<Icon icon="dashboard" />}>Run Performance Test</Nav.Item>
                                    {/* <Whisper placement="bottom" trigger="hover" speaker={
                                        <Tooltip>
                                            The performance test was included for completeness and will be removed after submission.
                                        </Tooltip>
                                    }>
                                        <Icon style={{marginTop: 18}}icon="question-circle" size="lg" />
                                    </Whisper> */}
                                    <Nav.Item active={rotating} onClick={this.toggleAutorotate} appearance="subtle" icon={<Icon icon="refresh" spin={rotating} />}>Autorotate</Nav.Item>
                                
                                    
                                    <PerformanceDropdown model={this.model} />
                                    <LibraryDropdown f={this.functions[3]} />
                                    <Nav.Item onClick={this.toggleDrawer} appearance="subtle" icon={<Icon icon="info" />}>About</Nav.Item>
                                    <ExportDropdown f={this.functions[2]} />
                                    <Nav.Item appearance="subtle" icon={<Icon icon="file-download" />} onSelect={this.functions[0]}>Save</Nav.Item>
                                    <input type="file"
                                        id="upload-btn"
                                        style={{ display: 'none' }}
                                        className='input-file'
                                        accept='.json,.webmga'
                                        onChange={e => this.functions[1](e.target.files[0])} />
                                    <label for="upload-btn">
                                        <Nav.Item icon={<Icon icon="file-upload" />}>Upload</Nav.Item>
                                    </label>

                                </ButtonToolbar>

                            </Nav>
                            <Nav pullLeft>
                                <h6 style={{ padding: 20 }}> WebMGA</h6>
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
                        <br />
                        <ButtonToolbar >
                            <Button color="cyan" href="http://students.cs.ucl.ac.uk/2019/group3/WebMGA/notes.pdf" target="_blank" rel="noopener noreferrer">
                                <Icon icon="mortar-board" /> Liquid Crystals
                        </Button>
                            <Button key="man" color="cyan" href="http://students.cs.ucl.ac.uk/2019/group3/WebMGA/manual.txt" target="_blank" rel="noopener noreferrer">
                                <Icon icon="info-circle" /> User Manual
                        </Button>
                            <Button color="cyan" href="http://students.cs.ucl.ac.uk/2019/group3/WebMGA/diss.pdf" target="_blank" rel="noopener noreferrer">
                                <Icon icon="book" /> Dissertation
                        </Button>
                            <Button color="cyan" href="https://github.com/astromarx/WebMGA" target="_blank" rel="noopener noreferrer">
                                <Icon icon="github" /> Github
                        </Button>
                        </ButtonToolbar>
                        <br />
                        <p><i>See 'Liquid Crystals' for a scientific explanation of the liquid crystal configurations included in the library.</i></p>

                        <p><i>For information on how to upload a custom configuration or how to cite WebMGA in a scientific publication, see 'User Manual'.</i></p>

                    </Drawer.Header>

                    <div style={{ margin: 25 }}>
                        <h2>WebMGA </h2>
                        <br />
                        WebMGA was developed by Eduardo Battistini in 2020-21 for his final project within the BSc Computer Science at University College London, supervised by Guido Germano, Michael P. Allen, and Tobias Ritschel.
                        <br /><br />
                        The WebGL Molecular Graphics Application, or WebMGA, is a web-based visualisation tool for coarse-grained molecular models that utilises prolated and elongated convex bodies as the elementary units of simulation.
                        <br /><br />
                        Given the prevalence of said geometries in the modelling of liquid crystal systems and the lack of available visualisation platforms suitable for this niche, WebMGA provides a unique, out-of-the-box solution for researchers and educators to generate, stylise, and interact with three-dimensional renders of molecular simulations.
                        <br /><br />
                        WebMGA is written in Javascript, and implements the graphics library <a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">Threejs</a> for rendering images and the <a href="https://rsuitejs.com/" target="_blank" rel="noopener noreferrer">rSuite</a> library to provide a sleek user interface that is intuitively compartmentalised and easy to learn.
                        <br /><br />
                        WebMGA is an evolution of <a href="http://qmga.sourceforge.net/" target="_blank" rel="noopener noreferrer">QMGA</a>, an OpenGL and Qt3 based application written in C++ that filled this gap in molecular graphics in 2008.
                    
                    </div>
                </Drawer>
            </div>
        );
    }
};

export default GeneralMenu;