(function($){

    $(function(){
        $('#date').yoDate({
            passed: false,
            minDate: new Date(Date.UTC(2010, 7, 15) ),
            maxDate: new Date(Date.UTC(2016, 2, 9))
        });
        //$('#expbox').on('mousedown', function(){});

        //$('.basic').fancySelect();

        /*var inp1 = document.getElementById('inp1');
        var box = document.getElementById('box2');
        function addEvent(el, event, call){
            if(document.documentElement.addEventListener){
                el.addEventListener(event, call, false);
            }else{
                el.attachEvent('on'+event, call);
            }
        }

        function preventDefault(evt){
            if(evt.preventDefault){
                evt.preventDefault()
            } else {
                return evt.value = false;
            }
        }

        addEvent(inp1, 'beforedeactivate', function(evt){
            alert(1)
            preventDefault(evt);
        })

        addEvent(box2, 'mousedown', function(evt){
            preventDefault(evt);
            //console.log('downdown');
        });*/
    });

})(jQuery);
