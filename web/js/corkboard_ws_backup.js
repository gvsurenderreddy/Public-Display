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
			
			if(type==1){
				notepaperInner.push('<div class="text">'+(notepaper.content || emptyString) +'</div>');
				
			} else if(type==3){
				notepaperInner.push('<div class="text">'+(notepaper.content || emptyString) +'</div>');
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
					notepaperInner.push('<iframe id="'+ iframeId + '" class="ytplayers playing" type="text/html" src="http://www.youtube.com/embed/'+videoId+'?autoplay=1&controls=0&rel=0&showinfo=0&theme=light&enablejsapi=1" frameborder="0" allowfullscreen></iframe>');                  
					notepaperInner.push('</div>');
				}else{
					notepaperInner.push('<div class="boardLinkPreview">');
					if(notepaper.url_thumbnail){
						notepaperInner.push('<div class="thumbnailHolder">');
						notepaperInner.push('<img class="boardUrlThumbnail" src="'+notepaper.url_thumbnail+'">');
						notepaperInner.push('</div>');
					}
					notepaperInner.push('<div class="urlTitle"><h5><a target="_blank" href="'+notepaper.url+'">'+notepaper.url_title+'</a></h5></div>');
					notepaperInner.push('<div class="urlDescription">'+ (notepaper.url_summary || emptyString) +'</div>');
					notepaperInner.push('</div>');
					notepaperInner.push('</div>');
				}
				notepaperInner.push('<div class="text">'+notepaper.content+'</div>');
				
			} else if(type==5){
				
				notepaperInner.push('<video class="notepaper-video" autoplay muted>');
				notepaperInner.push('<source src="'+ base_url +'uploads/video/'+notepaper.video+'" type="video/mp4">');                  
				notepaperInner.push('</video>');
				notepaperInner.push('<div class="text">'+ (notepaper.content || emptyString) +'</div>');
												
			} else { // the message is expired or deleted
				//notepaperInner.push('<img class="notepaper-qrCode" src="'+ base_url +'img/qrcode/' + qrUrls[notepaper.id] + '">');
			}
			
			var targetNote = $('#note-'+id).find('#msg-'+msgId);
			targetNote.html(notepaperInner.join(''));
			targetNote.attr('bgcolor', bgcolor);
			targetNote.attr('msgType', type);
			
			//if(!notepaper.bgcolor){ notepaper.bgcolor = '#FFF'; }
			$('#note-'+id).css('background-color',bgcolor);
			
			notepaperInner = [];
			
			if(youtubeMatch){
				console.log("fuck you");
				
				playersMethod[iframeId] = new Field(iframeId);
				playersMethod[iframeId].setId(iframeId);
				
				players[iframeId] = new YT.Player(iframeId, {
					events: { 'onStateChange': playersMethod[iframeId].onPlayerStateChange }
				});
				
				
			}
			
			
			}	// End of for-loop
		},
		
		clear : function(notepaper){
			$('#note-'+notepaper.id).find('.content-container#msg-'+notepaper.msgId).html("");
			$('#note-'+notepaper.id).find('.content-container#msg-'+notepaper.msgId).remove();
			//$('#note-'+notepaper.notepaperId).css('background-color','#FFF');
			
		}
		
	};
}());