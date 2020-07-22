// const { Pool } = require('pg'); 
// var pool; 
// var connectionStrings = {dev: 'postgres://postgres:6757@localhost/usr', prod: 'process.env.DATABASE_URL'}
// pool = new Pool ({
// 	connectionString: 'postgres://postgres:6757@localhost/usr'
// });

const Pool = require('pg').Pool
const pool = new Pool({
    user: 'sketchyadmin',
    host: 'localhost',
    database: 'usr',
    password: 'admin'
  })

const loginUser = (request, response) => {
	var username = request.body.uname.trim();
    var password = request.body.pwd.trim(); 
    session = request.session
    
    if (username && password) {
		pool.query('SELECT * FROM users WHERE userName = $1 AND Password = $2', [username, password], (error, result, fields) => {
            if (error) throw error;
			if (!(result.rows.length === 0)) {
				session.loggedin = true;
                session.username = username;
                response.render('pages/home', {alerts: [['Login Successful!', 'alert-success', 'check']], session});
                return false;
			} else {
                response.render('pages/home', {alerts: [['Login Failed', 'alert-failure', 'exclamation-triangle']], session});
                return false;
			}			
			response.end();
		});
	} else {
        response.render('pages/home', {alerts: [['Enter Your Details', 'alert-warning', 'exclamation-triangle']], session});
        return false;
	}
}

const signupUser = (request, response) => {
	var username = request.body.uname.trim();
    var password = request.body.pwd.trim();
    var confirm = request.body.confirmpwd.trim(); 
    session = request.session
    
    if (username && password && confirm && (password === confirm)) {
		pool.query('INSERT into users values ($1, $2, false)', [username, password], (error, result, fields) => {
            if (error) {
                response.render('pages/home', {alerts: [['Signup Failed', 'alert-failure', 'exclamation-triangle']], session});
            } else {
            response.render('pages/home', {alerts: [['Signup Successful!', 'alert-success', 'check']], session});
            return false;
            }
		
			response.end();
		});
	} else {
        response.render('pages/home', {alerts: [['Enter Your Details', 'alert-warning', 'exclamation-triangle']], session});
        return false;
	}
}


const loadHome = (request, response) => {
    session = request.session
    if (request.session.loggedin == true) {
        response.render('pages/home', {alerts: [], session})
    } else {
        response.render('pages/home', {alerts: [], session})
    }
    
}

module.exports = {
    loginUser,
    signupUser,
    loadHome
  }