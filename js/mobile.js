/**
 * Plugin Mobile for Roundcube
 * 
 * Add new skin mobile to Roundcube
 * 
 * Javascript mobile file
 * 
 * Copyright (C) 2015 PNE Annuaire et Messagerie/MEDDE
 * 
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 * 
 * @author PNE Annuaire et Messagerie/MEDDE
 * @license GNU GPLv3+
 * 
 */
var page_loading;
var current_page_scroll;
var current_uid;
var previous_page;
var timer, show_timer, checkmail_timer, touchstart_timer;
var storePosition = {
  topCoordinate : null
}

$(document).on("pagecreate", ".jqm-calendar", function() {
  // Swipe to remove list item
  $(document).on("swipeleft swiperight", "#calendar", function(event) {
    if (event.type === "swipeleft") {
      $("#calendar").fullCalendar('next');
    }
    else {
      $("#calendar").fullCalendar('prev');
    }
  });
  // Use keydown for non touch screen
  $('html').keydown(function(e) {
    if (e.which == 37) {
      // Arrow left
      $("#calendar").fullCalendar('prev');
    }
    else if (e.which == 39) {
      // Arrow right
      $("#calendar").fullCalendar('next');
    }
  });
  // Use arrow
  $('.jqm_calendar_previous').click(function(evt) {
    $("#calendar").fullCalendar('prev');
  });
  $('.jqm_calendar_next').click(function(evt) {
    $("#calendar").fullCalendar('next');
  });
});

$(document).on("pageshow", ".jqm-compose", function() {
  $('#compose-subject').click(function() {
    $('#compose-subject input').focus();
  });
});

$(document).on("pageshow", '#page_mail_list', function() {
  if (window.storePosition.topCoordinate !== null) {
    $.mobile.silentScroll(window.storePosition.topCoordinate);
  }
  $('.jqm-mail-more-buttons-header a.move').click(function() {
    setTimeout(function() {
      $('#folder-selector').css({
        left : ($(document).width() - $('#folder-selector').width()) / 2,
        top : 50
      });
    }, 50)
  });
});

$(document).on("click", '#messagelist a', function(e) {
  e.preventDefault();
  return false;
});

$(document).on("pageshow", '#page_addressbook_list', function() {
  if (window.storePosition.topCoordinate !== null) {
    $.mobile.silentScroll(window.storePosition.topCoordinate);
  }
});

$(document)
    .on("pageshow", ".jqm-message", function() {
      $('#buttons-right-panel a').click(function() {
        setTimeout(function() {
          $('#folder-selector').css({
            left : ($(document).width() - $('#folder-selector').width()) / 2,
            top : 50
          });
          $('#buttons-right-panel').panel('close');
        }, 50)
      });

      if (!window.current_uid) {
        return;
      }
      // Masquer le back list et le remplacer par le back jquery mobile
      $('.jqm_message_list_group').show();
      $('.rc_message_back').hide();

      // Show/hide nav buttons
      var next_row = rcmail.message_list.get_next_row();
      var prev_row = rcmail.message_list.get_prev_row();
      if (!next_row) {
        $('.jqm_message_next').hide();
        load_next_page();
      }
      else {
        $('.jqm_message_next').show();
      }
      if (!prev_row) {
        $('.jqm_message_previous').hide();
      }
      else {
        $('.jqm_message_previous').show();
      }

      rcmail.env.uid = window.current_uid;
      rcmail.env.action = 'show';

      // Gestion des labels
      if (rcmail.env.messages[window.current_uid].flags) {
        jQuery
            .each(rcmail.env.messages[window.current_uid].flags.tb_labels, function(
                idx, val) {
              rcm_tb_label_flag_msgs([ -1, ], val);
            });
      }
      
      if (!$('#attachment-list li').length) {
        $('div.rightcol').hide();
        $('div.leftcol').css('margin-right', '0');
      }
      $('#messagebody img').each(function() {
        if ($(this).attr('src') == 'program/resources/blocked.gif') {
          $('#remote-objects-message').show();
          rcmail.enable_command('load-images', 'always-load', true);
          return;
        }
      });

      var message_commands = [ 'show', 'reply', 'reply-all', 'reply-list',
          'move', 'copy', 'delete', 'open', 'mark', 'edit', 'viewsource',
          'print', 'load-attachment', 'download-attachment', 'show-headers',
          'hide-headers', 'download', 'forward', 'forward-inline',
          'forward-attachment', 'change-format' ];

      rcmail.enable_command(message_commands, rcmail.env.uid);
      $('#countcontrols').hide();

      rcmail.addEventListener('responseafterlist', function(evt) {
        var next_row = rcmail.message_list.get_next_row();
        if (next_row) {
          $('.jqm_message_next').show();
        }
      });
      rcmail
          .addEventListener('actionafter', function(evt) {
            if (evt.action == 'mark') {
              if (evt.props == 'unread') {
                // Passer le message en non lu
                rcmail.set_message(rcmail.env.uid, 'unread', true);
              }
              else if (evt.props == 'read') {
                // Passer le message en lu
                rcmail.set_message(rcmail.env.uid, 'unread', false);
              }
              else {
                return;
              }
              if ($.mobile.pageContainer.pagecontainer("getActivePage")[0].id != 'page_mail_list') {
                $.mobile.pageContainer
                    .pagecontainer("change", $("#page_mail_list"));
              }
            }
          });
      rcmail
          .addEventListener('responseaftermove', function(evt) {
            window.previous_page = 'current_page';
            if ($.mobile.pageContainer.pagecontainer("getActivePage")[0].id != 'page_mail_list') {
              if (window.previous_page == 'page_mail_list') {
                $.mobile.back();
              }
              else {
                $.mobile.pageContainer
                    .pagecontainer("change", $("#page_mail_list"));
              }
            }
          });
      rcmail
          .addEventListener('responseafterdelete', function(evt) {
            window.previous_page = 'current_page';
            if ($.mobile.pageContainer.pagecontainer("getActivePage")[0].id != 'page_mail_list') {
              if (window.previous_page == 'page_mail_list') {
                $.mobile.back();
              }
              else {
                $.mobile.pageContainer
                    .pagecontainer("change", $("#page_mail_list"));
              }
            }
          });
    });

