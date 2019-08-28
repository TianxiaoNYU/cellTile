var mapExtent = [0.00000000, -4096.00000000, 4096.00000000, 0.00000000];
var mapMinZoom = 0;
var mapMaxZoom = 5;
var mapMaxResolution = 1.00000000;
var mapMinResolution = Math.pow(2, mapMaxZoom) * mapMaxResolution;;
var tileExtent = [0.00000000, -4096.00000000, 4096.00000000, 0.00000000];
var crs = L.CRS.Simple;
crs.transformation = new L.Transformation(1, -tileExtent[0], -1, tileExtent[3]);
crs.scale = function(zoom) {
	return Math.pow(2, zoom) / mapMinResolution;
};
crs.zoom = function(scale) {
	return Math.log(scale * mapMinResolution) / Math.LN2;
};

// 	Stain layer to use as the background; see line 221 - 267; can customize by yourself
//
var layerDapi;
var layerNissl;
var layerPolyA;
var selectedStain;
//
//

var url = "cells/{z}.csv" 	// url for gene location data
var imageSize = 8192;		// According to the set map size in line 1 - 14
var numMarkers = 0;
var free_markers = new Set([]);
var all_markers = new Set([]);


var initial_boundary = {
	top: 0,
	down: 0,
	left: 0,
	right: 0
};

var selected_circles = {};
var selected_cell_circles = {};
var onscreen_circles = {};

var cell_circle = [];
var busy_state = [];

var genes = [];
var circles = [];
var cell_list = [];
var new_cell_list = [];

var cell_loc_x = [];
var cell_loc_y = [];

var g_layers = {};
var g_displayed = new Set([]);
var g_color = {};
var pointlist = [];

// Load map on HTML5 Canvas for faster rendering
var map = new L.Map('map', {
	preferCanvas: true,
	maxZoom: mapMaxZoom,
	minZoom: mapMinZoom,
	crs: crs,
	scrollWheelZoom: false
});

// Set list of colors
// COLORS WILL NEED TO BE EDITED FOR GRADIENT/MORE GROUPS
var colorlist = [
	"#FFFF00", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6", "#A30059",
	"#FFDBE5", "#7A4900", "#0000A6", "#63FFAC", "#B79762", "#004D43", "#8FB0FF", "#997D87",
	"#5A0007", "#809693", "#FEFFE6", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80",
	"#61615A", "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100",
	"#DDEFFF", "#000035", "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F",
	"#372101", "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09",
	"#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1", "#788D66",
	"#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648", "#0086ED", "#886F4C",
	"#34362D", "#B4A8BD", "#00A6AA", "#452C2C", "#636375", "#A3C8C9", "#FF913F", "#938A81",
	"#575329", "#00FECF", "#B05B6F", "#8CD0FF", "#3B9700", "#04F757", "#C8A1A1", "#1E6E00",
	"#7900D7", "#A77500", "#6367A9", "#A05837", "#6B002C", "#772600", "#D790FF", "#9B9700",
	"#549E79", "#FFF69F", "#201625", "#72418F", "#BC23FF", "#99ADC0", "#3A2465", "#922329",
	"#5B4534", "#FDE8DC",
	"#000000", "#FFFF00", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6", "#A30059",
	"#FFDBE5", "#7A4900", "#0000A6", "#63FFAC", "#B79762", "#004D43", "#8FB0FF", "#997D87",
	"#5A0007", "#809693", "#FEFFE6", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80",
	"#61615A", "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100",
	"#DDEFFF", "#000035", "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F",
	"#372101"
];

function getcolor(gene_id){
	var occupied = [];
	for(i=0; i<50; i++){
		occupied.push(0);
	}
	g_displayed.forEach(function(g_id){
		occupied[g_color[g_id]] = 1;
	});
	for(i=0; i<50; i++){
		if(occupied[i]==0){
			return i;
		}
	}
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}


function getDifference(a, b){ //a - b
	var newDiff = new Set([]);
	a.forEach(function(c_id){
		if(!b.has(c_id)){
			newDiff.add(c_id);
		}
	});
	return newDiff;
}	


function refreshView(){
    let center = map.getCenter();
    let boundary = getBound(L.latLngBounds([center]));
    if (boundary == 0){
    	console.log("Return Initial");
    	return initial_boundary;
    } 
    return boundary;
}

