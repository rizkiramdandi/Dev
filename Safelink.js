/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */
(function () {
	// Private helper vars
	var lang = /\blang(?:uage)?-(?!\*)(\w+)\b/i;
	var _ = self.Prism = {
		languages: {
			insertBefore: function (inside, before, insert, root) {
				root = root || _.languages;
				var grammar = root[inside];
				var ret = {};
				for (var token in grammar) {
					if (grammar.hasOwnProperty(token)) {
						if (token == before) {
							for (var newToken in insert) {
								if (insert.hasOwnProperty(newToken)) {
									ret[newToken] = insert[newToken];
								}
							}
						}
						ret[token] = grammar[token];
					}
				}
				return root[inside] = ret;
			},
			DFS: function (o, callback) {
				for (var i in o) {
					callback.call(o, i, o[i]);
					if (Object.prototype.toString.call(o) === '[object Object]') {
						_.languages.DFS(o[i], callback);
					}
				}
			}
		},
		highlightAll: function (async, callback) {
			var elements = document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code');
			for (var i = 0, element; element = elements[i++];) {
				_.highlightElement(element, async === true, callback);
			}
		},
		highlightElement: function (element, async, callback) {
			// Find language
			var language, grammar, parent = element;
			while (parent && !lang.test(parent.className)) {
				parent = parent.parentNode;
			}
			if (parent) {
				language = (parent.className.match(lang) || [, ''])[1];
				grammar = _.languages[language];
			}
			if (!grammar) {
				return;
			}
			// Set language on the element, if not present
			element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
			// Set language on the parent, for styling
			parent = element.parentNode;
			if (/pre/i.test(parent.nodeName)) {
				parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
			}
			var code = element.textContent.trim();
			if (!code) {
				return;
			}
			code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00a0/g, ' ');
			//console.time(code.slice(0,50));
			var env = {
				element: element,
				language: language,
				grammar: grammar,
				code: code
			};
			_.hooks.run('before-highlight', env);
			if (async && self.Worker) {
				var worker = new Worker(_.filename);
				worker.onmessage = function (evt) {
					env.highlightedCode = Token.stringify(JSON.parse(evt.data));
					env.element.innerHTML = env.highlightedCode;
					callback && callback.call(env.element);
					//console.timeEnd(code.slice(0,50));
					_.hooks.run('after-highlight', env);
				};
				worker.postMessage(JSON.stringify({
					language: env.language,
					code: env.code
				}));
			} else {
				env.highlightedCode = _.highlight(env.code, env.grammar)
				env.element.innerHTML = env.highlightedCode;
				callback && callback.call(element);
				_.hooks.run('after-highlight', env);
				//console.timeEnd(code.slice(0,50));
			}
		},
		highlight: function (text, grammar) {
			return Token.stringify(_.tokenize(text, grammar));
		},
		tokenize: function (text, grammar) {
			var Token = _.Token;
			var strarr = [text];
			var rest = grammar.rest;
			if (rest) {
				for (var token in rest) {
					grammar[token] = rest[token];
				}
				delete grammar.rest;
			}
			tokenloop: for (var token in grammar) {
				if (!grammar.hasOwnProperty(token) || !grammar[token]) {
					continue;
				}
				var pattern = grammar[token],
					inside = pattern.inside,
					lookbehind = !! pattern.lookbehind || 0;
				pattern = pattern.pattern || pattern;
				for (var i = 0; i < strarr.length; i++) { // Don’t cache length as it changes during the loop
					var str = strarr[i];
					if (strarr.length > text.length) {
						// Something went terribly wrong, ABORT, ABORT!
						break tokenloop;
					}
					if (str instanceof Token) {
						continue;
					}
					pattern.lastIndex = 0;
					var match = pattern.exec(str);
					if (match) {
						if (lookbehind) {
							lookbehind = match[1].length;
						}
						var from = match.index - 1 + lookbehind,
							match = match[0].slice(lookbehind),
							len = match.length,
							to = from + len,
							before = str.slice(0, from + 1),
							after = str.slice(to + 1);
						var args = [i, 1];
						if (before) {
							args.push(before);
						}
						var wrapped = new Token(token, inside ? _.tokenize(match, inside) : match);
						args.push(wrapped);
						if (after) {
							args.push(after);
						}
						Array.prototype.splice.apply(strarr, args);
					}
				}
			}
			return strarr;
		},
		hooks: {
			all: {},
			add: function (name, callback) {
				var hooks = _.hooks.all;
				hooks[name] = hooks[name] || [];
				hooks[name].push(callback);
			},
			run: function (name, env) {
				var callbacks = _.hooks.all[name];
				if (!callbacks || !callbacks.length) {
					return;
				}
				for (var i = 0, callback; callback = callbacks[i++];) {
					callback(env);
				}
			}
		}
	};
	var Token = _.Token = function (type, content) {
			this.type = type;
			this.content = content;
		};
	Token.stringify = function (o) {
		if (typeof o == 'string') {
			return o;
		}
		if (Object.prototype.toString.call(o) == '[object Array]') {
			for (var i = 0; i < o.length; i++) {
				o[i] = Token.stringify(o[i]);
			}
			return o.join('');
		}
		var env = {
			type: o.type,
			content: Token.stringify(o.content),
			tag: 'span',
			classes: ['token', o.type],
			attributes: {}
		};
		if (env.type == 'comment') {
			env.attributes['spellcheck'] = 'true';
		}
		_.hooks.run('wrap', env);
		var attributes = '';
		for (var name in env.attributes) {
			attributes += name + '="' + (env.attributes[name] || '') + '"';
		}
		return '<' + env.tag + ' class="' + env.classes.join(' ') + '" ' + attributes + '>' + env.content + '</' + env.tag + '>';
	};
	if (!self.document) {
		// In worker
		self.addEventListener('message', function (evt) {
			var message = JSON.parse(evt.data),
				lang = message.language,
				code = message.code;
			self.postMessage(JSON.stringify(_.tokenize(code, _.languages[lang])));
			self.close();
		}, false);
		return;
	}
	// Get current script and highlight
	var script = document.getElementsByTagName('script');
	script = script[script.length - 1];
	if (script) {
		_.filename = script.src;
		if (document.addEventListener && !script.hasAttribute('data-manual')) {
			document.addEventListener('DOMContentLoaded', _.highlightAll);
		}
	}
})();
Prism.languages.markup = {
	'comment': /&lt;!--[\w\W]*?--(&gt;|&gt;)/g,
	'prolog': /&lt;\?.+?\?&gt;/,
	'doctype': /&lt;!DOCTYPE.+?&gt;/,
	'cdata': /&lt;!\[CDATA\[[\w\W]+?]]&gt;/i,
	'tag': {
		pattern: /&lt;\/?[\w:-]+\s*[\w\W]*?&gt;/gi,
		inside: {
			'tag': {
				pattern: /^&lt;\/?[\w:-]+/i,
				inside: {
					'punctuation': /^&lt;\/?/,
					'namespace': /^[\w-]+?:/
				}
			},
			'attr-value': {
				pattern: /=(('|")[\w\W]*?(\2)|[^\s>]+)/gi,
				inside: {
					'punctuation': /=/g
				}
			},
			'punctuation': /\/?&gt;/g,
			'attr-name': {
				pattern: /[\w:-]+/g,
				inside: {
					'namespace': /^[\w-]+?:/
				}
			}
		}
	},
	'entity': /&amp;#?[\da-z]{1,8};/gi
};
// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function (env) {
	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});
