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
    function MCLayout(db) {
        GraphLayout.call(this, db);
        // undirected graph
        that = this;
        that.directed = false;
    }

    MCLayout.prototype = Object.create(GraphLayout.prototype);


    // Set the function to compute the quality of the drawing
    MCLayout.prototype.computeQuality = function() 
    {
	var kplanar = 0
        GraphLayout.prototype.computeQuality.call(this);
        that.quality['number'] = 0;
        for (var i = 0; i < that.graph.edges.length; i++) {
	    var localkplanar = 0;
            var e1 = that.graph.edges[i];
            for (var j = 0; j < that.graph.edges.length; j++) {
                var e2 = that.graph.edges[j];
                if (!(e1.source.id === e2.source.id
                    || e1.target.id === e2.source.id
                    || e1.source.id === e2.target.id
                    || e1.target.id === e2.target.id
                )) 
		{
                    if (that.edgeCross(e1, e2))
			localkplanar +=1;
                }
            }
	    if (localkplanar > kplanar)
	    {
		that.quality['number'] = localkplanar;
		kplanar = localkplanar;
		that.quality['e']=e1;
	    }
        }
        that.contestGUI.updateQualityText(that.quality['number']);
    };

    // Use this if you want to highlight something in the drawing after computing the quality
    MCLayout.prototype.highlightQuality = function(transitiontime) {
        GraphLayout.prototype.highlightQuality.call(this,transitiontime);

        if (that.quality['number'] > 0) 
	{
            var e = that.quality['e'];
            this.svghighlight.selectAll("#eh" + e.id)
                .data([e])
                .enter()
                .append("line")
                .attr("class", "edgeHighlight")
                .attr("id", function (d) {
                    return "eh" + d.id;
                })
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
	}
    };




    MCLayout.prototype.initNodesAndEdges = function () {
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
    MCLayout.prototype.checkFeasibility = function() {
        GraphLayout.prototype.checkFeasibility.call(this);
    };

    return MCLayout;
});