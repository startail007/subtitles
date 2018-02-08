function isPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
}

/*function isIE() {
    var b = document.createElement('b')
    b.innerHTML = '<!--[if IE]><i></i><![endif]-->'
    return b.getElementsByTagName('i').length === 1
}*/

function objComparison(defaultObj, obj) {
    var dataObj = {};
    for (var temp in defaultObj) {
        dataObj[temp] = obj[temp] != undefined ? obj[temp] : defaultObj[temp];
    }
    return dataObj;
}

function parameterConnection(Adata, Aparameter, Bdata, Bparameter, objP) {
    var defaultObj = {
        write: true,
        change: false,
        writeFun: undefined,
        replace: undefined
    };
    var Obj = objComparison(defaultObj, objP != undefined ? objP : {});
    Object.defineProperty(Adata, Aparameter, {
        get: function () {
            return Bdata[Bparameter];
        },
        set: function (newValue) {
            var tempWrite = Obj.write.getEx(newValue);
            tempWrite = tempWrite != undefined ? tempWrite : Obj.write;
            if (tempWrite) {
                var tempReplace = Obj.replace != undefined ? Obj.replace.getEx(newValue) : Obj.replace;
                tempReplace = tempReplace != undefined ? tempReplace : newValue;
                var tempChange = Obj.change.getEx(Bdata[Bparameter], tempReplace);
                tempChange = tempChange != undefined ? tempChange : Obj.change;
                if (!tempChange || Bdata[Bparameter] != tempReplace) {
                    Bdata[Bparameter] = tempReplace;
                    if (Obj.writeFun) {
                        Obj.writeFun(Bdata[Bparameter]);
                    }
                }
            }
        },
        enumerable: false
    });
}

(function () {
    var _data = {};
    /*時間轉換字串*/
    _data.toTime = function () {
        function timeFormat(seconds) {
            var m = Math.floor(seconds / 60) < 10 ? "0" + Math.floor(seconds / 60) : Math.floor(seconds / 60);
            var s = Math.floor(seconds - (m * 60)) < 10 ? "0" + Math.floor(seconds - (m * 60)) : Math.floor(seconds - (m * 60));
            return m + ":" + s;
        };
        return timeFormat(this);
    }
    /*多重取得*/
    _data.getEx = function () {
        if (this.constructor == Function) {
            return this.apply(null, arguments);
        } else {
            return this;
        }
    }

    parameterConnection(Object.prototype, "getEx", _data, "getEx");
    parameterConnection(Number.prototype, "toTime", _data, "toTime");

    /*字幕*/
    Object.defineProperty(HTMLVideoElement.prototype, "subtitle", {
        get: function () {
            return this.getAttribute("subtitle") == "" || this.getAttribute("subtitle") == "true";
        },
        set: function (newValue) {
            if (newValue) {
                this.setAttribute("subtitle", "");
            } else {
                this.removeAttribute("subtitle");
            }
        },
        enumerable: false
    });
})();

var rectangle = function (x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    function RectangleLock(rect, rate, align) {
        var bw = rect.width;
        var bh = rect.height;
        var body_rate = bw / bh;
        var bool = body_rate < rate
        var ww, hh;
        if (bool) {
            ww = bw;
            hh = bw / rate;
        } else {
            ww = bh * rate;
            hh = bh;
        }
        return new rectangle(rect.x + (bw - ww) * align.x, rect.y + (bh - hh) * align.y, ww, hh)
    }
    this.lock = function (rate, align) {
        return RectangleLock(this, rate, align);
    }
}

function extend(child, super0) {
    for (var property in super0.prototype) {
        if (typeof child.prototype[property] == "undefined") {
            child.prototype[property] = super0.prototype[property];
        }
    }
    return child;
}

var Module = function () {
    var _data = {};
    _data.updateFun = null;
    var _this = this;

    parameterConnection(this, "updateFun", _data, "updateFun");

    Object.defineProperty(this, "sendUpdateFun", {
        value: function () {
            if (_this.updateFun) {
                _this.updateFun.apply(_this, arguments);
            }
        },
        writable: false,
        enumerable: false
    });

}

