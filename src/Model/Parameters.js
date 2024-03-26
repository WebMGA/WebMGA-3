export var Parameters = {
    Ellipsoid: {
        names: ['X', 'Y', 'Z'], vals: [1.0, 1.0, 0.2]
    }, Spherocylinder: {
        names: ['Radius', 'Length'], vals: [0.5, 0.7]
    }, Spheroplatelet: {
        names: ['RadSphere', 'RadCircle'], vals: [0.3, 0.2]
    }, CutSphere: {
        names: ['Radius', 'zCut'], vals: [0.8, 0.7]
    }, Sphere: {
        names: ['Radius'], vals: [0.6]
    }, Cap: {
        names: ['Radius', 'zCut'], vals: [0.8, 0.7]
    }, Lens: {
        names: ['Radius', 'Angle'], vals: [1, 0.7]
    }, ThickLens: {
        names: ['Radius', 'Thickness', 'Angle'], vals: [1, 0.1, 0.7]
    }, RadiusOnlyLens: {
        names: ['Radius'], vals: [0.5]
    }, BiconvexLens: {
        names: ['Radius', 'Angle'], vals: [1, 0.7]
    }, DoubleCutSphere: {
        names: ['Radius', 'zCut'], vals: [0.8, 0.7]

    }
}

export default Parameters;