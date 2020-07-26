const express = require('express')
const session = require('express-session');
const path = require('path');
const PORT = process.env.PORT || 5000

const auth = require('./authentication')

const wordListPath = require('word-list');
const fs = require('fs');
const fetch = require("node-fetch");
const wordArray = fs.readFileSync(wordListPath, 'utf8').split('\n');

// function getRandWords()
// {
// 	var n = Math.floor(Math.random() * Math.floor(wordArray.length - 1))
//     return wordArray[n]
// }


async function getRandomWords(word_count) {
	words = []
	for (let i = 0; i < word_count; i++) {
		var n = Math.floor(Math.random() * Math.floor(wordArray.length - 1));
		random_word = wordArray[n]
		let word_data = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${random_word}`);
		let word_data_json = await word_data.json();

		let word = {word: random_word, link: word_data_json[3][0]}
		
		words.push(word)
	}
	return words;
}

const loadGame = async (request, response) => { // Path: /game/:id

	username = request.session.username; // Grab username from session.
	room_id = request.params.id; // Grab room ID from URL path parameters.
	request.session.currentRoom = room_id;

	try {
		let word_count = 3
		word_array = await getRandomWords(word_count) // get words array
		//response.send(word_array)
		word_object = {word_count: word_count, words: word_array};
	} catch (error) {
		console.log(error);
	}

	// If logged in:
    if (request.session.loggedin) {
		response.render('pages/game', {session: request.session, word_object: word_object}); // Render game EJS template with data from the user's session.
		
    } else {
	//If logged out, redirect back to home with warning alert.
		request.session.alerts = [['Please login before joining!', 'alert-warning', 'exclamation-triangle']]
        response.redirect('/');
    }
}

const initRooms = (roomCount) => {
    var rooms = []
    for (i = 0; i < roomCount; i++) {
        rooms[i] = 'room' + (i+1).toString;
    }
    return rooms;
}

const app = express()
	app.use(session({
		secret: '276isthebest',
		resave: true,
		saveUninitialized: true
	}))
	app.use(express.json())
	app.use(express.urlencoded({extended:false}))
	app.use(express.static(path.join(__dirname, '/public')))
	
	app.set('views', path.join(__dirname, 'views'))
	app.set('view engine', 'ejs')

	// Authentication Routes 
	/* Authenticate User */
	app.post('/login', auth.loginUser)
	/* Signup User */
	app.post('/signup', auth.signupUser)

	// Routes 
	/* Home */
	app.get('/', auth.loadHome)
	/* Game */
	app.get('/game/:id', loadGame)


	// Start Listening 
	const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`))

	// for heroku deployment:
	//const io = require('socket.io')(server);
	// must also change socket.js
	const io = require('socket.io')(3000);


String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}
	  

io.on('connection', (socket) => {
	console.log(`${socket.id} connected.`)

	disconnectMessage = {};


	// Listen for addUserToRoom event from client.
	socket.on('addUserToRoom', ({session}) => {
		
		socket.username = session.username;
		socket.room_id = session.currentRoom;
		

		socket.join(socket.room_id)
		console.log(`${socket.username} (${socket.id}) joined Room ${socket.room_id}`)

		disconnectMessage = {username: socket.username, content: `${socket.username.capitalize()} has left the game!`, style: 'm-red'}

		message = {username: socket.username, content: socket.username.capitalize() + ' has joined the game!', style: 'm-green'}
		socket.emit('welcome-message', message); //To single client
		//Broadcast when a user connects: broadcast all clients except user itself
		socket.broadcast.to(socket.room_id).emit('welcome-message', message);

	});


	socket.on('mouse', (data) => {socket.broadcast.emit('mouse', data)});
	socket.on('clear', () => {socket.broadcast.emit('clear')});
	socket.on('undo', (stack) => {socket.broadcast.emit('undo',stack)});

	// Listen for chatMessage
	socket.on('chatMessage', (msg) => {
		// Send back the message to all Clients
		message = {username: socket.username, content: msg, style: ''}
		io.to(socket.room_id).emit('message', message);
	});
	//Runs when client disconnects
	socket.on('disconnect', ()=> {
		//To everyone included itself
		io.emit('disconnect-message', disconnectMessage);
	});
})

