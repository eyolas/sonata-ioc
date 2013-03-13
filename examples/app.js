var Container = require('../lib/Container');
var container = new Container({"dirs": './lib', "execDir": __dirname});



var test = container.getProto('a');

console.log(test);
test.test = 'modification';
console.log(test);

var test2 = container.getProto('a');
console.log(test2);

var test3 =  container.getProto('b');
test3.echo();

var user = container.getProto('David2');
console.log(user);