$(document).on("pagecreate", ".jqm-message", function() {
  if (window.previous_page) {
    $('.jqm_message_list').click(function(evt) {
      if (window.previous_page == 'page_mail_list') {
        window.previous_page = 'current_page';
        $.mobile.back();
      }
      else {
        window.previous_page = 'current_page';
        $.mobile.pageContainer.pagecontainer("change", $("#page_mail_list"));
      }
      evt.preventDefault();
    });
    $('.jqm_message_previous').click(function(evt) {
      var uid = rcmail.message_list.get_row_uid(rcmail.message_list
          .get_prev_row());
      window.current_uid = uid;
      rcmail.message_list.last_selected = uid;
      window.previous_page = 'current_page';
      // Passer le message en lu
      rcmail.set_message(uid, 'unread', false);
      rcmail.show_message_mobile(uid, {});
      window.storePosition.topCoordinate -= 76;
      evt.preventDefault();
    });
    $('.jqm_message_next').click(function(evt) {
      var uid = rcmail.message_list.get_row_uid(rcmail.message_list
          .get_next_row());
      window.current_uid = uid;
      rcmail.message_list.last_selected = uid;
      window.previous_page = 'current_page';
      // Passer le message en lu
      rcmail.set_message(uid, 'unread', false);
      rcmail.show_message_mobile(uid, {});
      window.storePosition.topCoordinate += 76;
      evt.preventDefault();
    });

    $('#attachment-list li a').click(function() {
      $(this).attr('target', '_blank');
      $(this).attr('onlick', '');

    });
    $('.image-attachment a').click(function() {
      $(this).attr('target', '_blank');
      $(this).attr('onlick', '');

    });
    $('.zipdownload').hide();    
  }
});

$(document)
    .on("pageshow", ".jqm-contact", function() {
      if (!window.current_uid) {
        return;
      }
      // Masquer le back list et le remplacer par le back jquery mobile
      $('.jqm_contact_list_group').show();
      $('.rc_contact_back').hide();

      rcmail.env.cid = window.current_uid;
      rcmail.env.action = 'show';
      rcmail.enable_command('show', 'edit', true);

      $('input.groupmember')
          .change(function() {
            rcmail
                .group_member_change(this.checked ? 'add' : 'del', rcmail.env.cid, rcmail.env.source, this.value);
          });
    });

$(document)
    .on("pagecreate", ".jqm-contact", function() {
      if (window.previous_page) {
        // Swipe to open panel
        var swipe = true;
        $(document).on("swipeleft swiperight", ".jqm-contact", function(event) {
          if (!swipe) {
            return;
          }
          swipe = false;
          setTimeout(function() {
            swipe = true;
          }, 900);
        });
        $('.jqm_contact_list').click(function(evt) {
          if (window.previous_page == 'page_addressbook_list') {
            window.previous_page = 'current_page';
            $.mobile.back();
          }
          else {
            window.previous_page = 'current_page';
            $.mobile.pageContainer
                .pagecontainer("change", $("#page_addressbook_list"));
          }
          evt.preventDefault();
        });
        $('.contactcontrollerphone .contactfieldcontent.text').each(function() {
          $(this).html('<a href="tel:' + $(this).html() + '">' + $(this).html()
              + '</a>')
        });
        // register command
        rcmail
            .register_command('delete_mobile', rcmail.delete_contact_mobile, !rcmail.env.readonly);
      }
    });

$(document)
  .on("pageshow", ".jqm-plugin", function() {
     $('.ui-button-disabled').removeClass('ui-button-disabled').removeClass('ui-state-disabled');
  });

$(document).on("pageloadfailed", function(event, data) {
  event.preventDefault();
});

