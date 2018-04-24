// HEIGHT ADJUSTMENT
function adjustHeight() {
	$('#blur-wrapper').height($('#notes').height() + $('#add_note').height());
	$('.option-container').each(function() {
		if ($(this).height() > $(this).width()) {
			$(this).css('display', 'block');
			$(this).find('.options').css('margin-top', $(this).width() / 2 +'px');
		}
	});
}

$(document).ready(function() {

	adjustHeight();

	$('#input_note').focus(function() {
		$(this).attr('placeholder', 'Hit enter for check list or click on + for note after writing.');
	});
	$('#input_note').blur(function() {
		$(this).attr('placeholder', 'Write here...');
	});

	// CLEAR NOTES
	$('#clear').click(function() {
		chrome.storage.local.clear(function() {
		    var error = chrome.runtime.lastError;
		    if (error) console.error(error);
		});
		$('.note').each(function() {
			$(this).hide();
			adjustHeight();
		});
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
	        if (bookmark.url) $('#bookmarks').append("<a href='"+bookmark.url+"'>"+ bookmark.title.trunc(15)+"</a>")
	    }
	}
	chrome.bookmarks.getChildren( '1', process_bookmark );

	// ARCHIVE LIBRARY
	$('#archive').click(function() {
		$(this).hide();
		$('.dark-bg').fadeIn('fast');
	});
	$('#close, #content').click(function() {
		$('#archive').show();
		$('.dark-bg').fadeOut('fast');
	});

});

