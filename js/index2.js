var databaseName = "iPortogruaro";
var databaseAlias = "iportogruaro";
var version = "1.0";
var dbSize = 1000000;
var elem;
var currentCatId;
var currentParentId;
var selectedPoiId;
var currentPoi;
var poiList;
var markersArray = [];
var globalMap;
var infowindow = null;
var imageList = [];
var galleryImageList = [];
var myLat;
var myLong;
var map;
var directionDisplay;
var directionsService = new google.maps.DirectionsService();
var nameShare;
var descShare;
var linkShare;
var imagShare;
var keyword;

document.addEventListener("deviceready", onDeviceReady, false);

$.mobile.defaultPageTransition = 'none';

// Populate the database
//
function populateDB(tx) {

	 tx.executeSql('DROP TABLE IF EXISTS category;');
	 tx.executeSql('DROP TABLE IF EXISTS poi;');
	 tx.executeSql('DROP TABLE IF EXISTS poi_categories;');
	 tx.executeSql('DROP TABLE IF EXISTS poi_gallery;');
	 tx.executeSql('DROP TABLE IF EXISTS poi_custom;');
	 tx.executeSql('CREATE TABLE category (id INT NOT NULL, name VARCHAR(255) NOT NULL, parent INT NOT NULL, PRIMARY KEY (id));'); 
	 tx.executeSql('CREATE TABLE poi (id INT NOT NULL, name VARCHAR(255) NOT NULL, description TEXT NOT NULL, photo TEXT NULL, lat DOUBLE NULL, long DOUBLE NULL, address TEXT NULL, phone TEXT NULL, website TEXT NULL, mail TEXT NULL, sponsored INT NOT NULL, PRIMARY KEY (id));');
	 tx.executeSql('CREATE TABLE poi_categories (idpoi INT NOT NULL, idcategory INT NOT NULL);');
	 tx.executeSql('CREATE TABLE poi_gallery (idpoi INT NOT NULL, url TEXT NOT NULL);');
	 tx.executeSql('CREATE TABLE poi_custom (idpoi INT NOT NULL, name VARCHAR(255) NOT NULL, value TEXT NOT NULL, PRIMARY KEY (idpoi, name));');
	 
	// get json
	$.ajax({
		url : 'http://www.nerdforlife.it/iportogruaro/new-device/',
		async:   false,
		cache: false,
		success : function(data) {
			data = $.parseJSON(data);
			$.each(data.categories, function(index, element) {
				element.name = escape(element.name);
				tx.executeSql("INSERT INTO category (id, name, parent) VALUES (" + element.cat_id + ",'" + element.name + "', " + element.parent + ");");
				});
			$.each(data.pois, function(index, element) {
				element.title = escape(element.title);
				element.description = escape(element.description);
				element.address = escape(element.address);
				element.phone = escape(element.phone);
				element.website = escape(element.website);
				element.mail = escape(element.mail);
				element.sponsored = escape(element.sponsored);
				if(is_empty(element.sponsored)) {
					element.sponsored = 0;
				} else {
					element.sponsored = 1;
				}
				if(element.photo === null || element.photo === '' || typeof element.photo == 'undefined') {
					
				} else {
					var filename = element.poi_id + ".jpg";
					var sPath;
					window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function onFileSystemSuccess(fileSystem) {
						sPath = fileSystem.root.fullPath + '/android/data/com.pitersoft.iportogruaro/';
					});
					var galleryElement = {
							photo: element,
							filename: filename
					}
					imageList.push(galleryElement);
				}
				if(element.lat == "") { element.lat = 0; }
				if(element.lon == "") { element.lon = 0; }
				id = element.poi_id;
				tx.executeSql("INSERT INTO poi (id, name, description, photo, lat, long, address, phone, website, mail, sponsored) VALUES (" + element.poi_id + ",'" + element.title + "', '" + element.description + "', '"+sPath+filename+"', "+element.lat+", "+element.lon+", '"+element.address+"', '"+element.phone+"', '"+element.website+"', '"+element.mail+"', "+ element.sponsored + ");");
				$.each(element.gallery, function (index, element) {
					if(index > 9) {
						var filename = id + "_" + index + ".jpg";
					} else {
						var filename = id + "_0" + index + ".jpg";
					}
					var sPath;
					window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function onFileSystemSuccess(fileSystem) {
						sPath = fileSystem.root.fullPath + '/android/data/com.pitersoft.iportogruaro/';
					});
					var galleryElement = {
							photo: element,
							filename: filename
					}
					imageList.push(galleryElement);
					tx.executeSql("INSERT INTO poi_gallery (idpoi, url) VALUES ("+id+", '"+sPath+filename+"');");
					});
				$.each(element.others, function (index, element) {
					tx.executeSql("INSERT INTO poi_custom (idpoi, name, value) VALUES ("+id+", '"+element.name+"', '"+element.value+"');");
					});
				$.each(element.categories, function (index, element) {
					tx.executeSql("INSERT INTO poi_categories (idpoi, idcategory) VALUES ("+id+", "+element+");");
					});
				});
			window.localStorage.setItem("lastUpdate", data.date);
			downloadImages();
			getCategoriesForHome();
		}
	});
}

