<?php

if (isset($_REQUEST['photocity_seed'])){
    $user_seed_id = $_REQUEST['photocity_seed'];
    $bundle_file = "/projects/grail/photocity3/user_seeds/".$user_seed_id."/bundle.repos";
}
else {
    $bundle_file = "http://grail.cs.washington.edu/projects/photocity/data/piazzadeimeracoli.bundle";
}

$fp = fopen($bundle_file,'r');
if (!$fp)
    die("Model Not Found");


$header = fgets($fp, 4096);
$lineOne = fgets($fp, 4096);
$x = explode(' ',$lineOne);
$cams = $x[0];
$points = $x[1];

if ($cams > 500)
    $skip = 10;
$images = array();
for($i = 0; $i < $cams; $i++){
    $line = fgets($fp, 4096);
        $x = explode(' ',$line);
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
        $obj = array('name'=>$x[0], 'r'=>$r, 't'=>$t);
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
    $pid = fgets($fp, 4096);
    $line = fgets($fp, 4096);
    $p = explode(' ',$line);
    $obj = array('x'=>$p[0], 'y'=>$p[2]);
    if ($i % $skip == 0)
        $s_points[] = $obj;
    for($j = 0; $j<2; $j++){
        $crud = fgets($fp, 4096);
    }
}
fclose($fp);

print "pts = " . json_encode($s_points) .";";
print "cams = " . json_encode($images) . ";";

?>