// Affichage jquery mobile
$(document).ready(function() {
  // Mailboxlist
  $('#mailboxlist').attr('data-role', 'listview');
  $('#mailboxlist ul').attr('data-role', 'listview');
  $('#mailboxlist ul').show();
  $('#mailboxlist li').attr('data-icon', 'false');
  $('#mailboxlist div.treetoggle').hide();

  // add roundcube events
  rcmail.addEventListener('insertrow', function(event) {
    add_mobile_class(event.uid, event.row);
  });

  // Quick search box
  $('#quicksearchbox').attr('placeholder', 'Search...');
  $('#quicksearchbox').attr('data-type', 'search');

  // Directory contact list
  $('#directorylist_mobile').attr('data-role', 'listview');
  $('#directorylist_mobile ul').attr('data-role', 'listview');
  $('#directorylist_mobile ul').show();
  $('#directorylist_mobile > li').attr('data-icon', 'user');
  $('#directorylist_mobile li li').attr('data-icon', 'false');
  $('#directorylist_mobile div.treetoggle').hide();

  // Calendar list
  $('#calendarslist').attr('data-role', 'listview');
  $('#calendarslist ul').attr('data-role', 'listview');
  $('#calendarslist div.treetoggle').hide();

  // Settings list
  $('#settingslist_mobile').attr('data-role', 'listview');
  $('#settingslist_mobile a').attr('data-ajax', 'false');
  $('#settingslist_mobile ul').attr('data-role', 'listview');
  $('#settingslist_mobile ul').show();
  $('#settingslist_mobile > li').attr('data-icon', 'user');
  $('#settingslist_mobile li li').attr('data-icon', 'false');
  $('#settingslist_mobile div.treetoggle').hide();

  // Folder subscription list
  $('#subscription-table').attr('data-role', 'listview');
  $('#subscription-table ul').attr('data-role', 'listview');
  $('#subscription-table ul').show();
  $('#subscription-table li').attr('data-icon', 'carat-r');
  $('#subscription-table div.treetoggle').hide();

  if ($("#eventedit").length) {
    $("#eventedit .edit-alarm-type").selectmenu();
    // $("#eventedit .edit-alarm-type").selectmenu("refresh", true);
  }
  
  // Order icons
  if ($('#apps-right-panel .button-switch_desktop').length) {
    var html = $('#apps-right-panel .button-switch_desktop').get(0).outerHTML;
    $('#apps-right-panel .button-switch_desktop').remove();
    $('#apps-right-panel .button-logout').before(html);
  }
  if ($('#apps-right-panel .button-calendar').length) {
    var html = $('#apps-right-panel .button-calendar').get(0).outerHTML;
    $('#apps-right-panel .button-calendar').remove();
    $('#apps-right-panel .button-settings').before(html);
  }
  if ($('#apps-right-panel .button-melanie2_moncompte').length) {
    var html = $('#apps-right-panel .button-melanie2_moncompte').get(0).outerHTML;
    $('#apps-right-panel .button-melanie2_moncompte').remove();
    $('#apps-right-panel .button-settings').before(html);
  }
  if ($('#apps-right-panel .button-melanie2_sondage').length) {
    var html = $('#apps-right-panel .button-melanie2_sondage').get(0).outerHTML;
    $('#apps-right-panel .button-melanie2_sondage').remove();
    $('#apps-right-panel .button-settings').before(html);
  }
  if ($('#apps-right-panel .button-melanie2_jabber').length) {
    var html = $('#apps-right-panel .button-melanie2_jabber').get(0).outerHTML;
    $('#apps-right-panel .button-melanie2_jabber').remove();
    $('#apps-right-panel .button-settings').before(html);
  }
});

/**
 * Add mobile class to the row
 * 
 * @param uid
 * @param row
 */
function add_mobile_class(uid, row) {
  var rowobj = $(row.obj);
  rowobj.find('span.mobile_text').addClass(rowobj.find('span.mobile_class')
      .text());
}

$(document).bind("mobileinit", function() {
  // Mise en cache des données
  $.mobile.page.prototype.options.domCache = false;
  $.mobile.ajaxLinksEnabled = false;
  // Disable history
  // See https://github.com/jquery/jquery-mobile/issues/5465
  // $.mobile.hashListeningEnabled = false;
  // $.mobile.pushStateEnabled = false;
  // $.mobile.changePage.defaults.changeHash = false;
});

/**
 * Load the next messages list page
 */
function load_next_page() {
  // Affichage de la page suivante au bas de la page
  var page = window.current_page_scroll;
  if (page > 0 && page <= rcmail.env.pagecount && !window.page_loading[page]) {
    window.page_loading[page] = true;
    var lock = rcmail.set_busy(true, 'loading');
    var post_data = {};
    post_data._mbox = rcmail.env.mailbox;
    post_data._page = page;
    // also send search request to get the right records
    if (rcmail.env.search_request)
      post_data._search = rcmail.env.search_request;
    rcmail.http_request('list', post_data, lock);
  }
}

