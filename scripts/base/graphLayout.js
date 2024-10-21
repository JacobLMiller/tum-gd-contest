/**
 * Graph Drawing Contest Tool
 * 2021-08-24
 * Philipp Kindermann
 *
 * Features:
 * 1. Fileimport, -export
 *   a) Load file from server (DONE)
 *   b) Load file from client (DONE)
 *   c) Save file (DONE)
 *   d) Load file from string (DONE)
 *   e) Save file to string (DONE)
 *   f) Prompt before opening?
 * 2. Edit graph
 *   a) Move vertex (DONE)
 *   b) Move multiple vertices (DONE)
 * 3. Grid
 *   a) Basic grid (DONE)
 *   b) Snapping to grid (DONE)
 *   c) Show granularity (DONE)
 *   d) Change granularity?
 * 4. Undo, Redo
 *   a) Undo (DONE)
 *   b) Redo (DONE)
 * 5. Zoom / Pan
 *   a) Zoom (DONE)
 *   b) Pan (DONE)
 *   c) Restrict to Rectangle size (DONE)
 *   d) Rescale GUI (DONE)
 *   e) Slider to zoom (DONE)
 *   f) Slider to scale nodes (DONE)
 * 6. Min crossing angle
 *   a) Highlight edges (DONE)
 *   b) Show angle (DONE)
 */

