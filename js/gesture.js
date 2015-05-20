/**
 * Plugin Mobile for Roundcube
 *
 * Add new skin mobile to Roundcube
 * 
 * Javascript gesture file
 *
 * Copyright (C) 2015  PNE Annuaire et Messagerie/MEDDE
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author PNE Annuaire et Messagerie/MEDDE
 * @license GNU GPLv3+
 *
 */
var startX,
	startY,
	tap,
	swipePanelLeft,
	swipePanelRight,
	swipePage,
	swipeMessage,
	swipe_timer,
	tapTimer,
  isTapHold;

function getCoord(e, c) {
	return /touch/.test(e.type) ? (e.originalEvent || e).changedTouches[0]['page' + c] : e['page' + c];
}

function setTap() {
	tap = true;
	setTimeout(function () {
	    tap = false;
	}, 500);
}

function open_message_from_left_panel(uid) {
	if (uid != window.current_uid) {
		// Passer le message en lu
		rcmail.set_message(uid, 'unread', false);
		window.current_uid = uid;
		window.previous_page = 'current_page';
		storePosition.topCoordinate = $('#mail-list-left-panel').scrollTop();
		rcmail.show_message_mobile(window.current_uid, {});
	}
}

// Gestion du touch dans la liste des messages
$(document).on("touchstart", "#mail-list-left-panel #messagelist li", function(ev) {
	startX = getCoord(ev, 'X');
	startY = getCoord(ev, 'Y');	
}).on("touchend", "#mail-list-left-panel #messagelist li", function(ev) {
	// If movement is less than 20px, execute the handler
	if (Math.abs(getCoord(ev, 'X') - startX) < 20 && Math.abs(getCoord(ev, 'Y') - startY) < 20) {
	    // Prevent emulated mouse events
	    ev.preventDefault();
	    open_message_from_left_panel($(document.getElementById($(this).attr('id'))).data('uid'));
	}
	setTap();
}).on("click", "#mail-list-left-panel #messagelist li", function(ev) {
	if (!tap) {
	    // If handler was not called on touchend, call it on click;
		open_message_from_left_panel($(document.getElementById($(this).attr('id'))).data('uid'));
	}
	ev.preventDefault();
});

// Gestion des panels
$(document).on("touchstart", ".ui-content", function(ev) {
	startX = getCoord(ev, 'X');
	startY = getCoord(ev, 'Y');
	if (startX < 30 
			&& $('.ui-panel.ui-panel-position-left').length) {
		swipePanelLeft = true;
		swipePanelRight = false;
		swipePage = false;
	} else if (startX > ($(document).width() - 30) 
			&& $('.ui-panel.ui-panel-position-right').length) {
		swipePanelLeft = false;
		swipePanelRight = true;
		swipePage = false;
	}
})
.on("touchend", ".ui-content", function(ev) {
	if (Math.abs(getCoord(ev, 'Y') - startY) < 50 && Math.abs(getCoord(ev, 'X') - startX) > 50 && swipePanelLeft) {
		ev.preventDefault();		
		$('.ui-panel.ui-panel-position-left').panel('open');
		swipePanelLeft = false;
		swipePanelRight = false;
		swipePage = false;
	} else if (Math.abs(getCoord(ev, 'Y') - startY) < 50 && Math.abs(startX - getCoord(ev, 'X')) > 50 && swipePanelRight) {
		ev.preventDefault();		
		$('.ui-panel.ui-panel-position-right').panel('open');
		swipePanelLeft = false;
		swipePanelRight = false;
		swipePage = false;
	}
});

