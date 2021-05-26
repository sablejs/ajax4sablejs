ajax4sablejs
===

> A tiny and simple ajax implenment for sablejs

### Browser Support

* IE9+
* Other browsers

### Usage

Install ajax4sablejs first
```shell
> npm install ajax4sablejs --save
```

then import it to sablejs vm

```javascript
const ajax4sablejs = require("ajax4sablejs");
const VM = require("sablejs/runtime")();
const vm = new VM();
ajax4sablejs(vm); // that's all!
```

### API

```javascript
ajax({
    url: String,
    type: String, // json | urlencoded | text
    method: String, // GET | POST
    headers: Object<String, String>,
    data: String|JSON,
    success: Function(response:String|JSON, headers:JSON),
    error: Function(readyState:Number, status:Number),
});
```

### License

ajax4sablejs

Copyright (c) 2020-2021 ErosZhao

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

Non-profit projects of individuals or organizations and commercial projects with 
commercial authorization of the author.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.