// Gestion des données de roundcube
if (window.rcmail) {
  rcmail
      .addEventListener('init', function(evt) {
        // Initialisation de la liste des pages chargées
        window.page_loading = {};
        window.current_page_scroll = 1;

        // Choix de la balp dans le champ select
        $('#select_balp_mobile').change(function() {
          window.location = $("#select_balp_mobile option:selected").val();
        });
        $('#select_balp_mobile').click(function(evt) {
          evt.stopPropagation();
          evt.preventDefault();
        });
        // Redirection automatique après la création d'un contact
        // Problème lié au fait qu'en skin mobile on n'affiche pas le contact et
        // la liste en même temps
        if (window.location.href.indexOf('?_task=addressbook&_orig_source=') != -1
            && !rcmail.env.cid) {
          window.location = '?_task=addressbook&_source='
              + window.location.href.split('?_task=addressbook&_orig_source=')
                  .pop();
        }
        // Même problème pour l'édition des dossiers
        // if
        // (window.location.href.indexOf('?_task=settings&_action=edit-folder&_mbox=')
        // != -1) {
        // window.location = '?_task=settings&_action=folders';
        // }

        if (rcmail.env.task == 'mail'
            && (!rcmail.env.action || rcmail.env.action == "")) {
          var scroll = false;
          $('.ui-title').html($('#mailboxlist li.selected a').first().clone()
              .children().remove().end().text());

          // Close panel on resize pour eviter les effets indésirables sur la
          // largeur de la page
          $(window).resize(function() {
            // $('#mailview-left-panel').panel("refresh");
            $('#mailview-left-panel').panel("close");
          });

          // On click on mailboxlist do some actions
          $('#mailboxlist li a').click(function() {
            $('#mailview-left-panel').panel("close");
            $('.ui-title').html($(this).clone().children().remove().end()
                .text())
            $('#mailboxlist').listview('refresh');
          });

          // Rechercher dans les messages
          $('.jqm-mail-cancel-searchbox').click(function() {
            $('.jqm-mail-header').show();
            $('.jqm-mail-search-header').hide();
          });
          $('.jqm-mail-open-searchbox').click(function() {
            $('.jqm-mail-header').hide();
            $('.jqm-mail-search-header').show();
            $('.jqm-mail-search-header input').focus();
          });

          // Messages buttons
          $('.jqm-mail-cancel-buttons').click(function() {
            $('.jqm-mail-header').show();
            $('.jqm-mail-buttons-header').hide();
            $('.jqm-mail-buttons-showmore').addClass('ui-icon-caret-down');
            $('.jqm-mail-buttons-showmore').removeClass('ui-icon-caret-up');
            $('.jqm-mail-more-buttons-header').hide();
            rcmail.message_list.clear_selection();
          });
          $('.jqm-mail-buttons-showmore').click(function() {
            if ($(this).hasClass('ui-icon-caret-down')) {
              $(this).removeClass('ui-icon-caret-down');
              $(this).addClass('ui-icon-caret-up');
              $('.jqm-mail-more-buttons-header').show();
            }
            else {
              $(this).addClass('ui-icon-caret-down');
              $(this).removeClass('ui-icon-caret-up');
              $('.jqm-mail-more-buttons-header').hide();
            }
          });
          
          $('.jqm-mail-more-buttons-header li').each(function() {
            if ($(this).find('a').hasClass('filterlink')) {
              $(this).find('a').addClass('ui-link ui-btn ui-corner-all ui-icon-filter ui-btn-icon-notext');
              $('.jqm-mail-more-buttons-header .ui-controlgroup-controls .move').before($(this).html());  
            }
            $(this).remove();
          });
          
          $(document).on('click', '.jqm-mail-more-buttons-header a.filterlink', function() {
            window.location.href = rcmail.env.comm_path+'&_action=plugin.managesieve-action&_framed=1';
          });

          // Récupérer le focus sur le search box
          $('#quicksearchbox').click(function() {
            $('#quicksearchbox').focus();
          });

          $(document)
              .scroll(function() {
                if ($.mobile.pageContainer.pagecontainer("getActivePage")[0].id != 'page_mail_list') {
                  return;
                }
                if (($(window).scrollTop() > 200 && (($(window).scrollTop() + $(window)
                    .height()) / $(document).height()) >= 0.95)
                    && window.current_page_scroll > 1) {
                  load_next_page();
                }
              });
          // Réinitialise les données une fois que la liste est rafraichie
          rcmail.message_list.addEventListener('clear', function(evt) {
            window.page_loading = {};
            rcmail.env.current_page = 1;
            window.current_page_scroll = 2;
          });
        }
        else if (rcmail.env.task == 'mail' && rcmail.env.action == 'compose') {
          // Fermer le pop up d'upload au click
          $('.button_upload_photo').click(function() {
            $("#upload-popup").popup('close');
          });

          rcmail.env.compose_commands = [ 'send-attachment',
              'remove-attachment', 'send', 'cancel', 'toggle-editor',
              'list-adresses', 'pushgroup', 'search', 'reset-search', 'extwin',
              'insert-response', 'save-response' ];

          if (rcmail.env.drafts_mailbox)
            rcmail.env.compose_commands.push('savedraft')

          rcmail
              .enable_command(rcmail.env.compose_commands, 'identities', 'responses', true);

          rcmail.addEventListener('aftersend-attachment', show_uploadform)
              .addEventListener('add-recipient', function(p) {
                show_header_row(p.field, true);
              });

          // Show input elements with non-empty value
          var f, v, field, fields = [ 'cc', 'bcc', 'replyto', 'followupto' ];
          for (f = 0; f < fields.length; f++) {
            v = fields[f];
            field = $('#_' + v);
            if (field.length) {
              field.on('change', {
                v : v
              }, function(e) {
                if (this.value) show_header_row(e.data.v, true);
              });
              if (field.val() != '') show_header_row(v, true);
            }
          }
        }
        else if (rcmail.env.task == 'mail' && rcmail.env.action == 'show') {
          $('.mark_as_read').click(function() {
            $('#buttons-right-panel').panel("close");
          });
          $('.mark_as_unread').click(function() {
            $('#buttons-right-panel').panel("close");
          });
          $('#bounce_button_mobile').click(function() {
            $('#buttons-right-panel').panel("close");
          });          
        }
        else if (rcmail.env.task == 'addressbook'
            && (!rcmail.env.action || rcmail.env.action == "")) {
          $('.ui-title').html($('#directorylist_mobile li.selected a').first()
              .text());
          $('#directorylist_mobile li.selected a').first()
              .addClass('ui-btn ui-btn-icon-right ui-icon-check');

          // Close panel on resize pour eviter les effets indésirables sur la
          // largeur de la page
          $(window).resize(function() {
            $('#addressbook-left-panel').panel("close");
          });

          $('#directorylist_mobile li a').click(function() {
            $('#addressbook-left-panel').panel("close");
            $('#directorylist_mobile li a').removeClass('ui-btn-active');
            window.page_loading = {};
            rcmail.env.current_page = 1;
            $('.ui-title').html($(this).clone().children().remove().end()
                .text())
            $('#directorylist_mobile').listview('refresh');
          });

          // Rechercher dans les messages
          $('.jqm-addressbook-cancel-searchbox').click(function() {
            $('.jqm-addressbook-header').show();
            $('.jqm-addressbook-search-header').hide();
          });
          $('.jqm-addressbook-open-searchbox').click(function() {
            $('.jqm-addressbook-header').hide();
            $('.jqm-addressbook-search-header').show();
            $('.jqm-addressbook-search-header input').focus();
          });

          // Récupérer le focus sur le search box
          $('#quicksearchbox').click(function() {
            $('#quicksearchbox').focus();
          });

          // Gestion du scroll infini
          $(window)
              .scroll(function() {
                if (($(window).scrollTop() > 200 && (($(window).scrollTop() + $(window)
                    .height()) / $(document).height()) >= 0.95)) {
                  var page = rcmail.env.current_page + 1;
                  if (page > 0 && page <= rcmail.env.pagecount
                      && !window.page_loading[page]) {
                    window.page_loading[page] = true;
                    var lock = rcmail.set_busy(true, 'loading');
                    var post_data = {};
                    post_data._source = rcmail.env.source;
                    if (rcmail.env.group) post_data._gid = rcmail.env.group;
                    post_data._page = page;
                    // also send search request to get the right records
                    if (rcmail.env.search_request)
                      post_data._search = rcmail.env.search_request;
                    rcmail
                        .http_request_mobile('list', post_data, lock, function() {
                          rcmail.env.current_page = page;
                        }, function() {
                        });
                  }
                }
              });
          // Réinitialise les données une fois que la liste est rafraichie
          rcmail.contact_list.addEventListener('clear', function(evt) {
            window.page_loading = {};
            rcmail.env.current_page = 1;
          });
        }
        else if (rcmail.env.task == 'addressbook'
            && rcmail.env.action == 'show') {
          $('.contactcontrollerphone .contactfieldcontent.text')
              .each(function() {
                $(this).html('<a href="tel:' + $(this).html() + '">'
                    + $(this).html() + '</a>')
              });
          // register command
          rcmail
              .register_command('delete_mobile', rcmail.delete_contact_mobile, !rcmail.env.readonly);

        }
        else if (rcmail.env.task == 'addressbook'
            && rcmail.env.action == 'edit') {
          $("select.addfieldmenu").change(function() {
            $('#contacttabs').trigger("create");
          });
          $('.button_upload_photo').click(function() {
            $("#upload-popup").popup('close');
          });
        }
        else if (rcmail.env.task == 'calendar') {
          // Close panel on resize pour eviter les effets indésirables sur la
          // largeur de la page
          $(window).resize(function() {
            $('#calendarview-left-panel').panel("close");
          });
          // Bind an event to window.onhashchange that, when the hash changes
          $(window).hashchange(function(event) {
            var hash = event.originalEvent.oldURL.split('#').pop();
            if (hash) {
              switch (hash) {
              case 'event_show_dialog':
                // close show dialog
                $("#eventshow:ui-dialog").dialog('close');
                break;
              case 'event_edit_dialog':
                // close show dialog
                $("#eventeditdialog:ui-dialog").dialog('close');
                break;
              case 'eventeditpage':
                // Close current page, switch to calendar page
                // $.mobile.back();
                $.mobile.pageContainer
                    .pagecontainer("change", './?_task=calendar');
                break;
              }
            }
          });
        }
        else if (rcmail.env.task == 'settings'
            && rcmail.env.action == 'edit-folder') {
          rcmail.env.mailbox = rcmail.env.folder;
          rcmail.enable_command('delete-folder', true);
        }
        else if (rcmail.env.task == 'settings'
            && rcmail.env.action == 'plugin.managesieve-action') {
          $('.boxcontent').trigger("create");
          rcmail
              .addEventListener('responseafterplugin.managesieve-action', function(
                  evt) {
                $('.boxcontent').trigger("create");
              });
        }
        else if (rcmail.env.task == 'settings'
            && rcmail.env.action == 'plugin.managesieve') {
          $(document).on('click', 'table#filterslist tr', function() {
            var id = rcmail.filters_list.get_row_uid($(this).get(0));
            window.location.href =  rcmail.env.comm_path + '&_action=plugin.managesieve-action&_framed=1&_fid=' + id;
          });
        }
        // message list
        if (rcmail.message_list) {
          var p = window.rcmail;
          rcmail.message_list.addEventListener('click', function(o) {
            return false;
          }).addEventListener('dblclick', function(o) {
            return false;
          }).addEventListener('keypress', function(o) {
            return false;
          }).addEventListener('select', function(o) {
            return false;
          }).addEventListener('dragstart', function(o) {
            return false;
          }).addEventListener('dragmove', function(e) {
            return false;
          }).addEventListener('dragend', function(e) {
            return false;
          }).addEventListener('expandcollapse', function(o) {
            return false;
          }).addEventListener('column_replace', function(o) {
            return false;
          })
          if (rcmail && rcube_list_widget) {
            /**
             * onmousedown-handler of message list row
             */
            rcube_list_widget.prototype.drag_row = function(e, id) {
              // don't do anything (another action processed before)
              if (!this.is_event_target(e)) return true;

              this.drag_active = false;

              this.in_selection_before = e && e.istouch
                  || this.in_selection(id) ? id : false;

              // selects currently unselected row
              if (!this.in_selection_before) {
                var mod_key = rcube_event.get_modifier(e);
                this.select_row(id, mod_key, true);
              }

              return false;
            };

            /**
             * selects or unselects the proper row depending on the modifier key
             * pressed
             */
            rcube_list_widget.prototype.select_row = function(id, mod_key,
                with_mouse, single) {
              var select_before = this.selection.join(','), in_selection_before = this
                  .in_selection(id);

              if (this.last_selected && this.rows[this.last_selected]) {
                $(this.rows[this.last_selected].obj).removeClass('focused')
                    .find(this.col_tagname()).eq(this.subject_col)
                    .removeAttr('tabindex');
              }

              // unselect if toggleselect is active and the same row was clicked
              // again
              if (this.toggleselect && in_selection_before && !mod_key) {
                this.clear_selection();
              }
              // trigger event if selection changed
              else if (this.selection.join(',') != select_before) {
                this.triggerEvent('select');
              }

              if (this.rows[id]) {
                $(this.rows[id].obj).addClass('focused');
                // set cursor focus to link inside selected row
                if (this.focused)
                  this.focus_noscroll($(this.rows[id].obj).find(this
                      .col_tagname()).eq(this.subject_col)
                      .attr('tabindex', '0'));
              }

              if (!this.selection.length) this.shift_start = null;

              this.last_selected = id;
            };

            /**
             * onmouseup-handler of message list row
             */
            rcube_list_widget.prototype.click_row = function(e, id) {
              // don't do anything (another action processed before)
              if (!this.is_event_target(e)) return true;

              var m = rcube_event.get_mouse_pos(e), pos = $('#mailview-left-panel')
                  .position();
              var pos_left = pos.left + 272;
              // Select or open message
              var clicked = m.x - pos_left > 50;

              // unselects currently selected row
              if (clicked) {
                this.highlight_row(id, false);
                this.multi_selecting = false;
                window.clearTimeout(window.show_timer);
                window.storePosition.topCoordinate = $(window).scrollTop();
                window.previous_page = 'page_mail_list';

                this.clear_selection();

                window.current_uid = id;
                this.last_selected = id;

                // Passer le message en lu
                rcmail.set_message(id, 'unread', false);

                if (id && rcmail.env.mailbox == rcmail.env.drafts_mailbox)
                  rcmail.open_compose_step({
                    _draft_uid : id,
                    _mbox : rcmail.env.mailbox
                  });
                else
                  rcmail.show_message_mobile(id, {});
              }
              else {
                if (!this.selection.length) {
                  delete rcmail.env.uid;
                }
                this.highlight_row(id, true);
                this.multi_selecting = true;

                // Multi-message commands
                rcmail
                    .enable_command('delete', 'move', 'copy', 'mark', 'reply', 'forward', this.selection.length > 0);

                if (this.selection.length) {
                  $('.jqm-mail-header').hide();
                  $('.jqm-mail-buttons-header').show();
                  if (this.selection.length > 1) {
                    $('.jqm-mail-buttons-header .reply').hide();
                    $('.jqm-mail-buttons-header .forward').hide();
                    $('.jqm-mail-more-buttons-header .filterlink').hide();
                    $('.jqm-mail-more-buttons-header .reply-all').hide();
                  }
                  else {
                    $('.jqm-mail-buttons-header .reply').show();
                    $('.jqm-mail-buttons-header .forward').show();
                    $('.jqm-mail-more-buttons-header .filterlink').show();
                    $('.jqm-mail-more-buttons-header .reply-all').show();
                  }
                }
                else {
                  $('.jqm-mail-header').show();
                  $('.jqm-mail-buttons-header').hide();
                  $('.jqm-mail-buttons-showmore')
                      .addClass('ui-icon-caret-down');
                  $('.jqm-mail-buttons-showmore')
                      .removeClass('ui-icon-caret-up');
                  $('.jqm-mail-more-buttons-header').hide();
                }
              }

              this.drag_start = false;
              this.in_selection_before = false;

              this.focus();

              return false;
            };
          }

        }
        // contact list
        if (rcmail.contact_list) {
          var p = window.rcmail;
          rcmail.contact_list.addEventListener('click', function(o) {
            window.previous_page = 'page_addressbook_list';
            window.storePosition.topCoordinate = $(window).scrollTop();
            p.contactlist_select_mobile(o);
          }).addEventListener('dragstart', function(o) {
            return false;
          }).addEventListener('dragmove', function(e) {
            return false;
          }).addEventListener('dragend', function(e) {
            return false;
          });
        }
      });
  rcmail.addEventListener('responseafterlist', function(evt) {
    window.current_page_scroll = rcmail.env.current_page + 1;
    rcmail.env.current_page = 1;
    rcmail.http_post('mobile.set_current_page', {});
  });
}

