import Model from "./Model/Model";
import View from "./View/View"
import 'rsuite/dist/styles/rsuite-dark.css';
import {mean, std} from 'mathjs';
import unfolded_sample1 from './Samples/UnfoldedSC4.json';
import unfolded_sample2 from './Samples/UnfoldedE3.json';
import sample1 from './Samples/dummy-vector.json';
import sample2 from './Samples/dummy-quaternion.json';
import sample3 from './Samples/sc4-isotropic.json';
import sample4 from './Samples/sc4-nematic.json';
import sample5 from './Samples/sc4-smectic.json';
import sample6 from './Samples/e5-isotropic.json';
import sample7 from './Samples/e5-nematic.json';
import sample8 from './Samples/o5-isotropic.json';
import sample9 from './Samples/o5-nematic.json';
import sample10 from './Samples/bx-crystal.json';
import sample11 from './Samples/bx-crystal-2.json';
import sample12 from './Samples/fig1.json';
import sample13 from './Samples/hbc.json';
import sample14 from './Samples/single.json'
import sample15 from './Samples/qmga-shapes.json'

import {Alert, Notification} from 'rsuite'


class Controller {
    model;
    view;
    io;
    ExternalToggle = class ExternalToggle {
        // these functions are defined within their respective React components
        closeSidemenu = () => {
        }
        autorotate = () => {
        }
        updateCamera = () => {
        }

    }
    Chronometer = class Chronometer {

        constructor(notify, externalToggle) {
            this.fps = 0;
            this.frames = 0;
            this.prevTime = null;
            this.model = null;

            this.notify = notify;
            this.externalToggle = externalToggle;

            this.step = 5000;
            this.tick = 12;
            this.testing = false;
            this.counter = 0;
            this.rawPerformanceData = [];
            this.avgPerformanceData = [];
            this.stdPerformanceData = [];
        }

        f = (n) => {
            //is initialised in Header React Component
        }

        fps = () => {
            return this.fps;
        }

        logPerformance = () => {
            this.rawPerformanceData.push(this.fps);
            if (this.counter === this.tick) {
                this.avgPerformanceData.push(mean(this.rawPerformanceData));
                this.stdPerformanceData.push(std(this.rawPerformanceData));
                this.rawPerformanceData = [];
                this.counter = 0;

                this.notify('info', ' Test Update (' + this.model.testTotal.toString() + ' Molecules)', (
                    <p style={{width: 320}}>
                        <b>FPS</b> <br/>
                        Average: {this.avgPerformanceData[this.avgPerformanceData.length - 1].toString()} <br/>
                        Standard Deviation: {this.stdPerformanceData[this.stdPerformanceData.length - 1].toString()}
                        <br/>
                    </p>));

                console.log('# of Molecules: ' + this.model.testTotal.toString() + ' FPS - Avg:  ' + this.avgPerformanceData[this.avgPerformanceData.length - 1].toString() + 'Std: ' + this.stdPerformanceData[this.stdPerformanceData.length - 1].toString())

                if (this.model.addRandomParticles(this.step)) {
                    this.testing = false;
                    this.model.deleteAllMeshes();
                    console.log('Average FPS');
                    console.log(this.avgPerformanceData);
                    console.log('Std FPS');
                    console.log(this.stdPerformanceData);
                    this.externalToggle.autorotate();
                    this.notify('success', 'Test Completed Succesfully', (<p style={{width: 320}}>
                        All molecules deleted. Please see console output for a list of average FPS and standard
                        deviations.
                    </p>));

                }
            }
            this.counter++;
        }


        click = () => {
            this.frames++;

            if (this.prevTime === null) {
                this.prevTime = Date.now();
            }

            let time = Date.now();


            if (time > this.prevTime + 1000) {
                this.fps = (this.frames * 1000) / (time - this.prevTime);

                if (this.testing) {
                    this.logPerformance();
                }

                this.prevTime = time;
                this.frames = 0;
                this.f(this.fps);


            }
        }
    };

