import numpy as np
import math
import sys
import os
import re
import scipy
import scipy.spatial.distance
from skimage import io
import cv2
from shapely.geometry import Point
from shapely.geometry.polygon import Polygon

def read_segmentation(n):
    by_cell = {}
    f = open(n)
    for l in f:
        l = l.rstrip("\n")
        ll = l.split(",")
        cell_id = int(ll[0])
        by_cell.setdefault(cell_id, [])
        x = float(ll[1])
        y = float(ll[2])
        by_cell[cell_id].append((int(x), int(y)))
    f.close()
    return by_cell

if __name__=="__main__":
    seg = read_segmentation("roi.pos0.all.cells.converted.txt")
    seg_keys = sorted(list(seg.keys()))
    zoomrange = [0,1,2,3,4,5]
    maxsize = 8192
    for zoom in zoomrange:
        tilenum = pow(2, zoom)
        tilesize = maxsize / tilenum
        for x in range(tilenum):
            for y in range(tilenum):
                temp = [];
                tl = (x * tilesize, y * tilesize)
                tr = ((x + 1) * tilesize, y * tilesize)
                bl = (x * tilesize, (y + 1) * tilesize)
                br = ((x + 1) * tilesize, (y + 1) * tilesize)
                polygon = Polygon([tl, tr, br, bl])
                for ik, k in enumerate(seg_keys):
                    pts = seg[k]
                    for i in pts:
                        point = Point(i)
                        if polygon.contains(point):
                            temp.append(k)
                            break
                if temp:
                    filename = 'tileAlloc/' + str(zoom) + '/' + str(x) + '_' + str(y) + '.txt'
                    #print temp
                    fileObject = open(filename, 'w')
                    for j in temp:
                        fileObject.write(str(j))
                        fileObject.write('\n')
                    fileObject.close()

            

#    seg_keys = sorted(list(seg.keys()))
#    points = np.empty((len(seg_keys), 3), dtype="int32")
#    for ik, k in enumerate(seg_keys):
#        pts = np.array(seg[k])
        #print pts
#        contour = [pts]
#        M = cv2.moments(contour[0])
#        cX = int(M["m10"] / M["m00"])
#        cY = int(M["m01"] / M["m00"])
#        points[ik, :] = [k, cX, cY]
#    np.savetxt("cell_centroid.csv", points, fmt = '%d', delimiter=",")

