var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var im = require('imagemagick');
var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;
var sqlite3 = require("sqlite3").verbose();
var path = require('path')
var thumbler = require('video-thumb');
var request = require('request');
var cheerio = require("cheerio");
var webshot = require('webshot');

// Include the express body parser
app.configure(function () {
  app.use(express.bodyParser());
});

/*
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'public_display',
  charset  : 'utf8'
});
*/

//load sqlite3

//new create a new db
var noderoot = path.resolve(process.argv[1], '../');
var webroot = path.resolve(process.argv[1], '../../web');

var file = noderoot + "/corkboard.db";
var db = new sqlite3.Database(file);
 
db.serialize(function() {
  
  db.run("CREATE TABLE IF NOT EXISTS  message (id INTEGER PRIMARY KEY, type INTEGER, content TEXT, notepaper_id INTEGER, bgcolor TEXT, url TEXT, url_title TEXT, url_summary TEXT, url_thumbnail TEXT, video TEXT, img TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS  notepaper (id INTEGER PRIMARY KEY, occupied INTEGER, message_id INTEGER)");
  
});
 
server.listen(8888);

io.sockets.on('connection', function (socket) {
	socket.on('msg', function (data) {
		io.sockets.emit('msg', data);
	});
	
	//save message to sqlite db
	socket.on('saveMsg', function (data) {
		var msgId;
		console.log('[DEBUG] saveMessages');
	// Use the connection
	
		db.serialize(function() {
			db.run("INSERT INTO message (type, content, img, video, url, url_title, url_summary, url_thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [parseInt(data.type), data.content, data.img, data.video, data.url, data.url_title, data.url_summary, data.url_thumbnail], function(err, row) {
				if (err) throw err;
				//console.log("Last ID:" this.lastID);
				db.run("UPDATE notepaper SET occupied = 1, message_id = ? WHERE id = ?", [this.lastID, parseInt(data.id)], function(err, row) {
					if (err) throw err;
					console.log("Insert message record success!");
				});
			});	
		});
		
		//db.close();
	});
	
	//fetch all messages
	socket.on('fetchAllNotepapers', function (data) {
		console.log('[DEBUG] fetchAllNotepapers');
		
		
		db.serialize(function() {
			
			db.all("SELECT id AS msgId, content, type, notepaper_id AS id, bgcolor, img, video, url, url_title, url_summary, url_thumbnail FROM message ORDER BY id", function(err, row){	
				if (err) throw err;
				socket.emit('updateMsg', row);
				console.log('[DEBUG] fetchAllNotepapers success');
			});
		
		});
		
		//db.close();

	});
	
	//forward the message to the corkboard
	socket.on('updateMsg', function (data) {
		io.sockets.emit('updateMsg', data);
		//messages[data.msgId] = JSON.stringify(data);
		
		db.serialize(function() {
			db.run("UPDATE message SET type = ?, content = ?, notepaper_id = ?, bgcolor = ?, img = ?, video = ?, url = ?, url_title = ?, url_summary = ?, url_thumbnail = ? WHERE id = ?", [data[0].type, data[0].content, data[0].id, data[0].bgcolor, JSON.stringify(data[0].img), data[0].video, data[0].url, data[0].url_title, data[0].url_summary, data[0].url_thumbnail, data[0].msgId], function(err, row) {
				if (err) throw err;
				console.log("UPDATE message record success!");
			});
		});
		//db.close();
		
	});
	
	
	//scrape the information of an url
	
	socket.on('scrapeUrl', function (url) {
		var urlMatch = url.match(/(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/);
		
		var youtubeMatch = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
		
		var preview = {};
		
		if(youtubeMatch){
			console.log("youtube matched");
			var videoId = youtubeMatch[1];
			request('http://gdata.youtube.com/feeds/api/videos/'+videoId+'?v=2&alt=jsonc', function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var youtubeObject = JSON.parse(body);
					preview.thumbnail = youtubeObject.data.thumbnail.sqDefault;
					preview.title = youtubeObject.data.title;
					preview.summary = youtubeObject.data.description.substr(0, 50);
					//preview.duration = parseInt(youtubeObject.data.duration);
					preview.url = url;
					preview.youtube = 1;
					socket.emit('scrapeUrlResult', preview);
				}
			});
		}
		else if (urlMatch) {
			console.log("url matched "+ url);
			
			request({
				uri: url,
			}, function(error, response, body) {
				console.log("url fetched ");
				var $ = cheerio.load(body);
				var meta = $('meta');
				var keys = Object.keys(meta);
				var summary = null;
				var title = null;
				var thumbnail = null;
				var screenShotImgName = "url-" + Math.round(new Date().getTime() / 1000) + "-" + Math.floor(Math.random() * 2147483) + ".png";
				var screenShotFilePath = webroot + "/uploads/webScreenShot/" + screenShotImgName;
	
				keys.forEach(function(key){
				if (  meta[key].attribs && meta[key].attribs.property && meta[key].attribs.property === 'og:title') {
					title = meta[key].attribs.content;
				}
				});

				keys.forEach(function(key){
				if (  meta[key].attribs && meta[key].attribs.property && meta[key].attribs.property === 'og:description') {
					summary = meta[key].attribs.content;
				}
				});
				
				
				keys.forEach(function(key){
				if (  meta[key].attribs && meta[key].attribs.property && meta[key].attribs.property === 'og:image') {
					thumbnail = meta[key].attribs.content;
				}
				});
				
				
				webshot(url, screenShotFilePath, function(err) {
					thumbnail = screenShotImgName;
					console.log("Screenshot Success! Thumbnail path: "+ screenShotFilePath +"\n" + url);
					preview.title = (title) ? title : $('title').html();
					preview.summary = (summary) ? summary : $('meta[name=description]').attr("content");
					preview.thumbnail = (thumbnail) ? thumbnail : null;
					preview.url = url;
					preview.youtube = 0;
					socket.emit('scrapeUrlResult', preview);
					
				});
				
				
				
			});
			
		}
	});
	
	
	//client fetch empty notepaper
	socket.on('occupyNotepaper', function (data) {
		console.log('[DEBUG] emptyMessages');
		var msgId, notepaperId;
		
		db.serialize(function() {
			
			db.all("SELECT N.id, COUNT(M.id) AS numberOfMsg FROM notepaper N LEFT JOIN message M ON N.id = M.notepaper_id GROUP BY N.id ORDER BY numberOfMsg, N.id LIMIT 1", function(err, row){	
				if (err) throw err;
				notepaperId = row[0].id;
				console.log('notepaper_id: '+notepaperId);
				
				db.run("INSERT INTO message (type, notepaper_id) VALUES (1, ?)", notepaperId, function(err, row) {
					if (err) throw err;
					console.log("Insert message record success!");
					msgId = this.lastID;
					var bgcolorsCollection = ["#FFFFFF", "#FFF780", "#D5E4F5", "#CBFAFA", "#F8CDCD"];
					var bgcolor = bgcolorsCollection[Math.floor(Math.random()*5)];  //Assign a random bgcolor to the message
					socket.emit('occupyNotepaperResult', {notepaperId: notepaperId, messageId: msgId, bgcolor: bgcolor});
				});
				
			});
		
		});
		
	});
	
	socket.on('changePosition', function (data) {
		console.log('[DEBUG] changeposition '+data.newNotepaperId);

		// Occcupy another notepaper and release the original notepaper		
		
		db.serialize(function() {
			db.run("UPDATE message SET notepaper_id = ? WHERE id = ?", [parseInt(data.newNotepaperId), parseInt(data.messageId)], function(err, row) {
				if (err) socket.emit('changePositionFail', data);
				//signal the corkboard to clear the original notepaper
				io.sockets.emit('clearMsg', { id : parseInt(data.oldNotepaperId), msgId : parseInt(data.messageId) });
				socket.emit('changePositionSuccess', data);
			});
		});
		
	});
	
	//forward the message to the corkboard
	socket.on('delMsg', function (data) {
		console.log('delMsg: '+data.msgId);
		io.sockets.emit('clearMsg', data);
		db.serialize(function() {
			db.get("SELECT img, video FROM message WHERE id = ?", [data.msgId], function(err, row){
				if (err) throw err;

				//delete the corresponding images
				if(row['img']!=null && row['img']!=""){
					var img, thumbPath, resizedPath;
					var imgCollection = JSON.parse(row['img']);
					for(var i=0; img = imgCollection[i]; i++){
						thumbPath = webroot + "/uploads/thumbnail/" + img;
						resizedPath = webroot + "/uploads/resized/" + img;
						fs.unlink(thumbPath, function(err){
							if (err) throw err;
							console.log('successfully deleted thumbnail image');
						});
						fs.unlink(resizedPath, function(err){
							if (err) throw err;
							console.log('successfully deleted resized image');
						});
					}
				}

				//delete the corresponding video
				if(row['video']!=null && row['video']!=""){
					var videoPath = webroot + "/uploads/video/" + row['video'];
					var videoThumbnailPath = webroot + "/uploads/video/" + row['video'].replace('.mp4','.jpg');
					fs.unlink(videoPath, function(err){
						if (err) throw err;
						console.log('successfully deleted video');
					});
					fs.unlink(videoThumbnailPath, function(err){
						if (err) throw err;
						console.log('successfully deleted video thumbnail');
					});

				}

			});

			db.run("DELETE FROM message WHERE id = ?", data.msgId, function(err, row) {
				if (err) throw err;
			});

		});
	});
	
});