define(["lib/d3", "lib/deque"], function (d3, Deque) {

    var that;


    function GraphLayout(db) {
        that = this;
        this.debug = db;


        // OPTIONS: problem
        this.directed = true; // are the edges directed?
        this.xmovable = false; // fix x-coordinates (not implemented)
        this.ymovable = false; // fix y-coordinates (not implemented)
        this.hideQualityIfInfeasible = false;

        // OPTIONS: visualization
        this.noderad = 6; // size of nodes
        that.transstep = 20; // speed of moving with arrow keys
        that.zoomIntensity = 0.2; // zoom factor
        this.selectedFactor = 1.5;
        this.highlightFactor = 2;


        // global variables
        this.scale = 1;
        // in case we want to scale in one dimension
        that.xscale = 1;
        that.yscale = 1;
        this.xtrans = 0;
        this.ytrans = 0;
        this.basextrans = 0;
        this.baseytrans = 0;
        this.granularity = 1;
        this.renderGranularity = 1; // for snapping, usually just 1
        this.infeasibleNodes = [];
        this.infeasibleEdges = [];
        this.panning = false;
        this.additionBox = false;
        this.subtractionBox = false;
        this.dragging = false;
        this.selectionboxStart = {};
        this.selectionboxInside = [];
        this.eps = 0.000000001;
        this.nodestomove = [];
        this.vertgridlines = [];
        this.horgridlines = [];
        this.edgedata = [];
        this.graph = [];
        this.boxWidth = 600;
        this.boxHeight = 600;
        this.forcepan = 0;
        that.arrowsize = 3;

        this.quality = [];
        this.savequality = 0;

    }


    GraphLayout.prototype.selectedRad = function () {
        return that.selectedFactor * that.noderad;
    }; // size of selected node

    GraphLayout.prototype.highlightRad = function () {
        return that.highlightFactor * that.noderad;
    }; // size of the background of highlighted nodes

    GraphLayout.prototype.maxscale = function () {
        return Math.max(1,that.boxWidth / 5, that.boxHeight / 5, Math.min((that.boxWidth - 80) / that.graph.width, (that.boxHeight - 80) / that.graph.height));
    };

    GraphLayout.prototype.minscale = function () {
        if (that.graph)
            return Math.min(Math.max(that.boxWidth, that.boxHeight)/10,(that.boxWidth - 80) / that.graph.width, (that.boxHeight - 80) / that.graph.height);
        else
            return 1;
    };

    GraphLayout.prototype.setupSVG = function (svg) {
        that.svg = svg;

        // containers in the drawing area
        that.svggrid = svg.append("g").attr("id", "grid");
        that.svgselected = svg.append("g").attr("id", "selected");
        that.svghighlight = svg.append("g").attr("id", "highlight");
        that.svgedges = svg.append("g").attr("id", "edges");
        that.svgnodes = svg.append("g").attr("id", "nodes");
        that.svgselectionbox = svg.append("g").attr("id", "selectionbox");
        that.createArrowHead();
    };

    GraphLayout.prototype.createArrowHead = function () {
        that.svgmarker = that.svg.append("marker")
            .attr("id", "arrow")
            .attr("orient", "auto")
            .attr("markerUnits", "strokeWidth");
        that.svgmarker
            .append("path")
            .attr("d", "M0,0 V2 L3,1 Z");
        that.updateArrows();
    };

    GraphLayout.prototype.updateArrows = function () {
        that.svgmarker
            .attr("markerWidth", function () {
                return 3 * that.arrowsize ;
            })
            .attr("markerHeight", function () {
                return 2 * that.arrowsize;
            })
            .attr("refX", function () {
                return that.arrowsize * 3 + that.noderad / 1.5;
            })
            .attr("refY", function () {
                return that.arrowsize;
            })
            .select("path")
            .attr("transform", function () {
                return "scale(" + that.arrowsize + ")";
            });
    };

    GraphLayout.prototype.setArrowSize = function (as) {
        that.arrowsize = as;
        that.updateArrows();
        that.contestGUI.updateArrowSlider();
    };

    GraphLayout.prototype.initDS = function (contestGUI, graphGeneration) {
        that.contestGUI = contestGUI;
        that.graphGeneration = graphGeneration;
        that.graph = graphGeneration.graph;
    };

// what are the constraints for a feasible drawing?
    GraphLayout.prototype.checkFeasibility = function () {
        that.infeasibleNodes = [];
        that.infeasibleEdges = [];
        that.checkOverlap(); // is there an overlap?
    };

    GraphLayout.prototype.computeQuality = function () {
    };

    GraphLayout.prototype.highlightQuality = function (transitiontime) {
        if (that.feasible())
            that.contestGUI.svgquality.select("text")
                .text(that.quality['number']);
        else if (that.hideQualityIfInfeasible)
            that.contestGUI.svgquality.select("text")
                .text("-");
    };

    GraphLayout.prototype.setVertGridLines = function (xfirst, xlast) {
        that.vertgridlines = [];
        for (var i = xfirst; i < xlast; i += that.renderGranularity) {
            that.vertgridlines.push({"index": i});
        }
        that.vertgridlines.push({"index": xlast});
    };

    GraphLayout.prototype.setHorGridLines = function (yfirst, ylast) {
        that.horgridlines = [];
        for (var i = yfirst; i < ylast; i += that.renderGranularity) {
            that.horgridlines.push({"index": i});
        }
        that.horgridlines.push({"index": ylast});
    };

    GraphLayout.prototype.initGridData = function () {
        that.renderGranularity = that.granularity;
        if (that.renderGranularity * that.scale < 10)
            that.renderGranularity = Math.ceil(10 / that.scale);
        // not more than 10000 grid lines
        if (Math.max(that.graph.width, that.graph.height) / that.renderGranularity > 10000) {
            that.renderGranularity = Math.max(that.graph.width, that.graph.height) / 10000;
        }
        that.contestGUI.setRenderGranularity(that.renderGranularity);


        // vertical
        var xfirst = Math.max(0, Math.ceil(that.xscale * (-that.xtrans / that.scale - that.boxWidth)));
        var xlast = Math.min(that.graph.width, Math.floor(that.xscale * ((that.boxWidth - that.xtrans) / that.scale + that.boxWidth)));
        that.setVertGridLines(xfirst, xlast);
        // horizontal
        var yfirst = Math.max(0, Math.ceil(that.yscale * (-that.ytrans / that.scale - that.boxHeight)));
        var ylast = Math.min(that.graph.height, Math.floor(that.yscale * ((that.boxWidth - that.ytrans) / that.scale + that.boxHeight)));
        that.setHorGridLines(yfirst, ylast);
    };

    GraphLayout.prototype.updateGridData = function () {
        // update data for grid lines
        var xfirst =  that.xscale * Math.max(0, Math.ceil(-that.xtrans / that.scale - that.boxWidth));
        var xlast =  that.xscale * Math.min(that.graph.width, Math.floor((that.boxWidth - that.xtrans) / that.scale + that.boxWidth));
        // this is horrible, but d3 doesn't seem to support Deques
        if (that.vertgridlines.length > 0 && (that.vertgridlines[0].index < xfirst || that.vertgridlines[that.vertgridlines.length - 1].index > xlast)) {
            that.setVertGridLines(xfirst, xlast);
        }
        // horizontal
        var yfirst = that.yscale * Math.max(0, Math.ceil(-that.ytrans / that.scale - that.boxHeight));
        var ylast = that.yscale * Math.min(that.graph.height, Math.floor((that.boxWidth - that.ytrans) / that.scale + that.boxHeight));
        if (that.horgridlines.length > 0 && (that.horgridlines[0].index < yfirst || that.horgridlines[that.horgridlines.length - 1].index > ylast)) {
            that.setHorGridLines(yfirst, ylast);
        }
    };

    GraphLayout.prototype.redrawGrid = function (transtime) {
        that.svggrid.selectAll(".vertical")
            .data(that.vertgridlines)
            .exit()
            .remove();
        that.svggrid.selectAll(".vertical")
            .data(that.vertgridlines)
            .enter()
            .append("line")
            .attr("class", "gridline vertical");
        that.svggrid.selectAll(".vertical")
            .transition()
            .duration(transtime)
            .attr("x1", function (d) {
                return that.xcoord(d.index);
            })
            .attr("y1", function () {
                return that.ycoord(0);
            })
            .attr("x2", function (d) {
                return that.xcoord(d.index);
            })
            .attr("y2", function () {
                return that.ycoord(that.graph.height);
            });


        that.svggrid.selectAll(".horizontal")
            .data(that.horgridlines)
            .exit()
            .remove();
        that.svggrid.selectAll(".horizontal")
            .data(that.horgridlines)
            .enter()
            .append("line")
            .attr("class", "gridline horizontal");
        that.svggrid.selectAll(".horizontal")
            .transition()
            .duration(transtime)
            .attr("x1", function () {
                return that.xcoord(0);
            })
            .attr("y1", function (d) {
                return that.ycoord(d.index);
            })
            .attr("x2", function () {
                return that.xcoord(that.graph.width);
            })
            .attr("y2", function (d) {
                return that.ycoord(d.index);
            });
    };

    GraphLayout.prototype.nodeSelectStyle = function (selection) {
        selection.append("circle")
            .attr("class", "nodeSelect")
            .attr("id", function (d) {
                return "ns" + d.id;
            });
    };

    GraphLayout.prototype.nodeStyle = function (selection) {
        selection.append("circle")
            .attr("class", "node")
            .classed("nodeHover", function (d) {
                return d.active;
            })
            .attr("id", function (d) {
                return "n" + d.index;
            })
            .on('mouseover', function () {
                d3.select(this).classed("nodeHover", true);
            })
            .on('mouseout', function () {
                d3.select(this).classed("nodeHover", false);
            })
            .on("wheel.zoom", that.rescale)
            .call(d3.drag()
                .on("start", that.dragstarted)
                .on("drag", that.dragged)
                .on("end", that.dragended));
    };

    GraphLayout.prototype.edgeStyle = function (selection) {
        selection.append("line")
            .attr("class", function (d, i) {
                if (i % 2 === 0) {
                    return "edge edgeHalo";
                } else {
                    return "edge edgeNormal";
                }
            })
            .attr("id", function (d, i) {
                if (i % 2 === 0) {
                    return "eh" + d.id;
                } else {
                    return "e" + d.id;
                }
            })
            .attr("marker-end", function (d, i) {
                if (i % 2 === 1 && that.directed)
                    return "url(#arrow)";
            });
    };

    GraphLayout.prototype.redraw = function () {
        that.svghighlight.selectAll("*").remove();
        that.svgselected.selectAll(".nodeSelect").remove();
        that.svgselected.selectAll(".nodeSelect")
            .data(that.graph.nodes)
            .enter()
            .call(that.nodeSelectStyle);

        // vertices
        that.svgnodes.selectAll(".node").remove();
        that.svgnodes.selectAll(".node")
            .data(that.graph.nodes)
            .enter()
            .call(that.nodeStyle);

        // halo
        that.edgedata = [];
        that.graph.edges.forEach(function (d) {
            that.edgedata.push(d);
            that.edgedata.push(d);
        });

        // edges
        that.svgedges.selectAll(".edge").remove();
        that.svgedges.selectAll(".edge")
            .data(that.edgedata)
            .enter()
            .call(that.edgeStyle);

        that.updateDrawing(0);

        // check for overlaps
        that.checkFeasibility();
        that.computeQuality();
        that.highlightQuality();
        that.highlightFeasibility();
    };

    GraphLayout.prototype.xcoord = function (x) {
        return that.xscale * (that.xtrans + that.scale * x);
    };

    GraphLayout.prototype.ycoord = function (y) {
        return that.yscale * (that.ytrans + that.scale * (that.graph.height - y));
    };

    GraphLayout.prototype.xcoordinv = function (x) {
        return (x / that.xscale - that.xtrans) / that.scale
    };

    GraphLayout.prototype.ycoordinv = function (y) {
        return that.graph.height - (y / that.yscale - that.ytrans) / that.scale;
    };

    GraphLayout.prototype.calcNodeCoordinates = function (d) {
        d.drawx = that.xcoord(d.x);
        d.drawy = that.ycoord(d.y);
    };

    GraphLayout.prototype.nodeSelectLayout = function (selection) {
        selection
            .attr("transform", that.nodeTransform)
            .attr("r", function (d) {
                return that.selectrad(d);
            })
            .style("stroke-width", 4.3 / that.scale + "px")
            .style("stroke-dasharray", 1.4 / that.scale + "px");
    };

    GraphLayout.prototype.nodeLayout = function (selection) {
        selection
            .attr("transform", that.nodeTransform)
            .attr("r", that.noderad / that.scale)
            .attr("style", "stroke-width: " + 1.6 / that.scale + "px");
    };

    GraphLayout.prototype.edgeLayout = function (selection) {
        selection
            .attr("x1", function (d) {
                return d.source.drawx;
            })
            .attr("y1", function (d) {
                return d.source.drawy;
            })
            .attr("x2", function (d) {
                return d.target.drawx;
            })
            .attr("y2", function (d) {
                return d.target.drawy;
            });
    };

    GraphLayout.prototype.nodeTransform = function (d) {
        return "translate(" + d.drawx + "," + d.drawy + ") scale(" + that.scale + ")";
    };

    GraphLayout.prototype.nodeHightlightStyle = function (selection) {
        selection
            .attr("transform", that.nodeTransform)
            .attr("r", that.noderad * that.highlightFactor / that.scale)
            .attr("style", "stroke-width: " + 1.6 / that.scale + "px");
    };

    GraphLayout.prototype.updateDrawing = function (transitiontime) {
        that.graph.nodes.forEach(that.calcNodeCoordinates);

        // selected nodes - draw unselected small, selected large
        that.svgselected.selectAll(".nodeSelect")
            .transition()
            .duration(transitiontime)
            .call(that.nodeSelectLayout);

        that.svgnodes.selectAll(".node")
            .transition()
            .duration(transitiontime)
            .call(that.nodeLayout);

        that.svgedges.selectAll(".edge")
            .transition()
            .duration(transitiontime)
            .call(that.edgeLayout);

        that.svghighlight.selectAll("circle")
            .transition()
            .duration(transitiontime)
            .call(that.nodeHightlightStyle);

        that.svghighlight.selectAll("line")
            .transition()
            .duration(transitiontime)
            .call(that.edgeLayout);
    };

    GraphLayout.prototype.highlightFeasibility = function (transitiontime) {
        that.svghighlight.selectAll(".nodeHighlightWrong")
            .data(that.infeasibleNodes)
            .exit()
            .remove();
        that.svghighlight.selectAll(".edgeHighlightWrong")
            .data(that.infeasibleEdges)
            .exit()
            .remove();
        if (!that.feasible()) {
            that.contestGUI.svgquality.select("text")
                .attr("class", "qualitytext qualitytextEqual");
            if (that.hideQualityIfInfeasible) {
                that.contestGUI.svgquality.select("text")
                    .text("-")
            }
            that.contestGUI.svgquality.select("rect")
                .classed("fillWhite", false)
                .classed("fillLightRed", true);
            that.svghighlight.selectAll(".nodeHightlightWrong")
                .data(that.infeasibleNodes)
                .enter()
                .append("circle")
                .attr("class", "nodeHighlightWrong")
                .attr("r", that.highlightRad() / that.scale)
                .attr("style", "stroke-width: " + 1.6 / that.scale + "px")
                .transition()
                .duration(transitiontime)
                .attr("transform", that.nodeTransform);
            that.svghighlight.selectAll(".edgeHighlightWrong")
                .data(that.infeasibleEdges)
                .enter()
                .append("line")
                .attr("class", "edgeHighlightWrong")
                .transition()
                .duration(transitiontime)
                .attr("x1", function (d) {
                    return d.source.drawx;
                })
                .attr("y1", function (d) {
                    return d.source.drawy;
                })
                .attr("x2", function (d) {
                    return d.target.drawx;
                })
                .attr("y2", function (d) {
                    return d.target.drawy;
                })
                .attr("id", function (d) {
                    return "eh" + d.index;
                });
        } else {
            that.contestGUI.svgquality.select("rect")
                .classed("fillWhite", true)
                .classed("fillLightRed", false);
        }
    };

    GraphLayout.prototype.initNodesAndEdges = function () {
        that.maxzoomslider = Math.ceil(Math.log(that.maxscale() / that.minscale()) / Math.log(1 + that.zoomIntensity));
        that.center();
        that.granularity = 1;
        that.basextrans = that.xtrans;
        that.baseytrans = that.ytrans;
        that.selectionboxInside = [];
    };

    GraphLayout.prototype.center = function () {
        if (!that.graph)
            return;
        // find a good scale
        var maxx = 0, maxy = 0, minx = that.graph.width, miny = that.graph.height;
        that.graph.nodes.forEach(function (d) {
            minx = Math.min(minx, d.x);
            maxx = Math.max(maxx, d.x);
            miny = Math.min(miny, d.y);
            maxy = Math.max(maxy, d.y);
        });
        // at least 10
        var xdist = that.xscale * Math.max(maxx - minx, 10);
        var ydist = that.yscale * Math.max(maxy - miny, 10);
        // we want top-left boundary at (40,40), bottom-right at (width-40,height-40).
        that.scale = Math.min((that.boxWidth - 80) * that.xscale / xdist, (that.boxHeight - 80) * that.yscale / ydist);
        that.scale = Math.min(that.scale,that.maxscale());
        that.scale = Math.max(that.scale,that.minscale());
        // use center
        that.xtrans = -((minx + maxx)/ 2) * that.scale + (that.boxWidth / 2) / that.xscale;
        that.ytrans = -(that.graph.height - (miny + maxy) / 2) * that.scale + (that.boxHeight / 2) / that.yscale;
        that.contestGUI.updateZoomSlider();
    };

    GraphLayout.prototype.centerAndUpdate = function () {
        if (!that.graph)
            return;
        that.center();
        that.updateGridData();
        that.redrawGrid(100);
        that.updateDrawing(100);
    };



    GraphLayout.prototype.getMaxZoomSlider = function () {
        return Math.ceil(Math.log(that.maxscale() / that.minscale()) / Math.log(1 + that.zoomIntensity));
    };

    GraphLayout.prototype.getCurrZoomSlider = function () {
        return Math.ceil(Math.log(that.scale / that.minscale()) / Math.log(1 + that.zoomIntensity));
    };

    // this is called by using the mouse wheel
    GraphLayout.prototype.rescale = function () {
        if (!that.graph)
            return;
        that.updateDrawing(10);
        that.redrawGrid(10);
        d3.event.preventDefault();
        // mouse position
        var mx = d3.mouse(that.svg.node())[0] - that.xscale * that.xtrans;
        var my = d3.mouse(that.svg.node())[1] - that.yscale * that.ytrans;
        // normalize zoom
        var wheel = d3.event.wheelDelta / 120 || d3.event.deltaY / -3;
        if (!wheel)
            return;
        var zoom = Math.exp(wheel * that.zoomIntensity);
        zoom = Math.min(zoom, that.maxscale() / that.scale);
        zoom = Math.max(zoom, that.minscale() / that.scale);
        that.xtrans -= (mx * (zoom) - mx) / that.xscale;
        that.ytrans -= (my * (zoom) - my) / that.yscale;
        that.scale *= zoom;
        //redraw();
        that.redrawGrid(100);
        that.updateDrawing(100);
        that.contestGUI.updateZoomSlider();
    };

    GraphLayout.prototype.zoomIn = function () {
        if (!that.graph)
            return;
        // use center
        var mx = that.boxWidth / 2 - that.xscale * that.xtrans;
        var my = that.boxHeight / 2 - that.yscale * that.ytrans;
        // normalize zoom
        var zoom = Math.exp(that.zoomIntensity);
        zoom = Math.min(zoom, that.maxscale() / that.scale);
        that.xtrans -= (mx * (zoom) - mx) / that.xscale;
        that.ytrans -= (my * (zoom) - my) / that.yscale;
        that.scale *= zoom;
        //redraw();
        that.updateGridData();
        that.redrawGrid(100);
        that.updateDrawing(100);
        that.contestGUI.updateZoomSlider();
    };

    GraphLayout.prototype.zoomOut = function () {
        if (!that.graph)
            return;
        // use center
        var mx = that.boxWidth / 2 - that.xscale * that.xtrans;
        var my = that.boxHeight / 2 - that.yscale * that.ytrans;
        // normalize zoom
        var zoom = Math.exp(-that.zoomIntensity);
        zoom = Math.max(zoom, that.minscale() / that.scale);
        // don't go too far (rounding error)
        that.xtrans -= (mx * (zoom) - mx) / that.xscale;
        that.ytrans -= (my * (zoom) - my) / that.yscale;
        that.scale *= zoom;
        //redraw();
        that.updateGridData();
        that.redrawGrid(100);
        that.updateDrawing(100);
        that.contestGUI.updateZoomSlider();
    };

    GraphLayout.prototype.zoomTo = function (z) {
        if (!that.graph)
            return;
        // use center
        var mx = that.boxWidth / 2 - that.xscale * that.xtrans;
        var my = that.boxHeight / 2 - that.yscale * that.ytrans;
        // normalize zoom
        var zoom = Math.exp(z * that.zoomIntensity);
        zoom = Math.min(zoom, that.maxscale() / that.minscale());
        zoom = Math.max(zoom, 1);
        that.xtrans -= (mx * (that.minscale() * zoom / that.scale) - mx) / that.xscale;
        that.ytrans -= (my * (that.minscale() * zoom / that.scale) - my) / that.yscale;
        that.scale = that.minscale() * zoom;
        that.contestGUI.updateZoomSlider();
        that.updateGridData();
        that.redrawGrid(0);
        that.updateDrawing(0);
    };

    GraphLayout.prototype.panstarted = function () {
        if (!that.graph)
            return;
        if (that.forcepan || d3.event.sourceEvent.altKey) {
            // alt: panning
            that.panning = true;
            that.basextrans = that.xtrans - d3.event.x / that.xscale;
            that.baseytrans = that.ytrans - d3.event.y / that.yscale;
        } else {
            // create a selection box
            that.selectionboxInside = [];
            that.selectionboxStart = {
                "x": d3.mouse(that.svg.node())[0],
                "y": d3.mouse(that.svg.node())[1]
            };
            that.svgselectionbox.append("rect")
                .attr("rx", 6)
                .attr("ry", 6)
                .attr("class", "selectionBox")
                .attr("x", that.selectionboxStart.x)
                .attr("y", that.selectionboxStart.y)
                .attr("width", 0)
                .attr("height", 0);
            if (d3.event.sourceEvent.shiftKey) {
                // shift: add to selection
                that.additionBox = true;
                that.graph.nodes.forEach(function (d) {
                    d.wasSelected = d.selected;
                })
            } else if (d3.event.sourceEvent.ctrlKey) {
                // ctrl: remove from selection
                that.subtractionBox = true;
                that.graph.nodes.forEach(function (d) {
                    d.wasSelected = d.selected;
                })
            } else {
                // no mod: new selection
                that.additionBox = true;
                that.clearSelection();
            }
        }
    };


    GraphLayout.prototype.panned = function () {
        if (!that.graph || !that.graph.nodes)
            return;
        if (that.panning) {
            // panning
            that.xtrans = that.basextrans + d3.event.x / that.xscale;
            that.ytrans = that.baseytrans + d3.event.y / that.yscale;
            that.updateDrawing(0);
            that.updateGridData();
            //initGridData();
            //redraw();
            that.redrawGrid();
        } else {
            // update the box
            var box = that.svgselectionbox.select("rect");
            if (!box.empty()) {
                var mouse = d3.mouse(that.svg.node());
                var move = {
                    x: mouse[0] - that.selectionboxStart.x,
                    y: mouse[1] - that.selectionboxStart.y
                };

                var boxX, boxY, boxWidth, boxHeight;
                if (move.x < 0) {
                    boxX = mouse[0];
                } else {
                    boxX = that.selectionboxStart.x;
                }
                boxWidth = Math.abs(move.x);

                if (move.y < 0) {
                    boxY = mouse[1];
                } else {
                    boxY = that.selectionboxStart.y;
                }
                boxHeight = Math.abs(move.y);
                box.attr("x", boxX)
                    .attr("y", boxY)
                    .attr("width", boxWidth)
                    .attr("height", boxHeight);

                // alternative: only highlight inside box, change selected afterwards
                // update the nodes inside the box
                that.graph.nodes.forEach(function (d) {
                    if (d.drawx > boxX && d.drawx < boxX + boxWidth
                        && d.drawy > boxY && d.drawy < boxY + boxHeight) {
                        // inside
                        if (!d.active) {
                            that.selectionboxInside.push(d);
                            d.active = true;
                            that.svgnodes.select("#n" + d.index)
                                .classed("nodeHover", true);
                        }
                    } else {
                        // outside
                        if (d.active) {
                            that.selectionboxInside.splice(that.selectionboxInside.indexOf(d));
                            d.active = false;
                            that.svgnodes.select("#n" + d.index)
                                .classed("nodeHover", false);
                        }
                    }
                });
            }

        }
    };

    GraphLayout.prototype.panended = function () {
        that.panning = false;
        if (!that.graph || !that.graph.nodes)
            return;
        that.svgselectionbox.selectAll("rect").remove();
        that.graph.nodes.forEach(function (d) {
            d.wasSelected = false;
        });
        // alternative: now update selected
        if (that.additionBox) {
            // add if not already selected
            that.addToSelection(that.selectionboxInside);
        } else if (that.subtractionBox) {
            // remove if selected
            that.removeFromSelection(that.selectionboxInside);
        }
        that.selectionboxInside.forEach(function (d) {
            d.active = false;
            that.svgnodes.select("#n" + d.index)
                .classed("nodeHover", false);
        });
        that.selectionboxInside = [];
        that.additionBox = false;
        that.subtractionBox = false;
    };

    GraphLayout.prototype.dragstarted = function (d) {
        //selectNodes(new Array(d),d3.event.sourceEvent.shiftKey,d3.event.sourceEvent.ctrlKey);
        //d3.select(this).raise().classed("active", true);
        //d3.select(this).attr('r', noderad * 1.25/scale);
        d3.select(this).classed("nodeHover", true);
        if (!d3.event.sourceEvent.ctrlKey && !d3.event.sourceEvent.shiftKey && !d.selected)
            that.clearSelection();
        d.savex = d.x;
        d.savey = d.y;
        d.prevx = d.x;
        d.prevy = d.y;
        // make an array of selected nodes
        that.nodestomove = [d];
        that.graph.nodes.forEach(function (e) {
            if (e.selected && e.index !== d.index) {
                that.nodestomove.push(e);
                e.savex = e.x;
                e.savey = e.y;
            }
        });
        that.dragging = false;
        that.savequality = that.quality['number'];
        d.active = true;
    };

    GraphLayout.prototype.dragged = function (d) {
        // snap to grid
        var currx, curry;
        var movex = Number.MAX_VALUE;
        var movey = Number.MAX_VALUE;

        that.nodestomove.forEach(function (e) {
            currx = e.savex + (d3.event.x - e.savex) / (that.scale * that.xscale);
            currx /= that.granularity;
            currx = Math.round(currx);
            currx *= that.granularity;
            currx = Math.max(0, currx);
            currx = Math.min(that.graph.width, currx);
            if (Math.abs(currx - e.savex) < Math.abs(movex)) {
                movex = currx - e.savex;
            }
            curry = e.savey - (d3.event.y - e.savey) / (that.scale * that.yscale);
            curry /= that.granularity;
            curry = Math.round(curry);
            curry *= that.granularity;
            curry = Math.max(0, curry);
            curry = Math.min(that.graph.height, curry);
            if (Math.abs(curry - e.savey) < Math.abs(movey)) {
                movey = curry - e.savey;
            }
        });

        // check if it moved
        if (d.savex + movex !== d.prevx || d.savey + movey !== d.prevy) {
            // now in dragging mode
            that.dragging = true;
            d.prevx = d.x;
            d.prevy = d.y;
            that.nodestomove.forEach(function (e) {
                e.x = e.savex + movex;
                e.y = e.savey + movey;
            });
            that.checkFeasibility();
            that.computeQuality();
            that.updateDrawing();
            that.highlightQuality();
            that.highlightFeasibility();

            if (that.feasible()) {
                if (that.quality['number'] < that.savequality) {
                    that.contestGUI.svgquality.select("text")
                        .attr("class", "qualitytext qualitytextBetter");
                } else if (that.quality['number'] === that.savequality) {
                    that.contestGUI.svgquality.select("text")
                        .attr("class", "qualitytext qualitytextEqual");
                } else {
                    that.contestGUI.svgquality.select("text")
                        .attr("class", "qualitytext qualitytextWorse");
                }
            }
        }
    };

    GraphLayout.prototype.feasible = function() {
        return that.infeasibleEdges.length + that.infeasibleNodes.length === 0;
    }

    GraphLayout.prototype.dragended = function (d) {
        that.contestGUI.svgquality.select("text")
            .attr("class", "qualitytext qualitytextEqual");
        if (!that.dragging) {
            // no drag --> select
            that.selectNode(d, d3.event.sourceEvent.shiftKey, d3.event.sourceEvent.ctrlKey);
        } else {
            d.active = false;
            that.svgnodes.select("#n" + d.index).classed("nodeHover", false);
            that.dragging = false;
            if (d.x !== d.savex || d.y !== d.savey) {
                // we dragged something --> clear redo stack, add to undo stack
                that.graph.redo = [];
                that.contestGUI.setRedo(0);
                that.graph.undo.push({"nodes": that.nodestomove, "x": d.x - d.savex, "y": d.y - d.savey});
                if (that.graph.undo.length === 1)
                    that.contestGUI.setUndo(1);
            }
        }
        that.nodestomove = [];
    };

    GraphLayout.prototype.edgeCross = function (e1, e2) {
        var x1 = e1.source.x;
        var y1 = e1.source.y;
        var x2 = e1.target.x;
        var y2 = e1.target.y;
        var x3 = e2.source.x;
        var y3 = e2.source.y;
        var x4 = e2.target.x;
        var y4 = e2.target.y;
        return that.segment_intersection(x1, y1, x2, y2, x3, y3, x4, y4);
    };

    GraphLayout.prototype.segment_intersection = function (x1, y1, x2, y2, x3, y3, x4, y4) {
        var x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
            ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
        var y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
            ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
        if (isNaN(x) || isNaN(y)) {
            return false;
        } else {
            if (x1 >= x2) {
                if (!that.between(x2, x, x1)) {
                    return false;
                }
            } else {
                if (!that.between(x1, x, x2)) {
                    return false;
                }
            }
            if (y1 >= y2) {
                if (!that.between(y2, y, y1)) {
                    return false;
                }
            } else {
                if (!that.between(y1, y, y2)) {
                    return false;
                }
            }
            if (x3 >= x4) {
                if (!that.between(x4, x, x3)) {
                    return false;
                }
            } else {
                if (!that.between(x3, x, x4)) {
                    return false;
                }
            }
            if (y3 >= y4) {
                if (!that.between(y4, y, y3)) {
                    return false;
                }
            } else {
                if (!that.between(y3, y, y4)) {
                    return false;
                }
            }
        }
        return {x: x, y: y};
    };

    // check if point (x,y) lies on segment between (x1,y1) and (x2,y2)
    GraphLayout.prototype.pointOnSegment = function(x, y, x1, y1, x2, y2) {
        return (((x1 <= x && x <= x2) || (x2 <= x && x <= x1))
            && ((y1 <= y && y <= y2) || (y2 <= y && y <= y1))
            && ((x2 - x === 0 && x1 - x === 0)
            || (y2 - y) / (x2 - x) * (x1 - x) + y - y1 === 0));
    }

    GraphLayout.prototype.between = function (a, b, c) {
        return a - that.eps <= b && b <= c + that.eps;
        //return a < b && b < c;
    };

    GraphLayout.prototype.checkOverlap = function () {
        for (var i = 0; i < that.graph.numnodes; i++) {
            // vertices
            var v1 = that.graph.nodes[i];
            for (var j = i + 1; j < that.graph.numnodes; j++) {
                var v2 = that.graph.nodes[j];
                if (v1.x === v2.x && v1.y === v2.y) {
                    that.infeasibleNodes.push(v1);
                    that.infeasibleNodes.push(v2);
                }
            }

            // vertex with edge
            for (var j = 0; j < that.graph.edges.length; j++) {
                var e = that.graph.edges[j];
                if (v1.id !== e.source.id && v1.id !== e.target.id
                    && that.pointOnSegment(v1.x, v1.y, e.source.x, e.source.y, e.target.x, e.target.y)) {
                    that.infeasibleNodes.push(v1);
                    that.infeasibleEdges.push(e);
                }
            }
        }
    };

    GraphLayout.prototype.selectNode = function (node, shift, ctrl) {
        //if (d3.event.defaultPrevented) return; //dragged
        if (shift) {
            // shift: add to selected
            that.addToSelection([node]);
        } else if (ctrl) {
            // ctrl: remove from selection
            that.removeFromSelection([node]);
        } else {
            // neither shift nor ctrl: make this new selection
            if (that.nodestomove.length > 1 || !node.selected) {
                that.clearSelection();
                that.addToSelection([node]);
            } else {
                // if it's the only selected node, just unselect it
                that.removeFromSelection([node]);
            }
        }
    };

    GraphLayout.prototype.addToSelection = function (nodes) {
        nodes.forEach(function (d) {
            d.selected = true;
            d.active = false;
        });
        that.svgselected.selectAll(".nodeSelect")
            .data(that.graph.nodes)
            .transition()
            .attr("r", function (d) {
                return that.selectrad(d);
            });
    };

    GraphLayout.prototype.removeFromSelection = function (nodes) {
        nodes.forEach(function (d) {
            d.selected = false;
            d.active = false;
        });
        that.svgselected.selectAll(".nodeSelect")
            .data(that.graph.nodes)
            .transition()
            .attr("r", function (d) {
                return that.selectrad(d);
            });
    };

    GraphLayout.prototype.clearSelection = function () {
        if (!that.graph || !that.graph.nodes)
            return;
        that.graph.nodes.forEach(function (d) {
            d.selected = false;
            d.active = false;
        });
        that.svgselected.selectAll(".nodeSelect")
            .data(that.graph.nodes)
            .transition()
            .attr("r", function (d) {
                return that.selectrad(d);
            });
    };

    GraphLayout.prototype.undo = function () {
        if (!that.graph || that.graph.undo.length === 0)
            return;
        that.updateDrawing(10);
        // pop undo event, push to redo stack, update buttons
        var thisundo = that.graph.undo.pop();
        if (that.graph.undo.length === 0)
            that.contestGUI.setUndo(0);
        that.graph.redo.push(thisundo);
        if (that.graph.redo.length === 1)
            that.contestGUI.setRedo(1);

        // move everything back
        thisundo.nodes.forEach(function (d) {
            d.x -= thisundo.x;
            d.y -= thisundo.y;
            that.calcNodeCoordinates(d);
        });
        that.checkFeasibility();
        that.computeQuality();
        that.highlightQuality();
        that.highlightFeasibility();
        that.updateDrawing(200);
    };

    GraphLayout.prototype.redo = function () {
        if (!that.graph || that.graph.redo.length === 0)
            return;
        that.updateDrawing(10);
        // pop redo event, push to undo stack, update buttons
        var thisredo = that.graph.redo.pop();
        if (that.graph.redo.length === 0)
            that.contestGUI.setRedo(0);
        that.graph.undo.push(thisredo);
        if (that.graph.undo.length === 1)
            that.contestGUI.setUndo(1);

        // move everything back
        thisredo.nodes.forEach(function (d) {
            d.x += thisredo.x;
            d.y += thisredo.y;
            that.calcNodeCoordinates(d);
        });
        that.checkFeasibility();
        that.computeQuality();
        that.highlightQuality();
        that.highlightFeasibility();
        that.updateDrawing(200);
    };

    GraphLayout.prototype.selectrad = function (node) {
        if (node.selected)
            return that.selectedRad() / that.scale;
        else
            return Math.max(0, (that.noderad - 2.5)) / that.scale;
    };

    GraphLayout.prototype.translate = function (x, y) {
        if (that.graph) {
            that.updateDrawing(10);
            that.redrawGrid(10);
            that.xtrans += x * that.transstep;
            that.ytrans += y * that.transstep;
            that.updateDrawing(200);
            that.updateGridData();
            that.redrawGrid(200);
        }
    };

    GraphLayout.prototype.setRadius = function (r) {
        that.noderad = r;
        that.svgselected.selectAll(".nodeSelect")
            .attr("r", function (d) {
                return that.selectrad(d);
            });
        that.svgnodes.selectAll(".node")
            .attr("r", that.noderad / that.scale);
        that.svghighlight.selectAll(".nodeHighlightWrong")
            .attr("r", function () {
                return that.highlightRad() / that.scale;
            });
        if (that.directed)
            that.updateArrows();
        that.contestGUI.updateRadiusSlider();
    };

    return GraphLayout;
});