function GoogleMap() {

	this.initialize = function() {
		var map = showMap();
	}

	var showMap = function() {
		var mapOptions = {
			zoom : 4,
			center : new google.maps.LatLng(-33, 151),
			mapTypeId : google.maps.MapTypeId.ROADMAP
		}

		var map = new google.maps.Map($("#map"), mapOptions);

		return map;
	}
}

var addMarkersToMap = function(map, lat, lon) {
	var mapBounds = new google.maps.LatLngBounds();
	var latitudeAndLongitudeOne = new google.maps.LatLng(lat,lon);

	var markerOne = new google.maps.Marker({
		position : latitudeAndLongitudeOne,
		map : map
	});

	mapBounds.extend(latitudeAndLongitudeOne);
	map.fitBounds(mapBounds);
}}