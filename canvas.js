/* Zoom level for satellite image display */
var zoomLevel = 17;

/* Overhead image of scene */
var map_img = null;
var mapReady = false;

var centerLat = 0;//(topLat+bottomLat)/2;
var centerLong = 0;//(leftLong+rightLong)/2;

//var topLat = 0;//47.6539193340082;
//var leftLong = 0;//-122.3073148727417;
//var bottomLat = 0;//47.65280636096129;
//var rightLong = 0;//-122.3051905632019;

/* bundle points in format {x:longitude, y:latitude} */
var pts = null;
var cam_pts = null;
var pt_avg = null;
/* upon init convert to {x:MercatorX, y:MercatorY} */
var merc_pts = [];
var merc_cam_pts = [];

/* State for mouse dragging events */
var dragging = false;
var dragon_x = 0;
var dragon_y = 0;

/* Final translated position of the points in world coordinates */
var world_translate_x = 0;
var world_translate_y = 0;

/*
 * Model center about which points are scaled and rotated.
 */  
var lat_long_origin = {x:0, y:0};
/* Model center in pixels after spherical Mercator projection. */
var mercator_origin = {x:0, y:0};

/*
 * Translation and scaling of the points in Mercator pixel coordinates
 * are adjusted as HIT worker performs the alignment.
 */
var tx_translate_x = 0;
var tx_translate_y = 0;
var tx_rotate = 0;
var tx_scale = 1;

var dtx_translate_x = 0;
var dtx_translate_y = 0;
var dtx_rotate = 0;
var dtx_scale = 1;

/* Degrees longitude per pixel at the specified zoom. */
var longScale = 0;
/* Degrees latitude per pixel at the specified zoom, depends on latitude. */
var latScale = 0;

var canvas = null;

var mode = "translate";

var str = null;

var finalMatrix = null;

var w = 500;
var h = 500;

/* pixel_origin for Lat/Long scaling will be center of canvas. */
//var pixel_origin = null;

function canvas_relative(e){
    if (canvas != null){
        var rect = canvas.getBoundingClientRect();
        var x = e.pageX - rect.left - w/2 - document.body.scrollLeft;
        var y = e.pageY - rect.top - h/2 - document.body.scrollTop;
        return {x:x, y:y};
    }
    else
        return {x:0, y:0};
}

function build_map_url(){
    var mapBase = "http://maps.googleapis.com/maps/api/staticmap";
    var mapUrl = mapBase + "?" +
        "center="+centerLat+","+centerLong + 
        "&zoom="+ zoomLevel +
        "&format=PNG" +
        "&size="+w+"x"+h +
        "&key="+apiKey +
        "&maptype=satellite"+
        "&sensor=false";
    return mapUrl;
}

function computeLatLongScale(){
    longScale = 360 / (256 * Math.pow(2, zoomLevel));

    var w_y = lat2Y(centerLat, zoomLevel);
    var w_lat_low = y2Lat(w_y + h/2, zoomLevel);
    var w_lat_high = y2Lat(w_y - h/2, zoomLevel);

    latScale = (w_lat_high - w_lat_low) / h;
}

function canvas_init_with_points(pts, cam_pts) {
    canvas = document.getElementById("canvas");
    w = canvas.width;
    h = canvas.height;

    lat_long_origin.x = centerLong;
    lat_long_origin.y = centerLat;
    mercator_origin.x = lon2X(lat_long_origin.x, zoomLevel);
    mercator_origin.y = lat2Y(lat_long_origin.y, zoomLevel);

    map_img = new Image();
    map_img.onload = function() { mapReady = true; draw() };
    var mapUrl = build_map_url(); 
    map_img.src = mapUrl;

    computeLatLongScale();

    for(pt in pts){
        var p = pts[pt];
        var p2 = {x:0, y:0};
        p2.y = lat2Y(p.y, zoomLevel);// - mercator_origin.y;// + h/2;
        p2.x = lon2X(p.x, zoomLevel);// - mercator_origin.x;// + w/2;
        merc_pts[pt] = p2;
    }
    for(pt in cam_pts){
        var p = cam_pts[pt];
        var p2 = {x:0, y:0};
        p2.y = lat2Y(p.y, zoomLevel);// - mercator_origin.y;// + h/2;
        p2.x = lon2X(p.x, zoomLevel);// - mercator_origin.x;// + w/2;
        merc_cam_pts[pt] = p2;
    }

    draw();
}

