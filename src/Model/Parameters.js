
export var Parameters = {
    Ellipsoid: {
        names: ['X', 'Y', 'Z'],
        vals: [0.2, 0.4, 0.8]
    },
    Spherocylinder:{
        names: ['Radius', 'Length'],
        vals: [0.5, 0.7]
    },
    Spheroplatelet:{
        names: ['RadSphere','RadCircle'],
        vals:[0.3,0.2]
    },
    CutSphere: {
        names: ['Radius','zCut'],
        vals: [0.8, 0.2]
    },
    Sphere: {
        names: ['Radius'],
        vals: [0.6]
    },
    Cylinder: {
        names: ['Top', 'Bottom', 'Height'],
        vals: [0.5,0.5,2.0]
    },
    Torus:{
        names:['Radius','Tube','Arc'],
        vals:[1.0,0.3,6.3]
    }
}

export default Parameters;