// Check DB
//
function checkUpdates(tx) {
	
	imageList = [];
	var lastUpdateDate = window.localStorage.getItem("lastUpdate");
	$.ajax({
		url : 'http://www.nerdforlife.it/iportogruaro/update-device/',
		data: { date: lastUpdateDate },
		cache: false,
		type: 'GET',
		async:   false,
		success : function(data) {
			data = $.parseJSON(data);
			
			if(data.updates == "yes") {
			
			$.each(data.addcat, function(index, element) {
				element.name = escape(element.name);
				tx.executeSql("INSERT INTO category (id, name, parent) VALUES (" + element.cat_id + ",'" + element.name + "', " + element.parent + ");");
				});
			$.each(data.upcat, function(index, element) {
				element.name = escape(element.name);
				tx.executeSql("UPDATE category SET name = '" + element.name + "', parent = " + element.parent + " WHERE id = " + element.cat_id + ";");
				});
			$.each(data.delcat, function(index, element) {
				tx.executeSql("DELETE FROM category WHERE id = " + element.cat_id + ";");
				});
			
			$.each(data.addpoi, function(index, element) {
				element.title = escape(element.title);
				element.description = escape(element.description);
				element.address = escape(element.address);
				element.phone = escape(element.phone);
				element.website = escape(element.website);
				element.mail = escape(element.mail);
				element.sponsored = escape(element.sponsored);
				if(is_empty(element.sponsored)) {
					element.sponsored = 0;
				} else {
					element.sponsored = 1;
				}
				if(element.photo === null || element.photo === '' || typeof element.photo == 'undefined') {
					var filename = "";
					var sPath = "";
				} else {
					var filename = element.poi_id + ".jpg";
					var sPath;
					window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function onFileSystemSuccess(fileSystem) {
						sPath = fileSystem.root.fullPath + '/android/data/com.pitersoft.iportogruaro/';
					});
					var galleryElement = {
							photo: element.photo,
							filename: filename
					}
					imageList.push(galleryElement);
				}
				
				if(element.lat == "") { element.lat = 0; }
				if(element.lon == "") { element.lon = 0; }
				var id = element.poi_id;
				tx.executeSql("INSERT INTO poi (id, name, description, photo, lat, long, address, phone, website, mail) VALUES (" + element.poi_id + ",'" + element.title + "', '" + element.description + "', '"+sPath+filename+"', "+element.lat+", "+element.lon+", '"+element.address+"', '"+element.phone+"', '"+element.website+"', '"+element.mail+"', "+ element.sponsored + ");");
				$.each(element.gallery, function (index, element) {
					if(index > 9) {
						var filename = id + "_" + index + ".jpg";
					} else {
						var filename = id + "_0" + index + ".jpg";
					}
					var sPath;
					window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function onFileSystemSuccess(fileSystem) {
						sPath = fileSystem.root.fullPath + '/android/data/com.pitersoft.iportogruaro/';
					});
					var galleryElement = {
							photo: element,
							filename: filename
					}
					imageList.push(galleryElement);
					tx.executeSql("INSERT INTO poi_gallery (idpoi, url) VALUES ("+id+", '"+sPath+filename+"');");
				});
				$.each(element.others, function (index, element) {
					tx.executeSql("INSERT INTO poi_custom (idpoi, name, value) VALUES ("+id+", '"+element.name+"', '"+element.value+"');");
				});
				$.each(element.categories, function (index, element) {
					tx.executeSql("INSERT INTO poi_categories (idpoi, idcategory) VALUES ("+id+", "+element+");");
				});
			});
			$.each(data.uppoi, function(index, element) {
				element.title = escape(element.title);
				element.description = escape(element.description);
				element.address = escape(element.address);
				element.phone = escape(element.phone);
				element.website = escape(element.website);
				element.mail = escape(element.mail);
				element.sponsored = escape(element.sponsored);
				if(is_empty(element.sponsored)) {
					element.sponsored = 0;
				} else {
					element.sponsored = 1;
				}
				if(element.photo === null || element.photo === '' || typeof element.photo == 'undefined') {
					var filename = "";
					var sPath = "";
				} else {
					var filename = element.poi_id + ".jpg";
					var sPath;
					window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function onFileSystemSuccess(fileSystem) {
						sPath = fileSystem.root.fullPath + '/android/data/com.pitersoft.iportogruaro/';
					});
					var galleryElement = {
							photo: element.photo,
							filename: filename
					}
					imageList.push(galleryElement);
				}
				
				if(element.lat == "") { element.lat = 0; }
				if(element.lon == "") { element.lon = 0; }
				var id = element.poi_id;
				tx.executeSql("UPDATE poi SET name = '" + element.title + "', description = '" + element.description + "', photo = '"+sPath+filename+"', lat = "+element.lat+", long = "+element.lon+", address = '"+element.address+"', phone = '"+element.phone+"', website = '"+element.website+"', mail = '"+element.mail+"', sponsored = "+element.sponsored+" WHERE id = " + element.poi_id + ";");
				tx.executeSql("DELETE FROM poi_gallery WHERE idpoi = "+id+";");
				tx.executeSql("DELETE FROM poi_custom WHERE idpoi = "+id+";");
				tx.executeSql("DELETE FROM poi_categories WHERE idpoi = "+id+";");
				$.each(element.gallery, function (index, element) {
					if(index > 9) {
						var filename = id + "_" + index + ".jpg";
					} else {
						var filename = id + "_0" + index + ".jpg";
					}
					var sPath;
					console.log(filename);
					console.log(sPath);
					console.log(element);
					window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function onFileSystemSuccess(fileSystem) {
						sPath = fileSystem.root.fullPath + '/android/data/com.pitersoft.iportogruaro/';
					});
					var galleryElement = {
							photo: element,
							filename: filename
					}
					imageList.push(galleryElement);
					tx.executeSql("INSERT INTO poi_gallery (idpoi, url) VALUES ("+id+", '"+sPath+filename+"');");
				});
				$.each(element.others, function (index, element) {
					tx.executeSql("INSERT INTO poi_custom (idpoi, name, value) VALUES ("+id+", '"+element.name+"', '"+element.value+"');");
				});
				$.each(element.categories, function (index, element) {
					tx.executeSql("INSERT INTO poi_categories (idpoi, idcategory) VALUES ("+id+", "+element+");");
				});
			});
			$.each(data.delpoi, function(index, element) {
				id = element.poi_id;
				tx.executeSql("DELETE FROM poi WHERE id = "+id+";");
				tx.executeSql("DELETE FROM poi_gallery WHERE idpoi = "+id+";");
				tx.executeSql("DELETE FROM poi_custom WHERE idpoi = "+id+";");
				tx.executeSql("DELETE FROM poi_categories WHERE idpoi = "+id+";");
			});
			
			window.localStorage.setItem("lastUpdate", data.date);
			if(imageList.length > 0) {
				downloadImages();
			}
			}
			getCategoriesForHome();
		}
	});
	return true;
}

