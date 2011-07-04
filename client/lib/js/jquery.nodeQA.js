 (function(){
      /**
       * The dollar sign could be overwritten globally,
       * but jQuery should always stay accesible
       */
      var $ = jQuery;
      /**
       * Extending jQuery namespace, we
       * could add public methods here
       */
      $.nodeQA = {};
      $.nodeQA.defaults = {         
      };           
      /**
       * Usage $('selector).nodeQA(optionArray);
       * See $.nodeQA.defaults for valid options 
       */        
      $.fn.nodeQA = function(options){
          var options = $.extend({}, $.nodeQA.defaults, options);
          var doc = this.get()[0].ownerDocument;
          var body = $(doc.body);

          // Create edit/save buttons
          function showToolbar(elem) {
              if ($(elem).hasClass('qaToolbar')) {
                  var toolbar = $(elem);
                  var curTarget =  toolbar.get()[0].target
                  var newTarget = null;
                  curTarget.entity.hover()
                  return true;
              } else {
                  var body = $($(elem).get()[0].ownerDocument.body); 
                  var win = $(elem).get()[0].ownerDocument.defaultView;
                  var toolbar = body.find('.qaToolbar')
                  var curTarget =  toolbar.get()[0].target
                  var newTarget = elem;
                  if (curTarget && curTarget!=newTarget) {
                      hideToolbar(curTarget);
                  }
                  var left = newTarget.getBoundingClientRect().left+win.scrollX
                  var top = newTarget.getBoundingClientRect().top+win.scrollY
                  toolbar.css('left', left+'px')
                  toolbar.css('top', top-20+'px')
              }
              var toolbarNode = toolbar.get()[0]
              if(toolbarNode.I!==null) {
                clearTimeout(toolbarNode.I)
                toolbarNode.I = null;
              }
              if (newTarget)
                toolbarNode.target=newTarget;
              $(newTarget).addClass('hovered')
              setStatus(toolbar, newTarget.entity.qaStatus)
              toolbar.css('display', 'block')
          }

          function hideToolbar(elem) {
            if ($(elem).hasClass('qaToolbar')) {
                var toolbar = $(elem);
            } else {
              var body = $($(elem).get()[0].ownerDocument.body); 
              var toolbar = body.find('.qaToolbar')
            }
            var toolbarNode = toolbar.get()[0]
            var target = toolbarNode.target
            function hide() {
              if (target) {
                target.blur();
                if (target==toolbar.get()[0].target) {
                  toolbar.get()[0].target=null;
                  $(target).removeClass('hovered')
                  toolbar.css('display', 'none')
                } else {
                  $(target).removeClass('hovered')
                }
              }
            }
            toolbar.get()[0].I = setTimeout(hide, 50);
          }

          function setStatus(elem, status) {
            switch (status) {
              case 0:
                  elem.addClass('qaUnknown');
                  elem.removeClass('qaRejected');
                  elem.removeClass('qaAccepted');
                  break;
              case 1:
                  elem.removeClass('qaUnknown');
                  elem.removeClass('qaRejected');
                  elem.addClass('qaAccepted');
                  break;
              case 2:
                  elem.removeClass('qaUnknown');
                  elem.addClass('qaRejected');
                  elem.removeClass('qaAccepted');
                  break;
            }

          }

          if (!body.find('.qaToolbar').length) {
            var toolbar = $(
                  "<div class='qaToolbar'>" +
                        "<a href='#' class='edit'></a>" +
                    "<a href='#' class='save'></a>" +
                    "<a href='#' class='cancel'></a>" +
                "</div>", doc).appendTo(body);
            toolbar.hover(function() {
              showToolbar(this);
            },function() {
             this.target.entity.unhover()
            })

            toolbar.find('.edit').click(function() {
                var target = toolbar.get()[0].target;
                target.entity.qaStatus = 0;
                setStatus(toolbar, 0);
                setStatus($(target), 0);
                setStatus($(target.entity), 0); 
                return false;
            });   

            // Save references and attach events            
            toolbar.find('.save').click(function() {
                var target = toolbar.get()[0].target;
                target.entity.qaStatus = 1;
                setStatus(toolbar, 1);
                setStatus($(target), 1);
                setStatus($(target.entity), 1); 
                return false;
            }); 

            // Save references and attach events            
            toolbar.find('.cancel').click(function() {
                var target = toolbar.get()[0].target;
                target.entity.qaStatus = 2;
                setStatus(toolbar, 2);
                setStatus($(target), 2);
                setStatus($(target.entity), 2);
                return false;
            }); 
          }
          return this.each(function(){
               // Add jQuery methods to the element
              var qable = $(this);
              this.showingOriginalString = false
              this.showQAToolbar = function(){showToolbar(this)}
              this.hideQAToolbar = function(){hideToolbar(this)}
              //var target = $(toolbar.get()[0].target);
              setStatus(qable, this.entity.qaStatus);
              qable.hover(function() {
                  this.entity.hover();
              },function() {
                  this.entity.unhover();
              })

          });
      }
      $.fn.disableNodeQA = function(options){
          return this.each(function(){
               // Add jQuery methods to the element
              var editable = $(this);
              this.showQAToolbar = undefined;
              this.hideQAToolbar = undefined;
              editable.unbind('mouseenter mouseleave');
          });
      }
  })();

