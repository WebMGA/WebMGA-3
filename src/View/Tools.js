

import { Dropdown, RangeSlider, InputGroup, InputNumber, Row, Col, Slider, ButtonToolbar} from 'rsuite';
import React, { useState } from "react";


export const ParameterSet = (props) => {
    var set = [];

    for (let i = 0; i < props.titles.length; i++) {

        set.push(
            <ParameterInput key={i} title={props.titles[i]} values={props.values[i]} numerical f={props.f} index={i} step={props.step} positive={props.positive} styling={props.styling}/>
        );
    }

    return set;
}

export class ParameterInput extends React.Component {


    constructor(props) {
        super();
        this.styling = props.styling;
        this.active = props.active;
        this.f = props.f;
        this.step = props.step;
        this.title = props.title;
        this.values = props.values;
        this.numerical = props.numerical;
        this.index = props.index;
        this.selectingSet = props.selectingSet;
        this.changeValue = this.changeValue.bind(this);

        if (props.positive){
            this.min = 0;
        }
    }

    changeValue(value) {
        this.active = value;
        this.f(value, this.index);
    }

    render() {
        var InputBox;

        if (this.numerical) {
            const defaultVal = this.values;
            InputBox =
                (<div style={this.styling[0]}>
                    <InputNumber defaultValue={defaultVal} step={this.step} onChange={this.changeValue} min={this.min} />
                </div>);
        } else {

            var vals = this.values;
            var active = this.active;
            var listItems = [];
            let act;

            for (let val of vals) {
                (active.localeCompare(val)) ? act = false : act = true;
                listItems.push(<Dropdown.Item eventKey={val} active={act} onSelect={this.changeValue}>{val}</Dropdown.Item>);
            }

            listItems.push(<Dropdown.Item eventKey={'panel'} panel style={{ width: 150 }}></Dropdown.Item>);

            InputBox = (
                <ButtonToolbar style={{ width: 10, marginLeft: 0 }}>
                    <Dropdown style={{ width: 200 }} title={this.active}>
                        {listItems}
                    </Dropdown>
                </ButtonToolbar>
            );

        }

        return (
            <div >
                <Row style={{ marginTop: 15 }}>
                    <Col md={10}><p style={this.styling[1]}>{this.title}</p></Col>
                    <Col md={10} />
                    <Col md={14}>{InputBox}</Col>
                </Row>
            </div>
        );
    }
}

export const SliceSlider = (props) => {
    const [value, setValue] = React.useState(props.vals);
    let f = props.f;
    let i = props.index;

    return (
        <div>
            <br/>
            <Row>
                <Col md={5}>
                    <p style={{ marginTop: 10, marginLeft: 30 }}>{props.title}</p>
                </Col>
                <Col md={1} />
                <Col md={16}>
                    <InputGroup>
                        <InputNumber
                            min={-50.0}
                            max={50.0}
                            value={value[0]}
                            step={0.1}
                            onChange={nextValue => {
                                const end = value[1];
                                if (parseFloat(nextValue) > end) {
                                    return;
                                }
                                setValue([parseFloat(nextValue), end]);
                                f(i, [parseFloat(nextValue),end]);
                            }}
                        />
                        <InputGroup.Addon>to</InputGroup.Addon>
                        <InputNumber
                            min={-50.0}
                            max={50.0}
                            value={value[1]}
                            step={0.1}
                            onChange={(nextValue) => {
                                const start = value[0];
                                if (start > parseFloat(nextValue)) {
                                    return;
                                }
                                setValue([start, parseFloat(nextValue)]);
                                f(i, [start, parseFloat(nextValue)]);
                            }}
                        />
                    </InputGroup>
                </Col>
            </Row>
            <Row>
                <Col md={21}>
                    <RangeSlider
                        min={-50.0}
                        max={50.0}
                        progress
                        style={{ marginLeft: 35, marginTop: 30 }}
                        value={value}
                        onChange={value => {
                            setValue(value);

                            f(i, value);
                        }}
                    />
                </Col>

            </Row>
        </div>
    );
}

export const CustomSlider = (props) => {

    var f = props.f;
    var [value, setValue] = useState(props.val);
    var type;


    let disabled = props.disabled;
    const [min, max] = props.boundaries;


    if (props.type == null) {
        type = null;
    } else {
        type = props.type;
    }


    return (

        <Row>
            <Col md={10}>
                <Slider
                    style={{ marginLeft: 25, marginTop: 16, width: 170 }}
                    value={value}
                    min={min}
                    max={max}
                    disabled={disabled}
                    onChange={value => {
                        setValue(value);
                        f(value, type);
                    }}
                />
            </Col>
            <Col md={4}>
                <InputNumber
                    style={{ marginLeft: 80, marginTop: 3, marginBottom: 3, width: 70, height: 35 }}
                    min={min}
                    max={max}
                    value={value}
                    disabled={disabled}
                    onChange={value => {
                        setValue(value);
                        f(value, props.type)
                    }}
                />
            </Col>
        </Row>
    );

}