//滑桿模組
var slideBarModule = function (slideBarElement) {
    Module.call(this);
    var slideBar = $(slideBarElement);
    var _data = {};
    _data.currentProgress = 0;
    _data.controling = false;
    _data.progress = 0;
    var _this = this;
    var _progressID = 0;
    var _progressEase = 1;

    /*外部連接*/
    parameterConnection(this, "currentProgress", _data, "currentProgress", {
        change: true,
        writeFun: function (value) {
            var temp = Math.max(0, Math.min(1, value));
            setValue();
            clearInterval(_progressID);
            _progressID = setInterval(setValue, 1000 / 60);

            function setValue() {
                if (Math.abs(temp - _data.progress) * slideBar.find(".progressLock").width() <= 1) {
                    _progressEase = 1;
                    _data.progress = temp;
                    clearInterval(_progressID);
                } else {
                    _data.progress += (temp - _data.progress) / _progressEase;
                }
                slideBar.find(".currentLength").css("width", _data.progress * 100 + "%");
                slideBar.find(".progress").css("left", _data.progress * 100 + "%");
                _this.sendUpdateFun("progress");
            }
            _this.sendUpdateFun("currentProgress");
        }
    });

    parameterConnection(this, "controling", _data, "controling", {
        write: false
    });
    parameterConnection(this, "progress", _data, "progress", {
        write: false
    });

    function init() {
        var tempX = 0;
        var tempRate = 0;

        function start(x, bool) {
            tempX = x;
            if (bool) {
                tempRate = (x - slideBar.find(".progressLock").offset().left) / slideBar.find(".progressLock").width();
                _progressEase = Math.max(1, slideBar.find(".progressLock").width() * Math.abs(_this.currentProgress - tempRate) / 40);
                _this.currentProgress = tempRate;
            } else {
                tempRate = _data.currentProgress;
            }
            _this.controling = true;
            _this.sendUpdateFun("dragStart");
        }

        function move(x) {
            if (x != tempX) {
                _progressEase += (1 - _progressEase) / 10;
                var temp = x - tempX;
                _this.currentProgress = Math.max(0, Math.min(1, tempRate + temp / slideBar.find(".progressLock").width()));
                _this.sendUpdateFun("drag");
            }
        }

        function end() {
            _this.controling = false;
            _this.sendUpdateFun("dragStop");
        }

        slideBar.on("touchstart", function (e) {
            if (!isPC()) {
                start(e.originalEvent.touches[0].clientX, e.target != slideBar.find(".progressButton")[0]);
            }
        });
        slideBar.on("touchmove", function (e) {
            if (!isPC()) {
                move(e.originalEvent.touches[0].clientX);
            }
        });
        slideBar.on("touchend", function (e) {
            if (!isPC()) {
                end();
            }
        });
        slideBar.on("mousedown", function (e) {
            if (isPC()) {
                if (e.button == 0) {
                    start(e.pageX, e.target != slideBar.find(".progressButton")[0]);
                    $(window).on("mousemove", mousemove);
                    $(window).on("mouseup", mouseup);
                }
            }

            function mousemove(e) {
                move(e.pageX);
            }

            function mouseup(e) {
                if (e.button == 0) {
                    end();
                    $(window).off("mousemove", mousemove);
                    $(window).off("mouseup", mouseup);
                }
            }
        });
    }
    init();
}
slideBarModule = extend(slideBarModule, Module);

//影片時間模組
var videoTimeModule = function (videoTimeElement) {
    Module.call(this);
    var videoTime = $(videoTimeElement);
    var _data = {};
    _data.currentTime = 0;
    _data.totalTime = 1;
    var _this = this;

    /*外部連接*/
    parameterConnection(this, "currentTime", _data, "currentTime", {
        change: true,
        writeFun: function (value) {
            videoTime.find(".currentTime").html(value.toTime());
            _this.sendUpdateFun("currentTime");
        }
    });

    parameterConnection(this, "totalTime", _data, "totalTime", {
        change: true,
        writeFun: function (value) {
            videoTime.find(".totalTime").html(value.toTime());
            _this.sendUpdateFun("totalTime");
        }
    });
}
videoTimeModule = extend(videoTimeModule, Module);

