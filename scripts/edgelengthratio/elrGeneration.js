/**
 * Graph Drawing Contest Tool
 * 2021-08-24
 * Philipp Kindermann
 *
 * Extending the GUI for polyline edge-length ratio
 */

define(["lib/d3", "base/graphGeneration"], function (d3, GraphGeneration) {

    // TODO: The whole bend stuff could be merged into the general graphGeneration method with a switch? might make things easier in the future

    var that;
    var debug;

    function ELRGeneration(db) {
        GraphGeneration.call(this,db);
        this.qualitytext = "Edge-Length Ratio";
        debug = db;
        that = this;
    }

    ELRGeneration.prototype = Object.create(GraphGeneration.prototype);

    // new import function: also support bends
    ELRGeneration.prototype.load = function (text) {

        var inputgraph;
        var error = "";
        var warning = "";
        var thiserror = "";
        var numnodes;

        try {
            inputgraph = JSON.parse(text);
            inputgraph = {
                nodes: JSON.parse(text).nodes || [],
                edges: JSON.parse(text).edges || [],
                width: JSON.parse(text).width || 1000000,
                height: JSON.parse(text).height || 1000000,
                bends: JSON.parse(text).bends || 0,
                undo: [],
                redo: []
            }
        } catch (e) {
            console.error(e.message);
            that.displayErrors(e.message, "");
            return false;
        }

        // width
        if (isNaN(parseInt(inputgraph.width))) {
            thiserror = "Error: 'width' is not a number";
            error += thiserror + "\n";
            console.error(thiserror);
        } else if (Number(inputgraph.width) !== parseInt(inputgraph.width)) {
            thiserror = "Error: 'width' is not an integer";
            error += thiserror + "\n";
            console.error(thiserror);
        } else if (parseInt(inputgraph.width) < 0) {
            thiserror = "Error: 'width' is negative";
            error += thiserror + "\n";
            console.error(thiserror);
        }

        // height
        if (isNaN(parseInt(inputgraph.height))) {
            thiserror = "Error: 'height' is not a number";
            error += thiserror + "\n";
            console.error(thiserror);
        } else if (Number(inputgraph.height) !== parseInt(inputgraph.height)) {
            thiserror = "Error: 'height' is not an integer";
            error += thiserror + "\n";
            console.error(thiserror);
        } else if (parseInt(inputgraph.height) < 0) {
            thiserror = "Error: 'height' is negative";
            error += thiserror + "\n";
            console.error(thiserror);
        }

        // nodes
        if (!inputgraph.nodes || inputgraph.nodes.length === 0) {
            thiserror = "Error: No nodes";
            error += thiserror + "\n";
            console.log(thiserror);
            this.displayErrors(error, warning);
            return false;
        }

        numnodes = inputgraph.nodes.length;
        inputgraph.nodes.forEach(function (d) {
            thiserror = null;
            /*if (isNaN((d.id))) {
                thiserror = "Error in node " + d.id + ": id is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(d.id) !== parseInt(d.id)) {
                thiserror = "Error in node " + d.id + ": id is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(d.id) < 0) {
                thiserror = "Error in node " + d.id + ": id is negative";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(d.id) >= numnodes) {
                thiserror = "Error in node " + d.id + ": id is larger than number of nodes";
                error += thiserror + "\n";
                console.error(thiserror);
            }*/
            if (isNaN((d.x))) {
                thiserror = "Error in node " + d.id + ": x-coordinate is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(d.x) !== parseInt(d.x)) {
                thiserror = "Error in node " + d.id + ": x-coordinate is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(d.x) < 0) {
                thiserror = "Error in node " + d.id + ": x-coordinate is negative";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(d.x) > inputgraph.width) {
                thiserror = "Error in node " + d.id + ": x-coordinate is larger than the grid size";
                error += thiserror + "\n";
                console.error(thiserror);
            }
            if (isNaN((d.y))) {
                thiserror = "Error in node " + d.id + ": y-coordinate is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(d.y) !== parseInt(d.y)) {
                thiserror = "Error in node " + d.id + ": y-coordinate is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(d.y) < 0) {
                thiserror = "Error in node " + d.id + ": y-coordinate is negative";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(d.y) > inputgraph.height) {
                thiserror = "Error in node " + d.id + ": y-coordinate is larger than the grid size";
                error += thiserror + "\n";
                console.error(thiserror);
            }
        });

        if (error) {
            // stop before creating the new graph
            that.displayErrors(error, warning);
            return false;
        } else if (warning) {
            that.displayWarnings(warning);
        }

        // create graph
        that.graph = inputgraph;
        that.contestGUI.setUndo(0);
        that.contestGUI.setRedo(0);
        if (!that.postProcess())
            return false;
        that.graphLayout.graph = that.graph;

        that.graphLayout.initNodesAndEdges();
        that.graphLayout.initGridData();
        that.graphLayout.redrawGrid();
        that.graphLayout.redraw();
        return true;
    };

    // Also support bends
    ELRGeneration.prototype.postProcess = function () {

        var cnt = 0;
        that.graph.selected_nodes = [];
        graph_dict = {};
        that.graph.bendpoints = [];

        for (var i = 0; i < that.graph.nodes.length; i++) {
            that.graph.nodes[i].degree = 0;
            that.graph.nodes[i].index = i;
            that.graph.nodes[i].edges = [];
            that.graph.nodes[i].selected = false;
            graph_dict[that.graph.nodes[i].id] = that.graph.nodes[i];

            cnt++;
        }
        that.graph.numnodes = cnt;

        var cntedges = 0;

        for (var j = 0; j < that.graph.edges.length; j++) {
            var edge = that.graph.edges[j];

            edge.index = j;

            // replace indices by references to node
            if (!(edge.source in graph_dict)) {
                that.displayErrors("Edge " + j + ": source " + edge.source + " is not a node", "")
                return false;
            } else {
                edge.source = graph_dict[edge.source];
            }
            if (!(edge.target in graph_dict)) {
                that.displayErrors("Edge " + j + ": target " + edge.target + " is not a node", "")
                return false;
            } else {
                edge.target = graph_dict[edge.target];
            }

            // check number of bends
            if (edge.bends && edge.bends.length > that.graph.bends) {
                that.displayErrors("Edge " + j + ": " + edge.bends.length + " bends, only " + that.graph.bends + " allowed.", "")
                return false;
            }

            // check coordinates of bends
            if (edge.bends) {
                for (var b = 0; b < edge.bends.length; b++) {
                    var d = edge.bends[b];
                    d.index = edge.index + "-" + Math.random().toString(36).substr(2, 9);
                    d.type = "bend"
                    d.edge = edge;
                    that.graph.bendpoints.push(d);

                    if (isNaN((d.x))) {
                        thiserror = "Error in bend " + b + " of edge " + j + ": x-coordinate is not a number";
                        error += thiserror + "\n";
                        console.error(thiserror);
                        return false;
                    } else if (Number(d.x) !== parseInt(d.x)) {
                        thiserror = "Error in bend " + b + " of edge " + j + ": x-coordinate is not an integer";
                        error += thiserror + "\n";
                        console.error(thiserror);
                        return false;
                    } else if (parseInt(d.x) < 0) {
                        thiserror = "Error in bend " + b + " of edge " + j + ": x-coordinate is negative";
                        error += thiserror + "\n";
                        console.error(thiserror);
                        return false;
                    } else if (parseInt(d.x) > that.graph.width) {
                        thiserror = "Error in bend " + b + " of edge " + j + ": x-coordinate is larger than the grid size";
                        error += thiserror + "\n";
                        console.error(thiserror);
                        return false;
                    }
                    if (isNaN((d.y))) {
                        thiserror = "Error in bend " + b + " of edge " + j + ": y-coordinate is not a number";
                        error += thiserror + "\n";
                        console.error(thiserror);
                        return false;
                    } else if (Number(d.y) !== parseInt(d.y)) {
                        thiserror = "Error in bend " + b + " of edge " + j + ": y-coordinate is not an integer";
                        error += thiserror + "\n";
                        console.error(thiserror);
                        return false;
                    } else if (parseInt(d.y) < 0) {
                        thiserror = "Error in bend " + b + " of edge " + j + ": y-coordinate is negative";
                        error += thiserror + "\n";
                        console.error(thiserror);
                        return false;
                    } else if (parseInt(d.y) > that.graph.height) {
                        thiserror = "Error in bend " + b + " of edge " + j + ": y-coordinate is larger than the grid size";
                        error += thiserror + "\n";
                        console.error(thiserror);
                        return false;
                    }
                }
            }

            edge.source.edges.push(edge);
            edge.target.edges.push(edge);

            edge.source.degree++;
            edge.target.degree++;

            cntedges++;
        }

        if (that.graph && that.graph.bends)
            that.contestGUI.updateNumBends(that.graph.bends);
        else
            that.contestGUI.updateNumBends(0);


        debug.addDebug('Graph');
        debug.addDebug('  nodes: ' + cnt);
        debug.addDebug('  edges: ' + cntedges);

        return true;
    };

    ELRGeneration.prototype.createText = function () {
        debug.clearDebug();
        if (!that.graph)
            return "";

        var savegraph = {
            "nodes": [],
            "edges": [],
            "bends": that.graph.bends,
            "width": that.graph.width,
            "height": that.graph.height
        };

        that.graph.nodes.forEach(function (d, i) {
            savegraph.nodes[i] = {
                "id": i,
                "x": d.x,
                "y": d.y
            }
        });
        that.graph.edges.forEach(function (d, i) {
            savegraph.edges[i] = {
                "source": d.source.id,
                "target": d.target.id
            };
            if (d.bends && d.bends.length > 0) {
                var bends = []
                d.bends.forEach(function(b) {
                    var bend = {"x" : b.x, "y" : b.y};
                    bends.push(bend);
                })
                savegraph.edges[i]["bends"] = bends;
            }
        });
        debug.addDebug(JSON.stringify(savegraph, null, 4));

        return JSON.stringify(savegraph, null, 4);
    };

    return ELRGeneration;
});