/**
 * Graph Drawing Contest Tool
 * 2019-08-08
 * Philipp Kindermann
 *
 * Extending the GUI for minimum crossings in upward drawings
 */

define(["lib/d3", "base/contestGUI"], function (d3, ContestGUI) {

    var that;

    function MCUGUI(db) {
        ContestGUI.call(this,db);
        this.qualitytext = "# Crossings";
        that = this;
    }

    MCUGUI.prototype = Object.create(ContestGUI.prototype);

    MCUGUI.prototype.initButtons = function() {
        this.buttonlist = [];
        this.buttonlist.push({f: this.buttonForcePan, t: 5});
        this.buttonlist.push({f: this.buttonOpenFile, t: 0});
        this.buttonlist.push({f: this.buttonSaveFile, t: 5});
        this.buttonlist.push({f: this.buttonCopyGraph, t: 0});
        this.buttonlist.push({f: this.buttonPasteGraph, t: 5});
        this.buttonlist.push({f: this.syncWithDB, t: 5});
        this.buttonlist.push({f: this.buttonUndo, t: 0});
        this.buttonlist.push({f: this.buttonRedo, t: 5});
    };

    MCUGUI.prototype.createGUI = function () {
        ContestGUI.prototype.createGUI.call(this);

        that.arrowSlider();
    };

    return MCUGUI;
});