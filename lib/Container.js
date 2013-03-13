var ProtoFactory = require('./ProtoFactory'),
    glob = require('glob'),
    Utils = require('./Utils'),
    fs = require('fs'),
    path = require('path');

var defaultConfig = {
    "log": true,
    "injectAppContext": false,
    "iocJsonName": "ioc"
};

var REGEX_IS_PATH = /[\/\\:]/;


/**
 * Create a new AppContext with config
 *
 * @constructor
 * @param {object} conf
 */
function Container(conf) {
    this.config = conf || {};
    this.config = Utils.merge(defaultConfig, this.config);

    if (!this.config.hasOwnProperty('dirs')) {
        throw new Error('Error dirs to contain is mandatory');
    } else {
        this.dirs = this.config.dirs;
        if (!Array.isArray(this.config.dirs)) {
            this.dirs = [ this.config.dirs ];
        }

        if (this.config.hasOwnProperty('execDir')) {
            var execDir = this.config.execDir;
            this.dirs.forEach(function(element, index, array) {
                array[index] = path.resolve(execDir, element);
            });
        }
    }
    this.containerConfig = require('./ConfigManagers/ContainerConfig.js')
    this._buildConfigContainer();
    this.protoFactory = new ProtoFactory(this.config.injectAppContext);
    this.protoFactory.appContext = this;
}

/**
 * Build the config container
 * @private
 */
Container.prototype._buildConfigContainer = function() {
    this._addAllFilesInDirsOnContainer();
    this._loadIocConfigs();
};

/**
 * load ioc config file json
 * @private
 */
Container.prototype._loadIocConfigs= function() {
    this.dirs.forEach(function(pathSearch) {
        var files = new glob.sync("**/" + this.config.iocJsonName + ".json", {cwd : pathSearch});


        files.forEach(function(file) {
            var pathOfFile = path.resolve(pathSearch, file);
            var dirOfFile = path.dirname(path.resolve(pathSearch, file));
            var configs = this._getConfigOnFile(pathOfFile);
            for (var key in configs) {
                var conf = configs[key];
                if (undefined === conf.module) {
                    continue;
                }
                var modulePath = path.resolve(dirOfFile, conf.module);
                if (!REGEX_IS_PATH.test(conf.module)) {
                    modulePath = conf.module;
                }
                conf.module = modulePath;

                this.containerConfig.addConfig(key, conf);
            }

        }, this);
    }, this);
};

/**
 * Get configuration on file
 * @param {string} pathFile
 * @returns {object} configuration in file
 * @private
 */
Container.prototype._getConfigOnFile = function(pathFile) {
    var config = {};
    if (fs.existsSync(pathFile)) {
        var file = fs.readFileSync(pathFile, 'utf8');
        try {
            config = JSON.parse(file);
        } catch (err) {
            console.log('container.json must be a valid json : ' + err);
        }
    }
    return config;
};

/**
 * Get all files for add it in container
 * @private
 */
Container.prototype._addAllFilesInDirsOnContainer = function() {
    this.dirs.forEach(function(pathSearch) {
        var files = new glob.sync("**/*.js", {cwd : pathSearch});
        this._addFiles(files, pathSearch);
    }, this);
};

/**
 * Add files on container
 * @param {array.<string>} files
 * @param {string} pathSearch
 * @private
 */
Container.prototype._addFiles = function(files, pathSearch) {
    files.forEach(function(file, i) {
        var fileName = path.basename(file);
        var fileDir = path.dirname(path.resolve(pathSearch, file));

        var modulePath = path.resolve(fileDir, fileName);
        var obj = {module: modulePath}
        if (this.config.injectAppContext) {
            obj.injectAppContext = true;
        }

        this.containerConfig.addConfig(path.basename(fileName, '.js'), obj);
    }, this);
};



/**
 * Gets a proto using the proto id to create it using the application config
 * Takes a variable list of proto ids as arguments, the final argument must be a callback function
 * @param {string} protoId
 */
Container.prototype.getProto = function(protoId) {
    return this.protoFactory.getProto(protoId);
};

/**
 * Gets a proto using the proto id to create it using the application config
 * Takes a variable list of proto ids as arguments, the final argument must be a callback function
 * @param {string|array} protoIds
 * @param {Function} onSuccess
 * @param {Function} onError
 */
Container.prototype.getProtos = function(protoIds, onSuccess, onError) {
    if (!Utils.isFunction(onSuccess)) {
        throw new Error('onSuccess must be an function');
    }

    if (!Utils.isFunction(onError)) {
        onError = function(){};
    }

    var self = this;

    //convert single proto id to array
    if(typeof protoIds === "string") {
        protoIds = [ protoIds ];
    }

    var protos = [], proto;
    for(var i = 0, protoLength=protoIds.length; i < protoLength; i++) {
        try {
            proto = self.protoFactory.getProto(protoIds[i]);
            protos.push(proto);
        } catch(e) {
            if (Utils.isFunction(onError)) {
                onError.apply(self, e);
            }
        }
    }

    onSuccess.apply(self, protos);
};

module.exports =  Container;