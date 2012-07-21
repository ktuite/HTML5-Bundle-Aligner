    function preCanvasInit(){
        var context = document.getElementById("canvas").getContext("2d");
        context.font = "italic 40pt Calibri";
        context.fillText("Loading....", 150, 100);
    }

    function loadSamplePhoto(){
        var s = bundle_id.split(".");
        var photo_path = "http://landmark.cs.cornell.edu/bundlefiles/" + s[0] + "/image." + bundle_id + ".jpg";
        $('#photo').html("<img src='" + photo_path + "'/>");
    }

    function loadBundleFile(){
        $.ajax({
            url: "json_encode_bundle.php?lid=" + bundle_id
        }
        ).done(function (data) {
            pts = data.pts;
            cams = data.cams;
            pt_avg = data.avg;
            launchAligner();
        });
    }

    function launchAligner(){ 
        // recenter points with average point position

        cam_pts = [];
        for (var i in cams){
            var R = $M(cams[i].r);
            var t = $V(cams[i].t);
            var pos = R.transpose().multiply(t).multiply(-1);
            cam_pts.push( {x:pos.e(1) - pt_avg[0], y:pos.e(3)-pt_avg[2]} );
        }

        for (var i in pts){
            pts[i].x -= pt_avg[0];
            pts[i].y -= pt_avg[1];
            pts[i].z -= pt_avg[2];
        }

        canvas_init();
    }

