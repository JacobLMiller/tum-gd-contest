/**
 * Graph Drawing Contest Tool
 * 2021-08-24
 * Philipp Kindermann
 *
 * Extending the graph layout for polyline edge-length ratio
 */


define(["lib/d3", "lib/deque", "base/graphLayout"], function (d3, Deque, GraphLayout) {

    var that;

    // Constructor
    function ELRLayout(db) {
        GraphLayout.call(this, db);
        // undirected graph
        that = this;
        that.directed = false;
        this.hideQualityIfInfeasible = false;

        // OPTIONS: visualization
        this.bendrad = 4; // size of bends

        this.addbendtoggle = false; // add bends mode
    }

    ELRLayout.prototype = Object.create(GraphLayout.prototype)


    ELRLayout.prototype.setupSVG = function (svg) {
        that.svg = svg;

        // containers in the drawing area
        that.svggrid = svg.append("g").attr("id", "grid");
        that.svgselected = svg.append("g").attr("id", "selected");
        that.svgbendselected = svg.append("g").attr("id", "bendselected");
        that.svghighlight = svg.append("g").attr("id", "highlight");
        that.svgedges = svg.append("g").attr("id", "edges");
        that.svgbends = svg.append("g").attr("id", "bends");
        that.svgnodes = svg.append("g").attr("id", "nodes");
        that.svgselectionbox = svg.append("g").attr("id", "selectionbox");
        that.createArrowHead();
    };


    // Set the function to compute the quality of the drawing
    ELRLayout.prototype.computeQuality = function() {
        GraphLayout.prototype.computeQuality.call(this);
        that.quality['number'] = 0;
        that.quality['longest'] = 0;
        that.quality['shortest'] = that.graph ? that.graph.width * that.graph.height : 0;
        for (var i = 0; i < that.graph.edges.length; i++) {
            var e = that.graph.edges[i]
            var l = that.edgeLength(e);
            // for denominator, use Euclidean distance
            var dist = that.length(e.source.x, e.source.y, e.target.x, e.target.y);
            if (dist < that.quality['shortest']) {
                that.quality['shortest'] = dist;
                that.quality['shortest_edge'] = e;
            }
            if (l > that.quality['longest']) {
                that.quality['longest'] = l;
                that.quality['longest_edge'] = e;
            }
        }
        that.quality['number'] = that.quality['longest'] / that.quality['shortest'];
        that.contestGUI.updateQualityText(that.quality['number'].toPrecision(6));
    };

    // Are there some constraints for the feasibility except no overlap?
    // Put them into "infeasibleEdges" or "infeasibleNodes"
    ELRLayout.prototype.checkFeasibility = function() {
        that.infeasibleBends = [];
        GraphLayout.prototype.checkFeasibility.call(this);

        // self crossings

        // crossings between edges
        for (var i = 0; i < that.graph.edges.length; i++) {
            var e1 = that.graph.edges[i];
            if (that.selfCrossing(e1)) {
                that.infeasibleEdges.push(e1);
            }
            for (var j = i + 1; j < that.graph.edges.length; j++) {
                var e2 = that.graph.edges[j];
                if (that.edgeCross(e1, e2)) {
                    that.infeasibleEdges.push(e1);
                    that.infeasibleEdges.push(e2);
                }
            }
        }
    };

    ELRLayout.prototype.selfCrossing = function (e) {
        var segments = [];

        // extract all segments of edge 1
        if (!e.bends || e.bends.length === 0) {
            // e no bends
            return false;
        } else {
            segments.push({
                'x1': e.source.x,
                'y1': e.source.y,
                'x2': e.bends[0].x,
                'y2': e.bends[0].y
            });
            for (var b = 0; b < e.bends.length - 1; b++) {
                segments.push({
                    'x1': e.bends[b].x,
                    'y1': e.bends[b].y,
                    'x2': e.bends[b+1].x,
                    'y2': e.bends[b+1].y
                });
            }
            segments.push({
                'x1': e.bends[e.bends.length-1].x,
                'y1': e.bends[e.bends.length-1].y,
                'x2': e.target.x,
                'y2': e.target.y
            });
        }

        // check intersection for all pairs
        for (var i = 0; i < segments.length; i++) {
            var s1 = segments[i];
            for (var j = i+2; j < segments.length; j++) {
                var s2 = segments[j];
                if (that.segment_intersection(s1.x1, s1.y1, s1.x2, s1.y2, s2.x1, s2.y1, s2.x2, s2.y2))
                    return true;
            }
        }
    };

    ELRLayout.prototype.edgeCross = function (e1, e2) {
        var segments1 = [];
        var segments2 = [];

        // extract all segments of edge 1
        if (!e1.bends || e1.bends.length === 0) {
            // e1 no bends
            segments1.push({
                'x1': e1.source.x,
                'y1': e1.source.y,
                'x2': e1.target.x,
                'y2': e1.target.y
            });
        } else {
            segments1.push({
                'x1': e1.source.x,
                'y1': e1.source.y,
                'x2': e1.bends[0].x,
                'y2': e1.bends[0].y
            });
            for (var b = 0; b < e1.bends.length - 1; b++) {
                segments1.push({
                    'x1': e1.bends[b].x,
                    'y1': e1.bends[b].y,
                    'x2': e1.bends[b+1].x,
                    'y2': e1.bends[b+1].y
                });
            }
            segments1.push({
                'x1': e1.bends[e1.bends.length-1].x,
                'y1': e1.bends[e1.bends.length-1].y,
                'x2': e1.target.x,
                'y2': e1.target.y
            });
        }

        // extract all segments of edge 2
        if (!e2.bends || e2.bends.length === 0) {
            // e2 no bends
            segments2.push({
                'x1': e2.source.x,
                'y1': e2.source.y,
                'x2': e2.target.x,
                'y2': e2.target.y
            });
        } else {
            segments2.push({
                'x1': e2.source.x,
                'y1': e2.source.y,
                'x2': e2.bends[0].x,
                'y2': e2.bends[0].y
            });
            for (var b = 0; b < e2.bends.length - 1; b++) {
                segments2.push({
                    'x1': e2.bends[b].x,
                    'y1': e2.bends[b].y,
                    'x2': e2.bends[b+1].x,
                    'y2': e2.bends[b+1].y
                });
            }
            segments2.push({
                'x1': e2.bends[e2.bends.length-1].x,
                'y1': e2.bends[e2.bends.length-1].y,
                'x2': e2.target.x,
                'y2': e2.target.y
            });
        }

        // check intersection for all pairs
        for (var i = 0; i < segments1.length; i++) {
            var s1 = segments1[i];
            for (var j = 0; j < segments2.length; j++) {
                var s2 = segments2[j];
                // only intersection, not overlaps
                if ((s1.x1 === s2.x1 && s1.y1 === s2.y1)
                    || (s1.x1 === s2.x2 && s1.y1 === s2.y2)
                    || (s1.x2 === s2.x1 && s1.y2 === s2.y1)
                    || (s1.x2 === s2.x2 && s1.y2 === s2.y2))
                    continue;
                if (that.segment_intersection(s1.x1, s1.y1, s1.x2, s1.y2, s2.x1, s2.y1, s2.x2, s2.y2))
                    return true;
            }
        }

        return false;
    };

    ELRLayout.prototype.checkOverlap = function () {
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
                if (v1.id !== e.source.id && v1.id !== e.target.id) {
                    if (!e.bends || e.bends.length === 0) {
                        if (that.pointOnSegment(v1.x, v1.y, e.source.x, e.source.y, e.target.x, e.target.y)) {
                            that.infeasibleNodes.push(v1);
                            that.infeasibleEdges.push(e);
                        }
                    } else {
                        if (that.pointOnSegment(v1.x, v1.y, e.source.x, e.source.y, e.bends[0].x, e.bends[0].y)) {
                            that.infeasibleNodes.push(v1);
                            that.infeasibleEdges.push(e);
                            continue;
                        }
                        for (var b = 0; b < e.bends.length - 1; b++) {
                            if (that.pointOnSegment(v1.x, v1.y, e.bends[b].x, e.bends[b].y, e.bends[b+1].x, e.bends[b+1].y)) {
                                that.infeasibleNodes.push(v1);
                                that.infeasibleEdges.push(e);
                                break;
                            }
                        }
                        if (that.pointOnSegment(v1.x, v1.y, e.bends[e.bends.length-1].x, e.bends[e.bends.length-1].y, e.target.x, e.target.y)) {
                            that.infeasibleNodes.push(v1);
                            that.infeasibleEdges.push(e);
                        }
                    }
                }
            }
        }

        for (var i = 0; i < that.graph.bendpoints.length; i++) {
            var b1 = that.graph.bendpoints[i];

            // bend with bend
            for (var j = i + 1; j < that.graph.bendpoints.length; j++) {
                var b2 = that.graph.bendpoints[j];
                if (b1.x === b2.x && b1.y === b2.y) {
                    that.infeasibleBends.push(b1);
                    that.infeasibleBends.push(b2);
                }
            }

            // bend with vertex
            for (var j = 0; j < that.graph.numnodes; j++) {
                var v = that.graph.nodes[j];
                if (b1.x === v.x && b1.y === v.y) {
                    that.infeasibleBends.push(b1);
                    that.infeasibleNodes.push(v);
                }
            }

            // bend with edge
            for (var j = 0; j < that.graph.edges.length; j++) {
                var e = that.graph.edges[j];

                if (!e.bends || e.bends.length === 0) {
                    if (that.pointOnSegment(b1.x, b1.y, e.source.x, e.source.y, e.target.x, e.target.y)) {
                        that.infeasibleBends.push(b1);
                        that.infeasibleEdges.push(e);
                    }
                } else {
                    if (b1.index !== e.bends[0].index
                            && that.pointOnSegment(b1.x, b1.y, e.source.x, e.source.y, e.bends[0].x, e.bends[0].y)) {
                        that.infeasibleBends.push(b1);
                        that.infeasibleEdges.push(e);
                        continue;
                    }
                    for (var b = 0; b < e.bends.length - 1; b++) {
                        if (b1.index !== e.bends[b].index && b1.index !== e.bends[b+1].index
                                && that.pointOnSegment(b1.x, b1.y, e.bends[b].x, e.bends[b].y, e.bends[b+1].x, e.bends[b+1].y)) {
                            that.infeasibleBends.push(b1);
                            that.infeasibleEdges.push(e);
                            break;
                        }
                    }
                    if (b1.index !== e.bends[e.bends.length-1].index
                            && that.pointOnSegment(b1.x, b1.y, e.bends[e.bends.length-1].x, e.bends[e.bends.length-1].y, e.target.x, e.target.y)) {
                        that.infeasibleBends.push(b1);
                        that.infeasibleEdges.push(e);
                    }
                }
            }
        }
    };

    ELRLayout.prototype.feasible = function() {
        return that.infeasibleEdges.length + that.infeasibleNodes.length + that.infeasibleBends.length === 0;
    }

    ELRLayout.prototype.highlightQuality = function (transitiontime) {
        if (!that.feasible()) {
            if (that.hideQualityIfInfeasible)
                that.contestGUI.updateQualityText("-");
        }

        // highlight shortest and longest edge
        if (that.quality && that.quality.shortest_edge && that.quality.longest_edge) {
            that.svghighlight.selectAll(".edgeHighlightQuality")
                .data([that.quality.shortest_edge])
                .enter()
                .append("polyline")
                .attr("class", "edgeHighlightQuality")
                .transition()
                .duration(transitiontime)
                .attr("id", function (d) {
                    return "ehq" + d.index;
                })
                .call(that.edgeLayout);
            that.svghighlight.selectAll(".edgeHighlightQuality2")
                .data([that.quality.longest_edge])
                .enter()
                .append("polyline")
                .attr("class", "edgeHighlightQuality2")
                .transition()
                .duration(transitiontime)
                .attr("id", function (d) {
                    return "ehq" + d.index;
                })
                .call(that.edgeLayout);
        }
    };

    ELRLayout.prototype.highlightFeasibility = function (transitiontime) {
        that.svghighlight.selectAll(".nodeHighlightWrong")
            .remove();
        that.svghighlight.selectAll(".edgeHighlightWrong")
            .remove();
        that.svghighlight.selectAll(".bendHighlightWrong")
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
                .append("polyline")
                .attr("class", "edgeHighlightWrong")
                .transition()
                .duration(transitiontime)
                .attr("id", function (d) {
                    return "eh" + d.index;
                })
                .call(that.edgeLayout);
            that.svghighlight.selectAll(".bendHightlightWrong")
                .data(that.infeasibleBends)
                .enter()
                .append("circle")
                .attr("class", "bendHighlightWrong")
                .attr("r", that.bendHighlightRad() / that.scale)
                .attr("style", "stroke-width: " + 0.8 / that.scale + "px")
                .transition()
                .duration(transitiontime)
                .attr("transform", that.nodeTransform);
        } else {
            that.contestGUI.svgquality.select("rect")
                .classed("fillWhite", true)
                .classed("fillLightRed", false);
        }
    };

    ELRLayout.prototype.deleteSelectedBends = function() {
        var undo_event = {
            'event' : 'deletebends',
            'bends' : [],
            'modedges' : []
        }
        that.graph.edges.forEach(function(e) {
            if (e.bends) {
                var bends_deleted = e.bends.filter(function(d) {
                    return d.selected;
                });
                if (bends_deleted.length > 0) {
                    var bends_after = e.bends.filter(function(d) {
                        return !d.selected;
                    });
                    bends_deleted.forEach(function(d) {
                        undo_event.bends.push(d);
                    })
                    undo_event.modedges.push({
                        'edge' : e,
                        'bends_before' : e.bends.slice(),
                        'bends_after' : bends_after.slice()
                    })
                    e.bends = bends_after;
                }
            }
        })
        if (that.graph.bendpoints) {
            that.graph.bendpoints = that.graph.bendpoints.filter(function(d) {
                return !d.selected;
            });
        }
        // we deleted bends  --> clear redo stack, add to undo stack
        that.graph.redo = [];
        that.contestGUI.setRedo(0);
        that.graph.undo.push(undo_event);
        if (that.graph.undo.length === 1)
            that.contestGUI.setUndo(1);

        that.redraw();
/*
        that.graph.bendpoints.forEach(function(d) {
            if (d.selected) {
                that.deleteBend(d);
            }
        })*/
    }

    ELRLayout.prototype.deleteBend = function (bend) {
        var e = bend.edge;
        e.bends.remove(bend);
        /*
        for (var b = 0; b < e.bends.length; b++) {
            if (e.bends[b].index === bend.index) {
                e.bends.remove(bend)
            }
        }*/
    }

    // compute length of an edge with bends
    ELRLayout.prototype.edgeLength = function (e) {
        if (!e.bends || e.bends.length === 0)
            return that.length(e.source.x, e.source.y, e.target.x, e.target.y);

        var length = 0;
        length += that.length(e.source.x, e.source.y, e.bends[0].x, e.bends[0].y);

        for (var b = 0; b < e.bends.length - 1; b++) {
            length += that.length(e.bends[b].x, e.bends[b].y,e.bends[b + 1].x, e.bends[b + 1].y);
        }

        length += that.length(e.bends[e.bends.length - 1].x, e.bends[e.bends.length - 1].y, e.target.x, e.target.y);
        return length;
    }

    // length of segment between (x1,y1) and (x2,y2)
    ELRLayout.prototype.length = function(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1,2) + Math.pow(y2 - y1, 2));
    }

    // distance between point (x,y) and segment from (x1,y1) to (x2,y2)
    ELRLayout.prototype.distToSegment = function (x, y, x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        var l2 = dx * dx + dy * dy;
        if (l2 === 0)
            return that.length(x, y, x1, y1);
        var t = ((x - x1) * dx + (y - y1) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        return that.length(x, y,  x1 + t * dx, y1 + t * dy);
    }

    ELRLayout.prototype.distToEdge = function (x, y, e) {
        if (!e.bends || e.bends.length === 0) {
            return that.distToSegment(x, y, e.source.drawx, e.source.drawy, e.target.drawx, e.target.drawy);
        } else {
            var dist = that.distToSegment(x, y, e.source.drawx, e.source.drawy, e.bends[0].drawx, e.bends[0].drawy);
            for (var b = 0; b < e.bends.length - 1; b++) {
                dist = Math.min(dist,that.distToSegment(x, y, e.bends[b].drawx, e.bends[b].drawy, e.bends[b+1].drawx, e.bends[b+1].drawy));
            }
            dist = Math.min(dist,that.distToSegment(x, y, e.bends[e.bends.length-1].drawx, e.bends[e.bends.length-1].drawy, e.target.drawx, e.target.drawy));
            return dist;
        }
    }

    ELRLayout.prototype.edgeLayout = function (selection) {
        selection
            .attr("points", function (d) {
                var points = d.source.drawx + "," + d.source.drawy;

                if (d.bends && d.bends.length > 0) {
                    for (var b = 0; b < d.bends.length; b++) {
                        points += " " + d.bends[b].drawx + "," + d.bends[b].drawy;
                    }
                }

                points += " " + d.target.drawx + "," + d.target.drawy;
                return points;
            })
    };

    ELRLayout.prototype.edgeStyle = function (selection) {
        selection.append("polyline")
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

    ELRLayout.prototype.setRadius = function (r) {
        GraphLayout.prototype.setRadius.call(this,r);
        that.bendrad = that.noderad * 2 / 3;
        that.svgbends.selectAll(".bend")
            .attr("r", that.bendrad / that.scale);
        that.svgbendselected.selectAll(".bendSelect")
            .attr("r", function (d) {
                return that.bendSelectrad(d);
            })
    };

    ELRLayout.prototype.updateDrawing = function(transitiontime) {
        that.graph.bendpoints.forEach(that.calcNodeCoordinates);

        that.svgbendselected.selectAll(".bendSelect")
            .transition()
            .duration(transitiontime)
            .call(that.bendSelectLayout);

        that.svgbends.selectAll(".bend")
            .transition()
            .duration(transitiontime)
            .call(that.bendLayout);

        GraphLayout.prototype.updateDrawing.call(this,transitiontime);

        that.svghighlight.selectAll("polyline")
            .transition()
            .duration(transitiontime)
            .call(that.edgeLayout);
    }

    ELRLayout.prototype.undo = function () {
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
        if (thisundo.event === 'addbend') {
            // a bend was added --> remove it again
            that.graph.bendpoints.splice(that.graph.bendpoints.indexOf(thisundo.bend),1);
            thisundo.bend.edge.bends = thisundo.bends_before.slice();
            that.redraw();
        } else if (thisundo.event === 'deletebends') {
            // bends were removed --> add them again
            thisundo.bends.forEach(function(d) {
                d.selected = false;
                that.graph.bendpoints.push(d);
            })
            thisundo.modedges.forEach(function(d) {
                d.edge.bends = d.bends_before.slice();
            })
            that.redraw();
        } else {
            // move nodes back
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
        }
    };

    ELRLayout.prototype.redo = function () {
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
        if (thisredo.event === 'addbend') {
            // a bend was added --> add it again
            that.graph.bendpoints.push(thisredo.bend);
            thisredo.bend.edge.bends = thisredo.bends_after.slice();
            that.redraw();
        } else if (thisredo.event === 'deletebends') {
            // bends were removed --> remove them again
            thisredo.bends.forEach(function(d) {
                that.graph.bendpoints.splice(that.graph.bendpoints.indexOf(d),1);
            })
            thisredo.modedges.forEach(function(d) {
                d.edge.bends = d.bends_after.slice();
            })
            that.redraw();
        } else {
            // move nodes back
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
        }
    };

    ELRLayout.prototype.calcBendCoordinates = function (d) {
        if (d.bends && d.bends.length > 0) {
            for (var b = 0; b < d.bends.length; b++) {
                d.bends[b].drawx = that.xcoord(d.bends[b].x);
                d.bends[b].drawy = that.ycoord(d.bends[b].y);
            }
        }
    };

    ELRLayout.prototype.redraw = function () {
        // bends
        that.svgbends.selectAll(".bend").remove();
        that.svgbends.selectAll(".bend")
            .data(that.graph.bendpoints)
            .enter()
            .call(that.bendStyle);

        that.svgbendselected.selectAll(".bendSelect").remove();
        that.svgbendselected.selectAll(".bendSelect")
            .data(that.graph.bendpoints)
            .enter()
            .call(that.bendSelectStyle);

        GraphLayout.prototype.redraw.call(this);
    };


    ELRLayout.prototype.bendSelectrad = function (node) {
        if (node.selected)
            return that.bendSelectedRad() / that.scale;
        else
            return Math.max(0, (that.bendrad - 1.5)) / that.scale;
    };

    ELRLayout.prototype.bendSelectedRad = function () {
        return that.selectedFactor * that.bendrad;
    }; // size of selected bend

    ELRLayout.prototype.bendHighlightRad = function () {
        return that.highlightFactor * that.bendrad;
    }; // size of the background of highlighted nodes

    ELRLayout.prototype.bendSelectLayout = function (selection) {
        selection
            .attr("transform", that.nodeTransform)
            .attr("r", function (d) {
                return that.bendSelectrad(d);
            })
            .style("stroke-width", 3.1 / that.scale + "px")
            .style("stroke-dasharray", 0.7 / that.scale + "px");
    };

    ELRLayout.prototype.bendLayout = function (selection) {
        selection
            .attr("transform", that.nodeTransform)
            .attr("r", that.bendrad / that.scale)
            .attr("style", "stroke-width: " + 0.8 / that.scale + "px");
    };

    ELRLayout.prototype.bendSelectStyle = function (selection) {
        selection.append("circle")
            .attr("class", "bendSelect")
            .attr("id", function (d) {
                return "bs" + d.index;
            });
    };

    ELRLayout.prototype.bendStyle = function (selection) {
        selection.append("circle")
            .attr("class", "bend")
            .attr("id", function(d) {
                return "b" + d.index;
            })
            .classed("bendHover", function (d) {
                return d.active;
            })
            .on('mouseover', function () {
                d3.select(this).classed("bendHover", true);
            })
            .on('mouseout', function () {
                d3.select(this).classed("bendHover", false);
            })
            .on("wheel.zoom", that.rescale)
            .call(d3.drag()
                .on("start", that.dragstarted)
                .on("drag", that.dragged)
                .on("end", that.dragended));
    };

    // add selection functionality to bends
    ELRLayout.prototype.panstarted = function () {
        if (!that.graph)
            return;
        if (that.forcepan || d3.event.sourceEvent.altKey) {
            // alt: panning
            that.panning = true;
            that.basextrans = that.xtrans - d3.event.x / that.xscale;
            that.baseytrans = that.ytrans - d3.event.y / that.yscale;
        } else if (that.addbendtoggle) {
            // add bend
            // "new" code: find closest segment, drag it to grid point for a bend
            // find closest edge
            that.savequality = that.quality['number'];
            if (that.graph && that.graph.edges.length > 0) {
                var edge = that.graph.edges[0];
                var x = d3.mouse(that.svg.node())[0];
                var y = d3.mouse(that.svg.node())[1];
                var mindist = that.distToEdge(x, y, edge);
                that.graph.edges.forEach(function (e) {
                    var dist = that.distToEdge(x, y, e);
                    if (dist < mindist) {
                        mindist = dist;
                        edge = e;
                    }
                });

                // select the corresponding segment, prepare for dragging
                // are we allowed to add a bend?
                if (that.graph.bends > 0 && (!edge.bends || edge.bends.length < that.graph.bends)) {
                    if (!edge.bends || edge.bends.length === 0) {
                        // edge has no bend yet
                        // add bend point in middle of the edge for now
                        var xbend = (edge.target.x + edge.source.x) / 2;
                        var ybend = (edge.target.y + edge.source.y) / 2;
                        var bendpoint = {
                            'x' : xbend,
                            'y' : ybend,
                            'edge' : edge,
                            'type' : 'bend',
                            'index' : edge.index + "-" + Math.random().toString(36).substr(2, 9),
                            'drawx' : that.xcoord(xbend),
                            'drawy' : that.ycoord(ybend)}
                        edge.bends = [bendpoint];
                        that.addBendData = {
                            'edge' : edge,
                            'bend' : bendpoint,
                            'x1' : edge.source.x,
                            'y1' : edge.source.y,
                            'x2' : edge.target.x,
                            'y2' : edge.target.y,
                            'placed' : false
                        }
                    } else {
                        // edge already has bends
                        // first find correct segment to place bend on
                        var index = -1;
                        var segdist = that.distToSegment(x, y, edge.source.drawx, edge.source.drawy, edge.bends[0].drawx, edge.bends[0].drawy);
                        for (var b = 0; b < edge.bends.length - 1; b ++) {
                            var dist = that.distToSegment(x, y, edge.bends[b].drawx, edge.bends[b].drawy, edge.bends[b+1].drawx, edge.bends[b+1].drawy);
                            if (dist < segdist) {
                                segdist = dist;
                                index = b;
                            }
                        }
                        var dist = that.distToSegment(x, y, edge.bends[edge.bends.length-1].drawx, edge.bends[edge.bends.length-1].drawy, edge.target.drawx, edge.target.drawy);
                        if (dist < segdist) {
                            // add at the end
                            index = edge.bends.length - 1;
                        }
                        // add at correct position
                        var x1 = index === -1 ? edge.source.x : edge.bends[index].x;
                        var y1 = index === -1 ? edge.source.y : edge.bends[index].y;
                        var x2 = index === edge.bends.length - 1 ? edge.target.x : edge.bends[index+1].x;
                        var y2 = index === edge.bends.length - 1 ? edge.target.y : edge.bends[index+1].y;
                        var xbend = (x1 + x2) / 2;
                        var ybend = (y1 + y2) / 2;
                        var bendpoint = {
                            'x' : xbend,
                            'y' : ybend,
                            'edge' : edge,
                            'type' : 'bend',
                            'index' : edge.index + "-" + Math.random().toString(36).substr(2, 9),
                            'drawx' : that.xcoord(xbend),
                            'drawy' : that.ycoord(ybend)}
                        that.addBendData = {
                            'edge' : edge,
                            'bend' : bendpoint,
                            'x1' : x1,
                            'y1' : y1,
                            'x2' : x2,
                            'y2' : y2,
                            'placed' : false
                        }
                        edge.bends.splice(index + 1, 0, bendpoint);
                        // highlight the segment
                    }
                    that.svghighlight.append("polyline")
                        .datum(that.addBendData)
                        .attr("class","edgeHighlight")
                        .attr("id","addbendsegment")
                        .attr("points", function(d) {
                            return that.xcoord(d.x1) + "," + that.ycoord(d.y1)
                                + " " + that.xcoord(d.bend.x) + "," + that.ycoord(d.bend.y)
                                + " " + that.xcoord(d.x2) + "," + that.ycoord(d.y2);
                        })
                } else {
                    // not allowed to add a bend
                    that.addBendData = 0;
                    that.svghighlight
                        .append("polyline")
                        .datum(edge)
                        .attr("class", "edgeHighlightMaxBends")
                        .call(that.edgeLayout)
                        .attr("stroke-opacity",1)
                        .transition()
                        .duration(1000)
                        .attr("stroke-opacity",0)
                        .remove();
                }

            }


            /* This is the old code: put a bend to closest edge.
            // find closest edge
            if (that.graph && that.graph.edges.length > 0) {
                var edge = that.graph.edges[0];
                var x = d3.mouse(that.svg.node())[0];
                var y = d3.mouse(that.svg.node())[1];
                var mindist = that.distToEdge(x, y, edge);
                that.graph.edges.forEach(function (e) {
                    var dist = that.distToEdge(x, y, e);
                    if (dist < mindist) {
                        mindist = dist;
                        edge = e;
                    }
                });
                // compute coordinates of closest grid point
                var xbend = Math.max(0, Math.min(that.graph.width, Math.round(that.xcoordinv(x))));
                var ybend = Math.max(0, Math.min(that.graph.height, Math.round(that.ycoordinv(y))));
                var bendpoint = {
                    'x' : xbend,
                    'y' : ybend,
                    'edge' : edge,
                    'type' : 'bend',
                    'index' : edge.index + "-" + Math.random().toString(36).substr(2, 9),
                    'drawx' : that.xcoord(xbend),
                    'drawy' : that.ycoord(ybend)}
                if (!edge.bends || edge.bends.length === 0) {
                    // edge has no bend --> add it (only if allowed)
                    if (that.graph.bends > 0) {
                        edge.bends = [bendpoint];
                        that.graph.bendpoints.push(bendpoint);
                    }
                } else {
                    // only add a bend of max number is not yet reached
                    if (edge.bends.length < that.graph.bends) {
                        // first find correct segment to place bend on
                        var index = -1;
                        var segdist = that.distToSegment(x, y, edge.source.drawx, edge.source.drawy, edge.bends[0].drawx, edge.bends[0].drawy);
                        for (var b = 0; b < edge.bends.length - 1; b ++) {
                            var dist = that.distToSegment(x, y, edge.bends[b].drawx, edge.bends[b].drawy, edge.bends[b+1].drawx, edge.bends[b+1].drawy);
                            if (dist < segdist) {
                                segdist = dist;
                                index = b;
                            }
                        }
                        var dist = that.distToSegment(x, y, edge.bends[edge.bends.length-1].drawx, edge.bends[edge.bends.length-1].drawy, edge.target.drawx, edge.target.drawy);
                        if (dist < segdist) {
                            // add at the end
                            index = edge.bends.length;
                        }
                        // add at correct position
                        edge.bends.splice(index + 1, 0, bendpoint);
                        that.graph.bendpoints.push(bendpoint);
                    }
                }
            }
            */
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
                that.graph.bendpoints.forEach(function (d) {
                    d.wasSelected = d.selected;
                })
            } else if (d3.event.sourceEvent.ctrlKey) {
                // ctrl: remove from selection
                that.subtractionBox = true;
                that.graph.nodes.forEach(function (d) {
                    d.wasSelected = d.selected;
                })
                that.graph.bendpoints.forEach(function (d) {
                    d.wasSelected = d.selected;
                })
            } else {
                // no mod: new selection
                that.additionBox = true;
                that.clearSelection();
            }
        }
    };

    ELRLayout.prototype.panned = function () {
        if (!that.graph || !that.graph.nodes)
            return;
        if (that.addbendtoggle) {
            if (that.addBendData) {
                // only if there is actually an edge selected
                // move bend around
                // coord of mouse (scaled to fit graph data)
                var x = that.xcoordinv(d3.mouse(that.svg.node())[0]);
                var y = that.ycoordinv(d3.mouse(that.svg.node())[1]);
                // what is closer: grid point or segment?
                var dist_seg = that.distToSegment(x, y, that.addBendData.x1, that.addBendData.y1, that.addBendData.x2, that.addBendData.y2)
                // closest grid point
                var x_grid = Math.max(0, Math.min(that.graph.width, Math.round(x)));
                var y_grid = Math.max(0, Math.min(that.graph.height, Math.round(y)));
                var dist_grid = that.length(x, y, x_grid, y_grid);
                if (dist_seg < dist_grid) {
                    // closer to segment --> no bend point
                    if (that.addBendData.placed) {
                        // there is currently a bend point placed --> remove it
                        that.addBendData.placed = false;
                        var bendpoint = that.addBendData.bend;
                        // remove the bend point from the drawing
                        that.graph.bendpoints.splice(that.graph.bendpoints.indexOf(bendpoint),1);
                        // place dummy bend in middle of segment
                        var xbend = (that.addBendData.x1 + that.addBendData.x2) / 2;
                        var ybend = (that.addBendData.y1 + that.addBendData.y2) / 2;
                        bendpoint.x = xbend;
                        bendpoint.y = ybend;
                        bendpoint.drawx = that.xcoord(xbend);
                        bendpoint.drawy = that.ycoord(ybend);

                        that.checkFeasibility();
                        that.computeQuality();
                        that.redraw();
                        that.highlightQuality();
                        that.highlightFeasibility();
                        that.svghighlight.append("polyline")
                            .datum(that.addBendData)
                            .attr("class","edgeHighlight")
                            .attr("id","addbendsegment")
                            .attr("points", function(d) {
                                return that.xcoord(d.x1) + "," + that.ycoord(d.y1)
                                    + " " + that.xcoord(d.bend.x) + "," + that.ycoord(d.bend.y)
                                    + " " + that.xcoord(d.x2) + "," + that.ycoord(d.y2);
                            })
                    } // else: do nothing
                } else {
                    // closer to a grid point --> put bend there
                    var bendpoint = that.addBendData.bend;
                    bendpoint.x = x_grid;
                    bendpoint.y = y_grid;
                    bendpoint.drawx = that.xcoord(x_grid);
                    bendpoint.drawy = that.xcoord(y_grid);
                    that.checkFeasibility();
                    that.computeQuality();
                    if (!that.addBendData.placed) {
                        // the bend is not yet placed --> add it to the drawing
                        that.addBendData.placed = true;
                        that.graph.bendpoints.push(bendpoint);
                    }
                    that.redraw();
                    that.highlightQuality();
                    that.highlightFeasibility();
                    that.svghighlight.append("polyline")
                        .datum(that.addBendData)
                        .attr("class","edgeHighlight")
                        .attr("id","addbendsegment")
                        .attr("points", function(d) {
                            return that.xcoord(d.x1) + "," + that.ycoord(d.y1)
                                + " " + that.xcoord(d.bend.x) + "," + that.ycoord(d.bend.y)
                                + " " + that.xcoord(d.x2) + "," + that.ycoord(d.y2);
                        })
                }

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


        } else if (that.panning) {
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
                            that.selectionboxInside.splice(that.selectionboxInside.indexOf(d),1);
                            d.active = false;
                            that.svgnodes.select("#n" + d.index)
                                .classed("nodeHover", false);
                        }
                    }
                });
                that.graph.bendpoints.forEach(function (d) {
                    if (d.drawx > boxX && d.drawx < boxX + boxWidth
                        && d.drawy > boxY && d.drawy < boxY + boxHeight) {
                        // inside
                        if (!d.active) {
                            that.selectionboxInside.push(d);
                            d.active = true;
                            that.svgbends.select("#b" + d.index)
                                .classed("bendHover", true);
                        }
                    } else {
                        // outside
                        if (d.active) {
                            that.selectionboxInside.splice(that.selectionboxInside.indexOf(d),1);
                            d.active = false;
                            that.svgbends.select("#b" + d.index)
                                .classed("bendHover", false);
                        }
                    }
                });
            }

        }
    };

    ELRLayout.prototype.panended = function () {
        that.panning = false;
        if (!that.graph || !that.graph.nodes)
            return;
        if (that.addbendtoggle) {
            that.svghighlight.select("#addbendsegment").remove();
            if (that.addBendData) {
                if (!that.addBendData.placed) {
                    // remove the dummy bend point from the edge
                    that.addBendData.edge.bends.splice(that.addBendData.edge.bends.indexOf(that.addBendData.bend),1);
                } else {
                    // we added a bend --> clear redo stack, add to undo stack
                    that.graph.redo = [];
                    that.contestGUI.setRedo(0);
                    that.graph.undo.push({
                        'event' : 'addbend',
                        'bend' : that.addBendData.bend,
                        'bends_after' : that.addBendData.edge.bends.slice(),
                        'bends_before' : that.addBendData.edge.bends.filter(function(d) {return d.index !== that.addBendData.bend.index})});
                    if (that.graph.undo.length === 1)
                        that.contestGUI.setUndo(1);
                }
            }
            that.addBendData = 0;
        }
        that.svgselectionbox.selectAll("rect").remove();
        that.graph.nodes.forEach(function (d) {
            d.wasSelected = false;
        });
        that.graph.bendpoints.forEach(function (d) {
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
            that.svgbends.select("#b" + d.index)
                .classed("bendHover", false);
        });
        that.selectionboxInside = [];
        that.additionBox = false;
        that.subtractionBox = false;
    };

    ELRLayout.prototype.dragstarted = function (d) {
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
        that.graph.bendpoints.forEach(function (e) {
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

    ELRLayout.prototype.dragended = function (d) {
        that.contestGUI.svgquality.select("text")
            .attr("class", "qualitytext qualitytextEqual");
        if (!that.dragging) {
            // no drag --> select
            that.selectNode(d, d3.event.sourceEvent.shiftKey, d3.event.sourceEvent.ctrlKey);
        } else {
            d.active = false;
            that.svgnodes.select("#n" + d.index).classed("nodeHover", false);
            that.svgbends.select("#b" + d.index).classed("bendHover", false);
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

    ELRLayout.prototype.clearSelection = function () {
        if (!that.graph || !that.graph.nodes)
            return;
        that.graph.nodes.forEach(function (d) {
            d.selected = false;
            d.active = false;
        });
        that.graph.bendpoints.forEach(function (d) {
            d.selected = false;
            d.active = false;
        });
        that.svgselected.selectAll(".nodeSelect")
            .data(that.graph.nodes)
            .transition()
            .attr("r", function (d) {
                return that.selectrad(d);
            });
        that.svgselected.selectAll(".bendSelect")
            .data(that.graph.bendpoints)
            .transition()
            .attr("r", function (d) {
                return that.bendselectrad(d);
            });
    };


    ELRLayout.prototype.addToSelection = function (nodes) {
        GraphLayout.prototype.addToSelection.call(this,nodes);
        that.svgbendselected.selectAll(".bendSelect")
            .data(that.graph.bendpoints)
            .transition()
            .attr("r", function (d) {
                return that.bendSelectrad(d);
            });
    };

    ELRLayout.prototype.removeFromSelection = function (nodes) {
        GraphLayout.prototype.removeFromSelection.call(this,nodes);
        that.svgbendselected.selectAll(".bendSelect")
            .data(that.graph.bendpoints)
            .transition()
            .attr("r", function (d) {
                return that.bendSelectrad(d);
            });
    };

    ELRLayout.prototype.clearSelection = function () {
        GraphLayout.prototype.clearSelection.call(this);
        if (that.graph && that.graph.bendpoints) {
            that.graph.bendpoints.forEach(function (d) {
                d.selected = false;
                d.active = false;
            });
        }
        that.svgbendselected.selectAll(".bendSelect")
            .data(that.graph.bendpoints)
            .transition()
            .attr("r", function (d) {
                return that.bendSelectrad(d);
            });
    };

    /*
    ELRLayout.prototype.undo = function () {
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
        thisundo.bends.forEach(function (d) {
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

    ELRLayout.prototype.redo = function () {
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
        thisredo.bends.forEach(function (d) {
            d.x += thisundo.x;
            d.y += thisundo.y;
            that.calcNodeCoordinates(d);
        });
        that.checkFeasibility();
        that.computeQuality();
        that.highlightQuality();
        that.highlightFeasibility();
        that.updateDrawing(200);
    };
    */

    return ELRLayout;
});