//按鈕模組
var switchButtonModule = function (switchButtonElement) {
    Module.call(this);
    var switchButton = $(switchButtonElement);
    var _data = {};
    _data.active = false;
    var _this = this;

    /*外部連接*/
    parameterConnection(this, "active", _data, "active", {
        change: true,
        writeFun: function (value) {
            switchButton.ChangeClass("active", value);
            _this.sendUpdateFun("change");
            _this.sendUpdateFun(value ? "active" : "noActive");
        }
    });

    function init() {
        switchButton.click(function (e) {
            _this.active = !_this.active;
        });
    }
    init();
}
switchButtonModule = extend(switchButtonModule, Module);

//影片控制模組
var videoControllerModule = function (mainVideoControllerElement) {
    Module.call(this);
    var mainVideoController = $(mainVideoControllerElement);
    var videoController = mainVideoController.find(".videoController");
    var videoLoading = mainVideoController.find(".videoLoading");
    var videoSubtitleFrame = mainVideoController.find(".videoSubtitleFrame");

    var _data = {};
    _data.hover = false;
    _data.loading = false;
    _data.bufferProgress = 0;
    _data.rect = new rectangle(0, 0, 0, 0);
    _data.show = true;
    _data.subtitleData = [];
    _data.subtitleIndex = -1;
    var _this = this;

    var videoTime01 = new videoTimeModule(videoController.find(".timeGroup")[0]);
    videoTime01.updateFun = function (type) {
        if (type == "currentTime") {
            if (!slideBar01.controling) {
                slideBar01.currentProgress = videoTime01.currentTime / videoTime01.totalTime;
            }
        } else if (type == "totalTime") {
            if (!slideBar01.controling) {
                slideBar01.currentProgress = videoTime01.currentTime / videoTime01.totalTime;
            }
        }
    }

    var playSwitchButton01 = new switchButtonModule(videoController.find(".playButton")[0]);
    playSwitchButton01.updateFun = function (type) {
        if (type == "change") {
            _this.sendUpdateFun(playSwitchButton01.active ? "play" : "pause");
        }
    }

    var muteSwitchButton01 = new switchButtonModule(videoController.find(".muteButton")[0]);
    muteSwitchButton01.updateFun = function (type) {
        if (type == "change") {
            _this.sendUpdateFun(muteSwitchButton01.active ? "mute" : "noMute");
        }
    }

    var subtitleSwitchButton01 = new switchButtonModule(videoController.find(".subtitleButton")[0]);
    subtitleSwitchButton01.updateFun = function (type) {
        if (type == "change") {
            videoSubtitleFrame.ChangeClass("active", subtitleSwitchButton01.active)
            _this.sendUpdateFun(subtitleSwitchButton01.active ? "subtitle" : "noSubtitle");
        }
    }

    var count = 0;
    var setTimeoutIndex;

    function prevent(fun) {
        count++
        if (count < 3) {
            fun();
        }
        clearTimeout(setTimeoutIndex);
        setTimeoutIndex = setTimeout(function () {
            count = 0;
        }, 300);
    }
    var currentSubtitleKey = -1;

    function getSubtitleIndex(_timecodeSubtitle, time) {
        if (_timecodeSubtitle.length > 0) {
            for (var i = _timecodeSubtitle.length - 1; i >= 0; i--) {
                var len;
                if (i + 1 < _timecodeSubtitle.length) {
                    len = _timecodeSubtitle[i + 1].time - _timecodeSubtitle[i].time;
                    if (_timecodeSubtitle[i].len) {
                        len = _timecodeSubtitle[i].len <= len ? _timecodeSubtitle[i].len : len
                    }
                } else {
                    if (_timecodeSubtitle[i].len) {
                        len = _timecodeSubtitle[i].len
                    }
                };
                if (time >= _timecodeSubtitle[i].time && (len ? time <= _timecodeSubtitle[i].time + len : true)) {
                    return i;
                }
            };
        }
        return -1;
    };

    var go;
    var slideBar01 = new slideBarModule(videoController.find(".progressGroup")[0]);
    slideBar01.updateFun = function (type) {
        if (type == "dragStart") {
            prevent(function () {
                _this.sendUpdateFun("dragStart");
                videoTime01.currentTime = slideBar01.currentProgress * videoTime01.totalTime;
                _this.sendUpdateFun("currentTime", {
                    time: slideBar01.currentProgress * videoTime01.totalTime
                });
            });
        } else if (type == "dragStop") {
            prevent(function () {
                _this.sendUpdateFun("dragStop");
                if (!_this.hover) {
                    _this.show = false;
                }
            });
        } else if (type == "currentProgress") {
            videoTime01.currentTime = slideBar01.currentProgress * videoTime01.totalTime;
            _this.subtitleIndex = getSubtitleIndex(_this.subtitleData, videoTime01.currentTime);
            if (slideBar01.controling) {
                clearTimeout(go);
                go = setTimeout(function () {
                    _this.sendUpdateFun("currentTime", {
                        time: slideBar01.currentProgress * videoTime01.totalTime
                    });
                }, 50);
            }
        }
    }

    /*滑桿連接*/
    parameterConnection(this, "currentProgress", slideBar01, "currentProgress");
    parameterConnection(this, "controling", slideBar01, "controling", {
        write: false
    });

    /*按鈕連接*/
    parameterConnection(this, "playing", playSwitchButton01, "active", {
        writeFun: function (value) {
            _this.show = value ? _this.hover : true;
        }
    });
    parameterConnection(this, "mute", muteSwitchButton01, "active");
    parameterConnection(this, "subtitle", subtitleSwitchButton01, "active");

    /*時間顯示連接*/
    parameterConnection(this, "currentTime", videoTime01, "currentTime");
    parameterConnection(this, "totalTime", videoTime01, "totalTime");


    /*外部連接*/
    parameterConnection(this, "subtitleData", _data, "subtitleData", {
        writeFun: function (value) {            
            _this.sendUpdateFun("subtitleData");
        }
    });
    parameterConnection(this, "subtitleIndex", _data, "subtitleIndex", {
        change: true,
        writeFun: function (value) {
            var temp = value == -1 ? "" : _this.subtitleData[value].text;
            var subtitleText = document.createElement("div");
            subtitleText.classList.add("subtitleText");
            subtitleText.setAttribute("text",temp);
            videoSubtitleFrame.find(".videoSubtitle").html("");
            videoSubtitleFrame.find(".videoSubtitle").append(subtitleText);
        }
    });
    parameterConnection(this, "bufferProgress", _data, "bufferProgress", {
        change: true,
        writeFun: function (value) {
            videoController.find(".bufferProgress").css("width", value * 100 + "%");
        }
    });

    parameterConnection(this, "loading", _data, "loading", {
        change: true,
        writeFun: function (value) {
            videoLoading.fadeTo(100, value ? 1 : 0);
        }
    });

    Object.defineProperty(this, "mainVideoController", {
        get: function () {
            return mainVideoController;
        },
        set: function () {},
        enumerable: false
    });

    parameterConnection(this, "hover", _data, "hover", {
        change: true
    });

    parameterConnection(this, "rect", _data, "rect", {
        change: function (oldP, newP) {
            return oldP.x != newP.x || oldP.y != newP.y || oldP.width != newP.width || oldP.height != newP.height
        },
        writeFun: function (value) {
            var h = videoController.height();
            mainVideoController.css({
                left: value.x,
                top: value.y,
                width: value.width,
                height: value.height
            });
        }
    });

    parameterConnection(this, "show", _data, "show", {
        change: true,
        writeFun: function (value) {
            videoController.find(".videoControllerFrame").stop(true).animate({
                bottom: value ? 0 : -videoController.find(".videoControllerFrame").height()
            }, 300);
            videoSubtitleFrame.find(".videoSubtitle").stop(true).animate({
                bottom: value ? videoController.find(".videoControllerFrame").height() : 0
            }, 300);
        },
        replace: function (value) {
            return _this.playing ? value : true;
        }
    });

    function init() {
        var showing;
        mainVideoController.mousedown(function (e) {
            if (!isPC()) {
                _this.show = (e.target == videoController[0]) ? !_this.show : true;
                clearTimeout(showing);
                if (_this.show) {
                    showing = setTimeout(function () {
                        if (!slideBar01.controling) {
                            _this.show = false;
                        }
                    }, 2000);
                }
            }
        });
        mainVideoController.mouseenter(function () {
            _this.hover = true;
            if (isPC()) {
                _this.show = true;
            }
        });
        mainVideoController.mouseleave(function () {
            _this.hover = false;
            if (!slideBar01.controling) {
                _this.show = false;
            }
        });
    }
    init();
}
videoControllerModule = extend(videoControllerModule, Module);


