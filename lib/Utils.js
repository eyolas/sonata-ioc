/**
* Taken directly from jquery
* return {Int} the position of the element in the array
*/
exports.inArray = function(elem, array) {

    if(array.indexOf) {
        return array.indexOf(elem);
    }

    for( var i = 0, length = array.length; i < length; i++) {
        if(array[i] === elem) {
            return i;
        }
    }

    return -1;
};

/**
* Returns true if the passed string is deemed to be a proto reference. That is, it starts with a *, has length
* longer that 1 and the second char is not a *
* @param {String} str
* @return {boolean}
*/
exports.matchProtoRefString = function(str) {
    return (typeof str === "string" && str.match(/^\*[^\*]/) !== null);
};

/**
* Splits a comma delimited string
* @return {Array}
*/
exports.splitCommaDelimited = function(str) {

    if(str) {
        return str.split(/\s*,\s*/);
    }
    return [];
};

/**
* merge 2 object
* @param {Object} a
* @param {Object} b
* @return {Object}
*/
exports.merge = function(a, b) {
    var newObj = {};

    for (var i in a) {
        newObj[i] = a[i];
    }

    for (var i in b) {
        newObj[i] = b[i];
    }

    return newObj;
};

// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.(see underscorejs)
['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'].forEach(function(name) {
    exports['is' + name] = function(obj) {
        return toString.call(obj) == '[object ' + name + ']';
    };
});
//
//
exports.mergeConfig = function (conf, confBean) {
    var newConfig = exports.merge(conf, confBean);
    if (undefined !== confBean.args) {
        if (undefined !== conf.args) {
            newConfig.args = Array.concat(conf.arg, confBean.args);
        } else {
            newConfig.args = confBean.args;
        }
    }

    if (undefined !== confBean.props) {
        if (undefined !== conf.props) {
            newConfig.props = exports.merge(conf.props, confBean.props);
        } else {
            newConfig.props = confBean.props;
        }
    }

    return newConfig;
};