// Resources selection
rcube_webmail.prototype.http_request_mobile = function(action, query, lock,
    success_callback, error_callback) {
  var url = this.url(action, query);
  var ref = this;

  // trigger plugin hook
  var result = this.triggerEvent('request' + action, query);

  if (result !== undefined) {
    // abort if one the handlers returned false
    if (result === false)
      return false;
    else
      url = this.url(action, result);
  }

  url += '&_remote=1';

  // send request
  this.log('HTTP GET: ' + url);

  // reset keep-alive interval
  this.start_keepalive();

  return $.ajax({
    type : 'GET',
    url : url,
    data : {
      _unlock : (lock ? lock : 0)
    },
    dataType : 'json',
    success : function(data) {
      ref.http_response(data);
      success_callback();
    },
    error : function(o, status, err) {
      ref.http_error(o, status, err, lock, action);
      error_callback();
    }
  });
};

rcube_webmail.prototype.delete_contact_mobile = function() {
  if (rcmail.env.readonly || !confirm(rcmail.get_label('deletecontactconfirm')))
    return;

  var label = 'contactdeleting', action = 'delete';
  post_data = {};
  post_data._source = rcmail.env.source;
  post_data._from = rcmail.env.action;
  post_data._cid = rcmail.env.cid;

  lock = rcmail.display_message(rcmail.get_label(label), 'loading');

  if (rcmail.env.group) post_data._gid = rcmail.env.group;

  // also send search request to get the right records from the next page
  if (rcmail.env.search_request) post_data._search = rcmail.env.search_request;

  // send request to server
  rcmail.http_post(action, post_data, lock)

  window.location = '?_task=' + rcmail.env.task + '&_source='
      + rcmail.env.source;
  return true;
};