Prism.languages.css = {
	'comment': /\/\*[\w\W]*?\*\//g,
	'atrule': /@[\w-]+?(\s+.+)?(?=\s*{|\s*;)/gi,
	'url': /url\((["']?).*?\1\)/gi,
	'selector': /[^\{\}\s][^\{\}]*(?=\s*\{)/g,
	'property': /(\b|\B)[a-z-]+(?=\s*:)/ig,
	'string': /("|')(\\?.)*?\1/g,
	'important': /\B!important\b/gi,
	'ignore': /&(lt|gt|amp);/gi,
	'punctuation': /[\{\};:]/g
};
if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'style': {
			pattern: /(&lt;|<)style[\w\W]*?(>|&gt;)[\w\W]*?(&lt;|<)\/style(>|&gt;)/ig,
			inside: {
				'tag': {
					pattern: /(&lt;|<)style[\w\W]*?(>|&gt;)|(&lt;|<)\/style(>|&gt;)/ig,
					inside: Prism.languages.markup.tag.inside
				},
				rest: Prism.languages.css
			}
		}
	});
}
Prism.languages.javascript = {
	'comment': {
		pattern: /(^|[^\\])(\/\*[\w\W]*?\*\/|\/\/.*?(\r?\n|$))/g,
		lookbehind: true
	},
	'string': /("|')(\\?.)*?\1/g,
	'regex': {
		pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/g,
		lookbehind: true
	},
	'keyword': /\b(var|let|if|else|while|do|for|return|in|instanceof|function|new|with|typeof|try|catch|finally|null|break|continue)\b/g,
	'boolean': /\b(true|false)\b/g,
	'number': /\b-?(0x)?\d*\.?\d+\b/g,
	'operator': /[-+]{1,2}|!|=?&lt;|=?&gt;|={1,2}|(&amp;){1,2}|\|?\||\?|\*|\//g,
	'ignore': /&(lt|gt|amp);/gi,
	'punctuation': /[{}[\];(),.:]/g
};
if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'script': {
			pattern: /(&lt;|<)script[\w\W]*?(>|&gt;)[\w\W]*?(&lt;|<)\/script(>|&gt;)/ig,
			inside: {
				'tag': {
					pattern: /(&lt;|<)script[\w\W]*?(>|&gt;)|(&lt;|<)\/script(>|&gt;)/ig,
					inside: Prism.languages.markup.tag.inside
				},
				rest: Prism.languages.javascript
			}
		}
	});
}
Prism.languages.java = {
	'comment': {
		pattern: /(^|[^\\])(\/\*[\w\W]*?\*\/|\/\/.*?(\r?\n|$))/g,
		lookbehind: true
	},
	'string': /("|')(\\?.)*?\1/g,
	'keyword': /\b(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)\b/g,
	'boolean': /\b(true|false)\b/g,
	'number': /\b0b[01]+\b|\b0x[\da-f]*\.?[\da-fp\-]+\b|\b\d*\.?\d+[e]?[\d]*[df]\b|\W\d*\.?\d+\b/gi,
	'operator': {
		pattern: /([^\.]|^)([-+]{1,2}|!|=?&lt;|=?&gt;|={1,2}|(&amp;){1,2}|\|?\||\?|\*|\/|%|\^|(&lt;){2}|($gt;){2,3}|:|~)/g,
		lookbehind: true
	},
	'ignore': /&(lt|gt|amp);/gi,
	'punctuation': /[{}[\];(),.:]/g,
};
// Cokkie
!function(e){if(!e.hasInitialised){var t={escapeRegExp:function(e){return e.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&")},hasClass:function(e,t){var i=" ";return 1===e.nodeType&&(i+e.className+i).replace(/[\n\t]/g,i).indexOf(i+t+i)>=0},addClass:function(e,t){e.className+=" "+t},removeClass:function(e,t){var i=new RegExp("\\b"+this.escapeRegExp(t)+"\\b");e.className=e.className.replace(i,"")},interpolateString:function(e,t){var i=/{{([a-z][a-z0-9\-_]*)}}/gi;return e.replace(i,function(e){return t(arguments[1])||""})},getCookie:function(e){var t="; "+document.cookie,i=t.split("; "+e+"=");return i.length<2?void 0:i.pop().split(";").shift()},setCookie:function(e,t,i,n,o,s){var r=new Date;r.setDate(r.getDate()+(i||365));var a=[e+"="+t,"expires="+r.toUTCString(),"path="+(o||"/")];n&&a.push("domain="+n),s&&a.push("secure"),document.cookie=a.join(";")},deepExtend:function(e,t){for(var i in t)t.hasOwnProperty(i)&&(i in e&&this.isPlainObject(e[i])&&this.isPlainObject(t[i])?this.deepExtend(e[i],t[i]):e[i]=t[i]);return e},throttle:function(e,t){var i=!1;return function(){i||(e.apply(this,arguments),i=!0,setTimeout(function(){i=!1},t))}},hash:function(e){var t,i,n,o=0;if(0===e.length)return o;for(t=0,n=e.length;t<n;++t)i=e.charCodeAt(t),o=(o<<5)-o+i,o|=0;return o},normaliseHex:function(e){return"#"==e[0]&&(e=e.substr(1)),3==e.length&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]),e},getContrast:function(e){e=this.normaliseHex(e);var t=parseInt(e.substr(0,2),16),i=parseInt(e.substr(2,2),16),n=parseInt(e.substr(4,2),16),o=(299*t+587*i+114*n)/1e3;return o>=128?"#000":"#fff"},getLuminance:function(e){var t=parseInt(this.normaliseHex(e),16),i=38,n=(t>>16)+i,o=(t>>8&255)+i,s=(255&t)+i,r=(16777216+65536*(n<255?n<1?0:n:255)+256*(o<255?o<1?0:o:255)+(s<255?s<1?0:s:255)).toString(16).slice(1);return"#"+r},isMobile:function(){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)},isPlainObject:function(e){return"object"==typeof e&&null!==e&&e.constructor==Object},traverseDOMPath:function(e,i){return e&&e.parentNode?t.hasClass(e,i)?e:this.traverseDOMPath(e.parentNode,i):null}};e.status={deny:"deny",allow:"allow",dismiss:"dismiss"},e.transitionEnd=function(){var e=document.createElement("div"),t={t:"transitionend",OT:"oTransitionEnd",msT:"MSTransitionEnd",MozT:"transitionend",WebkitT:"webkitTransitionEnd"};for(var i in t)if(t.hasOwnProperty(i)&&"undefined"!=typeof e.style[i+"ransition"])return t[i];return""}(),e.hasTransition=!!e.transitionEnd;var i=Object.keys(e.status).map(t.escapeRegExp);e.customStyles={},e.Popup=function(){function n(){this.initialise.apply(this,arguments)}function o(e){this.openingTimeout=null,t.removeClass(e,"cc-invisible")}function s(t){t.style.display="none",t.removeEventListener(e.transitionEnd,this.afterTransition),this.afterTransition=null}function r(){var t=this.options.onInitialise.bind(this);if(!window.navigator.cookieEnabled)return t(e.status.deny),!0;if(window.CookiesOK||window.navigator.CookiesOK)return t(e.status.allow),!0;var i=Object.keys(e.status),n=this.getStatus(),o=i.indexOf(n)>=0;return o&&t(n),o}function a(){var e=this.options.position.split("-"),t=[];return e.forEach(function(e){t.push("cc-"+e)}),t}function c(){var e=this.options,i="top"==e.position||"bottom"==e.position?"banner":"floating";t.isMobile()&&(i="floating");var n=["cc-"+i,"cc-type-"+e.type,"cc-theme-"+e.theme];e["static"]&&n.push("cc-static"),n.push.apply(n,a.call(this));p.call(this,this.options.palette);return this.customStyleSelector&&n.push(this.customStyleSelector),n}function l(){var e={},i=this.options;i.showLink||(i.elements.link="",i.elements.messagelink=i.elements.message),Object.keys(i.elements).forEach(function(n){e[n]=t.interpolateString(i.elements[n],function(e){var t=i.content[e];return e&&"string"==typeof t&&t.length?t:""})});var n=i.compliance[i.type];n||(n=i.compliance.info),e.compliance=t.interpolateString(n,function(t){return e[t]});var o=i.layouts[i.layout];return o||(o=i.layouts.basic),t.interpolateString(o,function(t){return e[t]})}function u(i){var n=this.options,o=document.createElement("div"),s=n.container&&1===n.container.nodeType?n.container:document.body;o.innerHTML=i;var r=o.children[0];return r.style.display="none",t.hasClass(r,"cc-window")&&e.hasTransition&&t.addClass(r,"cc-invisible"),this.onButtonClick=h.bind(this),r.addEventListener("click",this.onButtonClick),n.autoAttach&&(s.firstChild?s.insertBefore(r,s.firstChild):s.appendChild(r)),r}function h(n){var o=t.traverseDOMPath(n.target,"cc-btn")||n.target;if(t.hasClass(o,"cc-btn")){var s=o.className.match(new RegExp("\\bcc-("+i.join("|")+")\\b")),r=s&&s[1]||!1;r&&(this.setStatus(r),this.close(!0))}t.hasClass(o,"cc-close")&&(this.setStatus(e.status.dismiss),this.close(!0)),t.hasClass(o,"cc-revoke")&&this.revokeChoice()}function p(e){var i=t.hash(JSON.stringify(e)),n="cc-color-override-"+i,o=t.isPlainObject(e);return this.customStyleSelector=o?n:null,o&&d(i,e,"."+n),o}function d(i,n,o){if(e.customStyles[i])return void++e.customStyles[i].references;var s={},r=n.popup,a=n.button,c=n.highlight;r&&(r.text=r.text?r.text:t.getContrast(r.background),r.link=r.link?r.link:r.text,s[o+".cc-window"]=["color: "+r.text,"background-color: "+r.background],s[o+".cc-revoke"]=["color: "+r.text,"background-color: "+r.background],s[o+" .cc-link,"+o+" .cc-link:active,"+o+" .cc-link:visited"]=["color: "+r.link],a&&(a.text=a.text?a.text:t.getContrast(a.background),a.border=a.border?a.border:"transparent",s[o+" .cc-btn"]=["color: "+a.text,"border-color: "+a.border,"background-color: "+a.background],a.padding&&s[o+" .cc-btn"].push("padding: "+a.padding),"transparent"!=a.background&&(s[o+" .cc-btn:hover, "+o+" .cc-btn:focus"]=["background-color: "+(a.hover||v(a.background))]),c?(c.text=c.text?c.text:t.getContrast(c.background),c.border=c.border?c.border:"transparent",s[o+" .cc-highlight .cc-btn:first-child"]=["color: "+c.text,"border-color: "+c.border,"background-color: "+c.background]):s[o+" .cc-highlight .cc-btn:first-child"]=["color: "+r.text]));var l=document.createElement("style");document.head.appendChild(l),e.customStyles[i]={references:1,element:l.sheet};var u=-1;for(var h in s)s.hasOwnProperty(h)&&l.sheet.insertRule(h+"{"+s[h].join(";")+"}",++u)}function v(e){return e=t.normaliseHex(e),"000000"==e?"#222":t.getLuminance(e)}function f(i){if(t.isPlainObject(i)){var n=t.hash(JSON.stringify(i)),o=e.customStyles[n];if(o&&!--o.references){var s=o.element.ownerNode;s&&s.parentNode&&s.parentNode.removeChild(s),e.customStyles[n]=null}}}function m(e,t){for(var i=0,n=e.length;i<n;++i){var o=e[i];if(o instanceof RegExp&&o.test(t)||"string"==typeof o&&o.length&&o===t)return!0}return!1}function b(){var i=this.setStatus.bind(this),n=this.close.bind(this),o=this.options.dismissOnTimeout;"number"==typeof o&&o>=0&&(this.dismissTimeout=window.setTimeout(function(){i(e.status.dismiss),n(!0)},Math.floor(o)));var s=this.options.dismissOnScroll;if("number"==typeof s&&s>=0){var r=function(t){window.pageYOffset>Math.floor(s)&&(i(e.status.dismiss),n(!0),window.removeEventListener("scroll",r),this.onWindowScroll=null)};this.options.enabled&&(this.onWindowScroll=r,window.addEventListener("scroll",r))}var a=this.options.dismissOnWindowClick,c=this.options.ignoreClicksFrom;if(a){var l=function(o){for(var s=!1,r=o.path.length,a=c.length,u=0;u<r;u++)if(!s)for(var h=0;h<a;h++)s||(s=t.hasClass(o.path[u],c[h]));s||(i(e.status.dismiss),n(!0),window.removeEventListener("click",l),this.onWindowClick=null)}.bind(this);this.options.enabled&&(this.onWindowClick=l,window.addEventListener("click",l))}}function g(){if("info"!=this.options.type&&(this.options.revokable=!0),t.isMobile()&&(this.options.animateRevokable=!1),this.options.revokable){var e=a.call(this);this.options.animateRevokable&&e.push("cc-animate"),this.customStyleSelector&&e.push(this.customStyleSelector);var i=this.options.revokeBtn.replace("{{classes}}",e.join(" ")).replace("{{policy}}",this.options.content.policy);this.revokeBtn=u.call(this,i);var n=this.revokeBtn;if(this.options.animateRevokable){var o=t.throttle(function(e){var i=!1,o=20,s=window.innerHeight-20;t.hasClass(n,"cc-top")&&e.clientY<o&&(i=!0),t.hasClass(n,"cc-bottom")&&e.clientY>s&&(i=!0),i?t.hasClass(n,"cc-active")||t.addClass(n,"cc-active"):t.hasClass(n,"cc-active")&&t.removeClass(n,"cc-active")},200);this.onMouseMove=o,window.addEventListener("mousemove",o)}}}var y={enabled:!0,container:null,cookie:{name:"cookieconsent_status",path:"/",domain:"",expiryDays:365,secure:!1},onPopupOpen:function(){},onPopupClose:function(){},onInitialise:function(e){},onStatusChange:function(e,t){},onRevokeChoice:function(){},onNoCookieLaw:function(e,t){},content:{header:"Cookies used on the website!",message:"This website uses cookies to ensure you get the best experience on our website.",dismiss:"Got it!",allow:"Allow cookies",deny:"Decline",link:"Learn more",href:"https://cookiesandyou.com",close:"&#x274c;",target:"_blank",policy:"Cookie Policy"},elements:{header:'<span class="cc-header">{{header}}</span>&nbsp;',message:'<span id="cookieconsent:desc" class="cc-message">{{message}}</span>',messagelink:'<span id="cookieconsent:desc" class="cc-message">{{message}} <a aria-label="learn more about cookies" role=button tabindex="0" class="cc-link" href="{{href}}" rel="noopener noreferrer nofollow" target="{{target}}">{{link}}</a></span>',dismiss:'<a aria-label="dismiss cookie message" role=button tabindex="0" class="cc-btn cc-dismiss">{{dismiss}}</a>',allow:'<a aria-label="allow cookies" role=button tabindex="0"  class="cc-btn cc-allow">{{allow}}</a>',deny:'<a aria-label="deny cookies" role=button tabindex="0" class="cc-btn cc-deny">{{deny}}</a>',link:'<a aria-label="learn more about cookies" role=button tabindex="0" class="cc-link" href="{{href}}" rel="noopener noreferrer nofollow" target="{{target}}">{{link}}</a>',close:'<span aria-label="dismiss cookie message" role=button tabindex="0" class="cc-close">{{close}}</span>'},window:'<div role="dialog" aria-live="polite" aria-label="cookieconsent" aria-describedby="cookieconsent:desc" class="cc-window {{classes}}"><!--googleoff: all-->{{children}}<!--googleon: all--></div>',revokeBtn:'<div class="cc-revoke {{classes}}">{{policy}}</div>',compliance:{info:'<div class="cc-compliance">{{dismiss}}</div>',"opt-in":'<div class="cc-compliance cc-highlight">{{deny}}{{allow}}</div>',"opt-out":'<div class="cc-compliance cc-highlight">{{deny}}{{allow}}</div>'},type:"info",layouts:{basic:"{{messagelink}}{{compliance}}","basic-close":"{{messagelink}}{{compliance}}{{close}}","basic-header":"{{header}}{{message}}{{link}}{{compliance}}"},layout:"basic",position:"bottom",theme:"block","static":!1,palette:null,revokable:!1,animateRevokable:!0,showLink:!0,dismissOnScroll:!1,dismissOnTimeout:!1,dismissOnWindowClick:!1,ignoreClicksFrom:["cc-revoke","cc-btn"],autoOpen:!0,autoAttach:!0,whitelistPage:[],blacklistPage:[],overrideHTML:null};return n.prototype.initialise=function(e){this.options&&this.destroy(),t.deepExtend(this.options={},y),t.isPlainObject(e)&&t.deepExtend(this.options,e),r.call(this)&&(this.options.enabled=!1),m(this.options.blacklistPage,location.pathname)&&(this.options.enabled=!1),m(this.options.whitelistPage,location.pathname)&&(this.options.enabled=!0);var i=this.options.window.replace("{{classes}}",c.call(this).join(" ")).replace("{{children}}",l.call(this)),n=this.options.overrideHTML;if("string"==typeof n&&n.length&&(i=n),this.options["static"]){var o=u.call(this,'<div class="cc-grower">'+i+"</div>");o.style.display="",this.element=o.firstChild,this.element.style.display="none",t.addClass(this.element,"cc-invisible")}else this.element=u.call(this,i);b.call(this),g.call(this),this.options.autoOpen&&this.autoOpen()},n.prototype.destroy=function(){this.onButtonClick&&this.element&&(this.element.removeEventListener("click",this.onButtonClick),this.onButtonClick=null),this.dismissTimeout&&(clearTimeout(this.dismissTimeout),this.dismissTimeout=null),this.onWindowScroll&&(window.removeEventListener("scroll",this.onWindowScroll),this.onWindowScroll=null),this.onWindowClick&&(window.removeEventListener("click",this.onWindowClick),this.onWindowClick=null),this.onMouseMove&&(window.removeEventListener("mousemove",this.onMouseMove),this.onMouseMove=null),this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.element=null,this.revokeBtn&&this.revokeBtn.parentNode&&this.revokeBtn.parentNode.removeChild(this.revokeBtn),this.revokeBtn=null,f(this.options.palette),this.options=null},n.prototype.open=function(t){if(this.element)return this.isOpen()||(e.hasTransition?this.fadeIn():this.element.style.display="",this.options.revokable&&this.toggleRevokeButton(),this.options.onPopupOpen.call(this)),this},n.prototype.close=function(t){if(this.element)return this.isOpen()&&(e.hasTransition?this.fadeOut():this.element.style.display="none",t&&this.options.revokable&&this.toggleRevokeButton(!0),this.options.onPopupClose.call(this)),this},n.prototype.fadeIn=function(){var i=this.element;if(e.hasTransition&&i&&(this.afterTransition&&s.call(this,i),t.hasClass(i,"cc-invisible"))){if(i.style.display="",this.options["static"]){var n=this.element.clientHeight;this.element.parentNode.style.maxHeight=n+"px"}var r=20;this.openingTimeout=setTimeout(o.bind(this,i),r)}},n.prototype.fadeOut=function(){var i=this.element;e.hasTransition&&i&&(this.openingTimeout&&(clearTimeout(this.openingTimeout),o.bind(this,i)),t.hasClass(i,"cc-invisible")||(this.options["static"]&&(this.element.parentNode.style.maxHeight=""),this.afterTransition=s.bind(this,i),i.addEventListener(e.transitionEnd,this.afterTransition),t.addClass(i,"cc-invisible")))},n.prototype.isOpen=function(){return this.element&&""==this.element.style.display&&(!e.hasTransition||!t.hasClass(this.element,"cc-invisible"))},n.prototype.toggleRevokeButton=function(e){this.revokeBtn&&(this.revokeBtn.style.display=e?"":"none")},n.prototype.revokeChoice=function(e){this.options.enabled=!0,this.clearStatus(),this.options.onRevokeChoice.call(this),e||this.autoOpen()},n.prototype.hasAnswered=function(t){return Object.keys(e.status).indexOf(this.getStatus())>=0},n.prototype.hasConsented=function(t){var i=this.getStatus();return i==e.status.allow||i==e.status.dismiss},n.prototype.autoOpen=function(e){!this.hasAnswered()&&this.options.enabled?this.open():this.hasAnswered()&&this.options.revokable&&this.toggleRevokeButton(!0)},n.prototype.setStatus=function(i){var n=this.options.cookie,o=t.getCookie(n.name),s=Object.keys(e.status).indexOf(o)>=0;Object.keys(e.status).indexOf(i)>=0?(t.setCookie(n.name,i,n.expiryDays,n.domain,n.path,n.secure),this.options.onStatusChange.call(this,i,s)):this.clearStatus()},n.prototype.getStatus=function(){return t.getCookie(this.options.cookie.name)},n.prototype.clearStatus=function(){var e=this.options.cookie;t.setCookie(e.name,"",-1,e.domain,e.path)},n}(),e.Location=function(){function e(e){t.deepExtend(this.options={},s),t.isPlainObject(e)&&t.deepExtend(this.options,e),this.currentServiceIndex=-1}function i(e,t,i){var n,o=document.createElement("script");o.type="text/"+(e.type||"javascript"),o.src=e.src||e,o.async=!1,o.onreadystatechange=o.onload=function(){var e=o.readyState;clearTimeout(n),t.done||e&&!/loaded|complete/.test(e)||(t.done=!0,t(),o.onreadystatechange=o.onload=null)},document.body.appendChild(o),n=setTimeout(function(){t.done=!0,t(),o.onreadystatechange=o.onload=null},i)}function n(e,t,i,n,o){var s=new(window.XMLHttpRequest||window.ActiveXObject)("MSXML2.XMLHTTP.3.0");if(s.open(n?"POST":"GET",e,1),s.setRequestHeader("Content-type","application/x-www-form-urlencoded"),Array.isArray(o))for(var r=0,a=o.length;r<a;++r){var c=o[r].split(":",2);s.setRequestHeader(c[0].replace(/^\s+|\s+$/g,""),c[1].replace(/^\s+|\s+$/g,""))}"function"==typeof t&&(s.onreadystatechange=function(){s.readyState>3&&t(s)}),s.send(n)}function o(e){return new Error("Error ["+(e.code||"UNKNOWN")+"]: "+e.error)}var s={timeout:5e3,services:["ipinfo"],serviceDefinitions:{ipinfo:function(){return{url:"//ipinfo.io",headers:["Accept: application/json"],callback:function(e,t){try{var i=JSON.parse(t);return i.error?o(i):{code:i.country}}catch(n){return o({error:"Invalid response ("+n+")"})}}}},ipinfodb:function(e){return{url:"//api.ipinfodb.com/v3/ip-country/?key={api_key}&format=json&callback={callback}",isScript:!0,callback:function(e,t){try{var i=JSON.parse(t);return"ERROR"==i.statusCode?o({error:i.statusMessage}):{code:i.countryCode}}catch(n){return o({error:"Invalid response ("+n+")"})}}}},maxmind:function(){return{url:"//js.maxmind.com/js/apis/geoip2/v2.1/geoip2.js",isScript:!0,callback:function(e){return window.geoip2?void geoip2.country(function(t){try{e({code:t.country.iso_code})}catch(i){e(o(i))}},function(t){e(o(t))}):void e(new Error("Unexpected response format. The downloaded script should have exported `geoip2` to the global scope"))}}}}};return e.prototype.getNextService=function(){var e;do e=this.getServiceByIdx(++this.currentServiceIndex);while(this.currentServiceIndex<this.options.services.length&&!e);return e},e.prototype.getServiceByIdx=function(e){var i=this.options.services[e];if("function"==typeof i){var n=i();return n.name&&t.deepExtend(n,this.options.serviceDefinitions[n.name](n)),n}return"string"==typeof i?this.options.serviceDefinitions[i]():t.isPlainObject(i)?this.options.serviceDefinitions[i.name](i):null},e.prototype.locate=function(e,t){var i=this.getNextService();return i?(this.callbackComplete=e,this.callbackError=t,void this.runService(i,this.runNextServiceOnError.bind(this))):void t(new Error("No services to run"))},e.prototype.setupUrl=function(e){var t=this.getCurrentServiceOpts();return e.url.replace(/\{(.*?)\}/g,function(i,n){if("callback"===n){var o="callback"+Date.now();return window[o]=function(t){e.__JSONP_DATA=JSON.stringify(t)},o}if(n in t.interpolateUrl)return t.interpolateUrl[n]})},e.prototype.runService=function(e,t){var o=this;if(e&&e.url&&e.callback){var s=e.isScript?i:n,r=this.setupUrl(e);s(r,function(i){var n=i?i.responseText:"";e.__JSONP_DATA&&(n=e.__JSONP_DATA,delete e.__JSONP_DATA),o.runServiceCallback.call(o,t,e,n)},this.options.timeout,e.data,e.headers)}},e.prototype.runServiceCallback=function(e,t,i){var n=this,o=function(t){s||n.onServiceResult.call(n,e,t)},s=t.callback(o,i);s&&this.onServiceResult.call(this,e,s)},e.prototype.onServiceResult=function(e,t){t instanceof Error||t&&t.error?e.call(this,t,null):e.call(this,null,t)},e.prototype.runNextServiceOnError=function(e,t){if(e){this.logError(e);var i=this.getNextService();i?this.runService(i,this.runNextServiceOnError.bind(this)):this.completeService.call(this,this.callbackError,new Error("All services failed"))}else this.completeService.call(this,this.callbackComplete,t)},e.prototype.getCurrentServiceOpts=function(){var e=this.options.services[this.currentServiceIndex];return"string"==typeof e?{name:e}:"function"==typeof e?e():t.isPlainObject(e)?e:{}},e.prototype.completeService=function(e,t){this.currentServiceIndex=-1,e&&e(t)},e.prototype.logError=function(e){var t=this.currentServiceIndex,i=this.getServiceByIdx(t);console.warn("The service["+t+"] ("+i.url+") responded with the following error",e)},e}(),e.Law=function(){function e(e){this.initialise.apply(this,arguments)}var i={regionalLaw:!0,hasLaw:["AT","BE","BG","HR","CZ","CY","DK","EE","FI","FR","DE","EL","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","SK","ES","SE","GB","UK","GR","EU"],revokable:["HR","CY","DK","EE","FR","DE","LV","LT","NL","PT","ES"],explicitAction:["HR","IT","ES"]};return e.prototype.initialise=function(e){t.deepExtend(this.options={},i),t.isPlainObject(e)&&t.deepExtend(this.options,e)},e.prototype.get=function(e){var t=this.options;return{hasLaw:t.hasLaw.indexOf(e)>=0,revokable:t.revokable.indexOf(e)>=0,explicitAction:t.explicitAction.indexOf(e)>=0}},e.prototype.applyLaw=function(e,t){var i=this.get(t);return i.hasLaw||(e.enabled=!1,"function"==typeof e.onNoCookieLaw&&e.onNoCookieLaw(t,i)),this.options.regionalLaw&&(i.revokable&&(e.revokable=!0),i.explicitAction&&(e.dismissOnScroll=!1,e.dismissOnTimeout=!1)),e},e}(),e.initialise=function(i,n,o){var s=new e.Law(i.law);n||(n=function(){}),o||(o=function(){});var r=Object.keys(e.status),a=t.getCookie("cookieconsent_status"),c=r.indexOf(a)>=0;return c?void n(new e.Popup(i)):void e.getCountryCode(i,function(t){delete i.law,delete i.location,t.code&&(i=s.applyLaw(i,t.code)),n(new e.Popup(i))},function(t){delete i.law,delete i.location,o(t,new e.Popup(i))})},e.getCountryCode=function(t,i,n){if(t.law&&t.law.countryCode)return void i({code:t.law.countryCode});if(t.location){var o=new e.Location(t.location);return void o.locate(function(e){i(e||{})},n)}i({})},e.utils=t,e.hasInitialised=!0,window.cookieconsent=e}}(window.cookieconsent||{});
/**
 * jQuery PieTimer Plugin v0.1
 * Authors: Kus (http://blakek.us/css3-pie-graph-timer-with-jquery/)
 *          Connor Doyle (jQuery plugin)
 *
 * http://github.com/chikamichi/jquery.pietimer
 *
 * Licensed under the MIT licenses:
 * http://www.opensource.org/licenses/mit-license.php
 */
(function($){
  var methods = {
    init: function(options) {
      var state = {
        timer: null,
        timerSeconds: 10,
        callback: function() {},
        timerCurrent: 0,
        showPercentage: false,
        fill: false,
        color: '#CCC'
      };

      state = $.extend(state, options);

      return this.each(function() {
        var $this = $(this);
        var data = $this.data('pietimer');
        if (!data) {
          $this.addClass('pietimer');
          $this.css({fontSize: $this.width()});
          $this.data('pietimer', state);
          if (state.showPercentage) {
            $this.find('.percent').show();
          }
          if (state.fill) {
            $this.addClass('fill');
          }
          $this.pietimer('start');
        }
      });
    },

    stopWatch: function() {
      var data = $(this).data('pietimer');
      if (data) {
        var seconds = (data.timerFinish-(new Date().getTime()))/1000;
        if (seconds <= 0) {
          clearInterval(data.timer);
          $(this).pietimer('drawTimer', 100);
          data.callback();
        } else {
          var percent = 100-((seconds/(data.timerSeconds))*100);
          $(this).pietimer('drawTimer', percent);
        }
      }
    },

    drawTimer: function(percent) {
      $this = $(this);
      var data = $this.data('pietimer');
      if (data) {
        $this.html('<div class="percent"></div><div class="slice'+(percent > 50?' gt50"':'"')+'><div class="pie"></div>'+(percent > 50?'<div class="pie fill"></div>':'')+'</div>');
        var deg = 360/100*percent;
        $this.find('.slice .pie').css({
          '-moz-transform':'rotate('+deg+'deg)',
          '-webkit-transform':'rotate('+deg+'deg)',
          '-o-transform':'rotate('+deg+'deg)',
          'transform':'rotate('+deg+'deg)'
        });
        $this.find('.percent').html(Math.round(percent)+'%');
        if (data.showPercentage) {
          $this.find('.percent').show();
        }
        if ($this.hasClass('fill')) {
          $this.find('.slice .pie').css({backgroundColor: data.color});
        }
        else {
          $this.find('.slice .pie').css({borderColor: data.color});
        }
      }
    },
    
    start: function() {
      var data = $(this).data('pietimer');
      if (data) {
        data.timerFinish = new Date().getTime()+(data.timerSeconds*1000);
        $(this).pietimer('drawTimer', 0);
        data.timer = setInterval("$this.pietimer('stopWatch')", 50);
      }
    },

    reset: function() {
      var data = $(this).data('pietimer');
      if (data) {
        clearInterval(data.timer);
        $(this).pietimer('drawTimer', 0);
      }
    }
  };

  $.fn.pietimer = function(method) {
    if (methods[method]) {
      return methods[method].apply( this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' +  method + ' does not exist on jQuery.pietimer');
    }
  };
})(jQuery);

/*!
 * clipboard.js v2.0.4
 * https://zenorocha.github.io/clipboard.js
 * 
 * Licensed MIT © Zeno Rocha
 */
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.ClipboardJS=e():t.ClipboardJS=e()}(this,function(){return function(n){var o={};function r(t){if(o[t])return o[t].exports;var e=o[t]={i:t,l:!1,exports:{}};return n[t].call(e.exports,e,e.exports,r),e.l=!0,e.exports}return r.m=n,r.c=o,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=0)}([function(t,e,n){"use strict";var r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i=function(){function o(t,e){for(var n=0;n<e.length;n++){var o=e[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(t,o.key,o)}}return function(t,e,n){return e&&o(t.prototype,e),n&&o(t,n),t}}(),a=o(n(1)),c=o(n(3)),u=o(n(4));function o(t){return t&&t.__esModule?t:{default:t}}var l=function(t){function o(t,e){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,o);var n=function(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!e||"object"!=typeof e&&"function"!=typeof e?t:e}(this,(o.__proto__||Object.getPrototypeOf(o)).call(this));return n.resolveOptions(e),n.listenClick(t),n}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}(o,c.default),i(o,[{key:"resolveOptions",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};this.action="function"==typeof t.action?t.action:this.defaultAction,this.target="function"==typeof t.target?t.target:this.defaultTarget,this.text="function"==typeof t.text?t.text:this.defaultText,this.container="object"===r(t.container)?t.container:document.body}},{key:"listenClick",value:function(t){var e=this;this.listener=(0,u.default)(t,"click",function(t){return e.onClick(t)})}},{key:"onClick",value:function(t){var e=t.delegateTarget||t.currentTarget;this.clipboardAction&&(this.clipboardAction=null),this.clipboardAction=new a.default({action:this.action(e),target:this.target(e),text:this.text(e),container:this.container,trigger:e,emitter:this})}},{key:"defaultAction",value:function(t){return s("action",t)}},{key:"defaultTarget",value:function(t){var e=s("target",t);if(e)return document.querySelector(e)}},{key:"defaultText",value:function(t){return s("text",t)}},{key:"destroy",value:function(){this.listener.destroy(),this.clipboardAction&&(this.clipboardAction.destroy(),this.clipboardAction=null)}}],[{key:"isSupported",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:["copy","cut"],e="string"==typeof t?[t]:t,n=!!document.queryCommandSupported;return e.forEach(function(t){n=n&&!!document.queryCommandSupported(t)}),n}}]),o}();function s(t,e){var n="data-clipboard-"+t;if(e.hasAttribute(n))return e.getAttribute(n)}t.exports=l},function(t,e,n){"use strict";var o,r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i=function(){function o(t,e){for(var n=0;n<e.length;n++){var o=e[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(t,o.key,o)}}return function(t,e,n){return e&&o(t.prototype,e),n&&o(t,n),t}}(),a=n(2),c=(o=a)&&o.__esModule?o:{default:o};var u=function(){function e(t){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e),this.resolveOptions(t),this.initSelection()}return i(e,[{key:"resolveOptions",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};this.action=t.action,this.container=t.container,this.emitter=t.emitter,this.target=t.target,this.text=t.text,this.trigger=t.trigger,this.selectedText=""}},{key:"initSelection",value:function(){this.text?this.selectFake():this.target&&this.selectTarget()}},{key:"selectFake",value:function(){var t=this,e="rtl"==document.documentElement.getAttribute("dir");this.removeFake(),this.fakeHandlerCallback=function(){return t.removeFake()},this.fakeHandler=this.container.addEventListener("click",this.fakeHandlerCallback)||!0,this.fakeElem=document.createElement("textarea"),this.fakeElem.style.fontSize="12pt",this.fakeElem.style.border="0",this.fakeElem.style.padding="0",this.fakeElem.style.margin="0",this.fakeElem.style.position="absolute",this.fakeElem.style[e?"right":"left"]="-9999px";var n=window.pageYOffset||document.documentElement.scrollTop;this.fakeElem.style.top=n+"px",this.fakeElem.setAttribute("readonly",""),this.fakeElem.value=this.text,this.container.appendChild(this.fakeElem),this.selectedText=(0,c.default)(this.fakeElem),this.copyText()}},{key:"removeFake",value:function(){this.fakeHandler&&(this.container.removeEventListener("click",this.fakeHandlerCallback),this.fakeHandler=null,this.fakeHandlerCallback=null),this.fakeElem&&(this.container.removeChild(this.fakeElem),this.fakeElem=null)}},{key:"selectTarget",value:function(){this.selectedText=(0,c.default)(this.target),this.copyText()}},{key:"copyText",value:function(){var e=void 0;try{e=document.execCommand(this.action)}catch(t){e=!1}this.handleResult(e)}},{key:"handleResult",value:function(t){this.emitter.emit(t?"success":"error",{action:this.action,text:this.selectedText,trigger:this.trigger,clearSelection:this.clearSelection.bind(this)})}},{key:"clearSelection",value:function(){this.trigger&&this.trigger.focus(),window.getSelection().removeAllRanges()}},{key:"destroy",value:function(){this.removeFake()}},{key:"action",set:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"copy";if(this._action=t,"copy"!==this._action&&"cut"!==this._action)throw new Error('Invalid "action" value, use either "copy" or "cut"')},get:function(){return this._action}},{key:"target",set:function(t){if(void 0!==t){if(!t||"object"!==(void 0===t?"undefined":r(t))||1!==t.nodeType)throw new Error('Invalid "target" value, use a valid Element');if("copy"===this.action&&t.hasAttribute("disabled"))throw new Error('Invalid "target" attribute. Please use "readonly" instead of "disabled" attribute');if("cut"===this.action&&(t.hasAttribute("readonly")||t.hasAttribute("disabled")))throw new Error('Invalid "target" attribute. You can\'t cut text from elements with "readonly" or "disabled" attributes');this._target=t}},get:function(){return this._target}}]),e}();t.exports=u},function(t,e){t.exports=function(t){var e;if("SELECT"===t.nodeName)t.focus(),e=t.value;else if("INPUT"===t.nodeName||"TEXTAREA"===t.nodeName){var n=t.hasAttribute("readonly");n||t.setAttribute("readonly",""),t.select(),t.setSelectionRange(0,t.value.length),n||t.removeAttribute("readonly"),e=t.value}else{t.hasAttribute("contenteditable")&&t.focus();var o=window.getSelection(),r=document.createRange();r.selectNodeContents(t),o.removeAllRanges(),o.addRange(r),e=o.toString()}return e}},function(t,e){function n(){}n.prototype={on:function(t,e,n){var o=this.e||(this.e={});return(o[t]||(o[t]=[])).push({fn:e,ctx:n}),this},once:function(t,e,n){var o=this;function r(){o.off(t,r),e.apply(n,arguments)}return r._=e,this.on(t,r,n)},emit:function(t){for(var e=[].slice.call(arguments,1),n=((this.e||(this.e={}))[t]||[]).slice(),o=0,r=n.length;o<r;o++)n[o].fn.apply(n[o].ctx,e);return this},off:function(t,e){var n=this.e||(this.e={}),o=n[t],r=[];if(o&&e)for(var i=0,a=o.length;i<a;i++)o[i].fn!==e&&o[i].fn._!==e&&r.push(o[i]);return r.length?n[t]=r:delete n[t],this}},t.exports=n},function(t,e,n){var d=n(5),h=n(6);t.exports=function(t,e,n){if(!t&&!e&&!n)throw new Error("Missing required arguments");if(!d.string(e))throw new TypeError("Second argument must be a String");if(!d.fn(n))throw new TypeError("Third argument must be a Function");if(d.node(t))return s=e,f=n,(l=t).addEventListener(s,f),{destroy:function(){l.removeEventListener(s,f)}};if(d.nodeList(t))return a=t,c=e,u=n,Array.prototype.forEach.call(a,function(t){t.addEventListener(c,u)}),{destroy:function(){Array.prototype.forEach.call(a,function(t){t.removeEventListener(c,u)})}};if(d.string(t))return o=t,r=e,i=n,h(document.body,o,r,i);throw new TypeError("First argument must be a String, HTMLElement, HTMLCollection, or NodeList");var o,r,i,a,c,u,l,s,f}},function(t,n){n.node=function(t){return void 0!==t&&t instanceof HTMLElement&&1===t.nodeType},n.nodeList=function(t){var e=Object.prototype.toString.call(t);return void 0!==t&&("[object NodeList]"===e||"[object HTMLCollection]"===e)&&"length"in t&&(0===t.length||n.node(t[0]))},n.string=function(t){return"string"==typeof t||t instanceof String},n.fn=function(t){return"[object Function]"===Object.prototype.toString.call(t)}},function(t,e,n){var a=n(7);function i(t,e,n,o,r){var i=function(e,n,t,o){return function(t){t.delegateTarget=a(t.target,n),t.delegateTarget&&o.call(e,t)}}.apply(this,arguments);return t.addEventListener(n,i,r),{destroy:function(){t.removeEventListener(n,i,r)}}}t.exports=function(t,e,n,o,r){return"function"==typeof t.addEventListener?i.apply(null,arguments):"function"==typeof n?i.bind(null,document).apply(null,arguments):("string"==typeof t&&(t=document.querySelectorAll(t)),Array.prototype.map.call(t,function(t){return i(t,e,n,o,r)}))}},function(t,e){if("undefined"!=typeof Element&&!Element.prototype.matches){var n=Element.prototype;n.matches=n.matchesSelector||n.mozMatchesSelector||n.msMatchesSelector||n.oMatchesSelector||n.webkitMatchesSelector}t.exports=function(t,e){for(;t&&9!==t.nodeType;){if("function"==typeof t.matches&&t.matches(e))return t;t=t.parentNode}}}])});

