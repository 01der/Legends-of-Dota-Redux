"use strict";

// Last received message time
var lastMessageTime = 0;
// Last sended message time
var lastSendedMessageTime = 0;
// Send timeout
var sendTimeout = 3;

var channels = { 
	'all': {
		color: 'white',
		name: '#channelAll'
	}, 
	'team': {
		color: '#749ab8',
		name: '#channelTeam'
	}
};

// Current channel params
var currentChannel = 'all';
var color = 'white';

function setChannelStyle( channel ){
	$('#channelName').text = $.Localize(channels[channel].name) + ':';
	$('#channelName').style.color = channels[channel].color;
}

// Add smile
var emotions = {
	':ti4platinum:': 'file://{images}/emoticons/ti4platinum.png', 
	':cool:': 'file://{images}/emoticons/cool.png',
	':sick:': 'file://{images}/emoticons/sick.png',
	':smile:': 'file://{images}/emoticons/smile.png',
	':grave:': 'file://{images}/emoticons/pa_arcana_rose.png'
}

function addEmotion( parent, emotStr ) {
	if (!emotions.hasOwnProperty(emotStr))
		return;

	var emotion = $.CreatePanel('DOTAEmoticon', parent, 'Emoticon1');
	emotion.SetImage(emotions[emotStr]);

	return emotion;
}

// Common say function
function say() {
	var time = Game.Time();
	if (time < lastSendedMessageTime + sendTimeout && lastSendedMessageTime != 0)
		return;

	var msg = $('#chatInput').text.trim();

	var channel = msg.match(/\/[\w]+/g);
	if(channel != null){
		channel = channel[0];
		msg = msg.replace(channel, '');
		channel = channel.substring(1);

		if (channels.hasOwnProperty(channel)){
			currentChannel = channel;
			color = channels[channel].color;
		}
	}

	setChannelStyle(currentChannel);

	if (msg.length > 0) {
		lastSendedMessageTime = time;
		$('#chatInput').text = '';
		GameEvents.SendCustomGameEventToServer( 'custom_chat_say', { channel: currentChannel, msg: msg });
	}
}

// Show received message
function showChatMessage( args ) {
	var time = Game.Time();
	if (time > lastMessageTime + 60 || lastMessageTime == 0) {
     	var timeStamp = $.CreatePanel( "Panel", $('#chatRows'), "" );
		timeStamp.BLoadLayoutSnippet('timeStamp');
		timeStamp.FindChildTraverse('timeStamp').text = args.timeStamp;
	}

	lastMessageTime = time;

	var label = $.CreatePanel('Label', $('#chatRows'), '');
	label.AddClass('chatRow');
	label.html = true;

	var msg = args.msg;

	// Smiles checkimg
	var matches = args.msg.match(/:.+?:/g);
	if (matches){
		matches = matches.filter(function(k){
			return emotions.hasOwnProperty(k);
		});

		$.Each(matches, function(v, k) {
			msg = msg.replace(v, '<img>');
		});
	}

	label.text = '(' + $.Localize(channels[args.channel].name) + ') ' + ' ' + Game.GetPlayerInfo(args.player).player_name + ': ' + msg;
	label.style.color = channels[args.channel].color;

	if (matches)
		for(var i = 0; i < matches.length; i++)
			addEmotion(label.GetChild(i), matches[i]);
}

// Hooks a change event
function addInputChangedEvent(panel, callback) {
    var shouldListen = false;
    var checkRate = 0.01;
    var currentString = panel.text;

    var inputChangedLoop = function() {
        // Check for a change
        if(currentString != panel.text) {
            // Update current string
            currentString = panel.text;

            // Run the callback
            callback(panel, currentString);
        }

        if(shouldListen) {
            $.Schedule(checkRate, inputChangedLoop);
        }
    }

    panel.SetPanelEvent('onfocus', function() {
		$.GetContextPanel().RemoveClass('blur');

        // Enable listening, and monitor the field
        shouldListen = true;
        inputChangedLoop();
    });

    panel.SetPanelEvent('onblur', function() {
		$.GetContextPanel().AddClass('blur');

        // No longer listen
        shouldListen = false;
    });
}

function checkString( panel, str ){
	if (str[0] == '/'){
		$('#channelName').visible = false;
	}
	else {
		$('#channelName').visible = true;
	}
}

(function() {
	GameEvents.Subscribe('custom_chat_send_message', showChatMessage);

	addInputChangedEvent($('#chatInput'), checkString);

	setChannelStyle(currentChannel); 
})();