<?php

/*
if (isset($_REQUEST['photocity_seed'])){
    $user_seed_id = $_REQUEST['photocity_seed'];
    $bundle_file = "/projects/grail/photocity3/user_seeds/".$user_seed_id."/bundle.repos";
}
elseif (isset($_REQUEST['lid'])){
    $lid = $_REQUEST['lid'];
    $bundle_file = "bundle.".$lid.".out";
}
else {
    $bundle_file = "http://grail.cs.washington.edu/projects/photocity/data/piazzadeimeracoli.bundle";
}
*/

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
if ($cams > 500)
    $skip = 10;
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

if ($points > 40000){
    $skip = 300;
}
else if ($points > 3000){
    $skip = 90;
}
else{
    $skip = 10;
}
$s_points = array();
for($i = 0; $i < $points && $i<400000; $i++){
    $line = fgets($fp, 4096);
    $p = explode(' ',$line);
    $obj = array('x'=>$p[0], 'y'=>$p[1], 'z'=>$p[2]);
    if ($i % $skip == 0)
        $s_points[] = $obj;
    for($j = 0; $j<2; $j++){
        $crud = fgets($fp, 4096);
    }
}
fclose($fp);

print "pts = " . json_encode($s_points) .";";
print "cams = " . json_encode($images) . ";";

/*
$op = fopen($bundle_file."json_test",'w');
if (!$op)
    die("Cannot write test json");
$ptstring = "pts = " . json_encode($s_points) .";";
$camstring = "cams = " . json_encode($images) . ";";
fwrite($op, $ptstring);
fwrite($op, $camstring);
fclose($op);
*/


?>
