var a = require('./a'),
    inherits = require('util').inherits;

function b(){
    b.super_.call(this);
    this.name = 'b';
    this.toto= 'toto';
}
inherits(b, a);

module.exports = b;