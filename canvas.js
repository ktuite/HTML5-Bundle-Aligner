    var zoomLevel = 18;
    var map_img = null;
    var mapReady = false;

    var topLat = 47.6539193340082;
    var leftLong = -122.3073148727417;
    var bottomLat = 47.65280636096129;
    var rightLong = -122.3051905632019;
    
    var centerLat = (topLat+bottomLat)/2;
    var centerLong = (leftLong+rightLong)/2;

    var pts = null;
    var cam_pts = null;
    var pt_avg = null;

    var dragging = false;

    var dragon_x = 0;
    var dragon_y = 0;

    var world_translate_x = 0;
    var world_translate_y = 0;

    var tx_translate_x = 0;
    var tx_translate_y = 0;
    var tx_rotate = 0;
    var tx_scale = .1;

    var dtx_translate_x = 0;
    var dtx_translate_y = 0;
    var dtx_rotate = 0;
    var dtx_scale = 1;

    var latScale = 1;
    var longScale = 1;

    var canvas = null;

    var mode = "translate";

    var str = null;

    var finalMatrix = null;
    
    var w = 500;
    var h = 500;

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

    function canvas_init() {
        canvas = document.getElementById("canvas");
        w = canvas.width;
        h = canvas.height;

        map_img = new Image();
        map_img.onload = function() { mapReady = true; draw() };
        var mapUrl = build_map_url(); 
        map_img.src = mapUrl;

        longScale = 360/(256*Math.pow(2,zoomLevel));
        latScale = (centerLat - xToLat(latToX( centerLat,zoomLevel) + w/2, zoomLevel))/250.0; //I have no idea what this 250 is for, but it seems to fix things... :\
        //tx_translate_x = (world_translate_x - centerLong)/longScale;
        //tx_translate_y = (world_translate_y - centerLat)/latScale;

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
        var mtrans = $M([   [0,0,tx_translate_x*longScale+centerLong],
                            [0,0,-tx_translate_y*latScale+centerLat],
                            [0,0,0]]);


        finalMatrix = Matrix.I(3).
                            multiply($M([[w*longScale,0,0],[0,w*latScale,0],[0,0,1]])).
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
    function draw() {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        ctx.clearRect(0,0,512,512);
        if(mapReady) {
            ctx.drawImage(map_img,0,0);
        }
 
        ctx.save();
        ctx.translate(  w/2 + tx_translate_x + dtx_translate_x, h/2 + tx_translate_y + dtx_translate_y);
        ctx.rotate(tx_rotate + dtx_rotate);
        ctx.scale(w * tx_scale * dtx_scale,
                  w * tx_scale * dtx_scale);
        ctx.fillStyle = "red";
        var dp = 3.5/(w*tx_scale*dtx_scale);
        for(pt in pts) { 
          var p = pts[pt];
          ctx.fillRect(p.x-dp/2,p.y-dp/2,dp,dp);
        }
        ctx.fillStyle = "blue";
        var dc = 7.0/(w*tx_scale*dtx_scale);
        for(pt in cam_pts) { 
          var p = cam_pts[pt];
          ctx.fillRect(p.x-dc/2,p.y-dc/2,dc,dc);
        }
        ctx.fillStyle = "white";
        var dc = 4.0/(w*tx_scale*dtx_scale);
        for(pt in cam_pts) { 
          var p = cam_pts[pt];
          ctx.fillRect(p.x-dc/2,p.y-dc/2,dc,dc);
        }
        ctx.restore();
    }
    function latToX(lat, zoom){
        return ((1-(Math.log(Math.tan(Math.PI/4 + lat*Math.PI/180/2)))/Math.PI))/2 * Math.pow(2,zoom) *256; 
    }
    function xToLat(x, zoom){
        var radius = 256 * Math.pow(2,zoom) / (2*Math.PI);
        return (Math.PI/2 - 2*Math.atan(Math.exp(x/radius - Math.PI)))*180/Math.PI;
    }

