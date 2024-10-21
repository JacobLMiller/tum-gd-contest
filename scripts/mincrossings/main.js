/**
 * Graph Drawing Contest Tool
 * 2019-08-08
 * Philipp Kindermann
 *
 * The main file for minimum crossings in upward drawings
 */

// in general you only have to update these paths
var graphgenpath = "base/graphGeneration";
var layoutpath = "mincrossings/mcLayout";
var guipath = "mincrossings/mcGUI";

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