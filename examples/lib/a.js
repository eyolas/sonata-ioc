function a(){
    this.name = 'a';
    this.test = 'test';
}

a.prototype.echo = function() {
    console.log('My name is ' + this.name);
}


module.exports = a;
