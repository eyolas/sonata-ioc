var Utils = require('../Utils');

/**
 * Container config
 * @constructor
 */
function ContainerConfig() {
    var config = {};

    this.addConfig = function (beanName, confBean) {
        if (undefined !== config[beanName]) {
            config[beanName] = Utils.mergeConfig(config[beanName], confBean);
        } else {
            config[beanName] = confBean;
        }
    };

    this.getConfig = function(beanName) {
        if (config.hasOwnProperty(beanName)) {
            return config[beanName];
        } else {
            return null;
        }
    };

    this.getAllConfig = function () {
        return config;
    };

    if (ContainerConfig.caller != ContainerConfig.getInstance) {
        throw new Error("This object cannot be instanciated");
    }
}

/* ************************************************************************
 SINGLETON CLASS DEFINITION
 ************************************************************************ */
ContainerConfig.instance = null;

/**
 * Singleton getInstance definition
 * @return singleton class
 */
ContainerConfig.getInstance = function () {
    if (this.instance === null) {
        this.instance = new ContainerConfig();
    }
    return this.instance;
};

module.exports = ContainerConfig.getInstance();
