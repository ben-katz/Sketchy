const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const app = express();
const serv = require('http').Server(app);
const formatMessage = require('./messages.js');
const {userjoin, getCurrentUser} = require('./users.js');

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
// var SOCKET_LIST = {};
// var PLAYER_LIST = {};
//
// var Player = function(id){
//     var self = {
//         x:250,
//         y:250,
//         id:id,
//         number:"" + Math.floor(10 * Math.random()),
//         pressingRight:false,
//         pressingLeft:false,
//         pressingUp:false,
//         pressingDown:false,
//         maxSpd:10,
//     }
//     self.updatePosition = function(){
//         if(self.pressingRight)
//             self.x += self.maxSpd;
//         if(self.pressingLeft)
//             self.x -= self.maxSpd;
//         if(self.pressingUp)
//             self.y -= self.maxSpd;
//         if(self.pressingDown)
//             self.y += self.maxSpd;
//     }
//     return self;
// }

const io = require('socket.io')(3000);
// io.on('connection',(socket)=>{
//   socket.id = Math.random();
//   SOCKET_LIST[socket.id] = socket;
//   var player = Player(socket.id);
//   PLAYER_LIST[socket.id] = player;
//
//   socket.on('disconnect',()=>{
//     delete SOCKET_LIST[socket.id];
//     delete PLAYER_LIST[socket.id];
//   })
//
//   socket.on('keyPress',function(data){
//         if(data.inputId === 'left')
//             player.pressingLeft = data.state;
//         else if(data.inputId === 'right')
//             player.pressingRight = data.state;
//         else if(data.inputId === 'up')
//             player.pressingUp = data.state;
//         else if(data.inputId === 'down')
//             player.pressingDown = data.state;
//     });
// });
// setInterval(()=>{
//   var pack = [];
//   for (var i in PLAYER_LIST) {
//     var player = PLAYER_LIST[i];
//     player.updatePosition();
//     pack.push({
//       x: player.x,
//       y: player.y,
//       number:player.number
//     });
//   }
//   for (var i in SOCKET_LIST){
//     var socket = SOCKET_LIST[i];
//     socket.emit('newPositions',pack);
//   }
//
// },1000/25)

io.on('connection',socket => {
  socket.on('joinRoom',({username,room}) => {
    const user = userjoin(socket.id,username,room)
    socket.join(user.room);

    //To single client
    socket.emit('message',formatMessage('Chat Bot','Welcome to ChatCord!'));

    //Broadcast when a user connects: broadcast all clients except user itself
    socket.broadcast.to(user.room).emit('message',formatMessage('Chat Bot',`${user.username} has joined the chat`));

  });

  // Listen for chatMessage
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    // Send back the message to all Clients
    io.to(user.room).emit('message', formatMessage(user.username,msg));
  });
  //Runs when client disconnects
  socket.on('disconnect', ()=> {
    //To everyone included itself
    io.emit('message',formatMessage('Chat Bot','A user has left the chat'));
  });
})
