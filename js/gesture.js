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