// Sticky sidebar
!function(a){function b(c,d){this.options=a.extend({},b.DEFAULTS,d),this.$sidebar=a(c),this.$sidebarInner=!1,this.$container=this.$sidebar.closest(this.options.containerSelector),this.affixedType="static",this._initialized=!1,this._breakpoint=!1,this._resizeListeners=[],this.dimensions={translateY:0,topSpacing:0,bottomSpacing:0,sidebarHeight:0,sidebarWidth:0,containerTop:0,containerHeight:0,viewportHeight:0,viewportTop:0,lastViewportTop:0},this.initialize()}function c(c){return this.each(function(){var d=a(this),e=a(this).data("stickySidebar");if(e||(e=new b(this,"object"==typeof c&&c),d.data("stickySidebar",e)),"string"==typeof c){if(void 0===e[c]&&-1!=["destory","updateSticky"].indexOf(c))throw new Error('No method named "'+c+'"');e[c]()}})}var d=a(window);b.VERSION="1.0.0",b.EVENT_KEY=".stickySidebar",b.DEFAULTS={topSpacing:0,bottomSpacing:0,containerSelector:!1,innerWrapperClass:"inner-wrapper-sticky",stickyClass:"is-affixed",resizeSensor:!0,minWidth:!1},b.isIE=function(){return Boolean(navigator.userAgent.match(/Trident/))},b.supportTransform=function(b){var c=!1,d=b?"perspective":"transform",e=d.charAt(0).toUpperCase()+d.slice(1),f="Webkit Moz O ms".split(" "),g=a("<support>").get(0).style;return a.each((d+" "+f.join(e+" ")+e).split(" "),function(a,b){if(void 0!==g[b])return c=b,!1}),c},b.prototype={initialize:function(){if(this.$sidebar.trigger("initialize"+b.EVENT_KEY),this.options.innerWrapperClass&&(this.$sidebarInner=this.$sidebar.find("."+this.options.innerWrapperClass),0===this.$sidebarInner.length&&(this.$sidebarInner=!1)),!this.$sidebarInner){var c=a('<div class="'+this.options.innerWrapperClass+'" />'),d="> div";this.options.innerWrapSelector&&(d="."+this.options.innerWrapSelector),this.$sidebar.wrapInner(c),this.$sidebarInner=this.$sidebar.find(d)}this.$container.length||(this.$container=this.$sidebar.parent()),"function"!=typeof this.options.topSpacing&&(this.options.topSpacing=parseInt(this.options.topSpacing)||0),"function"!=typeof this.options.bottomSpacing&&(this.options.bottomSpacing=parseInt(this.options.bottomSpacing)||0),this._widthBreakpoint(),this.calcDimensions(),this.stickyPosition(),this.bindEvents(),this._initialized=!0,this.$sidebar.trigger("initialized"+b.EVENT_KEY)},bindEvents:function(){this.options;d.on("resize."+b.EVENT_KEY,a.proxy(this._onResize,this)).on("scroll."+b.EVENT_KEY,a.proxy(this._onScroll,this)),this.$sidebar.on("recalcDimenstions."+b.EVENT_KEY,a.proxy(this.updateSticky,this)),this.options.resizeSensor&&(this.addResizerListener(this.$sidebarInner,a.proxy(this.updateSticky,this)),this.addResizerListener(this.$container,a.proxy(this.updateSticky,this)))},_onScroll:function(a){this.$sidebar.is(":visible")&&this.animateSticky()},_onResize:function(b){requestAnimationFrame(a.proxy(function(){this._widthBreakpoint(),this.updateSticky()},this))},calcDimensions:function(){if(!this._breakpoint){var a=this.dimensions;a.containerTop=this.$container.offset().top,a.containerHeight=this.$container.outerHeight(),a.containerBottom=a.containerTop+a.containerHeight,a.sidebarHeight=this.$sidebarInner.outerHeight(),a.sidebarWidth=this.$sidebar.outerWidth(),a.viewportHeight=d.prop("innerHeight"),this._calcDimensionsWithScroll()}},_calcDimensionsWithScroll:function(){var a=this.dimensions;a.sidebarLeft=this.$sidebar.offset().left,a.viewportTop=document.documentElement.scrollTop||document.body.scrollTop,a.viewportBottom=a.viewportTop+a.viewportHeight,a.viewportLeft=document.documentElement.scrollLeft||document.body.scrollLeft,a.topSpacing=this.options.topSpacing,a.bottomSpacing=this.options.bottomSpacing,"function"==typeof a.topSpacing&&(a.topSpacing=parseInt(a.topSpacing(this.$sidebar))||0),"function"==typeof a.bottomSpacing&&(a.bottomSpacing=parseInt(a.bottomSpacing(this.$sidebar))||0)},isSidebarFitsViewport:function(){return this.dimensions.sidebarHeight<this.dimensions.viewportHeight},isScrollingTop:function(){return this.dimensions.viewportTop<this.dimensions.lastViewportTop},getAffixType:function(){var a=this.dimensions,b=!1;this._calcDimensionsWithScroll();var c=a.sidebarHeight+a.containerTop,d=a.viewportTop+a.topSpacing,e=a.viewportBottom-a.bottomSpacing;return this.isScrollingTop()?d<=a.containerTop?(a.translateY=0,b="STATIC"):d<=a.translateY+a.containerTop?(a.translateY=d-a.containerTop,b="VIEWPORT-TOP"):!this.isSidebarFitsViewport()&&a.containerTop<=d&&(b="VIEWPORT-UNBOTTOM"):this.isSidebarFitsViewport()?a.sidebarHeight+d>=a.containerBottom?(a.translateY=a.containerBottom-c,b="CONTAINER-BOTTOM"):d>=a.containerTop&&(a.translateY=d-a.containerTop,b="VIEWPORT-TOP"):a.containerBottom<=e?(a.translateY=a.containerBottom-c,b="CONTAINER-BOTTOM"):c+a.translateY<=e?(a.translateY=e-c,b="VIEWPORT-BOTTOM"):a.containerTop+a.translateY<=d&&(b="VIEWPORT-UNBOTTOM"),a.lastViewportTop=a.viewportTop,b},_getStyle:function(c){if(void 0!==c){var d={inner:{},outer:{}},e=this.dimensions;switch(c){case"VIEWPORT-TOP":d.inner={position:"fixed",top:this.options.topSpacing,left:e.sidebarLeft-e.viewportLeft,width:e.sidebarWidth};break;case"VIEWPORT-BOTTOM":d.inner={position:"fixed",top:"auto",left:e.sidebarLeft,bottom:this.options.bottomSpacing,width:e.sidebarWidth};break;case"CONTAINER-BOTTOM":case"VIEWPORT-UNBOTTOM":d.inner={position:"absolute",top:e.containerTop+e.translateY},b.supportTransform(translate3d=!0)?d.inner={transform:"translate3d(0, "+e.translateY+"px, 0)"}:b.supportTransform()&&(d.inner={transform:"translate(0, "+e.translateY+"px)"})}switch(c){case"VIEWPORT-TOP":case"VIEWPORT-BOTTOM":case"VIEWPORT-UNBOTTOM":case"CONTAINER-BOTTOM":d.outer={minHeight:e.translateY+e.sidebarHeight}}return d.outer=a.extend({},{minHeight:""},d.outer),d.inner=a.extend({},{position:"relative",top:"",left:"",bottom:"",width:"",transform:""},d.inner),d}},stickyPosition:function(){if(this.$sidebar.is(":visible")&&!this._breakpoint){var c=(this.options.topSpacing,this.options.bottomSpacing,this.getAffixType()),d=this._getStyle(c);if(this.affixedType!=c&&c){var e=a.Event("affix."+c.replace("viewport-","")+b.EVENT_KEY);this.$sidebar.trigger(e),"static"===c?this.$sidebar.removeClass(this.options.stickyClass):this.$sidebar.addClass(this.options.stickyClass);var f=a.Event("affixed."+c.replace("viewport","")+b.EVENT_KEY);this.$sidebarInner.css(d.inner),this.$sidebar.trigger(f)}this._initialized&&this.$sidebarInner.css("left",d.inner.left),this.$sidebar.css(d.outer),this.affixedType=c}},_widthBreakpoint:function(){d.innerWidth()<=this.options.minWidth?(this._breakpoint=!0,this.affixedType="static",this.$sidebar.removeAttr("style").removeClass(this.options.stickyClass),this.$sidebarInner.removeAttr("style")):this._breakpoint=!1},updateSticky:function(){this.calcDimensions(),this.stickyPosition()},animateSticky:function(){requestAnimationFrame(a.proxy(function(){this.stickyPosition()},this))},addResizerListener:function(b,c){var d=a(b);d.prop("resizeListeners")||(d.prop("resizeListeners",[]),this._appendResizeSensor(d)),d.prop("resizeListeners").push(c)},removeResizeListener:function(b,c){var d=a(b),e=d.prop("resizeListeners"),f=e.indexOf(c);if(this._resizeListeners.splice(f,1),d.prop("resizeListeners").length){var g=d.prop("resizeTrigger");a(g.contentDocument.defaultView).off("resize",this._resizeListener),g=d.find(g).remove()}},_appendResizeSensor:function(c){var d=a(c);"static"==d.css("position")&&d.css("position","relative");var e=a("<object>");e.attr("style","display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%;overflow: hidden; pointer-events: none; z-index: -1;"),e.prop("resizeElement",d[0]);var f=this;e.on("load",function(b){this.contentDocument.defaultView.resizeTrigger=this.resizeElement,a(this.contentDocument.defaultView).on("resize",f._resizeListener)}),e.prop("type","text/html"),b.isIE()&&e.prop(data,"about:blank"),d.prop("resizeTrigger",e.get(0)),d.append(e)},_resizeListener:function(a){var b=a.target||a.srcElement;cancelAnimationFrame(b.resizeSensorRAF),b.resizeSensorRAF=requestAnimationFrame(function(){var c=b.resizeTrigger;c.resizeListeners.forEach(function(b){b.call(c,a)})})},destroy:function(){d.off("resize"+b.EVENT_KEY).off("scroll"+b.EVENT_KEY),this.$sidebar.removeClass(this.options.stickyClass).css({minHeight:""}).off("recalcDimenstions"+b.EVENT_KEY).removeData("stickySidebar"),this.$sidebarInner.css({position:"",top:"",left:"",bottom:"",width:"",transform:""}),this.options.resizeSensor&&(this.removeResizeListener(this.$sidebarInner,a.proxy(this.updateSticky,this)),this.removeResizeListener(this.$container,a.proxy(this.updateSticky,this)))}},a.fn.stickySidebar=c,a.fn.stickySidebar.Constructor=b;var e=a.fn.stickySidebar;a.fn.stickySidebar.noConflict=function(){return a.fn.stickySidebar=e,this},d.on("load",function(){a("[data-sticky-sidebar]").each(function(){var b=a(this),d=b.data()||{},e=b.closest("[data-sticky-sidebar-container]");e.length&&(d.containerSelector=e),c.call(b,d)})})}(jQuery);
