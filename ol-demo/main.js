import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import VectorSource from 'ol/source/Vector';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
} from 'ol/style';
import { Vector as VectorLayer} from 'ol/layer';
import {getVectorContext} from 'ol/render';
import {fromLonLat} from 'ol/proj';
import gcoord from 'gcoord';

const data=[]

fetch('data/MU5735-Flightradar24-Granular-Data.csv').then(res=>res.text())
.then(res=>res.split("\r\n"))
.then(res=>res.map((r)=>r.split(",")))
.then(res=>{
  console.log(res.shift())
  console.log(res.pop())
  
  setData(res)
  setRoute(data)
})
const setTime=(time)=>{
  const t=time.slice(11,19).split(":")
  let h=Number(t[0])+8
  h=h.toString()
  t[0]=h
  return t.join(":")

}
const setData=(res=[])=>{
    for(const r of res){
      if(r[3]!=0&&r[4]!=0){
        data.push({
          time:setTime(r[0]),
          latitude:Number(r[3]),
          longitude:Number(r[4]),
          altitude:Number(r[6]),
          speed:Number(r[8]),
          vspeed:Number(r[10])
        })
      }
    }
}
const setRoute=(data=[])=>{
    const a=data[0]
    
    center=gcoord.transform(
      [a.longitude,a.latitude],    // 经纬度坐标
      gcoord.WGS84,               // 当前坐标系
      gcoord.GCJ02                 // 目标坐标系
    );
    center=fromLonLat(center)
    map.getView().setCenter(fromLonLat([111.110154,23.335977]))
    const R=[]
    
    for(const d of data){
      // const a=gcoord.transform(
      //   [d.longitude,d.latitude],    // 经纬度坐标
      //   gcoord.WGS84,               // 当前坐标系
      //   gcoord.GCJ02                 // 目标坐标系
      // )
      const a=[d.longitude,d.latitude]
      R.push(fromLonLat(a))
    }
    //console.log(R)
    

let route=new LineString(R)
    //console.log(route)
    const routeFeature = new Feature({
      type: 'route',
      geometry: route,
    });
    const startMarker = new Feature({
      type: 'icon',
      geometry: new Point(route.getFirstCoordinate()),
    });
    const endMarker = new Feature({
      type: 'icon',
      geometry: new Point(route.getLastCoordinate()),
    });
   
    const LastMarker = new Feature({
      type: 'icon',
      geometry: new Point(fromLonLat([111.110154,23.338277])),
    });
    const position = startMarker.getGeometry().clone();
    const geoMarker = new Feature({
      type: 'geoMarker',
      geometry: position,
    });
  
    const styles = {
      'route': new Style({
        stroke: new Stroke({
          width: 6,
          color: [237, 212, 0, 0.8],
        }),
      }),
      'icon': new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: 'data/icon.png',
        }),
      }),
      'geoMarker': new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({color: 'black'}),
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }),
      }),
    };

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [routeFeature, geoMarker, startMarker, endMarker,LastMarker],
      }),
      style: function (feature) {
        return styles[feature.get('type')];
      },
    });

    map.addLayer(vectorLayer);
}

let center = [-5639523.95, -3501274.52];
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: center,
    zoom: 15
  })
});