function clearCache(){
	busy_state = [];
	cell_circle = [];
}

function getBound(bounds){
    let zoom = map.getZoom();
    let tileNumber = Math.pow(2, zoom);
    let tileSize = imageSize / tileNumber;
    let additional_bounds_length = zoom * tileSize / 5; 	// size of boundary; can set manually
    let mapBounds = map.getBounds();
    if(bounds) {
    	// here it's square; can be changed into different shape.
    	var new_boundary = {							
			top: mapBounds._northEast.lat + additional_bounds_length,
			down: mapBounds._southWest.lat - additional_bounds_length,
			right: mapBounds._northEast.lng + additional_bounds_length,
			left: mapBounds._southWest.lng - additional_bounds_length
		};
		return new_boundary;
    }else{
    	return 0;
    }
}

function selectCell(bounds){
	var cellList = [];
	for (var i = 0; i < cell_loc_x.length-1; i++) {
		x = cell_loc_x[i];
		y = cell_loc_y[i];
		if((y < bounds.top) && (y > bounds.down) && (x > bounds.left) && (x < bounds.right)){
			cellList.push(i+1);
		}
	}
	cellList = new Set(cellList);
	return cellList;
}

function drawSelectedCell_step2(cl, rm_cl, gene_colorlist, is_done, each_cell){
	var all_done = true;
	for(var j=0; j<cl.length; j++){
		if(is_done[cl[j]]==false){
			all_done = false;
			break;
		}
	}
	if(all_done==true){
		console.log("Got all done!");
		console.log("Freeing up markers by removing...");
		var f_marker_add = [];
		var default_latlng = map.unproject([0,0], map.getMaxZoom());
		for(var j=0; j<rm_cl.length; j++){
			//map.removeLayer(onscreen_circles[rm_cl[j]]);
			var t_rm_cell_circle = onscreen_circles[rm_cl[j]];
			for(var k=0; k<t_rm_cell_circle.length; k++){
				var t_marker_id = t_rm_cell_circle[k];
				var t_marker_layer = map._layers[t_marker_id];
				t_marker_layer.options.color = "#FFFF00";
				t_marker_layer.options.radius = 2.0;
				t_marker_layer._latlng = default_latlng;
				t_marker_layer.setTooltipContent("");
				t_marker_layer.redraw();
				f_marker_add.push(t_marker_id);
			}
			delete onscreen_circles[rm_cl[j]];
		}
		for(var j=0; j<f_marker_add.length; j++){
			free_markers.add(f_marker_add[j]);
		}

		console.log("Adding markers from new cells...");
		var f_marker_list = Array.from(free_markers);
		var f_marker_delete = [];
		var f_ind = 0;
		var need_free_marker = 0;
		for(var j=0; j<cl.length; j++){
			//cell_circle = cell_circle.concat(each_cell[cl[j]]);
			//var t_cell_circle = new L.LayerGroup(each_cell[cl[j]]);
			var t_cell_circle = each_cell[cl[j]];
			onscreen_circles[cl[j]] = [];
			//t_cell_circle.addTo(map);
			console.log("Doing " + cl[j]);
			//console.log(f_marker_list);
			for(var k=0; k<t_cell_circle.length; k++){
				if(f_ind>=f_marker_list.length){
					//console.log("Need More Free Markers!");
					need_free_marker+=1;
					continue;
				}
				var t_marker = t_cell_circle[k];
				var f_marker_id = f_marker_list[f_ind];
				//console.log(f_ind);
				//console.log(f_marker_id);
				var f_marker_layer = map._layers[f_marker_id];
				//console.log(f_marker_layer);


				var t_latlng = t_marker.getLatLng();
				var t_radius = t_marker.getRadius();
				var t_color = t_marker.options.color;
				var t_coord_str = t_marker.options.coord_str;
				//console.log(t_color);
				//console.log(t_latlng);
				f_marker_layer.options.color = t_color;
				f_marker_layer.options.radius = t_radius;
				f_marker_layer._latlng = t_latlng;
				//f_marker_layer.setLatLng(t_latlng);
				//f_marker_layer.setRadius(t_radius);
				//f_marker_layer.setStyle({color: t_color});
				f_marker_layer.setTooltipContent(t_coord_str);
				f_marker_layer.redraw();
				f_marker_delete.push(f_marker_id);
				onscreen_circles[cl[j]].push(f_marker_id);
				f_ind+=1;
				
			}
			//onscreen_circles[cl[j]] = t_cell_circle;
			console.log("Done " + cl[j]);
		}
		for(var j=0; j<f_marker_delete.length; j++){
			free_markers.delete(f_marker_delete[j]);
		}

		if(need_free_marker>0){
			console.log("Need MORE FREE MARKERS " + need_free_marker);
		}
		console.log("Finished add markers");
		//var f_marker_list = Array.from(free_markers);
		//map.removeLayer(selected_cell_circles);
		//selected_cell_circles = new L.LayerGroup(cell_circle).addTo(map);
		//console.log("Number of markers: " + 
		console.log("Finished all");
	}else{
		setTimeout(drawSelectedCell_step2, 500, cl, rm_cl, gene_colorlist, is_done, each_cell);
	}
};

