/**
 * The proto factory is responsible for creating instances of defined objects using the config tree
 */
var DependencyTree = require('./DependencyTree.js');
var Utils = require('./Utils.js');
var path = require('path');

/**
 * Create a new ProtoFactory with config
 *
 * @constructor
 * @param {Object} config
 */
var ProtoFactory = function(injectAppContext) {

    this.config = require('./ConfigManagers/ContainerConfig');
    this.appContext = null;

    this.injectAppContext = injectAppContext;

    //cache of loaded dependencies
    this.moduleMap = {};
    this.cacheDeps = {};
    this.cacheInstance = {};
};

/**
 * Gets a proto given an id
 * The parsing also looks for an optional interface id using square brackets notation. E.g. protoId[interfaceId]
 * @param {String} protoRef a proto reference string
 * @param {Object} depTree
 * @return {Object} A reference to a javascript object
 */
ProtoFactory.prototype.getProto = function(protoId, depTree) {

    depTree = depTree || new DependencyTree();

    var protoConf = this.getProtoConfig(protoId);
    this.loadProtoModule(protoConf.module);
    var instance = null;

    //default scope singleton
    if (!protoConf.scope) {
        protoConf.scope = 'singleton';
    }

    if (protoConf.scope !== 'singleton' && protoConf.scope !== 'static' && protoConf.scope !== 'prototype') {
        protoConf.scope = 'singleton';
    }


    if (protoConf.scope === "singleton" && this.cacheInstance.hasOwnProperty(protoId)) {
        return this.cacheInstance[protoId];
    }

    if (protoConf.scope === "static") {
        if (undefined !== this.moduleMap[protoConf.module]) {
            return this.moduleMap[protoConf.module];
        } else {
            this.moduleMap[protoConf.module] = require(protoConf.module);
            return this.moduleMap[protoConf.module];
        }

    }
    var nextNode = depTree.addChild();

    var injectAppContext =
        this.injectAppContext === true && protoConf.injectAppContext !== false ||
            this.injectAppContext !== true && protoConf.injectAppContext === true;


    instance = this._createInstance(protoId, protoConf, injectAppContext, nextNode);

    // save instance if singleton
    if(protoConf.scope === "singleton") {
        this.cacheInstance[protoId] = instance;
    }

    return instance;
};

/**
 * Uses factory config to create a new instance
 *
 * @param {String} protoId {String|Object} this might be a string or an proto
 * @param {Object} protoConf
 * @param {Boolean} injectAppContext
 * @param {Object} depTree
 * @return {Object}
 */
ProtoFactory.prototype._createInstance = function(protoId, protoConf, injectAppContext, depTree) {

    var instance = null;
    var proto = this.moduleMap[protoConf.module];

    // constructor injection
    var args = this._createArgs(protoConf.args, depTree);


    instance = (function(args) {
        function F(args) {
            return proto.apply(this, args);
        }
        F.prototype = proto.prototype;

        return new F(args);
    })(args);

    //add the dependency to the dependency tree.
    depTree.addProto(protoId, instance);


    // property injection
    if(protoConf.props) {
        var propData = protoConf.props;
        for( var propName in propData) {
            if(propData.hasOwnProperty(propName)) {
                var propertyArgs = this._createArgs([ propData[propName] ], depTree);

                if(typeof instance[propName] === "function") {
                    propertyArgs[0] = Array.isArray(propertyArgs[0]) ? propertyArgs[0] : [ propertyArgs[0] ];
                    instance[propName].apply(instance, propertyArgs[0]);
                } else {
                    instance[propName] = propertyArgs[0];
                }
            }
        }
    }

    //create a reference to the app context
    if(this.appContext && injectAppContext) {
        instance.__appContext__ = this.appContext;
    }

    return instance;
};

/**
 * Uses factory config to create a new instance
 *
 * @param {String} factoryRef
 * @param {String} factoryMethod
 * @param {Object} depTree
 * @return {Object}
 */
ProtoFactory.prototype._getProtoFromFactory = function(factoryRef, factoryMethod, depTree) {
    console.log('factoryRef : ' + factoryRef);
    console.log('factoryMethod : ' + factoryMethod);
    var factory = this.getProto(factoryRef, depTree);
    console.log(factory);

    if(factoryMethod) {
        return factory[factoryMethod].apply(factory);
    } else {
        throw new Error("No factory method defined with " + factoryRef);
    }
};

/**
 * Scans arg config for values, generating dependencies where required
 *
 * @param {Array} confArgs
 * @param {Object} depTree
 * @return {Array}
 */
