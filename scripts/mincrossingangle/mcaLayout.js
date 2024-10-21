define(["lib/d3", "lib/deque", "base/graphLayout"], function (d3, Deque, GraphLayout) {

    var that;

    // Constructor
    function MCALayout(db) {
        that = this;
        return GraphLayout.call(this, db);
    }

    MCALayout.prototype = Object.create(GraphLayout.prototype);



    // Set the function to compute the quality of the drawing
    MCALayout.prototype.computeQuality = function() {
        GraphLayout.prototype.computeQuality.call(this);

        // find minimum crossing angle
        var minangle = 100;
        var mine1, mine2, minx, miny;
        for (var i = 0; i < this.graph.edges.length - 1; i++) {
            for (var j = i + 1; j < this.graph.edges.length; j++) {
                var e1 = this.graph.edges[i];
                var e2 = this.graph.edges[j];
                if (!(e1.source.id === e2.source.id
                    || e1.target.id === e2.source.id
                    || e1.source.id === e2.target.id
                    || e1.target.id === e2.target.id
                )) {
                    var compangle = this.computeAngle(e1, e2);
                    if (compangle["angle"] < minangle) {
                        minangle = compangle["angle"];
                        mine1 = e1;
                        mine2 = e2;
                        minx = compangle["x"];
                        miny = compangle["y"];
                    }
                }
            }
        }
        that.quality['e1'] = mine1;
        that.quality['e2'] = mine2;
        // workaround for highlighting
        that.quality['number'] = 1000 / minangle;
        that.quality['x'] = minx;
        that.quality['y'] = miny;
    };

    // compute crossing angle between two edges
    MCALayout.prototype.computeAngle = function(e1, e2) {
        var x1 = e1.source.x;
        var y1 = e1.source.y;
        var x2 = e1.target.x;
        var y2 = e1.target.y;
        var x3 = e2.source.x;
        var y3 = e2.source.y;
        var x4 = e2.target.x;
        var y4 = e2.target.y;
        var dx1 = x2 - x1;
        var dy1 = y2 - y1;
        var dx2 = x4 - x3;
        var dy2 = y4 - y3;
        // check for intersection
        var seginter = this.segment_intersection(x1, y1, x2, y2, x3, y3, x4, y4);
        if (!seginter)
            return 100;
        var angle = Math.atan2(dx1 * dy2 - dy1 * dx2, dx1 * dx2 + dy1 * dy2);
        if (angle < 0) {
            angle = angle * -1;
        }
        if (angle > Math.PI / 2) {
            angle = Math.PI - angle;
        }
        return {"angle": angle * (180 / Math.PI), "x": seginter["x"], "y": seginter["y"]};
    };




    // Use this if you want to highlight something in the drawing after computing the quality
    MCALayout.prototype.highlightQuality = function(transitiontime) {
        GraphLayout.prototype.highlightQuality.call(this,transitiontime);

        if (that.quality['number'] > 10) {
            var e1 = that.quality['e1'];
            var e2 = that.quality['e2'];
            this.svghighlight.selectAll("#eh" + e1.id)
                .data([e1, e2])
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
            // workaround for IE
            this.contestGUI.svgquality.select("text")
                .text(Math.round(1000000 / that.quality['number']) / 1000 + "")
                .html("&#8737;" + Math.round(1000000 / that.quality['number']) / 1000 + "&deg;");
        } else {
            this.contestGUI.svgquality.select("text")
                .text("-");
        }
    };





    // Are there some constraints for the feasibility except no overlap?
    // Put them into "infeasibleEdges" or "infeasibleNodes"
    MCALayout.prototype.checkFeasibility = function() {
        GraphLayout.prototype.checkFeasibility.call(this);
    };

    return MCALayout;
});