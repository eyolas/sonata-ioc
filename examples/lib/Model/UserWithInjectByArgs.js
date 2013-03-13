function UserWithInjectByArgs(name, firstname) {
    this.name = name;
    this.firstname = firstname;
}

UserWithInjectByArgs.prototype.getName = function() {
    return this.name;
};

UserWithInjectByArgs.prototype.getFirstname = function() {
    return this.firstname;
};

UserWithInjectByArgs.prototype.getFullName = function() {
    return this.name + ' ' +this.firstname;
};

module.exports = UserWithInjectByArgs;