ProtoFactory.prototype._createArgs = function(confArgs, depTree) {

    // figure out constructors
    var args = [];
    if(confArgs) {
        var ref;
        for( var i = 0; i < confArgs.length; i++) {
            var argData = confArgs[i];

            // easier to deal with nulls here)
            if(argData === null || typeof argData === "undefined") {
                args[i] = argData;
                continue;
            }

            var isObject = typeof argData === "object" && !Array.isArray(argData);

            if((isObject && argData.ref) || Utils.matchProtoRefString(argData)) {
                // if arg has references another proto
                ref = argData.ref || argData.substr(1);
                args[i] = this.getProto(ref, depTree);
            } else if(isObject && argData.factoryRef) {
                // if arg uses a factory
                args[i] = this._getProtoFromFactory(argData.factoryRef, argData.factoryMethod, depTree);
            } else if(isObject && argData.module) {
                // if arg uses an anonymous proto
                args[i] = this._createInstance("[anonymous]", argData, [], argData.injectAppContext, depTree);
            } else if(isObject) {
                args[i] = {};
                // if arg is object containing values
                for( var key in argData) {
                    if(argData.hasOwnProperty(key)) {
                        var obj = argData[key];
                        if(obj && (obj.ref || Utils.matchProtoRefString(obj))) {
                            // if object value is a reference
                            ref = obj.ref || obj.substr(1);
                            args[i][key] = this.getProto(ref, depTree);
                        } else if(obj && obj.factoryRef) {
                            // if object value uses a factory
                            args[i][key] = this._getProtoFromFactory(obj.factoryRef, obj.factoryMethod, depTree);
                        } else if(obj && obj.module) {
                            // if object value is an anonymous proto
                            args[i][key] =  this._createInstance("[anonymous]", obj, [], obj.injectAppContext, depTree);
                        } else {
                            //if object value is a literal value
                            args[i][key] = obj;
                        }
                    }
                }
            } else {
                // just a value
                args[i] = argData;
            }
        }
    }
    return args;
};


/**
 * Searches the config for a proto matching the specified id
 *
 * @param {String} id
 * @return {Object}
 */
ProtoFactory.prototype.getProtoConfig = function(id) {
    id = id.toString().trim();

    if(null !== this.config.getConfig(id)) {
        return this.config.getConfig(id);
    } else {
        throw new Error("No proto is defined for [" + id + "]");
    }
};

/**
 * Load Module
 * @param module
 */
ProtoFactory.prototype.loadProtoModule = function(module) {
    if (undefined === this.moduleMap[module]) {
        if (module.indexOf('->') !== -1) {
            var split = module.split('->');
            this.moduleMap[module] = require(split[0])[split[1]];
        } else {
            this.moduleMap[module] = require(module);
        }

    }
};

/**
 * Creates an array of dependencies by walking the dependency tree
 *
 * @param {String} id
 * @param {Object} depTree The function recursively creates a tree of dependencies
 * @return {Object} A tree of protos config objects which are dependencies
 */
ProtoFactory.prototype._getDependencies = function(id, depTree) {
    if (undefined !== this.cacheDeps[id]) {
        return this.cacheDeps[id];
    }

    var self = this;

    depTree = depTree || new DependencyTree();

    var protoConfig = this.getProtoConfig(id);

    depTree.addProto(id, null, true);

    this.loadProtoModule(protoConfig.module);



    var nextNode = depTree.addChild();

    //args
    if(protoConfig.args) {
        this._getDependenciesFromArgs(protoConfig.args, nextNode);
    }

    //props
    if(protoConfig.props) {
        for( var propName in protoConfig.props) {
            if(protoConfig.props.hasOwnProperty(propName)) {
                this._getDependenciesFromArgs([ protoConfig.props[propName] ], nextNode);
            }
        }
    }

    this.cacheDeps[id] = depTree;
    return depTree;
};

/**
 * Gets an array of dependencies from arguments config
 *
 * @param {Array} confArgs An array of arguments
 * @param {Object} depNode
 * @return {Object}
 */
ProtoFactory.prototype._getDependenciesFromArgs = function(confArgs, depNode) {

    if(confArgs) {
        var ref;
        for( var i = 0; i < confArgs.length; i++) {
            var argData = confArgs[i];

            // easier to deal with nulls here)
            if(argData === null || typeof argData === "undefined") {
                continue;
            }

            var isObject = typeof argData === "object";
            // if arg has ref
            if(isObject && argData.ref) {
                ref = argData.ref;
                this._getDependencies(ref, depNode);
            }
            else if(isObject && argData.factoryRef) {
                this._getDependencies(argData.factoryRef, depNode);
            }
            else if(isObject && argData.module) {
                depNode.addProto({
                    module: argData.module
                });
            }
            else if(isObject) {
                // if arg is object containing values
                for( var key in argData) {
                    if(argData.hasOwnProperty(key)) {
                        var obj = argData[key];
                        if(obj && obj.ref) {
                            this._getDependencies(obj.ref , depNode);
                        }
                        else if(obj && obj.factoryRef) {
                            this._getDependencies(obj.factoryRef, depNode);
                        }
                        else if(obj && obj.module) {
                            depNode.addProto({
                                module: obj.module
                            });
                        }
                    }
                }
            }
        }
    }
    return depNode;
};



module.exports = ProtoFactory;