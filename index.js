const ajax = require("./ajax");

function toJSON(vm, vValue) {
  const target = vm.isArray(vValue) ? [] : {};
  const global = vm.getGlobal();
  const vObject = vm.getProperty(global, "Object");
  const vKeysFunc = vm.getProperty(vObject, "keys");
  const vKeys = vm.call(vKeysFunc, vm.createUndefined(), vValue);
  const vLength = vm.getProperty(vKeys, "length");
  const length = vm.asNumber(vLength);
  for (let i = 0; i < length; i++) {
    const vKey = vm.getProperty(vKeys, i);
    const key = vm.asString(vKey);
    const vValueItem = vm.getProperty(vValue, key);
    if (vm.isUndefined(vValueItem)) {
      target[key] = undefined;
    } else if (vm.isNull(vValueItem)) {
      target[key] = null;
    } else if (vm.isBoolean(vValueItem)) {
      target[key] = vm.asBoolean(vValueItem);
    } else if (vm.isNumber(vValueItem)) {
      target[key] = vm.asNumber(vValueItem);
    } else if (vm.isString(vValueItem)) {
      target[key] = vm.asString(vValueItem);
    } else if (vm.isObject(vValueItem)) {
      target[key] = toJSON(vm, vValueItem);
    }
  }
  return target;
}

function fromJSON(vm, json) {
  const vObject = json.length ? vm.createArray() : vm.createObject();
  for (let key in json) {
    if (!json.hasOwnProperty(key)) {
      continue;
    }

    const value = json[key];
    if (value === undefined) {
      vm.setProperty(vObject, key, vm.createUndefined());
    } else if (value === null) {
      vm.setProperty(vObject, key, vm.createNull());
    } else if (typeof value === "boolean") {
      vm.setProperty(vObject, key, vm.createBoolean(value));
    } else if (typeof value === "number") {
      vm.setProperty(vObject, key, vm.createNumber(value));
    } else if (typeof value === "string") {
      vm.setProperty(vObject, key, vm.createString(value));
    } else if (typeof value === "object") {
      vm.setProperty(vObject, key, fromJSON(vm, value));
    }
  }
  return vObject;
}

module.exports = (vm) => {
  const global = vm.getGlobal();
  const vAjax = vm.createFunction("ajax", function (vOption) {
    const option = {};
    const vUrl = vm.getProperty(vOption, "url");
    const vXdrURL = vm.getProperty(vOption, "xdrURL");
    const vType = vm.getProperty(vOption, "type");
    const vMethod = vm.getProperty(vOption, "method");
    const vWithCredentials = vm.getProperty(vOption, "withCredentials");
    const vJSONP = vm.getProperty(vOption, "jsonp");
    const vHeaders = vm.getProperty(vOption, "headers");
    const vData = vm.getProperty(vOption, "data");
    const vSuccess = vm.getProperty(vOption, "success");
    const vError = vm.getProperty(vOption, "error");
    if (vm.isString(vUrl)) {
      option.url = vm.asString(vUrl);
    }

    if (vm.isString(vXdrURL)) {
      option.xdrURL = vm.asString(vXdrURL);
    }

    if (vm.isString(vType)) {
      option.type = vm.asString(vType);
    }

    if (vm.isString(vMethod)) {
      option.method = vm.asString(vMethod);
    }

    if (vm.isBoolean(vWithCredentials)) {
      option.withCredentials = vm.asBoolean(vWithCredentials);
    }

    if (vm.isString(vJSONP)) {
      option.jsonp = vm.asString(vJSONP);
    }else if (vm.isBoolean(vJSONP)) {
      option.jsonp = vm.asBoolean(vJSONP);
    }

    if (vm.isObject(vHeaders)) {
      option.headers = toJSON(vm, vHeaders);
    }

    if (vm.isString(vData)) {
      option.data = vm.asString(vData);
    } else if (vm.isObject(vData)) {
      option.data = toJSON(vm, vData);
    }

    if (vm.isFunction(vSuccess)) {
      option.success = function (response, headers) {
        vm.call(
          vSuccess,
          vm.createUndefined(),
          typeof response === "string" ? vm.createString(response) : fromJSON(vm, response),
          fromJSON(vm, headers)
        );
      };
    }

    if (vm.isFunction(vError)) {
      option.error = function (readyState, status) {
        vm.call(vError, vm.createUndefined(), vm.createNumber(readyState), vm.createNumber(status));
      };
    }

    ajax(option);
    return vm.createUndefined();
  });

  vm.setProperty(global, "ajax", vAjax);
};

module.exports.ajax = ajax;
