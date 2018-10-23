var activeRoom;
var previewTracks;
var identity;
var roomName;

var mapOptions = {
    center:new google.maps.LatLng(1.3016514,103.8358701),
    zoom:11,
}

map = new google.maps.Map(document.getElementById('googleMap'), mapOptions);

//var map=new google.maps.Map(document.getElementById("googleMap"),mapProp);
var markers = [];

function setMarkers() {

        console.log("generating points");
        var myLatLng = new google.maps.LatLng(1.3016514,103.8358701);
        var myLatLng2 = new google.maps.LatLng(1.5016514,105.8358701);
        var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            animation: google.maps.Animation.DROP,
        });
        // Push marker to markers array
        var marker = new google.maps.Marker({
            position: myLatLng2,
            map: map,
            animation: google.maps.Animation.DROP,
        });


        markers.push(marker);
}

function reloadMarkers() {

    // Loop through markers and set map to null for each
    for (var i=0; i<markers.length; i++) {

        markers[i].setMap(null);
    }

    // Reset the markers array
    markers = [];

    // Call set markers to re-add markers
    setMarkers();
}



function loadfunctions() {
  startTime();
}

// time function
function startTime() {
    var today=new Date();
    var h=today.getHours();
    var m=today.getMinutes();
    var s=today.getSeconds();
    // add a zero in front of numbers<10
    m=checkTime(m);
    s=checkTime(s);
    //document.getElementById('time').innerHTML=h+":"+m+":"+s;
    t=setTimeout('startTime()',500);
}
function checkTime(i) {
    if (i<10) {
        i="0" + i;
    }
    return i;
}

function attachTracks(tracks, container) {
  tracks.forEach(function(track) {
    container.appendChild(track.attach());
  });
}

function attachParticipantTracks(participant, container) {
  var tracks = Array.from(participant.tracks.values());
  attachTracks(tracks, container);
}

function detachTracks(tracks) {
  tracks.forEach(function(track) {
    track.detach().forEach(function(detachedElement) {
      detachedElement.remove();
    });
  });
}

function detachParticipantTracks(participant) {
  var tracks = Array.from(participant.tracks.values());
  detachTracks(tracks);
}

// Check for WebRTC
if (!navigator.webkitGetUserMedia && !navigator.mozGetUserMedia) {
  alert('WebRTC is not available in your browser.');
}

// When we are about to transition away from this page, disconnect
// from the room, if joined.
window.addEventListener('beforeunload', leaveRoomIfJoined);

$.getJSON('https://weave-sg.herokuapp.com/token/hq', function(data) {
  identity = data.identity;

  // document.getElementById('room-controls').style.display = 'block';

  // Bind button to join room
    // roomName = 'document.getElementById('room-name').value';
    console.log('join room clicked');
    roomName = 'hello';

    var connectOptions = { name: roomName, logLevel: 'debug' };
    if (previewTracks) {
      connectOptions.tracks = previewTracks;
    }

    Twilio.Video.connect(data.token, connectOptions).then(roomJoined, function(error) {
    });
    //
    // if (roomName) {
    //   log("Joining room '" + roomName + "'...");
    //
    //   var connectOptions = { name: roomName, logLevel: 'debug' };
    //   if (previewTracks) {
    //     connectOptions.tracks = previewTracks;
    //   }
    //
    //   Twilio.Video.connect(data.token, connectOptions).then(roomJoined, function(error) {
    //     log('Could not connect to Twilio: ' + error.message);
    //   });
    // } else {
    //   alert('Please enter a room name.');
    // }
});

// Successfully connected!
function roomJoined(room) {
  activeRoom = room;

  //document.getElementById('button-join').style.display = 'none';
  //document.getElementById('button-leave').style.display = 'inline';

  // Draw local video, if not already previewing
  var previewContainer = document.getElementById('local-media');
  if (!previewContainer.querySelector('video')) {
    attachParticipantTracks(room.localParticipant, previewContainer);
  }

  room.participants.forEach(function(participant) {
    var previewContainer = document.getElementById('remote-media');
    if (participant.identity == 'phone') {
      attachParticipantTracks(participant, previewContainer);
    };

  });

  // When a participant joins, draw their video on screen
  room.on('participantConnected', function(participant) {
    //document.getElementById('formtime').value = new Date();
    //document.getElementById('formlocation').value = 'SCDF HQ';
    console.log("participants joined")
    if(participant.identity == 'phone'){
        setMarkers();
        console.log("creating markers");
    }
    //log("Joining: '" + participant.identity + "'");
  });

  room.on('trackAdded', function(track, participant) {
    //log(participant.identity + " added track: " + track.kind);
    var previewContainer = document.getElementById('remote-media');
    if (participant.identity == 'phone') {
      attachTracks([track], previewContainer);
      setMarkers();
      console.log("creating markers2");
    };

  });

  room.on('trackRemoved', function(track, participant) {
    //log(participant.identity + " removed track: " + track.kind);
    detachTracks([track]);
  });

  // When a participant disconnects, note in log
  room.on('participantDisconnected', function(participant) {
    //log("Participant '" + participant.identity + "' left the room");
    detachParticipantTracks(participant);
  });

  // When we are disconnected, stop capturing local video
  // Also remove media for all remote participants
  room.on('disconnected', function() {
    //log('Left');
    detachParticipantTracks(room.localParticipant);
    room.participants.forEach(detachParticipantTracks);
    activeRoom = null;
    //document.getElementById('button-join').style.display = 'inline';
    //document.getElementById('button-leave').style.display = 'none';
  });
}

function leaveRoomIfJoined() {
  if (activeRoom) {
    activeRoom.disconnect();
  }
}

window.addEventListener("load", function () {
  function sendData() {
    api = "https://weave-sg.herokuapp.com/form";

    // collect the form data while iterating over the inputs
    var data = {};
    for (var i = 0, ii = form.length; i < ii; ++i) {
        var input = form[i];
        data[input.name] = input.value;
    }
    console.log(data)
    var xhr = new XMLHttpRequest();
    xhr.open('POST', api);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    // xhr.onreadystatechange = function () {
    //     if (xhr.readyState == 4 && xhr.status == 200) {
    //         alert(xhr.responseText);
    //     }
    // }
    // Define what happens on successful data submission
    xhr.addEventListener("load", function(event) {
      alert('Form data submitted');
    });

    // Define what happens in case of error
    xhr.addEventListener("error", function(event) {
      alert('Oops! Something went wrong.');
    });


    xhr.send(JSON.stringify(data));
  }
})

window.addEventListener("load", function () {
  function sendAED() {
    api_on = "https://weave-sg.herokuapp.com/alarm/on";
    api_off = "https://weave-sg.herokuapp.com/alarm/off";

    // collect the form data while iterating over the inputs
    var data = {};
    for (var i = 0, ii = form.length; i < ii; ++i) {
        var input = form[i];
        data[input.name] = input.value;
    }
    if (data.bool_aedsound == 'Turn off nearest AED'){
      api = api_off
    } else {
      api = api_on
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', api);

    // xhr.onreadystatechange = function () {
    //     if (xhr.readyState == 4 && xhr.status == 200) {
    //         alert(xhr.responseText);
    //     }
    // }
    // Define what happens on successful data submission
    xhr.addEventListener("load", function(event) {
      alert('Action Sent');
    });

    // Define what happens in case of error
    xhr.addEventListener("error", function(event) {
      alert('Oops! Something went wrong.');
    });


    xhr.send();
  }

  // Access the form element...
})
