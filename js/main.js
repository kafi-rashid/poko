// HEIGHT ADJUSTMENT
function adjustHeight() {
	$('.blur, .blur-wrapper').height(($('#notes-container').height()));
}

// CLEARING ALL NOTE
function clearNotes() {
	chrome.storage.local.clear(function() {
	    var error = chrome.runtime.lastError;
	    if (error) {
	        console.error(error);
	    }
	});
}

$(document).ready(function() {

	// TRIGGERING BUTTON
	$("#input_note").keyup(function(event) {
	    if (event.keyCode === 13) {
	        $("#add").click();
	    }
	});

	// CLEAR NOTES
	$('#clear').click(function() {
		$('.note').each(function() {
			$(this).hide();
			adjustHeight();
		});
		clearNotes();
	});

	// DATE AND TIME
	Date.prototype.monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
	var weekday = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
	Date.prototype.getMonthName = function() {
		return this.monthNames[this.getMonth()];
	};
	var d = new Date();
	$('#now-day').text( weekday[d.getDay()] );
	$('#now-date').text( d.getMonthName() + ' ' + d.getDate()  + ', ' + d.getFullYear() );

	// BOOKMARKS
	function process_bookmark(bookmarks) {
		String.prototype.trunc = String.prototype.trunc || function(n) {
			return (this.length > n) ? this.substr(0, n-1) + '...' : this;
		};
	    for (var i = 0; i < bookmarks.length; i++) {
	        var bookmark = bookmarks[i];
	        if (bookmark.url) {
	        	$('#bookmarks').append("<a href='"+bookmark.url+"'>"+ bookmark.title.trunc(15)+"</a>")
	        }
	    }
	}
	chrome.bookmarks.getChildren( '1', process_bookmark );

});

document.body.onload = function() {

	// INIT
	adjustHeight();

	// NOTES
	var notes_container = $('#notes').find('.note').parent().attr('id').toString();
	var gDataName = "gogo";
	var gData = {
		dataVersion: 3,
		villages: []
	};
	$('#add').click(function() {		
		if ($('#input_note').val().replace(/\s/g, '').length) {
			let d = new Date();
			let randval = Math.ceil(Math.random() * 999999);
			let time = new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3") + ' · ' + d.getMonthName() + ' ' + d.getDate()  + ', ' + d.getFullYear();
			let note = $('#input_note').val();
			gData.villages.push(
				{id: randval, time: time, name: note}
			);
			DB_save();
			$('#'+notes_container).append('<div class="note"><id id="'+ randval +'"></id><p>'+ note +'<p class="time">'+ time +'</p></p></div>');
			$('#input_note').val('').focus();
		}
		adjustHeight();
		delNote();
		$('#notes').scrollTop($('#notes')[0].scrollHeight);
	});
	function DB_setValue(name, value, callback) {
		var obj = {};
		obj[name] = value;
		chrome.storage.local.set(obj, function() {
			if(callback) callback();
		});
	}
	function DB_load(callback) {
		chrome.storage.local.get(gDataName, function(r) {
			if (isEmpty(r[gDataName])) {
				DB_setValue(gDataName, gData, callback);
			}
			else if (r[gDataName].dataVersion != gData.dataVersion) {
				DB_setValue(gDataName, gData, callback);
			}
			else {
				gData = r[gDataName];
				callback();
			}
		});
	}
	function DB_save(callback) {
		DB_setValue(gDataName, gData, function() {
			if(callback) callback();
		});
	}
	function DB_clear(callback) {
		chrome.storage.local.remove(gDataName, function() {
			if(callback) callback();
		});
	}
	function isEmpty(obj) {
		for(var prop in obj) {
			if(obj.hasOwnProperty(prop))
				return false;
		}
		return true;
	}
	DB_load(function() {
		for (var i = 0; i < gData.villages.length; i++) {
			$('#'+notes_container).append('<div class="note"><id id="'+ gData.villages[i].id +'"></id><p>'+ gData.villages[i].name +'<p class="time">'+ gData.villages[i].time + '</p></p></div>');
		}
		adjustHeight();
		delNote();
	});
	function delNote() {
		$('.note').click(function() {
			$(this).fadeOut('slow');
			setTimeout(function() {
				adjustHeight();
			}, 650);
			for (var i = 0; i < gData.villages.length; i++) {
				if (gData.villages[i].id === parseInt($(this).find('id').attr('id'))) {
					gData.villages.splice(i, 1);
				}
			}
			DB_save();
		});
	}
}