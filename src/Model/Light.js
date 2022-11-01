import { Alert } from 'rsuite';
import {
    AmbientLight,
    DirectionalLight,
    PointLight,
    DirectionalLightHelper,
    PointLightHelper
} from 'three';

export class Light {
    light;
    helper;

    static AMBIENT = 0;
    static DIRECTIONAL = 1;
    static POINT = 2;

    constructor(lightType) {
        this.setDefaultLights(lightType);
    }

    updatePosition(x, y, z){
        this.light.position.set(x, y, z);
    }

    updateColour(c, i){
        this.light.color.setHex(parseInt(c.substring(1), 16));
        this.light.intensity = i * 0.01;
    }

    setDefaultLights(lightType) {
        switch (lightType) {
            case 'ambient':
                this.light = new AmbientLight("#ffffff", 0.4);
                break;
            case 'directional':
                this.light = new DirectionalLight("#ffffff", 0.5);
                this.light.position.set(-5, 0, -5);
                this.helper = new DirectionalLightHelper(this.light, 10);
                break;
            case 'point':
                this.light = new PointLight("#ffffff", 0.6);
                this.light.position.set(5, 0, 5);
                this.helper = new PointLightHelper(this.light, 10);
                break;
            default:
                Alert.error("Error: null light type selected");
                break;
        }
    }
}

export default Light;