function drawSelectedCell_step1(cl, rm_cl, gene_colorlist, is_done){
	var point_size = map.getZoom() * 0.8;
	var each_cell = {};
	var remove_each_cell = {};

	for(var j=0; j < cl.length; j++){
		temp_url = url.replace("{z}", cl[j]);
		each_cell[cl[j]] = [];
		fetch(temp_url)
		.then(response => response.text())
		.then(function(text){
			var basename = "";
			var pointlist2 = text.split("\n");
			for(i=0; i<pointlist2.length-1; i++){
				var newplist = pointlist2[i].split(",");
				x = Number(newplist[0]);
				y = Number(newplist[1]);
				cellid = String(newplist[3]);
				if(basename==""){
					basename = String(cellid);
				}
				gene_id = String(newplist[4]);
				cell_color = gene_colorlist[cellid -1];
				var marker = L.circleMarker(map.unproject([x, y], map.getMaxZoom()), {
					radius: point_size, 
					color: cell_color, 
					fillOpacity: 0.5,
					stroke: false, 
					"gene_id": gene_id,
					"coord_str": "<b>Cell:</b> " + cellid + "<br>" + "<b>Gene:</b> " + gene_id, 
				});
				marker_coords_str = "<b>Cell:</b> " + cellid + "<br>" + "<b>Gene:</b> " + gene_id;
				//marker.bindTooltip(marker_coords_str).openTooltip();
				//cell_circle.push(marker);
				each_cell[basename].push(marker);
			};
			//console.log("finished one turn");
			is_done[basename] = true;
			//busy_state[j-1] = cl[j-1];
		});
	}
	//if(busy_state[cl.length - 1] == cl[cl.length - 1]){
	//}else{
	//	setTimeout(drawSelectedCell, 100, cl, gene_colorlist);
	//}
	drawSelectedCell_step2(cl, rm_cl, gene_colorlist, is_done, each_cell);
};

function callDrawSelectedCell(cl, rm_cl, gene_colorlist){
	var is_done = {};
	for(var j=0; j<cl.length; j++){
		is_done[cl[j]] = false;
	}
	drawSelectedCell_step1(cl, rm_cl, gene_colorlist, is_done);
};


function draw_markers(pointlist){
	var new_circles = [];
	var point_size = map.getZoom() * 1.2;
	for(i=0; i<pointlist.length-1; i++){
		var newplist = pointlist[i].split(",");
		var gene_id = newplist[4];
		if(g_displayed.has(gene_id)){
			x = Number(newplist[0]);
			y = Number(newplist[1]);
			cellid = String(newplist[3]);
			gene_color = g_color[gene_id];
			var marker = L.circleMarker(map.unproject([x, y], map.getMaxZoom()), {
				radius: point_size, 
				color: colorlist[gene_color], 
				fillOpacity: 1.0,
				stroke: false, 
				"gene_id": gene_id,   
			});
			marker_coords_str = "<b>Cell:</b> " + cellid + "<br>" + "<b>Gene:</b> " + gene_id;
			marker.bindTooltip(marker_coords_str).openTooltip();
			new_circles.push(marker);
		}
	}
	return new_circles;
}

