/**
 * Graph Drawing Contest Tool
 * 2017-09-13
 * Philipp Kindermann
 *
 * The GUI for the tool
 */

define(["lib/d3", "lib/d3-fetch"],
    function (d3, d3Fetch) {

    var that;

    function ContestGUI(db) {
        that = this;
        that.debug = db;

        this.qualitytext = "Quality";
        this.basewidth = 600;
        this.baseheight = 600;
        this.boxWidth = this.basewidth;
        this.boxHeight = this.baseheight;
        this.bordertop = 50;
        this.borderleft = 20;
        this.borderbot = 40;
        this.borderright = 40;
        this.borderx = this.borderleft + this.borderright;
        this.bordery = this.bordertop + this.borderbot;
        //var drag, svgc, svgborder, dragButton, rect, svg,
            //svggranularity, svgquality, svgforcepan, svgopen, svgsave, svgload, svgundo, svgredo, svgtextbox,
            //svgzoomslider, svgzoomin, svgzoomout, svgradiusslider, svgdrawingc;
        //var toolcontainer, textfieldcontainer;
        this.textboxbordertop = 20;
        this.textboxborderleft = 20;
        this.textboxborderbot = 45;
        this.textboxborderright = 20;
        this.textboxwidth = this.boxWidth - this.textboxborderleft - this.textboxborderright;
        this.textboxheight = this.boxHeight - this.textboxbordertop - this.textboxborderbot;
        //var zoomscale, zoomhandle,
        this.zoomsliderheight = 80;
        //maxzoomslider,
        this.zoomslidergap = 12;
        //var radiusscale, radiushandle,
        this.arrowsliderwidth = this.radiussliderwidth = this.zoomsliderheight;
        this.maxradius = 15;
        this.arrowsmalliconsize = this.radiussmalliconsize = 10;
        this.arrowlargeiconsize = this.radiuslargeiconsize = 20;
        this.arrowslidergap = this.radiusslidergap = 12;
        this.betweenslidergap = 24;
        this.dragiconsize = 15;
        this.dragiconrectsize = 20;
        //var selectedFile;
        this.iconsize = 20;
        this.iconrectsize = 30;
        this.catdropdownwidth = 80;
        this.probdropdownwidth = 60;
        //var offset;
        that.offset = 0;
        that.bottomoffset = 0;
        this.forcepan = false;
        this.keybindings = [[]];
        this.keydownbindings = [[]];
        //var minscale, maxscale;
    }


    ContestGUI.prototype.initDS = function(graphLayout, graphGeneration) {
        this.graphLayout = graphLayout;
        this.graphLayout.boxWidth = that.boxWidth;
        this.graphLayout.boxHeight = that.boxHeight;
        this.graphGeneration = graphGeneration;
    };

    ContestGUI.prototype.initButtons = function() {
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

    ContestGUI.prototype.createGUI = function () {
        that.toolcontainer = d3.select("#toolcontainer")
            .attr("style", "width:" + (that.boxWidth + that.borderx) + "px; height:" + (that.boxHeight + that.bordery) + "px;");
        that.textfieldcontainer = that.toolcontainer.select("#textfieldcontainer")
            .attr("style", "margin: " + (that.bordertop + that.textboxbordertop) + "px 0 0 "
                + (that.borderleft + that.textboxborderleft) + "px; " +
                "width: " + that.textboxwidth + "px; " +
                "height: " + that.textboxheight + "px;"
            );

        that.setupSVG();

        // DRAGGING
        that.createDrag();

        // BUTTONS
        this.initButtons();
        that.offset = 0;
        that.buttonlist.forEach(function (d) {
            d.f.call(that);
            that.offset += that.iconrectsize + d.t;
        }, that);

        // INFORMATION
        that.createQuality();
        that.createGranularity();

        // SLIDERS
        that.zoomSlider();
        that.radiusSlider();

        // SIDE BUTTONS
        that.buttonCenter();

        // KEYBINDS
        d3.select("body")
            .on("keypress", function () {
                that.keyPressed();
            })
            .on("keydown", function () {
                that.keyDowned();
            });
        that.translateKeyBindings();

        // textbox for copy / paste
        that.svgtextbox = that.svgc.append("g")
            .attr("id", "textbox");

        that.shadow();

        // that.takeValues();
    };

    ContestGUI.prototype.registerKeyBinding = function (key, f, propagate) {
        that.unregisterKeyBinding(key);
        that.keybindings[Math.max(0, that.keybindings.length - 1)].push({"key": key, "function": f, "propagate": propagate});
    };

    ContestGUI.prototype.unregisterKeyBinding = function (key) {
        that.keybindings[Math.max(0, that.keybindings.length - 1)].forEach(function (d) {
            if (d.key === key) {
                that.keybindings[Math.max(0, that.keybindings.length - 1)].splice(that.keybindings[Math.max(0, that.keydownbindings.length - 1)].indexOf(d));
            }
        });
    };

    ContestGUI.prototype.disbandKeybindings = function () {
        that.keybindings.push([]);
        that.keydownbindings.push([]);
    };

    ContestGUI.prototype.rebandKeyBindings = function () {
        if (that.keybindings.length === 0)
            return;
        that.keybindings.splice(that.keybindings.length - 1);
        that.keydownbindings.splice(that.keydownbindings.length - 1);
    };

    ContestGUI.prototype.registerKeyDownBinding = function (key, f, propagate) {
        that.unregisterKeyDownBinding(key);
        that.keydownbindings[Math.max(0, that.keydownbindings.length - 1)].push({
            "key": key,
            "function": f,
            "propagate": propagate
        });
    };

    ContestGUI.prototype.unregisterKeyDownBinding = function (key) {
        if (!that.keydownbindings || that.keydownbindings[Math.max(0, that.keydownbindings.length - 1)])
            return;
        that.keydownbindings[Math.max(0, that.keydownbindings.length - 1)].forEach(function (d) {
            if (d.key === key) {
                that.keydownbindings[Math.max(0, that.keydownbindings.length - 1)].splice(that.keydownbindings[Math.max(0, that.keydownbindings.length - 1)].indexOf(d));
            }
        })
    };

    ContestGUI.prototype.keyPressed = function () {
        var x = d3.event.key;
        var y = d3.event.code;
        // use standard key binding
        that.keybindings[Math.max(0, that.keybindings.length - 1)].forEach(function (d) {
            if (x === d.key || x.toLowerCase() === d.key.toLowerCase() || y === d.key || y.toLowerCase() === d.key.toLowerCase()) {
                if (!d.propagate) {
                    d3.event.preventDefault();
                    d3.event.stopPropagation();
                }
                d.function.call(that);
            }
        })
    };

    ContestGUI.prototype.keyDowned = function () {
        var x = d3.event.key;
        var y = d3.event.code;
        // use standard key binding
        that.keydownbindings[Math.max(0, that.keydownbindings.length - 1)].forEach(function (d) {
            if (x === d.key || x.toLowerCase() === d.key.toLowerCase() || y === d.key || y.toLowerCase() === d.key.toLowerCase()) {
                if (!d.propagate) {
                    d3.event.preventDefault();
                    d3.event.stopPropagation();
                }
                d.function.call(that);
            }
        })
    };

    /* create a tooltip at given offset
     * giving the offset is necessary because of asynchronous ajax */
    ContestGUI.prototype.tooltip = function (tttext, ttoffset, ttyoffset) {
        this.removeTooltip();
        if (!ttyoffset && ttyoffset !== 0)
            ttyoffset = -(that.bordertop + that.iconrectsize) / 2;
        var y = that.bordertop + ttyoffset - 20;
        var x = that.borderleft + ttoffset;
        that.svgc.select("tooltip").remove();
        var svgtooltip = that.svgc.append("g")
            .attr("id", "tooltip");
        var tooltiprect = svgtooltip.append("rect")
            .attr("class", "tooltipRect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", 100)
            .attr("height", 20);
        var tooltiptext = svgtooltip.append("text")
            .attr("class", "tooltipText")
            .attr("x", x + 5)
            .attr("y", y + 11)
            .attr("alignment-baseline", "middle")
            .attr("dominant-baseline", "middle")
            .text(tttext);
        tooltiprect.attr("width", tooltiptext.node().getComputedTextLength() + 10);
    };


// remove the tooltip
    ContestGUI.prototype.removeTooltip = function () {
        that.svgc.selectAll("#tooltip").remove();
    };


// open a text field, show the graph string, copy it to clipboard
    ContestGUI.prototype.copyGraph = function () {
        // disband key bindings
        this.disbandKeybindings();
        this.registerKeyDownBinding("Escape", function () {
            that.removeTextField();
        });
        // disable the GUI
        that.svgtextbox.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", that.boxWidth + that.borderx)
            .attr("height", that.boxHeight + that.bordery)
            .attr("class", "disableRect");

        // enable container, create background
        that.textfieldcontainer.classed("disabled", false);
        that.svgtextbox.append("rect")
            .attr("x", that.borderleft)
            .attr("y", that.bordertop)
            .attr("width", that.boxWidth)
            .attr("height", that.boxHeight)
            .attr("class", "strokeBlack strokeMedium fillWhite");

        // create textfield, show graph string
        var textfield = that.textfieldcontainer.append("textarea")
            .attr("class", "textfield")
            .attr("type", "text")
            .attr("style", "width: 100%; height: 100%;")
            .attr("name", "graphText")
            .text(that.graphGeneration.createText());

        // select graph string, try to copy it to clipboard.
        textfield.node().select();
        try {
            if (textfield.node().innerHTML && document.execCommand('copy')) {
                var copypopup = that.toolcontainer.append("div")
                    .attr("class", "copypopup")
                    .attr("style", "margin: " + height / 2 + "px 0 0 0")
                    .text("Copied to Clipboard");
                setTimeout(function () {
                    copypopup.classed("popuphide", true);
                }, 1);
                setTimeout(function () {
                    copypopup.remove();
                }, 1500);

            }
        } catch (err) {
        }

        // DONE button
        that.textfieldcontainer.append("input")
            .attr("class", "textfieldbutton")
            .attr("type", "button")
            .attr("value", "Done")
            .on("click", function () {
                that.removeTextField();
            });
    };


// remove the textfield, its container, and all buttons
    ContestGUI.prototype.removeTextField = function () {
        that.svgtextbox.selectAll("*").remove();
        that.textfieldcontainer.selectAll("*").remove();
        that.textfieldcontainer.classed("disabled", true);
        // reband keybindings
        this.rebandKeyBindings();
    };


// open a text field to paste a graph string
    ContestGUI.prototype.pasteGraph = function () {
        // disband keybindings while open
        this.disbandKeybindings();
        // have to register ESC button as keydown event
        this.registerKeyDownBinding("Escape", this.removeTextField);
        // Some browsers/OS change Enter from 10 to 13 if ctrl is pressed. Allow propagation.
        this.registerKeyBinding("Enter", this.pasteEnterPressed, true);
        this.registerKeyBinding("NumpadEnter", this.pasteEnterPressed, true);
        // disable the GUI
        that.svgtextbox.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", that.boxWidth + that.borderx)
            .attr("height", that.boxHeight + that.bordery)
            .attr("class", "disableRect");

        // enable container, create background
        that.textfieldcontainer.classed("disabled", false);
        that.svgtextbox.append("rect")
            .attr("x", that.borderleft)
            .attr("y", that.bordertop)
            .attr("width", that.boxWidth)
            .attr("height", that.boxHeight)
            .attr("class", "strokeBlack strokeMedium fillWhite");

        // create textfield, show graph string
        var textfield = that.textfieldcontainer.append("textarea")
            .attr("class", "textfield")
            .attr("type", "text")
            .attr("style", "width: 100%; height: 100%;")
            .attr("name", "graphText")
            .text("Paste graph string here");

        // Try to paste from clipboard
        if (window.clipboardData && window.clipboardData.getData('Text')) {
            textfield.text(window.clipboardData.getData('Text'));
            var pastepopup = that.toolcontainer.append("div")
                .attr("class", "copypopup")
                .attr("style", "margin: " + height / 2 + "px 0 0 " + width / 2 + "px;")
                .text("Pasted from Clipboard");
            this.setTimeout(function () {
                pastepopup.classed("popuphide", true);
            }, 1);
            this.setTimeout(function () {
                pastepopup.remove();
            }, 1500);
        }
        textfield.node().select();

        // LOAD button (buttons from right to left)
        that.textfieldcontainer.append("input")
            .attr("class", "textfieldbutton")
            .attr("type", "button")
            .attr("value", "Load")
            .on("click", function () {
                if (that.graphGeneration.load(textfield.node().value))
                    that.removeTextField();
            });

        // CANCEL button
        that.textfieldcontainer.append("input")
            .attr("class", "textfieldbutton")
            .attr("type", "button")
            .attr("value", "Cancel")
            .on("click", function () {
                that.removeTextField();
            });
    };

    ContestGUI.prototype.pasteEnterPressed = function () {
        if (d3.event.ctrlKey) {
            if (that.graphGeneration.load(that.textfieldcontainer.select("textarea").node().value))
                this.removeTextField();
        }
    };


// SETUP SVG
    ContestGUI.prototype.setupSVG = function () {
        // container for everything
        that.svgc = d3.select("#svgcontainer").append("svg")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("version", "1.1")
            .attr("viewBox", "0 0 " + (that.boxWidth + that.borderx) + " " + (that.boxHeight + that.bordery))
            .attr("width", that.boxWidth + that.borderx)
            .attr("height", that.boxHeight + that.bordery)
            .attr("class", "svgtool");

        // background for everything
        that.svgborder = that.svgc
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", that.boxWidth + that.borderx)
            .attr("height", that.boxHeight + that.bordery)
            .attr("class", "borderRect");

        // background for drawing area
        that.rect = that.svgc
            .append("rect")
            .attr("x", that.borderleft)
            .attr("y", that.bordertop)
            .attr("width", that.boxWidth)
            .attr("height", that.boxHeight)
            .attr("class", "strokeBlack strokeMedium fillWhite")
            .on('wheel.zoom', this.graphLayout.rescale)
            .call(d3.drag()
                .on("start", this.graphLayout.panstarted)
                .on("drag", this.graphLayout.panned)
                .on("end", this.graphLayout.panended));

        // container for drawing area
        that.svgdrawingc = that.svgc.append("svg")
            .attr("width", that.boxWidth)
            .attr("height", that.boxHeight)
            .attr("x", that.borderleft)
            .attr("y", that.bordertop)
            .attr("id", "container");

        /* separate svg for drawing area because we want a different dimension
           and we want to prevent the drawing to go above the GUI */
        that.svg = that.svgdrawingc.append("g")
            .attr("id", "container");

        this.graphLayout.setupSVG(that.svg);
    };


// DRAGGING THE CANVAS
    ContestGUI.prototype.createDrag = function () {
        that.drag = d3.drag()
            .on("start", function () {

            })
            .on("drag", function() {
                that.dragGUI();
            })
            .on("end", function () {
                that.basewidth = that.boxWidth;
                that.baseheight = that.boxHeight;
                if (that.graphLayout.graph)
                    that.graphLayout.redrawGrid();
            });

        that.dragButton = that.svgc.append("g")
            .attr("id", "dragButton")
            .on('mouseover', function () {
                d3.select("body").style("cursor", "se-resize");
            })
            .on('mouseout', function () {
                d3.select("body").style("cursor", "default");
            })
            .call(that.drag);
        that.dragButton.append("rect")
            .attr("x", that.boxWidth + that.borderx - that.dragiconrectsize)
            .attr("y", that.boxHeight + that.bordery - that.dragiconrectsize)
            .attr("width", that.dragiconrectsize)
            .attr("height", that.dragiconrectsize)
            .attr("class", "guiRectFlat");
        that.dragButton.append("svg")
            .attr("class", "icon")
            .attr("x", that.boxWidth + that.borderx - (that.dragiconrectsize + that.dragiconsize) / 2)
            .attr("y", that.boxHeight + that.bordery - (that.dragiconrectsize + that.dragiconsize) / 2)
            .attr("width", that.dragiconsize)
            .attr("height", that.dragiconsize)
            .attr("viewBox", "-1 -1 33 33")
            .append("path")
            .attr("d", "M32 0v13l-5-5-6 6-3-3 6-6-5-5zM14 21l-6 6 5 5h-13v-13l5 5 6-6z")
            .attr("transform", "translate(32,0) scale(-1,1)");
    };


// update all the sizes while dragging
    ContestGUI.prototype.dragGUI = function () {
        that.boxWidth = Math.max(that.offset, d3.event.x - that.borderleft - 0.5 * that.borderright);
        that.boxHeight = Math.max(that.zoomsliderheight + 2 * that.iconrectsize + 3 * that.zoomslidergap, d3.event.y - that.bordertop - 0.5 * that.borderbot);
        this.graphLayout.boxWidth = that.boxWidth;
        this.graphLayout.boxHeight = that.boxHeight;
        that.textboxwidth = that.boxWidth - that.textboxborderleft - that.textboxborderright;
        that.textboxheight = that.boxHeight - that.textboxbordertop - that.textboxborderbot;
        that.toolcontainer.attr("style", "width:" + (that.boxWidth + that.borderx) + "px; height:" + (that.boxHeight + that.bordery) + "px;");
        that.textfieldcontainer.attr("style", "margin: " + (that.bordertop + that.textboxbordertop) + "px 0 0 "
            + (that.borderleft + that.textboxborderleft) + "px; " +
            "width: " + that.textboxwidth + "px; " +
            "height: " + that.textboxheight + "px;"
        );
        that.svgc.attr("viewBox", "0 0 " + (that.boxWidth + that.borderx) + " " + (that.boxHeight + that.bordery))
            .attr("width", that.boxWidth + that.borderx)
            .attr("height", that.boxHeight + that.bordery);
        that.svgborder.attr("width", that.boxWidth + that.borderx)
            .attr("height", that.boxHeight + that.bordery);
        that.rect.attr("width", that.boxWidth)
            .attr("height", that.boxHeight);
        that.svgdrawingc.attr("width", that.boxWidth)
            .attr("height", that.boxHeight);
        that.svgquality.select("rect")
            .attr("x", that.boxWidth + that.borderleft - 100);
        that.svgquality.select("text")
            .attr("x", that.boxWidth + that.borderleft - 10);
        that.svggranularity.select("rect")
            .attr("x", that.boxWidth + that.borderleft - 155);
        that.svggranularity.select("text")
            .attr("x", that.boxWidth + that.borderleft - 110);
        that.dragButton.select("rect")
            .attr("x", that.boxWidth + that.borderx - that.dragiconrectsize)
            .attr("y", that.boxHeight + that.bordery - that.dragiconrectsize);
        that.dragButton.select("svg")
            .attr("x", that.boxWidth + that.borderx - (that.dragiconrectsize + that.dragiconsize) / 2)
            .attr("y", that.boxHeight + that.bordery - (that.dragiconrectsize + that.dragiconsize) / 2);
        that.svgzoomin.select("rect")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconrectsize) / 2);
        that.svgzoomin.select("svg")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconsize) / 2);
        that.svgzoomout.select("rect")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconrectsize) / 2);
        that.svgzoomout.select("svg")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconsize) / 2);
        that.svgcenter.select("rect")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconrectsize) / 2);
        that.svgcenter.select("svg")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconsize) / 2);
        // slider
        that.svgzoomslider.attr("transform", "translate(" + (that.borderleft + that.boxWidth + that.borderright / 2) + "," + (that.bordertop + that.iconrectsize + that.zoomslidergap) + ")");
        that.svgradiusslider.attr("transform",
            "translate(" + (that.borderleft + that.radiussmalliconsize + that.radiusslidergap) + ","
            + (that.bordertop + that.boxHeight + that.borderbot / 2) + ")");
        if (that.svgarrowslider)
            that.svgarrowslider.attr("transform",
                "translate(" + (that.borderleft + that.bottomoffset + that.arrowsmalliconsize + that.arrowslidergap) + ","
                + (that.bordertop + that.boxHeight + that.borderbot / 2) + ")");
        if (this.graphLayout.graph) {
            this.updateZoomSlider();
        }
    };