videoControllerModule.prototype.connection = function (mainVideoElement) {
    var _this = this;
    mainVideoElement.controller = _this;
    var mainVideo = $(mainVideoElement);
    var controllerClass = mainVideo.attr("controllerClass");
    if (controllerClass != undefined) {
        _this.mainVideoController.addClass(controllerClass);
    }

    var progressClass = mainVideo.attr("progressClass");
    if (progressClass != undefined) {
        _this.mainVideoController.find(".progressGroup").addClass(progressClass);
    }
    
    var buttonClass = mainVideo.attr("buttonClass");
    if (buttonClass != undefined) {
        _this.mainVideoController.find(".buttonGroup").addClass(buttonClass);
    }
    
    var timeClass = mainVideo.attr("timeClass");
    if (timeClass != undefined) {
        _this.mainVideoController.find(".timeGroup").addClass(timeClass);
    }

    function resize() {
        var temp = mainVideo.getRect();
        var temp0 = mainVideo.parent().getRect();
        temp.x -= temp0.x;
        temp.y -= temp0.y;
        _this.rect = temp;
        _this.mainVideoController.ChangeClass("size450", _this.rect.width <= 450);
        _this.mainVideoController.ChangeClass("size350", _this.rect.width <= 350);
        _this.mainVideoController.ChangeClass("size150", _this.rect.width <= 150);
        var buttonGroupWidth = _this.mainVideoController.find(".buttonGroup").width();
        var timeGroupWidth = (_this.mainVideoController.find(".timeGroup").css("display") == "none") ? 0 : _this.mainVideoController.find(".timeGroup").width();
        if (_this.mainVideoController.hasClass("double")) {
            _this.mainVideoController.find(".timeGroup").css("left", "");
            _this.mainVideoController.find(".timeGroup").css("right", 0);
            _this.mainVideoController.find(".progressGroup").css("left", 0);
        } else {
            _this.mainVideoController.find(".timeGroup").css("left", buttonGroupWidth);
            _this.mainVideoController.find(".timeGroup").css("right", "");
            _this.mainVideoController.find(".progressGroup").css("left", buttonGroupWidth + timeGroupWidth);
        }
    }
    $(window).on("resize", resize);
    setInterval(resize, 1000);
    resize();
    var tempPaused = mainVideoElement.paused;

    _this.updateFun = function (type, data) {
        if (type == "dragStart") {
            tempPaused = !mainVideoElement.paused;
            mainVideoElement.pause();
        } else if (type == "dragStop") {
            if (tempPaused && !mainVideoElement.ended) {
                mainVideoElement.play();
            }
        } else if (type == "play") {
            mainVideoElement.play();
        } else if (type == "pause") {
            mainVideoElement.pause();
        } else if (type == "mute") {
            mainVideoElement.setAttribute("muted", "");
            mainVideoElement.muted = true;
        } else if (type == "noMute") {
            mainVideoElement.removeAttribute("muted");
            mainVideoElement.muted = false;
        } else if (type == "currentTime") {
            mainVideoElement.currentTime = data.time;
        } else if (type == "subtitle") {
            mainVideoElement.subtitle = true;
        } else if (type == "noSubtitle") {
            mainVideoElement.subtitle = false;
        } else if (type = "subtitleData") {
            _this.mainVideoController.ChangeClass("noSubtitle", _this.subtitleData.length == 0);
            resize();
        }
    }
    mainVideo.on("loadeddata", function () {
        _this.totalTime = mainVideoElement.duration;
        _this.playing = !mainVideoElement.paused;
        _this.mute = mainVideoElement.muted;
        _this.subtitle = mainVideoElement.subtitle;
        _this.show = false;
        resize();
    });

    mainVideo.on("timeupdate", function () {
        _this.currentTime = mainVideoElement.currentTime;
        if (mainVideoElement.buffered.length) {
            _this.bufferProgress = mainVideoElement.buffered.end(0) / mainVideoElement.duration;
        }else{
            _this.bufferProgress = 0;
        }
        _this.playing = !mainVideoElement.paused;
        _this.mute = mainVideoElement.muted;
        _this.subtitle = mainVideoElement.subtitle;
    });

    mainVideo.on("waiting seeking", function () {
        _this.loading = true;
    });
    mainVideo.on("canplay seeked", function () {
        _this.loading = false;
    });
    mainVideo.on("ended", function () {
        _this.playing = false;
        _this.loading = false;
    });
    mainVideo.mouseenter(function () {
        if (!_this.hover) {
            _this.hover = true;
            if (isPC()) {
                _this.show = true;
            }
        }
    });
    mainVideo.mouseleave(function () {
        if (_this.hover) {
            _this.hover = false;
            if (!_this.controling) {
                _this.show = false;
            }
        }
    });
}


