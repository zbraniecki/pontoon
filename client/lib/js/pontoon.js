var Pontoon = function() {

  var mode = 0; // 0 - l10n, 1 - QA

  /* public  */
  return {



    /*
     * Save data to server
     * Pontoon server push expects a POST with the following properties:
     *
     * id - list of msgid strings, the length of id should match the length of value ['Hello World']
     * value - list of msgstrs, should be empty if no changes, otherwise set to the edited value ['Hallo Welt']
     * project - url of the page being localized
     * locale - locale msgstrs are localized too
    */
    save: function() {
      // Deep copy: http://api.jquery.com/jQuery.extend
      var data = jQuery.extend(true, {}, this.client._data);

      $(data.entities).each(function() {
        delete this.node;
        delete this.ui;
        delete this.hover;
        delete this.unhover;
      });

      var self = this,
          url = ('url' in this.client._meta) ? this.client._meta['url'] : 'http://127.0.0.1:8000/push/',
          project = ('project' in this.client._meta) ? this.client._meta['project'] : this.client._doc.location.href,
          locale = $(this.client._ptn).find('input').val(),
          params = {
            'project': project,
            'locale': locale,
            // TODO: add, support other browsers - https://developer.mozilla.org/en/Using_JSON_in_Firefox
            'data': JSON.stringify(data)
          };

      $.ajaxSettings.traditional = true;
      $.post(url, params);
    },
  
  
  
    /*
     * Do not render HTML code
     *
     * string HTML snippet that has to be displayed as code instead of rendered
    */
    doNotRender: function(string) {
      return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },



    /**
     * Build source - translation pairs
     */
    rebuildList: function() {
      var self = this,
          list = $(this.client._ptn).find('#entitylist').empty()
          // tables still need 'cellspacing="0"' in the markup
          // http://meyerweb.com/eric/thoughts/2007/05/01/reset-reloaded/
          .append(
            '<table cellpadding="0" cellspacing="0" border="0">' + 
              '<thead><tr><th>Source</th><th class="tools"></th><th>Translation</th></tr></thead>' + 
              '<tbody></tbody>' + 
            '</table>');
  
      // Render
      $(this.client._data.entities).each(function() {
        var tr = $('<tr' + (this.translation ? ' class="translated"' : '') + '>' + 
        '<td class="source">' + 
          '<p>' + self.doNotRender(this.original) + '</p>' + 
        '</td>' +
        '<td class="tools">' +
          '<ul>' + 
            '<li title="Copy original string to translation" class="copy"></li>' + 
            '<li title="Machine translation by Google Translate" class="auto-translate"></li>' + 
            (this.comment ? '<li title="' + this.comment + '" class="comment"></li>' : '') + 
          '</ul>' + 
        '</td>' +
        '<td class="translation">' + 
          '<div class="suggestions">' + 
            '<a href="#translation" class="translation active">Translation</a>' + 
            '<a href="#translation-memory" class="tm">Translation memory</a>' + 
            '<a href="#other-users" class="users">Other users</a>' + 
            '<a href="#other-locales" class="locales">Other locales</a>' + 
          '</div>' + 
          '<textarea>' + (this.translation || '') + '</textarea>' + 
        '</td></tr>', self.client._ptn);
            
        tr.get(0).entity = this;
        if (this.node) { // For entities not found on the website
          this.node.get(0).entity = this;
        }
        this.ui = tr;
  
        list.find('tbody').append(tr);
      });
  
      // Main entity list handlers
      $("#main tr").hover(function() {
        this.entity.hover();
      }, function() {
        this.entity.unhover();
      }).click(function() {
        $(self.client._doc).find('.editableToolbar > .edit').click();
      });
  
      // Copy original string to translation
      $("#main .copy").click(function(e) {
      	e.stopPropagation();
        var toolbar = $(self.client._doc).find('.editableToolbar');
        toolbar.find('.edit').click().end();

      	var entity = $(this).parents('tr').get(0).entity;
      	$(entity.node).html(entity.original);
        toolbar.find('.save').click();
      });
  
      this.updateProgress();
    },
  
  
  
    /**
     * Update progress indicator and value
     */
    updateProgress: function() {
      var all = $("#main tbody tr").length,
          translated = $("#main tbody tr.translated").length;
      $('#progress span').width(Math.round(translated*100 / all) + '%');
      $('#progress-value').html(translated + '/' + all);
    },
  
  
  
    /**
     * Attach event handlers
     */
    attachHandlers: function() {
      var self = this;
      
      // Update entities and progress when saved
      $(".editableToolbar > .save", this.client._doc).click(function() {
        var element = $(this).parent().get(0).target;
        self.updateEntity(element);
        self.updateProgress();
      });
  
      // Update progress when cancelled
      $(".editableToolbar > .cancel", this.client._doc).click(function() {
        self.updateProgress();
      });
  
      // Open/close Pontoon UI
      $('#switch').unbind("click.pontoon").bind("click.pontoon", function() {
        if ($('#main').is('.opened')) {
          $('#entitylist').height(0);
        } else {
          $('#entitylist').height(300);
        }
        $('#source').height($(document).height() - $('#main').height());
        $('#main').toggleClass('opened');
      });

      // Authentication
      $('#authentication-menu .restricted .go').unbind("click.pontoon").bind("click.pontoon", function() {
        var author = $('#nickname').val() || $('#email').val();
        $('#authentication .selector').click();
        if (author) {
          $('#authentication .author').html(author).toggleClass('authenticated');
          $('#authentication-menu, #save-menu').toggleClass('menu');
        }
      });
      $('#nickname').unbind("keydown.pontoon").bind("keydown.pontoon", function(e) {
        var key = e.keyCode || e.which;
        if (key === 13) { // Enter
          $('#authentication-menu .restricted .go').click();
          return false;
        }
      });

      // Authentication toggle
      $('#authentication-menu .toggle').unbind("click.pontoon").bind("click.pontoon", function() {
        $('#authentication-menu')
          .find('.wrapper').toggle().end()
          .find('#password').toggle();
      });

      // Save menu
      $('#save-menu').find('.sign-out').unbind("click.pontoon").bind("click.pontoon", function() {
        $('#authentication .selector').click();
        $('#authentication .author').html('Sign in').toggleClass('authenticated');
        $('#authentication-menu, #save-menu').toggleClass('menu');
      }).end().find('.server').unbind("click.pontoon").bind("click.pontoon", function() {
        $('#authentication .selector').click();
        self.save();
      });

      $("#mode").click(function () {
        self.setMode();
      });
    },
  
  
  
    /**
     * Show and render main UI
     * Enable editable text
     */
    renderTools: function() {
      this.setMode(0);
      this.attachHandlers();
      this.rebuildList();
      $('#main').slideDown();
    },
  
  
  
    /**
     * Update entity and main UI
     * 
     * element HTML Element which contains l10n entities
     */
    updateEntity: function(element) {
      var entity = element.entity,
          clone = $(element).clone();
  
      entity.translation = $(clone).html();
      entity.ui.find('textarea').text(entity.translation).parents('tr').addClass('translated');
    },
  
  
  
    /**
     * Extend entity object
     * 
     * e Temporary entity object
     */
    extendEntity: function(e) {
      e.original = e.original || ""; /* Original string */
      e.translation = e.translation || ""; /* Translated string */
      e.comment = e.comment || ""; /* Comment for localizers */
      e.node = e.node || null; /* HTML Element holding string */
      e.ui = e.ui || null; /* HTML Element representing string in the main UI */
      e.qaStatus = e.qaStatus || 0;

      e.hover = function() {
        if (mode==0) {
          this.node.get(0).showToolbar();
        } else {
          this.node.get(0).showQAToolbar();
        }
        this.ui.toggleClass('hovered');
      };
      e.unhover = function() {
        if (mode==0) {
          this.node.get(0).hideToolbar();
        } else {
          this.node.get(0).hideQAToolbar();
        }
        this.ui.toggleClass('hovered');
      };
    },
  
  
  
    /**
     * Extract entities from the document, not prepared for working with Pontoon
     * 
     * Create entity object from every non-empty text node
     * Exclude nodes from special tags, e.g. <script> and <link>
     * Skip nodes already included in parent nodes
     * Add temporary pontoon-entity class to prevent duplicate entities when guessing
     */ 
    guessEntities: function() {
      var self = this;
      this.client._data.entities = [];
  
      $(this.client._doc).find(':not("script, style")').contents().each(function() {
        if (this.nodeType === Node.TEXT_NODE && $.trim(this.nodeValue).length > 0 && $(this).parents(".pontoon-entity").length === 0) {
          var entity = {};
          entity.original = $(this).parent().html();
          entity.node = $(this).parent();
          self.extendEntity(entity);
          self.client._data.entities.push(entity);
          $(this).parent().addClass("pontoon-entity");
        }
      });
      
      $(".pontoon-entity").removeClass("pontoon-entity");
      self.renderTools();
    },
  
  
  
    /**
     * Get data from external meta file: original, translation, comment, suggestions...
     * Match with each string in the document, which is prepended with l10n comment nodes
     * Example: <!--l10n-->Hello World
     *
     * Create entity objects
     * Remove comment nodes
     */
    getEntities: function() {
      var self = this,
          prefix = 'l10n',
          counter = 1, /* TODO: use IDs or XPath */
          parent = null;

      $.getJSON($("#source").attr("src") + "/pontoon/" + this.client._locale + ".json").success(function(data) {
      	self.client._data = data;
      	var entities = self.client._data.entities;
      	
        $(self.client._doc).find('*').contents().each(function() {
          if (this.nodeType === Node.COMMENT_NODE && this.nodeValue.indexOf(prefix) === 0) {
            var entity = entities[counter],
                translation = entity.translation;
            
            parent = $(this).parent();
            $(this).remove();
            if (translation.length > 0) {
              parent.html(translation);
            }

            entity.node = parent;
            self.extendEntity(entity);
            counter++;
          }
        });
        self.renderTools();
      });
    },
  
  

    /**
     * Extract entities from the document
     * Determine if the current page is prepared for working with Pontoon
     */ 
    extractEntities: function() {
      var meta = $(this.client._doc).find('head > meta[name=Pontoon]');
      if (meta.length > 0) {
        if (meta.attr('content')) {
          this.client._meta['project'] = meta.attr('content');
        }
        if (meta.attr('ip')) {
          this.client._meta['url'] = meta.attr('ip');
        }
        return this.getEntities();
      }

      // Read meta values
      return this.guessEntities();
    },
  
    /**
     * Set Pontoon mode
     * 0 - Localization
     * 1 - QA
     */
    setMode: function(m,n) {
      if (m===n) m = mode==0?1:0;
      
      if (m==0) {
        mode = 0;
      } else {
        mode = 1;
      }
      if (mode == 0) {
        $(this.client._data.entities).each(function() {
          if (this.node.disableNodeQA)
            this.node.disableNodeQA();
        });

        $(this.client._doc).find('.qaToolbar').remove();

        $(this.client._doc).find('link[href="../../client/lib/css/qa.css"]').each(function() {
          $(this).remove();
        });
        var ss = $('<link rel="stylesheet" href="../../client/lib/css/editable.css">', this.client._doc);
        $('head', this.client._doc).append(ss);   
        $(this.client._data.entities).each(function() {
          if (this.node) { // For entities not found on the website
            this.node.editableText();
          }
        });
      } else {
        $(this.client._data.entities).each(function() {
          if (this.node) { // For entities not found on the website
            this.node.disableEditableText();
          }
        });
        $(this.client._doc).find('.editableToolbar').remove();
        $(this.client._doc).find('link[href="../../client/lib/css/editable.css"]').each(function() {
          $(this).remove();
        });
        var ss = $('<link rel="stylesheet" href="../../client/lib/css/qa.css">', this.client._doc);
        $('head', this.client._doc).append(ss);   
        $(this.client._data.entities).each(function() {
          if (this.translation && this.original != this.translation) {
            this.node.nodeQA();
          }
        });
      }
    }, 
  
    /**
     * Initialize Pontoon Client
     *
     * doc Website document object
     * ptn Pontoon document object
     * locale ISO 639-1 language code of the language website is localized to
     */
    init: function(doc, ptn, locale) {
      if (!doc) {
        throw "Document handler required";
      }
      
      // Build client object
      this.client = {
        _doc: doc,
        _ptn: ptn,
        _locale: locale,
        _meta: {},
        _data: {}
      };
      
      // Enable document editing
      this.extractEntities();      
    },



    /**
     * Common functions used in both, client specific code and Pontoon library
     */
    common: function() {

      // Show/hide menu on click
      $('.selector').unbind("click.pontoon").bind("click.pontoon", function(e) {
        if (!$(this).siblings('.menu').is(':visible')) {
          e.stopPropagation();
          $('.menu').hide();
          $('#iframe-cover').hide(); // iframe fix
          $('.select').removeClass('opened');
          $(this).siblings('.menu').show();
          $('#iframe-cover').show().height($('#source').height()); // iframe fix
          $(this).parents('.select').addClass('opened');
        }
      });

      // Hide menus on click outside
      $('html').unbind("click.pontoon").bind("click.pontoon", function() {
        $('.menu').hide();
        $('#iframe-cover').hide(); // iframe fix
        $('.select').removeClass('opened');
      });
      $('.menu').unbind("click.pontoon").bind("click.pontoon", function(e) {
        e.stopPropagation();
      });
    
      // Start new project with current website url and locale
      $('.locale .confirm, .locale .menu li:not(".add")').unbind("click.pontoon").bind("click.pontoon", function() {
        // TODO: url and locale validation
        window.location = "?url=" + $('.url:visible').val() + "&locale=" + $(this).find('.flag').attr('class').split(' ')[1];
      });
      $('.url').unbind("keydown.pontoon").bind("keydown.pontoon", function(e) {
        var key = e.keyCode || e.which;
        if (key === 13) { // Enter
          $('.locale .confirm:visible').click();
          return false;
        }
      });

      // Menu hover
      $('.menu li').live('hover', function() {
        $('.menu li.hover').removeClass('hover');
        $(this).toggleClass('hover');
      });

      // Use arrow keys to move around menu, confirm with enter, close with escape
      $('html').unbind("keydown.pontoon").bind("keydown.pontoon", function(e) {
        if ($('.menu').is(':visible')) {
          var key = e.keyCode || e.which,
              menu = $('.menu:visible'),
              hovered = menu.find('li.hover');
      	      
          if (key === 38) { // up arrow
            if (hovered.length === 0 || menu.find('li:first').is('.hover')) {
              menu.find('li.hover').removeClass('hover');
              menu.find('li:last').addClass('hover');
            } else {
              menu.find('li.hover').removeClass('hover').prev().addClass('hover');
            }
            return false;
          }
          
          if (key === 40) { // down arrow
            if (hovered.length === 0 || menu.find('li:last').is('.hover')) {
              menu.find('li.hover').removeClass('hover');
              menu.find('li:first').addClass('hover');
            } else {
              menu.find('li.hover').removeClass('hover').next().addClass('hover');
            }
            return false;
          }

          if (key === 13) { // Enter
            menu.find('li.hover').click();
            return false;
          }

          if (key === 27) { // Escape
            menu.siblings('.selector').click();
            return false;
          }
        }
      });
    }

  };
}();
