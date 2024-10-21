/**
 * Graph Drawing Contest Tool
 * 2021-08-24
 * Philipp Kindermann
 *
 * Extending the GUI for polyline edge-length ratio
 */

define(["lib/d3", "base/contestGUI"], function (d3, ContestGUI) {

    var that;

    function ELRGUI(db) {
        ContestGUI.call(this,db);
        this.basewidth = 700;
        this.probdropdownwidth = 80;
        this.boxWidth = this.basewidth;
        this.qualitytext = "Edge-Length Ratio";
        this.addbendtoggle = false;
        that = this;
    }

    ELRGUI.prototype = Object.create(ContestGUI.prototype);

    ELRGUI.prototype.initButtons = function() {
        ContestGUI.prototype.initButtons.call(that);

        that.buttonlist.push({f: that.buttonAddBend, t: 0});
        that.buttonlist.push({f: that.buttonDeleteBend, t: 5});
    };

    ELRGUI.prototype.createGUI = function() {
        ContestGUI.prototype.createGUI.call(that);

        that.showNumBends();
    };

    // ADD BEND
    ELRGUI.prototype.buttonAddBend = function () {
        var addoffset = that.offset;
        // KEY BINDING
        var key = 'A'; //delete key
        var f = that.addBend;
        that.registerKeyBinding(key, f);

        that.svgaddBend = that.svgc.append("g")
            .attr("id", "addbend")
            .on("click", function () {
                f.call(that);
            })
            .on("mouseover", function () {
                that.tooltip("Add Bend [" + key + "] (drag on a segment to add a bend)", addoffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgaddBend.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        var addicon = that.svgaddBend.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "0 0 32 32");
        addicon.append("path")
            .attr("d", "M8 0c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM8 14c-3.314 0-6-2.686-6-6s2.686-6 6-6c3.314 0 6 2.686 6 6s-2.686 6-6 6z")
            .attr("transform", "translate(8 8)");
        that.svgaddBend.append("image")
            .attr("class", "icon")
            .attr("id", "toggled")
            .attr("x", that.borderleft + addoffset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("xlink:href", "icons/shadow.svg");
    };


    ELRGUI.prototype.toggleForcePan = function () {
        ContestGUI.prototype.toggleForcePan.call(this);
        that.addbendtoggle = false;
        that.graphLayout.addbendtoggle = false;
        that.svgaddBend.select("rect")
            .attr("class", "guiRectClickable");
    };

    ELRGUI.prototype.addBend = function () {
        that.forcepan = false;
        this.graphLayout.forcepan = false;
        that.svgforcepan.select("rect")
            .attr("class", "guiRectClickable");
        that.addbendtoggle = !that.addbendtoggle;
        that.graphLayout.addbendtoggle = that.addbendtoggle;
        if (that.addbendtoggle)
            that.svgaddBend.select("rect")
                .attr("class", "guiRectToggled");
        else
            that.svgaddBend.select("rect")
                .attr("class", "guiRectClickable");
    }

    ELRGUI.prototype.deleteBend = function () {
        that.graphLayout.deleteSelectedBends();
    }

    // DELETE BEND
    ELRGUI.prototype.buttonDeleteBend = function () {
        var deloffset = that.offset;
        // KEY BINDING
        var key = 'Delete'; //delete key
        var f = that.deleteBend;
        that.registerKeyDownBinding(key, f);

        that.svgdelBend = that.svgc.append("g")
            .attr("id", "delbend")
            .on("click", function () {
                f.call(that);
            })
            .on("mouseover", function () {
                that.tooltip("Delete Bends [DEL] (select bend points, then press delete)", deloffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgdelBend.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        var delicon = that.svgdelBend.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "0 0 32 32");
        delicon.append("path")
            .attr("d", "M8 0c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM8 14.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5z")
            .attr("transform", "scale(2)");
        delicon.append("path")
            .attr("d", "M10.5 4l-2.5 2.5-2.5-2.5-1.5 1.5 2.5 2.5-2.5 2.5 1.5 1.5 2.5-2.5 2.5 2.5 1.5-1.5-2.5-2.5 2.5-2.5z")
            .attr("transform", "scale(2)");
        that.svgdelBend.append("image")
            .attr("class", "icon")
            .attr("id", "toggled")
            .attr("x", that.borderleft + deloffset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("xlink:href", "icons/shadow.svg");
    };

    ELRGUI.prototype.deleteBend = function () {
        that.graphLayout.deleteSelectedBends();
    }

    // SHOW GRANULARITY
    ELRGUI.prototype.showNumBends = function () {
        that.svgnumbends = that.svgc.append("g")
            .attr("id", "numbends")
            .on("mouseover", function () {
                that.tooltip("Max. #Bends", that.boxWidth - 50, that.boxHeight + 5);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgnumbends.append("rect")
            .attr("width", 150)
            .attr("height", that.borderbot - 10)
            .attr("x", that.boxWidth + that.borderleft - 150)
            .attr("y", that.bordertop + that.boxHeight + 5)
            .attr("class", "guiRect");
        that.svgnumbends.append("text")
            .attr("alignment-baseline", "middle")
            .attr("dominant-baseline", "middle")
            .attr("x", that.boxWidth + that.borderleft - 140)
            .attr("y", that.bordertop + that.boxHeight + that.borderbot / 2)
            .attr("class", "optiontext")
            .text("")
            .html("max. #Bends: ");
    };

    ELRGUI.prototype.updateNumBends = function (numBends) {
        that.svgnumbends
            .select("text")
            .text("" + numBends)
            .html("max. #Bends: " + numBends)
    };

    ELRGUI.prototype.dragGUI = function () {
        ContestGUI.prototype.dragGUI.call(this);
        that.svgnumbends.select("rect")
            .attr("x", that.boxWidth + that.borderleft - 150)
            .attr("y", that.bordertop + that.boxHeight + 5);
        that.svgnumbends.select("text")
            .attr("x", that.boxWidth + that.borderleft - 140)
            .attr("y", that.bordertop + that.boxHeight + that.borderbot / 2);
    }



    return ELRGUI;
});