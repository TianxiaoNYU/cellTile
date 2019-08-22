# cellTile
A useful function to tile the point within certain cells when loading map, in order to achieve a faster, more comfortable experience. 

## Necessary input files
- image_tiles/
  - output from Tileup, used as the image of map;
 
- roi.pos0.all.cells.converted.txt
  - draw the boundary of cells, also used to generate the centroid by get_centroid.py
  
- Pos0_647nm_561nm_combined_clean.csv
  - file contains location and cell information of each single transcription. 
  - First col as the x coord; Second as the y coord;
  - Fourth as cell id; Fifth as gene ID
  
- gene.list
  - A single-col file with every gene ID as a single row.
