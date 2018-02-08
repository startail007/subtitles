(function () {
    var _data = {};
    _data.repeat = function () {
        var temp = [];
        var s;
        for (var i = 0; i < this.length; i++) {
            if (s != this[i]) {
                s = this[i];
                temp.push(s);
            }
        }
        return temp;
    }
    _data.range = function (SIndex, EIndex) {
        var temp = [];
        for (var i = SIndex; i < EIndex; i++) {
            temp.push(i);
        }
        return temp;
    }

    parameterConnection(Array.prototype, "repeat", _data, "repeat");
    parameterConnection(Array, "range", _data, "range");
})();

var itemModule = function (itemElement) {
    Module.call(this);
    var itemElement = $(itemElement);
    var _data = {};
    _data.item = [];
    var _this = this;

    function compareNumbers(a, b) {
        return a - b;
    }
    _this.addItem = function (pos, a) {
        for (var i = 0; i < a.length; i++) {
            _data.item.splice(pos + i, 0, a[i]);
            _this.sendUpdateFun("add", pos + i, a[i]);
        }
        console.log(_data.item)
    }
    _this.removeItem = function (a) {
        a.sort(compareNumbers);
        var temp = a.repeat();
        for (var i = 0; i < temp.length; i++) {
            var b = _data.item.splice(temp[i] - i, 1);
            _this.sendUpdateFun("remove", temp[i] - i, b);
        }
    }
    parameterConnection(this, "item", _data, "item", {
        write: false
    });
}
itemModule = extend(itemModule, Module);

var radioModule = function () {
    Module.call(this);
    var _data = {};
    _data.oldIndex = -1;
    _data.index = -1;
    var _this = this;
    parameterConnection(this, "oldIndex", _data, "oldIndex", {
        write: false
    });
    parameterConnection(this, "index", _data, "index", {
        change: function (oldP, newP) {
            var temp = oldP != newP;
            if (temp) {
                _data.oldIndex = oldP;
            }
            return temp;
        },
        writeFun: function (value) {
            _this.sendUpdateFun("change");
        }
    });
}
radioModule = extend(radioModule, Module);


var radioButtonModule = function (radioButtonElement) {
    Module.call(this);
    var radioButtonElement = $(radioButtonElement);
    var _data = {};
    _data.active = false;
    var _this = this;

    var switchButtons01 = radioButtonElement.find(".button").map(function (index, element) {
        var _element = element;
        var switchButton01 = new switchButtonModule(_element);
        switchButton01.updateFun = function (type) {
            var index = radioButtonElement.find(".button").index(_element);
            if (type == "active") {
                radio01.index = index;
            } else if (type == "noActive") {
                if (index == radio01.index) {
                    switchButton01.active = true;
                }
            }
        }
        return switchButton01;
    });

    var radio01 = new radioModule();
    radio01.updateFun = function (type) {
        if (type == "change") {
            if (radio01.oldIndex >= 0) {
                if (switchButtons01[radio01.oldIndex].active) {
                    switchButtons01[radio01.oldIndex].active = false;
                }
                _this.sendUpdateFun("old");
            }
            if (radio01.index >= 0) {
                if (!switchButtons01[radio01.index].active) {
                    switchButtons01[radio01.index].active = true;
                }
                _this.sendUpdateFun("new");
            }
        }
    }

    parameterConnection(this, "index", radio01, "index");

    function init() {
        radio01.index = 0;
    }
    init();
}
radioButtonModule = extend(radioButtonModule, Module);

function timeFormat(seconds) {
    var myDate = new Date();
    myDate.setHours(0, 0, 0, seconds * 1000);
    var h = myDate.getHours();
    var m = myDate.getMinutes();
    var s = myDate.getSeconds();
    var ms = myDate.getMilliseconds();
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s + "." + (ms < 100 ? "0" : "") + (ms < 10 ? "0" : "") + ms;
}

function toTime(str) {
    if (str == undefined) {
        return 0;
    }
    var temp = str.split(":");
    var temp0 = Number(temp[0]) * 60 * 60 + Number(temp[1]) * 60 + Number(temp[2]);
    return Number.isNaN(temp0) ? 0 : temp0;
}

(function ($) {
    $.fn.plural = function (index) {
        var _this = this;
        return $([]).pushStack($.map(index, function (key, value) {
            return _this.get(key);
        }));
    }

    $.fn.pluralRange = function (SIndex, EIndex) {
        var temp = Array.range(SIndex,EIndex);
        return $(this).plural(temp);
    }
})(jQuery);
