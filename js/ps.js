/**
 * Page Switcher 0.1.1 - Fancy async page loader with iframe
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Gergely Hegyközi | Twitter: @leonuh
 */
;!function(w, d) {
    "use strict";

    //Constructor and main init
    var PS = function(initWrapper) {
        this.init = function(wrapper, firstInit) {
            firstInit = firstInit || false;
            var iframe, iframeChecker = d.querySelectorAll('[name=' + wrapper.id + ']');
 
            if(firstInit) {
                this.loadingQueue.iframe = true;
            }

             //Set defaults
            wrapper.setAttribute('data-ps-src', wrapper.getAttribute('data-ps-src') || '');
            wrapper.setAttribute('data-ps-autoload', wrapper.getAttribute('data-ps-autoload') || false);
            wrapper.setAttribute('data-ps-fixed', wrapper.getAttribute('data-ps-fixed') || true);
            wrapper.setAttribute('data-ps-animation', wrapper.getAttribute('data-ps-animation') || 'slide-down');
            wrapper.setAttribute('data-ps-duration', wrapper.getAttribute('data-ps-duration') || '1');
            wrapper.setAttribute('data-ps-inactivate', wrapper.getAttribute('data-ps-inactivate') || 'true');
            wrapper.setAttribute('data-ps-private-original-class', (wrapper.getAttribute('data-ps-private-original-class') || wrapper.className) + ' ');

            if(!!iframeChecker[0]) {
                iframe = d.querySelectorAll('[name=' + wrapper.id + ']')[0]; 
            } else {
                iframe = d.createElement('iframe');
                iframe.name = wrapper.id;
                iframe.style.display = 'none';
                iframe.className = 'ps-iframe';
                d.body.appendChild(iframe);
            }
            if(wrapper.getAttribute('data-ps-autoload').match(/^true$/i) || (firstInit && PS.currentUrl === wrapper.id)) {                
                iframe.src = (wrapper.id === PS.currentUrl) ? (PS.currentSrc || wrapper.getAttribute('data-ps-src')) : wrapper.getAttribute('data-ps-src');
            }
            iframe.onload = (function() {
                this.load(firstInit);
            }).bind(this);

            this.wrapper = wrapper;
            this.iframe = iframe;
        };
        this.init(initWrapper, true);
    };

    PS.prototype = {
        //Loading queue object
        loadingQueue: {
            iframe: false,
            animation: true
        },

        //Load behavior
        load: function(firstInit) {
            if(this.loadingQueue.iframe && this.loadingQueue.animation) {
                
                var loadEvent = d.createEvent('Event');
                loadEvent.initEvent('ps:load', true, true);
                this.wrapper.dispatchEvent(loadEvent);

                this.move();                
                PS.init(this.iframe, this.wrapper);
                PS.syncAnchor();
            }
        },

        getAnimation: function(wrapper) {
            var animation = wrapper.getAttribute('data-ps-animation'),
                duration = wrapper.getAttribute('data-ps-duration');
            return {
                animation: animation,
                duration: duration,
                style: '<style>.' + animation + '.active { -webkit-transition-duration: ' + duration + 's; -moz-transition-duration: ' + duration + 's; transition-duration: ' + duration + 's;}</style>'
            };
        },

        activate: function() {
            //Rendering fix
            setTimeout((function() {
                this.wrapper.className += ' active';

                var renderEvent = d.createEvent('Event');
                renderEvent.initEvent('ps:render', true, true);
                this.wrapper.dispatchEvent(renderEvent);
            }).bind(this), 100);
        },

        //Move content to body
        move: function() {
            var iframeDoc, newContent = '',
                animations = this.getAnimation(this.wrapper),
                styles;

            //Init
            iframeDoc = this.iframe.contentWindow.document;
        
            //Get styles
            styles = iframeDoc.getElementsByTagName('style');
            Array.prototype.forEach.call(styles, function(style) {
                newContent += '<style>' + style.innerHTML + '</style>';    
            });

            //Init style tag for animations
            newContent += animations.style;
            newContent += iframeDoc.body.innerHTML;

            this.wrapper.className = this.wrapper.getAttribute('data-ps-private-original-class') + animations.animation;
            this.wrapper.innerHTML = newContent;

            this.activate(this.wrapper);
        }
    };

    //Statics
    PS.syncAnchor = function() {
        var activeClass = 'ps-active',
            oldAnchors = d.querySelectorAll('.' + activeClass),
            activeAnchors = d.querySelectorAll('[href="#/' + this.currentUrl + (!!this.currentSrc ? ('/' + this.currentSrc) : '' ) + '"]');
 
        Array.prototype.forEach.call(oldAnchors, function(anchor) {
            anchor.className = anchor.className.replace(activeClass, '').trim();
        });

        Array.prototype.forEach.call(activeAnchors, function(anchor) {
            anchor.className += ' ' + activeClass;
        });       
    };
    PS.init = function(iframe, parentWrapper) {
        var render = function() {
                iframe.addEventListener('load', function() {
                    //Init statics
                    PS.instances = {};

                    //Get current url
                    if(PS.currentUrl = w.location.hash.match(/#\/([^\/]*)/)) {
                        PS.currentUrl = PS.currentUrl[1];
                        PS.currentSrc = (PS.currentSrc = w.location.hash.match(/\/.*\/(.*)/)) ? PS.currentSrc[1] : null;
                    }

                    var div = document.createElement('div');
                    PS.transition = !(div.style.transition || div.style.webkitTransition || div.style.MozTransition || div.style.OTransitionDuration);
                    //Init from window
                    process();
                });
            },
            //Processing new content
            process = function() {
                Array.prototype.forEach.call(parentWrapper.getElementsByClassName('ps-wrapper'), function(wrapper) {
                    //Call targeted Page Switcher
                    if(!!PS.instances[wrapper.id]) {
                        PS.instances[wrapper.id].init(wrapper);
                    } else {
                        PS.instances[wrapper.id] = new PS(wrapper);
                    }
                });
            };

        if(iframe === w) {
            render();
        } else {
            return process();
        }           
    };
    //Separate loadingQueue - iframe animation
    PS.init(w, d);

    //Window action listener
    w.addEventListener('hashchange', function(e) {
        var temporaryUrl;
        if(temporaryUrl = w.location.hash.match(/#\/([^\/]*)/)) {
            e.preventDefault();
            if(!!PS.currentUrl) {
                PS.previousUrl = PS.currentUrl;
            }
            PS.currentUrl = temporaryUrl[1];
            PS.currentSrc = (PS.currentSrc = w.location.hash.match(/\/.*\/(.*)/)) ? PS.currentSrc[1] : null;

            var targetInstance,
                target,
                previousInstance,
                previousTarget,
                iframe,
                animations;
            
            //Default behavior fallback
            targetInstance = PS.instances[PS.currentUrl];

            //Target container not founded
            if(!targetInstance) {
                return false;
            }

            target = targetInstance.wrapper;
            iframe = targetInstance.iframe;
            animations = targetInstance.getAnimation(target);

            iframe.src = PS.currentSrc || target.getAttribute('data-ps-src');

            if(!!PS.previousUrl) {
                previousInstance = PS.instances[PS.previousUrl];
                previousTarget = previousInstance.wrapper;

                if(previousTarget.getAttribute('data-ps-fixed').match(/^false$/i)) {
                    if(previousTarget.getAttribute('data-ps-inactivate').match(/^true$/i)) {
                        previousTarget.className += ' inactivate';
                    } else {
                        previousTarget.className += ' removed';
                    }
                }
            }
            
            if(target.getAttribute('data-ps-inactivate').match(/^true$/i)) {
                target.className += ' inactivate';
            } else {
                targetInstance.load();
            }

            //Animation controller
            targetInstance.loadingQueue.animation = false;
            setTimeout((function() {
                if(!!PS.previousUrl && previousTarget.getAttribute('data-ps-fixed').match(/^false$/i)) {
                    previousTarget.className += ' removed';
                }

                if(target.getAttribute('data-ps-inactivate').match(/^true$/i)) {
                    targetInstance.loadingQueue.animation = true;
                    targetInstance.load();
                }
            }).bind(this), animations.duration * 1000);
        }
    });    

    w.PS = PS;
}(window, document);
