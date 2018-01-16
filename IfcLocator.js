var viewer = new Cesium.Viewer('cesiumContainer');

////////////////////////////////////////////////////////////////////////////////////////////
/// Global warnings and variables
////////////////////////////////////////////////////////////////////////////////////////////
var LatLongElev, box, oriLongLatElev = [-1000.0, -1000.0, -1000.0];
var newLat, newLong;


// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
//alert('Ales Goed!!!');
} else {
  alert('Your browser does not seem to support our file reader (HTML5 File APIs).');
}

////////////////////////////////////////////////////////////////////////////////////////////
/// Fly the camera to the current model on the map
////////////////////////////////////////////////////////////////////////////////////////////
function FlyToMyModel()
{
  if (oriLongLatElev[0] != -1000 && oriLongLatElev[1] != -1000)
  {
    viewer.camera.flyTo(
    {
        destination: Cesium.Cartesian3.fromDegrees( oriLongLatElev[0], oriLongLatElev[1], 300.0 )
    });
  }
  else
    alert('No model loaded yet!')

  // viewer.camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees( box[0], box[1], box[4], box[5] );
}

////////////////////////////////////////////////////////////////////////////////////////////
/// Location picking handler
////////////////////////////////////////////////////////////////////////////////////////////
var handler;
var scene = viewer.scene;

var entity = viewer.entities.add({
        label : {
            show : false,
            showBackground : true,
            font : '14px monospace',
            horizontalOrigin : Cesium.HorizontalOrigin.LEFT,
            verticalOrigin : Cesium.VerticalOrigin.TOP,
            pixelOffset : new Cesium.Cartesian2(15, 0)
        }
    });


// Mouse over the globe to see the cartographic position
handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
handler.setInputAction(function(movement) {
    var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
    if (cartesian) 
    {
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        // var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
        // var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
        var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
        var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);

        entity.position = cartesian;
        entity.label.show = true;
        // entity.label.text =
        //     'Lon: ' + ('   ' + longitudeString).slice(-7) + '\u00B0' +
        //     '\nLat: ' + ('   ' + latitudeString).slice(-7) + '\u00B0';
        entity.label.text =
            'Lon: ' + ('   ' + longitudeString) +
            '\nLat: ' + ('   ' + latitudeString);

        newLat = latitudeString;
        newLong = longitudeString;

        console.log(entity.label.text);
    } else {
        entity.label.show = false;
    }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);


////////////////////////////////////////////////////////////////////////////////////////////
/// Generates a Bbox around the specified location in LongLatElev
////////////////////////////////////////////////////////////////////////////////////////////
function GetBoxCoord(LongLatElev, bbox2d)
{
  if (LongLatElev instanceof Array && LongLatElev.length == 3)
  {
    var lat_meter = 110600, long_meter = 111300;

// Coordinates of the bbox in meters
    if (bbox2d instanceof Array && bbox2d.length == 4)
    {
      var xmin = bbox2d[0], xmax = bbox2d[1], 
          ymin = bbox2d[2], ymax = bbox2d[3];

      var pt1 = [ (LongLatElev[0] + xmin/long_meter), (LongLatElev[1] + ymin/lat_meter) ],
          pt2 = [ (LongLatElev[0] + xmax/long_meter), (LongLatElev[1] + ymin/lat_meter) ],
          pt3 = [ (LongLatElev[0] + xmax/long_meter), (LongLatElev[1] + ymax/lat_meter) ],
          pt4 = [ (LongLatElev[0] + xmin/long_meter), (LongLatElev[1] + ymax/lat_meter) ]; 

      return [pt1[0], pt1[1], pt2[0], pt2[1], pt3[0], pt3[1], pt4[0], pt4[1]];
    }

    else return ("Something went wrong..." + bbox2d.length);
  }
  else
    return ("Something went wrong..." + LongLatElev.length);
};

////////////////////////////////////////////////////////////////////////////////////////////
/// Move the model to the selected location
////////////////////////////////////////////////////////////////////////////////////////////
function ChangeModelLocation()
{
  if (oriLongLatElev[0] != -1000 && oriLongLatElev[1] != -1000)
  {
    oriLongLatElev[0] = newLong; 
    oriLongLatElev[1] = newLat;
    box = GetBoxCoord([newLong, newLat, 0.0], [-25,25,-25,25]);

    // Couldn't find a way to modify existing entity...
    viewer.entities.removeById("myIFCbox");
    viewer.entities.add(
    {
      id : "myIFCbox",
      polygon : 
      {
          hierarchy : new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray( box ) ),
          height : 0.0,
          extrudedHeight : 10.0,
          outline : true,
          outlineColor : Cesium.Color.WHITE,
          outlineWidth : 4,
          material : Cesium.Color.fromRandom({alpha : 0.5})
        }
    });

    FlyToMyModel();
    // viewer.entities.remove(entity);
  }
  else
    alert('There is no loaded model to move!')
}


