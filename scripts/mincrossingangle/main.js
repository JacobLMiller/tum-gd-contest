/**
 * Graph Drawing Contest Tool
 * 2019-08-08
 * Philipp Kindermann
 *
 * The main file for minimum crossing angle
 */

// in general you only have to update these paths
var graphgenpath = "base/graphGeneration";
var layoutpath = "mincrossingangle/mcaLayout";
var guipath = "base/contestGUI";

requirejs.config({
        baseUrl: 'scripts'
});

requirejs(["lib/d3", "lib/deque", "debug/debug", graphgenpath, layoutpath, guipath],
    function (d3, Deque, Debug, GraphGeneration, GraphLayout, ContestGUI) {

        var debug = new Debug();
        debug.setDebug('debug');
        var graph;
        var contestgui = new ContestGUI(debug);
        var graphGeneration = new GraphGeneration(debug);
        var graphLayout = new GraphLayout(debug);
        contestgui.initDS(graphLayout,graphGeneration);
        graphGeneration.initDS(contestgui,graphLayout);
        graphLayout.initDS(contestgui,graphGeneration);
        contestgui.createGUI();

    });