document.body.onload = function() {

	// INIT
	adjustHeight();
	var type = 'note';

	// TRIGGERING BUTTON
	$('#input_note').keyup(function(event) {
	    if (event.keyCode === 13) {
	    	type = 'list';
	    	$("#add").click();
	    }
	});

	// PROTOTYPES
	String.prototype.replaceArray = function(find, replace) {
		var replaceString = this;
		var regex; 
		for (var i = 0; i < find.length; i++) {
			regex = new RegExp(find[i], "g");
			replaceString = replaceString.replace(regex, replace[i]);
		}
		return replaceString;
	};
	var find = ["<", ">"];
	var replace = ["&lt;", "&gt;"];;

	// NOTES
	var gDataName = "gogo";
	var gData = {
		dataVersion: 3,
		villages: []
	};
	$(document).on('click', '#add', function(e) {
		if ($('#input_note').val().replace(/\s/g, '').length) {
			let d = new Date(), randval = Math.ceil(Math.random() * 999999), time = new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3") + ' · ' + d.getMonthName() + ' ' + d.getDate()  + ', ' + d.getFullYear(), note = $('#input_note').val().replaceArray(find, replace);
			gData.villages.push({ 
				id: randval, time: time, name: note, stat: 'init', type: type 
			});
			DB_save();
			if (type == 'note') {
				$('#notes').prepend('<div class="note new-note"><div class="option-container"><div class="options"><button class="option del">Delete</button><button class="option arc">Archive</button></div></div><id id="'+ randval +'"></id><i class="material-icons quote">format_quote</i><p>'+ note +'<p class="time">'+ time +'</p></p></div>');
			}
			else {
				$('#notes').prepend('<div class="note new-note"><div class="option-container"><div class="options"><button class="option del">Delete</button><button class="option chk">Check</button></div></div><id id="'+ randval +'"></id><p><i class="material-icons">check_box_outline_blank</i>'+ note +'</p></div>');
			}
			$('#input_note').val('').focus();
			setTimeout(function() {
				$('.new-note').css({
					'box-shadow': 'unset',
					'background-color': 'rgba(0, 0, 0, 0.4)'
				});
			}, 500);
		}
		adjustHeight();
		noteStat();
		type = 'note';
		$('#notes').scrollTop(0);
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
			if (isEmpty(r[gDataName])) DB_setValue(gDataName, gData, callback);
			else if (r[gDataName].dataVersion != gData.dataVersion) DB_setValue(gDataName, gData, callback);
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
			if(obj.hasOwnProperty(prop)) return false;
		}
		return true;
	}
	DB_load(function() {
		for (var i = 0; i < gData.villages.length; i++) {
			if (gData.villages[i].type.toString() == 'note') {
				if (gData.villages[i].stat.toString() != 'arc') $('#notes').prepend('<div class="note"><div class="option-container"><div class="options"><button class="option del">Delete</button><button class="option arc">Archive</button></div></div><id id="'+ gData.villages[i].id +'"></id><i class="material-icons quote">format_quote</i><p>'+ gData.villages[i].name +'<p class="time">'+ gData.villages[i].time + '</p></p></div>');
				else $('#archived-notes').prepend('<div class="note"><div class="option-container"><div class="options"><button class="option del">Delete</button><button class="option unarc">Unarchive</button></div></div><id id="'+ gData.villages[i].id +'"></id><i class="material-icons quote">format_quote</i><p>'+ gData.villages[i].name +'<p class="time">'+ gData.villages[i].time + '</p></p></div>');
			}
			else {
				if (gData.villages[i].stat.toString() != 'chk') $('#notes').prepend('<div class="note"><div class="option-container"><div class="options"><button class="option del">Delete</button><button class="option chk">Check</button></div></div><id id="'+ gData.villages[i].id +'"></id><p><i class="material-icons">check_box_outline_blank</i>'+ gData.villages[i].name +'</p></div>');
				else $('#notes').prepend('<div class="note"><div class="option-container"><div class="options"><button class="option del">Delete</button><button class="option unc">UncheCk</button></div></div><id id="'+ gData.villages[i].id +'"></id><p><i class="material-icons">check_box</i>'+ gData.villages[i].name +'</p></div>');
			}
		}
		adjustHeight();
		noteStat();
	});
	function noteStat() {
		// COPY 
		// $('.option-container').click(function() {
		// 	var $temp = $("<input>");
		// 	$("body").append($temp);
		// 	$temp.val($(this).closest('.note').find('p').not('.time').text().replace('check_box_outline_blank', '').replace('check_box', '')).select();
		// 	document.execCommand("copy");
		// 	$temp.remove();
		// });
		$(document).on('click', '.option', function(e) {
			let noteId = parseInt($(this).closest('.note').find('id').attr('id'));
			if ($(this).hasClass('del')) {
				$(this).html('Deleting').closest('.note').fadeOut('slow');
				setTimeout(function() {
					adjustHeight();
				}, 650);
				for (var i = 0; i < gData.villages.length; i++) {
					if (gData.villages[i].id === noteId) gData.villages.splice(i, 1);
				}
			}
			else if($(this).hasClass('arc')) {
				$(this).html('Unarchive').removeClass('arc');
				let spNote = $(this).closest('.note');
				for (var i = 0; i < gData.villages.length; i++) {
					if (gData.villages[i].id === noteId) gData.villages[i].stat = 'arc';
				}
				$(this).closest('.note').find('p').css({
					'text-decoration': 'line-through',
					'filter': 'blur(0)'
				});
				$(this).closest('.option-container').hide().delay(300);
				spNote.fadeOut(500);
				setTimeout(function() {
					adjustHeight();
				}, 550);
				$('#archived-notes').prepend('<div class="note"><div class="option-container"><div class="options"><button class="option del">Delete</button><button class="option unarc">Unarchive</button></div></div><id id="'+ parseInt(noteId) +'"></id><i class="material-icons quote">format_quote</i><p>'+ $(this).closest('.note').find('p').not('.time').text() +'<p class="time">'+ $(this).closest('.note').find('.time').text() + '</p></p></div>');
				$('#archive').addClass('bounceIn');
				setTimeout(function() {
					$('#archive').removeClass('bounceIn');
				}, 1000);
			}
			else if($(this).hasClass('chk')) {
				$(this).html('UncheCk').removeClass('chk').addClass('unc');
				for (var i = 0; i < gData.villages.length; i++) {
					if (gData.villages[i].id === noteId) gData.villages[i].stat = 'chk';
				}
				$(this).closest('.note').find('i').text('check_box');
			}
			else if($(this).hasClass('unc')) {
				$(this).html('Check').removeClass('unc').addClass('chk');
				for (var i = 0; i < gData.villages.length; i++) {
					if (gData.villages[i].id === noteId) gData.villages[i].stat = 'unc';
				}
				$(this).closest('.note').find('i').text('check_box_outline_blank');
			}
			else {
				for (var i = 0; i < gData.villages.length; i++) {
					if (gData.villages[i].id === noteId) {
						gData.villages[i].stat = 'init';
						$('#notes').prepend('<div class="note"><div class="option-container"><div class="options"><button class="option del">Delete</button><button class="option arc">Archive</button></div></div><id id="'+ gData.villages[i].id +'"></id><i class="material-icons quote">format_quote</i><p>'+ gData.villages[i].name +'<p class="time">'+ gData.villages[i].time + '</p></p></div>');
					}
				}
				$(this).closest('.note').hide();
				adjustHeight();
			}
			DB_save();
		});
	}

	$('body, #blur').css("background-image", "-webkit-linear-gradient(90deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), url('https://source.unsplash.com/collection/2013372/1920x1080')");

}