<?php


if (isset($_REQUEST['lid'])){
    $bundleId = $_REQUEST['lid'];
    $tokens = explode(".", $bundleId);
    $bundleComponent = $tokens[0];
    $bundleSubId = $tokens[1].".".$tokens[2];
    $bundle_file = "http://landmark.cs.cornell.edu/bundlefiles/".$bundleComponent."/bundle.".$bundleSubId.".out";
}
else {
    $bundleComponent = "0200";
    $bundleSubId = "189.0";
    $bundle_file = "http://landmark.cs.cornell.edu/bundlefiles/".$bundleComponent."/bundle.".$bundleSubId.".out";
}


/* check if cached file exists to print file string contents, otw create it */
/*
$bundle_file_json = $bundle_file.".json";
$jfp = fopen($bundle_file_json,'r');
if ($jfp) {
    print file_get_contents($jfp)
    exit;
}
*/
$fp = fopen($bundle_file,'r');
if (!$fp)
    die("Model Not Found");


$header = fgets($fp, 4096);
$lineOne = fgets($fp, 4096);
$x = explode(' ',$lineOne);
$cams = $x[0];
$points = $x[1];

/* bundler output file version 0.3 */
/* input ECEF XYZ */
$skip = ceil($cams/200);

$images = array();
for($i = 0; $i < $cams; $i++){
    $line = fgets($fp, 4096);
    $line = fgets($fp, 4096);
        $r1 = array_map('floatval', explode(' ',$line)); 
    $line = fgets($fp, 4096);
        $r2 = array_map('floatval', explode(' ',$line)); 
    $line = fgets($fp, 4096);
        $r3 = array_map('floatval', explode(' ',$line)); 
        $r = array($r1, $r2, $r3);
    $line = fgets($fp, 4096);
        $t = array_map('floatval', explode(' ',$line)); 
        $obj = array('r'=>$r, 't'=>$t);
        if ($i%$skip == 0)
            $images[] = $obj;
}

$pt_avg = array(0,0,0);

$skip = ceil(min($points, 400000)/4000);

$s_points = array();
for($i = 0; $i < $points && $i<400000; $i++){
    $line = fgets($fp, 4096);
    $p = explode(' ',$line);
    $obj = array('x'=>floatval($p[0]), 'y'=>floatval($p[1]), 'z'=>floatval($p[2]));
    if ($i % $skip == 0){
        $s_points[] = $obj;
        
        for ($k = 0; $k < 3; $k++){
            $pt_avg[$k] = $pt_avg[$k] + $p[$k];
        }
    }
    for($j = 0; $j<2; $j++){
        $crud = fgets($fp, 4096);
    }
}
fclose($fp);

// re-center points
$num_points = count($s_points);
for($k = 0; $k < 3; $k++){
    $pt_avg[$k] = $pt_avg[$k] / $num_points;
}


$final = array("pts"=>$s_points, "cams"=>$images, "avg"=>$pt_avg);

header("Content-type: application/json");
print json_encode($final);

?>
