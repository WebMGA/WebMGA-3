import React, { Component } from "react";
import 'rsuite/dist/styles/rsuite-dark.css';
import { Container, Content } from 'rsuite';
import Controller from "./Controller";

class App extends Component {
  controller;

  constructor(props) {
    super(props);
    this.controller = new Controller();

    this.state = {
      header: this.controller.getHeader(),
      sidebar: this.controller.getSidebar()
    };
  }

  componentDidMount() {
    this.mount.appendChild(this.controller.getDomElement());
    this.controller.start();
  }

  render() {
    const header = this.state.header;
    const sidebar = this.state.sidebar;

    return (
      <div >
        <Container>
          {header}
          <Container>
            {sidebar}
            <Content>
              <div ref={ref => (this.mount = ref)} />
            </Content>
          </Container>

        </Container>

      </div>
    )
  }
}

export default App;
