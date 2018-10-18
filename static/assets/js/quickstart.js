var activeRoom;
var previewTracks;
var identity;
var roomName;

function loadfunctions() {
  startTime();
  checkAED();
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
    document.getElementById('time').innerHTML=h+":"+m+":"+s;
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

$.getJSON('https://weave-sg.herokuapp.com/token/operator', function(data) {
  identity = data.identity;

  // document.getElementById('room-controls').style.display = 'block';

  // Bind button to join room
  document.getElementById('button-join').onclick = function () {
    // roomName = 'document.getElementById('room-name').value';
    console.log('join room clicked');
    roomName = 'hello';

    log("Joining room '" + roomName + "'...");

    var connectOptions = { name: roomName, logLevel: 'debug' };
    if (previewTracks) {
      connectOptions.tracks = previewTracks;
    }

    Twilio.Video.connect(data.token, connectOptions).then(roomJoined, function(error) {
      log('Could not connect to Twilio: ' + error.message);
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
  };

  // Bind button to leave room
  document.getElementById('button-leave').onclick = function () {
    log('Leaving room...');
    activeRoom.disconnect();
  };
});

// Successfully connected!
function roomJoined(room) {
  activeRoom = room;

  log("Joined as '" + identity + "'");
  document.getElementById('button-join').style.display = 'none';
  document.getElementById('button-leave').style.display = 'inline';

  // Draw local video, if not already previewing
  var previewContainer = document.getElementById('local-media');
  if (!previewContainer.querySelector('video')) {
    attachParticipantTracks(room.localParticipant, previewContainer);
  }

  room.participants.forEach(function(participant) {
    log("Already in Room: '" + participant.identity + "'");
    var previewContainer = document.getElementById('remote-media');
    if (participant.identity == 'phone') {
      attachParticipantTracks(participant, previewContainer);
    };

  });

  // When a participant joins, draw their video on screen
  room.on('participantConnected', function(participant) {
    log("Joining: '" + participant.identity + "'");
  });

  room.on('trackAdded', function(track, participant) {
    log(participant.identity + " added track: " + track.kind);
    var previewContainer = document.getElementById('remote-media');
    if (participant.identity == 'phone') {
      attachTracks([track], previewContainer);
    };

  });

  room.on('trackRemoved', function(track, participant) {
    log(participant.identity + " removed track: " + track.kind);
    detachTracks([track]);
  });

  // When a participant disconnects, note in log
  room.on('participantDisconnected', function(participant) {
    log("Participant '" + participant.identity + "' left the room");
    detachParticipantTracks(participant);
  });

  // When we are disconnected, stop capturing local video
  // Also remove media for all remote participants
  room.on('disconnected', function() {
    log('Left');
    detachParticipantTracks(room.localParticipant);
    room.participants.forEach(detachParticipantTracks);
    activeRoom = null;
    document.getElementById('button-join').style.display = 'inline';
    document.getElementById('button-leave').style.display = 'none';
  });
}

// Activity log
function log(message) {
  var logDiv = document.getElementById('log');
  logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
  logDiv.scrollTop = logDiv.scrollHeight;
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
  function sendData() {
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
  var form = document.getElementById("aedform");

  // ...and take over its submit event.
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    sendData();
  });
})


// time function
async function checkAED() {
    let alarmResponse = await fetch('https://weave-sg.herokuapp.com/alarm');
    let jsonResponse = await alarmResponse.json();
    if (jsonResponse.switch == 1){
        document.getElementById('aed').value = 'Turn off nearest AED'
    } else {
        document.getElementById('aed').value = 'Turn on nearest AED'
    }
    t=setTimeout('checkAED()',1000);
}