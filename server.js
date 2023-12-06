const express=require('express');
const bcrypt=require("bcrypt");
const session=require('express-session');
const MongoStore=require('connect-mongo');
const app= express();
const port=3000;
const mongoose=require("mongoose");

// connect to mongoose

mongoose.connect("mongodb+srv://sneha_gupta:xVc2wf5Taehj5431@cluster0.rjo92kb.mongodb.net/?retryWrites=true&w=majority")
.then(()=>console.log("DB connected"))
.catch(err=>console.log(err.message));

// create a schema for database
const userSchema=new mongoose.Schema({
    username:String,
    fullName:String,
    password:String,
    image:{
        type:String,
        default:"https://cdn.pixabay.com/photo/2023/11/07/10/06/girl-8371776_1280.png",
    },

});



// create model

const User=mongoose.model('User',userSchema);


//view engine setup ejs
app.set("view engine","ejs");


//serving static files 

app.use(express.static(__dirname, + '/public'));



// configure the server to use express session
app.use(session({
    secret:'njnjnjnvjnvjnvjnvj',
    resave:true,
    saveUninitialized:true,
    cookie:{maxAge:6000},
    // storing the session from server into database so that when user logged in again we get the data
    store:new MongoStore({
        mongoUrl:"mongodb+srv://sneha_gupta:xVc2wf5Taehj5431@cluster0.rjo92kb.mongodb.net/?retryWrites=true&w=majority",
        ttl:24*60*60,  // after 1 day session will get expired
    })

}))


//pass json data
app.use(express.json());



//pass form data to configure express to pass the data coming from form frontend
app.use(express.urlencoded({extended:true}));





// COOKIES
//send cookies to client
app.get("/send_cookies",(req,res)=>{
    //send cookies
    // configure cookie to avoid its access from client javascript
    res.cookie("name","sneha",{
        httpOnly:true,
        secure:true,
        // to delete cookie after 7 days
        maxAge:1000*60*60*24*7,   // 7 days


    });
    res.send("Cookie sent");
});


// auth middleware
// creating own middleware
const protected=(req,res,next)=>{
    // if user is not allowed the we display notAllowed page to user
    if(!req.session.loginUser){
      return res.render("notAllowed");
    }
    next();
}















//routes

//home page
app.get("/",(req,res)=>{
    console.log(req.session);
    res.render("index");
});



// logout means deleting session cookies
app.get("/logout",(req,res)=>{
    req.session.destroy();
    res.redirect("/login");
});



// login page
app.get("/login",(req,res)=>{
    res.render("login");
});




// protected route to check if a user is login
app.get("/protected",protected,(req,res)=>{
    // get cookies
    // console.log(req.cookies);
    //if user input their only it means it is logged in
const user=req.cookies.username;

    res.render("protected",{user});
});








// // login logic
// app.post("/login",async (req,res)=>{
//     // get the username and password using req.body
//     let username=req.body.username;
//     let userpassword=req.body.password;
//    // find the user inside mongodb
//    const userFound=await User.findOne({username});
//    const password=await User.findOne({password:userpassword});
//    // check for both login credentials are correct
//    if(!userFound || !password){
//     return res.json({
//         msg:"Invalid login credentials",
//     });
//    }
//    console.log("login success");
// //    res.json({
// //     msg:"Login Successfully",
// //     userFound,
// //    })


// // after successfully login we will directly redirect to the profile page
// res.redirect(`/profile/${userFound._id}`);   // here user id is given as params

// });








// login logic
app.post("/login",async (req,res)=>{
   const {username,password}=req.body;

   const userFound = await User.findOne({ username });
//    const userpassword = await User.findOne({ password});
   console.log(password,userFound.password);
  
   const isPasswordValid=await bcrypt.compare(password,userFound.password);
//    console.log(password,userpassword);

   // 1. check is username exist
  
   if(!userFound || !isPasswordValid){
    return res.json({
        msg:"Invalid login credentials",
    });

}
   // save the login user into session
   req.session.loginUser=userFound;
 
//    if(!isPasswordValid){
//     return res.json({
//         msg:'Invalid login credentials',
//     })
//    }

res.redirect(`/profile/${userFound._id}`);   // here user id is given as params

});






// // logout logic
// app.get('/logout',(req,res)=>{
// // delete cookie when user click on logout button
// res.clearCookie("fullname");
// res.clearCookie("username");
// // after logout/deleting cookies redirect to login page
// res.redirect('/login');

// });













// get register form
app.get("/register", (req, res) => {
    res.render("register");
  })


// register page
app.post("/register",async (req,res)=>{

    const {fullName,username,password}=req.body;
// steps for hashing a password

// 1. create salt
const salt=await bcrypt.genSalt(10);  

// //2. hashed password
const hashedPassword=await bcrypt.hash(password,salt);


   // register user
   const user=await User.create({
    fullName,
    username,
    password:hashedPassword,

   });

   // store username,fullname and password inside the cookies
   res.cookie('username',user.username);
   res.cookie('password',user.password);
   res.cookie('fullName',user.fullName);
res.redirect('/login');



//    .then(user => {
//     res.redirect("/login");
//   })
//   .catch(err => console.log(err));
  
});



//profile page
app.get("/profile/:id",protected,async (req,res)=>{
    // find the user by id
   const user= await User.findById(req.params.id);
    res.render("profile",{user});
});




// listen to port
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});