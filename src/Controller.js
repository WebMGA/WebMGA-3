import Model from "./Model/Model";
import View from "./View/View"
import 'rsuite/dist/styles/rsuite-dark.css';
import { std, mean } from 'mathjs';

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
import sample16 from './Samples/threejs-shapes.json'

import { Alert, Notification } from 'rsuite'

class Controller {
    model;
    view;
    io;

    constructor() {
        
        this.io = [this.save, this.load, this.export, this.loadSample, this.toggleAutorotate];
        this.externalToggle = new this.ExternalToggle();
        this.chronometer = new this.Chronometer(this.notify, this.externalToggle);

        this.model = new Model(this.chronometer, this.notify);
        this.view = new View(this.model, this.io, this.chronometer, this.externalToggle);

        Alert.config(
            ({
                top: 70,
                duration: 8000
            })
        );

    }

    ExternalToggle = class ExternalToggle {
        // these functions are defined within their respective React components

        closeSidemenu = () => { }
        autorotate = () => { }
        updateCamera = () => { }

    }

    Chronometer = class Chronometer {

        constructor(notify, externalToggle) {
            this.fps = 0;
            this.frames = 0;
            this.prevTime = null;
            this.model = null;

            this.notify = notify;
            this.externalToggle = externalToggle;

            this.step = 200;
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
            if (this.counter == this.tick) {

                this.avgPerformanceData.push(mean(this.rawPerformanceData));
                this.stdPerformanceData.push(std(this.rawPerformanceData));
                this.rawPerformanceData = [];
                this.counter = 0;

                this.notify('info', ' Test Update (' + this.model.testTotal.toString() + ' Molecules)',
                    (<p style={{ width: 320 }} >
                        <b>FPS</b> <br />
                        Average: {this.avgPerformanceData[this.avgPerformanceData.length - 1].toString()} <br />
                        Standard Deviation: {this.stdPerformanceData[this.stdPerformanceData.length - 1].toString()} <br />
                    </p>));

                console.log('# of Molecules: ' + this.model.testTotal.toString() + ' FPS - Avg:  ' + this.avgPerformanceData[this.avgPerformanceData.length - 1].toString()
                    + 'Std: ' + this.stdPerformanceData[this.stdPerformanceData.length - 1].toString())

                if (this.model.addRandomParticles(this.step)) {
                    this.testing = false;
                    this.model.deleteAllMeshes();

                    console.log('Average FPS');
                    console.log(this.avgPerformanceData);
                    console.log('Std FPS');
                    console.log(this.stdPerformanceData);

                    this.externalToggle.autorotate();

                    this.notify('success', 'Test Completed Succesfully',
                        (<p style={{ width: 320 }} >
                            All molecules deleted. Please see console output for a list of average FPS and standard deviations.
                        </p>));

                }
            }
            this.counter++;
        }


        click = () => {
            this.frames++;

            if (this.prevTime == null) {
                this.prevTime = Date.now();
            }

            var time = Date.now();


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


    start = () => {
        this.chronometer.model = this.model;

        this.generate(sample2, true);
        this.addListeners();
        this.render();
        this.notify('info', 'Welcome to WebMGA',
            (<div>
            <p style={{ width: 320 }} >
                Check out the liquid crystal configurations in the Library, and head to the About section to learn more!
                
            </p>
            <p style={{ width: 320 }} >
                This application works best on the Chrome browser.
             </p></div>
            )



        );
    }

    notify(type, title, description) {
        Notification[type]({
            title: title,
            placement: 'bottomEnd',
            duration: 15000,
            description: description
        });
    }

    //from stackoverflow
    download = (data, filename, type) => {
        var file = new Blob([data], { type: type });
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                url = URL.createObjectURL(file);
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

    generate = (data, starting) => {
        this.model.genSets(data.model.sets);
        if (data.state == null) {
            Alert.info("Setting default viewing state.");
            this.view.setDefaultState(starting);
        } else {
            this.view.setState(data.state);
        }
        this.model.updateLOD(this.model.lod);
        this.model.update();
        this.externalToggle.closeSidemenu();

    }

    load = (file) => {
        let fileReader = new FileReader();
        const read = () => {
            var data = JSON.parse(fileReader.result);
            try {
                this.generate(data, false);
                Alert.success('File loaded successfully.');
            } catch {
                Alert.error('Error: Please review uploaded file. See manual for help.');
                return;
            }
        }
        fileReader.onloadend = read;
        fileReader.readAsText(file);
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
            case 16:
                sample = sample16;
                break;
            default:
                Alert.error('Error: File does not exist');
                return;
        }

        this.generate(sample, false);
        Alert.success('File loaded successfully.');
    }

    convertQMGA = () => {
        // fetch(sample2)
        //     .then(res => res.text())
        //     .then(configData => {
        //         this.model.load(configData);
        //         this.view.setDefaultStates();
        //         console.log(this.model.sets);
        //     });
    }

    export = (height, width) => {
        // fix orthographic projection

        this.model.height = height;
        this.model.width = width;
        this.model.updateCamera();

        this.model.renderer.setSize(width, height);
        this.model.renderer.render(this.model.scene, this.model.camera);
        const dataURL = this.model.renderer.domElement.toDataURL("image/png", 1.0).replace("image/png", "image/octet-stream");

        this.model.updateDimensions();
        this.model.updateCamera();


        var link = document.createElement('a');
        link.download = "WebMGA Visualisation.png";
        link.href = dataURL;
        link.click();

        this.model.updateDimensions();
        this.model.updateCamera();


        this.notify('success', 'Thank you!', (
            <div>
                Image exported successfully.
            </div>
        ));
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
            var key = e.keyCode;
            //TODO
            //spacebar
            if (key == 32) {
                this.externalToggle.autorotate();

                if (this.chronometer.testing) {
                    this.chronometer.testing = false;
                }
            }
            // //a
            if (key == 65) {
                console.log(this.model.camera.position);
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

