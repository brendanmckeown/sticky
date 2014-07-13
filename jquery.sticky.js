// Sticky Plugin v1.0.0 for jQuery
// =============
// Author: Anthony Garand
// Improvements by German M. Bravo (Kronuz) and Ruud Kamphuis (ruudk)
// Improvements by Leonardo C. Daronco (daronco)
// Created: 2/14/2011
// Date: 2/12/2012
// Website: http://labs.anthonygarand.com/sticky
// Description: Makes an element on the page stick on the screen as you scroll
//       It will only set the 'top' and 'position' of your element, you
//       might need to adjust the width in some cases.

(function($) {
  var defaults = {
      topSpacing: 0,
      bottomSpacing: 0,
      className: 'is-sticky',
      wrapperClassName: 'sticky-wrapper',
      center: false,
      navigation: false,
      activeNavClass: 'active',
      scrollSpeed: 0.8,
      getWidthFrom: ''
    },
    $window = $(window),
    $document = $(document),
    sticked = [],
    windowHeight = $window.height(),
    autoScrolling = false,

    setActiveNavigation = function(sticky, targetId) {
      var navData = sticky.navData,
        activeClass = sticky.activeNavClass;
      if (targetId) {
        var activeItem = navData[targetId];
        activeItem.active = true;
        activeItem.anchor.addClass(activeClass);
      }
      for (var item in navData) {
        if (navData.hasOwnProperty(item)) {
          var navItem = navData[item];
          if (item !== targetId) {
            navItem.active = false;
            navItem.anchor.removeClass(activeClass);
          }
        }
      }
    },

    scrollToTarget = function(target, speed) {
      var distance = Math.abs($window.scrollTop() - target),
        duration = distance * speed;
      autoScrolling = true;
      $("html, body").animate({
        scrollTop: target
      }, duration, function(){
        autoScrolling = false;
      });
    },

    scroller = function() {
      var scrollTop = $window.scrollTop(),
        documentHeight = $document.height(),
        dwh = documentHeight - windowHeight,
        extra = (scrollTop > dwh) ? dwh - scrollTop : 0;

      for (var i = 0; i < sticked.length; i++) {
        var s = sticked[i],
          elementTop = s.stickyWrapper.offset().top,
          etse = elementTop - s.topSpacing - extra,
          elementHeight = s.stickyElement.outerHeight();
        if (scrollTop <= etse) {
          // scroll is above sticky element, remove positioning
          if (s.currentTop !== null) {
            s.stickyElement
              .css('position', '')
              .css('top', '');
            s.stickyElement.parent().removeClass(s.className);
            s.currentTop = null;
          }
        }
        else {
          var newTop = documentHeight - elementHeight
            - s.topSpacing - s.bottomSpacing - scrollTop - extra;
          if (newTop < 0) {
            newTop = newTop + s.topSpacing;
          } else {
            newTop = s.topSpacing;
          }
          if (s.currentTop != newTop) {
            s.stickyElement
              .css('position', 'fixed')
              .css('top', newTop);

            if (typeof s.getWidthFrom !== 'undefined') {
              s.stickyElement.css('width', $(s.getWidthFrom).width());
            }

            s.stickyElement.parent().addClass(s.className);
            s.currentTop = newTop;
          }
        }
        if (s.navData && ! autoScrolling) {
		  var currentScroll = scrollTop + elementHeight;
		  for (var item in s.navData) {
		    if (s.navData.hasOwnProperty(item)) {
		      var navItem = s.navData[item];
		      if (currentScroll >= navItem.top
		        && currentScroll < navItem.bottom) {
		          // scroll position is within anchor section
		          if (! navItem.active) {
		            setActiveNavigation(s, navItem.anchor.attr('href'));
		          }
		          break;
		      } else if (navItem.active) {
		        setActiveNavigation(s, null);
		      }
		    }
		  }
        }
      }
    },
    resizer = function() {
      windowHeight = $window.height();
    },
    methods = {
      init: function(options) {
        var o = $.extend(defaults, options);
        return this.each(function() {
          var stickyElement = $(this);

          var stickyId = stickyElement.attr('id');
          var wrapper = $('<div></div>')
            .attr('id', stickyId + '-sticky-wrapper')
            .addClass(o.wrapperClassName);
          stickyElement.wrapAll(wrapper);

          if (o.center) {
            stickyElement.parent().css({width:stickyElement.outerWidth(),marginLeft:"auto",marginRight:"auto"});
          }

          if (stickyElement.css("float") == "right") {
            stickyElement.css({"float":"none"}).parent().css({"float":"right"});
          }

          var stickyWrapper = stickyElement.parent(),
            stickyOuterHeight = stickyElement.outerHeight();
          stickyWrapper.css('height', stickyOuterHeight);

          var navData = {};
          if (o.navigation) {
            // navigation option is turned on
            // find anchors in sticky element and save positions
            var anchors = stickyElement.find('a[href^="#"]');
            for (var i = 0; i < anchors.length; i++) {
              var $anchor = $(anchors[i]),
                anchorHref = $anchor.attr('href'),
                $section = $(anchorHref);
              if ($section.length) {
                var sectionTop = Math.ceil($section.offset().top);
                navData[anchorHref] = {
                  anchor: $anchor,
                  top: sectionTop,
                  bottom: sectionTop + $section.outerHeight(),
                  active: false
                };
              }
            }
            stickyElement.on('click', 'a[href^="#"]', function(event){
              event.preventDefault();
              var targetId = $(this).attr('href'),
                targetPx = (navData[targetId].top - stickyOuterHeight) + 5;
              setActiveNavigation({
	              navData: navData,
	              activeNavClass: o.activeNavClass
              }, targetId);
              scrollToTarget(targetPx, o.scrollSpeed);
            });
          }

          sticked.push({
            topSpacing: o.topSpacing,
            bottomSpacing: o.bottomSpacing,
            stickyElement: stickyElement,
            currentTop: null,
            stickyWrapper: stickyWrapper,
            className: o.className,
            getWidthFrom: o.getWidthFrom,
            navData: navData,
            activeNavClass: o.activeNavClass
          });
        });
      },
      update: scroller,
      unstick: function(options) {
        return this.each(function() {
          var unstickyElement = $(this);

          removeIdx = -1;
          for (var i = 0; i < sticked.length; i++)
          {
            if (sticked[i].stickyElement.get(0) == unstickyElement.get(0))
            {
                removeIdx = i;
            }
          }
          if(removeIdx != -1)
          {
            sticked.splice(removeIdx,1);
            unstickyElement.unwrap();
            unstickyElement.removeAttr('style');
          }
        });
      }
    };

  // should be more efficient than using $window.scroll(scroller) and $window.resize(resizer):
  if (window.addEventListener) {
    window.addEventListener('scroll', scroller, false);
    window.addEventListener('resize', resizer, false);
  } else if (window.attachEvent) {
    window.attachEvent('onscroll', scroller);
    window.attachEvent('onresize', resizer);
  }

  $.fn.sticky = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.sticky');
    }
  };

  $.fn.unstick = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method ) {
      return methods.unstick.apply( this, arguments );
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.sticky');
    }

  };
  $(function() {
    setTimeout(scroller, 0);
  });
})(jQuery);