// Download image files
//
function remove_file(entry) {
	entry.remove(function() {
		
	}, onFileSystemError);
};

function onFileSystemError() {
	
}
	
function downloadImages() {
	window.location = "#loading_screen";
	$("#total").html(imageList.length);
	var counter = 0;
	$("#counter").html(counter);
	$.each(imageList, function(index, element) {
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function onFileSystemSuccess(fileSystem) {
			var filename = element.filename;
			
			fileSystem.root.getFile(filename, {create: false}, remove_file, onFileSystemError);
			
			var fileTransfer = new FileTransfer();
			fileTransfer.download(encodeURI(element.photo), fileSystem.root.fullPath + '/android/data/com.pitersoft.iportogruaro/' + filename,
					function(theFile) {
					counter++;
					$("#counter").html(counter);
					if(counter == imageList.length) {
						window.location = "#home_screen";
					}
            	},
            	function(error) {
            		console.log("download error source " + error.source);
            		console.log("download error target " + error.target);
            		console.log("upload error code" + error.code);
            	}
			);
		});
	});
}

function fail(evt) {
	//console.log(evt.target.error.code);
	}

// Query the database
//
function categoryQuery(tx) {
	tx.executeSql('SELECT id, name FROM category WHERE parent = ' + currentParentId + ';', [],
			categoryQuerySuccess, errorCB);
}

