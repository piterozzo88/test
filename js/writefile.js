document.addEventListener("deviceready", onDeviceReady, false);

var _fileEntry;
var _connection;
var _json;
// PhoneGap is ready
//

function onDeviceReady() {

	_connection = navigator.network.connection.type;

	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
}

function gotFS(fileSystem) {
	fileSystem.root.getFile("ilocations1.json", {
		create : true
	}, gotFileEntry, fail);
}

function gotFileEntry(fileEntry) {
	_fileEntry = fileEntry;
	fileEntry.file(gotFile, fail);
}

function gotFile(file) {
	if (file.size == 0) {
		if (_connection == Connection.NONE) {
			alert("Per il primo avvio &egrave; necessaria una connessione");
		} else {
			// _fileEntry.createWriter(writeFile, fail);
		}
	} else {
		readAsText(file);
	}
}

function fail(error) {
	console.log(error.code);
}

function writeFile(writer) {
	// get JSON string from an URL
	var json = '{"categories": [{"catid" : "1", "catname" : "ciao"}, {"catid" : "2", "catname" : "ciao2"}, {"catid" : "3", "catname" : "ciao3"}], "pois" : ["poi1", "poi2", "poi3"], "date" : "20-01-2013" }';
	writer.write(json);
}

function readAsText(file) {
	var reader = new FileReader();
	reader.onloadend = function(evt) {
		_json = $.parseJSON(evt.target.result);
		// il file esiste. controlliamo se ci sono aggiornamenti
		if (_connection != Connection.NONE) {
			// se c'è conessione andiamo avanti. altimenti utilizziamo il file
			// vecchio.
			// get JSON updates
			JSONupdates = '{ "updates": "yes", "addcat": [ {"catid" : "4", "catname" : "ciao4"} ], "upcat": [], "delcat": ["2"] }';
			JSONupdates = $.parseJSON(JSONupdates);

			if (JSONupdates.updates == "yes") {
				if (JSONupdates.addcat.length > 0) {
					// aggiungi categorie mancanti
					$.each(JSONupdates.addcat, function(index, element) {
						json.categories.push(element);
					});
				}
				if (JSONupdates.upcat.length > 0) {
					// aggiorna categorie esistenti
					$.each(JSONupdates.delcat, function(index, element) {
						var catIndex = 0;
						var catToDelete = element;
						$.each(json.categories, function(index, element) {
							if (element.catid == catToDelete) {
								catIndex = index;
							}
						});
						// doupdate

					});
				}
				if (JSONupdates.delcat.length > 0) {
					// aggiungi categorie mancanti
					$.each(JSONupdates.delcat, function(index, element) {
						var catIndex = 0;
						var catToDelete = element;
						$.each(json.categories, function(index, element) {

							if (element.catid == catToDelete) {
								catIndex = index;
							}
						});
						json.categories.splice(catIndex, 1);
					});
				}
			}
		}
	};
	reader.readAsText(file);
}