//app.use("/", express.static(__dirname + '../web/'));
app.use("/css/", express.static(webroot + '/css'));
app.use("/img/", express.static(webroot + '/img'));
app.use("/js/", express.static(webroot + '/js'));
app.use("/fonts/", express.static(webroot + '/fonts'));
app.use("/uploads/", express.static(webroot + '/uploads'));

// ----------------------------------extras


app.get('/', function (req, res) {	
    res.sendfile(webroot + '/index.html');
});


app.get('/message/create', function (req, res) {
    res.sendfile(webroot + '/create.html');
});

app.get('/admin', function (req, res) {
    res.sendfile(webroot + '/admin.html');
});

//***TO-DO: Handle messages with null expire date

// ----------------------------------uploads' logic

app.post('/upload/uploadgallery', function (req, res) {
	var objToJson = {};
    fs.readFile(req.files.messageImg.path, function (err, data) {	
		var rnd = Math.round(new Date().getTime() / 1000) + "-" + Math.floor(Math.random() * 2147)
		var imageName = rnd + req.files.messageImg.name;

		// If there's an error
		if(!imageName){
			console.log("There was an error");
			res.end();
		} else {
			var newPath = webroot + "/uploads/original/" + imageName;
			var thumbPath = webroot + "/uploads/thumbnail/" + imageName;
			var resizedPath = webroot + "/uploads/resized/" + imageName;
			objToJson.status = 'error';
			// write file to uploads/fullsize folder
			fs.writeFile(newPath, data, function (err) {
				// write file to uploads/thumbs folder
				
				im.resize({
					srcPath: newPath,
					dstPath: thumbPath,
					width: 128
				}, function(err, stdout, stderr){
					if (err) throw err;
					console.log('resized image to fit within 128x128px');
					/*
					objToJson.imageName = imageName;
					objToJson.status = 'ok';
					// return JSON response
					res.json(objToJson);
					*/
				});
				
				
				
				im.resize({
					srcPath: newPath,
					dstPath: resizedPath,
					width: 800
				}, function(err, stdout, stderr){
					if (err) throw err;
					console.log('resized image to fit within 538x538px');
					fs.unlink(newPath, function(err){
						if (err) throw err;
						console.log('successfully deleted original image');
					});
					objToJson.imageName = imageName;
					objToJson.status = 'ok';
					// return JSON response
					res.json(objToJson);
				});
				
				
			});
		}
	});
});


