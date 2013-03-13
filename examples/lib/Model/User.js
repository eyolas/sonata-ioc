/**
 * @Entity
 * @Table(name = "user")
 */
function user() {
    /**
     * @type {null}
     */
    this.name = null;
    this.firstname = null;
}

user.prototype.getName = function() {
    return this.name;
};

user.prototype.getFirstname = function() {
    return this.firstname;
};

user.prototype.getFullName = function() {
    return this.name + ' ' +this.firstname;
};

module.exports = user;