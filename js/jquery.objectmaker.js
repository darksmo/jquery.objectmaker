(function($) {
    var settings = {
        source: 'http://localhost:8000/configurator',  
        actionText: 'Confirm', 
        actionCallback: function(){},
        itemHtmlTemplate : function(item_id, item) {
            return '<article id="' + item_id + '">'
                + '   <header>' + item.title + '</header>'
                + '</article>';
        },
        selectedItemSummaryHtmlTemplate : function(item_id, item) {
            return "<h3>" + item.title + "</h3>";
        },
        summaryValueHtmlTemplate : function(summary_val) {
            return '<h2>' + summary_val + '</h2>';
        },
        summaryActionsHtmlTemplate : function () {
            return '';
        },
        categoryHtmlTemplate : function(category) {
            return '<h4>' + category + '</h4>';
        },
        selectItem : function(item_id) {
            $('#' + item_id ).css('color', 'red');
        },
    };

    var methods = {
        item_selected : function (item_id) {
            // basically the user tells us a selection was made. We need to
            // store the selection in the jquery object and make the request
            // again.
            var $this = $(this);

            // update selection
            var data = $this.data('objectmaker');
            data.selection.push(item_id);
            $this.data('objectmaker', data);

            // request to server
            methods._request_items.call($this);

            return $this;
        },
        init : function(options) {

            // extend settings
            $.extend(settings, options);

            return this.each(function() {
                var $this = $(this);
                var data = $this.data('objectmaker');
                if (!data) {
                    // initially the selection is empty
                    data = {
                        selection : [],
                    };
                    $this.data('objectmaker', data);

                    // inital skeleton of the configurator
                    $this.html(
                        '<header><h1>The Configurator</h1></header>'
                        + '<section></section>'
                        + '<aside></aside>'
                    );

                    // request data the first time (will get all of the items)
                    methods._request_items.call($this);
                }
                else {
                    $.error("Cannot initialize an objectMaker twice");
                }
            });
        },
        _request_items : function() {
            // make a first request by sending an empty selection
            // (retrieves all the available items
            var selected_items = this.data('objectmaker').selection;

            if (typeof(settings.source) === 'function') {
                // just call the function
                var response_srvo = (settings.source)(selected_items);
                methods._response_received.call(this, response_srvo);
            }
            else {
                // 1. In an ajax call, request the data given the current selected_items
                // 2. methods._response_received.call(this, response_srvo);
            }
        },
        _response_received : function(response_srvo) {
            //
            // Response looks like: 
            // {
            //    item_ids : ["id22", ... ],
            //    items : {
            //      "id22" : {
            //         type: "Video Cards",
            //          img: "http://www.placehold.it/60x60",
            //          val: 45.3,
            //        title: "The product 22",
            //         link: "http://www.wikipedia.com/product22"  (optional)
            //      },
            //      ...
            //    },
            //    selection : ['id51', 'id33']
            // }

            // set html of the items
            this.find("section").html(
                methods._items_to_html.call($(this), 
                    response_srvo.item_ids, 
                    response_srvo.items
                )
            );

            // apply the selection
            var summary_html = '';
            var summary_val = 0;
            $(response_srvo.selection).each(function(i, item_id) {
                // select item in the current list
                settings.selectItem(item_id)

                // add selection to the summary
                var item = response_srvo.items[item_id];
                summary_html += settings.selectedItemSummaryHtmlTemplate(item_id, item);
                summary_val += item.val;
            });

            // final items in the summary html...
            summary_html += settings.summaryValueHtmlTemplate(summary_val);
            summary_html += settings.summaryActionsHtmlTemplate();
            summary_html += '<a href="#">' + settings.actionText + '</a>';

            // write summary html
            this.find("aside").html(summary_html);
        },
        _items_to_html : function(item_ids, items) {
            var htmls = {};
            var categories = [];
            $(item_ids).each(function(i,item_id){
                var item = items[item_id];

                // create category if it doesn't exist
                var c = item.type;
                if (!htmls[c]) {
                    htmls[c] = []; 
                    categories.push(c); 
                }

                // push this item into it's own category
                htmls[c].push(settings.itemHtmlTemplate(item_id, item));
            });

            // now render each category
            var html = '';
            $(categories).each(function(i,c) {
                html += settings.categoryHtmlTemplate(c);

                // add all the items belonging to this category
                $(htmls[c]).each(function(i, item_html) {
                    html += item_html;
                });
            });

            return html;
        }
    };

    $.fn.objectMaker = function(method) {

        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.objectMaker' );
        }    
    };

})(jQuery);
