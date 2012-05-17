    function switchMode(new_mode){
        var base_color = "#dddddd";
        document.getElementById("scale_tool").style.backgroundColor = base_color;
        document.getElementById("translate_tool").style.backgroundColor = base_color;
        document.getElementById("rotate_tool").style.backgroundColor = base_color;

        mode = new_mode;
        var tool_id = new_mode + "_tool";
        document.getElementById(tool_id).style.backgroundColor = "#dd88cc";
    }
