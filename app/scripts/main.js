(function($){
    "use strict";

    $(function(){

        var options = {
            passed: true,
            minDate: new Date(Date.UTC(2010, 7, 15) ),
            maxDate: new Date(Date.UTC(2016, 2, 9)),
            distance: '1W'

        };

        //simple datepricker
        $('#date').yoDate();

        //passed true and minDate
        $('#date1').yoDate({
            passed: false,
            showRelate: true,
            minDate: new Date(Date.UTC(1980, 7, 15) )
        });

        //single datepicker dirction right and crossyear 20
        $('#date2').yoDate({
            crossYear: 20,
            direction: 'r'
        });

        //passed true minDate maxDate
        $('#date3').yoDate(options);

        var fromDate = $('input[name=fromDate]'),
            toDate = $('input[name=toDate]');


        //range Datepicker from and to
        YoDateRange(fromDate, toDate, options);

    });

})(jQuery);