function getCategoryByIdQuery(tx) {
	tx.executeSql('SELECT id, name, parent FROM category WHERE id = ' + currentCatId + ';', [],
			getCategoryQuerySuccess, errorCB);
}

function getCategoryParentByIdQuery(tx) {
	tx.executeSql('SELECT parent FROM category WHERE id = ' + currentCatId + ';', [],
			getCategoryParentQuerySuccess, errorCB);
}

function getPoiParentByIdQuery(tx) {
	tx.executeSql('SELECT id FROM category WHERE id = ' + currentCatId + ';', [],
			getPoiParentQuerySuccess, errorCB);
}

function homeQuery(tx) {
	tx.executeSql('SELECT id, name FROM category WHERE parent = 0;', [],
			homeQuerySuccess, errorCB);
}

function getPoisQuery(tx) {
	tx.executeSql('SELECT poi.* FROM poi INNER JOIN poi_categories ON poi.id = poi_categories.idpoi WHERE poi_categories.idcategory = ' + currentParentId +';', [],
			getPoisQuerySuccess, errorCB);
}

function poiQuery(tx) {
	tx.executeSql('SELECT * FROM poi WHERE id = '+selectedPoiId+';', [],
			poiQuerySuccess, errorCB);
}

function searchKeyWords(tx) {
	tx.executeSql("SELECT * FROM poi WHERE name LIKE '%"+keyword+"%' OR description LIKE '%"+keyword+"%';", [],
			getSearchKeyWordsQuerySuccess, errorCB);
}

// Query the success callback
//
function homeQuerySuccess(tx, results) {
	// the number of rows returned by the select statement
	$("#home_screen .body .list").html("");
	for (var i=0; i < results.rows.length; i++){
		$("#home_screen .body .list").append('<li><a href="javascript:getCategoriesForParentId('+results.rows.item(i).id+');" data-role="button" data-transition="slide" data-inline="true">'+urldecode(unescape(results.rows.item(i).name))+'</a></li>')
	}
	staticHomeCategories();
	window.location = "#home_screen";
	
	$("#home_screen .body .list").listview("refresh");
}

function categoryQuerySuccess(tx, results) {
	// the number of rows returned by the select statement
	$("#list_screen .body .list").html("");
	for (var i=0; i < results.rows.length; i++){
		$("#list_screen .body .list").append('<li><a href="javascript:getCategoriesForParentId('+results.rows.item(i).id+');" data-transition="slide" data-role="button" >'+urldecode(unescape(results.rows.item(i).name))+'</a></li>');
	}
	
	$("#list_screen .body .list").listview("refresh");
}

function getCategoryQuerySuccess(tx, results) {
	$("#list_screen #category-title").html(unescape(results.rows.item(0).name));
}

function getCategoryParentQuerySuccess(tx, results) {
	if(results.rows.item(0).parent == 0) {
		getCategoriesForHome();
	} else {
		getCategoriesForParentId(results.rows.item(0).parent);
	}
}

function getPoiParentQuerySuccess(tx, results) {
	getCategoriesForParentId(results.rows.item(0).id);
}