rcube_webmail.prototype.msglist_dbl_click_mobile = function(list) {
  if (this.preview_timer) clearTimeout(this.preview_timer);
  if (this.preview_read_timer) clearTimeout(this.preview_read_timer);

  var uid = list.get_single_selection();
  list.clear_selection();

  window.current_uid = uid;

  // Passer le message en lu
  this.set_message(uid, 'unread', false);

  if (uid && this.env.mailbox == this.env.drafts_mailbox)
    this.open_compose_step({
      _draft_uid : uid,
      _mbox : this.env.mailbox
    });
  else if (uid) this.show_message_mobile(uid, {});
};

rcube_webmail.prototype.show_message_mobile = function(id, params) {
  if (!id) return;

  // Ajout de la class selected
  $('#messagelist li').removeClass('selected');
  $('#messagelist li#rcmrow' + id).addClass('selected');

  var win, target = window, action = 'show', url = '&_action=' + action
      + '&_uid=' + id + '&_mbox=' + urlencode(this.env.mailbox);

  // also send search request to get the right messages
  if (this.env.search_request) url += '&_search=' + this.env.search_request;

  // add browser capabilities, so we can properly handle attachments
  url += '&_caps=' + urlencode(this.browser_capabilities());

  if (this.env.extwin) url += '&_extwin=1';

  $.mobile.pageContainer
      .pagecontainer("change", this.env.comm_path + url, params);
};

