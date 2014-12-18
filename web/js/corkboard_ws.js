//Inserts HTML line breaks before all newlines in a string
		function nl2br(str, is_xhtml) {
			var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
			return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
		}

// Define all types of messages
(function () {
	var maxId = 8;
	window.Corkboard = {		
		socket : null,
  
		// Initialisation
		initialize : function(socketURL) {
			this.socket = io.connect(socketURL);

			//Process any incoming messages
			this.socket.on('updateMsg', this.add);
			
			//Clear message
			this.socket.on('clearMsg', this.clear);
			
			//Fetch all notepapers from db
			this.socket.emit('fetchAllNotepapers', {});
		},
		
		// Adds a new message
		add : function(data) {
			
			var id, type, msgId, bgcolor, notepaperInner = [], emptyString = "", youtubeMatch = null;
			
			for(var i=0 ; notepaper = data[i] ; i++){
			
			id = parseInt(notepaper.id);
			if(!id){
				break;
			}
			
			type = parseInt(notepaper.type);
			bgcolor = String(notepaper.bgcolor);
			
			msgId = parseInt(notepaper.msgId);

			// Check id
			if(id > maxId && id <= 0){
				return false;
			}
			
			// Check background color
			if(!bgcolor || bgcolor == 'null' || bgcolor == 'undefined'){
				bgcolor = '#FFFFFF';
			}

			// Check message Id
			console.log('[DEBUG] ' + 'msgId: ' + bgcolor);
			if(!msgId || isNaN(msgId)){
				return false;
			}
			// Bug: cannot replace \\n by \<br>
			//content.content = content.content.replace('\n','<br>');'
			
			// Prepare container
			if($('#note-'+id+' div#msg-'+msgId).length <= 0){
				$('#note-'+id+' div#msg-'+msgId).remove();
				$('#note-'+id).append('<div class="content-container" id="msg-' + msgId + '" bgcolor="' + bgcolor + ' " msgType="' + type + '"></div>');
			}
			
			notepaperInner.push('<div class="text">'+( nl2br(notepaper.content) || emptyString) +'</div>');
			
			if(type==1){
				
				
			} else if(type==3){
				notepaperInner.push('<div id="album-1" class="album">');
				notepaperInner.push('<ul>');
				
				if(notepaper.img){
				
					if(typeof(notepaper.img) == "string"){
						notepaper.img = JSON.parse(notepaper.img);
					}
				
					var galleryLength = notepaper.img.length;
					for(var j = 0; j < galleryLength; j++){
						notepaperInner.push('<li>');
						notepaperInner.push('<div id="album-1-1">');
						notepaperInner.push('<img class="notepaper-img" src="'+ base_url +'uploads/resized/'+ notepaper.img[j] +'">');
						notepaperInner.push('</div>');
						notepaperInner.push('</li>');
					}
				}
				notepaperInner.push('</ul>');
				notepaperInner.push('</div>');
			   
			   
			} else if(type==4){
				
				notepaperInner.push('<div class="notepaper-youtube">');
				youtubeMatch = notepaper.url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
				if(youtubeMatch){
					var videoId = youtubeMatch[1];
					var iframeId = 'ytplayer-'+ msgId;
					notepaperInner.push('<iframe id="'+ iframeId + '" class="ytplayers" type="text/html" src="http://www.youtube.com/embed/'+videoId+'?autoplay=1&controls=0&rel=0&showinfo=0&theme=light&enablejsapi=1" frameborder="0" allowfullscreen></iframe>');                  
					notepaperInner.push('</div>');
				}else{
					notepaperInner.push('<div class="boardLinkPreview">');
					if(notepaper.url_thumbnail){
						notepaperInner.push('<div class="thumbnailHolder">');
						notepaperInner.push('<img class="boardUrlThumbnail" src="'+ base_url +'uploads/webScreenShot/' + notepaper.url_thumbnail+'">');
						notepaperInner.push('</div>');
					}
					notepaperInner.push('<div class="urlTitle"><h5><a target="_blank" href="'+notepaper.url+'">'+notepaper.url_title+'</a></h5></div>');
					notepaperInner.push('<div class="urlDescription">'+ (notepaper.url_summary || emptyString) +'</div>');
					notepaperInner.push('</div>');
					notepaperInner.push('</div>');
				}
				
			} else if(type==5){
				
				notepaperInner.push('<video id="video_'+msgId+'" class="notepaper-video" loop muted controls>');
				notepaperInner.push('<source src="'+ base_url +'uploads/video/'+notepaper.video+'" type="video/mp4">');
				notepaperInner.push('</video>');
				
			} else { // the message is expired or deleted
				//notepaperInner.push('<img class="notepaper-qrCode" src="'+ base_url +'img/qrcode/' + qrUrls[notepaper.id] + '">');
			}
			
			if( $('#note-'+id).hasClass("note-hidden") ){
				$('#note-'+id).removeClass("note-hidden");
			}
			
			var targetNote = $('#note-'+id).find('#msg-'+msgId);
			targetNote.html(notepaperInner.join(''));
			targetNote.attr('bgcolor', bgcolor);
			targetNote.attr('msgType', type);
			
			$('#note-'+id).css('background-color', bgcolor);
			
			if(notepaper.content.length < 12){
				$('#note-'+id).find('#msg-'+msgId).children('div.text').css("font-size", "26px");
			}
			else if(notepaper.content.length >= 12 && notepaper.content.length < 16 ) {
				$('#note-'+id).find('#msg-'+msgId).children('div.text').css("font-size", "20px");
			}
			else {
				$('#note-'+id).find('#msg-'+msgId).children('div.text').css("font-size", "16px");
			}
			
			notepaperInner = [];

			}	// End of for-loop
		},
		
		clear : function(notepaper){
			//$('#note-'+notepaper.id).fadeOut("slow");
			$('#note-'+notepaper.id).find('.content-container#msg-'+notepaper.msgId).html("");
			$('#note-'+notepaper.id).find('.content-container#msg-'+notepaper.msgId).remove();
			if( $('#note-'+notepaper.id).children('.content-container').length == 0){
				$('#note-'+notepaper.id).addClass("note-hidden");
			} else {
				var bgcolor = $('#note-'+notepaper.id).children('div.content-container').first().attr('bgcolor');
				$('#note-'+notepaper.id).children('div.content-container').first().animate({opacity: 1.0}, 800);
				$('#note-'+notepaper.id).css('background-color', bgcolor);
			}
		}
		
	};
}());

