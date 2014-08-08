/**
 * @name yo-datepicker
 * @description a date picker
 * @author yongxiang.li
 * @date 2014/7/10 15:37
 */

/**
 * need todo
 *
 */

/**
 * some userfull function
 */

/**
 * get template
 * update-ym
 * update-days
 * bindEvents
 *
 * setup-start-data
 * setup-end-date
 * setup-contact-date
 *
 * nav
 *
 *
 * seprator - or /
 */

(function(window, undefined, $){

    //var utcDate =newDate(Date.UTC(2014,11,1,0,0,0));

    if(window.console === undefined){
        window.console = {};
        console.log = function(){}
    }
    /**
     * [__extend description] extend class
     * @param  {[type]} child  [subClass]
     * @param  {[type]} parent [supClass that be extended]
     * @return {[type]}        [extended subClass]
     */
    function __extend(child, parent) {
        var __hasProp = {}.hasOwnProperty
        for (var key in parent) {
            if (__hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    function UTCDate(){
        return new Date(Date.UTC.apply(Date, arguments));
    }

    function UTCToday(){
        var t = new Date();
        return UTCDate( t.getFullYear(), t.getMonth(), t.getDate() );
    }

    /**
     * Get days in `month` for `year`.
     *
     * @param {Number} month
     * @param {Number} year
     * @return {Number}
     * @api private
     */
    function daysInMonth(month, year) {
      return [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    }

    /**
     * Check if `year` is a leap year.
     *
     * @param {Number} year
     * @return {Boolean}
     * @api private
     */
    function isLeapYear(year) {
      return (0 == year % 400)
        || ((0 == year % 4) && (0 != year % 100))
        || (0 == year);
    }

    /**
     * [isIE description] check if is 'IE' and the IE version
     * @param  {[type]}  version    [description]
     * @param  {[type]}  comparison [description]
     * @return {Boolean}            [description]
     * example: isIE(8), isIE(9, lt);
     */
    function isIE( version, comparison ){
        var $div = $('<div style="display:none;"/>').appendTo($('body'));
        $div.html('<!--[if '+(comparison||'')+' IE '+(version||'')+']><i>&nbsp;</i><![endif]-->');
        var ieTest = $div.find('i').length;
        $div.remove();
        return ieTest;
    }

    var ONEDAY = 864e5,
        MONTH = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        DAYS = {
            30: [3, 5, 8, 10],
            31: [0, 2, 4, 6, 7, 9, 11]
        },
        WEEK = {0: ['日', '一', '二', '三', '四', '五', '六'],
                1: ['一', '二', '三', '四', '五', '六', '日']
            }
        HOLIDAYS = {};

    var _uid = +new Date();

    var TP_HEADER = ['<div class="date-hd">',
                        '<div class="date-guide">',
                            '<div class="nav prev" data-prev="">',
                                '<i class="iconfont yo-arrow-left">&#xe600;</i>',
                            '</div>',
                            '<div class="ym">',
                                '<div class="ym-wrap year-wrap"><div class="ym-inner">',
                                    '<div class="ym-nav year-cont">{{year}}</div>',
                                '</div></div>',
                                '<div class="ym-wrap month-wrap"><div class="ym-inner">',
                                    '<div class="ym-nav month-cont">{{month}}</div>',
                                '</div></div>',
                            '</div>',
                            '<div class="nav next" data-next="">',
                                '<i class="iconfont yo-arrow-left">&#xe601;</i>',
                            '</div>',
                        '</div>',
                    '</div>'].join('');

    var TP_DATEPICKER = '<div class="date-pop">'+
                    '<div class="yo-date">'+
                        TP_HEADER+
                        '<div class="date-bd">'+
                            '<div class="week-cont">{{weekCont}}</div>'+
                            '<div class="day-cont">{{dayCont}}</div>'+
                        '</div>'+
                        '<div class="date-ft">'+
                        '<div class="arrow"></div>'+
                    '</div>';

    var Default = {
        weekstart: 1, //
        calender: 1, //number
        weekStart: 1,
        startYear: 1990,
        startMonth: 1,
        minDate: -Infinity,
        maxDate: Infinity,
        crossYear: 100,
        crossMonth: 12,
        Holidays: window.HolidayData,
        passed: false,
        popbox: true, //绝对定位的弹框还是inline，true为弹框
        direction: 'b', //top-t,bottom-b,left-l,right-r
        beforeShow: '', //hook before show
        afterHide: '', //hook after hide
        range: false, //if range datepicker or single datepicker
        calender: 1, //number of calenders
        animate: 'none', //animation
        fromDate: -Infinity,
        toDate: Infinity,
        distance: '3D' //default todate after fromdate D,M,Y respect day,month,year
    };

    var mousedown = 0;


    var YoDate = function(inp, options){
        var ot = new Date().getTime();
        this.inp = inp;
        this.options = $.extend(Default, options);
        this.$holder = '';
        this.curInfo = {};
        this.chosenDate = UTCToday();
        this.picker = TP_DATEPICKER;
        this.init();
        console.log('init-cost', new Date().getTime() - ot + 'ms');
    };

    YoDate.prototype = {
        init: function(){
            this.initHolder();
            this.render();
            this.onAfterRender();
        },

        initHolder: function(){
            var self = this;
            var uid = this.getUID(),
                $inp = $(self.inp),
                dir = self.options.direction;

            var pos = {
                top: $inp.offset().top,
                left: $inp.offset().left,
                width: parseInt($inp.css('width'), 10),
                height: parseInt($inp.css('height'), 10)
            }

            //poplayer position
            var top, left, direct;

            switch(dir){
                case 'r': {
                    top = pos.top;
                    left = pos.left + pos.width + 10;
                    direct = 'dir-right';
                    break;
                }

                case 'b':
                default: {
                    top = pos.top + pos.height + 10;
                    left = pos.left;
                    direct = 'dir-default'; //default
                    break;
                }
            }

            $(document.body).append('<div class="yodate-popbox '+ direct +'" id="' + uid + '" style="display:none; z-index:99; top:'+ top +'px; left:'+ left +'px;"></div>');
            self.$holder = $('#' + uid);

            self.attachEvents();
        },


        //给定一个日期，获取他所在月份的日历
        render: function(date){

            var self = this;
            var $picker = $(this.picker);
            var info;

            if(date === undefined){
                date = UTCToday();
            }

            info = self.getDateInfo(date);

            var options = self.options;

            var cont = 0;

            var weekCont = ['<table class="date-table">',
                                '<thead class="thead"><tr>'];

            for(var i = 0, w = WEEK[options.weekStart]; i < 7; i++){
                weekCont.push('<th>'+ w[i] +'</th>');
            }


            weekCont.push('</tr></thead></table>');
            weekCont = weekCont.join("");

            var dayCont = ['<table class="date-table">',
                                '<tbody class="tbody">'];

            var weekStart = parseInt((info.firstDay - options.weekStart) % 7, 10);
            weekStart < 0 ? weekStart = 6 : '';
            var w_end = weekStart + info.daysCont;
            var year = info.year,
                month = info.month,
                m_show = info.m_show,
                date,
                extLang,
                dateStrFull,
                dateStrInp;

            while(cont < 42){
                if(cont % 7 === 0){
                    dayCont.push('<tr>');
                }

                if(cont >= weekStart && cont < w_end){

                    var cur = '',
                        today = '',
                        mstr = month + 1,
                        d;
                    date = cont + 1 - weekStart;

                    dateStrInp = year + '-' + m_show + '-' + date;

                    dateStrFull = year + '-' + self.formatDateCell(m_show) + '-' + self.formatDateCell(date);
                    d = UTCDate(year, month, date);

                    extLang = self.parseExtLang(d, dateStrFull, cont);

                    dayCont.push('<td class="'+ extLang.cls +'" data-date-str="'+ dateStrInp +'">'+ (extLang.txt.length ? extLang.txt : date) +'</td>');
                } else {
                    dayCont.push('<td class="old">&nbsp;</td>');
                }

                if(cont % 7 === 6){
                    dayCont.push('</tr>');
                }
                cont++;
            }

            dayCont = dayCont.concat(['</tbody></table>']);
            dayCont = dayCont.join('');
            $picker.find('.week-cont').html(weekCont);
            $picker.find('.day-cont').html(dayCont);

            self.picker = $picker.get(0);

            self.updateNav(info);

            self.$holder.html($picker);

            //console.log('bind');
            /*$picker.find('.year-cont select').selecter();
            $picker.find('.month-cont select').selecter();*/

            /*$picker.find('.year-cont select').fancySelect();
            $picker.find('.month-cont select').fancySelect();*/


        },

        update: function(date){
            var ot = new Date().getTime();
            date = this.validDate(date);
            this.render(date);
            this.onAfterRender();
            $(this.inp).focus();
            console.log('update-cost', new Date().getTime() - ot + 'ms');
        },

        validDate: function(date){
            var opts = this.options;
            if(!date){
                return UTCToday();
            }
            if( date - opts.minDate > 0 && opts.maxDate - date > 0){
                return date;
            } else if(date - opts.minDate < 0){
                return opts.minDate;
            } else {
                return opts.maxDate;
            }
        },

        updateNav: function(info){

            var self = this,
                $picker = $(self.picker),
                year = info.year,
                month = info.month,
                opts = this.options,
                yearCont = ['<select name="" class="date-select" id="'+ self.getUID('year') +'">'],
                monthCont = ['<select name="" class="date-select" id="'+ self.getUID('month') +'">'];

            var startY = Math.max(opts.minDate.getFullYear(), year - opts.crossYear),
                startM = 1,
                endY = Math.min(opts.maxDate.getFullYear(), year + opts.crossYear),
                endM = 12;

            for(var y = startY; y <= endY; y++){
                var selected = '';
                if(year === y){
                    var selected = 'selected';
                }
                yearCont.push('<option ' + selected + '>' + y +' </option>');
            }

            for(var m = startM; m <= endM; m++){
                selected = '';
                if(month+1 === m){
                    var selected = 'selected';
                }
                monthCont.push('<option '+ selected +'>'+ m +'</option>');
            }

            yearCont.push('</select><span class="ym-measure">年</span>');
            monthCont.push('</select><span class="ym-measure">月</span>');

            yearCont = yearCont.join('');
            monthCont = monthCont.join('');

            $picker.find('.year-cont').html(yearCont);
            $picker.find('.month-cont').html(monthCont);

            navInfo = self.calcuNav();

            //check if the nav  display or not
            navInfo.prev.dis ? $picker.find('.prev').css('visibility', 'hidden') : $picker.find('.prev').css('visibility', 'visible');
            navInfo.next.dis ? $picker.find('.next').css('visibility', 'hidden') : $picker.find('.next').css('visibility', 'visible');

            self.picker = $picker[0];

            return self;

        },

        parseExtLang: function(date, key, cont){
            var cls = '',
                txt = '',
                holiday = '',
                options = this.options,
                day = date.getDay();

            if(this.chosenDate - date == 0 ){
                cls += ' cur';
            }

            //addHoliday if need
            if(options.Holidays){

                holiday = options.Holidays[key] || '';
                if(holiday){
                    cls += holiday.holidayClass + ' holiday';
                    txt = holiday.holidayName;
                }
            }

            if(!holiday){
                switch(UTCToday() - date){
                    case 0: {
                        cls += ' today';
                        txt = '今天';
                        break;
                    }
                    case -ONEDAY: {
                        cls += ' tomorrow';
                        txt = '明天';
                        break;
                    }
                    case +ONEDAY: {
                        cls += ' yestoday';
                        txt = '昨天';
                        break;
                    }
                }
            }

            if( (options.passed && date - UTCToday() < 0) ||
                    (options.minDate - date > 0 || options.maxDate - date < 0) ){
                cls += ' gray';
            } else {
                cls += ' day';
            }

            //weekend
            switch(day){
                case 0: {
                    cls += ' w0';
                    break;
                }

                case 6: {
                    cls += ' w6';
                    break;
                }

                default:
                    break;
            }

            return {
                cls: cls,
                txt: txt
            }
        },

        calcuNav: function(){
            var info = this.curInfo,
                y = info.year,
                m = info.month,
                opts = this.options,
                prevDis = false,
                nextDis = false,
                prevYear,
                prevMonth,
                nextYear,
                nextMonth,
                navInfo,
                nav = {};

            //prev
            if(m - 1 > 0){
                prevMonth = m - 1;
                prevYear = y;
            } else {
                prevMonth = 11;
                prevYear = y - 1;
            }

            //next
            if( m + 1 < 11){
                nextMonth = m + 1;
                nextYear = y;
            } else {
                nextMonth = 0;
                nextYear = y + 1;
            }

            if(UTCDate(prevYear, prevMonth) - UTCDate(opts.minDate.getFullYear(), opts.minDate.getMonth() ) < 0 ){
                prevDis = true;
            }

            if(UTCDate(opts.maxDate.getFullYear(), opts.maxDate.getMonth() ) - UTCDate(nextYear, nextMonth) < 0 ){
                nextDis = true;
            }

            navInfo = {
                prev: {
                    dateStr: prevYear + '-' + prevMonth + '-' + '01',
                    date: UTCDate(prevYear, prevMonth, 1),
                    dis: prevDis
                },
                next: {
                    dateStr: nextYear + '-' + nextMonth + '-' + '01',
                    date: UTCDate(nextYear, nextMonth, 1),
                    dis: nextDis
                }
            }

            this.curInfo.navInfo = navInfo;

            return navInfo;

        },

        getDateInfo: function(date){
            var info = {};
            var formatDateCell = this.formatDateCell;
            var date = new Date(date.getTime()); //clone date

            var y = date.getFullYear(),
                m = date.getMonth(),
                d = date.getDate(),
                w = date.getDay(),
                h = date.getHours(),
                mi = date.getMinutes(),
                s = date.getSeconds(),
                mm = formatDateCell(m),
                dd = formatDateCell(d),
                hh = formatDateCell(h),
                mimi = formatDateCell(mi),
                ss = formatDateCell(s),
                m_show = m + 1;

            var daysCont = daysInMonth(m, y);

            var firstDay = new Date(date.setDate(1)).getDay();
            info = {
                date: date,
                year: y,
                month: m,
                dd: dd,
                hh: hh,
                mimi: mimi,
                ss: ss,
                daysCont: daysCont,
                firstDay: firstDay,
                day: d,
                m_show: m_show
                //dateStr: this.formateDate(date)
            };
            this.curInfo = info;
            return info;

        },

        attachEvents: function(){
            var self = this,
                $inp = $(self.inp),
                $holder = self.$holder;

            $inp.on('focus.yod click.yod', function(){
                self.show();
            });

            $inp.on('blur.yod', function(){
                self.hide();
            });

            //for ie only
            $inp.on('beforedeactivate', function(evt){
                mousedown && evt.preventDefault();
            });

            //keep the input focus status
            $holder.on('mousedown.yod', function(evt){
                evt.preventDefault();
                mousedown = 1;
            });

            $holder.on('mousedown.yod', '.nav', function(evt){
                evt.stopPropagation();
                var navInfo = self.curInfo.navInfo;
                if($(this).hasClass('prev')){
                    !navInfo.prev.dis && self.update(navInfo.prev.date);
                } else if($(this).hasClass('next')){
                    !navInfo.next.dis && self.update(navInfo.next.date);
                }
                return false;
            });

            /*$holder.on('change.yod', '.ym-nav', function(evt){
                evt.stopPropagation();
                var y = parseInt( self.findById('year').val(), 10),
                    m = parseInt( self.findById('month').val(), 10);

                y && m && self.render( UTCDate(y, m-1) );
                return false;
            });*/

            $holder.on('mousedown.yod', 'td.day', function(evt){
                evt.stopPropagation();
                var $tar = $(this),
                    str = $(this).data('date-str');

                if(!$tar.hasClass('cur')){
                    $holder.find('.cur').removeClass('cur');
                    $tar.addClass('cur');
                    $inp.val(str);
                    self.hide();
                    self.trigger('chosen.yod');
                }
                return false;
            });

            isIE(7, 'lt') && $holder.on('mouseover.yod', 'td.day', function(evt){
                $(this).addClass('hover');
            });

            isIE(7, 'lt') && $holder.on('mouseleave.yod', 'td.day', function(evt){
                $(this).removeClass('hover');
            });
        },

        formatDateCell: function(str){
            return ((''+str).length === 1) ? '0' + str : str;
        },

        getCurrent: function(){
            var str = $.trim( $(this.inp).val() );

            if( this.isDateStr(str) ){
                str = str.split('-');
                for(var i=0, l=str.length; i<l; i++){
                    str[i] = parseInt(str[i], 10);
                    if(i === 1){
                        str[i] = str[i] - 1;
                    }
                }
                return UTCDate.apply(Date, str);

            } else {
                return UTCToday();
            }
            //return this.isDateStr(inp) ? inp = UTCDate.apply(Date, inp.split('-')) : UTCToday();
        },

        isDateStr: function(str){
            return /^\d{4}[\-]\d{1,2}[\-]\d{1,2}$/.test(str);
        },

        multiStr: function(str, times){
            return new Array(times+1).join(str);
        },

        formateDate: function(date){
            var formatDateCell = this.formatDateCell;
            return date.getFullYear() + '-' + formatDateCell(date.getMonth() + 1) + '-' + formatDateCell(date.getDate());
        },

        formateDateUTC: function(date){
            var formatDateCell = this.formatDateCell();
            return date.getFullYear + '-' + formatDateCell(date.getMonth) + '-' + formatDateCell(date.getDate);
        },

        DateStrFix: function(){},

        getUID: function(pre){
            pre ? pre = pre + '_' : pre = '';
            return pre + 'YODATE' + _uid;
        },

        /*******Events*******/

        trigger: function(evt){
            $(this).trigger(evt)
        },

        onAfterRender: function(){
            var self = this,
                $holder = self.$holder,
                $picker = $(self.picker);

            $holder.find('.year-cont select').fancySelect();
            $holder.find('.month-cont select').fancySelect();

            $('.ym-nav').on('change.fs', function(evt){
                //evt.stopPropagation();
                var ot = new Date().getTime();
                var y = parseInt( self.findById('year').val(), 10),
                    m = parseInt( self.findById('month').val(), 10);

                y && m && self.update( UTCDate(y, m-1) );
                console.log('change-cost', new Date().getTime() - ot + 'ms');
                return false;
            });
        },

        onShow: function(){
            this.$holder.css('display', 'block');
        },

        onHide: function(){
            this.$holder.css('display', 'none');
        },

        onBeforeShow: function(){
            var self = this,
            curDate = self.getCurrent();

            if(self.chosenDate - curDate !== 0){
                self.chosenDate = curDate;
                self.update(curDate);
            }

            if(typeof self.options.beforeShow === 'function'){
                self.options.beforeShow();
            }
        },

        onAfterHide: function(){

        },

        show: function(){
            if(this.$holder.is(':hidden')){
                this.onBeforeShow();
                this.onShow();
            }
        },

        hide: function(){
            if(this.$holder.is(':visible')){
                mousedown = 0;
                this.onHide();
                this.onAfterHide();
            }
        },

        findById: function(pre){
            var id = this.getUID(pre);
            return $('#' + id);
        }

    };

    $.fn.yoDate = function(options){
        var self = this;
        new YoDate($(self), options);
    };

    $.fn.yoDateRange = function(options){
        var self = this;
        var options = $.extend(options, {range: true})
        new YoDate($(self), options);
    };

})(window, undefined, jQuery);
