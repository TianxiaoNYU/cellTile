# cellTile
A useful function to tile the point within certain cells when loading map, in order to achieve a faster, more comfortable experience. 

## How to start

```shell
python3 -m http.server
```

Run above code in cellTile directory to start a http server. Then in any explorer, go into:

```
http://localhost:8000/
```

and open your .html file.

## Necessary input files

- **image_tiles/**
  - output from Tileup, used as the image of map;

- **roi.pos0.all.cells.converted.txt**
  - draw the boundary of cells, also used to generate the centroid by get_centroid.py
  
- **Pos0_647nm_561nm_combined_clean.csv**
  - file contains location and cell information of each single transcription. 
  - First col as the x coord; Second as the y coord;
  - Fourth as cell id; Fifth as gene ID
  
- **gene.list**
  - A single-col file with every gene ID as a single row
  - Used in the dropdown box

- **js/script.js**
  - Need to change the parameters to fit your own data
    - Map size should fit with your location information (axis, coordinate, ...)
    - Stain layers to choose
    - Colorlist now have about 150 colors; would report error if there are more cells. Can manually add new color to prevent.
  
- **cells/**
  - A collection of csv files each containing all data for each single cell. Names as the cell IDs. Geenrated by pre_processing.R.

## About archive
- Old version which load the whole data at once; may not be compatible when data is really large; still can work in small dataset.
- Also can work. If interested, please give a try.