$("#stain")
.append($("<li>").append($("<a>").attr("id", "stain_dapi").attr("href", "#").text("DAPI")
	.click(function(e){
		selectedStain = "dapi";
		map.removeLayer(layerNissl);
		map.removeLayer(layerDapi);
		map.removeLayer(layerPolyA);
		layerDapi.addTo(map);
	}))
)
.append($("<li>").append($("<a>").attr("id", "stain_nissl").attr("href", "#").text("Nissl")
	.click(function(e){
		selectedStain = "nissl";
		map.removeLayer(layerNissl);
		map.removeLayer(layerDapi);
		map.removeLayer(layerPolyA);
		layerNissl.addTo(map);
	}))
)
.append($("<li>").append($("<a>").attr("id", "stain_polyA").attr("href", "#").text("PolyA")
	.click(function(e){
		selectedStain = "polyA";
		map.removeLayer(layerNissl);
		map.removeLayer(layerDapi);
		map.removeLayer(layerPolyA);
		layerPolyA.addTo(map);
	}))
);


layerDapi = L.tileLayer('image_tiles_0_7/{z}/map_{x}_{y}.png', {
	minZoom: mapMinZoom, maxZoom: mapMaxZoom,
	noWrap: true,
	tms: false
});

layerNissl = L.tileLayer('image_tiles/{z}/map_{x}_{y}.png', {
	minZoom: mapMinZoom, maxZoom: mapMaxZoom,
	noWrap: true,
	tms: false
});

layerPolyA = L.tileLayer('image_tiles_0_4/{z}/map_{x}_{y}.png', {
	minZoom: mapMinZoom, maxZoom: mapMaxZoom,
	noWrap: true,
	tms: false
});

layerNissl.addTo(map);

      // Fit map to max bounds
map.fitBounds([
	crs.unproject(L.point(mapExtent[2], mapExtent[3])),
	crs.unproject(L.point(mapExtent[0], mapExtent[1]))
]);
L.control.mousePosition().addTo(map);

      // Set different zoom layers
      //var zoom6layer = new L.FeatureGroup();

L.LayerGroup.include({
	customGetLayer: function (id) {
		for (var i in this._layers) {
			if (this._layers[i].options.id == id) {
				return this._layers[i];
			}
		}
	},
	customGetLayers: function (gene_id){
		var ret = [];
		for (var i in this._layers){
			if(this._layers[i].options.gene_id==gene_id){
				ret.push(this._layers[i]);
			}
		}
		return ret;
	},
});

map.setView([-2048, 2048],3);

fetch("roi.pos0.all.cells.converted.txt")
.then(response2 => response2.text())
.then(function(text2){
	console.log("load segmentations");
	var seg = text2;
	seglist = seg.split("\n");
	i = 0;
	var map_cell = {};
	//alert(seglist);
	for(i=0; i<44046; i++){
		var newplist = seglist[i].split(",");
		x = Number(newplist[1]);
		y = Number(newplist[2]);
		cell_id = String(newplist[0]);
		a = [x,y];
		if(map_cell.hasOwnProperty(cell_id)){
			map_cell[cell_id].push(a);
			//alert(map_cell[cell_id]);
		}
		else{
			map_cell[cell_id] = [];
			map_cell[cell_id].push(a);
		}
		//alert(x + " " + y + " " + cell_id);
	}
	//alert("Here");
	Object.keys(map_cell).forEach(function (cell_id){
		var latlngs = [];
		//alert(cell_id + " " + map_cell[cell_id].length);
		for(i=0; i<map_cell[cell_id].length; i++){
			var latlng = map.unproject(map_cell[cell_id][i], map.getMaxZoom());
			latlngs.push([latlng.lat, latlng.lng]);
		}
		//alert(latlngs);
		var polygon = L.polygon(latlngs, {color:"red", weight:1, fill:false}).addTo(map);
		//var polygon = L.polygon(latlngs, {color:"red", weight:1, fill:false});
		//zoom6layer.addLayer(polygon);
		});
});
      // Load point data for zoom 5,6 markers
      // FILE NAME WILL NEED TO BE EDITED
      // FILE FORMAT SHOULD BE IN FORM: Cell Name, x, y, cluster #

fetch("cell_centroid.csv")
.then(response => response.text())
.then(function(text){
	console.log("load cell centroids");
	pointlist = text.split("\n");
	for (var i = 0; i < pointlist.length-1; i++) {
		var newplist = pointlist[i].split(",");
		x = Number(newplist[1]);
		y = -Number(newplist[2]);
		cell_loc_x.push(x);
		cell_loc_y.push(y);
		}
	});


