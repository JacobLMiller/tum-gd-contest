/**
 * Graph Drawing Contest Tool
 * 2017-09-13
 * Philipp Kindermann
 *
 * This handles loading and saving the graphs
 */
define(["lib/d3"], function (d3) {

    var that;
    var debug;

    function GraphGeneration(db) {
        this.graph = [];
        that = this;
        debug = db;
    }

    GraphGeneration.prototype.initDS = function (contestGUI, graphLayout) {
        this.contestGUI = contestGUI;
        this.graphLayout = graphLayout;
    };

    GraphGeneration.prototype.readSingleFile = function (e) {
        var file = e.target.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            var contents = e.target.result;
            debug.clearDebug();
            debug.addDebug(contents);
            that.load(contents);
        };
        reader.readAsText(file);
    };


    GraphGeneration.prototype.load = function (text) {

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

        // edges
        inputgraph.edges.forEach(function (d, i) {
            thiserror = null;
            /*if (isNaN(parseInt(d.source))) {
                thiserror = "Error in edge" + i + ": Source is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(d.source) !== parseInt(d.source)) {
                thiserror = "Error in edge" + i + ": Source is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(d.source) < 0) {
                thiserror = "Error in edge" + i + ": Source is negative";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(d.source) >= numnodes) {
                thiserror = "Error in edge" + i + ": Source is higher than number of nodes";
                error += thiserror + "\n";
                console.error(thiserror);
            }
            if (isNaN(parseInt(d.target))) {
                thiserror = "Error in edge" + i + ": Target is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(d.target) !== parseInt(d.target)) {
                thiserror = "Error in edge" + i + ": Target is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(d.target) < 0) {
                thiserror = "Error in edge" + i + ": Target is negative";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(d.target) >= numnodes) {
                thiserror = "Error in edge" + i + ": Target is higher than number of nodes";
                error += thiserror + "\n";
                console.error(thiserror);
            }*/
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

    GraphGeneration.prototype.loadOld = function (text) {

        var j = 0;
        var filtered = [];
        var curr = "";
        var comment = false;
        var error = "";
        var warning = "";
        var thiserror = "";
        var numnodes;
        var width;
        var height;
        var split;

        for (var i = 0; i < text.length; i++) {
            if (text[i] == "#") {
                comment = true;
            }
            if (text[i] == '\n') {
                if (curr.length > 0)
                    filtered[j++] = curr;
                curr = "";
                comment = false;
            } else if (!comment) {
                curr += text[i];
            }
        }
        if (curr.length > 0)
            filtered[j++] = curr;
        debug.addDebug("xxx" + filtered + "xxx");

        // check for errors and warnings
        // first line: #nodes
        if (isNaN(parseInt(filtered[0]))) {
            thiserror = "Error in line 1: Not a number";
            error += thiserror + "\n";
            console.error(thiserror);
        } else if (Number(filtered[0]) !== parseInt(filtered[0])) {
            thiserror = "Error in line 1: Not an integer";
            error += thiserror + "\n";
            console.error(thiserror + " - '" + filtered[0] + "'");
        } else if (parseInt(filtered[0]) <= 0) {
            thiserror = "Error in line 1: Not positive";
            error += thiserror + "\n";
            console.error(thiserror);
        }
        if (error) {
            // this is unfixable, have to stop
            that.displayErrors(error, warning);
            return;
        }
        numnodes = parseInt(filtered[0]);

        // last line: grid dimension (or edge)
        // last line is either edge or grid dimension
        split = filtered[filtered.length - 1].split(' ');
        debug.addDebug(split);
        if (split[0] === "G") {
            if (split.length < 3) {
                thiserror = "Error in line" + filtered.length + ": Expected 3 columns, but had " + split.length;
                error += thiserror + "\n";
                console.log(thiserror);
            } else if (split.length > 3) {
                thiserror = "Warning in line" + filtered.length + ": Expected 3 columns, but had " + split.length;
                warning += thiserror + "\n";
                console.log(thiserror);
            }
            // grid dimension
            if (isNaN(parseInt(split[1]))) {
                thiserror = "Error in line" + filtered.length + ": Second column is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(split[1]) !== parseInt(split[1])) {
                thiserror = "Error in line" + filtered.length + ": Second column is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[1]) <= 0) {
                thiserror = "Error in line" + filtered.length + ": Second column is not positive";
                error += thiserror + "\n";
                console.error(thiserror);
            }
            width = parseInt(split[1]);
            if (isNaN(parseInt(split[2]))) {
                thiserror = "Error in line" + filtered.length + ": Third column is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(split[2]) !== parseInt(split[2])) {
                thiserror = "Error in line" + filtered.length + ": Third column is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[2]) <= 0) {
                thiserror = "Error in line" + filtered.length + ": Third column is not positive";
                error += thiserror + "\n";
                console.error(thiserror);
            }
            height = parseInt(split[2]);
        } else {
            // edge
            width = 1000000;
            height = 1000000;
        }
        if (error) {
            // this is unfixable, have to stop
            that.displayErrors(error, warning);
            return false;
        }

        // nodes
        for (i = 0; i < numnodes; i++) {
            split = filtered[i + 1].split(' ');
            if (split.length < 2) {
                thiserror = "Error in line" + (i + 2) + ": Expected 2 columns, but found " + split.length;
                error += thiserror + "\n";
                console.log(thiserror);
            }
            if (split.length > 2) {
                thiserror = "Warning in line" + (i + 2) + ": Expected 2 columns, but found " + split.length;
                warning += thiserror + "\n";
                console.log(thiserror);
            }
            if (isNaN((split[0]))) {
                thiserror = "Error in line" + (i + 2) + ": x-coordinate is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(split[0]) !== parseInt(split[0])) {
                thiserror = "Error in line" + (i + 2) + ": x-coordinate is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[0]) < 0) {
                thiserror = "Error in line" + (i + 2) + ": x-coordinate is negative";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[0]) > width) {
                thiserror = "Error in line" + (i + 2) + ": x-coordinate is larger than the grid size";
                error += thiserror + "\n";
                console.error(thiserror);
            }
            if (isNaN((split[1]))) {
                thiserror = "Error in line" + (i + 2) + ": Second column is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(split[1]) !== parseInt(split[1])) {
                thiserror = "Error in line" + (i + 2) + ": Second column is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[1]) < 0) {
                thiserror = "Error in line" + (i + 2) + ": y-coordinate is not positive";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[1]) > height) {
                thiserror = "Error in line" + (i + 2) + ": y-coordinate is larger than the grid size";
                error += thiserror + "\n";
                console.error(thiserror);
            }
        }

        // edges
        for (i = 0; i < filtered.length - numnodes - 2; i++) {
            split = filtered[i + numnodes + 1].split(' ');
            if (split.length < 2) {
                thiserror = "Error in line" + (i + numnodes + 2) + ": Expected 2 columns, but found " + split.length;
                error += thiserror + "\n";
                console.log(thiserror);
            } else if (split.length > 2) {
                thiserror = "Warning in line" + (i + numnodes + 2) + ": Expected 2 columns, but found " + split.length;
                warning += thiserror + "\n";
                console.log(thiserror);
            }
            if (isNaN(parseInt(split[0]))) {
                thiserror = "Error in line" + (i + numnodes + 2) + ": First node is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(split[0]) !== parseInt(split[0])) {
                thiserror = "Error in line" + (i + numnodes + 2) + ": First node is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[0]) < 0) {
                thiserror = "Error in line" + (i + numnodes + 2) + ": First node is negative";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[0]) >= numnodes) {
                thiserror = "Error in line" + (i + numnodes + 2) + ": First node is higher than number of nodes";
                error += thiserror + "\n";
                console.error(thiserror);
            }
            if (isNaN(parseInt(split[1]))) {
                thiserror = "Error in line" + (i + numnodes + 2) + ": Second node is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(split[1]) !== parseInt(split[1])) {
                thiserror = "Error in line" + (i + numnodes + 2) + ": Second node is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[1]) < 0) {
                thiserror = "Error in line" + (i + numnodes + 2) + ": Second node is negative";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[1]) >= numnodes) {
                thiserror = "Error in line" + (i + numnodes + 2) + ": Second node is higher than number of nodes";
                error += thiserror + "\n";
                console.error(thiserror);
            }
        }
        // last line is either edge or grid dimension
        split = filtered[filtered.length - 1].split(' ');
        debug.addDebug(split);
        if (split[0] !== "G") {
            // edge
            if (split.length < 2) {
                thiserror = "Error in line" + filtered.length + ": Expected 2 columns, but found " + split.length;
                error += thiserror + "\n";
                console.log(thiserror);
            } else if (split.length > 2) {
                thiserror = "Warning in line" + filtered.length + ": Expected 2 columns, but found " + split.length;
                warning += thiserror + "\n";
                console.log(thiserror);
            }
            if (isNaN(parseInt(split[0]))) {
                thiserror = "Error in line" + filtered.length + ": First node is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(split[0]) !== parseInt(split[0])) {
                thiserror = "Error in line" + filtered.length + ": First node is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[0]) < 0) {
                thiserror = "Error in line" + filtered.length + ": First node is negative";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[0]) >= numnodes) {
                thiserror = "Error in line" + filtered.length + ": First node is higher than number of nodes";
                error += thiserror + "\n";
                console.error(thiserror);
            }
            if (isNaN(parseInt(split[1]))) {
                thiserror = "Error in line" + filtered.length + ": Second node is not a number";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (Number(split[1]) !== parseInt(split[1])) {
                thiserror = "Error in line" + filtered.length + ": Second node is not an integer";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[1]) < 0) {
                thiserror = "Error in line" + filtered.length + ": Second node is negative";
                error += thiserror + "\n";
                console.error(thiserror);
            } else if (parseInt(split[1]) >= numnodes) {
                thiserror = "Error in line" + filtered.length + ": Second node is higher than number of nodes";
                error += thiserror + "\n";
                console.error(thiserror);
            }
        }


        if (error) {
            // stop before creating the new graph
            that.displayErrors(error, warning);
            return false;
        } else if (warning) {
            that.displayWarnings(warning);
        }


        // create graph
        that.graph = {
            "numnodes": numnodes,
            "nodes": [],
            "edges": [],
            "width": width,
            "height": height,
            "undo": [],
            "redo": []
        };
        that.contestGUI.svgundo.select("rect").attr("class", "guiRectInactive");
        that.contestGUI.svgredo.select("rect").attr("class", "guiRectInactive");

        // nodes
        for (var i = 0; i < that.graph.numnodes; i++) {
            split = filtered[i + 1].split(' ');
            var node = {
                "id": i,
                "x": parseInt(split[0]),
                "y": parseInt(split[1]),
                "edges": [],
                "selected": false
            };
            that.graph.nodes[i] = node;
        }

        // edges
        for (var i = 0; i < filtered.length - that.graph.numnodes - 2; i++) {
            split = filtered[i + that.graph.numnodes + 1].split(' ');
            var edge = {
                "id": i,
                "source": parseInt(split[0]),
                "target": parseInt(split[1])
            };
            that.graph.edges[i] = edge;
        }
        // last line is either edge or grid dimension
        split = filtered[filtered.length - 1].split(' ');
        debug.addDebug(split);
        if (split[0] !== "G") {
            // edge
            var edge = {
                "id": filtered.length - that.graph.numnodes - 2,
                "source": parseInt(split[0]),
                "target": parseInt(split[1])
            };
            that.graph.edges[filtered.length - that.graph.numnodes - 2] = edge;
        }
        //debug.addDebug(that.graph);
        //debug.addDebug(JSON.parse(that.graph));
        //that.graph = that.postProcess(graphdata);
        if (!that.postProcess())
            return false;
        that.graphLayout.initNodesAndEdges();
        return true;
    };

    GraphGeneration.prototype.createText = function () {
        debug.clearDebug();
        if (!that.graph)
            return "";

        var savegraph = {
            "nodes": [],
            "edges": [],
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
        });
        debug.addDebug(JSON.stringify(savegraph, null, 4));

        return JSON.stringify(savegraph, null, 4);
    };

    GraphGeneration.prototype.createTextOld = function () {
        debug.clearDebug();
        if (!that.graph)
            return "";
        var savetext = debug.addDebug('# Lines starting with # are comments and ignored');
        savetext += debug.addDebug('# First value is the number of nodes (N)');
        savetext += debug.addDebug(that.graph.numnodes);
        savetext += debug.addDebug('# Next N numbers describe the node locations.');
        for (var i = 0; i < that.graph.nodes.length; i++) {
            savetext += debug.addDebug(that.graph.nodes[i].x + ' ' + that.graph.nodes[i].y);
        }
        savetext += debug.addDebug('# Remaining lines are the edges.');
        savetext += debug.addDebug('# The first value is the source node index.');
        savetext += debug.addDebug('# The second value is the target node index.');
        for (var i = 0; i < that.graph.edges.length; i++) {
            savetext += debug.addDebug(that.graph.edges[i].source.id + ' ' + that.graph.edges[i].target.id);
        }
        savetext += debug.addDebug('# Optional: Grid dimension');
        savetext += debug.addDebug('# If unspecified, it is 1000000 x 1000000');
        if (that.graph.width != 1000000 || that.graph.height != 1000000) {
            savetext += 'G ' + that.graph.width + ' ' + that.graph.height
            debug.addDebug('G ' + that.graph.width + ' ' + that.graph.height);
        }

        return savetext;
    };

    GraphGeneration.prototype.save = function () {
        if (!that.graph)
            return;
        var savetext = that.createText();

        debug.selectDebug();

        var textToWrite = savetext;
        var textFileAsBlob = new Blob([textToWrite], {type: 'text/plain'});
        var fileNameToSaveAs = that.contestGUI.selectedFile;
        var downloadLink = document.createElement("a");
        downloadLink.download = fileNameToSaveAs;
        downloadLink.innerHTML = "Download File";
        if (window.URL != null) {
            // Chrome allows the link to be clicked
            // without actually adding it to the DOM.
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        } else {
            // Firefox requires the link to be added to the DOM
            // before it can be clicked.
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            downloadLink.onclick = destroyClickedElement;
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
        }

        downloadLink.click();
    };

    GraphGeneration.prototype.postProcess = function () {

        var cnt = 0;
        that.graph.selected_nodes = [];
        graph_dict = {};

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

            edge.source.edges.push(edge);
            edge.target.edges.push(edge);

            edge.source.degree++;
            edge.target.degree++;

            cntedges++;
        }

        debug.addDebug('Graph');
        debug.addDebug('  nodes: ' + cnt);
        debug.addDebug('  edges: ' + cntedges);

        return true;
    };

    GraphGeneration.prototype.displayErrors = function (error, warning) {
        if (error)
            console.error(error);
        if (warning)
            console.warn(warning);
    };

    GraphGeneration.prototype.displayWarnings = function (warning) {
        if (warning)
            console.warn(warning);

    };

    return GraphGeneration;
});