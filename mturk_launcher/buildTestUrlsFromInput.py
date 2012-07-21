f = open("external_hit.input");
header = f.readline();


for line in f.readlines():
    x = line.strip("\n").split("\t")   
    test_url = "http://phci03.cs.washington.edu/alignment/mturk_align.html?centerLat=%s&centerLong=%s&bundleId=%s" % tuple(x)
    print test_url

