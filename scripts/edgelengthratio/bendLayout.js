/**
 * Graph Drawing Contest Tool
 * 2021-08-24
 * Philipp Kindermann
 *
 * Extending the graph layout for polyline edge-length ratio
 */


define(["lib/d3", "lib/deque", "edgelengthratio/elrLayout"], function (d3, Deque, ELRLayout) {

    var that;

    // Constructor
    function BendLayout(db) {
        ELRLayout.call(this, db);
    }

    BendLayout.prototype = Object.create(ELRLayout.prototype);


    BendLayout.prototype.computeQuality = function() {}

    BendLayout.prototype.checkFeasibility = function() {}

    BendLayout.prototype.feasible = function() {
        return true;
    }

    BendLayout.prototype.checkOverlap = function (transitiontime) {}

    BendLayout.prototype.highlightQuality = function (transitiontime) {}

    BendLayout.prototype.highlightFeasibility = function (transitiontime) {}

    return BendLayout;
});