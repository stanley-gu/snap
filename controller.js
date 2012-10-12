var NODESIZE = {
    reaction: 2,
    species: 8
};

var sbmlDoc;
var $sbmlDoc;
var text;
var circle;
var path;

var simpleModel;
var glycolysisModel;

$.get('./00011-sbml-l2v4.xml', function(data) {
    simpleModel = (new XMLSerializer()).serializeToString(data);
});

$.get('./Jana_WolfGlycolysis.xml', function(data) {
    glycolysisModel = (new XMLSerializer()).serializeToString(data);
});


$("textarea").val(simpleModel);

$("#helpText").hide();

$("button#btnLoadSimple").click(function() {
    $("textarea").val(simpleModel);
});

$("button#btnLoadGlycolysis").click(function() {
    $("textarea").val(glycolysisModel);
});


var links = [];
var nodes = {};

$("button#btnViewNetwork").click(function() {
    var str = $("textarea").val();
    $("p").hide("slow");
    $("textarea").hide("slow");
    $("button").hide("slow");
    $("#helpText").show("slow");


    sbmlDoc = $.parseXML(str);
    $sbmlDoc = $(sbmlDoc);
    
    
    // generating nodes from listOfSpecies
    $sbmlDoc.find("species").each(function(n) {
        nodes[this.getAttribute('id')] = {
            name: this.getAttribute('id'),
            compartment: this.getAttribute('compartment'),
            initialAmount: this.getAttribute('initialAmount'),
            substanceUnits: this.getAttribute('substanceUnits'),
            type: 'species',
            boundaryCondition: this.getAttribute('boundaryCondition') || false
        };
    });
    
    // creating nodes from reactions
    $sbmlDoc.find("reaction").each(function(n) {
        var reactionName = this.getAttribute('id');
        nodes[reactionName] = {
            name: reactionName,
            type: 'reaction',
            reversible: this.getAttribute('reversible') || false,
            fast: this.getAttribute('fast') || false,
            listOfReactants: $(this.getElementsByTagName('listOfReactants')).find('speciesReference'),
            listOfProducts: $(this.getElementsByTagName('listOfProducts')).find('speciesReference'),
            kineticLaw: this.getElementsByTagName('kineticLaw')[0]
        };
        
        // making links from reactants to reaction node
        var reactants = nodes[reactionName].listOfReactants;
        for (var i = 0; i < reactants.length; i++) {
            var species = reactants[i].getAttribute('species');
            links.push({
                source: nodes[species],
                target: nodes[reactionName],
                type: 'toProduct'
            });
        }
        // making links from reaction node to products
        var products = nodes[reactionName].listOfProducts;
        for (var i = 0; i < products.length; i++) {
            var species = products[i].getAttribute('species');
            links.push({
                source: nodes[reactionName],
                target: nodes[species],
                type: 'fromReactant'
            });
        }
            
    });
    
    // parsing SBML DOM for parameter info


    var w = window.innerWidth*.9,
        h = window.innerHeight*.7;

    var force = d3.layout.force().nodes(d3.values(nodes)).links(links).size([w, h]).linkDistance(60).linkStrength(1).charge(-300).on("tick", tick).start();

    //    var force = d3.layout.force()
    //    .on("tick", tick)
    //    .size([w, h])
    //    .start();


    var svg = d3.select("body").append("svg:svg").attr("width", w).attr("height", h);
    // Making a border around SVG drawing area
    svg.append("svg:rect").attr("width", w).attr("height", h).attr("style", "fill:rgb(255,255,255);stroke-width:1;stroke:rgb(0,0,0)");
    
    // Per-type markers, as they don't inherit styles.
    svg.append("svg:defs").selectAll("marker").data(["toProduct", "licensing", "resolved"]).enter().append("svg:marker").attr("id", String).attr("viewBox", "0 -5 10 10").attr("refX", 15).attr("refY", - 1.5).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto").append("svg:path").attr("d", "M0,-5L10,0L0,5");

    path = svg.append("svg:g").selectAll("path").data(force.links()).enter().append("svg:path").attr("class", function(d) {
        return "link " + d.type;
    }).attr("marker-end", function(d) {
        return "url(#" + d.type + ")";
    });

    circle = svg.append("svg:g").selectAll("circle").data(force.nodes()).enter().append("svg:circle")
    //.attr("r", function(d) {return nodeSize[d.type]; })
    .attr("r", function(d) {
        return getNodeSize(d.name);
    }).on("click", click).call(force.drag);

    // adding titles to the nodes
    circle.append("title").text(function(d) {
        if (d.type == 'species') {
            var t = 'Initial Concentration: ';
            t += $sbmlDoc.find("listOfSpecies").find('#' + d.name).attr("initialAmount");

            return t;
        }
        else if (d.type == 'reaction') {
            return d.name;
        }
    });

    text = svg.append("svg:g").selectAll("g").data(force.nodes()).enter().append("svg:g");

    // A copy of the text with a thick white stroke for legibility.
    text.append("svg:text").attr("x", 8).attr("y", ".31em").attr("class", "shadow").text(function(d) {
        if (d.type == 'reaction') {
            return "";
        }
        else {
            return d.name;
        }
    });

    text.append("svg:text").attr("x", 8).attr("y", ".31em").text(function(d) {
        if (d.type == 'reaction') {
            return "";
        }
        else {
            return d.name;
        }
    });

});

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
    path.attr("d", function(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    });

    circle.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    });

    text.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    });
}


// get node size from the name of the node
function getNodeSize(name) {
    if (isReaction(name)) { //is a reaction node
        return NODESIZE.reaction;
    }
    else { // is a species node
        return NODESIZE.species;
    }
}

// return if name is a reactant or product aggregrate
function isReaction(name) {
    if ($sbmlDoc.find("listOfReactions").find("#" + name).length > 0) {
        return true;
    }
    else {
        return false;
    }
    //                    if ((name.search('[rp]') == 0) && (name.search('[0-9]') == 1)) {
    //                        return true;
    //                    }
    //                    else {
    //                        return false;
    //                    }
}


// Open dialog box on click.
function click(d) {
    var title;
    if (isReaction(d.name)) {
        $('#reactionEquation').children().detach();
        title = 'Reaction';
        $('#reactionEquation').append('<p>The equation for this reaction is:</p>');
        var equation = $sbmlDoc.find("#" + d.name).find("math").clone()[0];
        $('#reactionEquation').append(equation);
    } else {
        $('#reactionEquation').children().detach();
        title = 'Species';
        $('#reactionEquation').attr('title', 'Species');
        $('#reactionEquation').append('<p>The species node you selected is:</p>');
        $('#reactionEquation').append('<p>' + d.name + '</p>');
        $('#reactionEquation').append('<p></p>');
    }
    $('#reactionEquation').dialog({title: title});
    
    //        if (d.children) {
    //            d._children = d.children;
    //            d.children = null;
    //        }
    //        else {
    //            d.children = d._children;
    //            d._children = null;
    //        }
    //        update();
}

// Returns a list of all nodes under the root.
function flatten(root) {
    var nodes = [],
        i = 0;

    function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        if (!node.id) node.id = ++i;
        nodes.push(node);
    }

    recurse(root);
    return nodes;
}