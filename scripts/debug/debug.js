define(function() {
    function Debug() {
        this.debug = null
    };

    Debug.prototype.setDebug = function (id) {
        this.debug = document.getElementById(id);
    };

    Debug.prototype.clearDebug = function () {
        if (!this.debug)
            return;
        this.debug.innerHTML = "";
    };

    Debug.prototype.addDebug = function (line) {
        if (!this.debug)
            return;
        this.debug.appendChild(document.createTextNode(line));
        this.debug.appendChild(document.createElement("br"));
        return line + "\n";
    };

    Debug.prototype.addDebugHTML = function (line) {
        if (!this.debug)
            return;
        this.debug.innerHTML += line + "<br/>";
    };

    Debug.prototype.selectDebug = function () {
        if (!this.debug)
            return;
        this.debug.focus();
        var doc = window.document, sel, range;
        if (window.getSelection && doc.createRange) {
            sel = window.getSelection();
            range = doc.createRange();
            range.selectNodeContents(this.debug);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (doc.body.createTextRange) {
            range = doc.body.createTextRange();
            range.moveToElementText(debug);
            range.select();
        }
    };

    return Debug;
});