/**
 * TODO 键盘导航 滚动条跟随滚动
 * TODO IPHONE 使用原生控件
 */

(function(window, undefined) {

var $ = window.jQuery,
    document = window.document;

var SELECTOR_DATA_KEY = "YSELECTOR",
    SELECTOR_EVENT    =  ".SELECTOR_EVENT",
    HOVER             = "hover",
    // SupportTouch   = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch
    // IE6               = $.browser.msie && $.browser.version === "6.0";
    IE6               = /msie/.test(navigator.userAgent.toLowerCase()) && 'undefined' == typeof(document.body.style.maxHeight);
var Selector = function(){};

Selector.options = {
    emptyHidden: false,
    maxRows    : 10,
    index      : null,
    direction  : "bottom",
    onchange   : function() {},
    onselect   : function(t) { return t || ""; }
};

Selector.prototype = {
    _init: function(config){
        var self = this;

        self._setOptions(config || {});
        self._bindEvents();
    },
    _bindEvents: function(){
        var self    = this,
            jquery  = self.option("jquery"),
            showing = false;

        function toggleEvent(e){
            if (self.option("disable")) {
                return;
            }
            if (showing) {
                self._hide();
                changeArrow(e, true);
            } else {
                self._show();
                changeArrow(e, false);
            }
            showing = !showing;
        }

        function changeArrow(e, isUp){
            var arrow = $(e.currentTarget).parents(".yselector").find(".yselector_arraw b");
            isUp ? arrow.removeClass("b_up") : arrow.addClass("b_up");
        }

        // fix capture not release(mousedown and drag out);
        var _cur = null;
        $(document).mouseup(function() {
           _cur && _cur.releaseCapture && _cur.releaseCapture();
        });

        jquery.delegate(".yselector_input", "click" + SELECTOR_EVENT, toggleEvent)
            .delegate(".yselector_arraw", "mousedown" + SELECTOR_EVENT, function(e){
                self.option("input").focus();
                e.preventDefault();
                if (this.setCapture) { this.setCapture(); }
                toggleEvent(e);
            })
            .delegate(".yselector_arraw", "click" + SELECTOR_EVENT, function(e){
                if (this.releaseCapture) { this.releaseCapture(); }
            })
            .delegate(".yselector_input", "focusout" + SELECTOR_EVENT, function(e){
                if (showing) {
                    self._hide();
                    showing = false;
                }

                changeArrow(e, true);

                var val = self.val(),
                    obj = self._getByValue(val);

                // for external bind
                $($.fn.yselector.events).trigger("blur", [ self, obj, self.option("holder")]);
            })
            .delegate(".yselector_suggest ul", "mousedown" + SELECTOR_EVENT, function(e){
                e.preventDefault();

                if (this.setCapture) {
                    this.setCapture();
                    _cur = this; // fix capture not release(mousedown and drag out);
                }

                var target = e.target;

                if (target.tagName !== "A") { return; }

                var index = $(target).data("index");

                self.index(index);

                toggleEvent(e);
            })
            .delegate(".yselector_suggest ul", "click" + SELECTOR_EVENT, function(e){
                if (this.releaseCapture) { this.releaseCapture(); }
            })
            .delegate(".yselector_suggest ul", "mouseenter" + SELECTOR_EVENT, function(e){
                self._cur().removeClass(HOVER);
            })
            .delegate(".yselector_input", "keydown" + SELECTOR_EVENT, function(e){
                if (self.option("disable")) {
                    return;
                }
                var code = e.keyCode;

                if(code === 37 || code === 38){
                    self.previous();
                    return false;
                } else if(code === 39 || code === 40){
                    self.next();
                    return false;
                } else if(code === 13){
                    toggleEvent(e);
                } else if(code === 8){
                    return false;
                }
            });
    },
    _cur: function(i){
        var self    = this,
            current = (i == null) ? self.option("index") : i,
            cur     = self.option("suggest").find("a:eq(" + current + ")");

        return cur;
    },
    _drawHtml: function(){

        var self = this;

        var fullHTML = ['<div class="yselector">',
                            '<div class="yselector_box">',
                                '<div class="yselector_arraw"><b></b></div>',
                                '<span class="yselector_input" tabindex="0"></span>',
                            '</div>',
                            '<div style="display:none;" class="yselector_suggest">',
                                '<ul></ul>',
                            '</div>',
                        '</div>'];

        var jquery = $(fullHTML.join("\n")),
            holder = self.option("holder").hide();

        holder.after(jquery);
        self.option("jquery", jquery);
        self.option("suggest", $(".yselector_suggest", jquery));
        self.option("input", $(".yselector_input", jquery));
    },
    _drawSuggest: function(){
        var listHtmlArray = [], item,
            self = this,
            list = self.option("data");

        for (var i = 0, l = list.length; i < l; i++) {
            item = list[i];
            listHtmlArray.push('<li><a data-value="' + item.value + '" hidefocus="on" data-index="' + i + '"');
            listHtmlArray.push(' onclick="return false;" href="javascript:;" tabindex="-1">' + item.text + '</a></li>');
        }

        self.option("suggest").html("<ul>" + listHtmlArray.join("") + "</ul>");
    },
    _setOptions: function(obj){
        var self = this;

        self.options = $.extend({}, Selector.options, obj);

        var rawSelect = obj.rawSelect,
            options = rawSelect.options,
            index = rawSelect.selectedIndex,
            dataList = [], item;

        for (var i = 0, l = options.length; i < l; i++) {
            item = options[i];
            dataList.push({
                value: item.value || item.text,
                text: item.text
            });
        }

        self.option("holder", $(rawSelect));
        self.option("index", obj.index != null ? obj.index : index);
        self._drawHtml();
        self.setOptions(dataList);

    },
    _getByValue: function(value, key){

        if (!value) {
            return;
        }

        var list = this.option("data"),
            item;

        key = key || "value";

        for (var i = 0, l = list.length; i < l; i++) {
            item = list[i];

            if (item[key] == value) {
                return item;
            }
        }
    },
    _setByObject: function(obj, force){

        obj = obj || {};

        if (!force && this.option("index") === obj.index) {
            return;
        }

        var self = this,
            onselect = self.option("onselect"),
            onchange = self.option("onchange");

        var text = onselect ? onselect(obj.text) : (obj.text || "");

        self.option("value", obj.value || "");
        self.option("text", text);
        self.option("index", obj.index || 0);

        var holder = self.option("holder"),
            input = self.option("input");

        if (holder) { holder[0].selectedIndex = obj.index; }
        if (input) { self.option("input").text(text); }

        if (onchange) { onchange.call(self, obj); }

        // for exteral bind
        $($.fn.yselector.events).trigger("change", [ self, obj, self.option("holder")]);
    },
    _triggerClass: function(i, j){
        var self = this;

        if (i === j) {
            return;
        }

        self._cur(i).removeClass(HOVER);
        self._cur(j).addClass(HOVER);
    },
    _show: function(){
        var self = this,
            suggest = self.option("suggest"),
            index = self.option("index"),
            direction = self.option("direction");

        self._drawSuggest();

        var list = suggest.find("a");

        list.eq(index).addClass(HOVER);

        suggest.show();

        var maxRows = self.option("maxRows");
        var height = Math.min(list.size(), maxRows) * list.height();
        var top = direction === "top" ? 0 - height - self.option("jquery").height() : 0;

        suggest.find("ul").css("height", height).css("top", top).scrollTop(self.option('index') * list.height());
    },
    _hide: function(){
        this.option("suggest").hide();
    },
    setOptions: function(list){
        var self = this,
            jquery = self.option("jquery");

        list = list || [];

        var select = self.option("holder")[0];
            select.length = 0;

        for (var i = 0, l = list.length, temp; i < l; i++) {
            temp = list[i];
            temp.index = i;
            select.options.add(new Option(temp.text, temp.value));
        }

        self.option("data", list);

        if (!list.length && self.option("emptyHidden")) {
            jquery.hide();
        } else {
            jquery.show();
        }

        self._setByObject(list[self.option("index")] || list[0], true);
    },
    first: function(){
        return this.option("data")[0] || {};
    },
    option: function(key, val){

        if (val != null) {
            this.options[key] = val;
        } else {
            return this.options[key];
        }
    },
    previous: function(){
        var self = this,
            index = self.index() - 1;

        if(index < 0){
            index = self.option("data").length + index;
        }

        self.index(index);
    },
    next: function(){
        var self = this;

        self.index(self.option("index") + 1);
    },
    index: function(i){
        var self = this;

        if (i == null) {
            return self.option("index");
        }

        var data = self.option("data"),
            obj = data[i],
            index = self.option("index");

        if (!obj) {
            obj = self.first();
            i = 0;
        }

        self._setByObject(obj);
    },
    val: function(value, force){
        var self = this;

        if (value == null) {
            return self.option("value");
        }

        var obj = self._getByValue(value);

        if (obj == null) {
            obj = self.first();
        }

        self._setByObject(obj, force);

    },
    text: function(text){
        var self = this;

        if (text == null) {
            return self.option("text");
        }

        var obj = self._getByValue(text, "text");

        if (obj == null) {
            obj = self.first();
        }

        self._setByObject(obj);

    },
    disable: function(){
        this.option("jquery")
            .addClass("disble");

        this.option("disable", true);
    },
    enable: function(){
        this.option("jquery")
            .removeClass("disble");

        this.option("disable", false);
    },
    _redrawList: function() {

        var rawSelect = this.option('holder')[0],
            options = rawSelect.options,
            dataList = [], item;

        for (var i = 0, l = options.length; i < l; i++) {
            item = options[i];
            dataList.push({
                value: item.value || item.text,
                text: item.text
            });
        }
        this.setOptions(dataList);
    },
    remove: function(index) {
        var sel = this.option('holder')[0],
            options = sel.options;
        options.remove(index);
        this._redrawList();
    },
    add: function(option) {
        var sel = this.option('holder')[0],
            options = sel.options;
        options.add(option);
        this._redrawList();
    }
};

$.fn.extend({
    yselector: function(config){

        $.fn.yselector.events = {};

        this.each(function(i, item){
            var self = $(this);

            var inst = self.data(SELECTOR_DATA_KEY);

            if (!inst) {
                config = config || {};
                config.rawSelect = self[0];
                inst = new Selector();
                self.data(SELECTOR_DATA_KEY, inst);
                inst._init(config);
            }

            return inst;
        });
    }
});

})(this);
