/**
 * Graph Drawing Contest Tool
 * 2019-08-08
 * Philipp Kindermann
 *
 * Extending the graph layout for minimum crossings in upward drawings
 */

define(["lib/d3", "lib/deque", "base/graphLayout"], function (d3, Deque, GraphLayout) {

    var that;

    // Constructor
    function MCULayout(db) {
        GraphLayout.call(this, db);
        // directed graph
        that = this;
        that.directed = true;
    }

    MCULayout.prototype = Object.create(GraphLayout.prototype);


    // Set the function to compute the quality of the drawing
    MCULayout.prototype.computeQuality = function() {
        GraphLayout.prototype.computeQuality.call(this);
        that.quality['number'] = 0;
        for (var i = 0; i < that.graph.edges.length - 1; i++) {
            for (var j = i + 1; j < that.graph.edges.length; j++) {
                var e1 = that.graph.edges[i];
                var e2 = that.graph.edges[j];
                if (!(e1.source.id === e2.source.id
                    || e1.target.id === e2.source.id
                    || e1.source.id === e2.target.id
                    || e1.target.id === e2.target.id
                )) {
                    if (that.edgeCross(e1, e2))
                        that.quality['number'] += 1;
                }
            }
        }
        that.contestGUI.updateQualityText(that.quality['number']);
    };



    MCULayout.prototype.initNodesAndEdges = function () {
        // we don't care about angles, would rather have the grid be transformed to a square
        that.xscale = 1;
        that.yscale = 1;
        if (that.graph.width < that.graph.height)
            that.xscale = that.graph.height / that.graph.width;
        else if (that.graph.width > that.graph.height)
            that.yscale = that.graph.width / that.graph.height;

        GraphLayout.prototype.initNodesAndEdges();
    };


    // Are there some constraints for the feasibility except no overlap?
    // Put them into "infeasibleEdges" or "infeasibleNodes"
    MCULayout.prototype.checkFeasibility = function() {
        GraphLayout.prototype.checkFeasibility.call(this);
        this.checkUpwards(); // is the drawing upwards?
    };

    MCULayout.prototype.checkUpwards = function() {
        this.graph.edges.forEach(function (d) {
            var source = d.source;
            var target = d.target;
            if (source.y >= target.y) {
                that.infeasibleEdges.push(d);
            }
        });
    };

    return MCULayout;
});