function canvas_init_with_image(mapUrl) {
    canvas = document.getElementById("canvas");
    w = canvas.width;
    h = canvas.height;

    map_img = new Image();
    map_img.onload = function() { mapReady = true; draw() };
    map_img.src = mapUrl;

    draw();
}

function move(event) {
    if(dragging) {
        var rel = canvas_relative(event);
        var mx = rel.x;
        var my = rel.y;
        var odx = dragon_x - tx_translate_x;
        var ody = dragon_y - tx_translate_y;
        var cdx = mx - tx_translate_x;
        var cdy = my - tx_translate_y; 

        if(mode == "translate") {
            dtx_translate_x = cdx - odx;
            dtx_translate_y = cdy - ody;
        }

        if(mode == "scale") {
            var ol = Math.sqrt(odx*odx+ody*ody);
            var cl = Math.sqrt(cdx*cdx+cdy*cdy);
            dtx_scale = cl/ol;
        }

        if(mode == "rotate") {
            var or = Math.atan2(odx,ody);
            var cr = Math.atan2(cdx,cdy);
            dtx_rotate = or-cr;
        }

        draw();
    }
}

function startDrag(event) {
    dragging = true;
    var rel = canvas_relative(event);
    dragon_x = rel.x;
    dragon_y = rel.y;
    draw();
}

function stopDrag(event,commit) {
    dragging = false;
    if(commit) {
        tx_translate_x += dtx_translate_x;
        tx_translate_y += dtx_translate_y;
        tx_rotate += dtx_rotate;
        tx_scale *= dtx_scale;
    }

    dtx_translate_x = 0;
    dtx_translate_y = 0;
    dtx_rotate = 0;
    dtx_scale = 1;


    var mrotate = Matrix.RotationZ(-1*tx_rotate);
    var mscale = $M([   [tx_scale,0,0],
            [0,tx_scale,0],
            [0,0,1]]);
    //longScale = 360/(256*Math.pow(2,zoomLevel));
    //latScale = (centerLat - xToLat(latToX( centerLat,zoomLevel) + w/2, zoomLevel))/250.0; //I have no idea what this 250 is for, but it seems to fix things... :\
    //var mtrans = $M([   [0,0,tx_translate_x*longScale+centerLong],
    //                    [0,0,-tx_translate_y*latScale+centerLat],
    //                    [0,0,0]]);
    var mtrans = $M([   [0,0,tx_translate_x],
            [0,0,tx_translate_y],
            [0,0,0]]);


    /*
    // Transformation matrix about model center in spherical Mercator
    // projection pixels.
    finalMatrix = Matrix.I(3).
    //multiply($M([[w*longScale,0,0],[0,w*latScale,0],[0,0,1]])).
    multiply(mscale).
    multiply(mrotate).
    add(mtrans);
    */
    // Transformation matrix about model center in ENU meters
    finalMatrix = Matrix.I(3).
        //multiply($M([[w*longScale,0,0],[0,w*latScale,0],[0,0,1]])).
        multiply(mscale).
        multiply(mrotate).
        add(mtrans);


    world_translate_x = mtrans.e(1,3);
    world_translate_y = mtrans.e(2,3);

    str =
        "\n{\n"+
        "  translate_x: " + tx_translate_x + ",\n" +
        "  translate_y: " + tx_translate_y + ",\n" +
        "  real translate x: " + mtrans.e(1,3) + ",\n" +
        "  real translate y: " + mtrans.e(2,3) + ",\n" +
        "  rotate: " + tx_rotate + ",\n" +
        "  scale: " + tx_scale + "\n" +
        "  latScale: " + latScale + "\n" +
        "  longScale: " + longScale + "\n" +
        "}\n\n";

    str += finalMatrix.inspect();

    document.getElementById("matrix").innerHTML = str; 


    draw();     
}

/*
 * Draw image and points on canvas.
 *
 * pts = [{x:longitude, y:latitude}]
 * cam_pts similar
 */
