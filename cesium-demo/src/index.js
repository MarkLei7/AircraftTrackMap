/**
 * You can also import Cesium Object like this
 *
 * import * as Cesium from 'cesium';
 * const viewer = new Cesium.Viewer('cesiumContainer');
 */
import { Viewer, Ion, Color, createOsmBuildings, JulianDate, SampledPositionProperty, Cartesian3, IonResource, TimeIntervalCollection, TimeInterval, VelocityOrientationProperty, PathGraphics,HermitePolynomialApproximation } from "cesium";
import "./css/main.css";

const viewer = new Viewer("cesiumContainer");
// Your access token can be found at: https://cesium.com/ion/tokens.
// Replace `your_access_token` with your Cesium ion access token.
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYTk5NDZhNy1hZGRiLTQyNzUtYjRmZC0zZDM4ZDc0ZDRhZGQiLCJpZCI6NDYwNDcsImlhdCI6MTYxNTg3NTI1Mn0.QPYRQfxoUqWlLyFOYTbZKryd8BuVQCosSZD4tVlVpQ8';
const osmBuildings = viewer.scene.primitives.add(createOsmBuildings());
async function setRoute()  {
   const Route= await fetch('data/MU5735-Flightradar24-Granular-Data.csv').then(res=>res.text())
   const res = Route.split("\n").map((r) => r.split(","))
   //res.shift()
   console.log(res)
   const start = JulianDate.fromIso8601(res[1][0].replace(" ", "T").slice(0, 20));
   const timeP = JulianDate.addSeconds(start, 60, new JulianDate())
   const stop = JulianDate.fromIso8601(res[res.length - 1][0].replace(" ", "T").slice(0, 20));
   const positionProperty = new SampledPositionProperty();
   for (let i = 1; i < res.length; i++) {
       // Declare the time for this individual sample and store it in a new JulianDate instance.
       const r = res[i]
       const time = JulianDate.fromIso8601(r[0].replace(" ", "T").slice(0, 20));
       const position = Cartesian3.fromDegrees(Number(r[4]), Number(r[3]), Number(r[6]));
       // Store the position along with its timestamp.
       // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
       positionProperty.addSample(time, position);
       viewer.entities.add({
           description: `Location: (${r[4]}, ${r[3]}, ${r[6]})`,
           position: position,
           point: { pixelSize: 10, color: Color.RED }
       });
   }
   positionProperty.setInterpolationOptions({
    interpolationDegree : 2,    
    interpolationAlgorithm:HermitePolynomialApproximation
   })

   viewer.clock.startTime = timeP.clone();
   viewer.clock.stopTime = stop.clone();
   viewer.clock.currentTime = timeP.clone();
   viewer.timeline.zoomTo(timeP, stop);
   loadModel(start, stop, positionProperty)
}

setRoute()

viewer.clock.multiplier = 1.5;
// Start playing the scene.
viewer.clock.shouldAnimate = true;
//是否开启抗锯齿
viewer.scene.fxaa = true;
viewer.scene.postProcessStages.fxaa.enabled = true;

// STEP 6 CODE (airplane entity)
async function loadModel(start, stop, positionProperty) {
    // Load the glTF model from Cesium ion.
    const airplaneUri = await IonResource.fromAssetId(895338);
    const airplaneEntity = viewer.entities.add({
        availability: new TimeIntervalCollection([new TimeInterval({ start: start, stop: stop })]),
        position: positionProperty,
        // Attach the 3D model instead of the green point.
        model: { uri: airplaneUri },
        // Automatically compute the orientation from the position.
        orientation: new VelocityOrientationProperty(positionProperty),
        path: new PathGraphics({ width: 3 })
    });

    viewer.trackedEntity = airplaneEntity;
}

