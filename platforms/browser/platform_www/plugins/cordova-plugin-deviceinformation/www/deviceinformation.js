cordova.define("cordova-plugin-deviceinformation.DeviceInformation", function(require, exports, module) { var exec = require('cordova/exec');

function DeviceInformation () {}

DeviceInformation.prototype.get = function (successFunc, failFunc) {
    exec(successFunc, failFunc, "DeviceInformation", "get",[]);
};

module.exports = new DeviceInformation();

});
