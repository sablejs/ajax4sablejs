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
  if (!isOldIE) {
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
  if (isOldIE) {
    return headers;
  }

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

/**
 * option:{
 *  url: String,
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

  let xhr = null;
  if (window.XMLHttpRequest) {
    xhr = new XMLHttpRequest();
  } else if (window.XDomainRequest) {
    xhr = new XDomainRequest();
  } else {
    throw new Error("Not support this browser version");
  }

  xhr.open((option.method || "GET").toLowerCase(), option.url, true);

  let data = null;
  if (option.data) {
    data = parseData(xhr, option);
  }

  if (!isOldIE) {
    if (option.headers) {
      setHeaders(xhr, option.headers);
    }
  }

  xhr.onload = () => {
    if (isOldIE || (xhr.readyState === 4 && xhr.status === 200)) {
      let response = !isOldIE ? xhr.response : xhr.responseText;
      try {
        response = JSON.parse(response);
      } catch (e) {
        // nothing to do...
      }
      if (typeof option.success === "function") {
        option.success(response, parseHeaders(xhr));
      }
    } else {
      if (typeof option.error === "function") {
        option.error(xhr.readyState, xhr.status);
      }
    }
  };

  xhr.onerror = () => {
    if (typeof option.error === "function") {
      option.error(xhr.readyState, xhr.status);
    }
  };

  xhr.send(data);
};
