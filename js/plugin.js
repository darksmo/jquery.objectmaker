(function($) {
    var methods = {
        init : function(options) {

            // extend options settings
            var settings = $.extend({
                // defaults go here
                text: "Hi",
            }, options);

            return this.each(function() {
                var $this = $(this);
                $this.html("<h1>" + settings.text + "</h1>");
            });
        }
    };

    $.fn.TestPlugin= function(args) {
        if (typeof args == 'object') {
            return methods.init.apply(this, arguments);
        }
        else {
            $.error("Invalid options were passed as input of ObjectMaker");
        }
    };
})(jQuery);
