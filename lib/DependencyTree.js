/**
 * Tree structure to manage dependencies
 */

/**
 * Dependency Node/Tree
 * @constructor
 */
var DependencyNode = function() {

    this.protos = [];
    this.children = [];
    this.parent = null;
};

/**
 * Adds a new child to this node
 * @return {DependencyNode}
 */
DependencyNode.prototype.addChild = function() {

    var child = new DependencyNode();
    child.parent = this;
    this.children.push(child);
    return child;
};

/**
 * Returns the children of this node
 * @return {Array}
 */
DependencyNode.prototype.getChildren = function() {
    return this.children;
};

/**
 * Returns this nodes parent
 * @return {DependencyNode}
 */
DependencyNode.prototype.getParent = function() {
    return this.parent;
};

/**
 * Adds a proto to the current node
 * @param {String} id The proto id
 * @param {String} instance An optional instance of the proto
 */
DependencyNode.prototype.addProto = function(id, instance) {
    this.protos.push({
        id: id,
        instance: instance || null
    });
};

module.exports = DependencyNode;