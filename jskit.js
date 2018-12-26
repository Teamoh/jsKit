/*	
*	jsKit - A Handy Survival-Kit for JavaScript Developers
*/
var jsKit = (function () {
	'use strict';

	let _js = {
		'constants': {
			'alphabet': 'abcdefghijklmnopqrstuvwxyz'.split(''),
			'days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
			'monthes': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
		},
		'addBrowserPrefixes': function (element, property, value) {
			element.style['-webkit-' + property] = value;
			element.style['-moz-' + property] = value;
			element.style['-ms-' + property] = value;
			element.style['-o-' + property] = value;
			element.style[property] = value;
		},
		'ajax': {
			'check': function () {
				return typeof XMLHttpRequest !== 'undefined';
			},
			'get': function (url, onsuccess) {
				if (_js.ajax.check()) {
					const req = new XMLHttpRequest();

					req.onreadystatechange = function () {
						if (req.readyState == 4 && req.status == 200) {
							if (typeof onsuccess === 'function') {
								onsuccess(req);
							}
						}
					};

					req.open('GET', url, true);
					req.send();
				}
				else {
					document.createElement('img').src = url;
				}
			},
			'post': function (url, data, onsuccess, requestHeader) {
				if (_js.ajax.check()) {
					const req = new XMLHttpRequest();

					req.onreadystatechange = function () {
						if (req.readyState == 4 && req.status == 200) {
							if (typeof onsuccess === 'function') {
								onsuccess(req);
							}
						}
					};

					req.open('POST', url, true);
					req.setRequestHeader(requestHeader || 'Content-type', 'application/x-www-form-urlencoded');
					req.send(data || '');
				}
				else {
					const data = data.split('&');
					const form = document.createElement('form');

					form.method = 'POST';
					form.action = url;

					// add for each prop-value pair one single input-element
					for (let i = 0, iLen = data.length; i < iLen; i++) {
						const pair = data[i].split('=');
						const input = document.createElement('input');

						input.type = 'text';
						input.name = pair[0];
						input.value = pair[1];

						form.appendChild(input);
					}

					form.submit();
				}
			}
		},
		'bind': function (fn, _this) {
			// this is a closure!!! the returned function still has access to the outer lets
			return function () {
				return fn.apply(_this, arguments);
			};
		},
		'camelCase': function (text, seperator) {
			if (seperator) {
				let pos = text.indexOf(seperator);

				while (pos > -1) {
					const part1 = text.substring(0, pos);
					const part2 = text.substring(pos + 1);
					const upperCaseChar = part2.charAt(0).toUpperCase();

					text = part1 + upperCaseChar + part2.substring(1);
					pos = text.indexOf(seperator);
				}
			}
	
			return text;
		},
		'class': function (className, context) {
			context = context || document;
			return context.getElementsByClassName(className);
		},
		'cookies': {
			'set': function (name, value, expires, path) {
				let cookieString = name + '=' + value;

				if (expires !== undefined) {
					cookieString += '; expires=';

					if (_js.isDate(expires)) { // date object
						cookieString += expires.toUTCString();
					}
					else if (!isNaN(parseInt(expires))) { // timestamp
						cookieString += new Date(parseInt(expires)).toUTCString();
					}
					else {
						cookieString += expires;
					}
				}

				if (path !== undefined) {
					cookieString += '; path=' + path;
				}

				document.cookie = cookieString;
			},
			'get': function (name) {
				const cookies = '; ' + document.cookie;
				const parts = cookies.split('; ' + name + '=');

				if (parts.length > 1) { // if splitting was successful
					return parts[1].split(';')[0];
				}

				return null;
			},
			'getAll': function () {
				const result = {};
				const cookies = document.cookie.split('; ');

				cookies.forEach(function (cookie) {
					const parts = cookie.split('=');
					const key = parts[0];
					const value = parts[1];
					result[key] = value;
				});

				return result;
			},
			'delete': function (name) {
				document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
			}
		},
		'createElement': function (str) {
			str = str.trim();

			const matches = {
				tag: str.match(/^[a-z]+/i),
				attributes: str.match(/\[[^\]]+\]/g)
			};

			if (!matches.tag) {
				return null;
			}

			const element = document.createElement(matches.tag);

			if (matches.attributes) {
				matches.attributes.forEach(function (el) {
					const parts = el.slice(1, -1).split('='); // remove brackets, split key/value
					element.setAttribute(parts.shift(), parts.join('='));
					str = str.replace(el, ''); // remove the current attribute in the string so we can savely extract the id and classes
				});
			}

			str = str.replace(/\s+/g, ''); // remove spaces to avoid invalid ids/classes

			matches.id = str.match(/#[^#\.]+/i);
			matches.classes = str.match(/\.[^#\.]+/g);

			if (matches.id) {
				element.id = matches.id[0].slice(1);
			}

			if (matches.classes) {
				matches.classes.forEach(function (el) {
					element.classList.add(el.slice(1));
				});
			}

			return element;
		},
		'delegate': (function () {
			const listeners = {};

			return function (eventType, selector, callback) {
				if (listeners[eventType] === undefined) {
					listeners[eventType] = {}; // new eventType detected, so create a new object for it and add the event to the html element

					document.documentElement.addEventListener(eventType, function (e) {
						let currentElement = e.target;

						bubblingLoop:
						while (currentElement && currentElement !== document) { // loop through all ancestors
							for (const sel in listeners[eventType]) { // loop through all registered selectors
								if (_js.matchesSelector(currentElement, sel)) { // check if any of the registered selectors matches the current Element
									listeners[eventType][sel].forEach(function (el) {
										el.call(currentElement, e); // if so, call the event handler function
									});

									break bubblingLoop;
								}
							}

							currentElement = currentElement.parentNode; // bubble up manually to check if parents are matching
						}
					}, false);
				}

				// if needed create a new array for the callbacks for the selector and push the callback function into it
				if (typeof callback === 'function') {
					(listeners[eventType][selector] = listeners[eventType][selector] || []).push(callback);
				}
			};
		})(),
		'equals': function (obj1, obj2) {
			function compare(a, b) {
				if (_js.isObject(a) && _js.isObject(b)) { // two objects
					for (const prop in a) {
						if (typeof a[prop] === 'object' && typeof b[prop] === 'object') {
							if (!compare(a[prop], b[prop])) { // a difference was found, stop comparing
								return false;
							}
						}
						else if (a[prop] !== b[prop]) {
							return false;
						}
					}

					return true; // survived the for loop so it must be the same
				}
				else if (_js.isArray(a) && _js.isArray(b)) { // two arrays
					if (a.length === b.length) {
						for (let i = 0, iLen = a.length; i < iLen; i++) {
							if (typeof a[i] === 'object' && typeof b[i] === 'object') { // objects or arrays
								if (!compare(a[i], b[i])) { // a difference was found, stop comparing
									return false;
								}
							}
							else if (a[i] !== b[i]) {
								return false;
							}
						}

						return true; // survived the for loop so it must be the same
					}
					else {
						return false; // length is different so return false
					}
				}
				else {
					return a === b;
				}
			}

			return compare(obj1, obj2) && compare(obj2, obj1); // the AND is needed because we only iterate over the properties of obj1
		},
		'equals2': (function () {
			function compareObjects(a, b) {
				return Object.keys(a).every(prop => {
					return compare(a[prop], b[prop]);
				}) && Object.keys(b).every(prop => {
					return compare(b[prop], a[prop]);
				});
			}

			function compareArrays(a, b) {
				if (a === b) {
					return true;
				}

				if (a.length !== b.length) {
					return false;
				}

				return a.every((el, i) => compare(el, b[i]));
			}

			function compareValues(a, b) {
				// if both values are NaN return true, otherwise just compare the values
				return (a !== a && b !== b) ? true : a === b;
			}

			function compare(a, b) {
				if (_js.isObject(a) && _js.isObject(b)) { // both objects
					return compareObjects(a, b);
				}
				else if (_js.isArray(a) && _js.isArray(b)) { // both arrays
					return compareArrays(a, b);
				}
				else {
					return compareValues(a, b); // both some other values
				}
			}

			return compare;
		})(),
		'extract': function (str, selector) {
			const div = document.createElement('div');
			div.innerHTML = str;
			return div.querySelector(selector).innerHTML;
		},
		'extractBodyContent': function (myString) {
			if (/<body/.test(myString) && /<\/body>/.test(myString)) {
				const s1 = myString.split('<body')[1];
				const s2 = s1.split('>');
				s2.shift(); // delete first item
				return s2.join('>').split('</body>')[0].trim();
			}

			return null;
		},
		'flatten': function (arr) {
			const data = [];

			for (let i = 0, iLen = arr.length; i < iLen; i++) {
				if (_js.isArray(arr[i])) {
					data = data.concat(_js.flatten(arr[i])); // recursive call to flat down infinite multidimensional array-layers
				}
				else {
					data.push(arr[i]);
				}
			}

			return data;
		},
		'getAudio': function (mpegSrc, oggSrc) {
			const audio = document.createElement('audio');
			let content = '<source src="' + mpegSrc + '" type="audio/mpeg">'

			if (typeof oggSrc === 'string') {
				content += '<source src="' + oggSrc + '" type="audio/ogg">';
			}

			audio.innerHTML = content;
			return audio;
		},
		'getDaysInMonth': function (year, month) {
			return new Date(year, month + 1, 0).getDate();
		},
		'getFormElements': function (container) {
			const elements = {
				inputs: _js.toArray(container.getElementsByTagName('input')),
				selects: _js.toArray(container.getElementsByTagName('select')),
				textareas: _js.toArray(container.getElementsByTagName('textarea'))
			};

			return elements.inputs.concat(elements.selects, elements.textareas);
		},
		'createId': (function () {
			const ids = new Set();
			const defaultCharset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIKLMNOPQRSTUVWXYZ0123456789'.split('');

			function generate(len, charset) {
				let id = '';

				for (let i = 0; i < len; i++) {
					id += charset[Math.floor(Math.random() * charset.length)]
				}

				return id;
			}

			return function (len, charset) {
				len = len || 20;

				if (!_js.isArray(charset)) {
					charset = (charset ? charset.split('') : defaultCharset);
				}

				let id;

				do {
					id = generate(len, charset);
				}
				while (ids.has(id));

				ids.add(id);
				return id;
			}
		})(),
		'createGuid': (function () {
			const guids = new Set();
			const pattern = 'xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx'; // the 4 stands for the GUID-version (random)

			function generate() {
				return pattern.replace(/x/g, function () {
					return Math.floor(Math.random() * 16).toString(16);
				});
			}

			return function () {
				let guid;

				do {
					guid = generate();
				}
				while (guids.has(guid)); // avoid double guids (although it is almost impossible)

				guids.add(guid);
				return guid;
			}
		})(),
		'getRandomArrayValue': function (array) {
			return array[Math.floor(Math.random() * array.length)];
		},
		'getRandomColor': function () {
			// 256 * 256 * 256 == 16777216
			return '#' + _js.pad(Math.floor(Math.random() * 16777216).toString(16), 6);
		},
		'hexToRgb': function (hex) {
			if (hex.charAt(0) === '#') {
				hex = hex.substring(1);
			}

			if (hex.length == 6) {
				const r = parseInt(hex.substr(0, 2), 16);
				const g = parseInt(hex.substr(2, 2), 16);
				const b = parseInt(hex.substr(4, 2), 16);
				return r + ', ' + g + ', ' + b;
			}
		},
		'htmlspecialchars': function (str) {
			return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;').replace(/'/g, '&#39;');
		},
		'id': function (id, context) {
			if (typeof context !== 'undefined' && typeof document.querySelector !== 'undefined') {
				context = context || document;
				return context.querySelector('#' + id);
			}
			else {
				return document.getElementById(id);
			}
		},
		'insertToString': function (string, index, deleteLength, add) {
			return string.substring(0, index) + (add || '') + string.substring(index + deleteLength);
		},
		'invertColor': function (color) {
			if (color.charAt(0) === '#') {
				color = color.slice(1);
			}

			if (color.length === 3) {
				color = color.charAt(0) + color.charAt(0) + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2);
			}

			const values = {
				r: _js.pad((255 - parseInt(color.substr(0, 2), 16)).toString(16)),
				g: _js.pad((255 - parseInt(color.substr(2, 2), 16)).toString(16)),
				b: _js.pad((255 - parseInt(color.substr(4, 2), 16)).toString(16))
			};

			return '#' + values.r + values.g + values.b;
		},
		'isFloat': function (num) {
			return !isNaN(num) && (num - parseInt(num)) > 0;
		},
		'isInt': function (num) {
			return parseInt(num) === num;
		},
		'touchesViewport': function (el) { // check if an element is partly in the viewport
			const rect = el.getBoundingClientRect();
			return (rect.top <= window.innerHeight && rect.bottom >= 0 && rect.left <= window.innerWidth && rect.right >= 0);
		},
		'insideViewport': function (el) { // check if an element is completly in the viewport
			const rect = el.getBoundingClientRect();
			return (rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth);
		},
		'isMac': navigator.platform.toLowerCase().indexOf('mac') > -1,
		'isWindows': navigator.platform.toLowerCase().indexOf('win') > -1,
		'listen': function (eventType, selector, callback, capturing) {
			_js.select(selector).forEach(function (el) {
				el.addEventListener(eventType, callback, !!capturing);
			});
		},
		'matchesSelector': function (element, selector) {
			const p = Element.prototype;

			return (p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector || function (s) {
				return _js.select(s).some(el => el === this);
			}).call(element, selector);
		},
		'numToText': function (num) {
			let numString = '';
			num = parseInt(num);

			if (isNaN(num)) {
				return;
			}

			if (num < 0) {
				num *= -1;
				numString = 'minus ';
			}

			num = num.toString();

			const numerals = {
				0: 'zero',
				1: 'one',
				2: 'two',
				3: 'three',
				4: 'four',
				5: 'five',
				6: 'six',
				7: 'seven',
				8: 'eight',
				9: 'nine',
				10: 'ten',
				11: 'eleven',
				12: 'twelve',
				13: 'thirteen',
				14: 'fourteen',
				15: 'fifteen',
				16: 'sixteen',
				17: 'seventeen',
				18: 'eighteen',
				19: 'nineteen',
				20: 'twenty',
				30: 'thirty',
				40: 'forty',
				50: 'fifty',
				60: 'sixty',
				70: 'seventy',
				80: 'eighty',
				90: 'ninety',
			};

			const rests = {
				3: 'thousand',
				6: 'million',
				9: 'billion',
				12: 'trillion',
				15: 'quadrillion',
				18: 'quintillion',
				21: 'sextillion',
				24: 'septillion',
				27: 'octillion',
				30: 'nonillion',
				33: 'decillion',
				36: 'undecillion',
				39: 'duodecillion',
				42: 'tredecillion',
				45: 'quattuordecillion',
				48: 'quindecillion',
				51: 'sexdecillion',
				54: 'septendecillion',
				57: 'octodecillion',
				60: 'novemdecillion',
				63: 'vigintillion'
			};

			function getNumPart(n) {
				let nString = '';

				if (n.length === 1) {
					nString = numerals[n];
				}
				else if (n.length === 2) {
					nString = numerals[n] || (numerals[n.charAt(0) + '0'] + '-' + numerals[n.charAt(1)]);
				}
				else if (n.length === 3) {
					if (n.charAt(0) !== '0') {
						nString = ' ' + numerals[n.charAt(0)] + ' hundred';
					}

					if (n.charAt(1) !== '0') {
						nString += ' and ' + (numerals[n.substring(1)] || (numerals[n.charAt(1) + '0'] + '-' + numerals[n.charAt(2)]));
					}
					else if (n.charAt(2) !== '0') {
						nString += ' and ' + numerals[n.charAt(2)]
					}
				}
				return nString;
			}

			if (typeof numerals[num] !== 'undefined') {
				return numString + numerals[num];
			}
			else {
				while (num.length > 0) {
					const currentLength = (num.length % 3) || 3;
					const currentPart = num.substr(0, currentLength);
					numString += getNumPart(currentPart);

					num = num.substring(currentLength);

					// not '00' or '000'
					if (!/^00?0$/.test(currentPart)) {
						numString += ' ' + (rests[num.length] || ''); // thousand? million? billion?
					}

					if (/^00+0$/.test(num)) {
						// only zeros left in the rest of the number so break from the while-loop
						break;
					}
				}

				return numString.trim();
			}
		},
		'pad': function (subj, len, sym, fromRight) {
			subj = subj.toString();
			len = len || 2; // default is 2 so we can easily pad 1-9
			sym = sym || '0';

			while (subj.length < len) {
				subj = (fromRight ? '' : sym) + subj + (fromRight ? sym : '');
			}

			return subj;
		},
		'parseHTML': function (html) {
			const template = document.createElement('template');
			let fragment;

			if ('content' in template) {
				template.innerHTML = html;
				fragment = template.content;
			}
			else if (typeof Range.prototype.createContextualFragment === 'function') {
				fragment = document.createRange().createContextualFragment(html);
			}
			else {
				fragment = document.createDocumentFragment();
				const container = document.createElement('div');
				container.innerHTML = html;

				while (container.firstChild) {
					fragment.appendChild(container.firstChild);
				}
			}

			return fragment;
		},
		'preloadImage': function (src, onload) {
			const img = document.createElement('img');

			if (typeof onload === 'function') {
				img.onload = function (e) {
					onload.call(img, e);
				};
			}

			img.src = src;
			return img;
		},
		'rand': function (min, max) {
			if (arguments.length == 2) {
				if (min > max) {
					max = [min, min = max][0]; // swap the two lets
				}

				return (min + (Math.random() * (max - min)));
			}
			else if (arguments.length == 1) {
				if (_js.isArray(min)) {
					return min[Math.floor(Math.random() * min.length)];
				}
				else {
					return Math.random() * min;
				}
			}
			// if no parameters available
			else {
				return Math.random();
			}
		},
		'ready': function (fn) {
			// loading -> interactive (DOMContentLoaded) -> complete (load)
			if (typeof fn === 'function') {
				if (document.readyState === 'interactive' || document.readyState === 'complete') {
					fn();
				}
				else {
					document.addEventListener('DOMContentLoaded', fn, false);
				}
			}
		},
		'removeClassByClassName': function (className, container) {
			container = container || document;
			const elements = container.getElementsByClassName(className);

			while (elements.length > 0) {
				elements[elements.length - 1].classList.remove(className);
			}
		},
		'removeElements': function (selector, container) {
			container = container || document;
			const elements = container.querySelectorAll(selector);

			while (elements.length > 0) {
				elements[elements.length - 1].outerHTML = '';
				elements = container.querySelectorAll(selector);
			}
		},
		'rgbToHex': function (r, g, b) {
			if (r < 256 && g < 256 && b < 256) {
				return r.toString(16) + g.toString(16) + b.toString(16);
			}

			return null;
		},
		'repeat': function (times, fn, args) {
			const iLen = +times;

			if (typeof fn === 'function' && !isNaN(iLen)) {
				for (let i = 0; i < iLen; i++) {
					fn(i, args);
				}
			}
		},
		'reverse': function (data) {
			if (typeof data === 'string') {
				return data.split('').reverse().join('');
			}
			else if (_js.isArray(data)) {
				return data.reverse();
			}
		},
		'select': function (selector, context) {
			context = context || document;
			return _js.toArray(context.querySelectorAll(selector));
			/* 
			*	id: /^#-?[a-z_][a-z\d-_]*$/i
			*	class: ^\.-?[a-z_][a-z\d-_]*$/i
			*	tag: /^[a-z]+$/i
			*/
		},
		'serialize': function (container) {
			// for POST you can use 'new FormData(form)'
			const data = [];
			let elements;

			if (container.tagName == 'FORM') {
				elements = container.elements;
			}
			else {
				elements = _js.getFormElements(container);
			}

			// loop over all form data-elements
			for (let i = 0, iLen = elements.length; i < iLen; i++) {
				const element = elements[i];

				// if not disabled and name attribute is not empty
				if (!element.hasAttribute('disabled') && element.hasAttribute('name') && element.name.trim() != '') {
					const name = element.name.trim();

					switch (element.tagName) {
						case 'INPUT':
							switch (element.type) {
								case 'checkbox':
								case 'radio':
									if (element.checked) {
										data.push(name + '=' + encodeURIComponent(element.value));
									}
									break;
								default:
									data.push(name + '=' + encodeURIComponent(element.value));
							}
							break;
						case 'SELECT':
							switch (element.type) {
								case 'select-one':
									data.push(name + '=' + encodeURIComponent(element.value));
									break;
								case 'select-multiple':
									for (let j = 0, jLen = element.options.length; j < jLen; j++) {
										if (element.options[j].selected) {
											data.push(name + '=' + encodeURIComponent(element.options[j].value));
										}
									}
									break;
							}
							break;
						case 'TEXTAREA':
							data.push(name + '=' + encodeURIComponent(element.value));
							break;
					}
				}
			}

			return data.join('&');
		},
		'tag': function (tag, context) {
			context = context || document;
			return context.getElementsByTagName(tag);
		},
		'toArray': function (data) {
			return Array.prototype.slice.call(data, 0);
		},
		'trigger': function (element, type, dataObj) {
			if (typeof dataObj === 'object')
				element.dispatchEvent(new CustomEvent(type, dataObj));
			else
				element.dispatchEvent(new CustomEvent(type));
		},
		'ucfirst': function (str) {
			return str.charAt(0).toUpperCase() + str.slice(1);
		},
		'uclast': function (str) {
			// use slice here because it accepts negative parameters
			return str.slice(0, -1) + str.slice(-1).toUpperCase();
		},
		'isArray': Array.isArray || function (subj) {
			return Object.prototype.toString.call(subj) === '[object Array]';
		},
		'isBoolean': function (subj) {
			return Object.prototype.toString.call(subj) === '[object Boolean]';
		},
		'isDate': function (subj) {
			return Object.prototype.toString.call(subj) === '[object Date]';
		},
		'isFunction': function (subj) {
			return Object.prototype.toString.call(subj) === '[object Function]';
		},
		'isHTMLCollection': function (subj) {
			return Object.prototype.toString.call(subj) === '[object HTMLCollection]';
		},
		'isNodeList': function (subj) {
			return Object.prototype.toString.call(subj) === '[object NodeList]';
		},
		'isNumber': function (subj) {
			return Object.prototype.toString.call(subj) === '[object Number]';
		},
		'isObject': function (subj) {
			return Object.prototype.toString.call(subj) === '[object Object]';
		},
		'isRegExp': function (subj) {
			return Object.prototype.toString.call(subj) === '[object RegExp]';
		},
		'isString': function (subj) {
			return Object.prototype.toString.call(subj) === '[object String]';
		},
		'isNaN': Number.isNaN || function (subj) {
			return subj !== subj; // NaN is the only value that is not equal to itself
		},
		'type': function (subj) {
			return Object.prototype.toString.call(subj).split(' ')[1].slice(0, -1).toLowerCase();
		},
		'parseURL': function (url, parseSearch) {
			const a = document.createElement('a');
			const props = ['hash', 'host', 'hostname', 'href', 'origin', 'password', 'pathname', 'port', 'protocol', 'search', 'username'];
			const result = {};

			a.href = (typeof url === 'string') ? url : '';

			props.forEach(function (prop) {
				result[prop] = a[prop];
			});

			if (parseSearch && a.search) {
				const search = a.search.slice(1);
				const parsedSearchResult = {};
				const keyVals = search.split('&');

				keyVals.forEach(keyVal => {
					const splitted = keyVal.split('=');
					const key = splitted[0];

					if (!key) {
						return;
					}

					const val = splitted[1];

					if (parsedSearchResult[key] === undefined) {
						parsedSearchResult[key] = val;
					} else {
						// param exists multiple times
						parsedSearchResult[key] = [parsedSearchResult[key], val];
					}
				});

				result.search = parsedSearchResult;
			}

			return result;
		},
		'HTMLEntityDecode': function (text) {
			const textarea = document.createElement('textarea');
			textarea.innerHTML = text;
			return textarea.value;
		},
		'HTMLEntityEncode': function (text) { // not tested yet
			text = text.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
				return '&#' + i.charCodeAt(0) + ';';
			});

			return text;
		},
		'bindData': (function () { // bind data in key-value-pairs to some object
			const keys = [], values = [];

			return function (target, key, value) {
				const match = keys.indexOf(target);

				if (arguments.length === 3) { // write
					if (match === -1) {
						const vals = {};
						vals[key] = value;
						keys.push(target);
						values.push(vals);
					}
					else {
						values[match][key] = value;
					}
				}
				else if (arguments.length === 2) {
					if (_js.isObject(key)) { // assign object properties
						for (const prop in key) {
							if (key.hasOwnProperty(prop)) {
								_js.bindData(target, prop, key[prop]);
							}
						}
					}
					else if (match !== -1) { // read
						return values[match][key];
					}
				}
			};
		})(),
		'containsOnly': function (subj, val) {
			if (typeof subj === 'string') {
				subj = subj.split('');
			}

			for (let i = 0, iLen = subj.length; i < iLen; i++) {
				if (subj[i] !== (val || subj[0])) {
					return false;
				}
			}
			return true;
		},
		'getGETParameter': function (p) {
			const params = {};
			let search = location.search;

			if (search) {
				search = search.slice(1).split('&');

				search.forEach(function (keyValue) {
					keyValue = keyValue.split('=');
					params[keyValue.shift()] = keyValue.join('=');
				});
			}

			return (p === undefined) ? params : params[p];
		},
		'isPrimeNumber': function (number) {
			if (number < 2 || number % 1 !== 0) { // filter out too small numbers and decimal numbers
				return false; 
			}

			for (let i = 2; i < number; i++) { // loop up to the target number
				if ((number / i) % 1 === 0) { // check if the number is divisible by any other smaller number
					return false; // if so, the number is not a prime number since prime numbers are only divisible by 1 and the number itself
				}
			}

			return true;
		},
		'removeChilds': function (element) {
			let counter = 0;

			while (element.hasChildNodes()) { // innerHTML seems to be slower than removeChild
				element.removeChild(element.lastChild);
				counter++;
			}

			return counter;
		},
		'maybe': function () {
			return new Promise(function (resolve, reject) {
				if (!Math.round(Math.random())) {
					resolve();
				}
				else {
					reject();
				}
			});
		},
		'supportsCSS': (function () {
			return CSS.supports || function (prop, val) {
				const div = document.createElement('div');

				if (prop !== undefined && prop in div.style) {
					div.style[prop] = val;
					return div.style[prop] === val;
				}

				return false;
			};
		})(),
		'xor': function (a, b) {
			return !a !== !b;
		},
		'countCharacters': function (input) {
			const chars = {};
			input += '';

			for (let i = 0, iLen = input.length; i < iLen; i++) {
				const currentChar = input.charAt(i);
				chars[currentChar] = chars[currentChar] ? ++chars[currentChar] : 1;
			}

			return chars;
		},
		'digitSum': function (x) {
			return (x - 1) % 9 + 1; // magic math
		},
		'shuffle': function (a) {
			// if a single array is given, use that, otherwise use the arguments object
			const arr = (Array.isArray(a) && arguments.length === 1) ? a : _js.toArray(arguments);

			for (let i = arr.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				// [a[i], a[j]] = [a[j], a[i]]; -> would be nicer but destructuring is not supported in IE11
				arr[i] = [arr[j], arr[j] = arr[i]][0];
			}

			return arr;
		},
		/* ##################### TESTING AREA ##################### */
		'include': function (attr) {
			attr = attr || 'data-include';
			const elements = document.querySelectorAll('[' + attr + ']');

			function insertResponse(el) {
				_js.ajax.get(el.getAttribute(attr), function (req) {
					el.innerHTML = req.responseText;
				});
			}

			for (let i = 0, iLen = elements.length; i < iLen; i++) {
				insertResponse(elements[i]);
				// elements[i].removeAttribute(attr);
			}
		},
		'forEach': function (subj, fn, args) {
			if (_js.isArray(subj) || _js.isHTMLCollection(subj) || _js.isNodeList(subj)) {
				for (let i = 0, iLen = subj.length; i < iLen; i++) {
					fn.apply(subj, [subj[i], i, subj].concat(args || []));
				}
			}
			else if (_js.isObject(subj)) {
				for (const prop in subj) {
					if (subj.hasOwnProperty(prop)) {
						fn.apply(subj, [subj[prop], i++, subj].concat(args || []));
					}
				}
			}
			else if (_js.isString(subj)) {
				for (let i = 0, iLen = subj.length; i < iLen; i++) {
					fn.apply(subj, [subj.charAt(i), i, subj].concat(args || []));
				}
			}
		},
		'loadScript': function (url, callback) {
			const script = document.createElement('script');

			if (typeof callback === 'function') {
				script.addEventListener('onload', callback, false);
			}

			script.defer = true; // load asynchronously to htmlparsing and execute the script after parsing has finished
			script.src = url + (url.indexOf('?') === -1 ? '?' : '&') + '_=' + (Math.random() * 10); // if '?' is already included use '&'
			document.body.appendChild(script); // start loading (in opposite to media elements scripts need to be added to the DOM)
		},
		'scroll': function (a, callback) {
			let y, dir;

			function scrollStep() {
				if (window.scrollY !== y) {
					const step = dir * (Math.ceil(Math.abs((window.scrollY - y) / 8))); // round up to always scroll at least 1 pixel

					scrollBy(0, step);
					requestAnimationFrame(scrollStep);
				}
				else if (typeof callback === 'function') {
					callback();
				}
			}

			if (_js.isNumber(a)) {
				y = a;
			}
			else if (_js.isString(a)) {
				const el = document.querySelector(a);

				if (el) {
					y = el.offsetTop;
				}
			}

			if (y !== undefined) {
				y = Math.max(0, Math.min(y, document.body.scrollHeight - window.innerHeight)); // correct too large or too small y-values
				dir = window.scrollY > y ? -1 : 1;
				requestAnimationFrame(scrollStep);
			}
		},
		'onAppear': (function () {
			const elements = [];
			let setListener = false;

			return function (element, callback) {
				if (!setListener) {
					document.addEventListener('scroll', function (e) {
						elements.forEach(function (el) {
							if (_js.touchedViewport(el.element)) {
								if (!el.fired) {
									callback.call(el.element, e);
									el.fired = true;
								}
							}
							else {
								el.fired = false;
							}
						});
					}, false);

					setListener = true;
				}

				elements.push({
					element: element,
					fired: false
				});
			};
		})(),
		'promise': function (callback) {
			let value, resolveHandler, rejectHandler, returnedResolve, returnedReject;
			let state = 'pending';
			const promiseProto = {
				then: function (onRes, onRej) {
					let newPromise = _js.promise(function (resolve, reject) {
						returnedResolve = resolve;
						returnedReject = reject;
					});

					if (typeof onRes === 'function') {
						resolveHandler = onRes;

						if (state === 'fulfilled') {
							try {
								value = resolveHandler(value);
								returnedResolve(value);
							}
							catch (err) {
								onRej && onRej(err);
								returnedReject(err);
							}
						}
						else if (state === 'rejected') {
							returnedReject(value);
						}
					}

					if (typeof onRej === 'function') {
						rejectHandler = onRej;

						if (state === 'rejected') {
							try {
								value = rejectHandler(value);
								returnedResolve(value);
							}
							catch (err) {
								returnedReject(err);
							}
						}
					}

					return newPromise;
				},
				catch: function (onRej) {
					let newPromise = _js.promise(function (resolve, reject) {
						returnedResolve = resolve;
						returnedReject = reject;
					});

					if (typeof onRej === 'function') {
						rejectHandler = onRej;

						if (state === 'rejected') {
							try {
								value = rejectHandler(value);
								returnedResolve(value);
							}
							catch (err) {
								returnedReject(err);
							}
						}
					}

					return newPromise;
				}
			};

			const promise = Object.create(promiseProto);

			function resolve(msg) { // may be called async
				if (state === 'pending') {
					value = msg;
					state = 'fulfilled';

					if (resolveHandler) {
						try {
							value = resolveHandler(value); // if resolve called async, fire registered handlers
							returnedResolve(value);
						}
						catch (err) {
							returnedReject(err);
						}
					}
					else if (returnedResolve) {
						returnedResolve(value);
					}
				}
			}

			function reject(rsn) { // may be called async
				if (state === 'pending') {
					value = rsn;
					state = 'rejected';

					if (rejectHandler) {
						try {
							value = rejectHandler(value); // if reject called async, fire registered handlers	
							returnedResolve(value);
						}
						catch (err) {
							returnedReject(err);
						}
					}
					else if (returnedReject) {
						returnedReject(value);
					}
				}
			}

			if (typeof callback === 'function') {
				try {
					callback(resolve, reject);
				}
				catch (err) {
					state = 'rejected';
					value = err;
					rejectHandler && rejectHandler(value);
				}
			}

			return promise;
		},
		'observeProperty': function (obj, prop, onchange) {
			const value = obj[prop];

			if (delete obj[prop] && typeof onchange === 'function') {
				Object.defineProperty(obj, prop, {
					enumerable: true,
					configurable: true,
					set: function (val) {
						value = onchange(prop, value, val);
					},
					get: function () {
						return value;
					}
				});
			}
		},
		'params': function (input) {
			let result;

			if (typeof input === 'string') {
				const position = input.indexOf('?');

				if (position !== -1) {
					input = input.slice(position);
				}

				const parts = input.split('&');
				result = {};

				parts.forEach(function (part) {
					let keyValue = part.split('=');
					result[keyValue[0]] = keyValue[1];
				});
			}
			else if (_js.isArray(input)) {
				result = input.join('&');
			}
			else if (typeof input === 'object') {
				result = '';

				for (const key in input) {
					if (result) {
						result += '&';
					}

					result += key + '=' + input[key];
				}
			}

			return result;
		},
		'jsonp': function (url, callback, paramName) {
			const script = document.createElement('script');
			const callbackName = 'jsKit_' + Math.floor(Math.random() * 1e12) + Math.floor(Math.random() * 1e12);

			if (typeof callback === 'function') {
				window[callbackName] = callback;

				script.addEventListener('load', function () {
					document.body.removeChild(script);
					delete window[callbackName];
				}, false);

				script.src = url + (url.indexOf('?') === -1 ? '?' : '&') + (paramName || 'callback') + '=' + callbackName;
				document.body.appendChild(script);
			}
		},
		'deferred': function () {
			const def = {};

			def.promise = _js.promise(function (resolve, reject) {
				def.resolve = resolve;
				def.reject = reject;
			});

			return def;
		},
		'getObjectKeyPathes': function (obj) {
			const result = {};

			function nextLevel(startWith, o) {
				if (_js.isArray(o)) {
					for (let i = 0, iLen = o.length; i < iLen; i++) {
						if (startWith.length) {
							const currentPath = startWith + '[' + i + ']';

							if (currentPath in result) { // avoid infinite recursive objects
								return result;
							}

							result[currentPath] = o[i]; // [0]
							nextLevel(currentPath, o[i]);

							result[currentPath = startWith + '[\'' + i + '\']'] = o[i]; // ['0']
							nextLevel(currentPath, o[i]);

							result[currentPath = startWith + '["' + i + '"]'] = o[i]; // ["0"]
							nextLevel(currentPath, o[i]);
						}
						else {
							result[i] = o[i];
							nextLevel(i, o[i]);
						}
					}
				}
				else if (typeof o === 'object') {
					for (const prop in o) {
						if (o.hasOwnProperty(prop)) {
							if (startWith.length) {
								const currentPath = startWith + '.' + prop

								if (currentPath in result) { // avoid infinite recursive objects
									return result;
								}

								result[currentPath] = o[prop]; // .abc
								nextLevel(currentPath, o[prop]);

								result[currentPath = startWith + '[\'' + prop + '\']'] = o[prop]; // ['abc']
								nextLevel(currentPath, o[prop]);

								result[currentPath = startWith + '["\'"' + prop + '"]'] = o[prop]; // ["abc"]
								nextLevel(currentPath, o[prop]);
							}
							else {
								result[prop] = o[prop];
								nextLevel(prop, o[prop]);
							}
						}
					}
				}
			}

			nextLevel('', obj)
			return result;
		},
		'fillTemplate': function (template, data) {
			return template && String(template).replace(/\{\{(\s?[^\}]+)\}\}/g, function (match, key) { // match mustaches
				let result;
				key = key.trim();

				try {
					result = eval('data' + (key.charAt(0) === '[' ? '' : '.') + key);
					result === undefined && (result = '');
				}
				catch (err) {
					result = '';
				}

				return result;
			});
		},
		'curry': function (fn) {
			const _this = this;
			const args = [];

			if (typeof fn === 'function') {
				return function currying() {
					Array.prototype.push.apply(args, arguments);
					return (args.length >= fn.length) ? fn.apply(_this, args) : currying; // if we have enough args, call the function else wait for more params
				};
			}
		},
		'inlineStylesheet': function (stylesheet) {
			return new Promise(function (resolve, reject) {
				const doc = document.cloneNode(true);

				function getDoctypeString(doctype) {
					return '<!DOCTYPE ' + doctype.name + (doctype.publicId ? ' PUBLIC "' + doctype.publicId + '"' : '') + (!doctype.publicId && doctype.systemId ? ' SYSTEM' : '') + (doctype.systemId ? ' "' + doctype.systemId + '"' : '') + '>';
				};

				for (let i = 0, iLen = stylesheet.cssRules.length; i < iLen; i++) { // loop through cssRules

					const currentCssRule = stylesheet.cssRules[i];
					//console.log(currentCssRule.toString(), currentCssRule);

					if (currentCssRule.style) { // css rule
						const currentSelection = doc.querySelectorAll(currentCssRule.selectorText);

						for (let j = 0, jLen = currentCssRule.style.length; j < jLen; j++) { // loop through styles
							for (let k = 0, kLen = currentSelection.length; k < kLen; k++) { // loop through element selection to apply styles
								currentSelection[k].style[currentCssRule.style[j]] = currentCssRule.style[currentCssRule.style[j]].replace(/'/g, '"');
							}
						}
					}
					else if (currentCssRule.conditionText) { // media query
						if (matchMedia(currentCssRule.conditionText).matches) { // media query matches
							for (let j = 0, jLen = currentCssRule.cssRules.length; j < jLen; j++) { // loop through css rules of media query
								const currentSelection = doc.querySelectorAll(currentCssRule.cssRules[j].selectorText);

								for (let k = 0, kLen = currentCssRule.cssRules[j].style.length; k < kLen; k++) { // loop through styles of media query
									for (let l = 0, lLen = currentSelection.length; l < lLen; l++) { // loop through element selection to apply styles
										currentSelection[l].style[currentCssRule.cssRules[j].style[k]] = currentCssRule.cssRules[j].style[currentCssRule.cssRules[j].style[k]].replace(/'/g, '"');
									}
								}
							}
						}
					}
				}

				// remove all style-, script- and link-elements

				if (stylesheet.ownerNode && stylesheet.ownerNode.hasAttribute('href')) {
					const xhr = new XMLHttpRequest();

					xhr.onload = function () {
						const style = document.createElement('style');
						const output = getDoctypeString(document.doctype);

						style.innerHTML = xhr.responseText.replace(/\/\*[^]*?\*\//gm, '');
						doc.head.appendChild(style);

						const removeElements = doc.querySelectorAll('link, style[href], script');

						for (let i = 0, iLen = removeElements.length; i < iLen; i++) {
							removeElements[i].parentNode.removeChild(removeElements[i]);
						}

						output += doc.documentElement.outerHTML;
						output = output.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/style=[''](.*)['']/g, function (match, $1) {
							return 'style=\'' + $1.replace(/&quot;/g, '"') + '\'';
						});

						resolve(output);
					};

					xhr.onerror = function () {
						output = 'XHR-ERROR';
						reject(output);
					};

					xhr.open('GET', stylesheet.ownerNode.getAttribute('href'), true);
					xhr.send();
				}
			});
		},
		'getNextDSTDate': function (startDate) { // get next date of Daylight Saving Time
			const date = (startDate instanceof Date) ? startDate : new Date();
			const max = 365;

			date.setHours(23, 59, 59);
			const diff = date.getTimezoneOffset();

			for (let i = 0; i < max; i++) {
				date.setDate(date.getDate() + 1);
				const currentDiff = date.getTimezoneOffset()

				if (currentDiff !== diff) {
					date.setHours(0, 0, 0, 0);

					return {
						date: date,
						offsetChange: diff - currentDiff
					};
				}
			}

			return null;
		},
		'Observable': (function () {
			function Observable(callback, initVal) {
				const _this = this;

				if (typeof callback === 'function') {
					_this.observers = [];
					let value = initVal;

					callback.call(_this, function (newVal) { // setter
						let oldVal;

						if (newVal !== value) {
							oldVal = value;
							value = newVal;

							_this.observers.forEach(observer => {
								observer(value, oldVal);
							});
						}
					}, function () { // getter
						return value;
					});
				}
				else {
					throw new TypeError('Observable must receive a function as first parameter.');
				}
			}

			Observable.prototype.subscribe = function (observer) {
				let _this = this;

				if (typeof observer === 'function') {
					_this.observers.push(observer);
					return _this.unsubscribe.bind(_this, observer);
				}

				return null;
			};

			Observable.prototype.unsubscribe = function (observer) {
				const i = this.observers.indexOf(observer);
				return i > -1 ? this.observers.splice(i, 1)[0] : null;
			};

			return Observable;
		})(),
		'random': function () { // this method should return a more random number by using `window.crypto` than the usual `Math.random`
			const random = Math.random();

			if (!crypto || !random) { // if random is zero, return it to avoid problems in following logic
				return random;
			}

			const length = random.toString().split('.').pop().length;
			const source = crypto.getRandomValues(new Uint16Array(length));
			const numbers = _js.toArray(source).map(function (rand) {
				return rand.toString().split('').map(Number).reduce(function (acc, el) {
					return acc + el; // calculate digit sum
				}, 0);
			}).map(function (x) {
				x = x.toString();
				return x.charAt(x.length - 1); // use the last digit of each digit sum
			});

			return Number('.' + numbers.join(''));
		}
	};

	return _js;
})();