//upload canvas sketch

app.post('/upload/uploadsketch', function (req, res) {
	var objToJson = {};
	var imageName = Math.round(new Date().getTime() / 1000) + "-" + Math.floor(Math.random() * 2147483) + '.png'; //generate the filename for the image
	var newPath = webroot + "/uploads/original/" + imageName;
	var thumbPath = webroot + "/uploads/thumbnail/" + imageName;
	var resizedPath = webroot + "/uploads/resized/" + imageName;
	
	
	var imgData = req.body.imgData;
	var base64data = imgData.replace(/^data:image\/\w+;base64,/, "");// strip off the data: url prefix to get just the base64-encoded bytes
	var buf = new Buffer(base64data, 'base64');
	
	fs.writeFile(newPath, buf, function (err) {
				// write file to uploads/thumbs folder
				
				im.resize({
					srcPath: newPath,
					dstPath: thumbPath,
					width: 128
				}, function(err, stdout, stderr){
					if (err) throw err;
					console.log('resized image to fit within 128x128px');
					/*
					objToJson.imageName = imageName;
					objToJson.status = 'ok';
					// return JSON response
					res.json(objToJson);
					*/
				});
				
				
				
				im.resize({
					srcPath: newPath,
					dstPath: resizedPath,
					width: 800
				}, function(err, stdout, stderr){
					if (err) throw err;
					console.log('resized image to fit within 538x538px');
					fs.unlink(newPath, function(err){
						if (err) throw err;
						console.log('successfully deleted original image');
					});
					objToJson.imageName = imageName;
					objToJson.status = 'ok';
					// return JSON response
					res.json(objToJson);
				});
				
				
	});
			
});


// upload video

app.post('/upload/uploadVideo', function (req, res) {
	var objToJson = {};
	var videoName = Math.round(new Date().getTime() / 1000) + "-" + Math.floor(Math.random() * 2147483); //generate the filename for the image
	var filePath = webroot + "/uploads/video/";	//ffmpeg path
	
	fs.readFile(req.files.messageVideo.path, function (err, data) {
		if(err){
			objToJson.status = 'error'; //prepare JSON response
			objToJson.msg = err;
			res.json(objToJson);// return JSON response
			// return JSON response
		} else {
			var messageVideo = req.files.messageVideo.name;
			var extension = getExtension(messageVideo);
			objToJson.debug = req.files.messageVideo;
			
			if(extension == 'mp4' || extension == 'webm'){
				// write file to uploads/video folder
				fs.writeFile(filePath + videoName + '.' + extension, data, function (err) {
					if(err){
						objToJson.status = 'error';//prepare JSON response
						objToJson.msg = err;
						res.json(objToJson);// return JSON response
					}
					else {
						thumbler.extract(filePath + videoName + '.' + extension, filePath + videoName + '.jpg', '00:00:1', '200x125', function(){
							console.log('snapshot saved to '+ videoName +'.jpg (200x125) with a frame at 00:00:1');
							objToJson.status = 'ok'; //prepare JSON response
							objToJson.msg = videoName + '.' + extension;
							objToJson.thumbnail = videoName + '.jpg';
							res.json(objToJson);// return JSON response
						});
					}
				});		
			
			}
			else {
				objToJson.status = 'error'; //prepare JSON response
				objToJson.msg = 'Invalid file type';
				res.json(objToJson);// return JSON response
			}	
		}
		
		
	});	
});


function getExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i+1);
}


