var SerialPort = require('serialport');
var ReadLine = require('@serialport/parser-readline');
var port = new SerialPort('/dev/ttyACM0', {
	baudRate: 9600
});
var parser = port.pipe(new ReadLine({ delimiter: '\r\n'}));
var mqtt = require('mqtt');

var fs = require('fs');


var passWord = {};
var host = '';
var topic = '';
var mqtt_client_username = '';
var mqtt_client_password = ''

// Check whether pwd.json file exists.
// If it doesn't exist, the app makes default pwd.json.

if (!fs.existsSync('pwd.json')) {
	console.log('Cannot find password File!!!');
	passWord = '4902370538830'
	pObject = { 'pwd' : passWord };
	fs.writeFile('pwd.json', JSON.stringify(pObject), (err) => {
		if (err) {
			console.log(err);
		}
	});
}
else {
    passWord = JSON.parse(fs.readFileSync('pwd.json', {encoding: 'utf8'}));
}

// Check whether config.json exists.
// If it doesn't exist, terminates itself.

if (!fs.existsSync('config.json')) {
	console.log('Cannot find config!!');
}
else {
	configObj = JSON.parse(fs.readFileSync'config.json', {encoding: 'utf8'});
	host = configObj['host'];
	topic = configObj['topic'];
	mqtt_client_username = configObj['username'];
	mqtt_client_password = configObj['password'];
}

// Connect to mqtt host
var client = mqtt.connect('mqtt://' + host, {username: mqtt_client_username, password: mqtt_client_password});


// Now the app listens.

//Serial Communication. Receives from Arduino.
parser.on('data', function (data) {
	var strArr = data.split(' ');
	if (strArr[0] === 'pwd') {
		console.log('password : ' + strArr[1]);
		if (strArr[1].replace(/(\n|\r)+$/, '') === passWord) {
			console.log('right');
			port.write('toggle'); //Pi sends toggle-message to Arduino if the password matches.
		}
	}
	else {
		console.log('undefined data : ' + data);
	}
});

//MQTT Connect. If it succeeds to connect, it subscribes the topic defined from config.json
client.on('connect', function() {
    console.debug('connected!!');
    client.subscribe(topic, function(err) {
        if (err) {
            console.log(err)
        }
        else {
            console.log('Subscribed');
        }
    });
});

//MQTT Message. When it receives message from MQTT host, parse the message.

client.on('message', function(tpc, message) {
    msg = message.toString();
    // console.log(msg);
    strArr = msg.split(' ');
    if (strArr[0]==='chpwd') { // If the message is about "Change Password"
        pwd = strArr[1]
        pwdObj = { 'pwd' : pwd };
        fs.writeFile('pwd.json', JSON.stringify(pwdObj), (err) => {
            if (err) {
                console.log(err);
            }
            else {
            	passWord = pwd;
			}
        }); //Write new password to pwd.json
    }
});

