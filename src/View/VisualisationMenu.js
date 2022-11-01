
import { Sidebar, Nav, Icon, Navbar, Container, Content, IconButton, Alert } from 'rsuite';
import React, { Component } from "react";
import { CameraOptions, AdditionalLightOptions, AmbientLightOptions, ReferenceOptions, SlicingOptions, ModelsOptions } from './SubMenus'


const NavToggle = ({ expand, onChange }) => {
    return (
        <Navbar appearance="subtle" className="nav-toggle">
            <Navbar.Body>
                <Nav pullRight>
                    <IconButton
                        circle
                        style={{ textAlign: 'center', margin: 10 }}
                        onClick={onChange}
                        appearance="default"
                        icon={<Icon icon={expand ? 'angle-left' : 'angle-right'} />} />
                </Nav>
            </Navbar.Body>
        </Navbar>
    );
};

const navItemStyle = { margin: 6.5 };

var sidebarHeight = window.innerHeight - 56;

const CustomNav = ({ active, onSelect, ...props }) => {
    return (
        <div>
            <Nav {...props} activeKey={active} onSelect={onSelect} style={{ backgroundColor: '#101010', height: sidebarHeight }}>
                <Nav.Item title="Models"  eventKey="Models" icon={<Icon style={navItemStyle} size="lg" icon="shapes" />}>
                </Nav.Item>
                {/* <Whisper placement="right" trigger="hover" speaker={(<Tooltip>View</Tooltip>)}> */}
                <Nav.Item title="Camera"  eventKey="Camera" icon={<Icon style={navItemStyle} size="lg" icon="eye" />} />
                {/* </Whisper> */}
                {/* <Whisper placement="right" trigger="hover" speaker={(<Tooltip>Ambient Light</Tooltip>)}> */}
                <Nav.Item title="Ambient"  eventKey="Ambient" icon={<Icon style={navItemStyle} size="lg" icon="sun-o" />} />
                {/* </Whisper> */}
                {/* <Whisper placement="right" trigger="hover" speaker={(<Tooltip>Other Lighting</Tooltip>)}> */}
                <Nav.Item title="Lighting"  eventKey="Lighting" icon={<Icon style={navItemStyle} size="lg" icon="creative" />} />
                {/* </Whisper> */}
                {/* <Whisper placement="right" trigger="hover" speaker={(<Tooltip>Slicing</Tooltip>)}> */}
                <Nav.Item title="Slicing"  eventKey="Slicing" icon={<Icon style={navItemStyle} size="lg" icon="cut" />} />
                {/* </Whisper> */}
                {/* <Whisper placement="right" trigger="hover" speaker={(<Tooltip>Reference Frame Frame</Tooltip>)}> */}
                <Nav.Item title="Reference"  eventKey="Reference" icon={<Icon style={navItemStyle} size="lg" icon="cube" />} />
                {/* </Whisper> */}

            </Nav>
        </div>
    );
};

const MenuContent = ({ active, expand, onChange, model, toggler }) => {

    var menuContent = [];

    if (!expand) {
        menuContent.push(<NavToggle expand={expand} onChange={onChange} />);
    } else {
        menuContent.push(
            <div style={{ backgroundColor: '#0F131B' }}>
                <Nav>
                    <Navbar appearance="subtle">
                        <Nav >
                            <h3 style={{ marginTop: 15, marginLeft: 30 }}>{active}</h3>
                        </Nav>
                        <Nav pullRight>
                            <NavToggle expand={expand} onChange={onChange} />
                        </Nav>
                    </Navbar>

                </Nav>
            </div>
        );
    }

    if (expand) {
        switch (active) {
            case "Models":
                menuContent.push(<ModelsOptions key={active} model={model} />);
                break;
            case "Camera":
                menuContent.push(<CameraOptions key={active} model={model} toggler={toggler} />);
                break;
            case "Ambient":
                menuContent.push(<AmbientLightOptions key={active} model={model} />);
                break;
            case "Lighting":
                menuContent.push(<AdditionalLightOptions key={active} model={model} />);
                break;
            case "Slicing":
                menuContent.push(<SlicingOptions key={active} model={model} />);
                break;
            case "Reference":
                menuContent.push(<ReferenceOptions key={active} model={model} />);
                break;
            default:
                Alert.error('Error: Unknown Submenu Identifier');
        }
    }

    return menuContent;

}

class VisualisationMenu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            expand: props.sidebarExpanded,
            active: 'Models'
        };
        this.model = props.model;
        this.handleToggle = this.handleToggle.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.toggler = props.toggler;
        
        this.toggler.closeSidemenu = () => {
            if (this.state.expand){
                this.handleToggle();
            }
        }
    }
    handleToggle() {
        this.setState({
            expand: !this.state.expand
        });
        this.model.toggleSidebar();
    }
    handleSelect(activeKey) {
        this.setState({
            active: activeKey
        });

        if (!this.state.expand) {
            this.handleToggle();
        }

    }
    render() {
        const { expand } = this.state;
        const { active } = this.state;
        return (
            <div>
                <Sidebar
                    style={{ display: 'flex', flexDirection: 'column' }}
                    width={expand ? 356 : 56}
                    collapsible
                    appearance="default"
                >
                    <Container>
                        <Sidebar width={56} >
                            <CustomNav vertical appearance="subtle" active={active} onSelect={this.handleSelect} />
                        </Sidebar>
                        <Content >
                            <MenuContent key={10} active={active} expand={expand} onChange={this.handleToggle} model={this.model} toggler={this.toggler}/>
                        </Content>

                    </Container>

                </Sidebar>
            </div>

        );
    }
}


export default VisualisationMenu;