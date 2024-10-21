/**
 * Graph Drawing Contest Tool
 * 2022-11-25
 * Philipp Kindermann
 *
 * Extending the GUI for minimum crossings
 */

define(["lib/d3", "base/contestGUI"], function (d3, ContestGUI) {

    var that;

    function MCGUI(db) {
        ContestGUI.call(this,db);
        this.qualitytext = "k-planar";
        that = this;
    }

    MCGUI.prototype = Object.create(ContestGUI.prototype);

    MCGUI.prototype.initButtons = function() {
        this.buttonlist = [];
        this.buttonlist.push({f: this.buttonForcePan, t: 5});
        this.buttonlist.push({f: this.buttonOpenFile, t: 0});
        this.buttonlist.push({f: this.buttonSaveFile, t: 5});
        this.buttonlist.push({f: this.buttonCopyGraph, t: 0});
        this.buttonlist.push({f: this.buttonPasteGraph, t: 5});
        this.buttonlist.push({f: this.buttonLoadFromServer, t: 5});
        this.buttonlist.push({f: this.buttonUndo, t: 0});
        this.buttonlist.push({f: this.buttonRedo, t: 5});
    };

    MCGUI.prototype.createGUI = function () {
        ContestGUI.prototype.createGUI.call(this);
    };

    return MCGUI;
});