const queryString = require("querystring");
const match = navigator.userAgent.match(/msie\s+(\d+?).\d/i);
let isOldIE = false;
if (match != null) {
  const version = parseInt(match[1]);
  if (version < 10) {
    isOldIE = true;
  }
}

function setHeaders(xhr, headers) {
  if (xhr) {
    for (let key in headers) {
      if (headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }
  }
}

function isJSON(json) {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
}

function parseData(xhr, option) {
  const { type, data } = option;
  switch (type.toLowerCase()) {
    case "urlencoded":
      setHeaders(xhr, { "Content-Type": "application/x-www-form-urlencoded" });
      return queryString.stringify(data);
    case "json":
      setHeaders(xhr, { "Content-Type": "application/json" });
      return isJSON(data) ? data : JSON.stringify(data);
    default:
      return data;
  }
}

function parseHeaders(xhr) {
  const headers = {};
  const rawHeaders = xhr.getAllResponseHeaders();
  if (!rawHeaders) {
    return headers;
  }

  const headerPairs = rawHeaders.split("\u000d\u000a");
  for (let i = 0; i < headerPairs.length; i++) {
    const headerPair = headerPairs[i];

    // Can't use split() here because it does the wrong thing
    // if the header value has the string ": " in it.
    const index = headerPair.indexOf("\u003a\u0020");
    if (index > 0) {
      const key = headerPair.substring(0, index);
      const val = headerPair.substring(index + 2);
      headers[key] = val;
    }
  }

  return headers;
}

function sendViaXMLHttpRequest(option) {
  let xhr = new XMLHttpRequest();
  xhr.open((option.method || "GET").toLowerCase(), option.url, true);

  let data = null;
  if (option.data) {
    data = parseData(xhr, option);
  }

  if (option.headers) {
    setHeaders(xhr, option.headers);
  }

  xhr.onload = () => {
    if (xhr.readyState === 4 && xhr.status === 200) {
      let response = xhr.response || xhr.responseText;
      try {
        response = JSON.parse(response);
      } catch {
        // nothing to do...
      } finally {
        if (typeof option.success === "function") {
          option.success(response, parseHeaders(xhr));
        }
      }
    } else {
      xhr.onerror();
    }
  };

  xhr.onerror = () => {
    if (typeof option.error === "function") {
      option.error(xhr.readyState, xhr.status);
    }
  };

  xhr.send(data);
}

function sendViaXDomainRequest(option) {
  const xhr = new XDomainRequest();
  xhr.open('get', option.url, true);

  xhr.onload = () => {
    let response = xhr.response || xhr.responseText;
    try {
      response = JSON.parse(response);
    } catch {
      // nothing to do...
    } finally {
      if (typeof option.success === "function") {
        option.success(response, {});
      }
    }
  };

  xhr.onerror = () => {
    if (typeof option.error === "function") {
      option.error(xhr.readyState, xhr.status);
    }
  };

  xhr.send(null);
}

let idx = 0;
let iframe = null;
let proxy = null;
let options = [];
function sendViaCrossDomainIFrame(option) {
  option.id = idx++;
  options.push(option);
  if (proxy == null) {
    if (iframe) {
      return;
    }

    iframe = document.createElement("iframe");
    iframe.onload = () => {
      proxy = iframe.contentWindow;
      proxy.postMessage(`
        window.ajax = function(option){
          var xhr = new XMLHttpRequest();
          xhr.open(option.method, option.url, true);
  
          var headers = option.headers;
          if(headers){
            for (var key in headers) {
              if (headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, headers[key]);
              }
            }
          }
  
          xhr.onload = function(){
            if(xhr.readyState === 4 && xhr.status === 200){
              parent.postMessage(JSON.stringify({
                id: option.id,
                type: "success",
                data: {
                  response: xhr.response || xhr.responseText,
                  headers: {},
                }
              }), "*");
            }else{
              xhr.onerror();
            }
          }
  
          xhr.onerror = function(){
            parent.postMessage(JSON.stringify({
              id: option.id,
              type: "error",
              data: {
                readyState: xhr.readyState,
                status: xhr.status,
              }
            }), "*");
          }
  
          xhr.send(option.data);
        }
      `, "*");

      for (let i = 0; i < options.length; i++) {
        postData(options[i])
      }
    };

    iframe.onerror = () => {
      for (let i = 0; i < options.length; i++) {
        const { error } = options[i];
        if (typeof error === "function") {
          error(-1, -1);
        }
      }

      iframe = null;
      options = [];
    };

    iframe.src = option.xdrURL || option.url;
    iframe.width = "1px";
    iframe.height = "1px";
    iframe.seamless = true;
    iframe.style.position = "absolute";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    document.body.appendChild(iframe);
  } else {
    postData(option)
  }

  window.addEventListener("message", function (e) {
    const data = JSON.parse(e.data || "");
    const index = options.map(v => v.id).indexOf(data.id);
    if (index == -1) {
      return;
    }


    const { type } = data;
    const { success, error } = options[index];
    options.splice(index, 1);

    if (type === "success") {
      let { response, headers } = data.data;
      try {
        response = JSON.parse(response);
      } catch {
        // nothing to do...
      } finally {
        if (typeof success === "function") {
          success(response, headers);
        }
      }
    } else {
      if (typeof error === "function") {
        error(data.data.readyState, data.data.status);
      }
    }
  });

  function postData(option) {
    let data = null;
    if (option.data) {
      data = parseData(null, option);
    }

    const headers = {
      ...(option.headers || {}),
    };

    const { type } = option;
    switch (type.toLowerCase()) {
      case "urlencoded":
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        break;
      case "json":
        headers["Content-Type"] = "application/json";
        break;
    }

    proxy.postMessage(`
      ajax(${JSON.stringify({
      id: option.id,
      url: option.url || "",
      type: type || "text",
      method: (option.method || "GET").toLowerCase(),
      headers,
      data,
    })});
    `, "*");
  }
}

/**
 * option:{
 *  url: String,
 *  xdrURL: String,
 *  type: String,
 *  method: String,
 *  headers: Object<String, String>,
 *  data: Object<String, Any> | String,
 *  success: Function,
 *  error: Function,
 * }
 */
module.exports = (option) => {
  if (!option || option + "" !== "[object Object]") {
    throw new Error('No required parameters - "url" and "method".');
  }

  if (!option.url) {
    throw new Error('Parameter "url" is required.');
  }

  if (!isOldIE) {
    sendViaXMLHttpRequest(option);
  } else {
    const method = (option.method || 'GET').toLowerCase();
    if (method === "get" && !option.xdrURL) {
      sendViaXDomainRequest(option);
    } else {
      sendViaCrossDomainIFrame(option);
    }
  }
};