rcube_webmail.prototype.contactlist_select_mobile = function(list) {
  if (this.preview_timer) clearTimeout(this.preview_timer);

  var n, id, sid, contact, ref = this, writable = false, source = this.env.source ? this.env.address_sources[this.env.source]
      : null;

  // we don't have dblclick handler here, so use 200 instead of
  // this.dblclick_time
  if (id = list.get_single_selection()) ref.load_contact_mobile(id, 'show');

  window.current_uid = id;

  // if a group is currently selected, and there is at least one contact
  // selected
  // thend we can enable the group-remove-selected command
  this.enable_command('group-remove-selected', this.env.group
      && list.selection.length > 0 && writable);
  this.enable_command('compose', this.env.group || list.selection.length > 0);
  this.enable_command('export-selected', 'copy', list.selection.length > 0);
  this.enable_command('edit', id && writable);
  this.enable_command('delete', 'move', list.selection.length > 0 && writable);

  return false;
};

// load contact record
rcube_webmail.prototype.load_contact_mobile = function(cid, action, framed) {
  var win, url = "", target = window, rec = this.contact_list ? this.contact_list.data[cid]
      : null;

  if (action && (cid || action == 'add') && !this.drag_active) {

    // Ajout de la class selected
    $('#contacts-table tr').removeClass('selected');
    $('#contacts-table tr#rcmrow' + cid).addClass('selected');

    url = '&_action=' + action;

    // also send search request to get the right messages
    if (this.env.search_request) url += '&_search=' + this.env.search_request;

    url += '&_source=' + this.env.source;
    url += '&_cid=' + cid;

    $.mobile.pageContainer
        .pagecontainer("change", this.env.comm_path + url, {});
  }

  return true;
};

