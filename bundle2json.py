#! /usr/bin/python
import json
import sys

if __name__ == "__main__": 
    if len(sys.argv) < 3:
        print "usage: ./bundle2pts.py <bundle file> <json pts file>"
        sys.exit()

    bundle_file = sys.argv[1]
    json_pts_file = sys.argv[2] 
    print "- Reading [%s] and writing [%s]" % (bundle_file, json_pts_file)
    
    with open(bundle_file) as f_in:
        header = f_in.readline()
        num_images, num_points = map(int, f_in.readline().split()[0:2])
        print num_images, num_points

        for i in xrange(num_images*6):
            line = f_in.readline()

        pts = [] 

        for i in xrange(min(num_points, 20000)):
            player_id = f_in.readline()
            x, y, z = map(float, f_in.readline().split())
            color = f_in.readline()
            track = f_in.readline()
            pts.append(dict(x=x, y=z))

        with open(json_pts_file, 'w') as f_out:
            json.dump(pts, f_out)
 