function draw() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    ctx.clearRect(0,0,512,512);
    if(mapReady) {
        ctx.drawImage(map_img,0,0);
    }

    ctx.save();
    ctx.translate(w/2 + tx_translate_x + dtx_translate_x, h/2 + tx_translate_y + dtx_translate_y);

    ctx.rotate(tx_rotate + dtx_rotate);
    ctx.scale(tx_scale * dtx_scale,
            tx_scale * dtx_scale);

    // mercator_origin plot for sanity check
    //ctx.fillStyle = "green";
    //var dp = 3.5/(tx_scale*dtx_scale);
    //ctx.fillRect(0-dp/2,0-dp/2,dp,dp);

    ctx.fillStyle = "red";
    var dp = 3.5/(tx_scale*dtx_scale);
    for(pt in merc_pts) { 
        var p = merc_pts[pt];
        ctx.fillRect(p.x-mercator_origin.x-dp/2,
                p.y-mercator_origin.y-dp/2,
                dp,
                dp);
    }
    ctx.fillStyle = "blue";
    var dc = 7.0/(tx_scale*dtx_scale);
    for(pt in merc_cam_pts) { 
        var p = merc_cam_pts[pt];
        ctx.fillRect(p.x-mercator_origin.x-dc/2,p.y-mercator_origin.y-dc/2,dc,dc);
    }
    ctx.fillStyle = "white";
    var dc = 4.0/(tx_scale*dtx_scale);
    for(pt in merc_cam_pts) { 
        var p = merc_cam_pts[pt];
        ctx.fillRect(p.x-mercator_origin.x-dc/2,p.y-mercator_origin.y-dc/2,dc,dc);
    }
    ctx.restore();
}

/* Convert latitude to pixel y coordinate for Google Static Maps spherical
 * Mercator projection at a given zoom level.
 *
 * Inputs:
 *   latitude in degrees
 *   zoom integer
 */   
function lat2Y(lat, zoom){
    //var tileSize = 256;
    //var y_world = ((1-(Math.log(Math.tan(Math.PI/4 + lat*Math.PI/180/2)))/Math.PI)) * Math.pow(2,zoom-1);
    //return tileSize * (y_world - Math.floor(y_world));

    return ((1-(Math.log(Math.tan(Math.PI/4 + lat*Math.PI/180/2)))/Math.PI))/2 * Math.pow(2,zoom) *256; 
    //return ((1-(0.5 * Math.log((1 + Math.sin(lat*Math.PI/180))/(1 - Math.sin(lat*Math.PI/180))))/Math.PI))/2 * Math.pow(2,zoom) *256; 
}

/* Convert pixel y coordinate in general world frame of spherical Mercator
 * projection into latitude in degrees as per Google Static Maps zoom.
 */
function y2Lat(y, zoom){
    var pix_per_rad = 256 * Math.pow(2,zoom) / (2*Math.PI);
    return (Math.PI/2 - 2*Math.atan(Math.exp(y/pix_per_rad - Math.PI)))*180/Math.PI;
}

function lon2X(lon, zoom){
    return (lon / 180 + 1) * Math.pow(2, zoom - 1) * 256;

}

function x2Lon(x, zoom){
    return ((180 * x / 256) / Math.pow(2, zoom - 1) - 180);
}

/* Return the number of meters per degree at a given geodetic latitude.
 * Uses WGS84 ellipsoid and ignores altitude.
 */
function latDeg2M(lat){
    var a = 6378137; // equitorial radius, semi-major axis
    var e = 0.081819190842622; // first eccentricity
    return Math.pi * a * (1 - Math.pow(e,2)) /
        (180 * Math.sqrt(Math.pow((1 - Math.pow(e,2) * 
                                   Math.pow(Math.sin(lat * Math.pi / 180), 2)), 3)));
    //return 111132.954 - 599.822 * Math.cos(2 * lat) + 1.175 * Math.cos(4 * lat);
}

/* Move the entire map n/s/e/w
 * Keep the translation matrix updated, too.
 * Since it's a static map (to allow the points on top to move) we're moving the map manually by changing the image.
 */
function navigate(dir){
    if (dir == "zoomOut")
        zoomLevel --;
    else if (dir == "zoomIn")
        zoomLevel++;

    var z = 1 << zoomLevel; 
    var d = 0.2 * w / z;

    if (dir == "north"){
        centerLat += d;
    }
    else if (dir == "south"){
        centerLat -= d;
    }
    else if (dir == "east"){
        centerLong += d;
    }
    else if (dir == "west"){
        centerLong -= d;
    }

    var mapUrl = build_map_url(); 
    map_img.src = mapUrl;
    computeLatLongScale();
    updateForm();
}