function getPoisQuerySuccess(tx, results) {
	
	navigator.geolocation.getCurrentPosition(function (position) {
		myLat = position.coords.latitude;
		myLong = position.coords.longitude;
	},
	function (error) {

	});
	
	//alert("IO:" + myLat + "," + myLong);
		
	pois = [];
	
	for (var i=0; i < results.rows.length; i++){
		
		var lat = results.rows.item(i).lat;
		var long = results.rows.item(i).long;
		
		lat1 = lat;
		lat2 = myLat;
		lon1 = long;
		lon2 = myLong;
		
		lat1 = deg2rad(lat1);
		lon1 = deg2rad(lon1);
		lat2 = deg2rad(lat2);
		lon2 = deg2rad(lon2);
		
		dlat = lat2 - lat1;
		dlon = lon2 - lon1;
		
		R = 6371;
		a  = Math.pow(Math.sin(dlat/2),2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon/2),2);
		c  = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); // great circle distance in radians
		distance = c * R; // great circle distance in km
		distance = round(distance);
		
		pois.push(results.rows.item(i));
		
		pois[i].distance = distance;
		//alert("io:" + myLat + "," + myLong + " il POI: " + lat + "," + long);
		
		//$("#list_screen .body .list").append('<li><a href="javascript:getPoiById('+results.rows.item(i).id+');" data-role="button" ><div class="elem"><div class="title">'+urldecode(unescape(results.rows.item(i).name))+'</div><div class="right">'+ distance +' km</div></div></a></li>');
	}
	
	pois.sort(poiSorter);
	
	for (var i=0; i < pois.length; i++){
		if(pois[i].sponsored == 1) {
			$("#list_screen .body .list").append('<li class="sponsored"><a href="javascript:getPoiById('+pois[i].id+');" data-role="button" ><img src="img/sponsored.png"/><h3>'+urldecode(unescape(pois[i].name))+'</h3><p>'+ pois[i].distance +' km</p></a></li>');
		} else {
			$("#list_screen .body .list").append('<li><a href="javascript:getPoiById('+pois[i].id+');" data-role="button" ><h3>'+urldecode(unescape(pois[i].name))+'</h3><p>'+ pois[i].distance +' km</p></a></li>');
		}
	}
	
	$("#list_screen .body .list").listview("refresh");
	
	if(results.rows.length > 0) {
		$("#pois_map").show();
		poiList = results;
	}
}

function poiSorter(a,b){

	if(a.sponsored == 1) {
		return -1;
	}
	
	if(b.sponsored == 1) {
		return 1;
	}

	return a.distance - b.distance;
}

function getSearchKeyWordsQuerySuccess(tx, results) {
	
	navigator.geolocation.getCurrentPosition(function (position) {
		myLat = position.coords.latitude;
		myLong = position.coords.longitude;
	},
	function (error) {

	});
	
	//alert("IO:" + myLat + "," + myLong);
		
	for (var i=0; i < results.rows.length; i++){
		
		var lat = results.rows.item(i).lat;
		var long = results.rows.item(i).long;
		
		lat1 = lat;
		lat2 = myLat;
		lon1 = long;
		lon2 = myLong;
		
		lat1 = deg2rad(lat1);
		lon1 = deg2rad(lon1);
		lat2 = deg2rad(lat2);
		lon2 = deg2rad(lon2);
		
		dlat = lat2 - lat1;
		dlon = lon2 - lon1;
		
		R = 6371;
		a  = Math.pow(Math.sin(dlat/2),2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon/2),2);
		c  = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); // great circle distance in radians
		distance = c * R; // great circle distance in km
		distance = round(distance);
		
		pois.push(results.rows.item(i));
		
		pois[i].distance = distance;
		//alert("io:" + myLat + "," + myLong + " il POI: " + lat + "," + long);
		
		//$("#search_screen .body .list").append('<li><a href="javascript:getPoiById('+results.rows.item(i).id+');" data-transition="slide" data-role="button" ><div class="elem"><div class="title">'+urldecode(unescape(results.rows.item(i).name))+'</div><div class="right">'+ distance +' km</div></div></a></li>');
	}
	
	pois.sort(poiSorter);
	
	for (var i=0; i < pois.length; i++){
		if(pois[i].sponsored == 1) {
			$("#search_screen .body .list").append('<li><a href="javascript:getPoiById('+pois[i].id+');" data-role="button" ><img src="img/sponsored.png"/><h3>'+urldecode(unescape(pois[i].name))+'</h3><p>'+ pois[i].distance +' km</p></a></li>');
		} else {
			$("#search_screen .body .list").append('<li><a href="javascript:getPoiById('+pois[i].id+');" data-role="button" ><h3>'+urldecode(unescape(pois[i].name))+'</h3><p>'+ pois[i].distance +' km</p></a></li>');
		}
	}
	
	$("#search_screen .body .list").listview("refresh");
	
	if(results.rows.length > 0) {
		$("#pois_map").show();
		poiList = results;
	}
}

//convert degrees to radians
function deg2rad(deg) {
	rad = deg * Math.PI/180; // radians = degrees * pi/180
	return rad;
}

