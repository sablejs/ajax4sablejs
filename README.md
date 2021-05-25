ajax4sablejs
===

> A tiny and sample ajax implenment for sablejs.

### 0. Browser Support

* IE9+
* Other browsers

### 1. Usage

Install ajax4sablejs firstly
```shell
> npm install ajax4sablejs --save
```

then import to sablejs vm

```javascript
const ajax4sablejs = require("ajax4sablejs");
const VM = require("sablejs/runtime")();
const vm = new VM();
ajax4sablejs(vm); // that's all!
```

### 2. API

```javascript
ajax({
    url: "<your url>",
    type: "json|url|form",
    method: "GET/POST",
    headers: {
      "x-custom-header" : "<your custom header>",
    },
    data: "<your data>",
    success: function(data, headers) {
      // success data and headers
    },
    error: function() {
      // error handler
    }
});
```