import {Alert} from 'rsuite';
import {AmbientLight, DirectionalLight, DirectionalLightHelper, Light, PointLight, PointLightHelper} from 'three';

enum LightTypes {
    AMBIENT = 0,
    DIRECTIONAL,
    POINT
}

export class LightNew {
    static light_types = LightTypes;
    light: Light;
    helper: DirectionalLightHelper | PointLightHelper | undefined;

    constructor(lightType: LightTypes) {
        this.light = this.setLight(lightType);
        this.helper = this.setHelper();
    }

    setLight(lightType: LightTypes) {
        let light;
        switch (lightType) {
            case LightTypes.AMBIENT:
                light = new AmbientLight("#ffffff", 0.4);
                break;
            case LightTypes.DIRECTIONAL:
                light = new DirectionalLight("#ffffff", 0.5);
                light.position.set(-5, 0, -5);
                break;
            case LightTypes.POINT:
                light = new PointLight("#ffffff", 0.6);
                light.position.set(5, 0, 5);
                break;
            default:
                Alert.error("Error: null light type selected");
                throw RangeError;
        }
        return light
    }

    setHelper() {
        let helper;
        if (this.light instanceof DirectionalLight) {
            helper = new DirectionalLightHelper(this.light, 10);
        }
        if (this.light instanceof PointLight) {
            helper = new PointLightHelper(this.light, 10);
        }
        return helper;
    }

    updatePosition(x: number, y: number, z: number) {
        this.light.position.set(x, y, z);
    }

    updateColour(c: string, i: number) {
        this.light.color.setHex(parseInt(c.substring(1), 16));
        this.light.intensity = i * 0.01;
    }
}

export default LightNew;