// round to the nearest 1/1000
function round(x) {
	return Math.round( x * 1000) / 1000;
}

function poiQuerySuccess(tx, results) {
	// the number of rows returned by the select statement

	$("#detail_screen #poi-title").html(urldecode(unescape(results.rows.item(0).name)));
	$("#detail_screen .body #title").html(urldecode(unescape(results.rows.item(0).name)));
	if(!is_empty(unescape(results.rows.item(0).photo))) {
		$("#detail_screen .body #photo").html('<img src="'+unescape(results.rows.item(0).photo)+'"/>');
	} else {
		$("#detail_screen .body #photo").html('');
	}
	$("#detail_screen .body #description").html(urldecode(unescape(results.rows.item(0).description)));
	
	var address = urldecode(unescape(results.rows.item(0).address));
	
	if(address.length > 40) {
		address = address.substr(0, 40) + "...";
	}
	var phone = urldecode(results.rows.item(0).phone);
	var website = urldecode(results.rows.item(0).website);
	var mail = urldecode(results.rows.item(0).mail);
	var sponsored = results.rows.item(0).sponsored;
	
	if(!is_empty(address)) {
		$("#detail_screen .body #address").show();
		$("#detail_screen .body #address").html(address);
	} else {
		$("#detail_screen .body #address").hide();
	}

	if(!is_empty(phone)) {
		$("#detail_screen .body #phone").show();
		$("#detail_screen .body #phone").html(phone);
	} else {
		$("#detail_screen .body #phone").hide();
	}
	
	if(!is_empty(website)) {
		$("#detail_screen .body #website").show();
		$("#detail_screen .body #website").html(website);
	} else {
		$("#detail_screen .body #website").hide();
	}
	
	if(!is_empty(mail)) {
		$("#detail_screen .body #mail").show();
		$("#detail_screen .body #mail").html(mail);
	} else {
		$("#detail_screen .body #mail").hide();
	}
	
	currentPoi = results.rows.item(0);
	
	$("#gallery_screen .gallery").html("");
	tx.executeSql("SELECT * FROM poi_gallery WHERE idpoi = " + results.rows.item(0).id, [], function (tx, results) {
		if(results.rows.length == 0) {
			$("#detail_screen #gallery").hide();
		} else {
			for (var i=0; i < results.rows.length; i++) {
				$("#gallery_screen .gallery").append("<div class=\"gallery-item\"><div class=\"gallery-row\"><a href=\"" + results.rows.item(i).url + "\" rel=\"external\"><img width=\"100\" src=\"" + results.rows.item(i).url + "\" /></a></div></div>");
			}
			$("#detail_screen #gallery").show();
        	$("#gallery_screen .gallery a").photoSwipe();
		}
	});
	
	tx.executeSql("SELECT * FROM poi_custom WHERE idpoi = " + results.rows.item(0).id, [], function (tx, results) {
		for (var i=0; i < results.rows.length; i++){
			if(results.rows.item(i).name == "facebook") {
				if(is_empty(results.rows.item(i).value)) {
					nameShare = urldecode(unescape(currentPoi.name));
					descShare = urldecode(unescape(currentPoi.name + ' è su iPortogruaro'));
					linkShare = "http://www.nerdforlife.it/";
					imagShare = "http://www.nerdforlife.it/baseimage.jpg"; 
				} else {
					nameShare = urldecode(unescape(currentPoi.name));
					descShare = urldecode(unescape(currentPoi.name + ' è su iPortogruaro'));
					linkShare = urldecode(unescape(results.rows.item(i).value));
					imagShare = "http://www.nerdforlife.it/baseimage.jpg"; 
				}
				//$("#detail_screen .body #others").append("Share on <a target=\"_blank\" href=\""+facebook_link+"\">Facebook</a>");
			}
			if(results.rows.item(i).value == "twitter") {
				if(is_empty(results.rows.item(i).value)) {
					twitter_link = "";
				} else {
					twitter_link = "";
				}
				//$("#detail_screen .body #others").append("Share on <a href=\""+twitter_link+"\">Twitter</a>");
			}
		}
	},
	errorCB);
	
}

function FBShare(response) {
	if(response != null) {
		if(response.status == "connected") {
			publishStory();
		}
	} else {
		promptLogin(FBShare);
	}
	//promptPermission("email, publish_stream", FBShare);
}

