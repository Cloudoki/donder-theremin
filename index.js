var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var five = require("johnny-five");
var board = new five.Board();
var mode = "synth";

app.use('/', express.static('public'));

board.on("ready", function() {
  var sensor = new five.Sensor("A5");
  sensor.on("change", function() {
    if(mode == "voice") {
      io.emit('new input', this.fscaleTo(-2, 2));
    }
    if(mode == "synth") {
      io.emit('new input', this.fscaleTo(0, 10000));
    }
  });
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('change_mode', function(newMode){
    mode = newMode;
    console.log("new mode", newMode);
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