    constructor() {

        this.io = [this.save, this.load, this.export, this.loadSample, this.toggleAutorotate, this.saveVideoState];
        this.externalToggle = new this.ExternalToggle();
        this.chronometer = new this.Chronometer(this.notify, this.externalToggle);

        this.model = new Model(this.chronometer, this.notify);
        this.view = new View(this.model, this.io, this.chronometer, this.externalToggle);

        Alert.config(({
            top: 70, duration: 8000
        }));

    }

    start = () => {
        this.chronometer.model = this.model;
        this.generate(sample2, true, false);
        // this.model.occlusionCulling();
        this.addListeners();
        this.notify('info', `Welcome to WebMGA`, (<div>
            <p style={{width: 320}}>
                Check out the liquid crystal configurations in the Library, and head to the About section to
                learn more!

            </p>
            <p style={{width: 320}}>
                This application works best on the Chrome browser.
            </p></div>));
        // this.loadVideoSample();
    }


    notify(type, title, description) {
        Notification[type]({
            title: title, placement: 'bottomEnd', duration: 7000, description: description
        });
    }

    //from stackoverflow
    download = (data, filename, type) => {
        let file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename); else { // Others
            let a = document.createElement("a"), url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }

    save = () => {
        let data = {};
        data.model = this.model.getData();
        data.state = this.view.getData();
        this.download(JSON.stringify(data), 'visualisation.webmga', 'application/json');
    }

    saveVideoState = () => {
        let data = {};
        data.state = this.view.getData();
        console.log('get state');
        return JSON.stringify(data);

    }

    generate = (data, starting, vidstate) => {
        this.model.genSets(data.model.sets);
        if (data.state == null) {
            if (vidstate) {
                this.view.setState((JSON.parse(vidstate)).state, true);
            } else {
                this.view.setDefaultState(starting, false);
                Alert.info("Setting default viewing state.");
            }
        } else {
            this.view.setState(data.state, false);
        }
        this.model.update();
        this.externalToggle.closeSidemenu();
    }

    load = (file, VIDEO, vidstate) => {
        let fileReader = new FileReader();
        fileReader.onloadend = () => {
            let data;
            if (file.type === "application/json") {
                data = JSON.parse(fileReader.result);
            } else if (file.name.split(".").pop().toLowerCase() === "qmga") {
                data = this.qmga_to_json(fileReader.result);
            } else {
                data = this.cnf_to_json(fileReader.result);
            }
            try {
                console.log(vidstate);
                this.generate(data, false, vidstate);
                if (VIDEO === false) {
                    Alert.success('File loaded successfully.');
                }
            } catch {
                Alert.error('Error: Please review uploaded file. See manual for help.');
            }
        };
        fileReader.readAsText(file);
    }

    qmga_to_json(data) {
        let set = {name: "Molecules", orientationType: "v"}
        let split_data = data.trim().split("\n")
        let unit_box = split_data[0].split(/ +/)
        set.unitBox = [parseFloat(unit_box[0]) / 2, parseFloat(unit_box[1]) / 2, parseFloat(unit_box[2]) / 2]
        let molecule_count = split_data.length - 1
        set.positions = new Array(molecule_count)
        set.orientations = new Array(molecule_count)
        for (let molecule_number = 0; molecule_number < molecule_count; ++molecule_number) {
            let molecule_data = split_data[molecule_number + 1].trim().split(/ +/)
            //TODO need to implement scale at position 0
            set.positions[molecule_number] = molecule_data.slice(1, 4).map(value => parseFloat(value))
            set.orientations[molecule_number] = molecule_data.slice(4, 7).map(value => parseFloat(value))
        }
        return {model: {sets: [set]}, state: null}
    }