Corkboard.initialize(base_url);
  	      	
			//load youtube iframe api
			/*
			var tag = document.createElement('script');
			tag.src = "http://www.youtube.com/player_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

			//object to hold all youtube players on the page
			var players = {};
			*/
			
			/*
			function onYouTubePlayerAPIReady() {
			$(document).ready(function() { 
    
				$('iframe').each(function(event) {
                
					var iframeID = $(this).attr('id');
        
					players[iframeID] = new YT.Player(iframeID);
        
				});
    
			}); 
			}
			*/
			
            $( document ).ready(function() {
                $(".album ul li:first-child").animate({opacity: 1.0}, 800);
                $(".album ul li:not(:first-child)").animate({opacity: 0.0}, 800);
				
				// Gallery animation
                setInterval(function() {
					$('.album ul').each(function(){
							var firstLi = $(this).children('li').first().detach(); // Remove the first element
							$(this).append(firstLi); // Add it back to the end
							$(this).children('li:first-child').animate({opacity: 1.0}, 800);
							$(this).children('li:not(:first-child)').animate({opacity: 0.0}, 800);
						}
					);
                }, 2000);
                
				// QR code
				var QRHeight = $('#note-9').height();
				
				new QRCode(document.getElementById("qrcode"), {
					text: base_url+"message/create",
					width: QRHeight,
					height: QRHeight,
					colorDark : "#000000",
					colorLight : "#ffffff",
					correctLevel : QRCode.CorrectLevel.H
				});
				
				$.ajax({
					type: "POST",
					url: "http://54.251.51.226/display/postDisplayAddr.php",
					data: {address: base_url+"message/create"},
					success: function(){
						console.log("success");
					}
				});
				
				// Time-sharing messages animation
                setInterval(function() {
					$('.note').each(function(){
						if( $(this).children('.content-container').length > 1){ //more than one message
							var firstMsg = $(this).children('div.content-container').first(); // Remove the first element
							console.log("message type:"+ firstMsg.attr('msgType'));
							
							firstMsg = firstMsg.detach();
							$(this).append(firstMsg); // Add it back to the end	
							//var secondMsg = $(this).children('div.content-container').first();
							//console.log("second type:"+ secondMsg.attr('msgType'));
							var bgcolor = $(this).children('div.content-container').first().attr('bgcolor');
							//console.log("bgcolor: " + bgcolor);
							if(!bgcolor){ bgcolor = '#FFFFFF'; }
							$(this).children('div.content-container:nth-child(2)').animate({opacity: 1.0}, 800);
							//$(this).children('div.content-container:first-child').animate({opacity: 1.0}, 800);
							$(this).css('background-color', bgcolor);
							$(this).children('div.content-container:not(:nth-child(2))').css('opacity', 0.0);	
							//$(this).children('div.content-container:not(:first-child)').css('opacity', 0.0);	
						}
						else {//only one message
							
						}
					}
					);
                }, 6000);
				
				
            });