// Swipe entre les messages
$(document).on("touchstart", ".jqm-message .ui-content", function(ev) {
	startX = getCoord(ev, 'X');
	startY = getCoord(ev, 'Y');
	if (startX > 80
			&& startX < ($(document).width() - 80)) {
		swipePanelLeft = false;
		swipePanelRight = false;
		swipePage = true;
	}
})
.on("touchmove", ".jqm-message .ui-content", function(ev) {
	if (Math.abs(getCoord(ev, 'Y') - startY) > 80 && swipePage) {
		swipePage = false;
		$('.jqm-message').css({left: 0});
		$('#slide-message').hide();
		$('#slide-message').removeAttr('style');
	}
	else if (Math.abs(getCoord(ev, 'Y') - startY) < 80 && swipePage && Math.abs(getCoord(ev, 'X') - startX) > 20) {
		ev.preventDefault();
		if (!$('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).next().length
				&& startX > getCoord(ev, 'X')) {
			$('.jqm-message').css({left: 0});
			$('#slide-message').hide();
			$('#slide-message').removeAttr('style');
			return;
		}
		else if (!$('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).prev().length
				&& startX < getCoord(ev, 'X')) {
			$('.jqm-message').css({left: 0});
			$('#slide-message').hide();
			$('#slide-message').removeAttr('style');
			return;
		}
		$('#slide-message').removeAttr('style');
		// Affiche le message
		if (startX > getCoord(ev, 'X')) {
			$('#slide-message h2.subject').html($('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).next().find('span.subject').text());
			$('#slide-message table.headers-table-slide td.from span.adr').html($('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).next().find('span.from span.adr span').text());
			$('#slide-message table.headers-table-slide td.date').html($('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).next().find('span.date').text());
			$('#slide-message').css({right:  startX - getCoord(ev, 'X') - $(window).width()});			
		}
		else {
			$('#slide-message h2.subject').html($('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).prev().find('span.subject').text());
			$('#slide-message table.headers-table-slide td.from span.adr').html($('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).prev().find('span.from span.adr span').text());
			$('#slide-message table.headers-table-slide td.date').html($('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).prev().find('span.date').text());
			$('#slide-message').css({left:  getCoord(ev, 'X') - startX - $(window).width()});
		}
		$('#slide-message').show();
		$('.jqm-message').css({left: getCoord(ev, 'X') - startX});
		if (window.swipe_timer) {
			window.clearTimeout(window.swipe_timer);
		}
		window.swipe_timer = setTimeout(function() {			  				
			$('.jqm-message').css({left: 0});
			$('#slide-message').hide();
			$('#slide-message').removeAttr('style');
			swipePage = false;
		}, 2000);
	}
})
.on("touchend", ".jqm-message .ui-content", function(ev) {
	if (swipePage) {
		if (Math.abs(getCoord(ev, 'X') - startX) < $(window).width()/2) {
			$('.jqm-message').css({left: 0});
			$('#slide-message').hide();
			$('#slide-message').removeAttr('style');
		} else {
			if (!$('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).next().length
					&& startX > getCoord(ev, 'X')) {
				$('.jqm-message').css({left: 0});
				$('#slide-message').hide();
				$('#slide-message').removeAttr('style');
				return;
			}
			else if (!$('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).prev().length
					&& startX < getCoord(ev, 'X')) {
				$('.jqm-message').css({left: 0});
				$('#slide-message').hide();
				$('#slide-message').removeAttr('style');
				return;
			}
			$('.jqm-message').css({left: $(document).width()});
			//$('#slide-message').removeAttr('style');
			if (startX > getCoord(ev, 'X')) {
				$('#slide-message').css({right: 0});
				open_message_from_left_panel($('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).next().attr('id').replace('rcmrow', ''));
				
			}
			else if (startX < getCoord(ev, 'X')) {
				$('#slide-message').css({left: 0});
				open_message_from_left_panel($('#mail-list-left-panel #messagelist li#rcmrow' + window.current_uid).prev().attr('id').replace('rcmrow', ''));				
			}
		}
		ev.preventDefault();
	} else {
		$('.jqm-message').css({left: 0});
	}
});

// Swipe sur un message de la liste
$(document).on("touchstart", ".jqm-mail #messagelist li", function(ev) {
	startX = getCoord(ev, 'X');
	startY = getCoord(ev, 'Y');
	if (startX > 30
			&& startX < ($(document).width() - 30)) {
		swipePanelLeft = false;
		swipePanelRight = false;
		swipePage = false;
		swipeMessage = true;
	}
})
.on("touchmove", ".jqm-mail #messagelist li", function(ev) {
	var slide_delete = $(this).find('div.slide_to_delete');
	var slide_mark = $(this).find('div.slide_to_mark');
	if (Math.abs(getCoord(ev, 'Y') - startY) > 80 && swipeMessage) {
		swipeMessage = false;
		$(this).css({left: 0});
		slide_delete.remove();
		slide_mark.remove();
	}
	else if (Math.abs(getCoord(ev, 'Y') - startY) < 80 && swipeMessage && Math.abs(getCoord(ev, 'X') - startX) > 35) {
		if (!slide_delete.length
				&& getCoord(ev, 'X') - startX < 0) {
			$(this).append('<div class="slide_to_delete"></div>');
			var slide_delete = $(this).find('div.slide_to_delete');
		}
		else if (!slide_mark.length
				&& getCoord(ev, 'X') - startX > 0) {
			$(this).append('<div class="slide_to_mark"></div>');
			var slide_mark = $(this).find('div.slide_to_mark');
		}
		ev.preventDefault();		
		// Affiche le message
		if (getCoord(ev, 'X') - startX < 0) {
			if (!slide_mark.length) {
				slide_mark.remove();
			}
			slide_delete.css({width: startX - getCoord(ev, 'X') - 20, right: -(startX - getCoord(ev, 'X'))});
			$(this).css({left: getCoord(ev, 'X') - startX});
			if (Math.abs(getCoord(ev, 'X') - startX) > $(window).width()*1/2) {			
				slide_delete.html(rcmail.gettext('mobile.release to delete message'));
			}
			else {
				slide_delete.html(rcmail.gettext('mobile.slide to delete message'));
			}
		}
		else {
			if (!slide_delete.length) {
				slide_delete.remove();
			}
			slide_mark.css({width: getCoord(ev, 'X') - startX - 20, left: -(getCoord(ev, 'X') - startX)});
			$(this).css({left: getCoord(ev, 'X') - startX});
			if (Math.abs(getCoord(ev, 'X') - startX) > $(window).width()*1/3) {
				if ($(this).hasClass('unread')) {
					slide_mark.html(rcmail.gettext('mobile.release to mark as read'));
				}
				else {
					slide_mark.html(rcmail.gettext('mobile.release to mark as unread'));
				}
			}
			else {
				if ($(this).hasClass('unread')) {
					slide_mark.html(rcmail.gettext('mobile.slide to mark as read'));
				}
				else {
					slide_mark.html(rcmail.gettext('mobile.slide to mark as unread'));
				}
			}
		}
		
		if (window.swipe_timer) {
			window.clearTimeout(window.swipe_timer);
		}
		var _this = $(this);
		window.swipe_timer = setTimeout(function() {			  				
			var slide_delete = _this.find('div.slide_to_delete');
			slide_delete.remove();
			var slide_mark = _this.find('div.slide_to_mark');
			slide_mark.remove();
			_this.css({left: 0});
			swipeMessage = false;
		}, 800);
	}
})
.on("touchend", ".jqm-mail #messagelist li", function(ev) {
	var slide_delete = $(this).find('div.slide_to_delete');
	var slide_mark = $(this).find('div.slide_to_mark');
	if (swipeMessage) {
		swipeMessage = false;
		window.clearTimeout(window.swipe_timer);
		if (Math.abs(getCoord(ev, 'X') - startX) > $(window).width()*1/2 && slide_delete.length) {
			rcmail.message_list.clear_selection();
			rcmail.message_list.select($(this).attr('id').replace('rcmrow', ''));
			rcmail.delete_messages();				
			rcmail.message_list.clear_selection();
		} 
		else if (Math.abs(getCoord(ev, 'X') - startX) > $(window).width()*1/3 && slide_mark.length) {
			if ($(this).hasClass('unread')) {
				rcmail.mark_message('read', $(this).attr('id').replace('rcmrow', ''));
			}
			else {
				rcmail.mark_message('unread', $(this).attr('id').replace('rcmrow', ''));
			}
		}
		ev.preventDefault();
	}
	slide_mark.remove();
	slide_delete.remove();
	$(this).css({left: 0});
});
