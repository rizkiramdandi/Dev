/*
 Sticky-kit v1.1.2 | WTFPL | Leaf Corcoran 2015 | https://leafo.net
*/
(function(){var b,f;b=this.jQuery||window.jQuery;f=b(window);b.fn.stick_in_parent=function(d){var A,w,J,n,B,K,p,q,k,E,t;null==d&&(d={});t=d.sticky_class;B=d.inner_scrolling;E=d.recalc_every;k=d.parent;q=d.offset_top;p=d.spacer;w=d.bottoming;null==q&&(q=0);null==k&&(k=void 0);null==B&&(B=!0);null==t&&(t="is_stuck");A=b(document);null==w&&(w=!0);J=function(a,d,n,C,F,u,r,G){var v,H,m,D,I,c,g,x,y,z,h,l;if(!a.data("sticky_kit")){a.data("sticky_kit",!0);I=A.height();g=a.parent();null!=k&&(g=g.closest(k));
if(!g.length)throw"failed to find stick parent";v=m=!1;(h=null!=p?p&&a.closest(p):b("<div />"))&&h.css("position",a.css("position"));x=function(){var c,f,e;if(!G&&(I=A.height(),c=parseInt(g.css("border-top-width"),10),f=parseInt(g.css("padding-top"),10),d=parseInt(g.css("padding-bottom"),10),n=g.offset().top+c+f,C=g.height(),m&&(v=m=!1,null==p&&(a.insertAfter(h),h.detach()),a.css({position:"",top:"",width:"",bottom:""}).removeClass(t),e=!0),F=a.offset().top-(parseInt(a.css("margin-top"),10)||0)-q,
u=a.outerHeight(!0),r=a.css("float"),h&&h.css({width:a.outerWidth(!0),height:u,display:a.css("display"),"vertical-align":a.css("vertical-align"),"float":r}),e))return l()};x();if(u!==C)return D=void 0,c=q,z=E,l=function(){var b,l,e,k;if(!G&&(e=!1,null!=z&&(--z,0>=z&&(z=E,x(),e=!0)),e||A.height()===I||x(),e=f.scrollTop(),null!=D&&(l=e-D),D=e,m?(w&&(k=e+u+c>C+n,v&&!k&&(v=!1,a.css({position:"fixed",bottom:"",top:c}).trigger("sticky_kit:unbottom"))),e<F&&(m=!1,c=q,null==p&&("left"!==r&&"right"!==r||a.insertAfter(h),
h.detach()),b={position:"",width:"",top:""},a.css(b).removeClass(t).trigger("sticky_kit:unstick")),B&&(b=f.height(),u+q>b&&!v&&(c-=l,c=Math.max(b-u,c),c=Math.min(q,c),m&&a.css({top:c+"px"})))):e>F&&(m=!0,b={position:"fixed",top:c},b.width="border-box"===a.css("box-sizing")?a.outerWidth()+"px":a.width()+"px",a.css(b).addClass(t),null==p&&(a.after(h),"left"!==r&&"right"!==r||h.append(a)),a.trigger("sticky_kit:stick")),m&&w&&(null==k&&(k=e+u+c>C+n),!v&&k)))return v=!0,"static"===g.css("position")&&g.css({position:"relative"}),
a.css({position:"absolute",bottom:d,top:"auto"}).trigger("sticky_kit:bottom")},y=function(){x();return l()},H=function(){G=!0;f.off("touchmove",l);f.off("scroll",l);f.off("resize",y);b(document.body).off("sticky_kit:recalc",y);a.off("sticky_kit:detach",H);a.removeData("sticky_kit");a.css({position:"",bottom:"",top:"",width:""});g.position("position","");if(m)return null==p&&("left"!==r&&"right"!==r||a.insertAfter(h),h.remove()),a.removeClass(t)},f.on("touchmove",l),f.on("scroll",l),f.on("resize",
y),b(document.body).on("sticky_kit:recalc",y),a.on("sticky_kit:detach",H),setTimeout(l,0)}};n=0;for(K=this.length;n<K;n++)d=this[n],J(b(d));return this}}).call(this);
// search form
$(function(){$('a[href="#searchfs"]').on("click",function(e){e.preventDefault(),$("#searchfs").addClass("open"),$('#searchfs > form > input[type="search"]').focus()}),$("#searchfs, #searchfs button.close").on("click keyup",function(e){e.target!=this&&"close"!=e.target.className&&27!=e.keyCode||$(this).removeClass("open")})});
// nav menu
!function(s){s.fn.menumaker=function(n){var e=s(this),o=s.extend({format:"dropdown",sticky:!1},n);return this.each(function(){s(this).find(".button").on("click",function(){s(this).toggleClass("menu-opened");var n=s(this).next("ul");n.hasClass("open")?n.slideToggle(150).removeClass("open"):(n.slideToggle(150).addClass("open"),"dropdown"===o.format&&n.find("ul").show())}),e.find("li ul").parent().addClass("has-sub"),multiTg=function(){e.find(".has-sub").prepend('<span class="submenu-button"></span>'),e.find(".submenu-button").on("click",function(){s(this).toggleClass("submenu-opened"),s(this).siblings("ul").hasClass("open")?s(this).siblings("ul").removeClass("open").slideToggle(150):s(this).siblings("ul").addClass("open").slideToggle(150)})},"multitoggle"===o.format?multiTg():e.addClass("dropdown"),!0===o.sticky&&e.css("position","fixed")})}}(jQuery),function(s){s(document).ready(function(){s("#cssmenu").menumaker({format:"multitoggle"})})}(jQuery);
jQuery(document).ready(function(){var i=jQuery(window).width();function e(){jQuery("#sidebar-sticky").stick_in_parent({parent:"#wrapper",offset_top:70})}i<768?jQuery("#sidebar-sticky").trigger("sticky_kit:detach"):e(),jQuery(window).resize(function(){(i=jQuery(window).width())<768?jQuery("#sidebar-sticky").trigger("sticky_kit:detach"):e()})});
// Lazy Load
(function(a){a.fn.lazyload=function(b){var c={threshold:0,failurelimit:0,event:"scroll",effect:"show",container:window};if(b){a.extend(c,b)}var d=this;if("scroll"==c.event){a(c.container).bind("scroll",function(b){var e=0;d.each(function(){if(a.abovethetop(this,c)||a.leftofbegin(this,c)){}else if(!a.belowthefold(this,c)&&!a.rightoffold(this,c)){a(this).trigger("appear")}else{if(e++>c.failurelimit){return false}}});var f=a.grep(d,function(a){return!a.loaded});d=a(f)})}this.each(function(){var b=this;if(undefined==a(b).attr("original")){a(b).attr("original",a(b).attr("src"))}if("scroll"!=c.event||undefined==a(b).attr("src")||c.placeholder==a(b).attr("src")||a.abovethetop(b,c)||a.leftofbegin(b,c)||a.belowthefold(b,c)||a.rightoffold(b,c)){if(c.placeholder){a(b).attr("src",c.placeholder)}else{a(b).removeAttr("src")}b.loaded=false}else{b.loaded=true}a(b).one("appear",function(){if(!this.loaded){a("<img />").bind("load",function(){a(b).hide().attr("src",a(b).attr("original"))[c.effect](c.effectspeed);b.loaded=true}).attr("src",a(b).attr("original"))}});if("scroll"!=c.event){a(b).bind(c.event,function(c){if(!b.loaded){a(b).trigger("appear")}})}});a(c.container).trigger(c.event);return this};a.belowthefold=function(b,c){if(c.container===undefined||c.container===window){var d=a(window).height()+a(window).scrollTop()}else{var d=a(c.container).offset().top+a(c.container).height()}return d<=a(b).offset().top-c.threshold};a.rightoffold=function(b,c){if(c.container===undefined||c.container===window){var d=a(window).width()+a(window).scrollLeft()}else{var d=a(c.container).offset().left+a(c.container).width()}return d<=a(b).offset().left-c.threshold};a.abovethetop=function(b,c){if(c.container===undefined||c.container===window){var d=a(window).scrollTop()}else{var d=a(c.container).offset().top}return d>=a(b).offset().top+c.threshold+a(b).height()};a.leftofbegin=function(b,c){if(c.container===undefined||c.container===window){var d=a(window).scrollLeft()}else{var d=a(c.container).offset().left}return d>=a(b).offset().left+c.threshold+a(b).width()};a.extend(a.expr[":"],{"below-the-fold":"$.belowthefold(a, {threshold : 0, container: window})","above-the-fold":"!$.belowthefold(a, {threshold : 0, container: window})","right-of-fold":"$.rightoffold(a, {threshold : 0, container: window})","left-of-fold":"!$.rightoffold(a, {threshold : 0, container:window})"})})(jQuery);$(function(){$(".post img").lazyload({placeholder:"https://2.bp.blogspot.com/-tRXLdhn9kPI/XHDYsHiUUgI/AAAAAAAAWU0/rCEEdZhGhBsTCs1HXZh40p4xaThrCT-UwCLcBGAs/s320/load.gif",effect:"fadeIn",threshold:"0",effectTime:"2000"})});
function ignielLazyLoad(){eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('u B(){Y(v e=o.1r("B"),t=0;t<e.1q;t++)Q(e[t])&&(e[t].N=e[t].1p("1n-N"))}u Q(e){v t=e.1t();Z t.1x>=0&&t.1w>=0&&t.1v<=(y.1u||o.T.1m)&&t.1k<=(y.1c||o.T.1b)}v b=["\\r\\m\\m\\D\\G\\a\\f\\c\\M\\n\\p\\c\\a\\f\\a\\k","\\h\\f","\\r\\c\\c\\r\\l\\A\\D\\G\\a\\f\\c","\\g\\h\\r\\m","\\p\\l\\k\\h\\g\\g","\\V\\1a\\1e\\R\\h\\f\\c\\a\\f\\c\\M\\h\\r\\m\\a\\m","\\w\\p\\a\\1l\\p\\c\\k\\n\\l\\c","\\r","\\1f\\w\\a\\k\\L\\1j\\a\\g\\a\\l\\c\\h\\k\\W\\g\\g","\\g\\a\\f\\q\\c\\A","\\w\\p\\a\\k\\W\\q\\a\\f\\c","\\c\\a\\p\\c","\\m\\h\\l\\w\\F\\a\\f\\c\\D\\g\\a\\F\\a\\f\\c","\\1i\\h\\m\\L","\\l\\g\\n\\l\\1g","\\p\\l\\k\\h\\g\\g\\1h\\h\\J","\\c\\h\\J","\\q\\a\\c\\S\\h\\w\\f\\m\\n\\f\\q\\R\\g\\n\\a\\f\\c\\1z\\a\\l\\c","\\A\\k\\a\\X","\\a\\1y\\a\\l","\\q\\a\\c\\D\\g\\a\\F\\a\\f\\c\\S\\L\\1F\\m","\\p\\l\\k\\h\\g\\g\\U\\a\\n\\q\\A\\c","\\n\\f\\f\\a\\k\\U\\a\\n\\q\\A\\c","\\J\\k\\a\\G\\a\\f\\c\\V\\a\\X\\r\\w\\g\\c","\\n\\c\\a\\F"];u I(d,j){y[b[0]]?y[b[0]](d,j):y[b[2]](b[1]+d,j)}I(b[3],B),I(b[4],B),o[b[0]](b[5],u(){b[6];Y(v d=o[b[8]](b[7]),j=d[b[9]],s=/1D|1B/i[b[11]](1G[b[10]])?o[b[12]]:o[b[13]],C=u(d,j,s,C){Z(d/=C/2)<1?s/2*d*d*d+j:s/2*((d-=2)*d*d+2)+j};j--;){d[b[1C]](j)[b[0]](b[14],u(d){v j,E=s[b[15]],x=o[b[1A]](/[^#]+$/[b[19]](1H[b[18]])[0])[b[17]]()[b[16]],z=s[b[1d]]-y[b[1s]],O=z>E+x?x:z-E,K=1o,H=u(d){j=j||d;v x=d-j,z=C(x,E,O,K);s[b[15]]=z,K>x&&P(H)};P(H),d[b[1E]]()})}});',62,106,'||||||||||x65|_0x1b5d|x74|_0xdd48x2||x6E|x6C|x6F||_0xdd48x3|x72|x63|x64|x69|document|x73|x67|x61|_0xdd48x4||function|var|x75|_0xdd48x7|window|_0xdd48x8|x68|lazy|_0xdd48x5|x45|_0xdd48x6|x6D|x76|_0xdd48xb|registerListener|x70|_0xdd48xa|x79|x4C|src|_0xdd48x9|requestAnimationFrame|isInViewport|x43|x42|documentElement|x48|x44|x41|x66|for|return|||||||||||x4F|clientWidth|innerWidth|21|x4D|x71|x6B|x54|x62|x53|left|x20|clientHeight|data|900|getAttribute|length|getElementsByClassName|22|getBoundingClientRect|innerHeight|top|right|bottom|x78|x52|20|trident|24|firefox|23|x49|navigator|this'.split('|'),0,{}));} eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[c.toString(a)]=k[c]||c.toString(a)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('j 4=["\\7\\9\\9\\e\\d\\a\\b\\8\\i\\g\\h\\8\\a\\b\\a\\k","\\f\\c\\7\\9","\\7\\8\\8\\7\\m\\l\\e\\d\\a\\b\\8","\\c\\b\\f\\c\\7\\9"];5[4[0]]?5[4[0]](4[1],6,!1):5[4[2]]?5[4[2]](4[1],6):5[4[3]]=6;5[4[0]]?5[4[0]](4[1],6,!1):5[4[2]]?5[4[2]](4[1],6):5[4[3]]=6;',23,23,'||||_0xdfb4|window|ignielLazyLoad|x61|x74|x64|x65|x6E|x6F|x76|x45|x6C|x69|x73|x4C|var|x72|x68|x63'.split('|'),0,{}));
// Expires Header
jQuery.cookie=function(e,n,o){if(arguments.length>1&&"[object Object]"!==String(n)){if(o=jQuery.extend({},o),(null===n||void 0===n)&&(o.expires=-1),"number"==typeof o.expires){var t=o.expires,r=o.expires=new Date;r.setDate(r.getDate()+t)}return n=String(n),document.cookie=[encodeURIComponent(e),"=",o.raw?n:encodeURIComponent(n),o.expires?"; expires="+o.expires.toUTCString():"",o.path?"; path="+o.path:"",o.domain?"; domain="+o.domain:"",o.secure?"; secure":""].join("")}o=n||{};var i,c=o.raw?function(e){return e}:decodeURIComponent;return(i=new RegExp("(?:^|; )"+encodeURIComponent(e)+"=([^;]*)").exec(document.cookie))?c(i[1]):null};
// Resize Header
function resizeHeaderOnScroll(){const distanceY=window.pageYOffset||document.documentElement.scrollTop,shrinkOn=100,headerEl=document.getElementById('topuser');if(distanceY>shrinkOn){headerEl.classList.add("smaller")}else{headerEl.classList.remove("smaller")}}
window.addEventListener('scroll',resizeHeaderOnScroll);
$(function(){$(".separator:first").remove(),$(".post-body > img:first").remove()});
