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
var layerDapi;
var layerNissl;
var layerPolyA;
var selectedStain;

//	Parameters to set
//
var url = "Pos0_647nm_561nm_combined_clean.csv"
var cell_border_url = "roi.pos0.all.cells.converted.txt"
var gene_list_url = "gene.list"
var imageSize = 8192;
//
//

var initial_boundary = {
	top: 0,
	down: 0,
	left: 0,
	right: 0
};

var selected_circles = {};
var selected_cell_circles = {};
var test_layer = {};

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

function refreshView(){
    let center = map.getCenter();
    let boundary = getBound(L.latLngBounds([center]));
    if (boundary == 0){
    	console.log("Return Initial");
    	return initial_boundary;
    } 
    return boundary;
}

function getBound(bounds){
    let zoom = map.getZoom();
    let tileNumber = Math.pow(2, zoom);
    let tileSize = imageSize / tileNumber;
    let bounds_length = (0.1 * zoom + 0.5) * tileSize;
    if(bounds) {
    	var new_boundary = {
			top: bounds.getNorth() + bounds_length,
			down: bounds.getSouth() - bounds_length,
			left: bounds.getWest() - bounds_length,
			right: bounds.getEast() + bounds_length
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
	return cellList;
}

function drawSelectedCell(cl, gene_colorlist){
	var cell_circle = [];
	var point_size = map.getZoom() * 0.8;
	fetch(url)
    .then(response => response.text())
    .then(function(text){
    	console.log("loaded");
        temp_pointlist = text.split("\n");
		for(i=0; i<temp_pointlist.length-1; i++){
			var newplist = temp_pointlist[i].split(",");
			var cellid = Number(newplist[3]);
			if(cl.includes(cellid)){
				x = Number(newplist[0]);
				y = Number(newplist[1]);
				gene_id = String(newplist[4]);
	            cell_type = cellid;
	            cell_color = gene_colorlist[cellid -1];
				var marker = L.circleMarker(map.unproject([x, y], map.getMaxZoom()), {
					radius: point_size, 
					color: cell_color, 
					fillOpacity: 0.5,
					stroke: false, 
					"gene_id": gene_id,   
				});
				marker_coords_str = "<b>Cell:</b> " + cellid + "<br>" + "<b>Gene:</b> " + gene_id;
				marker.bindTooltip(marker_coords_str).openTooltip();
				cell_circle.push(marker);
				console.log("finished");
			}
		};
		console.log(cell_circle);
		selected_cell_circles = new L.LayerGroup(cell_circle).addTo(map);
    });
}

function draw_markers(pl){
	var new_circles = [];
	var point_size = map.getZoom() * 1.2;
	for(i=0; i<pl.length-1; i++){
		var newplist = pl[i].split(",");
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

function draw_test(){
	var bounds = map.getBounds();
	var point_size = map.getZoom() * 0.8;
	var test_circles = [];
		for(i=0; i<pointlist.length-1; i++){
			var newplist = pointlist[i].split(",");
			var gene_id = newplist[4];
				x = Number(newplist[0]);
				y = Number(newplist[1]);
				cellid = String(newplist[3]);
				cell_color = colorlist[cellid -1];
				if((y > -bounds._northEast.lat) && (y < -bounds._southWest.lat) && (x < bounds._northEast.lng) && (x > bounds._southWest.lng)){
					var marker = L.circleMarker(map.unproject([x, y], map.getMaxZoom()), {
						radius: point_size, 
						color: cell_color, 
						fillOpacity: 0.5,
						stroke: false, 
						"gene_id": gene_id,   
					});
					marker_coords_str = "<b>Cell:</b> " + cellid + "<br>" + "<b>Gene:</b> " + gene_id;
					marker.bindTooltip(marker_coords_str).openTooltip();
					test_circles.push(marker);
				}
		}
	map.removeLayer(test_layer);
	test_layer = new L.LayerGroup(test_circles).addTo(map);	
}

/*
L.Control.include({
  _refocusOnMap: L.Util.falseFn // Do nothing.
});
*/

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

fetch(cell_border_url)
.then(response2 => response2.text())
.then(function(text2){
	console.log("load segmentations");
	var seg = text2;
	seglist = seg.split("\n");
	i = 0;
	var map_cell = {};
	//alert(seglist);
	for(i=0; i<44047; i++){
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
	pl = text.split("\n");
	for (var i = 0; i < pl.length-1; i++) {
		var newplist = pl[i].split(",");
		x = Number(newplist[1]);
		y = -Number(newplist[2]);
		cell_loc_x.push(x);
		cell_loc_y.push(y);
		}
	});


fetch(url)
   	.then(response => response.text())
    .then(function(text){
        console.log("load")
        pointlist = text.split("\n");
		var selected_circles = {};
		fetch(gene_list_url)
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

$("#all_genes").click(function(e){
	if(this.checked){
    	//var current_bounds = refreshView();
    	//cell_list = selectCell(current_bounds);
    	//drawSelectedCell(cell_list, colorlist);
    	draw_test();
	}else{
		map.removeLayer(test_layer);
	}
});

map.on('moveend', function(e) {
    if($("#all_genes").is(':checked')){
    	//var new_bounds = refreshView();
    	if(map.getZoom() <= 2){
    		map.removeLayer(test_layer);
    		return;
    	}
    	draw_test();
    	//new_cell_list = selectCell(new_bounds);
    	//if(arraysEqual(new_cell_list, cell_list)){
    	//	console.log("Same reference");
    	//	return;
    	//} 
    	//map.removeLayer(selected_cell_circles);
    	//drawSelectedCell(new_cell_list, colorlist);
    	//cell_list = new_cell_list;
	}
});