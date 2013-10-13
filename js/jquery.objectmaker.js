(function($) {
    var settings = {
        /* the default source of our data */
        source: 'http://localhost:8000/configurator',  

        // use a comma to separate each id of the selection in the POST request
        json_selection_separator : ',',  

        remove_item_on_selection: false,

        /* 
         * For CSS targeting. The layout will be: 
         * .----------------. <-- div you called this object on
         * |.--------------.|
         * ||#config_header||
         * | -------------- | 
         * |.---------..---.|
         * ||#config_m||#co||
         * ||ain      ||nfi||
         * ||         ||g_s||
         * ||         ||umm||
         * ||         ||ary||
         * | ---------  --- |
         * |.--------------.|
         * ||#config_footer||
         * | -------------- | 
         * |________________|
         */
        headerSectionHtmlId  : "config_header",
        mainSectionHtmlId    : "config_main",
        summarySectionHtmlId : "config_summary",
        footerSectionHtmlId  : "config_footer",
        itemSectionHtmlId    : "item",

        /*
         * These are related to the categories and individual items added
         * under #config_main. When items are added, this section will look
         * like:
         *  -------------------------   <- the #config_main div
         * | categoryhtmltemplate    |
         * |- - - - - - - - - - - - -|
         * | itemHtmlTemplate        |
         * |- - - - - - - - - - - - -|
         * | itemHtmlTemplate        |
         * |- - - - - - - - - - - - -|
         * | itemHtmlTemplate        |
         * |- - - - - - - - - - - - -|
         * | categoryhtmltemplate    |
         * |- - - - - - - - - - - - -|
         * | itemHtmlTemplate        |
         * |- - - - - - - - - - - - -|
         * | itemHtmlTemplate        |
         * |   ... and so on         |
         *  -------------------------
         */
        beginCategoryHtmlTemplate : function(category) {
            return '<section class="category">' 
                + '<h3 class="category_name">' + category + '</h3>';
        },
        itemHtmlTemplate : function(item_id, item) {
            return '<article class="' + settings.itemSectionHtmlId + '" id="' + item_id + '">'
                + '   <img class="item_img" src="' + item.img + '"/>'
                + '   <div class="item_val">' + item.val + ' ' + item.symbol + '</div>'
                + '   <div class="item_title">' + item.title + '</div>'
                + '</article>';
        },
        endCategoryHtmlTemplate : function(category) {
            return '</section>';
        },
        

        /*
         * These are related to the summary column, which looks like:
         *   ---------------------------  <- the #config_summary div
         *  | summaryHeaderHtmlTemplate |
         *  |- - - - - - - - - - - - - -|
         *  | selectedItemHtmlTemplate  |  <-- a sequence of these
         *  |- - - - - - - - - - - - - -|
         *  | summaryValueHtmlTemplate  |
         *  |- - - - - - - - - - - - - -|
         *  | summaryFooterHtmlTemplate |
         *   - - - - - - - - - - - - - -
         */
        summaryHeaderHtmlTemplate : function() {
            return '<h4 class="summary_header">Your Configuration</h4><ul class="summary_item_list">';
        },
        itemRemoveCssClass : 'summary_item_remove',
        selectedItemSummaryHtmlTemplate : function(item_id, item) {
            return '<li><a href="#" class="' + settings.itemRemoveCssClass +'">&times;</a><b>' + item.type + '</b><br/> <img style="height:16px; width:16px;" src="' + item.img + '"> ' + item.title+ '</li>';
        },
        summaryValueHtmlTemplate : function(summary_val) {
            return '</ul><h2 class="summary_total_expense">Total expense: <em>' + summary_val + ' &euro;</em></h2>';
        },
        resetSelectionCssClass : 'summary_reset',
        summaryFooterHtmlTemplate : function () {
            return '<footer class="summary_footer"><button class="'+settings.resetSelectionCssClass+'">Start Over</button></footer>';
        },

        /*
         * Callbacks. Called whenever an item needs to appear
         * selected/selectable/unselected.
         */
        onItemSelected: function(item_id) {
            // the item is selected
            $('#' + item_id )
                .removeClass('selectable')
                .removeClass('unselected')
                .addClass('selected');
        },
        onItemSelectable: function(item_id) {
            $('#' + item_id )
                .addClass('selectable')
                .removeClass('unselected')
                .removeClass('selected');
        },
        onItemUnselected: function(item_id) {
            $('#' + item_id )
                .removeClass('selectable')
                .addClass('unselected')
                .removeClass('selected');
        },
        onResetSelection: function() {
        },
        onServerRequestingData: function() {  // data is being requested...
        },
        onServerSuccess: function() {   // data has been successfully retrieved...
        },
        onServerError: function(txt_error) {  // data hasn't been successfully retrieved...
        },
        onServerComplete: function() {  // server request completed (error or success)
        },

        /*
         * Callback. Called when the last selected item has caused some
         * elements to be deleted.
         */
         onConflictsDetected: function(item_id, item, conflicting_items) {
            return true;  // resolve the conflict directly (i.e., delete the items)
            return false; // let me handle it, will ask for a confirmation first...
         }
    };

    var methods = {
        /*
         * Initialize the object maker. Creates initial markup for the
         * configurator using the parameters provided.
         */
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
                        items : {},
                        // stores the last selection sent from the server that will involve
                        // deleting some items.
                        last_no_conflicts_selection : []
                    };
                    $this.data('objectmaker', data);

                    // inital skeleton of the configurator
                    $this.html(
                        '<header id="' + settings.headerSectionHtmlId + '"></header>'
                        + '<section id="' + settings.mainSectionHtmlId + '"></section>'
                        + '<aside id="' + settings.summarySectionHtmlId+ '"></aside>'
                        + '<section id="' + settings.footerSectionHtmlId + '"></section>'
                    );

                    // request data the first time (will get all of the items)
                    methods._request_items.call($this);

                    // automatically select element
                    $this.on('click', "." + settings.itemSectionHtmlId, function(event) {
                        var clicked_item_id = $(this).attr('id');

                        // if this item is already selected, unselect it
                        // otherwise select it.
                        data = $this.data('objectmaker');
                        var item_selected_position 
                            = data.selection.indexOf(clicked_item_id);

                        if (item_selected_position == -1) {
                            methods.item_selected.call($this, clicked_item_id);
                        }
                        else {
                            methods.item_deselected.call($this, clicked_item_id);
                        }
                    });
                    // remove item
                    $this.on('click', "." + settings.itemRemoveCssClass, function(event) {
                        var clicked_offset_top = $(this).offset().top;

                        // exhamine each item, until the current one is found
                        var idx_to_delete = -1;
                        var data = $this.data('objectmaker');
                        $("." + settings.itemRemoveCssClass).each(function(i,v) {
                            if ($(v).offset().top == clicked_offset_top) {
                                // delete this from the selection 
                                idx_to_delete = i;
                            }
                        });
                        if (idx_to_delete != -1) {
                            var item_id = data.selection[idx_to_delete];
                            methods.item_deselected.call($this, item_id);
                        }
                        return false;
                    });
                    // reset selection
                    $this.on('click', "." + settings.resetSelectionCssClass, function(event) {
                        data = $this.data('objectmaker');
                        data.selection = [];
                        $this.data('objectmaker', data);
                        methods._request_items.call($this);
});
                }
                else {
                    $.error("Cannot initialize an objectMaker twice");
                }
            });
        },
        resolve_conflicts : function() {
        /*
         * Resolves the last conflicts detected. An array containing the
         * expected selection is already stored internally.
         */
         var data = this.data("objectmaker");
         if (data.last_no_conflicts_selection.length > 0) {
            $this = $(this);

            // store the new selection
            data.selection = data.last_no_conflicts_selection;  
            
            // clear the conflicting selection (it will be resolved soon)
            data.last_no_conflicts_selection = [];
    
            // perform the request as if the user had chosen the conflicting item.
            methods._request_items.call($this, true);
         }
        },

        /*
         * Public method called by the client to signal that an item was
         * selected. Will trigger a request to the server with related
         * handling of the response.
         */
        item_selected : function (item_id) {
            var $this = $(this);

            // update selection
            var data = $this.data('objectmaker');

            // must unselect all elements from the same type as the object
            data.selection = data.selection.filter(function(x){
                return data.items[x].type !== data.items[item_id].type
            });

            // just select this item
            data.selection.push(item_id);

            $this.data('objectmaker', data);  // store back

            // request to server (and handle response)
            methods._request_items.call($this);

            return $this;
        },
        item_deselected : function (item_id) {
            var $this = $(this);

            // update selection
            var data = $this.data('objectmaker');
            var found_at = data.selection.indexOf(item_id);
            if ( found_at > -1) {
                data.selection.splice(found_at, 1);
                $this.data('objectmaker', data);  // store back

                // request to server (and handle response)
                methods._request_items.call($this);
            }

            return $this;
        },


        /* 
         * Send the current selection to the server and, based on that,
         * receive:
         * 1) current selection (server has validated it)
         * 2) items that need to be available for the next selection
         * 3) in what order they should appear in the visualization
         */
        _request_items : function(ignore_conflicts) {
            var selected_items = this.data('objectmaker').selection;

            if (typeof settings.source === 'function') {
                // user is providing a logic him/herself - just call it
                var response_srvo = (settings.source)(selected_items);
                if (ignore_conflicts) { response_srvo.conflicts = []; }
                methods._response_received.call(this, response_srvo);
            }
            else if (typeof settings.source === 'object') {
                // user is providing the data, so, we use our own logic
                var user_items = settings.source.items;
                var user_mutexes = settings.source.mutexes;
                var response_srvo = (methods._handle_items_selected)(
                    selected_items, user_items, user_mutexes
                );
                if (ignore_conflicts) { response_srvo.conflicts = []; }
                methods._response_received.call(this, response_srvo);
            }
            else if (typeof settings.source === 'string') {
                // 1. In an ajax call, request the data given the current selected_items
                // 2. methods._response_received.call(this, response_srvo);
                settings.onServerRequestingData();
                var that = this;
                $.ajax(settings.source, {
                    data : selected_items.join(settings.json_selection_separator),
                    dataType : "json",
                    type: 'POST',
                    success: function(response_srvo, txt_status, xhr) {
                        settings.onServerSuccess();
                        methods._response_received.call(that, response_srvo);
                    },
                    error: function(xhr, txt_status, txt_error) {
                        settings.onServerError(txt_error);
                    },
                    complete: function(xhr, txt_status) {
                        settings.onServerComplete();
                    }
                });
            }
        },
        
        /*
         * Augments the array of conflicting products with the complete
         * structure returned from the server.
         */
        _expand_conflicts_array : function(srvo_conflicts) {
            var items_data = this.data("objectmaker");
            return srvo_conflicts.map(function(x){ return items_data.items[x]; });
        },
        /*
         * Some logic that based on item data and mutexes provided by the user
         * will deal with the user selection and return the expected data
         * structures.
         *
         * - item data: data about items that potentially make up the object.
         *
         *     For example:
         *     {
         *        "P16" : {
         *          type: "Case",
         *          img: "http://www.placehold.it/120x120",
         *          val: 100,
         *          symbol: "&euro;",
         *          title: "Small Case type 1 (Incompatible with 3DFX)"
         *        },
         *        ...
         *     }
         *
         * - mutexes: object of the form
         *
         *     {
         *       "<id>" : [<id1>,<id2>],
         *       ...
         *     }
         *     
         *     which tells objectmaker that <id> is not compatible with <id1>
         *     and <id2>.
         */
        _handle_items_selected : function(selection_array, items, mutexes) {
            var response = {
                selection : [], // contains the validated selection
                item_ids : [], // we are going to fill this up using the
                               // keys later on.
                items : {}
            };

            var are_items_compatible = function (a, b) {
                if (a in mutexes && mutexes[a].indexOf(b) > -1) return 0;
                if (b in mutexes && mutexes[b].indexOf(a) > -1) return 0;
                if (items[a].type == items[b].type) return 0;
                return 1;
            }

            var incompatible_items = {};

            // put first item
            if (selection_array.length) {
                var last_selected = selection_array.pop();
                response.selection.unshift(last_selected);
            }

            // keep the conflicts
            var conflicts_array =[];
            
            // remove from selection whatever is not compatible with
            // the items currently selected
            while (selection_array.length > 0) {
                // candidate items in the selection array
                // come sorted from oldest to newly selected.
                // The last element corresponds to the item
                // the user has just selected.
                var next_candidate = selection_array.pop();

                // check if the next selected item is actually
                // compatible with the items selected so far
                var is_next_candidate_compatible = 1;
                var current_selection_length = response.selection.length;
                for (var i=0, I=current_selection_length; i<I; i++) {
                    var item = response.selection[current_selection_length-i-1];
                    if (!are_items_compatible(item, next_candidate)) {
                        is_next_candidate_compatible = 0;
                        break;
                    }
                }

                // add it to the selection if is compatible
                if (is_next_candidate_compatible) {
                    // select this item
                    response.selection.unshift(next_candidate);
                }
                else {
                    // keep track of the conflict
                    conflicts_array.push(next_candidate);
                }
            }

            // now from the validated selection, build an object that
            // indexes non-compatible items
            for (var idx=0, IDX=response.selection.length; idx<IDX; idx++) {
                var sel_item = response.selection[idx];
                if (sel_item in mutexes) {
                    for (var i=0, I=mutexes[sel_item].length; i<I; i++) {
                        incompatible_items[mutexes[sel_item][i]] = 1;
                    }
                }
            }

            // send all items if the selection was empty
            if (response.selection.length == 0) {
                response.items = items;
            }

            // now decide which items should be shown
            for (x in items) {
                if (!(x in incompatible_items)
                    && (-1 == response.selection.indexOf(x))) {

                    response.item_ids.push(x);
                }
            }

            // if the last item selected generated
            // conflicts, return the conflicting items as well.
            response.conflicts = [];
            if (conflicts_array.length > 0) {
                response.conflicts = conflicts_array;
            }

            return response;
        },
        /*
         * Update the markup based on the data received from the server in
         * response to a selection.
         *
         * Response looks like: 
         * {
         *    item_ids : ["id22", ... ],
         *    items : {
         *      "id22" : {
         *         type: "Video Cards",
         *          img: "http://www.placehold.it/60x60",
         *          val: 45.3,
         *        title: "The product 22",
         *         link: "http://www.wikipedia.com/product22"  (optional)
         *      },
         *      ...
         *    },
         *    selection : ['id51', 'id33'],
         *    conflicts : ['id33', 'id11', 'id34'],  (items that will be deleted)
         * }
         */
        _response_received : function(response_srvo) {
            // update cache if server sends new data
            var data = this.data("objectmaker");
            var is_new_data_received = false;
            for (item in response_srvo.items) {
                data.items[item] = response_srvo.items[item];
                is_new_data_received = true;
                this.data("objectmaker", data);  // need to save here, important!
            }

            // prepare in case of conflicts...
            var srvo_conflicts = response_srvo.conflicts;
            var conflicts_data = methods._expand_conflicts_array.call(this, srvo_conflicts);
            var last_sel_item = response_srvo.selection[response_srvo.selection.length-1];
            
            // check for conflicts. If the selected item caused some other
            // items to be selected we should warn the user, and only proceed
            // under explicit consent. Last item of the selection is the last
            // selected item.
            if (response_srvo.conflicts.length > 0 && response_srvo.selection.length > 0
                 && ! settings.onConflictsDetected(
                        last_sel_item,
                        data.items[last_sel_item],
                        conflicts_data))  {
                
               // user did not give consent immediately. Let's store the action
               // and retry later.
               data.last_no_conflicts_selection = response_srvo.selection;
            }
            else {
                // display the new data in case they have changed or we force to do
                // so...
                if (is_new_data_received
                        || settings.remove_item_on_selection) {

                    // set html of the items
                    this.find("#" + settings.mainSectionHtmlId).html(
                        methods._items_to_html.call($(this), 
                            response_srvo.item_ids, 
                            data.items
                        )
                    );
                }

                // we must select what is selected and unselect what is not.
                for (var item_id in data.items) {   /* unselect all */
                    if (data.items.hasOwnProperty(item_id)) {
                        settings.onItemUnselected(item_id);
                    }
                }
                for (var i=0, I=response_srvo.item_ids.length; i<I; i++) {
                    var item_id = response_srvo.item_ids[i];
                    settings.onItemSelectable(item_id); 
                }

                // initial content of the summary is the header...
                var summary_html = settings.summaryHeaderHtmlTemplate();

                // ... then each selected item
                var summary_val = 0;
                $(response_srvo.selection).each(function(i, item_id) {
                    var item = data.items[item_id];

                    settings.onItemSelected(item_id);

                    summary_html += 
                        settings.selectedItemSummaryHtmlTemplate(item_id, item);

                    summary_val += item.val;

                });

                // ... finally the summary value (e.g., total) and the footer.
                summary_html += settings.summaryValueHtmlTemplate(
                        summary_val
                );
                summary_html += settings.summaryFooterHtmlTemplate();

                // write summary html
                this.find("aside").html(summary_html);

                // save the new selection
                data.selection = response_srvo.selection.slice();
            }
            this.data("objectmaker", data);
        },

        /*
         * Helper function to turn the list of items received from the server
         * and their order into html markup. Renders items in order within
         * each category.
         */
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
                html += settings.beginCategoryHtmlTemplate(c);

                // add all the items belonging to this category
                $(htmls[c]).each(function(i, item_html) {
                    html += item_html;
                });

                html += settings.endCategoryHtmlTemplate(c);
            });

            return html;
        }
    };

    /*
     * The logic that handles method calling.
     */
    $.fn.objectMaker = function(method) {
        if (methods[method]) {
            return methods[method].apply(
                this, Array.prototype.slice.call(arguments, 1)
            );
        } else if (typeof method === 'object' || !method ) {
            return methods.init.apply(this, arguments);
        } else {
            $.error(
                'Method ' +  method + ' does not exist on jQuery.objectMaker' 
            );
        }    
    };

})(jQuery);