////////////////////////////////////////////////////////////////////////////////////////////
/// Function to handle the opened files (IFC in this case)
////////////////////////////////////////////////////////////////////////////////////////////
function handleFileSelect(evt) 
{
    var files = evt.target.files; // FileList object

//Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0]; 

    if (f) 
    {
      var r = new FileReader();
      r.onload = function(e) 
      { 
        var contents = e.target.result;
        alert( "Got the file.n" 
              +"name: " + f.name + "\n"
              +"type: " + f.type + "\n"
              +"size: " + f.size + " bytes\n"
              + "starts with: \nLat = " + GetLatLongElev_from_IFC(contents)[0]
              + "\nLong = " + GetLatLongElev_from_IFC(contents)[1]
              + "\nElev = " + GetLatLongElev_from_IFC(contents)[2]
              // + "\n " +  GetBoxCoord(GetLatLongElev_from_IFC(contents), [-5,5,-5,5])
        );

        LatLongElev = GetLatLongElev_from_IFC(contents);
        box = GetBoxCoord(LatLongElev, [-25,25,-25,25]);
        
        console.log("Value of LatLongElev: \n" + LatLongElev);
        console.log("my box: " + box);
        console.log("center: " + oriLongLatElev);

        viewer.entities.add(
        {
          id : "myIFCbox",
          polygon : 
          {
              hierarchy : new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray( box ) ),
              height : 0.0,
              extrudedHeight : 10.0,
              outline : true,
              outlineColor : Cesium.Color.WHITE,
              outlineWidth : 4,
              material : Cesium.Color.fromRandom({alpha : 0.5})
            }
        });

        FlyToMyModel();

      }
      r.readAsText(f);
      
    }
    else 
    { 
      alert("Failed to load file");
    }

  //   // files is a FileList of File objects. List some properties.
  //   var output = [];
  //   for (var i = 0, f; f = files[i]; i++) {
  //     output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
  //                 f.size, ' bytes, last modified: ',
  //                 f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
  //                 '</li>');
  //   }
  //   document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';

}

document.getElementById('files').addEventListener('change', handleFileSelect, false);


////////////////////////////////////////////////////////////////////////////////////////////
/// Parse the IFC file and get the Lat/Long/Elevation data
////////////////////////////////////////////////////////////////////////////////////////////
function GetLatLongElev_from_IFC(ifcfile)
{
  // Locates IFCSITE line and return a string segment of lenght 300 containing it
  var getIFCSITE = ifcfile.substr(ifcfile.search("IFCSITE"), 300), 
      getArrayOfLines = getIFCSITE.split(";"), 
      getIFCSITELine = getArrayOfLines[0];

  var splitIFCSITELine = getIFCSITELine.split("("), 
      lat_str_ori = splitIFCSITELine[2].split(")"), 
      long_str_ori = splitIFCSITELine[3].split(")"), 
      elev_ori = long_str_ori[1].split(",");

  console.log("lat_str_ori = " + lat_str_ori);
  console.log("long_str_ori = " + long_str_ori);
  console.log("elev_ori = " + elev_ori);
  
  var lat_str = lat_str_ori[0].split(","), 
      long_str = long_str_ori[0].split(","), 
      elev_str = elev_ori[1];

  console.log("lat_str = " + lat_str);
  console.log("long_str = " + long_str);
  console.log("elev_str = " + elev_str);

  var lat = 0, long = 0;
  
  if (lat_str.length == 4)
    lat_str[2] += "." + Math.abs(lat_str[3]);
  for (i = 0; i<3; i++)
  {
    lat += lat_str[i]/Math.pow(60,i);
    // console.log(lat);
    console.log( "For i = " + i + ", lat = " + lat_str[i] + " / " + Math.pow(60,i) + " = " + lat);
  }

  // console.log(long_str.length);
  if (long_str.length == 4)
    long_str[2] += "." + Math.abs(long_str[3]);
  for (i = 0; i<3; i++)
  {
    long += long_str[i]/Math.pow(60,i);
    console.log( "For i = " + i + ", long = " + long_str[i] + " / " + Math.pow(60,i) + " = " + long);
  }

  // IFC provides Lat-Long while Cesium reads Long-Lat
  oriLongLatElev = [long, lat, elev_str];
  return oriLongLatElev;
};

// viewer.entities.add({
//     polygon : {
//         hierarchy : new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray([-118.0, 30.0,
//                                                                                     -115.0, 30.0,
//                                                                                     -117.1, 31.1,
//                                                                                     -118.0, 33.0])),
//         height : 300000.0,
//         extrudedHeight : 700000.0,
//         outline : true,
//         outlineColor : Cesium.Color.WHITE,
//         outlineWidth : 4,
//         material : Cesium.Color.fromRandom({alpha : 1.0})
//     }
// });
