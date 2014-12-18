// Define all types of messages
(function () {
	var maxId = 8;
	window.Create = {		
		socket : null,
  
		// Initialisation
		initialize : function(socketURL) {
			this.socket = io.connect(socketURL);

			//send out message when type change
			$( "#type" ).on("change", function() {
				Create.updateMsg();
				return false;
			});	
			
			//save message to mysql db
			$('#saveBtn').click(function(){
				
				localStorage.setItem('allMessage', JSON.stringify(allMessage));
				var text = $('#textContent').val();
				
				//localStorage.setItem('text', text);
				var type = $('#type').val();
				//localStorage.setItem('type', type);
				
        		Create.saveMsg();
				return false;
    		});
			
			//when the user choose a particular position in #positionModal
			$('#positionModal .note-thumb').click(function(){
				if( $(this).attr('class') != "note-thumb" ){
					alert('The notepaper is already occupied.');
					return false;
				}
				var newNotepaperId = $(this).attr('position');
				var oldNotepaperId = $('#notepaperId').val();
				var messageId = $('#messageId').val();
				console.log("msg: " + messageId);
				Create.changePosition({newNotepaperId: newNotepaperId, oldNotepaperId: oldNotepaperId, messageId: messageId});
				return false;
			});
			
			//when the user choose a particular position in #fetchModal
			$('#fetchModal .note-thumb').click(function(){
				console.log("#fetchModal .note-thumb");
				
				return false;
			});
				
			//Process result of changePositionSuccess
			this.socket.on('changePositionSuccess', this.changePositionSuccess);
			this.socket.on('changePositionFail', this.changePositionFail);
			
			//Process incoming notepaper
			this.socket.on('occupyNotepaperResult', this.occupyNotepaperResult);
			
			//Process url scraper result
			this.socket.on('scrapeUrlResult', this.scrapeUrlResult);
			
			//Process query result
			this.socket.on('queryPositionsHandler', this.queryPositionsHandler);
			
			//Process query result
			this.socket.on('queryPositionsHandler', this.queryPositionsHandler);
			
			//Check whether the user has been occupied a notepaper before
			//var notepaperId = localStorage.getItem('notepaperId');
			//var messageId = localStorage.getItem('messageId');
			
			if(message.notepaperId==null || message.messageId==null){ //fetch a empty notepaper from server
				this.occupyNotepaper();
			}
			else { //use the original notepaper
				$('#notepaperId').val(message.notepaperId);
				$('#messageId').val(message.messageId);
			}
		},
		
		// Sends a message to the server
		updateMsg : function() {
			var msg = {};
			msg.id = parseInt($('#notepaperId').val());
			msg.type = parseInt($('#type').val());
			msg.content = $('#textContent').val();
			msg.msgId = parseInt($('#messageId').val());
			msg.bgcolor = message.bgcolor;
			//console.log('update '+content);
			
			var url = $('#url').val();
			console.log(url);
			var url_title = $('#urlTitle').val();
			var url_summary = $('#urlSummary').val();
			var url_thumbnail = $('#urlThumbnail').val();
			var img = message.img;
			var video = message.video;
			//var img = JSON.parse(localStorage.getItem('img'));
			//var video = JSON.parse(localStorage.getItem('video'));
			
			// Check id
			if(msg.id < maxId && msg.id <= 0){
				return false;
			}
			// Prepare the content
			if(msg.type==1){
				// Send msg
				this.socket.emit('updateMsg', [msg]);
			}
			else if(msg.type==3){ //Gallery
				msg.img = img;
				// Send msg
				this.socket.emit('updateMsg', [msg]);
			} else if(msg.type==4){ //Url
				msg.url = url;
				msg.url_title = url_title;
				msg.url_summary = url_summary;
				msg.url_thumbnail = url_thumbnail;
				// Send msg
				this.socket.emit('updateMsg', [msg]);
			} else if(msg.type==5){ //Video
				msg.video = video;
				// Send msg
				this.socket.emit('updateMsg', [msg]);
			} else {
				console.log('Invalid type');
				return false;
			}
			
			
			return false;
		},
		
		//save message to mysql db
		saveMsg : function() {
			var msg = {};
			msg.id = parseInt($('#notepaperId').val());
			msg.type = parseInt($('#type').val());
			msg.content = $('#textContent').val();
			msg.msgId = parseInt($('#messageId').val());
			msg.bgcolor = $('#colors-holder > .color-thumb-container > .active').attr('value');
			//console.log('update '+content);
			
			var url = $('#url').val();
			var url_title = $('#urlTitle').val();
			var url_summary = $('#urlSummary').val();
			var url_thumbnail = $('#urlThumbnail').val();
			var img = message.img;
			var video = message.video;
			//var img = JSON.parse(localStorage.getItem('img'));
			//var video = JSON.parse(localStorage.getItem('video'));
			
			// Check id
			if(msg.id < maxId && msg.id <= 0){
				return false;
			}
			// Prepare the content
			if(msg.type==1){
			
			}
			else if(msg.type==3){ //Gallery
				msg.img = img;
			} else if(msg.type==4){ //Url
				msg.url = url;
				msg.url_title = url_title;
				msg.url_summary = url_summary;
				msg.url_thumbnail = url_thumbnail;
			} else if(msg.type==5){ //Video
				msg.video = video;
			} else {
				console.log('Invalid type');
				return false;
			}
			//send save message
			this.socket.emit('saveMsg', {
				id: msg.id,
				type: msg.type,
				content: JSON.stringify(msg)
			});
			
			return false;
		},
		
		//save message to mysql db
		delMsg : function(msg) {			
			//send save message
			this.socket.emit('delMsg', msg);
			
			return false;
		},
		
		//Ask the server side to scrape the url
		scrapeUrl: function(url) {
			this.socket.emit('scrapeUrl', url);
		},
		
		scrapeUrlResult: function(url) {
			if(url.title || url.summary){ //if the website exists
				
				$('#url').val(url.url);
				$('#urlTitle').val(url.title);
				$('#urlSummary').val(url.summary);
				$('#urlThumbnail').val(url.thumbnail);
				
				message.url = url.url;
				message.url_title = url.title;
				message.url_summary = url.summary;
				message.url_thumbnail = url.thumbnail;
				
				message.type = "4";
				localStorage.setItem('allMessage', JSON.stringify(allMessage));
				
				//append the information to the link preview div
				var holder = $("#linkPreview");
				holder.empty();	
				holder.append('<button class="btn btn-link removeYoutube">&times;</button>');
				if(url.thumbnail && url.youtube == 1){
					holder.append('<div class="thumbnailHolder"><img class="urlThumbnail" src="'+ url.thumbnail +'" /></div>');
				}
				else if (url.thumbnail && url.youtube == 0){
					holder.append('<div class="thumbnailHolder"><img class="urlThumbnail" src="'+ base_url +'uploads/webScreenShot/' + url.thumbnail +'" /></div>');
				}
				
				holder.append('<div class="urlTitle"><h5><a target="_blank" href="'+ url.url +'">' + url.title + '</a></h5></div>');
				if(url.summary){
					holder.append('<div class="urlDescription">'+url.summary+'</div>');
				}
				// Update UI
				$('#linkPreview').css('padding','2%');
				$('#linkPreview').css('border','1px solid #CCCCCC');
				// Change option
				$('#type').val("4").attr('selected', true).siblings('option').removeAttr('selected');
				$('#type').selectmenu("refresh", true);
				console.log("scrape");
				Create.updateMsg();
			}
		},
		
		occupyNotepaper: function() {
			this.socket.emit('occupyNotepaper', {});
		},
		
		occupyNotepaperResult: function(notepaper) {
			$('#notepaperId').val(notepaper.notepaperId);
			message.notepaperId = notepaper.notepaperId;
			//initialize notepaper selection
			$('div.note-thumb').each(function() {
				$(this).removeClass('owned');
			});
			$('div.note-thumb[position=\'' + notepaper.notepaperId + '\']').addClass('owned'); //indicate the current notepaper on setting
			
			message.messageId = notepaper.messageId;
			$('#messageId').val(notepaper.messageId);
						
			message.bgcolor = notepaper.bgcolor;
			$('div.color-thumb[value*="'+ message.bgcolor +'"]').addClass('active');
			
			localStorage.setItem('allMessage', JSON.stringify(allMessage));
			$("#textContent").prop("disabled", false);
			Create.updateMsg();
		},
		
		changePosition: function(data) {
			this.socket.emit('changePosition', data);
		},
		
		changePositionSuccess: function(notepaper) {
			var oldNotepaperId = $('#notepaperId').val();
			$('#notepaperId').val(notepaper.newNotepaperId);
			message.notepaperId = notepaper.newNotepaperId;
			localStorage.setItem('allMessage', JSON.stringify(allMessage));
			$( "#positionModal" ).popup( "close" );
			$('div.note-thumb[position=\'' + oldNotepaperId + '\']').removeClass('owned');
			$('div.note-thumb[position=\'' + notepaper.newNotepaperId + '\']').addClass('owned'); //indicate the current notepaper
			Create.updateMsg();
			//$('#positionModal').modal('hide')
		},
		
		changePositionFail: function(notepaper) {
			alert('The notepaper is already occupied.');
		},
		
		queryPositions: function(){
			this.socket.emit('queryPositions', {});
		},
		
		/*
		queryPositionsHandler: function(data){			
			if(data.notepapers && data.status == 'ok'){
				var notepaperId = $('#notepaperId').val();
				data.notepapers = JSON.parse(data.notepapers);
				$('div#positionModal div.note-thumb').addClass('occupied');
				$('div#positionModal div.note-thumb').html('<p>X</p>');
				for(var i = 0; i < data.notepapers.length; i++){
					$('div.note-thumb[position=\'' + data.notepapers[i].id + '\']').removeClass('occupied');
					$('div.note-thumb[position=\'' + data.notepapers[i].id + '\']').html('');
				}
				$('div.note-thumb[position=\'' + notepaperId + '\']').addClass('owned'); //indicate the current notepaper
				
			} else {
				console.log('[ERROR] Cannot query position of notepapers.');
			}
		}
		*/
	};
	this.message = message;
	this.allMessage = allMessage;
	console.log(JSON.stringify(allMessage));
}());