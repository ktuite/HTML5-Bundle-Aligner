    function loadBundleFile(){
        $.ajax({
            url: "json_encode_bundle.php?photocity_seed=" + bundle_id
        }
        ).done(function (data) {
            eval(data);
            launchAligner();
        });
    }

    function launchAligner(){ 
        cam_pts = [];
        for (var i in cams){
            var R = $M(cams[i].r);
            var t = $V(cams[i].t);
            var pos = R.transpose().multiply(t).multiply(-1);
            cam_pts.push( {x:pos.e(1), y:pos.e(3)} );
        }

        canvas_init();
    }