function createVideoControllerElement() {
    var a = document.createElement("div");
    var s = "";
    s += '<div class="mainVideoController noSubtitle">';
    s += '<div class="videoController">';
    s += '<div class="videoControllerFrame">';
    s += '<div class="buttonGroup">';
    s += '<div class="button playButton"></div>';
    s += '<div class="button muteButton"></div>';
    s += '<div class="button subtitleButton"></div>';
    s += '</div>';
    s += '<div class="timeGroup">';
    s += '<div class="currentTime">00:00</div>';
    s += '<div class="between">/</div>';
    s += '<div class="totalTime">01:00</div>';
    s += '</div>';
    s += '<div class="progressGroup">';
    s += '<div class="progressFrame">';
    s += '<div class="currentLengthLock">';
    s += '<div class="bufferProgress"> </div>';
    s += '<div class="currentLength"></div>';
    s += '</div>';
    s += '<div class="progressLock">';
    s += '<div class="progress">';
    s += '<div class="progressButton"></div>';
    s += '</div>';
    s += '</div>';
    s += '</div>';
    s += '</div>';
    s += '</div>';
    s += '</div>';
    s += '<div class="videoSubtitleFrame">';
    s += '<div class="videoSubtitle"></div>';
    s += '</div>';
    s += '<div class="videoLoading"></div>';
    s += '</div>';
    a.innerHTML = s;
    return a.childNodes[0];
}


