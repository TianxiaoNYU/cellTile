import numpy as np
import sys
import os
import re
import scipy
import scipy.spatial.distance
from skimage import io
import cv2

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
    points = np.empty((len(seg_keys), 3), dtype="int32")
    for ik, k in enumerate(seg_keys):
        pts = np.array(seg[k])
        #print pts
        contour = [pts]
        M = cv2.moments(contour[0])
        cX = int(M["m10"] / M["m00"])
        cY = int(M["m01"] / M["m00"])
        points[ik, :] = [k, cX, cY]
    np.savetxt("cell_centroid.csv", points, fmt = '%d', delimiter=",")

