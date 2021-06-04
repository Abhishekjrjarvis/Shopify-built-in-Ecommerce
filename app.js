if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const engine = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const cookieParser = require('cookie-parser');
const mongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user');
const farmRoutes = require('./routes/farm');
const productRoutes = require('./routes/product');
const userRoutes = require('./routes/user');
const reviewRoutes = require('./routes/review');
const catchAsync = require('./Utilities/catchAsync');
const FarmError = require('./Utilities/FarmError');

const dbUrl = 'mongodb://localhost:27017/productInfofarm';

mongoose.connect(dbUrl,
    { 
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    })
    .then((data) => {
        console.log('Connected.........');
    }).catch(() => {
        console.log('Something went Wrong......')
    })

// const store = new mongoStore({
//       mongoUrl: dbUrl,
//       touchAfter: 24 * 60 * 60,
// })

const secret = `${process.env.SECRET}` || "adminCredentials";

const sessionConfig = {
    name: 'session',
    // store,
    secret,
    resave: false,
    saveUninitialized: false,
    cookie:{
      httpOnly: true,
      expires: Date.now() + 1000 * 24 * 60 * 60 * 7,
      maxAge: 1000 + 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));

app.use(flash());



app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.locals.moment = require('moment');

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error')
  next();
})





app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, '/public')));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/farms', farmRoutes);
app.use('/products', productRoutes);
app.use('/products/:id/review', reviewRoutes);
app.use('/user', userRoutes);


app.get('/checks', (req, res)=>{
  res.render('check')
})

app.get('/', (req, res)=>{
  req.flash('success', 'welcome');
  res.render('home');
})


app.get('/cart',(req,res) =>{
  res.render('cart')
})

app.get('/checkout',(req, res)=>{
  res.render('payment')
})



app.all('*', (req, res, next) =>{
   return next(new FarmError('Page Not Found', '404'))
})


app.use((err, req, res, next) =>{
    const {status= 500, message='Something Went Wrong'} = err;
    res.status(status).render('error', { err });
})



app.use((req, res, next) => {
  res.locals.message = req.flash("success");
  next();
});


const port = process.env.PORT || 8080

app.listen(port, () => {
  console.log(`Listening On port ${port}`);
});
