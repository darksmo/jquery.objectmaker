jquery.objectmaker
==================

Jquery plugin that lets user create and customize a particular real-life object
like a computer or a car.

The plugin works under the assumptions that the target object is made up of
items belonging to a certain number of categories.  Each category contains many
items, and items within one category are mutually exclusive.

Features:
  - handles cross-category mutually exclusive items;
  - you can provide the data of the items and use built-in logic to handle
    user's selections;
  - you can provide your own logic to handle a user's selection;
  - you can fully customize the output markup or parts of it;
  - you can easily build a confirmation dialog on top of this plugin to show
    the users what elements are going to be deleted;
  - event callbacks (in case you have to perform other actions).

Future Plans:
  - call server side logic
  - show price deltas based on current selection

Quick Start:

  1. include css jQuery and javascripts in your html
  
        <head>
          <link rel="stylesheet" href="css/style.css" type="text/css">
          <script type="text/javascript" src="js/jquery-1.7.2.min.js"></script>
          <script type="text/javascript" src="js/jquery.objectmaker.js"></script>
        </head>
  
  2. create a <section> containing your configurator
        ...
        <body>
          <section id="configurator"></section>
        </body>
        ...
  
  3. initialize objectmaker on #configurator
  
     <script type="text/javascript">
              var config = $("#configurator").objectMaker({
                  source: {
                      // define mutually exclusive products.
                      // the line below means: item "P128" is not compatible with items "P16" and "P256".
                      "mutexes" : {
                          "P128" : ["P16", "P256"],
                          // ... more mutexes
                      },
                      "items" : {
                          "P16" : {
                            type: "Case",
                            img: "http://www.placehold.it/120x120",
                            val: 100,
                            symbol: "&euro;",
                            title: "Small Case type 1 (Incompatible with 3DFX)"
                          },
                          // ... more items
                      }
                  }
            });
     </script>