// Managesieve add rule
rcube_webmail.prototype.managesieve_add = function() {
  alert('managesieve_add');
  this.load_managesieveframe();
  this.filters_list.clear_selection();
};

// load filter frame
rcube_webmail.prototype.load_managesieveframe = function(id) {
  var has_id = typeof (id) != 'undefined' && id != null;
  this
      .enable_command('plugin.managesieve-act', 'plugin.managesieve-del', has_id);
  var msgid = this.set_busy(true, 'loading');

  $.mobile.pageContainer.pagecontainer("change", this.env.comm_path
      + '&_action=plugin.managesieve-action&_framed=1'
      + (has_id ? '&_fid=' + id : '') + '&_unlock=' + msgid, {});
};

function show_uploadform() {
  var $dialog = $('#upload-dialog');

  // close the dialog
  if ($dialog.is(':visible')) {
    $dialog.dialog('close');
    return;
  }

  // add icons to clone file input field
  if (rcmail.env.action == 'compose' && !$dialog.data('extended')) {
    $('<a>').addClass('iconlink add').attr('href', '#add').html('Add')
        .appendTo($('input[type="file"]', $dialog).parent())
        .click(add_uploadfile);
    $dialog.data('extended', true);
  }

  $dialog.dialog({
    modal : true,
    resizable : false,
    closeOnEscape : true,
    title : $dialog.attr('title'),
    close : function() {
      try {
        $('#upload-dialog form').get(0).reset();
      }
      catch (e) {
      } // ignore errors

      $dialog.dialog('destroy').hide();
      $('div.addline', $dialog).remove();
    },
    width : 480
  }).show();

  if (!document.all) $('input[type=file]', $dialog).first().click();
}

function add_uploadfile(e) {
  var div = $(this).parent();
  var clone = div.clone().addClass('addline').insertAfter(div);
  clone.children('.iconlink').click(add_uploadfile);
  clone.children('input').val('');

  if (!document.all) $('input[type=file]', clone).click();
}

var compose_headers = {};

/**
 * 
 */
function show_header_row(which, updated) {
  var row = $('#compose-' + which);
  if (row.is(':visible')) return; // nothing to be done here

  if (compose_headers[which] && !updated)
    $('#_' + which).val(compose_headers[which]);

  row.show();
  $('#' + which + '-link').hide();
  return false;
}

/**
 * 
 */
function hide_header_row(which) {
  // copy and clear field value
  var field = $('#_' + which);
  compose_headers[which] = field.val();
  field.val('');

  $('#compose-' + which).hide();
  $('#' + which + '-link').show();
  return false;
}

// Toggle to full screen
function toggleFullScreen() {
  var doc = window.document;
  var docEl = doc.documentElement;

  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen
      || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen
      || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.mozFullScreenElement
      && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
    setTimeout(function() {
      window.scrollTo(0, 1)
    }, 100);
  }
  else {
    cancelFullScreen.call(doc);
  }
}