// SHOW QUALITY OF DRAWING
    ContestGUI.prototype.createQuality = function () {
        that.svgquality = that.svgc.append("g")
            .attr("id", "quality")
            .on("mouseover", function () {
                that.tooltip(that.qualitytext, that.boxWidth - 100);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgquality.append("rect")
            .attr("width", 100)
            .attr("height", that.bordertop - 20)
            .attr("x", that.boxWidth + that.borderleft - 100)
            .attr("y", 10)
            .attr("class", "qualityRect fillWhite");
        that.svgquality.append("text")
            .attr("text-anchor", "end")
            .attr("alignment-baseline", "middle")
            .attr("dominant-baseline", "middle")
            .attr("x", that.boxWidth + that.borderleft - 10)
            .attr("y", that.bordertop / 2)
            .attr("class", "qualitytext qualitytextEqual")
            .text("-");
        that.offset += 105;
    };

    // UPDATE QUALITY TEXT
    ContestGUI.prototype.updateQualityText = function(text) {
        that.svgquality.select("text").text(text);
    };


// SHOW GRANULARITY
    ContestGUI.prototype.createGranularity = function () {
        that.svggranularity = that.svgc.append("g")
            .attr("id", "granularity")
            .on("mouseover", function () {
                that.tooltip("Grid Granularity", that.boxWidth - 155);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svggranularity.append("rect")
            .attr("width", 50)
            .attr("height", that.bordertop - 20)
            .attr("x", that.boxWidth + that.borderleft - 155)
            .attr("y", 10)
            .attr("class", "guiRect");
        that.svggranularity.append("text")
            .attr("text-anchor", "end")
            .attr("alignment-baseline", "middle")
            .attr("dominant-baseline", "middle")
            .attr("x", that.boxWidth + that.borderleft - 110)
            .attr("y", that.bordertop / 2)
            .attr("class", "optiontext")
            .text("")
            .html("&plusb;");
        that.offset += 55;
    };


    ContestGUI.prototype.setRenderGranularity = function(renderGranularity){
        if (renderGranularity >= 1000) {
            var digits = Math.log(renderGranularity) * Math.LOG10E | 0;
            var scientific = Math.floor(renderGranularity / Math.pow(10, digits));
            that.svggranularity.select("text")
                .text("" + scientific + "e" + digits)
                .html("&plusb; " + scientific + "e" + digits);

        } else {
            that.svggranularity.select("text")
                .text("" + renderGranularity)
                .html("&plusb; " + renderGranularity)
        }
    };


// FORCE PAN
    ContestGUI.prototype.buttonForcePan = function () {
        var panoffset = that.offset;
        // KEY BINDING
        var key = 'T';
        var f = this.toggleForcePan;
        this.registerKeyBinding(key, f);

        that.svgforcepan = that.svgc.append("g")
            .attr("id", "forcepan")
            .on("click", function () {
                f.call(that);
            })
            .on("mouseover", function () {
                that.tooltip("Toggle Pan Mode [" + key + "]", panoffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgforcepan.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        var panicon = that.svgforcepan.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "0 0 32 32");
        panicon.append("path")
            .attr("d", "M32 0h-13l5 5-6 6 3 3 6-6 5 5z")
            .attr("transform", "translate(16,16) rotate(45) scale(0.7) translate(-16,-16)");
        panicon.append("path")
            .attr("d", "M32 32v-13l-5 5-6-6-3 3 6 6-5 5z")
            .attr("transform", "translate(16,16) rotate(45) scale(0.7) translate(-16,-16)");
        panicon.append("path")
            .attr("d", "M0 32h13l-5-5 6-6-3-3-6 6-5-5")
            .attr("transform", "translate(16,16) rotate(45) scale(0.7) translate(-16,-16)");
        panicon.append("path")
            .attr("d", "M0 0v13l5-5 6 6 3-3-6-6 5-5z")
            .attr("transform", "translate(16,16) rotate(45) scale(0.7) translate(-16,-16)");
        that.svgforcepan.append("image")
            .attr("class", "icon")
            .classed("disabled", function () {
                return !that.forcepan;
            })
            .attr("id", "toggled")
            .attr("x", that.borderleft + panoffset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("xlink:href", "icons/shadow.svg");
    };


// OPEN FILE
    ContestGUI.prototype.buttonOpenFile = function () {
        var openoffset = that.offset;
        // KEY BINDING
        var key = 'O';
        var f = this.loadFromPC;
        this.registerKeyBinding(key, f);
        that.svgopen = that.svgc.append("g")
            .attr("id", "open")
            .on("click", function () {
                f.call(that);
            })
            .on("mouseover", function () {
                that.tooltip("Open File [" + key + "]", openoffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgopen.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        that.svgopen.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "0 0 32 32")
            .append("path")
            .attr("d", "M26 30l6-16h-26l-6 16zM4 12l-4 18v-26h9l4 4h13v4z");
    };

    ContestGUI.prototype.loadFromPC = function () {
        var input = document.createElement('input');
        input.type = 'file';
        input.addEventListener('change', this.graphGeneration.readSingleFile, false);
        input.click();
    };


// SAVE FILE
    ContestGUI.prototype.buttonSaveFile = function () {
        var saveoffset = that.offset;
        // KEY BINDING
        var key = 'S';
        var f = this.graphGeneration.save;
        this.registerKeyBinding(key, f);
        that.svgsave = that.svgc.append("g")
            .attr("id", "open")
            .on("click", function () {
                f.call(that);
            })
            .on("mouseover", function () {
                that.tooltip("Save File [" + key + "]", saveoffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgsave.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        that.svgsave.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "0 0 32 32 ")
            .append("path")
            .attr("d", "M28 0h-28v32h32v-28l-4-4zM16 4h4v8h-4v-8zM28 28h-24v-24h2v10h18v-10h2.343l1.657 1.657v22.343z");
    };


// COPY GRAPH
    ContestGUI.prototype.buttonCopyGraph = function () {
        var copyoffset = that.offset;
        // KEY BINDING
        var key = 'C';
        var f = this.copyGraph;
        this.registerKeyBinding(key, f);
        that.svgcopy = that.svgc.append("g")
            .attr("id", "copy")
            .on("click", function () {
                f.call(that);
            })
            .on("mouseover", function () {
                that.tooltip("Copy Graph String [" + key + "]", copyoffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgcopy.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        that.svgcopy.append("svg")
            .attr("class", "iconFat")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "-1 -1 33 33")
            .append("path")
            .attr("d", "M20 8v-8h-14l-6 6v18h12v8h20v-24h-12zM6 2.828v3.172h-3.172l3.172-3.172zM2 22v-14h6v-6h10v6l-6 6v8h-10zM18 10.828v3.172h-3.172l3.172-3.172zM30 30h-16v-14h6v-6h10v20z");
    };


// PASTE GRAPH
    ContestGUI.prototype.buttonPasteGraph = function () {
        var pasteoffset = that.offset;
        // KEY BINDING
        var key = 'V';
        var f = this.pasteGraph;
        this.registerKeyBinding(key, f);
        that.svgpaste = that.svgc.append("g")
            .attr("id", "open")
            .on("click", function () {
                f.call(that);
            })
            .on("mouseover", function () {
                that.tooltip("Paste Graph String [" + key + "]", pasteoffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgpaste.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        that.svgpaste.append("svg")
            .attr("class", "iconFat")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "-1 -1 33 33")
            .append("path")
            .attr("d", "M22 4h-4v-2c0-1.1-0.9-2-2-2h-4c-1.1 0-2 0.9-2 2v2h-4v4h16v-4zM16 4h-4v-1.996c0.001-0.001 0.002-0.002 0.004-0.004h3.993c0.001 0.001 0.003 0.002 0.004 0.004v1.996zM26 10v-5c0-0.55-0.45-1-1-1h-2v2h1v4h-6l-6 6v8h-8v-18h1v-2h-2c-0.55 0-1 0.45-1 1v20c0 0.55 0.45 1 1 1h9v6h20v-22h-6zM18 12.828v3.172h-3.172l3.172-3.172zM30 30h-16v-12h6v-6h10v18z");
    };


// LOAD FROM SERVER
    ContestGUI.prototype.syncWithDB = function () {
        // KEY BINDING
        var key = "L";
        var f = this.loadFromDB;
        this.registerKeyBinding(key, f);
        that.dropdowncat = that.svgc.append("g")
            .attr("class", "dropdown")
            .attr("id", "dropdowncat");
        that.select = that.dropdowncat.append("g")
            .attr("class", "select");
        that.select.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.catdropdownwidth)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");

        that.catList = document.getElementById("list-categories").innerHTML.trim().split(";");
        if (!that.catList || that.catList.length === 0) {
            that.catList = ["no categories"];
        }

        that.select.append("text")
            .attr("class", "optiontext")
            .attr("x", that.borderleft + that.offset + 5)
            .attr("y", that.bordertop / 2)
            .attr("alignment-baseline", "middle")
            .attr("dominant-baseline", "middle")
            .attr("id", "catdropdown")
            .text(that.catList[0]);
        that.selectedCategory = that.catList[0];

        var catOptions = that.dropdowncat.selectAll(".myBars")
            .data(that.catList)
            .enter()
            .append("g");

        catOptions.attr("class", "option")
            .on("click", function () {
                that.selectedCategory = this.getElementsByTagName("text")[0].innerHTML;
                document.getElementById("catdropdown").innerHTML = that.selectedCategory;
                that.takeValues();
                d3.event.stopPropagation();
            });
        catOptions.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", function (d, i) {
                return ((that.bordertop + that.iconrectsize) / 2 + i * that.iconrectsize)
            })
            .attr("class", "guiRectClickable")
            .attr("width", that.catdropdownwidth)
            .attr("height", that.iconrectsize);

        catOptions.append("text")
            .attr("class", "optiontext")
            .attr("x", that.borderleft + that.offset + 5)
            .attr("y", function (d, i) {
                return that.bordertop / 2 + that.iconrectsize + i * that.iconrectsize
            })
            .attr("alignment-baseline", "middle")
            .attr("dominant-baseline", "middle")
            .text(function (d) {
                return d;
            });
        that.dropdowncat.append("line")
            .attr("class", "dropdownline")
            .attr("x1", that.borderleft + that.offset)
            .attr("y1", (that.bordertop + that.iconrectsize) / 2)
            .attr("x2", that.borderleft + that.offset + that.catdropdownwidth)
            .attr("y2", (that.bordertop + that.iconrectsize) / 2);
        that.offset += that.catdropdownwidth;



        that.dropdownprob = that.svgc.append("g")
            .attr("class", "dropdown")
            .attr("id", "dropdownprob");
        that.selectProb = that.dropdownprob.append("g")
            .attr("class", "select");
        that.selectProb.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.probdropdownwidth)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        that.selectProb.append("text")
            .attr("class", "optiontext")
            .attr("x", that.borderleft + that.offset + 5)
            .attr("y", that.bordertop / 2)
            .attr("alignment-baseline", "middle")
            .attr("dominant-baseline", "middle")
            .attr("id", "probdropdown");

        that.proboffset = that.offset;
        that.dropdownprob.append("line")
            .attr("class", "dropdownline")
            .attr("x1", that.borderleft + that.offset)
            .attr("y1", (that.bordertop + that.iconrectsize) / 2)
            .attr("x2", that.borderleft + that.offset + that.probdropdownwidth)
            .attr("y2", (that.bordertop + that.iconrectsize) / 2);
        that.offset += that.probdropdownwidth;



        that.loadoffset = that.offset;
        that.svgload = that.svgc.append("g")
            .attr("id", "load")
            .on("click", f)
            .on("mouseover", function () {
                that.tooltip("Load from Server [" + key + "]", that.loadoffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });

        that.svgload.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        var loadicon = that.svgload.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "-1 -1 34 34");
        loadicon.append("path")
            .attr("d", "M16 18l8-8h-6v-8h-4v8h-6zM23.273 14.727l-2.242 2.242 8.128 3.031-13.158 4.907-13.158-4.907 8.127-3.031-2.242-2.242-8.727 3.273v8l16 6 16-6v-8z");
        that.offset += that.iconrectsize;


        // KEY BINDING
        var pushkey = "K";
        var g = this.submitToDB;
        this.registerKeyBinding(pushkey, g);
        that.submitoffset = that.offset;
        that.svgsubmit = that.svgc.append("g")
            .attr("id", "submit")
            .on("click", g)
            .on("mouseover", function () {
                that.tooltip("Submit To Server [" + pushkey + "]", that.submitoffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgsubmit.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        var pushicon = that.svgsubmit.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "-1 -1 34 34");
        pushicon.append("path")
            .attr("d", "M14 18h4v-8h6l-8-8-8 8h6zM20 13.5v3.085l9.158 3.415-13.158 4.907-13.158-4.907 9.158-3.415v-3.085l-12 4.5v8l16 6 16-6v-8z");
    };

    ContestGUI.prototype.updateProblemDropdown = function() {
        that.dropdownprob.selectAll(".option")
            .remove();
        var probOptions = that.dropdownprob.selectAll(".myBars")
            .data(that.problemList)
            .enter()
            .append("g");
        that.selectProb.select("text").text(that.problemList[0]);
        that.selectedProblem = that.problemList[0];

        probOptions.attr("class", "option")
            .on("click", function () {
                that.selectedProblem = this.getElementsByTagName("text")[0].innerHTML;
                document.getElementById("probdropdown").innerHTML = that.selectedProblem;
                d3.event.stopPropagation();
            });
        probOptions.append("rect")
            .attr("x", that.borderleft + that.proboffset)
            .attr("y", function (d, i) {
                return ((that.bordertop + that.iconrectsize) / 2 + i * that.iconrectsize)
            })
            .attr("class", function(d) {
                if (!d.includes(":")) {
                    return "guiRectClickable";
                } else {
                    var q = d.split(":")[1];
                    if (q.charAt(0) === "-") {
                        return "guiRectClickable fillLightRed";
                    } else {
                        return "guiRectClickable fillLightGreen";
                    }
                }
            })
            .attr("width", that.probdropdownwidth)
            .attr("height", that.iconrectsize);

        probOptions.append("text")
            .attr("class", "optiontext")
            .attr("x", that.borderleft + that.proboffset + 5)
            .attr("y", function (d, i) {
                return that.bordertop / 2 + that.iconrectsize + i * that.iconrectsize
            })
            .attr("alignment-baseline", "middle")
            .attr("dominant-baseline", "middle")
            .text(function (d) {
                return d;
            });
    };

    ContestGUI.prototype.loadFromServer = function () {
        d3.text("data/" + that.selectedFile).then(function (text) {
            that.graphGeneration.load(text);
        });
    };


// LOAD FROM SERVER
    ContestGUI.prototype.buttonLoadFromServer = function () {
        // KEY BINDING
        var key = "L";
        var f = this.loadFromServer;
        this.registerKeyBinding(key, f);
        that.dropdown = that.svgc.append("g")
            .attr("class", "dropdown");
        that.select = that.dropdown.append("g")
            .attr("class", "select");
        that.select.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.catdropdownwidth)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");

        // have to save offset because of asynchronous ajax
        var serverloadoffset = that.offset;
        d3.json("https://jacoblmiller.github.io/gd-contest-files/files.json")
            .then(function (data) {
                var jsonfiles = data.files;
                that.select.append("text")
                    .attr("class", "optiontext")
                    .attr("x", that.borderleft + serverloadoffset + 5)
                    .attr("y", that.bordertop / 2)
                    .attr("alignment-baseline", "middle")
                    .attr("dominant-baseline", "middle")
                    .attr("id", "mydropdown")
                    .text(jsonfiles[0].name);
                that.selectedFile = jsonfiles[0].name;

                var options = that.dropdown.selectAll(".myBars")
                    .data(jsonfiles)
                    .enter()
                    .append("g");

                options.attr("class", "option")
                    .on("click", function () {
                        document.getElementById("mydropdown").innerHTML = this.getElementsByTagName("text")[0].innerHTML;
                        that.selectedFile = this.getElementsByTagName("text")[0].innerHTML;
                        d3.event.stopPropagation();
                    });
                options.append("rect")
                    .attr("x", that.borderleft + serverloadoffset)
                    .attr("y", function (d, i) {
                        return ((that.bordertop + that.iconrectsize) / 2 + i * that.iconrectsize)
                    })
                    .attr("class", "guiRectClickable")
                    .attr("width", that.catdropdownwidth)
                    .attr("height", that.iconrectsize);

                options.append("text")
                    .attr("class", "optiontext")
                    .attr("x", that.borderleft + serverloadoffset + 5)
                    .attr("y", function (d, i) {
                        return that.bordertop / 2 + that.iconrectsize + i * that.iconrectsize
                    })
                    .attr("alignment-baseline", "middle")
                    .attr("dominant-baseline", "middle")
                    .text(function (d) {
                        return d.name
                    });
                that.dropdown.append("line")
                    .attr("class", "dropdownline")
                    .attr("x1", that.borderleft + serverloadoffset)
                    .attr("y1", (that.bordertop + that.iconrectsize) / 2)
                    .attr("x2", that.borderleft + serverloadoffset + that.catdropdownwidth)
                    .attr("y2", (that.bordertop + that.iconrectsize) / 2);
            })
            .catch(function (error) {
                console.log(error);
            });
        that.offset += that.catdropdownwidth;

        var loadoffset = that.offset;
        that.svgload = that.svgc.append("g")
            .attr("id", "load")
            .on("click", f)
            .on("mouseover", function () {
                that.tooltip("Load from Server [" + key + "]", loadoffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgload.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        var loadicon = that.svgload.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "-1 -1 34 34");
        loadicon.append("path")
            .attr("d", "M16 0c-8.837 0-16 2.239-16 5v4c0 2.761 7.163 5 16 5s16-2.239 16-5v-4c0-2.761-7.163-5-16-5z");
        loadicon.append("path")
            .attr("d", "M16 17c-8.837 0-16-2.239-16-5v6c0 2.761 7.163 5 16 5s16-2.239 16-5v-6c0 2.761-7.163 5-16 5z");
        loadicon.append("path")
            .attr("d", "M16 26c-8.837 0-16-2.239-16-5v6c0 2.761 7.163 5 16 5s16-2.239 16-5v-6c0 2.761-7.163 5-16 5z");
    };

    ContestGUI.prototype.loadFromServer = function () {
        console.log(that.selectedFile);
        d3.text("https://jacoblmiller.github.io/gd-contest-files/" + that.selectedFile).then(function (text) {
            that.graphGeneration.load(text);
        });
    };

    ContestGUI.prototype.loadFromDB = function () {
        var url = "tool-graph.jsp?category-selected=" + that.selectedCategory + "&problem-selected=" + that.selectedProblem;
        d3Fetch.text(url)
            .then(function(response) {
            // Now use response to do some d3 magic
            var graph = response.trim();
            that.graphGeneration.load(graph);
        });
    };

    ContestGUI.prototype.submitToDB = function () {
        var problemid = that.selectedProblem.split("")[0];
        var url = "/SubmitToolServlet";
        var data = {
            "category" : that.selectedCategory,
            "problem" : problemid,
            "graph" : that.graphGeneration.createText()};
        d3Fetch.text(url,
            {method:"POST",
                headers:{
                    "Content-type": "application/json; charset=UTF-8"},
                body:JSON.stringify(data),
            })
            .then(function(response) {
            // Now use response to do some d3 magic
            d3.select("#updateText").text(response.trim())
                .style("opacity", 0)
                .transition()
                .duration(500)
                .style("opacity", 1)
                .transition()
                .duration(5000)
                .style("opacity", 0);
            if (response.includes("successfully"))
                that.submittedSolution();
        });




        // var url = "/SubmitToolServlet" +
        //     "?category=" + that.selectedCategory +
        //     "&problem=" + problemid +
        //     "&graph=" + that.graphGeneration.createText();
        // d3Request.request(url, function(error, response) {
        //     // Now use response to do some d3 magic
        //     d3.select("#updateText").text(response.response.trim())
        //         .style("opacity", 0)
        //         .transition()
        //         .duration(500)
        //         .style("opacity", 1)
        //         .transition()
        //         .duration(5000)
        //         .style("opacity", 0);
        //     if (response.response.includes("successfully"))
        //         that.submittedSolution();
        // }).post();
            //.header("Content-Type", "application/json")
            //.post(JSON.stringify(data));
    };

// UNDO BUTTON
    ContestGUI.prototype.buttonUndo = function () {
        var undooffset = that.offset;
        // KEY BINDING
        var key = 'Z';
        var f = function () {
            that.graphLayout.undo();
        };
        this.registerKeyBinding(key, f);
        that.svgundo = that.svgc.append("g")
            .attr("id", "undo")
            .on("click", function () {
                f.call(that);
                that.removeTooltip();
                if (!that.graphLayout.graph || !that.graphLayout.graph.undo || that.graphLayout.graph.undo.length === 0)
                    that.tooltip("Undo [" + key + "]", undooffset);
                else
                    that.tooltip("Undo (" + that.graphLayout.graph.undo.length + ") [" + key + "]", undooffset);
            })
            .on("mouseover", function () {
                if (!that.graphLayout.graph || !that.graphLayout.graph.undo || that.graphLayout.graph.undo.length === 0)
                    that.tooltip("Undo [" + key + "]", undooffset);
                else
                    that.tooltip("Undo (" + that.graphLayout.graph.undo.length + ") [" + key + "]", undooffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgundo.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", function() {
                if (that.graphLayout.graph && that.graphLayout.graph.undo && that.graphLayout.graph.undo.length > 1)
                    return "guiRectClickable";
                else
                    return "guiRectInactive";
            });
        that.svgundo.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "0 0 32 32")
            .append("path")
            .attr("d", "M23.808 32c3.554-6.439 4.153-16.26-9.808-15.932v7.932l-12-12 12-12v7.762c16.718-0.436 18.58 14.757 9.808 24.238z");
    };


    ContestGUI.prototype.setUndo = function(bool) {
        if (bool) {
            this.svgundo.select("rect").attr("class", "guiRectClickable");
        } else {
            this.svgundo.select("rect").attr("class", "guiRectInactive");
        }
    };


// REDO BUTTON
    ContestGUI.prototype.buttonRedo = function () {
        var redooffset = that.offset;
        // KEY BINDING
        var key = 'Y';
        var f = function () {
            that.graphLayout.redo();
        };
        this.registerKeyBinding(key, f);
        that.svgredo = that.svgc.append("g")
            .attr("id", "redo")
            .on("click", function () {
                f.call(that);
                that.removeTooltip();
                if (!that.graphLayout.graph || !that.graphLayout.graph.redo || that.graphLayout.graph.redo.length === 0)
                    that.tooltip("Redo [" + key + "]", redooffset);
                else
                    that.tooltip("Redo (" + that.graph.redo.length + ") [" + key + "]", redooffset);
            })
            .on("mouseover", function () {
                if (!that.graphLayout.graph || !that.graphLayout.graph.redo || that.graphLayout.graph.redo.length === 0)
                    that.tooltip("Redo [" + key + "]", redooffset);
                else
                    that.tooltip("Redo (" + that.graphLayout.graph.redo.length + ") [" + key + "]", redooffset);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgredo.append("rect")
            .attr("x", that.borderleft + that.offset)
            .attr("y", (that.bordertop - that.iconrectsize) / 2)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", function() {
                if (that.graphLayout.graph && that.graphLayout.graph.redo && that.graphLayout.graph.redo.length > 1)
                    return "guiRectClickable";
                else
                    return "guiRectInactive";
            });
        that.svgredo.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + (that.iconrectsize - that.iconsize) / 2 + that.offset)
            .attr("y", (that.bordertop - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "0 0 32 32")
            .append("path")
            .attr("d", "M18 7.762v-7.762l12 12-12 12v-7.932c-13.961-0.328-13.362 9.493-9.808 15.932-8.772-9.482-6.909-24.674 9.808-24.238z");
    };


    ContestGUI.prototype.setRedo = function(bool) {
        if (bool) {
            this.svgredo.select("rect").attr("class", "guiRectClickable");
        } else {
            this.svgredo.select("rect").attr("class", "guiRectInactive");
        }
    };

    ContestGUI.prototype.toggleForcePan = function () {
        that.forcepan = !that.forcepan;
        this.graphLayout.forcepan = that.forcepan;
        // svgforcepan.select("#toggled")
        //     .classed("disabled",function() {
        //         return !forcepan;
        //     });
        if (that.forcepan)
            that.svgforcepan.select("rect")
                .attr("class", "guiRectToggled");
        else
            that.svgforcepan.select("rect")
                .attr("class", "guiRectClickable");
    };

    ContestGUI.prototype.shadow = function () {
        var defs = that.svgc.append("defs");
        var filter = defs.append("filter")
            .attr("id", "drop-shadow")
            .attr("height", "130%");
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 5)
            .attr("result", "blur");
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 5)
            .attr("dy", 5)
            .attr("result", "offsetBlur");
        var feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur");
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");

        filter = defs.append("filter")
            .attr("id", "small-shadow")
            .attr("height", "130%");
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 1)
            .attr("result", "blur");
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 1)
            .attr("dy", 1)
            .attr("result", "offsetBlur");
        feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur");
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");

        filter = defs.append("filter")
            .attr("id", "toggle-shadow")
            .attr("height", "130%");
        filter.append("feGaussianBlur")
            .attr("stdDeviation", 2)
            .attr("result", "blur");
        filter.append("feOffset")
            .attr("dx", 2)
            .attr("dy", 2)
            .attr("result", "offsetBlur");
        filter.append("feComposite")
            .attr("in", "offsetBlur")
            .attr("operator", "in");
        filter.append("feComposite")
            .attr("in", "SourceAlpha")
            .attr("operator", "in");
        feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in", "SourceAlpha");
        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur");

        that.svgborder.style("filter", "url(#drop-shadow)");
        // rect.style("filter","url(#small-shadow)");
    };

    ContestGUI.prototype.zoomSlider = function () {
        // SLIDER
        that.svgzoomslider = that.svgc.append("g")
            .attr("id", "zoomslider")
            .attr("class", "slider")
            .attr("transform",
                "translate(" + (that.borderleft + that.boxWidth + that.borderright / 2) + ","
                + (that.bordertop + that.iconrectsize + that.zoomslidergap) + ")");

        that.zoomscale = d3.scaleLinear()
            .domain([1, 0])
            .range([0, that.zoomsliderheight])
            .clamp(true);

        that.svgzoomslider.append("line")
            .attr("class", "track")
            .attr("y1", that.zoomsliderheight)
            .attr("y2", 0)
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-inset")
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-overlay")
            .call(d3.drag()
                .on("start.interrupt", function () {
                    that.svgzoomslider.interrupt();
                })
                .on("start drag", function () {
                    that.graphLayout.zoomTo(that.zoomscale.invert(d3.event.y));
                }));

        that.zoomhandle = that.svgzoomslider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", 9);
        // ZOOM IN
        var inkey = '+';
        var inf = this.graphLayout.zoomIn;
        this.registerKeyBinding(inkey, inf);
        that.svgzoomin = that.svgc.append("g")
            .attr("id", "zoomin")
            .on("click", inf)
            .on("mouseover", function () {
                that.tooltip("Zoom In [" + inkey + "]", that.boxWidth, 0);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgzoomin.append("rect")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconrectsize) / 2)
            .attr("y", that.bordertop)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        that.svgzoomin.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconsize) / 2)
            .attr("y", that.bordertop + (that.iconrectsize - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "0 0 32 32")
            .append("path")
            .attr("d", "M31.008 27.231l-7.58-6.447c-0.784-0.705-1.622-1.029-2.299-0.998 1.789-2.096 2.87-4.815 2.87-7.787 0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12c2.972 0 5.691-1.081 7.787-2.87-0.031 0.677 0.293 1.515 0.998 2.299l6.447 7.58c1.104 1.226 2.907 1.33 4.007 0.23s0.997-2.903-0.23-4.007zM12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zM14 6h-4v4h-4v4h4v4h4v-4h4v-4h-4z");


        // ZOOM OUT
        var key = '-';
        var f = this.graphLayout.zoomOut;
        this.registerKeyBinding(key, f);
        that.svgzoomout = that.svgc.append("g")
            .attr("id", "zoomout")
            .on("click", f)
            .on("mouseover", function () {
                that.tooltip("Zoom Out [" + key + "]", that.boxWidth, that.iconrectsize + that.zoomsliderheight + 2 * that.zoomslidergap);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgzoomout.append("rect")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconrectsize) / 2)
            .attr("y", that.bordertop + that.iconrectsize + that.zoomsliderheight + 2 * that.zoomslidergap)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        that.svgzoomout.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconsize) / 2)
            .attr("y", that.bordertop + that.iconrectsize + that.zoomsliderheight + 2 * that.zoomslidergap + (that.iconrectsize - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "0 0 32 32")
            .append("path")
            .attr("d", "M31.008 27.231l-7.58-6.447c-0.784-0.705-1.622-1.029-2.299-0.998 1.789-2.096 2.87-4.815 2.87-7.787 0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12c2.972 0 5.691-1.081 7.787-2.87-0.031 0.677 0.293 1.515 0.998 2.299l6.447 7.58c1.104 1.226 2.907 1.33 4.007 0.23s0.997-2.903-0.23-4.007zM12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zM6 10h12v4h-12z");
    };

    ContestGUI.prototype.updateZoomSlider = function() {
        that.maxzoomslider = that.graphLayout.getMaxZoomSlider();
        that.zoomscale = d3.scaleLinear()
            .domain([that.maxzoomslider, 0])
            .range([0, that.zoomsliderheight])
            .clamp(true);
        that.zoomhandle.attr("cy", that.zoomscale(that.graphLayout.getCurrZoomSlider()));
    };

    // CENTER BUTTON
    ContestGUI.prototype.buttonCenter = function () {
        // KEY BINDING
        var key = 'X';
        var f = function () {
            that.graphLayout.centerAndUpdate();
        };
        that.registerKeyBinding(key, f);
        that.svgcenter = that.svgc.append("g")
            .attr("id", "center")
            .on("click", function () {
                f.call(that);
            })
            .on("mouseover", function () {
                that.tooltip("Center Graph [" + key + "]", that.boxWidth, 2 * that.iconrectsize + that.zoomsliderheight + 2 * that.zoomslidergap + 5);
            })
            .on("mouseout", function () {
                that.removeTooltip();
            });
        that.svgcenter.append("rect")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconrectsize) / 2)
            .attr("y", that.bordertop + 2 * that.iconrectsize + that.zoomsliderheight + 2 * that.zoomslidergap + 5)
            .attr("width", that.iconrectsize)
            .attr("height", that.iconrectsize)
            .attr("class", "guiRectClickable");
        var centersvg = that.svgcenter.append("svg")
            .attr("class", "icon")
            .attr("x", that.borderleft + that.boxWidth + (that.borderright - that.iconsize) / 2)
            .attr("y", that.bordertop + 2 * that.iconrectsize + that.zoomsliderheight + 2 * that.zoomslidergap + 5 + (that.iconrectsize - that.iconsize) / 2)
            .attr("width", that.iconsize)
            .attr("height", that.iconsize)
            .attr("viewBox", "0 0 492.589 492.589");
        centersvg.append("path")
            .attr("d", "M468.467,222.168h-28.329c-9.712-89.679-80.46-161.18-169.71-172.258V24.135c0-13.338-10.791-24.134-24.134-24.134 c-13.311,0-24.117,10.796-24.117,24.134V49.91C132.924,60.988,62.177,132.488,52.482,222.168H24.153 C10.806,222.168,0,232.964,0,246.286c0,13.336,10.806,24.132,24.153,24.132h29.228c12.192,86.816,81.551,155.4,168.797,166.229 v31.804c0,13.336,10.806,24.135,24.117,24.135c13.343,0,24.134-10.799,24.134-24.135v-31.804 c87.228-10.829,156.607-79.413,168.775-166.229h29.264c13.33,0,24.122-10.796,24.122-24.132 C492.589,232.964,481.797,222.168,468.467,222.168z M246.294,398.093c-85.345,0-154.804-69.453-154.804-154.813 c0-85.363,69.459-154.813,154.804-154.813c85.376,0,154.823,69.45,154.823,154.813 C401.117,328.639,331.671,398.093,246.294,398.093z");
        centersvg.append("path")
            .attr("d", "M246.294,176.93c-36.628,0-66.34,29.704-66.34,66.349c0,36.635,29.711,66.349,66.34,66.349 c36.66,0,66.34-29.713,66.34-66.349C312.634,206.635,282.955,176.93,246.294,176.93z");
    };

    ContestGUI.prototype.radiusSlider = function () {
        // SLIDER
        that.svgradiusslider = that.svgc.append("g")
            .attr("id", "radiusslider")
            .attr("class", "slider")
            .attr("transform",
                "translate(" + (that.borderleft + that.bottomoffset + that.radiussmalliconsize + that.radiusslidergap) + ","
                + (that.bordertop + that.boxHeight + that.borderbot / 2) + ")");

        that.radiusscale = d3.scaleLinear()
            .domain([2, that.maxradius])
            .range([0, that.radiussliderwidth])
            .clamp(true);

        that.svgradiusslider.append("line")
            .attr("class", "track")
            .attr("x1", 0)
            .attr("x2", that.radiussliderwidth)
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-inset")
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-overlay")
            .call(d3.drag()
                .on("start.interrupt", function () {
                    that.svgradiusslider.interrupt();
                })
                .on("start drag", function () {
                    that.graphLayout.setRadius(that.radiusscale.invert(d3.event.x))
                }));

        that.radiushandle = that.svgradiusslider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", 9);
        this.updateRadiusSlider();
        that.svgradiusslider.append("circle")
            .attr("class", "node")
            .attr("r", 3)
            .attr("style", "stroke-width: 1.6px")
            .attr("cx", -that.radiussmalliconsize / 2 - that.radiusslidergap);
        that.svgradiusslider.append("circle")
            .attr("class", "node")
            .attr("r", 10)
            .attr("style", "stroke-width: 1.6px")
            .attr("cx", that.radiuslargeiconsize / 2 + that.radiusslidergap + that.radiussliderwidth);
        that.bottomoffset += that.radiussmalliconsize + that.radiuslargeiconsize + 2 * that.radiusslidergap + that.radiussliderwidth + that.betweenslidergap;
    };

    ContestGUI.prototype.updateRadiusSlider = function () {
        that.radiushandle.attr("cx", that.radiusscale(this.graphLayout.noderad));
    };



    ContestGUI.prototype.arrowSlider = function () {
        // SLIDER
        that.svgarrowslider = that.svgc.append("g")
            .attr("id", "arrowslider")
            .attr("class", "slider")
            .attr("transform",
                "translate(" + (that.borderleft + that.bottomoffset + that.arrowsmalliconsize + that.arrowslidergap) + ","
                + (that.bordertop + that.boxHeight + that.borderbot / 2) + ")");

        that.arrowscale = d3.scaleLinear()
            .domain([2, 5])
            .range([0, that.arrowsliderwidth])
            .clamp(true);

        that.svgarrowslider.append("line")
            .attr("class", "track")
            .attr("x1", 0)
            .attr("x2", that.arrowsliderwidth)
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-inset")
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-overlay")
            .call(d3.drag()
                .on("start.interrupt", function () {
                    that.svgarrowslider.interrupt();
                })
                .on("start drag", function () {
                    that.graphLayout.setArrowSize(that.arrowscale.invert(d3.event.x))
                }));

        that.arrowhandle = that.svgarrowslider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", 9);
        this.updateArrowSlider();
        that.svgarrowslider.append("path")
            .attr("d","M0,-2 V2 L6,0 Z")
            .attr("style", "stroke-width: 1.6px")
            .attr("transform", function() {
                var s = that.arrowsmalliconsize / 5;
                var o = - that.arrowsmalliconsize - that.arrowslidergap;
                return "translate(" + o + ",0) scale(" + s + ") ";
            });
        that.svgarrowslider.append("path")
            .attr("d","M0,-2 V2 L6,0 Z")
            .attr("style", "stroke-width: 1.6px")
            .attr("transform", function() {
                var s = that.arrowlargeiconsize / 5;
                var o = that.arrowslidergap + that.arrowsliderwidth;
                return "translate(" + o + ",0) scale(" + s + ") ";
            });
    };

    ContestGUI.prototype.updateArrowSlider = function () {
        that.arrowhandle.attr("cx", that.arrowscale(this.graphLayout.arrowsize));
    };

    ContestGUI.prototype.translateKeyBindings = function () {
        // left
        this.registerKeyDownBinding("ArrowLeft", function () {
            that.graphLayout.translate(-1, 0)
        });
        // up
        this.registerKeyDownBinding("ArrowUp", function () {
            that.graphLayout.translate(0, -1)
        });
        // right
        this.registerKeyDownBinding("ArrowRight", function () {
            that.graphLayout.translate(1, 0)
        });
        // down
        this.registerKeyDownBinding("ArrowDown", function () {
            that.graphLayout.translate(0, 1)
        });
    };

    ContestGUI.prototype.takeValues = function(){
        var url = "tool-return.jsp?category-selected=" + that.selectedCategory;
        d3Fetch.text(url)
            .then(function(response) {
            // Now use response to do some d3 magic
            that.problemList = response.trim().split(";");
            that.updateProblemDropdown();
        });
    };

    ContestGUI.prototype.submittedSolution = function(){
        var url = "tool-return.jsp?category-selected=" + that.selectedCategory;
        d3Fetch.text(url)
            .then(function( response) {
            // Now use response to do some d3 magic
            var problemnow = that.selectedProblem;
            that.problemList = response.trim().split(";");
            that.updateProblemDropdown();
            that.problemList.forEach(function(p) {
                if (problemnow.split(":")[0] === p.split(":")[0])
                    problemnow = p;
            });
            that.selectedProblem = problemnow;
            document.getElementById("probdropdown").innerHTML = that.selectedProblem;
        });
    };

    return ContestGUI;
});