    cnf_to_json(data) {
        let set = {name: "Molecules", orientationType: "v"}
        let split_data = data.trim().split("\n")
        set.unitBox = [parseFloat(split_data[1]), parseFloat(split_data[2]), parseFloat(split_data[3])]
        let molecule_count = parseInt(split_data[0])
        set.positions = new Array(molecule_count)
        set.orientations = new Array(molecule_count)
        for (let molecule of split_data.slice(5)) {
            let molecule_data = molecule.trim().split(/ +/)
            let molecule_number = parseInt(molecule_data[12]) - 1
            set.positions[molecule_number] = molecule_data.slice(0, 3).map(value => parseFloat(value))
            set.orientations[molecule_number] = molecule_data.slice(6, 9).map(value => parseFloat(value))
        }
        return {model: {sets: [set]}, state: null}
    }


    loadSample = (id) => {
        let sample;

        switch (id) {
            case 1:
                sample = sample1;
                break;
            case 2:
                sample = sample2;
                break;
            case 3:
                sample = sample3;
                break;
            case 4:
                sample = sample4;
                break;
            case 5:
                sample = sample5;
                break;
            case 6:
                sample = sample6;
                break;
            case 7:
                sample = sample7;
                break;
            case 8:
                sample = sample8;
                break;
            case 9:
                sample = sample9;
                break;
            case 10:
                sample = sample10;
                break;
            case 11:
                sample = sample11;
                break;
            case 12:
                sample = sample12;
                break;
            case 13:
                sample = sample13;
                break;
            case 14:
                sample = sample14;
                break;
            case 15:
                sample = sample15;
                break;
            case 17:
                sample = unfolded_sample1;
                break;
            case 18:
                sample = unfolded_sample2;
                break;
            default:
                Alert.error('Error: File does not exist');
                return;
        }

        this.generate(sample, false, false);


        Alert.success('File loaded successfully.');

    }
    export = (height, width, resolution) => {
        // fix orthographic projection
        this.model.height = height;
        this.model.width = width;
        this.model.updateCamera();

        this.model.renderer.setSize(width, height);

        this.model.renderer.render(this.model.scene, this.model.camera);

        const dataURL = this.model.renderer.domElement.toDataURL("image/jpeg", resolution / 10);

        let link = document.createElement('a');
        link.download = "WebMGA Visualisation.jpeg";
        link.href = dataURL;
        link.click();

        this.model.updateDimensions();
        this.model.updateCamera();


        this.notify('success', `Thank you!`, (<div>
            Image exported successfully.
        </div>));
    }

    getHeader = () => {
        return this.view.header;
    }

    getSidebar = () => {
        return this.view.sidebar;
    }


    getDomElement = () => {
        return this.model.renderer.domElement;
    }

    updateCamera = () => {
        View.state.camera.position.x = Math.round(this.model.camera.position.x * 100) / 100;
        View.state.camera.position.y = Math.round(this.model.camera.position.y * 100) / 100;
        View.state.camera.position.z = Math.round(this.model.camera.position.z * 100) / 100;

        View.state.camera.lookAt.x = Math.round(this.model.controls.target.x * 100) / 100;
        View.state.camera.lookAt.y = Math.round(this.model.controls.target.y * 100) / 100;
        View.state.camera.lookAt.z = Math.round(this.model.controls.target.z * 100) / 100;

        View.state.camera.zoom = this.model.camera.zoom;


        this.externalToggle.updateCamera();
    }

    render = () => {
        this.model.update();
        this.updateCamera();
    }

    addListeners = () => {
        this.model.controls.addEventListener('change', this.render);

        document.body.style.overflow = "hidden";

        window.addEventListener('resize', () => {
            this.model.updateDimensions();
            this.model.updateCamera();
        });

        document.addEventListener('fullscreenchange', () => {
            this.model.updateDimensions();
            this.model.updateCamera();
        });


        document.body.onkeydown = (e) => {
            switch (e.code) {
                case 'Space':
                    this.externalToggle.autorotate();
                    if (this.chronometer.testing) {
                        this.chronometer.testing = false;
                    }
                    break;
                case  'KeyA':
                    console.log(this.model.camera.position);
                    break;
                default:
            }

            // //g
            // if (key == 71) {
            //     this.model.toggleGrid();
            // }
            // if (key == 69) {
            //     this.view.toggleSidebar();
            // }
        }
    }
}

export default Controller;