// PhoneGap is ready
//
function onDeviceReady() {
	//check for first execution
	window.localStorage.setItem("runned", "0");
	FB.init({ appId: "531543496877279", nativeInterface: CDV.FB, useCachedDialogs: false });
	FB.getLoginStatus(handleStatusChange);
    
    authUser();
    updateAuthElements();
	document.addEventListener("backbutton", onBackButton, false);
	
	navigator.geolocation.getCurrentPosition(function (position) {
		myLat = position.coords.latitude;
		myLong = position.coords.longitude;
	},
	function (error) {

	});
	
	var dbexists = window.localStorage.getItem("runned");
	if (dbexists == '0' || !dbexists) {
		//create and populate db for first execution
		var networkState = navigator.connection.type;
		if(networkState == Connection.NONE || networkState == Connection.UNKNOWN) {
			alert("Collegarsi a internet per il primo avvio");
			navigator.app.exitApp()
		} else {
			var db = window.openDatabase(databaseAlias, version, databaseName,
				dbSize);
			db.transaction(populateDB, errorCB, successCB);
			//set application for not reset db
		}
	} else {
		//check for updates
		var networkState = navigator.connection.type;
		if(networkState == Connection.NONE || networkState == Connection.UNKNOWN) {
			
		} else {
			var db = window.openDatabase(databaseAlias, version, databaseName,
					dbSize);
				db.transaction(checkUpdates, errorCB, successCB);
		}
	}
}

function staticHomeCategories() {
	$("#home_screen .body .list").append('<li><a href="#news" data-role="button" data-transition="slide" data-inline="true">News</a></li>')
}

function search() {
	keyword = $("#search").val();
	$("#pois_map").hide();
	$("#search_screen .body .list").html("");
	var db = window.openDatabase(databaseAlias, version, databaseName,
			dbSize);
		db.transaction(searchKeyWords, errorCB, successCB);
}

function getCategoriesForHome() {
	
	var db = window.openDatabase(databaseAlias, version, databaseName,
			dbSize);
	$("#map_button").hide();
	db.transaction(homeQuery, errorCB);
	//window.location = "#home_screen";
}

function getCategoriesForParentId(id) {
	currentParentId = id;
	currentCatId = id;
	$("#pois_map").hide();
	var db = window.openDatabase(databaseAlias, version, databaseName,
			dbSize);
	db.transaction(categoryQuery, errorCB);
	db.transaction(getCategoryByIdQuery, errorCB);
	db.transaction(getPoisQuery, errorCB);
	window.location = "#list_screen";
}

function getPoiById(id) {
	selectedPoiId = id;
	var db = window.openDatabase(databaseAlias, version, databaseName,
			dbSize);
	$("#pois_map").hide();
	db.transaction(poiQuery, errorCB);
	window.location = "#detail_screen";
}

function onBackButton(e) {
	if($.mobile.activePage.is('#home_screen')){
        e.preventDefault();
        navigator.app.exitApp();
    } else if($.mobile.activePage.is('#list_screen')) {
    	e.preventDefault();
        back();
    } else if($.mobile.activePage.is('#loading_screen')) {
    	e.preventDefault();
    } else if($.mobile.activePage.is('#detail_screen')) {
    	e.preventDefault();
    	poiBack();
    } else if($.mobile.activePage.is('#map_screen')) {
    	e.preventDefault();
    	mapBack();
    } else if($.mobile.activePage.is('#search_screen')) {
    	e.preventDefault();
    	back();
    } else if($.mobile.activePage.is('#gallery_screen')) {
    	e.preventDefault();
    	history.back();
    }
}

function urldecode(str) {
	return decodeURIComponent((str+'').replace(/\+/g, '%20'));
}

function back() {
	var db = window.openDatabase(databaseAlias, version, databaseName,
			dbSize);
	db.transaction(getCategoryParentByIdQuery, errorCB);
}

function poiBack() {
	var db = window.openDatabase(databaseAlias, version, databaseName,
			dbSize);
	db.transaction(getPoiParentByIdQuery, errorCB);
}

function mapBack() {
	clearOverlays();
	history.back();
}

//Transaction error callback
//
function errorCB(err) {
	console.log("Error processing SQL: " + JSON.stringify(err));
	return false;
}

// Transaction success callback
//
function successCB() {
	window.localStorage.setItem("runned", "1");
}

