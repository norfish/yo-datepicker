/**
 * @name yo-datepicker
 * @description a date picker
 * @author yongxiang.li
 * @date 2014/6/10 15:37
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
 * rangedate 联动
 *
 *
 * seprator - or /
 */

!function(window, undefined, $){

    "use strict";

    //var utcDate =newDate(Date.UTC(2014,11,1,0,0,0));

    if(window.console === undefined){
        window.console = {};
        console.log = console.info = console.debug = console.error = function(){};
    }

    /**
     * [UTCDate getUTC date]
     */
    function UTCDate(){
        return new Date(Date.UTC.apply(Date, arguments));
    }


    function UTCToday(){

        var t = /*QNR && QNR.SERVER_TIME ||*/ new Date();
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
      return (0 == year % 400) || ((0 == year % 4) && (0 != year % 100)) || (0 == year);
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

    /**
     * [isDate description]
     * @param  {[type]}  date [description]
     * @return {Boolean}      [description]
     */
    function isDate(date){
        return date instanceof Date;
    }

    var ONEDAY = 864e5,
        MONTH = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        DAYS = {
            30: [3, 5, 8, 10],
            31: [0, 2, 4, 6, 7, 9, 11]
        },
        WEEK = {0: ['周日', '一', '二', '三', '四', '五', '六'],
                1: ['周一', '二', '三', '四', '五', '六', '日']
            },
        /*WEEK = {0: ['Sun', 'Mon', 'Thu', 'Wen', 'Tus', 'Fri', 'Sat'],
                1: ['Mon', 'Thu', 'Wen', 'Tus', 'Fri', 'Sat', 'Sun']
            },*/
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
                        '<div class="date-ft"><div class="date-map"><a href="javascript:void(0);" class="date-today">今天</a></div></div>'+
                        '<div class="arrow">'+
		                    '<div class="arrow-inner"></div>'+
		                '</div>'+
                    '</div>';

    var Default = {
        weekstart: 1, //
        calender: 1, //number
        weekStart: 1,
        startYear: 1990,
        startMonth: 1,
        minDate: -Infinity,
        maxDate: Infinity,
        crossYear: 10,
        crossMonth: 12,
        Holidays: window.HolidayData, //节假日
        noSelector: false, //日期是否支持select 选择
        passed: false, //过期的日期是否展示
        showRelate: false, //是否展示前后月份的日期
        popbox: true, //绝对定位的弹框还是inline，true为弹框
        direction: 'b', //top-t,bottom-b,left-l,right-r
        beforeShow: '', //hook before show
        afterHide: '', //hook after hide
        type: 'single', //singedatepicker or rangeFrom rangeTo
        range: false, //if range datepicker or single datepicker
        animate: 'none', //animation
        distance: '3D' //default todate after fromdate D,W,Y respect day,week
    };

    var mousedown = 0;


    var YoDate = function(inp, options){

        var ot = new Date().getTime();
        this.inp = inp;
        this._uid = ++_uid;
        this.options = $.extend({}, Default, options);
        this.$holder = '';
        this.curInfo = {};
        this.chosenDate = UTCToday();
        this.picker = TP_DATEPICKER;

        //
        this.initHolder();
        this.processOpts();
        this.render();
        this.onAfterRender();
        console.log('init-cost', new Date().getTime() - ot + 'ms');
    };

    YoDate.prototype = {

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
            };

            //poplayer position
            var top, left, direct;

            switch(dir){
                case 'r': {
                    top = pos.top;
                    left = pos.left + pos.width + 10;
                    direct = 'dir-right';
                    break;
                }

                case 't': {
                    top = pos.top - 240;
                    left = pos.left + pos.width + 10;
                    direct = 'dir-top';
                    break;
                }

                case 'b':
                default: {
                    top = pos.top + pos.height + 20;
                    left = pos.left;
                    direct = 'dir-default'; //default
                    break;
                }

            }

            $(document.body).append('<div class="yodate-popbox '+ direct +'" id="' + uid + '" style="display:none; z-index:99; top:'+ top +'px; left:'+ left +'px;"></div>');
            self.$holder = $('#' + uid);

            self.attachEvents();
        },

        //process options before render
        processOpts: function(){
            var opts = this.options;

            if(opts.range && opts.relateFrom){
                opts.passed = true;

                if(opts.relateFrom){
                    var str = $(opts.relateFrom).val(),
                    d = this.getDate(str);
                    d ? this.minToDate = d : null;
                }
            }
        },

        //给定一个日期，获取他所在月份的日历
        render: function(date){

            var self = this;
            var $picker = $(this.picker);
            var info;

            if(!date){
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
            weekCont = weekCont.join('');

            var dayCont = ['<table class="date-table">',
                                '<tbody class="tbody">'];

            var weekStart = parseInt((info.firstDay - options.weekStart) % 7, 10);
            weekStart < 0 ? weekStart = 6 : '';
            var mEnd = weekStart + info.daysCont;
            var year = info.year,
                month = info.month,
                mShow = info.mShow,
                prevMonLastDay = info.prevMonLastDay, //上一个月的最后一天
                day,
                extLang,
                dateStrFull,
                dateStrInp;

            while(cont < 42){
                if(cont % 7 === 0){
                    dayCont.push('<tr>');
                }

                if(cont < weekStart){
                    //是否展示上一个月的信息
                    var prevDay = (options.showRelate ? (prevMonLastDay - weekStart + cont + 1) : '&nbsp');
                    dayCont.push('<td class="old">'+ prevDay +'</td>');

                } else if(cont >= weekStart && cont < mEnd){

                    var cur = '',
                        today = '',
                        mstr = month + 1,
                        d;
                    day = cont + 1 - weekStart;

                    dateStrInp = year + '-' + mShow + '-' + day;

                    dateStrFull = year + '-' + self.formatDateCell(mShow) + '-' + self.formatDateCell(day);
                    d = UTCDate(year, month, day);

                    extLang = self.parseExtLang(d, dateStrFull, cont);

                    dayCont.push('<td class="'+ extLang.cls +'" data-date-str="'+ dateStrInp +'">'+ (extLang.txt.length ? extLang.txt : day) +'</td>');

                } else {
                    var nextDay = options.showRelate ? (cont - mEnd + 1) : '&nbsp;';
                    dayCont.push('<td class="old">'+ nextDay +'</td>');
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

            //render nav with or without selector
            options.noSelector ? self.updatePureNav(info) : self.updateNav(info);

            self.$holder.html($picker);

        },

        update: function(date){

            var ot = new Date().getTime();
            date = this.validDate(date);
            this.processOpts();
            this.render(date);
            this.onAfterRender();
            console.log('update-cost', new Date().getTime() - ot + 'ms');
        },

        //验证date 是否是合法的date
        validDate: function(date){
            var opts = this.options;
            if(!date || !isDate(date)){

                date = UTCToday();
            }

            if(date - opts.minDate < 0){
                date = opts.minDate;
            } else if(date - opts.maxDate > 0){
                date = opts.maxDate;
            }

            return date;
        },

        updateNav: function(info){

            var self = this,
                $picker = $(self.picker),
                year = info.year,
                month = info.month,
                opts = this.options,
                minD = opts.minDate,
                maxD = opts.maxDate,
                yearCont = ['<select name="" class="date-select" id="'+ self.getUID('year') +'">'],
                monthCont = ['<select name="" class="date-select" id="'+ self.getUID('month') +'">'];

            var startY = Math.max(isDate(minD) ? minD.getFullYear() : minD, year - opts.crossYear),
                startM = 1,
                endY = Math.min(isDate(maxD) ? maxD.getFullYear() : maxD, year + opts.crossYear),
                endM = 12,
                selected,
                navInfo;

            for(var y = startY; y <= endY; y++){

                if(year === y){
                    selected = 'selected';
                } else {
                    selected = '';
                }
                yearCont.push('<option ' + selected + '>' + y +' </option>');
            }

            for(var m = startM; m <= endM; m++){

                if(month+1 === m){
                    selected = 'selected';
                } else {
                    selected = '';
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

        updatePureNav: function(info){

            var self = this,
                $picker = $(self.picker),
                year = info.year,
                month = info.month,
                mouthShow = month + 1,
                opts = this.options,
                minD = opts.minDate,
                maxD = opts.maxDate,
                navInfo,
                dateNum;

            dateNum = '<h3>' + year + '年' + mouthShow + '月' + '</h3>';

            $picker.find('.ym').html(dateNum);

            navInfo = self.calcuNav();

            //check if the nav  display or not
            navInfo.prev.dis ? $picker.find('.prev').css('visibility', 'hidden') : $picker.find('.prev').css('visibility', 'visible');
            navInfo.next.dis ? $picker.find('.next').css('visibility', 'hidden') : $picker.find('.next').css('visibility', 'visible');

            self.picker = $picker[0];

            return self;

        },

        /**
         * [parseExtLang 计算一个日期的扩展属性，比如节假日，周末等等信息]
         * @param  {[date]} date [description]
         * @param  {[string]} key  [holiday key]
         * @param  {[number]} cont [which]
         * @return {[object]}      [class]
         */
        parseExtLang: function(date, key, cont){
            var cls = '',
                txt = '',
                holiday = '',
                options = this.options,
                day = date.getDay();

            if(this.chosenDate - date === 0 ){
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

            //判断日期是否符合过期条件
            if( (options.passed && date - UTCToday() < 0) ||
                    (options.minDate - date > 0 || options.maxDate - date < 0) ){
                cls += ' gray';
            //如果是daterange则判断联动
            } else if( (options.type === 'rangeTo') && (this.minToDate - date > 0) ) {
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
            };

            return {
                cls: cls,
                txt: txt
            }
        },

        //计算nav
        calcuNav: function(){
            var info = this.curInfo,
                y = info.year,
                m = info.month,
                opts = this.options,
                prevDis = false,
                nextDis = false,
                minD = opts.minDate,
                maxD = opts.maxDate,
                prevYear,
                prevMonth,
                prevMonthShow,
                nextYear,
                nextMonth,
                nextMonthShow,
                navInfo,
                nav = {};

            //prev
            if(m - 1 < 0){
                prevMonth = 11;
                prevYear = y - 1;
            } else {
                prevMonth = m - 1;
                prevYear = y;
            }

            //next
            if(m + 1 > 11){
                nextMonth = 0;
                nextYear = y + 1;
            } else {
                nextMonth = m + 1;
                nextYear = y;
            }

            if(UTCDate(prevYear, prevMonth) - ( isDate(minD) ? UTCDate(minD.getFullYear(), minD.getMonth()) : minD ) < 0 ){
                prevDis = true;
            }

            if( ( isDate(maxD) ? UTCDate(maxD.getFullYear(), maxD.getMonth()) : maxD ) - UTCDate(nextYear, nextMonth) < 0 ){
                nextDis = true;
            }

            prevMonthShow = this.formatDateCell( prevMonth + 1 );
            nextMonthShow = this.formatDateCell( nextMonth + 1 );

            navInfo = {
                prev: {
                    dateStr: prevYear + '-' + prevMonthShow + '-' + '01',
                    date: UTCDate(prevYear, prevMonth, 1),
                    dis: prevDis
                },
                next: {
                    dateStr: nextYear + '-' + nextMonthShow + '-' + '01',
                    date: UTCDate(nextYear, nextMonth, 1),
                    dis: nextDis
                }
            };

            this.curInfo.navInfo = navInfo;

            return navInfo;

        },

        /**
         * [getDateInfo 计算一个给定日期的相关信息]
         * @param  {[date]} source []
         * @return {[object]}        [infomation]
         */
        getDateInfo: function(source){
            var info = {};
            var formatDateCell = this.formatDateCell;
            var date = new Date(source.getTime()); //clone date

            var y = date.getFullYear(),
                m = date.getMonth(),
                d = date.getDate(),
                w = date.getDay(),
                h = date.getHours(),
                mi = date.getMinutes(), //月份 0-11
                s = date.getSeconds(),
                mm = formatDateCell(m),
                dd = formatDateCell(d),
                hh = formatDateCell(h),
                mimi = formatDateCell(mi),
                ss = formatDateCell(s),
                mShow = m + 1; //展示的月份1-12

            var daysCont = daysInMonth(m, y);

            var firstDay = new Date(date.setDate(1)).getDay(); //第一天的星期
            var prevMonLastDay = new Date(new Date(date.setDate(1)).getTime() - ONEDAY).getDate();

            info = {
                date: date,
                year: y,
                month: m,
                dd: dd,
                hh: hh,
                mimi: mimi, //format minutes
                ss: ss,
                daysCont: daysCont,
                firstDay: firstDay,
                day: d,
                mShow: mShow,
                prevMonLastDay: prevMonLastDay
                //dateStr: this.formateDate(date)
            };
            this.curInfo = info;
            return info;

        },

        attachEvents: function(){
            var self = this,
                $inp = $(self.inp),
                $holder = self.$holder;

            $inp.on('click.yod', function(){
                self.show();
            });

            //for ie only

            $inp.on('beforedeactivate', function(evt){
                mousedown && evt.preventDefault();
                mousedown = 0;
            });

            $inp.on('blur.yod', function(){
                self.hide();
            });

            $holder.on('mousedown.yod', '.nav', function(evt){
                evt.preventDefault();
                mousedown = 1;

                var navInfo = self.curInfo.navInfo;
                if($(this).hasClass('prev')){
                    !navInfo.prev.dis && self.update(navInfo.prev.date);
                } else if($(this).hasClass('next')){
                    !navInfo.next.dis && self.update(navInfo.next.date);
                }
                return false;

            });

            //keep the input focus status
            $holder.on('mousedown.yod', function(evt){
                evt.preventDefault();
                mousedown = 1;
            });

            /*$holder.on('change.yod', '.ym-nav', function(evt){
                evt.stopPropagation();
                var y = parseInt( self.findById('year').val(), 10),
                    m = parseInt( self.findById('month').val(), 10);

                y && m && self.render( UTCDate(y, m-1) );
                return false;
            });*/

            $holder.on('mousedown.yod', 'td.day', function(evt){
                evt.preventDefault();
                mousedown = 1;
                //evt.stopPropagation();
                var $tar = $(this),
                    str = $(this).data('date-str');

                if(!$tar.hasClass('cur')){
                    $holder.find('.cur').removeClass('cur');
                    $tar.addClass('cur');
                    //$inp.val(str);
                    self.setDate(str);
                    self.hide();
                    self.trigger('chosen.yod');
                }
                return false;
            });

            //
            $holder.on('mousedown.yod', '.date-today', function(evt){
                evt.preventDefault();
                mousedown = 1;
                self.update( UTCToday() );
            });

            isIE(7, 'lt') && $holder.on('mouseover.yod', 'td.day', function(evt){
                $(this).addClass('hover');
            });

            isIE(7, 'lt') && $holder.on('mouseleave.yod', 'td.day', function(evt){
                $(this).removeClass('hover');
            });
        },

        //chosen date and set value of inp
        setDate: function(str){
        	var self = this,
        		$inp = $(self.inp),
        		opts = self.options,
        		col = {'D': 1,
        				'W': 7
        			};

        	str && $inp.val(str);

            //如果是往返日期则联动
        	if(opts.range){

        		var dis = opts.distance.match(/^(\d+)(\w)$/);
        		dis = ONEDAY * parseInt(dis[1]) * col[ dis[2] ];

        		if(opts.relateTo && !$(opts.relateTo).val() ){
        			var toDate = new Date( self.getDate(str).getTime() + dis );
        			var toDateStr = self.formateDate(toDate);
        			$(opts.relateTo).val(toDateStr);
        		} else if(opts.relateFrom && !$(opts.relateFrom).val()){
        			var fromDate = new Date( self.getDate(str).getTime() - dis );
        			var fromDateStr = self.formateDate(fromDate);
        			$(opts.relateFrom).val(fromDateStr);
        		}
        	}
        },


        formatDateCell: function(str){
            return ((''+str).length === 1) ? '0' + str : str;
        },

        getCurrent: function(){
            var str = $.trim( $(this.inp).val() );
            return this.getDate(str) || UTCToday();
        },

        //get date from datestr like 2014-09-01
        getDate: function(str){
            if(this.isDateStr(str)){
                str = str.split('-');
                for(var i=0, l=str.length; i<l; i++){
                    str[i] = parseInt(str[i], 10);
                    if(i === 1){
                        str[i] = str[i] - 1;
                    }
                }
                return UTCDate.apply(Date, str);
            } else {
                return false;
            }
        },

        /**
         * [isDateStr 判断字符串是否是正确的日期格式]
         * @param  {[string]}  str [date-str such as 2014-12-12 2014/1/13]
         * @return {Boolean}
         */
        isDateStr: function(str){
            return /^\d{4}[\-]\d{1,2}[\-]\d{1,2}$/.test(str);
        },

        /**
         * [multiStr 复制一个字符串n次，返回长字符串]
         * @param  {[string]} str   [description]
         * @param  {[number]} times [description]
         * @return {[string]}       [description]
         */
        multiStr: function(str, times){
            return new Array(times+1).join(str);
        },

        /**
         * [formateDate description]
         * @param  {[date]} date
         * @return {[string]}      [description]
         */
        formateDate: function(date){
            var formatDateCell = this.formatDateCell;
            return date.getFullYear() + '-' + formatDateCell(date.getMonth() + 1) + '-' + formatDateCell(date.getDate());
        },

        formateDateUTC: function(date){
            var formatDateCell = this.formatDateCell();
            return date.getFullYear + '-' + formatDateCell(date.getMonth) + '-' + formatDateCell(date.getDate);
        },

        getUID: function(pre){
            pre ? pre = pre + '_' : pre = '';
            return pre + 'YODATE' + this._uid;
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
            //$(this.inp).focus();
        },

        onHide: function(){
            this.$holder.css('display', 'none');
        },

        onBeforeShow: function(){
            var self = this,

            	curDate = self.getCurrent();

            //if(self.chosenDate - curDate !== 0){
                self.chosenDate = curDate;
                self.update(curDate);
            //}

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

    /**************************************************/
    /**
     * extend jquery
     */
    $.fn.yoDate = function(options){
        new YoDate(this, options);
    };

    /**
     * [YoDateRange range datepicker]
     * @param {[dom]} from    [from date dom]
     * @param {[dom]} to      [to date dom]
     * @param {[object]} options [options]
     */
    window.YoDateRange = function(from, to, options){
        var self = this,
            fromOpts = $.extend({}, options, {range: true, relateTo: to, type: 'rangeFrom'}),
            toOpts = $.extend({}, options, {range:true, relateFrom: from, type: 'rangeTo'});

        var a = new YoDate(from, fromOpts);
        console.log('init', a, a.options)
        new YoDate(to, toOpts);
    };

}(window, undefined, jQuery);