fetch("Pos0_647nm_561nm_combined_clean.csv")
   	.then(response => response.text())
    .then(function(text){
        console.log("load")
        pointlist = text.split("\n");
		var selected_circles = {};
		fetch("gene.list")
		.then(response => response.text())
		.then(function(text){
			var glist = text.split("\n");
			genes = glist;
			$("#search_box").autocomplete({
				source: glist,
				select: function(event, ui){
					if(g_displayed.size==0)	map.removeLayer(circles);
					var this_id = ui.item.value;
					if(g_displayed.has(this_id)){
						return ;
					}else{
						if(getcolor(this_id)>=0){
							g_color[this_id] = getcolor(this_id);
							g_displayed.add(this_id);
						}else{
							alert("BAD, too many genes");
						}
						$("#color_legend tr").append($("<td>")
							.attr("id", "gene_" + this_id)
							.attr("bgcolor", colorlist[g_color[this_id]])
							.text(this_id)
							.append($("<img>")
								.attr("src", "open-iconic-master/svg/circle-x.svg")
								.attr("alt", "circle-x")
								.attr("width", "12")
								.attr("height", "12")
								.click(function(e){
									var sel = $("#color_legend tr td[id='gene_" + this_id + "']");
									sel.remove();
									g_displayed.delete(this_id);
									delete g_color[this_id];
									map.removeLayer(selected_circles);
									new_circles = draw_markers(pointlist);
									selected_circles = new L.LayerGroup(new_circles).addTo(map);
								})
							)
						);
					}
					map.removeLayer(selected_circles);
					new_circles = draw_markers(pointlist);
					selected_circles = new L.LayerGroup(new_circles).addTo(map);
				},
			});
		});
	});

var imageUrl = 'all_cells.png';
var imageBounds = [[0,0], [-8192, 8192]];
var minimap_layer = L.imageOverlay(imageUrl, imageBounds)

var miniMap = new L.Control.MiniMap(minimap_layer, {
	width: 256,
	height: 256,
	zoomLevelOffset: -5,
	centerFixed: [-4096, 4096]
}).addTo(map);

$("#all_genes").click(function(e){
	if(this.checked){
    	var current_bounds = refreshView();
    	cell_list = selectCell(current_bounds);

		console.log(cell_list);	
		var initialMarkers = [];
		for(var i=0; i<300000; i++){
		//for(var i=0; i<2000; i++){
			var marker = L.circleMarker(map.unproject([0, 0], map.getMaxZoom()), {
				radius: map.getZoom() * 0.8, color: "#FFFF00", fillOpacity: 0.5,
				stroke: false, "gene_id": "NA", "markertype": "transcript" 
			});
			marker.bindTooltip("").openTooltip();
			initialMarkers.push(marker);
		}
		var allMarkers = new L.LayerGroup(initialMarkers).addTo(map);
		console.log("Done initializing");
		for (var i in map._layers) {
			if (map._layers[i].options.markertype == "transcript") {
				all_markers.add(i);
				free_markers.add(i);
			}
		}
		console.log(map);
			
		callDrawSelectedCell(Array.from(cell_list), [], colorlist);
		clearCache();
	}else{
		callDrawSelectedCell([], Array.from(cell_list), colorlist);
	}
});

map.on('moveend', function(e) {
    if($("#all_genes").is(':checked')){
    	var new_bounds = refreshView();
    	if(map.getZoom() <= 1){
    		callDrawSelectedCell([], Array.from(cell_list), colorlist);
    		return;
    	}
    	new_cell_list = selectCell(new_bounds);
		var diff_list = Array.from(getDifference(new_cell_list, cell_list));
		var rm_list = Array.from(getDifference(cell_list, new_cell_list));
    	//if(arraysEqual(new_cell_list, cell_list)){
    	//	console.log("Same reference");
    	//	clearCache();
    	//	return;
    	//} 
    	console.log(new_cell_list);
		console.log("diff_list");
		console.log(diff_list);
		console.log("rm_list")
		console.log(rm_list);
		//callDrawSelectedCell(new_cell_list, colorlist);
		callDrawSelectedCell(diff_list, rm_list, colorlist);
		clearCache();		
		cell_list = new_cell_list;
	}
});