function navigate(lat, lon) {
	window.location.href = "http://maps.google.com/maps?saddr="+myLat+","+myLong+"&daddr="+lat+","+lon;
	/*var options = {
			origin: new google.maps.LatLng(myLat, myLong),
			destination: new google.maps.LatLng(lat, lon),
			travelMode: google.maps.DirectionsTravelMode.DRIVING
		};
		
	directionsService.route(options, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(response);
        }
      });*/
}

function clearOverlays() {
	  for (var i = 0; i < markersArray.length; i++ ) {
	    markersArray[i].setMap(null);
	  }
	  markersArray = [];
	}

function checkLocation() {
	
	position = new google.maps.LatLng(currentPoi.lat, currentPoi.long);
	
	if(map == null) {
		directionsDisplay = new google.maps.DirectionsRenderer();
		var mapOptions = {
	          zoom: 8,
	          center: position,
	          mapTypeId: google.maps.MapTypeId.ROADMAP,
	          zoomControlOptions: {
	              style: google.maps.ZoomControlStyle.LARGE
	            }
	        };
		map = new google.maps.Map(document.getElementById('map_canvas'),
	            mapOptions);
		directionsDisplay.setMap(map);
	}
	
	var mapBounds = new google.maps.LatLngBounds();
	mapBounds.extend(position);
	//map.fitBounds(mapBounds);
	
	markerOptions = {
			map: map,
			position: position
	}
	
	var name = urldecode(unescape(currentPoi.name));
	var descrizione = urldecode(unescape(currentPoi.description));
	descrizione = descrizione.substring(0, 120) + "...";
	
	var marker = new google.maps.Marker(markerOptions);
	marker.html = name + '<br/>' + descrizione + '<br/><br/><a href="javascript:navigate('+currentPoi.lat+', '+currentPoi.long+')">Ottieni Indicazioni</a>';
	markersArray.push(marker);
    
	var infowindow = new google.maps.InfoWindow({
        content: urldecode(unescape(currentPoi.name))
    });
	
    google.maps.event.addListener(marker, 'click', function () {
    	infowindow.setContent(this.html);
    	infowindow.open(map, this);
    });
    
    center = mapBounds.getCenter();
    map.setCenter(center);
    
    map.setZoom(15);
	
	window.location = "#map_screen";
}

function map_pois() {
	
	position = new google.maps.LatLng(poiList.rows.item(0).lat, poiList.rows.item(0).long);
	
	if(map == null) {
		directionsDisplay = new google.maps.DirectionsRenderer();
		var mapOptions = {
	          zoom: 8,
	          center: position,
	          mapTypeId: google.maps.MapTypeId.ROADMAP,
	          zoomControlOptions: {
	              style: google.maps.ZoomControlStyle.LARGE
	            }
	        };
		map = new google.maps.Map(document.getElementById('map_canvas'),
	            mapOptions);
		directionsDisplay.setMap(map);
	}
	var mapBounds = new google.maps.LatLngBounds();
	
	infowindow = new google.maps.InfoWindow({
		content: "holding..."
	});
	
        for(var i=0; i < poiList.rows.length; i++) {
			if(poiList.rows.item(i).lat != "") {
				var name = urldecode(unescape(poiList.rows.item(i).name));
				var descrizione = urldecode(unescape(poiList.rows.item(i).description));
				descrizione = descrizione.substring(0, 120) + "...";
				
				position = new google.maps.LatLng(poiList.rows.item(i).lat, poiList.rows.item(i).long);
				
				mapBounds.extend(position);
				
				markerOptions = {
						map: map,
						position: position
				}
				
				var marker = new google.maps.Marker(markerOptions);
				marker.html = name + '<br/>' + descrizione + '<br/><br/><a href="javascript:navigate('+poiList.rows.item(i).lat+', '+poiList.rows.item(i).long+')">Ottieni Indicazioni</a>';
				markersArray.push(marker);
				
				google.maps.event.addListener(marker, 'click', function () {
		        	infowindow.setContent(this.html);
		        	infowindow.open(map, this);
				});
				
			}
        }
        
        center = mapBounds.getCenter();
        map.setCenter(center);
        
       	map.setZoom(15);
	
	window.location = "#map_screen";
}

function is_empty(value) {
	if(value === null || value === '' || typeof value == 'undefined' || value == 'undefinedundefined' ) {
		return true;
	} else {
		return false;
	}
}