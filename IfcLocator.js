var viewer = new Cesium.Viewer('cesiumContainer');
var LatLongElev, box, oriLatLong;



// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
//alert('Ales Goed!!!');
} else {
  alert('Your browser does not seem to support our file reader (HTML5 File APIs).');
}

function GetLatLong(ifcfile)
{
  // Locates IFCSITE line and return a string segment of lenght 300 containing it
  var getIFCSITE = ifcfile.substr(ifcfile.search("IFCSITE"), 300), 
      getArrayOfLines = getIFCSITE.split(";"), 
      getIFCSITELine = getArrayOfLines[0];

  var splitIFCSITELine = getIFCSITELine.split("("), 
      lat_str = splitIFCSITELine[2].split(")"), 
      long_str = splitIFCSITELine[3].split(")"), 
      elev = long_str[1].split(",");

  return [lat_str, long_str, elev];
};


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
              + "starts with: \nLat = " + GetLatLong(contents)[0][0]
              + "\nLong = " + GetLatLong(contents)[1][0]
              + "\nElev = " + GetLatLong(contents)[2][1]
              // + "\n " +  GetBoxCoord(GetLatLong(contents), [-5,5,-5,5])
        );

        LatLongElev = GetLatLong(contents);
        console.log("Value of LatLongElev: \n" + LatLongElev);
        box = GetBoxCoord(LatLongElev, [-25,25,-25,25]);
        console.log("my box: " + box);
        console.log("center: " + oriLatLong);

        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees( oriLatLong[0], oriLatLong[1], 300.0 )
        });

        viewer.entities.add(
        {
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

        viewer.camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees( box[0], box[1], box[4], box[5] );

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


function GetBoxCoord(originLatLongElev, bbox2d)
{
  if (originLatLongElev instanceof Array && originLatLongElev.length == 3)
  {
    var lat_str = originLatLongElev[0][0].split(","), 
        long_str = originLatLongElev[1][0].split(",");

    var lat = 0, long = 0, 
        lat_meter = 110600, long_meter = 111300;
    
    // console.log(lat_str.length);
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

    oriLatLong = [long, lat];

// Coordinates of the bbox in meters
    if (bbox2d instanceof Array && bbox2d.length == 4)
    {
      var xmin = bbox2d[0], xmax = bbox2d[1], 
          ymin = bbox2d[2], ymax = bbox2d[3];

      var pt1 = [ (long + xmin/long_meter), (lat + ymin/lat_meter) ],
          pt2 = [ (long + xmax/long_meter), (lat + ymin/lat_meter) ],
          pt3 = [ (long + xmax/long_meter), (lat + ymax/lat_meter) ],
          pt4 = [ (long + xmin/long_meter), (lat + ymax/lat_meter) ]; 

      return [pt1[0], pt1[1], pt2[0], pt2[1], pt3[0], pt3[1], pt4[0], pt4[1]];
    }

    else return ("Something went wrong..." + bbox2d.length);
  }
  else
    return ("Something went wrong..." + originLatLongElev.length);
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
