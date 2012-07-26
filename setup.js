// make canvas say "Loading..."
function preCanvasInit(){
    var context = document.getElementById("canvas").getContext("2d");
    context.font = "italic 40pt Calibri";
    context.fillText("Loading....", 150, 100);
}

// put a photo on the side of the webpage in the element width id='photo'
function loadSamplePhoto(){
    var s = bundle_id.split(".");
    var photo_path = "http://landmark.cs.cornell.edu/bundlefiles/" + s[0] + "/image." + bundle_id + ".jpg";
    $('#photo').html("<img src='" + photo_path + "'/>");
}

function loadBundleFile(){
    $.ajax({
        url: "json_encode_bundle.php?lid=" + bundle_id
    }).done(function (data) {
        pts = data.pts;
        cams = data.cams;
        pt_avg = data.avg;
        console.log("number of points: " + pts.length);
        console.log("number of cameras: " + cams.length);
        launchAligner();
    });
}

function launchAligner(){ 
    cam_pts = [];
    for (var i in cams){
        var R = $M(cams[i].r);
        var t = $V(cams[i].t);
        var pos = R.transpose().multiply(t).multiply(-1);
        cam_pts.push( {x:pos.e(1), y:pos.e(2), z:pos.e(3)} );
    }

    pts = xyz2latlong(pts);
    cam_pts = xyz2latlong(cam_pts);

    var cam_avg = computeAvgOfCams(cam_pts);
    centerLat = cam_avg.lat;
    centerLong = cam_avg.lon;

    canvas_init_with_points(pts, cam_pts);
}

function computeAvgOfCams(cams){
    var lat = 0;
    var lon = 0;
    for (var i in cams){
        var c = cams[i];
        lon += c.x;
        lat += c.y;
    }
    lon /= cams.length;
    lat /= cams.length;
    return {lat: lat, lon: lon};
}

function xyz2latlong(pts){
    latlong = [];
    for (var pt in pts){
        p = pts[pt];
        x = parseFloat(p.x);
        y = parseFloat(p.y);
        z = parseFloat(p.z);

        a = 6378137; // equitorial radius, semi-major axis
        e = 0.081819190842622; // first eccentricity
        f = 1 - Math.sqrt(1 - Math.pow(e,2)); // flattening
        lon = Math.atan2(y, x)
            s = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
        rl = Math.atan2(z, ((1-f)*s));
        srl = Math.sin(rl);
        crl = Math.cos(rl);
        lat = Math.atan2((z + ((Math.pow(e,2)*(1-f))/(1-Math.pow(e,2))) *
                    a * Math.pow(srl, 3)),
                (s - Math.pow(e,2) * a * Math.pow(crl, 3)));
        count = 0
            lastLat = 100  // impossible value
            eps = 0.0001
            while((count < 10) && (Math.abs(lat-lastLat) > eps)){
                lastLat = lat
                    count = count + 1
                    rl = Math.atan2((1-f) * Math.sin(lat), Math.cos(lat))
                    srl = Math.sin(rl)
                    crl = Math.cos(rl)
                    lat = Math.atan2((z + ((Math.pow(e,2)*(1-f))/(1-Math.pow(e,2))) *
                                a * Math.pow(srl, 3)),
                            (s - Math.pow(e,2) * a * Math.pow(crl, 3)));
            }
        n = a / (Math.sqrt(1 - Math.pow(e,2) * Math.pow(Math.sin(lat),2)))
            alt = s * Math.cos(lat) + 
            (z + Math.pow(e,2) * n * Math.sin(lat)) * Math.sin(lat) - n

            lat = (lat * 180.0) / Math.PI;
        lon = (lon * 180.0) / Math.PI;

        latlong.push( {x:lon, y:lat} );
    }
    return latlong;
}