(function ($) {
    $.fn.AddClass = function (name) {
        if (!this.hasClass(name)) {
            this.addClass(name);
        }
    }

    $.fn.RemoveClass = function (name) {
        if (this.hasClass(name)) {
            this.removeClass(name);
        }
    }

    $.fn.ChangeClass = function (name, bool) {
        if (bool ^ this.hasClass(name)) {
            this.toggleClass(name);
        }
    }

    $.fn.getRect = function () {
        var rectangle01 = new rectangle();
        rectangle01.x = this.offset().left;
        rectangle01.y = this.offset().top;
        rectangle01.width = this.width();
        rectangle01.height = this.height();
        return rectangle01;
    }

    $.fn.controller = function () {
        return this.each(function (index, element) {
            if (element.tagName == "VIDEO") {
                if (!element.controller) {
                    /*建立元素*/
                    var mainVideoController = createVideoControllerElement();
                    element.parentElement.insertBefore(mainVideoController, element.nextElementSibling);

                    /*控制器*/
                    var videoControllerModule01 = new videoControllerModule(mainVideoController);

                    /*控制器連接影片*/
                    videoControllerModule01.connection(element);
                }
            }
        });
    }

    /*$.fn.controller = function () {
        return this.map(function (index, element) {
            if (element.tagName == "VIDEO") {
                if (!element.controller) {
                    //建立元素
                    var mainVideoController = createVideoControllerElement();
                    element.parentElement.insertBefore(mainVideoController, element.nextElementSibling);
                    
                    //控制器
                    var videoControllerModule01 = new videoControllerModule(mainVideoController);
                    
                    //控制器連接影片
                    videoControllerModule01.connection(element);
                }
            }
            return element.controller;
        });
    }
    $.fn.setSubtitleData = function (data) {
        return this.each(function (index, element) {
            element.subtitleData = data;
        });
    }*/
})(jQuery);

$(function () {
    $("video[OPA_controller]").controller();
});
